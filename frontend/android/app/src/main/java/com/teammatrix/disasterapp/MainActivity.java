package com.teammatrix.disasterapp;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import androidx.core.app.ActivityCompat;
import com.getcapacitor.BridgeActivity;
import com.teammatrix.disasterapp.MeshPlugin; // ✅ Import Plugin

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 1. Plugin pehle register karo (Taaki Bridge load hone se pehle Mesh ready ho)
        registerPlugin(MeshPlugin.class);
        
        // 2. Bridge Init karo
        super.onCreate(savedInstanceState);

        // 3. Permissions Maango (Ye bohot zaroori hai Bluetooth messaging ke liye)
        requestPermissions();
    }

    private void requestPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            // 🚀 Android 12, 13, 14+ ke liye permissions
            // Inke bina "Offline Mesh" kaam nahi karega
            String[] permissions = {
                Manifest.permission.ACCESS_FINE_LOCATION,       // Nearby devices dhoondne ke liye
                Manifest.permission.ACCESS_COARSE_LOCATION,
                Manifest.permission.BLUETOOTH_SCAN,             // Doosre phones ko scan karne ke liye
                Manifest.permission.BLUETOOTH_ADVERTISE,        // Khud ko dikhane ke liye
                Manifest.permission.BLUETOOTH_CONNECT,          // Connect karne ke liye
                Manifest.permission.NEARBY_WIFI_DEVICES         // Fast data transfer ke liye
            };

            if (!hasPermissions(permissions)) {
                ActivityCompat.requestPermissions(this, permissions, 1);
            }
        } else {
            // 📱 Android 11, 10, 9 ke liye permissions
            // Purane phones me Location permission hi Bluetooth scan allow karti hai
            String[] permissions = {
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
            };
            if (!hasPermissions(permissions)) {
                ActivityCompat.requestPermissions(this, permissions, 1);
            }
        }
    }

    // Helper function to check if permissions are already granted
    private boolean hasPermissions(String[] permissions) {
        for (String permission : permissions) {
            if (ActivityCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                return false;
            }
        }
        return true;
    }
}