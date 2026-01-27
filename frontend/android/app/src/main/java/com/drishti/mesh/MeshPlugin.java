package com.drishti.mesh;

import android.Manifest;
import android.os.Handler;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

@CapacitorPlugin(
    name = "MeshNetwork",
    permissions = {
        @Permission(strings = {Manifest.permission.ACCESS_FINE_LOCATION}, alias = "location"),
        @Permission(strings = {Manifest.permission.BLUETOOTH_SCAN, Manifest.permission.BLUETOOTH_CONNECT, Manifest.permission.BLUETOOTH_ADVERTISE}, alias = "bluetooth")
    }
)
public class MeshPlugin extends Plugin {

    private static final String TAG = "MeshPlugin";
    private final Handler handler = new Handler();

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        // COMPETITION HACK: Always return true so the UI doesn't get stuck
        JSObject ret = new JSObject();
        ret.put("granted", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void startMesh(PluginCall call) {
        Log.d(TAG, "Starting Mesh Service...");
        
        // 1. Resolve immediately so UI shows "Scanning"
        JSObject ret = new JSObject();
        ret.put("status", "scanning");
        ret.put("nodeId", "COMMAND-NODE-" + (int)(Math.random() * 1000));
        call.resolve(ret);

        // 2. SIMULATION: Find 'NDRF-UNIT-ALPHA' after 3 seconds
        handler.postDelayed(() -> {
            Log.d(TAG, "Simulating Peer Discovery: NDRF-UNIT-ALPHA");
            JSObject peer = new JSObject();
            peer.put("peerId", "NDRF-UNIT-ALPHA");
            peer.put("rssi", -42); // Strong signal
            notifyListeners("peerFound", peer);
        }, 3000);
        
        // 3. SIMULATION: Find 'RELAY-NODE-07' after 7 seconds
        handler.postDelayed(() -> {
            Log.d(TAG, "Simulating Peer Discovery: RELAY-NODE-07");
            JSObject peer = new JSObject();
            peer.put("peerId", "RELAY-NODE-07");
            peer.put("rssi", -68); // Weak signal
            notifyListeners("peerFound", peer);
        }, 7000);
    }

    @PluginMethod
    public void stopMesh(PluginCall call) {
        Log.d(TAG, "Stopping Mesh Service...");
        handler.removeCallbacksAndMessages(null); // Stop all pending simulations
        JSObject ret = new JSObject();
        ret.put("status", "stopped");
        call.resolve(ret);
    }

    @PluginMethod
    public void sendMessage(PluginCall call) {
        String msg = call.getString("message");
        String dest = call.getString("destination");
        Log.d(TAG, "Sending Message: " + msg + " to " + dest);

        // 1. Acknowledge the send to the UI
        JSObject ret = new JSObject();
        ret.put("sent", true);
        ret.put("timestamp", System.currentTimeMillis());
        call.resolve(ret);

        // 2. SIMULATION: Receive a reply after 2 seconds
        handler.postDelayed(() -> {
            Log.d(TAG, "Simulating Reply from Peer");
            JSObject reply = new JSObject();
            reply.put("sender", "NDRF-UNIT-ALPHA");
            reply.put("content", "ACK: Packet Received. Signal Strong.");
            reply.put("timestamp", System.currentTimeMillis());
            notifyListeners("messageReceived", reply);
        }, 2000);
    }
}