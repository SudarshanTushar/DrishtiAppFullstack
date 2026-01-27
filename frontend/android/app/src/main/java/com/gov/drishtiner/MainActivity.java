package com.gov.drishtiner;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

// ✅ CRITICAL: Import your custom plugins
import com.drishti.mesh.MeshPlugin;
import com.drishti.mesh.TestPlugin;

public class MainActivity extends BridgeActivity {
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 1. Register Plugins BEFORE calling super.onCreate
        // This makes them available to JavaScript immediately on launch
        registerPlugin(MeshPlugin.class);
        registerPlugin(TestPlugin.class);

        // 2. Initialize the Bridge
        super.onCreate(savedInstanceState);
    }
}