package com.drishti.mesh;

import org.json.JSONObject;
import java.util.UUID;

public class DTNMessage {
    public String id;
    public String sender;
    public String payload;
    public double lat;
    public double lng;
    public int ttl;
    public int hops;
    public long timestamp;

    public DTNMessage(String payload, double lat, double lng, int ttl) {
        this.id = UUID.randomUUID().toString();
        this.sender = android.os.Build.MODEL + "_" + android.provider.Settings.Secure.ANDROID_ID.substring(0, 8);
        this.payload = payload;
        this.lat = lat;
        this.lng = lng;
        this.ttl = ttl;
        this.hops = 0;
        this.timestamp = System.currentTimeMillis();
    }

    public DTNMessage(String id, String sender, String payload, double lat, double lng, int ttl, int hops, long timestamp) {
        this.id = id;
        this.sender = sender;
        this.payload = payload;
        this.lat = lat;
        this.lng = lng;
        this.ttl = ttl;
        this.hops = hops;
        this.timestamp = timestamp;
    }

    public JSONObject toJSON() {
        try {
            JSONObject obj = new JSONObject();
            obj.put("id", id);
            obj.put("sender", sender);
            obj.put("payload", payload);
            obj.put("lat", lat);
            obj.put("lng", lng);
            obj.put("ttl", ttl);
            obj.put("hops", hops);
            obj.put("timestamp", timestamp);
            return obj;
        } catch (Exception e) {
            return new JSONObject();
        }
    }

    public static DTNMessage fromJSON(JSONObject obj) {
        try {
            return new DTNMessage(
                obj.getString("id"),
                obj.getString("sender"),
                obj.getString("payload"),
                obj.getDouble("lat"),
                obj.getDouble("lng"),
                obj.getInt("ttl"),
                obj.getInt("hops"),
                obj.getLong("timestamp")
            );
        } catch (Exception e) {
            return null;
        }
    }

    public DTNMessage incrementHop() {
        return new DTNMessage(id, sender, payload, lat, lng, ttl, hops + 1, timestamp);
    }

    public boolean isExpired() {
        return hops >= ttl;
    }
}
