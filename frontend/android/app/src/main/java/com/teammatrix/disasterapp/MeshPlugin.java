package com.teammatrix.disasterapp;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Handler;
import android.os.Looper;
import android.widget.Toast; 
import androidx.core.app.ActivityCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.nearby.Nearby;
import com.google.android.gms.nearby.connection.*;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(name = "MeshNetwork")
public class MeshPlugin extends Plugin {

    // ✅ Best Strategy for M-to-N Mesh (Works Offline via Bluetooth/WiFi-Direct)
    private static final Strategy STRATEGY = Strategy.P2P_CLUSTER;
    
    // ✅ New ID to force fresh connections
    private static final String SERVICE_ID = "com.drishti.mesh.v5"; 
    
    private final String myNickname = "RescueNode-" + (int)(Math.random() * 9000 + 1000);
    private final List<String> connectedEndpoints = new ArrayList<>();
    private ConnectionsClient connectionsClient;

    @Override
    public void load() {
        super.load();
        // Use Activity Context to fix NFC crashes (Even if we rely on Bluetooth)
        Activity activity = getActivity();
        if (activity != null) {
            connectionsClient = Nearby.getConnectionsClient(activity);
        } else {
            connectionsClient = Nearby.getConnectionsClient(getContext());
        }
    }

    @PluginMethod
    public void startDiscovery(PluginCall call) {
        if (!hasPermissions()) {
            call.reject("Permissions missing. Please allow Location/Bluetooth.");
            return;
        }

        // 1. Reset Everything (Crucial Step)
        stopAll();

        getActivity().runOnUiThread(() -> 
            Toast.makeText(getContext(), "Radio Active: " + myNickname, Toast.LENGTH_SHORT).show()
        );

        // 2. Start Advertising (I am here!)
        startAdvertisingProcess();

        // 3. ⏳ WAIT 2 SECONDS before Scanning (Crucial Fix)
        // Ek saath scan aur advertise karne se Bluetooth chip atak jati hai.
        new Handler(Looper.getMainLooper()).postDelayed(this::startDiscoveryProcess, 2000);

        call.resolve();
    }

    private void stopAll() {
        if (connectionsClient != null) {
            connectionsClient.stopAdvertising();
            connectionsClient.stopDiscovery();
            connectionsClient.stopAllEndpoints();
            connectedEndpoints.clear();
        }
    }

    private void startAdvertisingProcess() {
        AdvertisingOptions options = new AdvertisingOptions.Builder()
            .setStrategy(STRATEGY)
            .setLowPower(false) // ⚡ HIGH POWER MODE (Better Range)
            .build();
        
        connectionsClient.startAdvertising(myNickname, SERVICE_ID, connectionLifecycleCallback, options)
            .addOnSuccessListener(unused -> System.out.println("✅ Advertising Started"))
            .addOnFailureListener(e -> System.err.println("❌ Adv Error: " + e.getMessage()));
    }

    private void startDiscoveryProcess() {
        DiscoveryOptions options = new DiscoveryOptions.Builder()
            .setStrategy(STRATEGY)
            .setLowPower(false) // ⚡ HIGH POWER MODE
            .build();
        
        connectionsClient.startDiscovery(SERVICE_ID, endpointDiscoveryCallback, options)
            .addOnSuccessListener(unused -> System.out.println("✅ Discovery Started"))
            .addOnFailureListener(e -> System.err.println("❌ Disc Error: " + e.getMessage()));
    }

    @PluginMethod
    public void broadcastMessage(PluginCall call) {
        String msg = call.getString("message");
        if (msg == null) return;

        Payload payload = Payload.fromBytes(msg.getBytes(StandardCharsets.UTF_8));
        connectionsClient.sendPayload(connectedEndpoints, payload);
        call.resolve();
    }

    // --- 🤝 CONNECTION LOGIC ---

    private final ConnectionLifecycleCallback connectionLifecycleCallback = new ConnectionLifecycleCallback() {
        @Override
        public void onConnectionInitiated(String endpointId, ConnectionInfo info) {
            // ⚡ Auto-Accept (No Popups)
            connectionsClient.acceptConnection(endpointId, payloadCallback);
            
            getActivity().runOnUiThread(() -> 
                Toast.makeText(getContext(), "Linking: " + info.getEndpointName(), Toast.LENGTH_SHORT).show()
            );
        }

        @Override
        public void onConnectionResult(String endpointId, ConnectionResolution result) {
            if (result.getStatus().isSuccess()) {
                if (!connectedEndpoints.contains(endpointId)) {
                    connectedEndpoints.add(endpointId);
                    
                    JSObject ret = new JSObject();
                    ret.put("id", endpointId);
                    notifyListeners("onPeerConnected", ret);
                    
                    getActivity().runOnUiThread(() -> 
                        Toast.makeText(getContext(), "✅ Connected!", Toast.LENGTH_SHORT).show()
                    );
                }
            } else {
                // Retry logic
                System.out.println("⚠️ Connection Failed. Retrying...");
                if (connectedEndpoints.isEmpty()) {
                    startDiscoveryProcess();
                }
            }
        }

        @Override
        public void onDisconnected(String endpointId) {
            connectedEndpoints.remove(endpointId);
            getActivity().runOnUiThread(() -> 
                Toast.makeText(getContext(), "❌ Link Lost. Reconnecting...", Toast.LENGTH_SHORT).show()
            );
            // 🔄 Auto-Heal: Restart Mesh
            stopAll();
            startDiscovery(null);
        }
    };

    private final PayloadCallback payloadCallback = new PayloadCallback() {
        @Override
        public void onPayloadReceived(String endpointId, Payload payload) {
            if (payload.getType() == Payload.Type.BYTES && payload.asBytes() != null) {
                String msg = new String(payload.asBytes(), StandardCharsets.UTF_8);
                JSObject ret = new JSObject();
                ret.put("sender", endpointId);
                ret.put("message", msg);
                notifyListeners("onMessageReceived", ret);
            }
        }
        @Override
        public void onPayloadTransferUpdate(String endpointId, PayloadTransferUpdate update) {}
    };

    // --- 🔍 TIE-BREAKER (Prevents "Double Request" Collision) ---
    private final EndpointDiscoveryCallback endpointDiscoveryCallback = new EndpointDiscoveryCallback() {
        @Override
        public void onEndpointFound(String endpointId, DiscoveredEndpointInfo info) {
            String theirNickname = info.getEndpointName();
            
            // Logic: Sirf wo request karega jiska naam Alphabetically Bada hai.
            // Agar dono ek saath request bhejenge toh fail hoga. Isliye ye zaroori hai.
            if (myNickname.compareTo(theirNickname) > 0) {
                System.out.println("⚡ Requesting Connection -> " + theirNickname);
                connectionsClient.requestConnection(myNickname, endpointId, connectionLifecycleCallback);
            } else {
                System.out.println("⏳ Waiting for " + theirNickname + " to request me...");
            }
        }

        @Override
        public void onEndpointLost(String endpointId) {}
    };

    private boolean hasPermissions() {
        String[] perms;
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
             perms = new String[]{
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.BLUETOOTH_SCAN,
                Manifest.permission.BLUETOOTH_ADVERTISE,
                Manifest.permission.BLUETOOTH_CONNECT,
                Manifest.permission.NEARBY_WIFI_DEVICES
            };
        } else {
             perms = new String[]{
                Manifest.permission.ACCESS_FINE_LOCATION
            };
        }

        for (String p : perms) {
            if (ActivityCompat.checkSelfPermission(getContext(), p) != PackageManager.PERMISSION_GRANTED) {
                return false;
            }
        }
        return true;
    }
}