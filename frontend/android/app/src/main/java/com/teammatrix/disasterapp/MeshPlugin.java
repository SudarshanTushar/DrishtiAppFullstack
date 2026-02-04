package com.teammatrix.disasterapp;

import android.Manifest;
import android.content.pm.PackageManager;
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

    // P2P_CLUSTER: Ye Strategy Bluetooth aur Wi-Fi Direct dono use karti hai automatic
    private static final Strategy STRATEGY = Strategy.P2P_CLUSTER;
    private static final String SERVICE_ID = "com.drishti.mesh.final"; 
    
    // "Unit-" prefix rakhna zaroori hai comparison ke liye
    private final String myNickname = "Unit-" + (int)(Math.random() * 9000 + 1000);
    
    private final List<String> connectedEndpoints = new ArrayList<>();
    private ConnectionsClient connectionsClient;

    @Override
    public void load() {
        super.load();
        connectionsClient = Nearby.getConnectionsClient(getContext());
    }

    @PluginMethod
    public void startDiscovery(PluginCall call) {
        if (!hasPermissions()) {
            call.reject("Permissions missing");
            return;
        }

        // Reset Connections
        connectionsClient.stopAdvertising();
        connectionsClient.stopDiscovery();

        // Screen pe naam dikhao taaki pata chale ID kya hai
        getActivity().runOnUiThread(() -> 
            Toast.makeText(getContext(), "My ID: " + myNickname, Toast.LENGTH_LONG).show()
        );

        startAdvertisingProcess();
        startDiscoveryProcess();

        call.resolve();
    }

    private void startAdvertisingProcess() {
        AdvertisingOptions options = new AdvertisingOptions.Builder().setStrategy(STRATEGY).build();
        connectionsClient.startAdvertising(myNickname, SERVICE_ID, connectionLifecycleCallback, options)
            .addOnFailureListener(e -> {
                if (e.getMessage() != null && !e.getMessage().contains("8001")) {
                    System.err.println("Adv Error: " + e.getMessage());
                }
            });
    }

    private void startDiscoveryProcess() {
        DiscoveryOptions options = new DiscoveryOptions.Builder().setStrategy(STRATEGY).build();
        connectionsClient.startDiscovery(SERVICE_ID, endpointDiscoveryCallback, options)
            .addOnFailureListener(e -> {
                if (e.getMessage() != null && !e.getMessage().contains("8002")) {
                    System.err.println("Disc Error: " + e.getMessage());
                }
            });
    }

    @PluginMethod
    public void broadcastMessage(PluginCall call) {
        String msg = call.getString("message");
        if (msg == null) return;

        Payload payload = Payload.fromBytes(msg.getBytes(StandardCharsets.UTF_8));
        connectionsClient.sendPayload(connectedEndpoints, payload);
        call.resolve();
    }

    // --- CONNECTION HANDLERS ---

    private final ConnectionLifecycleCallback connectionLifecycleCallback = new ConnectionLifecycleCallback() {
        @Override
        public void onConnectionInitiated(String endpointId, ConnectionInfo info) {
            // Jaise hi koi mile, turant HAAN kar do (Bluetooth timeout se bachne ke liye)
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
                    
                    // Frontend ko batao
                    JSObject ret = new JSObject();
                    ret.put("id", endpointId);
                    notifyListeners("onPeerConnected", ret);
                    
                    getActivity().runOnUiThread(() -> 
                        Toast.makeText(getContext(), "✅ Connected (Offline)", Toast.LENGTH_SHORT).show()
                    );
                }
            }
        }

        @Override
        public void onDisconnected(String endpointId) {
            connectedEndpoints.remove(endpointId);
            getActivity().runOnUiThread(() -> 
                Toast.makeText(getContext(), "❌ Disconnected", Toast.LENGTH_SHORT).show()
            );
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

    // 👇 SABSE ZAROORI FIX: TIE-BREAKER LOGIC
    // Ye Bluetooth Collision ko rokta hai
    private final EndpointDiscoveryCallback endpointDiscoveryCallback = new EndpointDiscoveryCallback() {
        @Override
        public void onEndpointFound(String endpointId, DiscoveredEndpointInfo info) {
            String theirNickname = info.getEndpointName();
            
            // LOGIC: Sirf tab Request bhejo jab Mera Naam > Unka Naam
            // Agar mera naam chhota hai, toh main chup-chap wait karunga unki request ka.
            if (myNickname.compareTo(theirNickname) > 0) {
                getActivity().runOnUiThread(() -> 
                    Toast.makeText(getContext(), "Requesting -> " + theirNickname, Toast.LENGTH_SHORT).show()
                );
                connectionsClient.requestConnection(myNickname, endpointId, connectionLifecycleCallback);
            } else {
                System.out.println("Waiting for " + theirNickname + " to request me (Avoiding Collision)");
            }
        }

        @Override
        public void onEndpointLost(String endpointId) {}
    };

    private boolean hasPermissions() {
        // ... (Permission code same as before, no change needed here) ...
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
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
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