package com.teammatrix.disasterapp;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.os.Handler;
import android.os.Looper;
import android.widget.Toast;
import androidx.core.app.ActivityCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.google.android.gms.nearby.Nearby;
import com.google.android.gms.nearby.connection.*;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(
    name = "MeshNetwork",
    permissions = {
        @Permission(strings = {Manifest.permission.BLUETOOTH_SCAN, Manifest.permission.BLUETOOTH_ADVERTISE, Manifest.permission.BLUETOOTH_CONNECT}, alias = "bluetooth"),
        @Permission(strings = {Manifest.permission.ACCESS_FINE_LOCATION}, alias = "location"),
        @Permission(strings = {Manifest.permission.NEARBY_WIFI_DEVICES}, alias = "wifi")
    }
)
public class MeshPlugin extends Plugin {

    private static final Strategy STRATEGY = Strategy.P2P_CLUSTER;
    private static final String SERVICE_ID = "com.drishti.mesh.v8"; // Force clean cache
    
    private final String myNickname = "RescueNode-" + (int)(Math.random() * 9000 + 1000);
    private final List<String> connectedEndpoints = new ArrayList<>();
    private ConnectionsClient connectionsClient;
    private boolean isMeshRunning = false;

    @Override
    public void load() {
        super.load();
        Activity activity = getActivity();
        if (activity != null) {
            connectionsClient = Nearby.getConnectionsClient(activity);
        } else {
            connectionsClient = Nearby.getConnectionsClient(getContext());
        }
    }

    @PluginMethod
    public void startMesh(PluginCall call) {
        if (!hasPermissions()) {
            call.reject("Permissions missing. Allow Location & Bluetooth.");
            return;
        }

        internalRestartMesh();
        isMeshRunning = true;
        
        JSObject ret = new JSObject();
        ret.put("success", true);
        ret.put("message", "Mesh hardware activated");
        call.resolve(ret);
    }

    @PluginMethod
    public void stopMesh(PluginCall call) {
        stopAll();
        isMeshRunning = false;
        
        JSObject ret = new JSObject();
        ret.put("success", true);
        ret.put("message", "Mesh hardware deactivated");
        call.resolve(ret);
    }

    @PluginMethod
    public void sendMessage(PluginCall call) {
        String payloadStr = call.getString("payload");
        if (payloadStr == null) {
            call.reject("Payload missing");
            return;
        }

        Payload payload = Payload.fromBytes(payloadStr.getBytes(StandardCharsets.UTF_8));
        connectionsClient.sendPayload(connectedEndpoints, payload);
        
        JSObject ret = new JSObject();
        ret.put("success", true);
        ret.put("messageId", "msg-" + System.currentTimeMillis());
        call.resolve(ret);
    }

    @PluginMethod
    public void getPeers(PluginCall call) {
        JSArray peersArray = new JSArray();
        for(String endpoint : connectedEndpoints) {
            JSObject peer = new JSObject();
            peer.put("id", endpoint);
            peer.put("lastSeen", System.currentTimeMillis());
            peersArray.put(peer);
        }
        JSObject ret = new JSObject();
        ret.put("peers", peersArray);
        call.resolve(ret);
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject status = new JSObject();
        status.put("isRunning", isMeshRunning);
        status.put("peerCount", connectedEndpoints.size());
        
        JSObject ret = new JSObject();
        ret.put("status", status);
        call.resolve(ret);
    }

    @PluginMethod
    public void getMessages(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("messages", new JSArray());
        call.resolve(ret);
    }

    private void internalRestartMesh() {
        stopAll();
        getActivity().runOnUiThread(() -> 
            Toast.makeText(getContext(), "Radio Active: " + myNickname, Toast.LENGTH_SHORT).show()
        );
        startAdvertisingProcess();
        new Handler(Looper.getMainLooper()).postDelayed(this::startDiscoveryProcess, 2000);
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
            .setStrategy(STRATEGY).setLowPower(false).build();
        connectionsClient.startAdvertising(myNickname, SERVICE_ID, connectionLifecycleCallback, options)
            .addOnFailureListener(e -> System.err.println("Adv Error: " + e.getMessage()));
    }

    private void startDiscoveryProcess() {
        DiscoveryOptions options = new DiscoveryOptions.Builder()
            .setStrategy(STRATEGY).setLowPower(false).build();
        connectionsClient.startDiscovery(SERVICE_ID, endpointDiscoveryCallback, options)
            .addOnFailureListener(e -> System.err.println("Disc Error: " + e.getMessage()));
    }

    private final ConnectionLifecycleCallback connectionLifecycleCallback = new ConnectionLifecycleCallback() {
        @Override
        public void onConnectionInitiated(String endpointId, ConnectionInfo info) {
            connectionsClient.acceptConnection(endpointId, payloadCallback);
        }

        @Override
        public void onConnectionResult(String endpointId, ConnectionResolution result) {
            if (result.getStatus().isSuccess()) {
                if (!connectedEndpoints.contains(endpointId)) {
                    connectedEndpoints.add(endpointId);
                    JSObject ret = new JSObject();
                    ret.put("peerId", endpointId);
                    notifyListeners("peerDiscovered", ret);
                    getActivity().runOnUiThread(() -> Toast.makeText(getContext(), "Connected: " + endpointId, Toast.LENGTH_SHORT).show());
                }
            }
        }

        @Override
        public void onDisconnected(String endpointId) {
            connectedEndpoints.remove(endpointId);
            JSObject ret = new JSObject();
            ret.put("peerId", endpointId);
            notifyListeners("peerLost", ret);
            getActivity().runOnUiThread(() -> Toast.makeText(getContext(), "Link Lost. Reconnecting...", Toast.LENGTH_SHORT).show());
            internalRestartMesh(); 
        }
    };

    private final PayloadCallback payloadCallback = new PayloadCallback() {
        @Override
        public void onPayloadReceived(String endpointId, Payload payload) {
            if (payload.getType() == Payload.Type.BYTES && payload.asBytes() != null) {
                String msg = new String(payload.asBytes(), StandardCharsets.UTF_8);
                JSObject ret = new JSObject();
                ret.put("sender", endpointId);
                ret.put("payload", msg);
                ret.put("timestamp", System.currentTimeMillis());
                notifyListeners("messageReceived", ret);
            }
        }
        @Override
        public void onPayloadTransferUpdate(String endpointId, PayloadTransferUpdate update) {}
    };

    private final EndpointDiscoveryCallback endpointDiscoveryCallback = new EndpointDiscoveryCallback() {
        @Override
        public void onEndpointFound(String endpointId, DiscoveredEndpointInfo info) {
            connectionsClient.requestConnection(myNickname, endpointId, connectionLifecycleCallback)
                .addOnFailureListener(e -> System.out.println("Collision ignored"));
        }
        @Override
        public void onEndpointLost(String endpointId) {}
    };

    private boolean hasPermissions() {
        String[] perms;
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
             perms = new String[]{ Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.BLUETOOTH_SCAN, Manifest.permission.BLUETOOTH_ADVERTISE, Manifest.permission.BLUETOOTH_CONNECT, Manifest.permission.NEARBY_WIFI_DEVICES };
        } else {
             perms = new String[]{ Manifest.permission.ACCESS_FINE_LOCATION };
        }
        for (String p : perms) {
            if (ActivityCompat.checkSelfPermission(getContext(), p) != PackageManager.PERMISSION_GRANTED) return false;
        }
        return true;
    }
}