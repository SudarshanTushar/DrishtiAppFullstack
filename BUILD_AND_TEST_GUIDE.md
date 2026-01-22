# 🌐 Mesh + DTN Network - Build & Test Guide

## 🎯 Quick Start

This guide will help you build and test the mesh network on real Android devices.

## 📋 Prerequisites

### Software

- Node.js 16+ installed
- Android Studio installed
- Android SDK installed
- Two Android phones (Android 8.0+)
- USB cables for both phones

### Hardware Requirements

- Android 8.0 (API 26) or higher
- Bluetooth Low Energy support
- Wi-Fi Direct support
- Both phones should be similar Android versions for best results

## 🚀 Build Instructions

### Step 1: Install Dependencies

```bash
cd frontend
npm install
```

### Step 2: Sync Capacitor

```bash
npx cap sync android
```

This will:

- Copy web assets to Android
- Update native plugins
- Sync Capacitor configuration

### Step 3: Build Android App

**Option A: Build via Command Line**

```bash
npx cap build android
```

**Option B: Open in Android Studio (Recommended)**

```bash
npx cap open android
```

Or use the helper script:

- **Windows**: Double-click `build-mesh.bat`
- **Linux/Mac**: Run `./build-mesh.sh`

### Step 4: Android Studio Build

1. Wait for Gradle sync to complete (2-5 minutes first time)
2. Verify no compilation errors
3. Build APK: `Build → Build Bundle(s) / APK(s) → Build APK(s)`
4. Or run directly on device: Click green "Run" button

### Step 5: Install on Both Devices

**Via Android Studio:**

1. Connect Phone A via USB
2. Enable USB Debugging on Phone A
3. Click "Run" in Android Studio
4. Repeat for Phone B

**Via ADB:**

```bash
# Check devices connected
adb devices

# Install on specific device
adb -s DEVICE_ID install app-debug.apk
```

## 🧪 Testing Procedure

### Basic Mesh Test

1. **Phone A - Setup:**

   ```
   ✓ Enable Airplane Mode
   ✓ Enable Bluetooth
   ✓ Enable Wi-Fi (but don't connect)
   ✓ Grant Location permission when prompted
   ✓ Open DrishtiNE app
   ```

2. **Phone B - Setup:**

   ```
   ✓ Enable Airplane Mode
   ✓ Enable Bluetooth
   ✓ Enable Wi-Fi (but don't connect)
   ✓ Grant Location permission when prompted
   ✓ Open DrishtiNE app
   ```

3. **Phone A - Start Test:**

   ```
   → Navigate to "Mesh Test" screen (or Offline Network)
   → Tap "Start Mesh"
   → Wait for "Mesh Active" indicator
   → Type message: "Hello from Phone A"
   → Tap "Send"
   ```

4. **Phone B - Start Test:**

   ```
   → Navigate to "Mesh Test" screen
   → Tap "Start Mesh"
   → Wait 10-15 seconds
   → Check "Nearby Devices" - should show Phone A
   → Check "Recent Messages" - should show message from Phone A
   ```

5. **Phone B - Reply:**
   ```
   → Type message: "Hello from Phone B"
   → Tap "Send"
   → Phone A should receive this message
   ```

### SOS Test

1. **Phone A:**

   ```
   → Tap "SEND SOS" button
   → Enter emergency message
   → Tap "Send"
   ```

2. **Phone B:**
   ```
   → Should receive SOS message automatically
   → Message should be highlighted as emergency
   → Should show sender and timestamp
   ```

### Propagation Test (3+ devices)

1. Phone A and Phone B connected
2. Phone C out of range of Phone A
3. Phone C in range of Phone B
4. Send message from Phone A
5. Phone B should receive it
6. Phone B automatically forwards to Phone C
7. Phone C should receive message with hop count = 1

## ✅ Success Criteria

Your mesh network is working correctly if:

- [ ] Both phones discover each other (5-15 seconds)
- [ ] Messages appear on receiving phone
- [ ] Works in Airplane Mode (NO internet/SIM)
- [ ] Messages persist after app restart
- [ ] Hop count increments when forwarded
- [ ] TTL respected (messages expire)
- [ ] Peer list updates in real-time
- [ ] Battery drain is reasonable (<10%/hour)

## 🐛 Debugging

### View Logs

**During development (USB connected):**

```bash
# All mesh logs
adb logcat | grep -i mesh

# Specific service logs
adb logcat MeshService:V *:S

# All system logs
adb logcat
```

**Filter by importance:**

```bash
adb logcat | grep -E "(MeshService|MeshPlugin|DTN)"
```

### Common Issues

#### "Bluetooth permission denied"

**Solution:**

- Settings → Apps → DrishtiNE → Permissions
- Enable Bluetooth, Location
- Restart app

#### "No peers discovered"

**Checklist:**

- [ ] Bluetooth enabled on both
- [ ] Wi-Fi enabled on both
- [ ] Location permission granted
- [ ] Both devices have mesh started
- [ ] Devices within 100m range
- [ ] Wait at least 15 seconds

#### "Wi-Fi Direct not connecting"

**Solutions:**

- Turn Wi-Fi off and on
- Clear Wi-Fi Direct groups: Settings → Wi-Fi → Wi-Fi Direct → Forget all
- Some devices show permission dialog - approve it
- Restart both devices

#### "App crashes on startup"

**Solutions:**

- Check logcat for errors
- Verify all Java files compiled
- Clean and rebuild: `Build → Clean Project` then `Build → Rebuild Project`
- Check Gradle sync completed successfully

#### "Messages not syncing"

**Checklist:**

- [ ] Wi-Fi Direct connection established (check logcat)
- [ ] TTL not expired
- [ ] Message not duplicate
- [ ] Database not full
- [ ] No errors in logcat

### Enable Verbose Logging

In Android Studio, set log level:

```
Run → Edit Configurations → Logcat → Log Level → Verbose
```

### Check Database

```bash
# Pull database from device
adb pull /data/data/com.gov.drishtiner/databases/dtn_mesh.db

# View with SQLite browser
sqlite3 dtn_mesh.db
.tables
SELECT * FROM messages;
```

## 📊 Performance Testing

### Battery Test

1. Fully charge both phones
2. Start mesh network
3. Let run for 1 hour
4. Check battery usage:
   ```
   Settings → Battery → App usage → DrishtiNE
   ```
5. Expected: 5-10% drain per hour

### Range Test

1. Start mesh on both phones
2. Walk away slowly
3. Note distance when connection lost
4. Expected: 50-100m in open space, 20-50m indoors

### Message Throughput

1. Send 10 messages rapidly
2. All should sync within 30 seconds
3. Check hop counts are correct
4. No messages lost

## 📱 Alternative Testing (No USB)

If you can't connect via USB:

1. Build APK in Android Studio
2. Find APK: `frontend/android/app/build/outputs/apk/debug/app-debug.apk`
3. Transfer via:
   - Email attachment
   - Cloud storage (Drive, Dropbox)
   - Bluetooth
   - SD card
4. Install on both phones
5. Test as normal

## 🔍 Verify Installation

### Check Components Installed

**Java files should exist:**

```
frontend/android/app/src/main/java/com/drishti/mesh/
├── MeshPlugin.java
├── MeshService.java
├── DTNDatabase.java
└── DTNMessage.java
```

**JS files should exist:**

```
frontend/src/
├── services/meshNetworkService.js
├── hooks/useMeshNetwork.js
└── components/MeshNetworkTest.jsx
```

**Manifest updated:**

```xml
<!-- Should have these permissions -->
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.BLUETOOTH_ADVERTISE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />

<!-- Should have this service -->
<service android:name="com.drishti.mesh.MeshService" />
```

## 📈 Next Steps After Successful Test

1. ✅ Verify mesh works in airplane mode
2. ✅ Test with 3+ devices
3. ✅ Test range limits
4. ✅ Test battery consumption
5. → Add encryption
6. → Add authentication
7. → Optimize battery usage
8. → Add background service
9. → Create network visualization
10. → Production hardening

## 📚 Documentation

- **Technical Docs**: `MESH_DTN_IMPLEMENTATION.md`
- **Integration Guide**: `MESH_INTEGRATION_GUIDE.md`
- **Summary**: `MESH_IMPLEMENTATION_SUMMARY.md`
- **This File**: `BUILD_AND_TEST_GUIDE.md`

## 🆘 Getting Help

### Check logs first:

```bash
adb logcat | grep MeshService
```

### Common log messages:

**Good:**

```
MeshService: Mesh network started
MeshService: BLE advertising started successfully
MeshService: BLE device discovered
MeshService: Wi-Fi Direct group formed
MeshService: Client connected
MeshService: Sent 5 messages
MeshService: Received 3 messages
```

**Bad:**

```
MeshService: Permission denied
MeshService: BLE Advertiser not available
MeshService: Bluetooth not available
MeshService: Wi-Fi P2P discovery failed
```

### Still stuck?

1. Check Android version (must be 8.0+)
2. Check hardware supports BLE + Wi-Fi Direct
3. Try different pair of devices
4. Restart both devices
5. Clean and rebuild app
6. Check all permissions granted

## ✨ Expected Results

**Timeline:**

- 0s: Start mesh on both devices
- 2-5s: BLE discovery begins
- 5-10s: First peer discovered
- 10-15s: Wi-Fi Direct connection established
- 15s+: Messages start syncing

**Visual Indicators:**

- Status changes to "Mesh Active" 🟢
- Peer count increases to 1+
- Messages appear in list
- Last seen time updates

**Success!** 🎉
You now have a working offline mesh network that operates without internet!

---

**Last Updated**: January 22, 2026
**Status**: Ready for Testing ✅
