# DTN EMERGENCY SYSTEM - QUICK START GUIDE

## 🚨 WHAT IS THIS?

A **mobile emergency messaging system** that works when:

- ❌ No internet
- ❌ No cellular network
- ❌ No infrastructure

Messages spread **device-to-device** as people move.

---

## 🎯 HOW IT WORKS (SIMPLE)

```
You create emergency → Message stored locally → You carry message
                                                        ↓
                                         You meet someone nearby
                                                        ↓
                                         Message copies to their device
                                                        ↓
                                         They meet more people
                                                        ↓
                                         Message spreads across city
                                                        ↓
                                         Eventually reaches help
```

---

## 📱 USER JOURNEY

### Step 1: Create Emergency

1. Open app → SOS View
2. Select emergency type (Medical, Fire, Flood, etc.)
3. Add details (optional)
4. Press **"🚨 SEND EMERGENCY SOS"**
5. ✅ Message stored instantly

### Step 2: Message Propagates Automatically

- System scans for nearby devices every 15 seconds
- When another device is nearby, message copies automatically
- NO user interaction needed
- Works in background

### Step 3: Monitor Progress

- See peer encounters in real-time
- Track how many devices have your message
- View message status: STORED → CARRYING → FORWARDED
- Check TTL (time to live) remaining

---

## 🔄 MESSAGE STATES EXPLAINED

| State         | Icon | Meaning                                    |
| ------------- | ---- | ------------------------------------------ |
| **STORED**    | 📦   | Message saved locally, waiting for peers   |
| **CARRYING**  | 🚶   | You are physically carrying this message   |
| **FORWARDED** | 🔄   | Message copied to other devices, spreading |
| **DELIVERED** | ✅   | Message reached authorities/safe location  |

---

## 🌐 CITY PROPAGATION EXAMPLE

**Real-world scenario: Medical emergency in neighborhood A**

```
Hour 0: Patient in House A sends SOS
└─> [Device A] has message

Hour 1: Neighbor walks by
└─> [Device A] → [Device B]
    └─> 2 devices now carry message (50m radius)

Hour 2: Neighbor B takes bus to downtown
└─> [Device B] meets [C, D, E, F] on bus
    └─> 6 devices carry message (2km radius)

Hour 3: Downtown crowd
└─> [C, D, E, F] meet [G through Z] at market
    └─> 30+ devices carry message (5km radius)

Hour 6: City-wide coverage
└─> Message reached hospital, police, rescue teams
    └─> 100+ devices, entire city covered
```

**Result**: Emergency message reached help WITHOUT internet or cellular

---

## 🔋 BATTERY MANAGEMENT

System is **battery-aware**:

| Battery Level | Scan Frequency   |
| ------------- | ---------------- |
| 50-100%       | Every 15 seconds |
| 20-50%        | Every 30 seconds |
| < 20%         | Every 60 seconds |

**Manual control**:

- ▶ **Start Propagation**: Active scanning
- ⏸ **Pause**: Stop scanning to save battery

**Messages remain stored** even when paused.

---

## 📊 WHAT TO EXPECT

### ✅ What This System WILL Do:

- ✓ Store your emergency message instantly
- ✓ Work without internet or cellular
- ✓ Spread message across city over hours
- ✓ Survive device failures (message on multiple devices)
- ✓ Track propagation progress
- ✓ Show honest status updates

### ❌ What This System WON'T Do:

- ✗ Instant delivery (takes hours to spread)
- ✗ Guarantee 100% delivery
- ✗ Work in completely isolated areas (need some human movement)
- ✗ Function like WhatsApp or SMS
- ✗ Require manual device pairing

---

## 🎯 HONEST EXPECTATIONS

**This is NOT instant messaging.**

Messages spread as people move. In a disaster:

- **Best case**: 30 minutes to reach help (dense population)
- **Typical case**: 2-6 hours (normal movement)
- **Worst case**: 12-24 hours (sparse population)

**But it WORKS when nothing else does.**

---

## 🛠️ TROUBLESHOOTING

### "No peers found"

- ✓ Check Bluetooth is enabled
- ✓ Give location permission (needed for BLE)
- ✓ Move to more populated area
- ✓ Wait - scanning continues automatically

### "Message not spreading"

- ✓ Check propagation is running (green dot)
- ✓ Ensure sufficient battery (>20%)
- ✓ Other devices need the same app
- ✓ Be patient - spreading takes time

### "High battery drain"

- ⏸ Pause propagation when not needed
- ✓ Message stays stored when paused
- ✓ Restart propagation later
- ✓ System reduces scan rate at low battery automatically

---

## 🚀 FOR RESCUE COORDINATORS

### Receiving Emergency Messages

**Your device acts as a collection point:**

1. Install app on coordination device
2. Start propagation
3. As rescue workers return, messages copy automatically
4. View all received emergencies in "Emergency Messages" section
5. Coordinate response based on:
   - Location (if GPS available)
   - Emergency type
   - User details (medical info, contacts)
   - Time since created (TTL)

### Setting Up Authority Node

1. Keep device at fixed location (camp, hospital)
2. Keep propagation running 24/7
3. Messages from entire area will accumulate
4. Export data periodically for coordination
5. Mark delivered emergencies to prevent duplicates

---

## 💡 TIPS FOR MAXIMUM EFFECTIVENESS

1. **Install on multiple family members**: More carriers = faster spread
2. **Keep app running**: Background propagation works
3. **Don't turn off Bluetooth**: Essential for discovery
4. **Include medical details**: Add blood type, conditions in profile
5. **Keep moving**: Static devices don't help propagation
6. **Trust the system**: Even if no immediate feedback, message is spreading

---

## 📱 UI OVERVIEW

### Main SOS Screen

```
┌──────────────────────────────────────┐
│   🚨 EMERGENCY SOS                   │
│   Works WITHOUT infrastructure       │
├──────────────────────────────────────┤
│                                      │
│   [Your Emergency Message]           │
│   Status: FORWARDED                  │
│   Created: 2h ago                    │
│   TTL: 22h remaining                 │
│   Hops: 12                          │
│                                      │
│   Message shared with other         │
│   devices. It is spreading.         │
│                                      │
├──────────────────────────────────────┤
│   Propagation Status            [●]  │
│                                      │
│   Peers Nearby: 3                    │
│   Total Encounters: 45               │
│   Messages Shared: 120               │
│   Last encounter: 12s ago            │
│                                      │
│   [⏸ Pause Propagation]              │
│                                      │
│   🔍 Scanning every 15 seconds       │
├──────────────────────────────────────┤
│   Nearby Devices                     │
│   • Device-ABC (near, 8s ago)       │
│   • Device-XYZ (medium, 15s ago)    │
└──────────────────────────────────────┘
```

---

## 🎓 TECHNICAL NOTES

### For Developers

**Core Technologies:**

- Bluetooth Low Energy (BLE)
- Delay Tolerant Networking (DTN)
- Epidemic Routing
- Store-Carry-Forward
- LocalStorage persistence

**Key Files:**

- `dtnService.js` - Core DTN engine
- `peerDiscoveryService.js` - BLE scanning
- `emergencyService.js` - Emergency management
- `SOSView.jsx` - User interface

**Testing:**

- Web: Simulation mode (no real BLE)
- Android: Full BLE support
- iOS: Coming soon

---

## 📚 LEARN MORE

Read full documentation: `DTN_ARCHITECTURE.md`

**Key Concepts:**

- Store-Carry-Forward: Messages stored on device, carried by user, forwarded when peers found
- Epidemic Routing: Copy message to every device encountered
- Bundle Protocol: Standard DTN message format
- Custody Chain: Track which devices carried message
- TTL: Time To Live, message expires after 24 hours

---

## ⚠️ IMPORTANT DISCLAIMER

This system:

- Is designed for disaster scenarios
- Works WITHOUT infrastructure
- Requires time to propagate (hours, not seconds)
- Depends on human movement
- Is NOT a replacement for traditional emergency services when available

**Always use 911/emergency services if available.**

This system is for when **everything else has failed**.

---

## 🆘 EMERGENCY CONTACTS

After disaster, when networks return:

1. Export emergency data from app
2. Share with coordination centers
3. Follow up on pending emergencies
4. Update delivery status

---

**Remember**: Your phone becomes a **life-saving relay**. Keep it charged, keep moving, keep propagating.

**In disasters, we are all connected - not by towers, but by proximity.**
