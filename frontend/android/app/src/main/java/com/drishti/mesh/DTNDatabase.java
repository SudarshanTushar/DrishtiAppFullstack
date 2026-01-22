package com.drishti.mesh;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class DTNDatabase extends SQLiteOpenHelper {
    private static final String DATABASE_NAME = "dtn_mesh.db";
    private static final int DATABASE_VERSION = 1;
    private static final int MAX_MESSAGES = 1000; // cap queue to protect storage/memory
    private static final String TAG = "DTNDatabase";

    private static final String TABLE_MESSAGES = "messages";
    private static final String COL_ID = "id";
    private static final String COL_SENDER = "sender";
    private static final String COL_PAYLOAD = "payload";
    private static final String COL_LAT = "lat";
    private static final String COL_LNG = "lng";
    private static final String COL_TTL = "ttl";
    private static final String COL_HOPS = "hops";
    private static final String COL_TIMESTAMP = "timestamp";
    private static final String COL_DELIVERED = "delivered";

    public DTNDatabase(Context context) {
        super(context, DATABASE_NAME, null, DATABASE_VERSION);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        String createTable = "CREATE TABLE " + TABLE_MESSAGES + " (" +
            COL_ID + " TEXT PRIMARY KEY, " +
            COL_SENDER + " TEXT NOT NULL, " +
            COL_PAYLOAD + " TEXT NOT NULL, " +
            COL_LAT + " REAL NOT NULL, " +
            COL_LNG + " REAL NOT NULL, " +
            COL_TTL + " INTEGER NOT NULL, " +
            COL_HOPS + " INTEGER NOT NULL, " +
            COL_TIMESTAMP + " INTEGER NOT NULL, " +
            COL_DELIVERED + " INTEGER DEFAULT 0" +
            ")";
        db.execSQL(createTable);

        // Index for faster queries
        db.execSQL("CREATE INDEX idx_timestamp ON " + TABLE_MESSAGES + "(" + COL_TIMESTAMP + ")");
        db.execSQL("CREATE INDEX idx_delivered ON " + TABLE_MESSAGES + "(" + COL_DELIVERED + ")");
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_MESSAGES);
        onCreate(db);
    }

    public boolean insertMessage(DTNMessage message) {
        SQLiteDatabase db = getWritableDatabase();
        
        // Check if message already exists
        if (messageExists(message.id)) {
            return false;
        }

        ContentValues values = new ContentValues();
        values.put(COL_ID, message.id);
        values.put(COL_SENDER, message.sender);
        values.put(COL_PAYLOAD, message.payload);
        values.put(COL_LAT, message.lat);
        values.put(COL_LNG, message.lng);
        values.put(COL_TTL, message.ttl);
        values.put(COL_HOPS, message.hops);
        values.put(COL_TIMESTAMP, message.timestamp);
        values.put(COL_DELIVERED, 0);

        long result = db.insert(TABLE_MESSAGES, null, values);
            if (result != -1) {
                trimOldMessages(db);
                return true;
            }
            return false;
    }

        private void trimOldMessages(SQLiteDatabase db) {
            try {
                Cursor cursor = db.rawQuery("SELECT COUNT(*) FROM messages", null);
                int count = 0;
                if (cursor.moveToFirst()) {
                    count = cursor.getInt(0);
                }
                cursor.close();

                if (count > MAX_MESSAGES) {
                    int toDelete = count - MAX_MESSAGES;
                    db.execSQL(
                        "DELETE FROM messages WHERE id IN (SELECT id FROM messages ORDER BY timestamp ASC LIMIT ?)",
                        new Object[]{toDelete}
                    );
                    Log.d(TAG, "Trimmed " + toDelete + " old messages");
                }
            } catch (Exception e) {
                Log.e(TAG, "Error trimming messages", e);
            }
        }

    public boolean messageExists(String messageId) {
        SQLiteDatabase db = getReadableDatabase();
        Cursor cursor = db.query(
            TABLE_MESSAGES,
            new String[]{COL_ID},
            COL_ID + "=?",
            new String[]{messageId},
            null, null, null
        );
        
        boolean exists = cursor.getCount() > 0;
        cursor.close();
        return exists;
    }

    public List<DTNMessage> getPendingMessages() {
        List<DTNMessage> messages = new ArrayList<>();
        SQLiteDatabase db = getReadableDatabase();
        
        Cursor cursor = db.query(
            TABLE_MESSAGES,
            null,
            COL_DELIVERED + "=?",
            new String[]{"0"},
            null, null,
            COL_TIMESTAMP + " ASC"
        );

        while (cursor.moveToNext()) {
            DTNMessage message = cursorToMessage(cursor);
            if (message != null && !message.isExpired()) {
                messages.add(message);
            }
        }
        cursor.close();
        return messages;
    }

    public List<DTNMessage> getAllMessages(int limit) {
        List<DTNMessage> messages = new ArrayList<>();
        SQLiteDatabase db = getReadableDatabase();
        
        Cursor cursor = db.query(
            TABLE_MESSAGES,
            null,
            null, null, null, null,
            COL_TIMESTAMP + " DESC",
            String.valueOf(limit)
        );

        while (cursor.moveToNext()) {
            DTNMessage message = cursorToMessage(cursor);
            if (message != null) {
                messages.add(message);
            }
        }
        cursor.close();
        return messages;
    }

    public JSONArray getMessagesAsJSON(int limit) {
        JSONArray array = new JSONArray();
        List<DTNMessage> messages = getAllMessages(limit);
        
        for (DTNMessage message : messages) {
            array.put(message.toJSON());
        }
        
        return array;
    }

    public int countMessages() {
        SQLiteDatabase db = getReadableDatabase();
        Cursor cursor = null;
        try {
            cursor = db.rawQuery("SELECT COUNT(*) FROM " + TABLE_MESSAGES, null);
            if (cursor.moveToFirst()) {
                return cursor.getInt(0);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error counting messages", e);
        } finally {
            if (cursor != null) {
                cursor.close();
            }
        }
        return 0;
    }

    public void markAsDelivered(String messageId) {
        SQLiteDatabase db = getWritableDatabase();
        ContentValues values = new ContentValues();
        values.put(COL_DELIVERED, 1);
        
        db.update(TABLE_MESSAGES, values, COL_ID + "=?", new String[]{messageId});
    }

    public void cleanupOldMessages(long maxAge) {
        SQLiteDatabase db = getWritableDatabase();
        long cutoffTime = System.currentTimeMillis() - maxAge;
        
        db.delete(
            TABLE_MESSAGES,
            COL_TIMESTAMP + "<?",
            new String[]{String.valueOf(cutoffTime)}
        );
    }

    public void deleteExpiredMessages() {
        SQLiteDatabase db = getWritableDatabase();
        
        // Delete messages where hops >= ttl
        db.delete(
            TABLE_MESSAGES,
            COL_HOPS + ">=" + COL_TTL,
            null
        );
    }

    private DTNMessage cursorToMessage(Cursor cursor) {
        try {
            return new DTNMessage(
                cursor.getString(cursor.getColumnIndexOrThrow(COL_ID)),
                cursor.getString(cursor.getColumnIndexOrThrow(COL_SENDER)),
                cursor.getString(cursor.getColumnIndexOrThrow(COL_PAYLOAD)),
                cursor.getDouble(cursor.getColumnIndexOrThrow(COL_LAT)),
                cursor.getDouble(cursor.getColumnIndexOrThrow(COL_LNG)),
                cursor.getInt(cursor.getColumnIndexOrThrow(COL_TTL)),
                cursor.getInt(cursor.getColumnIndexOrThrow(COL_HOPS)),
                cursor.getLong(cursor.getColumnIndexOrThrow(COL_TIMESTAMP))
            );
        } catch (Exception e) {
            return null;
        }
    }
}
