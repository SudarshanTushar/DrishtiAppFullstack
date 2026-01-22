package com.drishti.mesh;

import android.Manifest;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.IBinder;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.getcapacitor.Logger;

import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(
    name = "MeshNetwork",
    permissions = {
        @Permission(strings = {
            Manifest.permission.BLUETOOTH,
            Manifest.permission.BLUETOOTH_ADMIN,
            Manifest.permission.BLUETOOTH_SCAN,
            Manifest.permission.BLUETOOTH_CONNECT,
            Manifest.permission.BLUETOOTH_ADVERTISE,
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION,
            Manifest.permission.ACCESS_WIFI_STATE,
            Manifest.permission.CHANGE_WIFI_STATE,
            Manifest.permission.CHANGE_NETWORK_STATE,
            Manifest.permission.INTERNET,
            Manifest.permission.ACCESS_NETWORK_STATE,
            Manifest.permission.NEARBY_WIFI_DEVICES
        }, alias = "mesh")
    }
)
public class MeshPlugin extends Plugin {
    private MeshService meshService;
    private boolean serviceBound = false;
    private boolean pendingStart = false;
    private boolean pendingForeground = false;

    private ServiceConnection serviceConnection = new ServiceConnection() {
        @Override
        public void onServiceConnected(ComponentName name, IBinder service) {
            MeshService.LocalBinder binder = (MeshService.LocalBinder) service;
            meshService = binder.getService();
            serviceBound = true;
            boolean started = false;
            
            // Set message listener
            meshService.setMessageListener(new MeshService.MessageListener() {
                @Override
                public void onMessageReceived(DTNMessage message) {
                    notifyMessageReceived(message);
                }
                
                @Override
                public void onPeerDiscovered(String peerId) {
                    notifyPeerDiscovered(peerId);
                }
                
                @Override
                public void onPeerLost(String peerId) {
                    notifyPeerLost(peerId);
                }
            });

            if (pendingStart && meshService != null) {
                started = meshService.startMesh();
                pendingStart = false;
            }
            if (pendingForeground && meshService != null) {
                meshService.enableForeground(true);
                pendingForeground = false;
            }
            Logger.info("MeshPlugin", "Service connected. meshStarted=" + started);
        }

        @Override
        public void onServiceDisconnected(ComponentName name) {
            serviceBound = false;
            meshService = null;
        }
    };

    @PluginMethod
    public void startMesh(PluginCall call) {
        if (!hasRequiredPermissions()) {
            logPermissionState("startMesh pre-check");
            requestPermissionForAlias("mesh", call, "startMeshPermissionCallback");
            return;
        }

        boolean background = call.getBoolean("background", false);

        if (serviceBound && meshService != null) {
            boolean started = meshService.startMesh();
            if (background) {
                meshService.enableForeground(true);
            }
            JSObject ret = new JSObject();
            ret.put("success", started);
            ret.put("message", started ? "Mesh already running or started" : "Mesh start prerequisites missing");
            call.resolve(ret);
            return;
        }

        try {
            Context context = getContext();
            Intent intent = new Intent(context, MeshService.class);
            if (background) {
                try {
                    context.startForegroundService(intent);
                    pendingForeground = true;
                } catch (Exception e) {
                    Logger.error("MeshPlugin", "Failed to start foreground service", e);
                }
            }
            pendingStart = true;
            context.bindService(intent, serviceConnection, Context.BIND_AUTO_CREATE);
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("message", "Mesh service binding initiated");
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to start mesh: " + e.getMessage());
        }
    }

    @PermissionCallback
    private void startMeshPermissionCallback(PluginCall call) {
        if (!hasRequiredPermissions()) {
            logPermissionState("startMesh callback missing perms");
            call.reject("Missing required permissions");
            return;
        }

        startMesh(call);
    }

    @PluginMethod
    public void stopMesh(PluginCall call) {
        try {
            pendingStart = false;
            pendingForeground = false;
            if (serviceBound && meshService != null) {
                meshService.enableForeground(false);
                meshService.stopMesh();
                getContext().unbindService(serviceConnection);
                serviceBound = false;
                meshService = null;
            }
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("message", "Mesh service stopped");
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to stop mesh: " + e.getMessage());
        }
    }

    @PluginMethod
    public void sendMessage(PluginCall call) {
        if (!serviceBound || meshService == null) {
            call.reject("Mesh service not running");
            return;
        }

        String payload = call.getString("payload");
        Double lat = call.getDouble("lat");
        Double lng = call.getDouble("lng");
        Integer ttl = call.getInt("ttl", 10);

        if (payload == null) {
            call.reject("Payload is required");
            return;
        }

        try {
            DTNMessage message = new DTNMessage(
                payload,
                lat != null ? lat : 0.0,
                lng != null ? lng : 0.0,
                ttl
            );
            
            meshService.sendMessage(message);
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("messageId", message.id);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to send message: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getPeers(PluginCall call) {
        if (!serviceBound || meshService == null) {
            call.reject("Mesh service not running");
            return;
        }

        try {
            JSONArray peers = meshService.getConnectedPeers();
            JSObject ret = new JSObject();
            ret.put("peers", peers);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to get peers: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getMessages(PluginCall call) {
        if (!serviceBound || meshService == null) {
            call.reject("Mesh service not running");
            return;
        }

        try {
            JSONArray messages = meshService.getStoredMessages();
            JSObject ret = new JSObject();
            ret.put("messages", messages);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to get messages: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        if (!serviceBound || meshService == null) {
            call.reject("Mesh service not running");
            return;
        }

        try {
            JSObject ret = new JSObject();
            ret.put("status", meshService.getStatus());
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to get status: " + e.getMessage());
        }
    }

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("granted", hasRequiredPermissions());
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (hasRequiredPermissions()) {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
            return;
        }

        requestPermissionForAlias("mesh", call, "meshPermissionsCallback");
    }

    @PermissionCallback
    private void meshPermissionsCallback(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("granted", hasRequiredPermissions());
        call.resolve(ret);
    }

    public boolean hasRequiredPermissions() {
        Context context = getContext();
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return ContextCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_SCAN) == PackageManager.PERMISSION_GRANTED &&
                   ContextCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED &&
                   ContextCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_ADVERTISE) == PackageManager.PERMISSION_GRANTED &&
                   ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED &&
                   ContextCompat.checkSelfPermission(context, Manifest.permission.NEARBY_WIFI_DEVICES) == PackageManager.PERMISSION_GRANTED;
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            return ContextCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_SCAN) == PackageManager.PERMISSION_GRANTED &&
                   ContextCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED &&
                   ContextCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_ADVERTISE) == PackageManager.PERMISSION_GRANTED &&
                   ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        } else {
            return ContextCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH) == PackageManager.PERMISSION_GRANTED &&
                   ContextCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_ADMIN) == PackageManager.PERMISSION_GRANTED &&
                   ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        }
    }

    private void logPermissionState(String tag) {
        Context context = getContext();
        JSObject data = new JSObject();
        data.put("sdk", Build.VERSION.SDK_INT);
        data.put("BLUETOOTH_SCAN", ContextCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_SCAN));
        data.put("BLUETOOTH_CONNECT", ContextCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_CONNECT));
        data.put("BLUETOOTH_ADVERTISE", ContextCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_ADVERTISE));
        data.put("BLUETOOTH", ContextCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH));
        data.put("BLUETOOTH_ADMIN", ContextCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_ADMIN));
        data.put("FINE_LOCATION", ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION));
        data.put("COARSE_LOCATION", ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION));
        data.put("NEARBY_WIFI_DEVICES", ContextCompat.checkSelfPermission(context, Manifest.permission.NEARBY_WIFI_DEVICES));
        data.put("ACCESS_WIFI_STATE", ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_WIFI_STATE));
        data.put("CHANGE_WIFI_STATE", ContextCompat.checkSelfPermission(context, Manifest.permission.CHANGE_WIFI_STATE));
        Logger.debug("MeshPlugin", tag + " permissions: " + data.toString());
    }

    private void notifyMessageReceived(DTNMessage message) {
        try {
            JSObject data = new JSObject();
            data.put("id", message.id);
            data.put("sender", message.sender);
            data.put("payload", message.payload);
            data.put("lat", message.lat);
            data.put("lng", message.lng);
            data.put("ttl", message.ttl);
            data.put("hops", message.hops);
            data.put("timestamp", message.timestamp);
            
            notifyListeners("messageReceived", data);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void notifyPeerDiscovered(String peerId) {
        JSObject data = new JSObject();
        data.put("peerId", peerId);
        notifyListeners("peerDiscovered", data);
    }

    private void notifyPeerLost(String peerId) {
        JSObject data = new JSObject();
        data.put("peerId", peerId);
        notifyListeners("peerLost", data);
    }

    @Override
    protected void handleOnDestroy() {
        if (serviceBound) {
            getContext().unbindService(serviceConnection);
            serviceBound = false;
        }
    }
}
