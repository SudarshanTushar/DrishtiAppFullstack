package com.gov.drishtiner;

import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import com.drishti.mesh.MeshPlugin;
import com.drishti.mesh.TestPlugin;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        Log.d(TAG, "============================================");
        Log.d(TAG, "MainActivity.onCreate() START");

        // Register custom plugins BEFORE bridge init
        Log.d(TAG, "Registering plugins pre-super");
        registerPlugin(TestPlugin.class);
        registerPlugin(MeshPlugin.class);
        Log.d(TAG, "Plugins registered: TestPlugin, MeshPlugin");

        super.onCreate(savedInstanceState);
        Log.d(TAG, "Bridge initialized");

        Log.d(TAG, "MainActivity.onCreate() COMPLETE");
        Log.d(TAG, "============================================");
    }
}
