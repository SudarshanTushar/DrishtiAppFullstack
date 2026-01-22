# 📱 Mesh Network Quick Reference Card

## 🚀 Quick Commands

### Build & Deploy

```bash
# Windows
build-mesh.bat

# Linux/Mac
./build-mesh.sh

# Manual
cd frontend
npx cap sync android
npx cap open android
```

### Testing

```bash
# View logs
adb logcat | grep MeshService

# Check devices
adb devices

# Install APK
adb install app-debug.apk
```

---

## 💻 Code Examples

### Start Mesh (JavaScript)

```javascript
import meshNetworkService from "./services/meshNetworkService";

await meshNetworkService.startMesh();
```

### Send Message

```javascript
await meshNetworkService.sendMessage({
  payload: "Hello mesh!",
  ttl: 10,
});
```

### Send SOS

```javascript
await meshNetworkService.sendSOS({
  message: "EMERGENCY!",
  lat: 28.6139,
  lng: 77.209,
});
```

### React Hook

```javascript
import { useMeshNetwork } from "./hooks/useMeshNetwork";

const { isRunning, peers, sendMessage } = useMeshNetwork();
```

### Listen for Messages

```javascript
meshNetworkService.on("messageReceived", (msg) => {
  console.log("New message:", msg.payload);
});
```

---

## 🎯 File Locations

| Component      | Path                                                                   |
| -------------- | ---------------------------------------------------------------------- |
| Native Plugin  | `frontend/android/app/src/main/java/com/drishti/mesh/MeshPlugin.java`  |
| Mesh Service   | `frontend/android/app/src/main/java/com/drishti/mesh/MeshService.java` |
| Database       | `frontend/android/app/src/main/java/com/drishti/mesh/DTNDatabase.java` |
| JS Service     | `frontend/src/services/meshNetworkService.js`                          |
| React Hook     | `frontend/src/hooks/useMeshNetwork.js`                                 |
| Test Component | `frontend/src/components/MeshNetworkTest.jsx`                          |
| Manifest       | `frontend/android/app/src/main/AndroidManifest.xml`                    |

---

## ⚡ Key Functions

### JavaScript API

| Function               | Description             | Returns                         |
| ---------------------- | ----------------------- | ------------------------------- |
| `startMesh()`          | Initialize mesh network | `Promise<{success, message}>`   |
| `stopMesh()`           | Shutdown mesh network   | `Promise<{success, message}>`   |
| `sendMessage(opts)`    | Send message            | `Promise<{success, messageId}>` |
| `sendSOS(opts)`        | Send emergency alert    | `Promise<{success, messageId}>` |
| `getPeers()`           | Get connected devices   | `Promise<Array>`                |
| `getMessages()`        | Get message history     | `Promise<Array>`                |
| `on(event, callback)`  | Listen for events       | `void`                          |
| `off(event, callback)` | Remove listener         | `void`                          |

### Events

| Event             | Payload      | Description         |
| ----------------- | ------------ | ------------------- |
| `messageReceived` | `DTNMessage` | New message arrived |
| `peerDiscovered`  | `{peerId}`   | Device found nearby |
| `peerLost`        | `{peerId}`   | Device disconnected |

---

## 🔧 Configuration

### Message Options

```javascript
{
  payload: 'string or JSON',  // Message content
  lat: 28.6139,              // Latitude (optional)
  lng: 77.2090,              // Longitude (optional)
  ttl: 10                    // Max hops (default: 10)
}
```

### SOS Options

```javascript
{
  message: 'Emergency!',     // Alert message
  lat: 28.6139,              // Latitude (required)
  lng: 77.2090,              // Longitude (required)
  metadata: {                // Additional info (optional)
    urgency: 'high',
    type: 'medical'
  }
}
```

---

## 📊 Performance Specs

| Metric          | Value            |
| --------------- | ---------------- |
| Discovery Time  | 5-15 seconds     |
| Connection Time | 5-10 seconds     |
| Message Sync    | <1 second        |
| Range           | ~100 meters      |
| Battery Drain   | 5-10% per hour   |
| Max Peers       | 1-8 simultaneous |
| Message Size    | <1MB recommended |
| Default TTL     | 10 hops          |

---

## 🐛 Troubleshooting Quick Fixes

| Problem              | Solution                            |
| -------------------- | ----------------------------------- |
| No peers found       | Wait 15 seconds, check Bluetooth ON |
| Permission denied    | Settings → Apps → Permissions       |
| Wi-Fi Direct failed  | Turn Wi-Fi off/on, approve dialogs  |
| App crash            | Clean project, rebuild              |
| High battery         | Stop mesh when not needed           |
| Messages not syncing | Check Wi-Fi Direct connected        |

---

## ✅ Testing Checklist

- [ ] Build APK successfully
- [ ] Install on 2 devices
- [ ] Enable Airplane Mode
- [ ] Keep Bluetooth ON
- [ ] Keep Wi-Fi ON
- [ ] Grant all permissions
- [ ] Start mesh on both
- [ ] Wait 15 seconds
- [ ] Send message
- [ ] Receive message
- [ ] Check hop count
- [ ] Verify no internet used

---

## 📱 Device Requirements

| Requirement     | Value                         |
| --------------- | ----------------------------- |
| Android Version | 8.0+ (API 26+)                |
| Bluetooth       | BLE support required          |
| Wi-Fi           | Wi-Fi Direct support required |
| RAM             | 2GB+ recommended              |
| Storage         | 100MB+ for app + database     |

---

## 🔒 Security Notes

⚠️ **Current Implementation:**

- Messages NOT encrypted
- No peer authentication
- Open network (anyone can join)

✅ **Recommended Additions:**

- Add AES-256 encryption
- Implement PKI authentication
- Add message signing
- Implement access control

---

## 📚 Documentation Links

| Document                         | Purpose                      |
| -------------------------------- | ---------------------------- |
| `MESH_DTN_IMPLEMENTATION.md`     | Full technical documentation |
| `MESH_INTEGRATION_GUIDE.md`      | Integration examples         |
| `MESH_IMPLEMENTATION_SUMMARY.md` | Implementation overview      |
| `BUILD_AND_TEST_GUIDE.md`        | Build and test procedures    |
| `MESH_VISUAL_ARCHITECTURE.md`    | Architecture diagrams        |

---

## 🎓 Learning Resources

### Key Concepts

- **BLE**: Bluetooth Low Energy for discovery
- **Wi-Fi Direct**: P2P data transfer
- **DTN**: Delay-Tolerant Networking
- **Store-Carry-Forward**: Hold messages until peer found
- **TTL**: Time-To-Live (hop limit)
- **Hop Count**: Number of forwards

### External Resources

- [Android BLE Guide](https://developer.android.com/guide/topics/connectivity/bluetooth-le)
- [Wi-Fi Direct Docs](https://developer.android.com/guide/topics/connectivity/wifip2p)
- [Capacitor Plugins](https://capacitorjs.com/docs/plugins)
- [DTN Concepts](https://en.wikipedia.org/wiki/Delay-tolerant_networking)

---

## 💡 Pro Tips

1. **Battery**: Stop mesh when not actively needed
2. **Range**: Open areas get 100m, indoors get 20-50m
3. **Permissions**: Request all at app start
4. **Testing**: Use real devices (emulators don't work)
5. **Debugging**: Always check logcat first
6. **TTL**: Higher = more reach, more battery drain
7. **Messages**: Keep under 1MB for best performance
8. **Cleanup**: Runs automatically every 60 seconds

---

## 🚨 Common Errors & Fixes

### "Mesh service not running"

```javascript
// Call startMesh() first
await meshNetworkService.startMesh();
await meshNetworkService.sendMessage({ payload: "Hi!" });
```

### "Permission denied"

```bash
# Check permissions in Settings
Settings → Apps → DrishtiNE → Permissions
# Enable: Bluetooth, Location, Nearby devices
```

### "No peers discovered"

```
Checklist:
✓ Both devices have mesh started
✓ Bluetooth enabled
✓ Wi-Fi enabled
✓ Location permission granted
✓ Within 100m range
✓ Wait 15+ seconds
```

---

## 📞 Support Workflow

1. **Check logs**: `adb logcat | grep MeshService`
2. **Verify permissions**: Settings → Apps → Permissions
3. **Test basics**: Can BLE scan? Can Wi-Fi connect?
4. **Check hardware**: Does device support BLE + Wi-Fi Direct?
5. **Clean rebuild**: Build → Clean → Rebuild Project
6. **Try different devices**: Some phones have quirks

---

**Status**: ✅ Complete & Ready
**Last Updated**: January 22, 2026
**Version**: 1.0.0

---

**Print this card for quick reference during development and testing!**
