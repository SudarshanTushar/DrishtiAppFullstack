package com.drishti.mesh;

import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "TestPlugin")
public class TestPlugin extends Plugin {
    private static final String TAG = "TestPlugin";
    
    @Override
    public void load() {
        Log.d(TAG, "========================================");
        Log.d(TAG, "TestPlugin LOADED successfully!");
        Log.d(TAG, "========================================");
    }
    
    @PluginMethod
    public void echo(PluginCall call) {
        Log.d(TAG, "echo() method called!");
        String value = call.getString("value", "Hello from TestPlugin!");
        Log.d(TAG, "Received value: " + value);
        
        JSObject ret = new JSObject();
        ret.put("success", true);
        ret.put("value", value);
        ret.put("message", "TestPlugin is working!");
        
        Log.d(TAG, "Sending response: " + ret.toString());
        call.resolve(ret);
    }
}
