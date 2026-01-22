package com.drishti.mesh;

import android.app.Service;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.bluetooth.le.AdvertiseCallback;
import android.bluetooth.le.AdvertiseData;
import android.bluetooth.le.AdvertiseSettings;
import android.bluetooth.le.BluetoothLeAdvertiser;
import android.bluetooth.le.BluetoothLeScanner;
import android.bluetooth.le.ScanCallback;
import android.bluetooth.le.ScanFilter;
import android.bluetooth.le.ScanResult;
import android.bluetooth.le.ScanSettings;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.wifi.p2p.WifiP2pConfig;
import android.net.wifi.p2p.WifiP2pDevice;
import android.net.wifi.p2p.WifiP2pDeviceList;
import android.net.wifi.p2p.WifiP2pInfo;
import android.net.wifi.p2p.WifiP2pManager;
import android.os.Binder;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.ParcelUuid;
import android.util.Log;
import androidx.core.app.NotificationCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MeshService extends Service {
    private static final String TAG = "MeshService";
    private static final int MESH_PORT = 8888;
    private static final UUID SERVICE_UUID = UUID.fromString("00001234-0000-1000-8000-00805f9b34fb");
    private static final int MAX_PAYLOAD_BYTES = 4096; // guard memory/radio usage
    private static final int MAX_SEND_BATCH = 200; // cap per-connection send
    private static final long BLE_SCAN_WINDOW_MS = 15000; // scan on window
    private static final long BLE_SCAN_INTERVAL_MS = 45000; // cycle period (on + off)
    private static final int FOREGROUND_ID = 1042;
    private static final String CHANNEL_ID = "mesh_foreground";
    
    
    private final IBinder binder = new LocalBinder();
    private DTNDatabase database;
    private MessageListener messageListener;
    
    // BLE components
    private BluetoothAdapter bluetoothAdapter;
    private BluetoothLeAdvertiser advertiser;
    private BluetoothLeScanner scanner;
    private Handler scanHandler;
    private Runnable scanRunnable;
    private Runnable scanCycleRunnable;
    
    // Wi-Fi Direct components
    private WifiP2pManager wifiP2pManager;
    private WifiP2pManager.Channel wifiChannel;
    private BroadcastReceiver wifiReceiver;
    private Handler wifiHandler;
    private Runnable wifiDiscoverRunnable;
    private static final long BASE_DISCOVER_INTERVAL_MS = 60000; // 1 minute
    private static final long MAX_DISCOVER_INTERVAL_MS = 300000; // 5 minutes
    private long currentDiscoverIntervalMs = BASE_DISCOVER_INTERVAL_MS;
    private boolean isGroupOwner = false;
    private ServerSocket serverSocket;
    private boolean foregroundEnabled = false;
    
    // Peer management
    private Map<String, WifiP2pDevice> discoveredPeers = new ConcurrentHashMap<>();
    private Map<String, Long> peerLastSeen = new ConcurrentHashMap<>();
    private ExecutorService executorService;

    private boolean isRunning = false;

    public class LocalBinder extends Binder {
        MeshService getService() {
            return MeshService.this;
        }
    }

    public interface MessageListener {
        void onMessageReceived(DTNMessage message);
        void onPeerDiscovered(String peerId);
        void onPeerLost(String peerId);
    }

    @Override
    public void onCreate() {
        super.onCreate();
        database = new DTNDatabase(this);
        executorService = Executors.newCachedThreadPool();
        scanHandler = new Handler(Looper.getMainLooper());

        BluetoothManager bluetoothManager = (BluetoothManager) getSystemService(Context.BLUETOOTH_SERVICE);
        bluetoothAdapter = bluetoothManager.getAdapter();

        wifiP2pManager = (WifiP2pManager) getSystemService(Context.WIFI_P2P_SERVICE);
        wifiChannel = wifiP2pManager.initialize(this, getMainLooper(), null);

        Log.d(TAG, "MeshService created");
    }

    @Override
    public IBinder onBind(Intent intent) {
        return binder;
    }

    public void setMessageListener(MessageListener listener) {
        this.messageListener = listener;
    }

    public void enableForeground(boolean enable) {
        if (enable) {
            startForegroundInternal();
        } else {
            if (foregroundEnabled) {
                stopForeground(true);
                foregroundEnabled = false;
            }
        }
    }

    private void startForegroundInternal() {
        if (foregroundEnabled) {
            return;
        }
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) {
            Log.w(TAG, "NotificationManager unavailable; cannot start foreground");
            return;
        }

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Mesh Network",
                NotificationManager.IMPORTANCE_LOW
            );
            manager.createNotificationChannel(channel);
        }

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Mesh active")
            .setContentText("Device relaying messages")
            .setSmallIcon(android.R.drawable.stat_sys_data_bluetooth)
            .setOngoing(true)
            .build();

        try {
            startForeground(FOREGROUND_ID, notification);
            foregroundEnabled = true;
            Log.d(TAG, "Foreground service started");
        } catch (Exception e) {
            Log.e(TAG, "Failed to start foreground", e);
        }
    }

    public synchronized boolean startMesh() {
        if (isRunning) {
            Log.d(TAG, "Mesh already running");
            return true;
        }

        if (!hasRadioPrerequisites()) {
            Log.w(TAG, "Mesh start aborted: radio prerequisites not met");
            return false;
        }

        startMeshInternal();
        return true;
    }

    private void startMeshInternal() {
        isRunning = true;

        Log.d(TAG, "Starting mesh network");

        startBLEAdvertising();
        startBLEScanning();

        startWifiP2pDiscovery();
        startServerSocket();

        // Periodic cleanup
        scanHandler.postDelayed(new Runnable() {
            @Override
            public void run() {
                if (isRunning) {
                    cleanupStaleConnections();
                    database.deleteExpiredMessages();
                    scanHandler.postDelayed(this, 60000); // Every minute
                }
            }
        }, 60000);
    }

    public synchronized void stopMesh() {
        if (!isRunning) {
            Log.d(TAG, "Mesh already stopped");
            return;
        }

        isRunning = false;

        if (foregroundEnabled) {
            stopForeground(true);
            foregroundEnabled = false;
        }

        Log.d(TAG, "Stopping mesh network");

        stopBLEAdvertising();
        stopBLEScanning();
        stopWifiP2pDiscovery();

        if (serverSocket != null && !serverSocket.isClosed()) {
            try {
                serverSocket.close();
            } catch (Exception e) {
                Log.e(TAG, "Error closing server socket", e);
            }
        }

        scanHandler.removeCallbacksAndMessages(null);
    }

    private boolean hasRadioPrerequisites() {
        try {
            boolean bluetoothOk = bluetoothAdapter != null && bluetoothAdapter.isEnabled();
            boolean wifiOk = wifiP2pManager != null && wifiChannel != null;
            return bluetoothOk && wifiOk;
        } catch (Exception e) {
            Log.e(TAG, "Prerequisite check failed", e);
            return false;
        }
    }

    // ==================== BLE DISCOVERY ====================
    
    private void startBLEAdvertising() {
        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled()) {
            Log.e(TAG, "Bluetooth not available or disabled");
            return;
        }

        try {
            advertiser = bluetoothAdapter.getBluetoothLeAdvertiser();
            if (advertiser == null) {
                Log.e(TAG, "BLE Advertiser not available");
                return;
            }

            AdvertiseSettings settings = new AdvertiseSettings.Builder()
                .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_POWER)
                .setConnectable(false)
                .setTimeout(0)
                .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_MEDIUM)
                .build();

            AdvertiseData data = new AdvertiseData.Builder()
                .setIncludeDeviceName(true)
                .addServiceUuid(new ParcelUuid(SERVICE_UUID))
                .build();

            advertiser.startAdvertising(settings, data, advertiseCallback);
            Log.d(TAG, "BLE advertising started");
        } catch (SecurityException e) {
            Log.e(TAG, "Permission denied for BLE advertising", e);
        }
    }

    private void stopBLEAdvertising() {
        if (advertiser != null) {
            try {
                advertiser.stopAdvertising(advertiseCallback);
                Log.d(TAG, "BLE advertising stopped");
            } catch (Exception e) {
                Log.e(TAG, "Error stopping advertising", e);
            }
        }
    }

    private final AdvertiseCallback advertiseCallback = new AdvertiseCallback() {
        @Override
        public void onStartSuccess(AdvertiseSettings settingsInEffect) {
            Log.d(TAG, "BLE Advertising started successfully");
        }

        @Override
        public void onStartFailure(int errorCode) {
            Log.e(TAG, "BLE Advertising failed: " + errorCode);
        }
    };

    private void startBLEScanning() {
        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled()) {
            return;
        }

        try {
            scanner = bluetoothAdapter.getBluetoothLeScanner();
            if (scanner == null) {
                Log.e(TAG, "BLE Scanner not available");
                return;
            }

            final List<ScanFilter> filters = new ArrayList<>();
            ScanFilter filter = new ScanFilter.Builder()
                .setServiceUuid(new ParcelUuid(SERVICE_UUID))
                .build();
            filters.add(filter);

            final ScanSettings settings = new ScanSettings.Builder()
                .setScanMode(ScanSettings.SCAN_MODE_LOW_POWER)
                .build();

            if (scanCycleRunnable != null && scanHandler != null) {
                scanHandler.removeCallbacks(scanCycleRunnable);
            }

            scanCycleRunnable = new Runnable() {
                @Override
                public void run() {
                    if (!isRunning) {
                        return;
                    }
                    try {
                        scanner.startScan(filters, settings, scanCallback);
                        Log.d(TAG, "BLE scan window started");
                    } catch (SecurityException e) {
                        Log.e(TAG, "Permission denied for BLE scanning", e);
                        return;
                    } catch (Exception e) {
                        Log.e(TAG, "BLE scan start error", e);
                        return;
                    }

                    // Stop scan after window
                    scanHandler.postDelayed(() -> {
                        try {
                            scanner.stopScan(scanCallback);
                            Log.d(TAG, "BLE scan window stopped");
                        } catch (Exception e) {
                            Log.e(TAG, "Error stopping scan window", e);
                        }
                    }, BLE_SCAN_WINDOW_MS);

                    // Schedule next cycle
                    scanHandler.postDelayed(this, BLE_SCAN_INTERVAL_MS);
                }
            };

            scanHandler.post(scanCycleRunnable);
        } catch (SecurityException e) {
            Log.e(TAG, "Permission denied for BLE scanning", e);
        }
    }

    private void stopBLEScanning() {
        if (scanner != null) {
            try {
                scanner.stopScan(scanCallback);
                Log.d(TAG, "BLE scanning stopped");
            } catch (Exception e) {
                Log.e(TAG, "Error stopping scan", e);
            }
        }

        if (scanHandler != null && scanCycleRunnable != null) {
            scanHandler.removeCallbacks(scanCycleRunnable);
            scanCycleRunnable = null;
        }
    }

    private final ScanCallback scanCallback = new ScanCallback() {
        @Override
        public void onScanResult(int callbackType, ScanResult result) {
            try {
                BluetoothDevice device = result.getDevice();
                String deviceAddress = device.getAddress();
                
                Log.d(TAG, "BLE device discovered: " + deviceAddress);
                
                // Update last seen time
                peerLastSeen.put(deviceAddress, System.currentTimeMillis());
                
                // Trigger Wi-Fi Direct connection
                connectToPeerViaWifiDirect(deviceAddress);
                
                if (messageListener != null) {
                    messageListener.onPeerDiscovered(deviceAddress);
                }
            } catch (SecurityException e) {
                Log.e(TAG, "Permission denied in scan callback", e);
            }
        }

        @Override
        public void onScanFailed(int errorCode) {
            Log.e(TAG, "BLE Scan failed: " + errorCode);
        }
    };

    // ==================== WI-FI DIRECT ====================
    
    private void startWifiP2pDiscovery() {
        try {
            IntentFilter filter = new IntentFilter();
            filter.addAction(WifiP2pManager.WIFI_P2P_STATE_CHANGED_ACTION);
            filter.addAction(WifiP2pManager.WIFI_P2P_PEERS_CHANGED_ACTION);
            filter.addAction(WifiP2pManager.WIFI_P2P_CONNECTION_CHANGED_ACTION);
            
            wifiReceiver = new WifiDirectReceiver();
            registerReceiver(wifiReceiver, filter);

            wifiHandler = new Handler(Looper.getMainLooper());
            currentDiscoverIntervalMs = BASE_DISCOVER_INTERVAL_MS;
            wifiDiscoverRunnable = new Runnable() {
                @Override
                public void run() {
                    if (!isRunning) {
                        return;
                    }
                    try {
                        wifiP2pManager.discoverPeers(wifiChannel, new WifiP2pManager.ActionListener() {
                            @Override
                            public void onSuccess() {
                                Log.d(TAG, "Wi-Fi P2P discovery started");
                                currentDiscoverIntervalMs = BASE_DISCOVER_INTERVAL_MS; // reset backoff
                            }

                            @Override
                            public void onFailure(int reason) {
                                Log.e(TAG, "Wi-Fi P2P discovery failed: " + reason);
                                currentDiscoverIntervalMs = Math.min(currentDiscoverIntervalMs * 2, MAX_DISCOVER_INTERVAL_MS);
                            }
                        });
                    } catch (SecurityException e) {
                        Log.e(TAG, "Permission denied for Wi-Fi P2P", e);
                        return;
                    }

                    if (wifiHandler != null) {
                        wifiHandler.postDelayed(this, currentDiscoverIntervalMs);
                    }
                }
            };

            wifiHandler.post(wifiDiscoverRunnable);
        } catch (SecurityException e) {
            Log.e(TAG, "Permission denied for Wi-Fi P2P", e);
        }
    }

    private void stopWifiP2pDiscovery() {
        if (wifiReceiver != null) {
            try {
                unregisterReceiver(wifiReceiver);
                wifiReceiver = null;
            } catch (Exception e) {
                Log.e(TAG, "Error unregistering receiver", e);
            }
        }

        if (wifiHandler != null && wifiDiscoverRunnable != null) {
            wifiHandler.removeCallbacks(wifiDiscoverRunnable);
        }
    }

    private void connectToPeerViaWifiDirect(String peerId) {
        WifiP2pDevice device = discoveredPeers.get(peerId);
        if (device == null) return;

        WifiP2pConfig config = new WifiP2pConfig();
        config.deviceAddress = device.deviceAddress;

        try {
            wifiP2pManager.connect(wifiChannel, config, new WifiP2pManager.ActionListener() {
                @Override
                public void onSuccess() {
                    Log.d(TAG, "Wi-Fi Direct connection initiated");
                }

                @Override
                public void onFailure(int reason) {
                    Log.e(TAG, "Wi-Fi Direct connection failed: " + reason);
                }
            });
        } catch (SecurityException e) {
            Log.e(TAG, "Permission denied for Wi-Fi connect", e);
        }
    }

    private class WifiDirectReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            
            if (WifiP2pManager.WIFI_P2P_PEERS_CHANGED_ACTION.equals(action)) {
                try {
                    wifiP2pManager.requestPeers(wifiChannel, new WifiP2pManager.PeerListListener() {
                        @Override
                        public void onPeersAvailable(WifiP2pDeviceList peerList) {
                            for (WifiP2pDevice device : peerList.getDeviceList()) {
                                String deviceId = device.deviceAddress;
                                discoveredPeers.put(deviceId, device);
                                peerLastSeen.put(deviceId, System.currentTimeMillis());
                                
                                Log.d(TAG, "Wi-Fi P2P peer available: " + deviceId);
                            }
                        }
                    });
                } catch (SecurityException e) {
                    Log.e(TAG, "Permission denied requesting peers", e);
                }
            } else if (WifiP2pManager.WIFI_P2P_CONNECTION_CHANGED_ACTION.equals(action)) {
                try {
                    wifiP2pManager.requestConnectionInfo(wifiChannel, new WifiP2pManager.ConnectionInfoListener() {
                        @Override
                        public void onConnectionInfoAvailable(WifiP2pInfo info) {
                            if (info.groupFormed) {
                                isGroupOwner = info.isGroupOwner;
                                String hostAddress = info.groupOwnerAddress.getHostAddress();
                                
                                Log.d(TAG, "Wi-Fi Direct group formed. Group owner: " + isGroupOwner);
                                
                                if (!isGroupOwner) {
                                    // Client connects to group owner
                                    connectToServer(hostAddress);
                                }
                            }
                        }
                    });
                } catch (SecurityException e) {
                    Log.e(TAG, "Permission denied requesting connection info", e);
                }
            }
        }
    }

    // ==================== SOCKET COMMUNICATION ====================
    
    private void startServerSocket() {
        executorService.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    serverSocket = new ServerSocket(MESH_PORT);
                    Log.d(TAG, "Server socket started on port " + MESH_PORT);
                    
                    while (isRunning && !serverSocket.isClosed()) {
                        Socket clientSocket = serverSocket.accept();
                        Log.d(TAG, "Client connected: " + clientSocket.getInetAddress());
                        handleClient(clientSocket);
                    }
                } catch (Exception e) {
                    if (isRunning) {
                        Log.e(TAG, "Server socket error", e);
                    }
                }
            }
        });
    }

    private void connectToServer(String hostAddress) {
        executorService.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    Socket socket = new Socket();
                    socket.connect(new InetSocketAddress(hostAddress, MESH_PORT), 5000);
                    Log.d(TAG, "Connected to server: " + hostAddress);
                    
                    syncMessages(socket);
                    socket.close();
                } catch (Exception e) {
                    Log.e(TAG, "Error connecting to server", e);
                }
            }
        });
    }

    private void handleClient(Socket socket) {
        executorService.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    syncMessages(socket);
                    socket.close();
                } catch (Exception e) {
                    Log.e(TAG, "Error handling client", e);
                }
            }
        });
    }

    private void syncMessages(Socket socket) {
        try {
            BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(socket.getOutputStream(), StandardCharsets.UTF_8));
            BufferedReader reader = new BufferedReader(new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8));

            // Send our pending messages
            List<DTNMessage> pendingMessages = database.getPendingMessages();
            JSONArray messagesToSend = new JSONArray();
            int sentCount = 0;

            for (DTNMessage msg : pendingMessages) {
                if (sentCount >= MAX_SEND_BATCH) {
                    break;
                }

                if (!msg.isExpired() && !isOversized(msg.payload)) {
                    messagesToSend.put(msg.toJSON());
                    sentCount++;
                }
            }
            
            writer.write(messagesToSend.toString());
            writer.newLine();
            writer.flush();
            
            Log.d(TAG, "Sent " + messagesToSend.length() + " messages");

            // Receive messages from peer
            String receivedData = reader.readLine();
            if (receivedData != null) {
                JSONArray receivedMessages = new JSONArray(receivedData);
                
                for (int i = 0; i < receivedMessages.length(); i++) {
                    JSONObject msgObj = receivedMessages.getJSONObject(i);
                    DTNMessage receivedMsg = DTNMessage.fromJSON(msgObj);
                    
                    if (receivedMsg != null && !receivedMsg.isExpired() && !isOversized(receivedMsg.payload)) {
                        // Increment hop count
                        DTNMessage forwarded = receivedMsg.incrementHop();
                        
                        // Store if new
                        if (database.insertMessage(forwarded)) {
                            Log.d(TAG, "Received new message: " + forwarded.id);
                            
                            if (messageListener != null) {
                                messageListener.onMessageReceived(forwarded);
                            }
                        }
                    }
                }
                
                Log.d(TAG, "Received " + receivedMessages.length() + " messages");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error syncing messages", e);
        }
    }

    // ==================== PUBLIC API ====================
    
    public void sendMessage(DTNMessage message) {
        if (isOversized(message.payload)) {
            Log.w(TAG, "Dropping oversized message: " + message.id);
            return;
        }

        database.insertMessage(message);
        Log.d(TAG, "Message queued: " + message.id);
        
        // Try to send immediately to connected peers
        executorService.execute(() -> {
            for (String peerId : discoveredPeers.keySet()) {
                // In real implementation, send to each connected peer
            }
        });
    }

    public JSONArray getConnectedPeers() {
        JSONArray peers = new JSONArray();
        long now = System.currentTimeMillis();
        
        for (Map.Entry<String, Long> entry : peerLastSeen.entrySet()) {
            if (now - entry.getValue() < 30000) { // Active in last 30 seconds
                try {
                    JSONObject peer = new JSONObject();
                    peer.put("id", entry.getKey());
                    peer.put("lastSeen", entry.getValue());
                    peers.put(peer);
                } catch (Exception e) {
                    Log.e(TAG, "Error creating peer JSON", e);
                }
            }
        }
        
        return peers;
    }

    public JSONArray getStoredMessages() {
        return database.getMessagesAsJSON(100);
    }

    public JSONObject getStatus() {
        JSONObject status = new JSONObject();
        try {
            status.put("isRunning", isRunning);
            status.put("peerCount", discoveredPeers.size());
            status.put("pendingMessages", database.countMessages());
            status.put("currentDiscoverIntervalMs", currentDiscoverIntervalMs);
        } catch (Exception e) {
            Log.e(TAG, "Error building status JSON", e);
        }
        return status;
    }

    private boolean isOversized(String payload) {
        if (payload == null) {
            return false;
        }
        try {
            return payload.getBytes(StandardCharsets.UTF_8).length > MAX_PAYLOAD_BYTES;
        } catch (Exception e) {
            Log.e(TAG, "Payload size check failed", e);
            return true;
        }
    }

    private void cleanupStaleConnections() {
        long now = System.currentTimeMillis();
        List<String> toRemove = new ArrayList<>();
        
        for (Map.Entry<String, Long> entry : peerLastSeen.entrySet()) {
            if (now - entry.getValue() > 60000) { // Not seen in 60 seconds
                toRemove.add(entry.getKey());
            }
        }
        
        for (String peerId : toRemove) {
            peerLastSeen.remove(peerId);
            discoveredPeers.remove(peerId);
            
            if (messageListener != null) {
                messageListener.onPeerLost(peerId);
            }
        }
    }

    @Override
    public void onDestroy() {
        stopMesh();
        executorService.shutdown();
        super.onDestroy();
        Log.d(TAG, "MeshService destroyed");
    }
}
