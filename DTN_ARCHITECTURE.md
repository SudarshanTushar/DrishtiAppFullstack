# DTN EMERGENCY SYSTEM ARCHITECTURE

## REAL Delay Tolerant Networking for Disaster Scenarios

---

## 🎯 MISSION STATEMENT

Build a mobile emergency messaging system that functions **WHEN EVERYTHING ELSE FAILS**:

- ❌ No internet
- ❌ No cellular network
- ❌ No SIM card
- ❌ No central server
- ❌ No infrastructure

✅ **Only device-to-device encounters and human movement**

---

## 🏗️ SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE LAYER                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │ SOS View   │  │ Status UI  │  │ Statistics │           │
│  │ (Honest)   │  │ (Truth)    │  │ Dashboard  │           │
│  └────────────┘  └────────────┘  └────────────┘           │
└─────────────────────────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                  APPLICATION SERVICE LAYER                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │ emergencyService.js                                 │    │
│  │ - Create emergency messages                         │    │
│  │ - Manage message lifecycle                          │    │
│  │ - Control propagation                               │    │
│  │ - Network fallback (try internet, then DTN)        │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                     DTN CORE ENGINE                         │
│  ┌────────────────────────────────────────────────────┐    │
│  │ dtnService.js                                       │    │
│  │                                                     │    │
│  │ 1. BUNDLE PROTOCOL                                  │    │
│  │    - Bundle creation & validation                   │    │
│  │    - Metadata management                            │    │
│  │    - TTL & expiration                              │    │
│  │                                                     │    │
│  │ 2. STORAGE ENGINE                                   │    │
│  │    - LocalStorage persistence                       │    │
│  │    - Garbage collection (expired bundles)          │    │
│  │    - Deduplication                                  │    │
│  │                                                     │    │
│  │ 3. ROUTING ENGINE                                   │    │
│  │    - Epidemic routing (SOS messages)               │    │
│  │    - Spray & Wait (normal messages)                │    │
│  │    - Hop count management                           │    │
│  │    - Custody chain tracking                         │    │
│  │                                                     │    │
│  │ 4. BUNDLE EXCHANGE                                  │    │
│  │    - Summary vector comparison                      │    │
│  │    - Missing bundle identification                  │    │
│  │    - Bundle forwarding logic                        │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                   PEER DISCOVERY LAYER                      │
│  ┌────────────────────────────────────────────────────┐    │
│  │ peerDiscoveryService.js                             │    │
│  │                                                     │    │
│  │ 1. BLUETOOTH LE SCANNING                            │    │
│  │    - Battery-aware intervals (15s-60s)             │    │
│  │    - RSSI-based distance estimation                │    │
│  │    - Peer metadata exchange                         │    │
│  │                                                     │    │
│  │ 2. DEVICE ADVERTISING                               │    │
│  │    - Broadcast DTN service UUID                     │    │
│  │    - Advertise bundle summary                       │    │
│  │                                                     │    │
│  │ 3. HANDSHAKE PROTOCOL                               │    │
│  │    - Connect to peer                                │    │
│  │    - Exchange bundle IDs                            │    │
│  │    - Disconnect after exchange                      │    │
│  │                                                     │    │
│  │ 4. PEER MANAGEMENT                                  │    │
│  │    - Track discovered peers                         │    │
│  │    - Stale peer cleanup                             │    │
│  │    - Encounter history                              │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    TRANSPORT LAYER                          │
│  ┌──────────────────┐  ┌────────────────────────┐         │
│  │ Bluetooth LE     │  │ Wi-Fi Direct           │         │
│  │ (@capacitor-     │  │ (Future enhancement)   │         │
│  │  community/      │  │                         │         │
│  │  bluetooth-le)   │  │                         │         │
│  └──────────────────┘  └────────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 BUNDLE STRUCTURE

Each message is wrapped in a DTN Bundle:

```javascript
{
  // IDENTITY
  id: "uuid-v4",                    // Unique bundle identifier
  sourceId: "NODE-12345",           // Origin node
  destId: "BROADCAST",              // Destination (flood to all)

  // CONTENT
  type: "SOS",                      // SOS | NORMAL | INFRASTRUCTURE
  priority: "CRITICAL",             // CRITICAL | HIGH | MEDIUM | LOW
  payload: {                        // Actual emergency data
    emergencyType: "MEDICAL",
    location: { lat, lng, accuracy },
    user: { name, age, bloodType, ... },
    message: "...",
    timestamp: 1234567890
  },

  // TEMPORAL
  timestamp: 1234567890,            // Creation time
  ttl: 1234654290,                  // Expiration time (24h default)
  expiresIn: 86400000,              // For UI display

  // ROUTING
  hopCount: 0,                      // Number of hops traveled
  maxHops: 50,                      // Prevent infinite loops
  routingScheme: "EPIDEMIC",        // EPIDEMIC | SPRAY_AND_WAIT
  sprayLimit: 999,                  // For Spray & Wait
  copiesRemaining: 999,             // For Spray & Wait

  // STATE
  status: "STORED",                 // STORED → CARRYING → FORWARDED → DELIVERED
  custodyChain: [                   // Who carried this bundle
    {
      nodeId: "NODE-12345",
      timestamp: 1234567890,
      action: "CREATED"
    },
    {
      nodeId: "NODE-67890",
      timestamp: 1234568000,
      action: "FORWARDED",
      forwardedTo: "NODE-99999"
    }
  ],

  // METADATA
  size: 2048,                       // Bytes
  version: 1                        // Protocol version
}
```

---

## 🔄 MESSAGE LIFECYCLE

### Phase 1: CREATION

```
User presses "EMERGENCY SOS"
         ↓
Bundle created with:
  - Emergency details
  - User information
  - Location (if available)
  - 24-hour TTL
         ↓
Bundle stored in LocalStorage
         ↓
Status: STORED
         ↓
UI shows: "📦 Message stored locally"
```

### Phase 2: CARRYING

```
System marks bundle as CARRYING
         ↓
User physically carries message
         ↓
Background service starts scanning
         ↓
UI shows: "🚶 You are carrying this message"
```

### Phase 3: OPPORTUNISTIC ENCOUNTER

```
Two devices come within BLE range
         ↓
Peer discovery detects each other
         ↓
Devices connect and handshake
         ↓
Exchange bundle summary vectors
         ↓
Identify missing bundles
         ↓
Transfer only missing bundles
         ↓
Disconnect
         ↓
Both devices now carry message
```

### Phase 4: FORWARDING

```
Bundle copied to peer device
         ↓
Original device marks: FORWARDED
         ↓
Peer device marks: STORED → CARRYING
         ↓
hopCount incremented
         ↓
custodyChain updated
         ↓
UI shows: "🔄 Shared with N devices"
```

### Phase 5: PROPAGATION (Multi-Hop)

```
Person A (device) → Person B → Person C → ...
         ↓              ↓           ↓
     Carries        Carries     Carries
         ↓              ↓           ↓
    Meets B        Meets C      Meets D
         ↓              ↓           ↓
   Transfers      Transfers   Transfers
         ↓              ↓           ↓
    Message spreads across city/town
         ↓
    Over hours, covers entire area
```

### Phase 6: DELIVERY

```
Bundle reaches:
  - Authority node (police, hospital)
  - Safe zone
  - Rescue coordinator
         ↓
Status marked: DELIVERED
         ↓
UI shows: "✅ Message delivered"
```

---

## 🌐 CITY/TOWN PROPAGATION MODEL

### How a message spreads across a city WITHOUT infrastructure:

#### Hour 0: Origin

```
   [A]
    ↓
  Creates SOS
  (1 device)
```

#### Hour 1: Immediate Area

```
   [A] ← walking → [B]
    ↓              ↓
  Both carry message
  (2 devices, 50m radius)
```

#### Hour 2: Neighborhood

```
   [A]──[B]──[C]
         │    │
        [D]  [E]
         │
        [F]
  (6 devices, 500m radius)
```

#### Hour 4: District

```
Multiple clusters across district
People walking, buses, bikes
Each encounter = potential transfer
(30+ devices, 2km radius)
```

#### Hour 8: City-Wide

```
┌─────────────────────────────┐
│                             │
│  [clusters across city]     │
│   • • • • • • • • • •       │
│  • • • • • • • • • • •      │
│   • • • • • • • • • •       │
│  • • • • • • • • • • •      │
│                             │
└─────────────────────────────┘
(200+ devices, 10km+ coverage)
```

### Real-World Movement Patterns That Enable Propagation:

1. **Walking/Pedestrians**: People moving through streets, markets
2. **Public Transport**: Buses, shared vehicles carry messages long distances
3. **Gathering Points**: Markets, shelters, hospitals (high encounter rate)
4. **Rescue Workers**: Moving through disaster area
5. **Family Searches**: People looking for loved ones
6. **Resource Collectors**: Getting water, food, supplies

### Why This WORKS:

- **No single point of failure**: Every device is equal
- **Asynchronous**: Devices don't need to be online simultaneously
- **Fault tolerant**: Messages survive device failures
- **Scalable**: More devices = faster propagation
- **Realistic**: Based on actual human movement

---

## 🧠 ROUTING ALGORITHMS

### 1. EPIDEMIC ROUTING (Emergency Messages)

**When**: SOS, critical emergencies  
**Strategy**: Maximize delivery probability

```
Algorithm:
1. When two devices meet:
2.   Exchange bundle summaries
3.   For each SOS bundle:
4.     If peer doesn't have it:
5.       Copy to peer (KEEP original)
6.     Increment hop count
7.     Update custody chain
8.   Result: Both devices carry message
```

**Characteristics**:

- ✅ Highest delivery probability
- ✅ Fast propagation
- ✅ Redundancy (survives device failures)
- ⚠️ Higher storage/bandwidth usage
- ⚠️ Acceptable for emergencies

### 2. SPRAY AND WAIT (Normal Messages)

**When**: Non-critical messages  
**Strategy**: Balance efficiency and delivery

```
Algorithm:
1. Create bundle with sprayLimit = N (e.g., 6 copies)
2. SPRAY PHASE:
3.   When meeting peer:
4.     If copiesRemaining > 0:
5.       Copy to peer
6.       Decrement copiesRemaining
7.     Else: WAIT PHASE
8. WAIT PHASE:
9.   Only carry, don't forward
10.  Wait until reaching destination
```

**Characteristics**:

- ✅ Lower overhead than epidemic
- ✅ Predictable resource usage
- ✅ Good for non-critical data
- ⚠️ Lower delivery probability
- ⚠️ Slower propagation

### 3. DEDUPLICATION

**Prevents infinite copies**:

```
Algorithm:
1. Before storing bundle:
2.   Check local store for bundle.id
3.   If exists: SKIP
4.   Else: STORE
5. Before forwarding:
6.   Check peer's summary vector
7.   Only send bundles peer doesn't have
```

### 4. GARBAGE COLLECTION

**Prevents storage overflow**:

```
Algorithm:
1. On every store access:
2.   Filter bundles where TTL > now
3.   Remove expired bundles
4.   Save cleaned store
5. Result: Only valid bundles remain
```

### 5. HOP LIMIT

**Prevents routing loops**:

```
Algorithm:
1. Each bundle has maxHops (default: 50)
2. On forward:
3.   If hopCount >= maxHops:
4.     Don't forward
5.   Else:
6.     Forward and increment hopCount
```

---

## 🎨 USER INTERFACE PHILOSOPHY

### HONESTY OVER FANTASY

**❌ NEVER Say**:

- "Connected to city network"
- "100% delivery guaranteed"
- "Real-time messaging"
- "Online status"

**✅ ALWAYS Say**:

- "Message stored locally"
- "Will spread as people move"
- "Shared with N devices"
- "Last encounter: 5 minutes ago"

### UI States (Transparent & Honest)

#### STORED State

```
┌─────────────────────────────────┐
│ 📦 STORED                       │
│                                 │
│ Your message is stored locally. │
│ Waiting for nearby devices...   │
│                                 │
│ Created: 2 minutes ago          │
│ TTL: 23h 58m remaining          │
└─────────────────────────────────┘
```

#### CARRYING State

```
┌─────────────────────────────────┐
│ 🚶 CARRYING                     │
│                                 │
│ You are carrying this message.  │
│ It will spread when others are  │
│ nearby.                         │
│                                 │
│ Scanning for peers...           │
│ Peers discovered: 2             │
└─────────────────────────────────┘
```

#### FORWARDED State

```
┌─────────────────────────────────┐
│ 🔄 FORWARDED                    │
│                                 │
│ Message shared with other       │
│ devices. It is spreading.       │
│                                 │
│ Shared with: 5 devices          │
│ Hop count: 3                    │
│ Last shared: 12 seconds ago     │
└─────────────────────────────────┘
```

#### DELIVERED State

```
┌─────────────────────────────────┐
│ ✅ DELIVERED                    │
│                                 │
│ Message reached authorities     │
│ or safe location.               │
│                                 │
│ Delivered: 45 minutes ago       │
│ Total journey: 8 hops           │
└─────────────────────────────────┘
```

### Propagation Status Display

```
┌─────────────────────────────────────┐
│ Propagation Status          [●]     │ ← Green dot = active
│                                     │
│ Peers Nearby: 3                     │
│ Total Encounters: 12                │
│ Messages Shared: 45                 │
│ Messages Carrying: 8                │
│                                     │
│ Last encounter: 15s ago             │
│                                     │
│ [▶ Start Propagation]               │
│                                     │
│ 🔍 Actively scanning every 15s      │
└─────────────────────────────────────┘
```

---

## ⚡ BATTERY-AWARE BEHAVIOR

### Adaptive Scan Intervals

| Battery Level | Scan Interval | Rationale                          |
| ------------- | ------------- | ---------------------------------- |
| 50%-100%      | 15 seconds    | Normal operation, frequent scans   |
| 20%-50%       | 30 seconds    | Balanced (save battery)            |
| < 20%         | 60 seconds    | Critical battery, minimal scanning |

### Power Optimization Strategies

1. **Interval-based scanning**: Not continuous
2. **Quick handshakes**: Connect → Exchange → Disconnect fast
3. **Metadata-only exchange**: Don't transfer full bundles during scan
4. **Background service**: Android JobScheduler for efficient background work
5. **User control**: Allow manual pause/resume

---

## 🔐 SECURITY & PRIVACY

### Current Implementation (MVP)

- ✅ No authentication (broadcast model)
- ✅ No encryption (emergency priority)
- ✅ Anonymous by default

### Future Enhancements

- 🔜 Optional bundle signing (verify authenticity)
- 🔜 Selective encryption (sensitive medical data)
- 🔜 Trust scoring (prefer bundles from known nodes)
- 🔜 Anti-spam (limit bundle creation rate)

**Philosophy**: In disasters, **getting help is more important than perfect security**. We optimize for delivery first.

---

## 🚀 DEPLOYMENT SCENARIOS

### Scenario 1: Earthquake (Infrastructure Destroyed)

```
Time: 0:00 - Earthquake hits, all towers down
Time: 0:05 - Person trapped, sends SOS
Time: 0:10 - Message spreads to nearby survivors
Time: 0:30 - Message reaches rescue team at city edge
Time: 1:00 - Rescue coordinated using DTN mesh
```

### Scenario 2: Flood (Isolated Communities)

```
Village A (isolated by flood)
    ↓
Person with phone travels by boat to Village B
    ↓
Messages from Village A spread in Village B
    ↓
Someone in Village B has satellite link
    ↓
Messages reach outside world
```

### Scenario 3: Landslide (No Power, No Network)

```
Buried person sends SOS (battery low)
    ↓
Message stored locally
    ↓
Rescue worker walks through area
    ↓
Worker's device picks up message
    ↓
Worker relays to command center
    ↓
Rescue team dispatched to location
```

---

## 📊 SUCCESS METRICS

### Technical Metrics

- **Delivery Ratio**: % of messages reaching destination
- **Delivery Latency**: Time from creation to delivery
- **Hop Count**: Average path length
- **Storage Overhead**: Bytes per message
- **Battery Impact**: mAh per hour

### User Experience Metrics

- **Time to Store**: Message saved locally (should be instant)
- **Peer Discovery Rate**: Peers found per minute
- **Propagation Feedback**: User understands status
- **Battery Life**: Hours of operation

---

## 🛠️ IMPLEMENTATION STATUS

### ✅ Completed

- [x] DTN Core Engine (dtnService.js)
- [x] Bundle Protocol with epidemic routing
- [x] Store-Carry-Forward logic
- [x] Peer Discovery Service (peerDiscoveryService.js)
- [x] Emergency Message Service (emergencyService.js)
- [x] SOS UI with honest state display
- [x] Statistics and monitoring
- [x] Custody chain tracking
- [x] TTL and garbage collection

### 🚧 In Progress / Future

- [ ] Native BLE implementation (requires Capacitor native code)
- [ ] Wi-Fi Direct support
- [ ] Background service (Android)
- [ ] Bundle signing and encryption
- [ ] Performance optimization
- [ ] Field testing
- [ ] Authority node software

---

## 🧪 TESTING STRATEGY

### Simulation Testing

1. **Single Device**: Store messages, verify persistence
2. **Two Devices**: Simulate encounter, verify bundle exchange
3. **Multiple Devices**: Verify multi-hop propagation
4. **Network Conditions**: Offline, intermittent, high latency

### Field Testing

1. **Walking Test**: Two people walk, meet, verify transfer
2. **Distance Test**: Measure propagation across neighborhood
3. **Crowd Test**: Multiple devices in gathering point
4. **Battery Test**: Monitor power consumption over 24h

---

## 🎓 WHY THIS WORKS WHEN NETWORKS FAIL

### Traditional Networks (FAIL in Disasters)

```
Device → Tower → Internet → Server → Internet → Tower → Device
   ↓        ❌       ❌        ❌       ❌        ❌       ↓
  FAIL    FAIL     FAIL     FAIL     FAIL     FAIL    FAIL
```

### DTN Network (WORKS in Disasters)

```
Device A ──encounter──→ Device B ──encounter──→ Device C
   ↓                        ↓                        ↓
CARRIES                  CARRIES                  CARRIES
   ↓                        ↓                        ↓
 WORKS                    WORKS                    WORKS
```

### Key Differences

| Traditional              | DTN (This System)   |
| ------------------------ | ------------------- |
| Requires end-to-end path | No path required    |
| Real-time                | Asynchronous        |
| Fixed infrastructure     | Mobile devices only |
| Fails if one link breaks | Survives failures   |
| Needs power grid         | Battery-powered     |
| Centralized              | Fully distributed   |

---

## 📝 FINAL NOTES

This system is designed for **REAL emergencies** where:

- Lives are at stake
- Infrastructure has failed
- Time is critical
- Hope is all people have

The UI must be **honest**: "Your message will spread as people move."

This is **not** a chat app. This is a **life-saving system** based on human movement and opportunistic encounters.

**Every line of code** should respect the gravity of disaster scenarios.

---

## 👨‍💻 DEVELOPER NOTES

### Running the System

1. **Development (Browser - Limited)**:

```bash
cd frontend
npm install
npm run dev
```

Note: BLE not available in browser, only simulation

2. **Android Build**:

```bash
npm run build
npx cap sync
cd android
./gradlew assembleDebug
```

3. **Testing DTN Logic**:
   Open browser console and try:

```javascript
import { dtnService } from "./services/dtnService";

// Create emergency
const bundle = dtnService.createEmergencyMessage({
  emergencyType: "MEDICAL",
  message: "Test",
});

// Check status
dtnService.getStatistics();
```

### Key Files

- `src/services/dtnService.js` - Core DTN engine
- `src/services/peerDiscoveryService.js` - BLE discovery
- `src/services/emergencyService.js` - Emergency management
- `src/pages/SOSView.jsx` - Emergency UI

---

**Remember**: This system exists so that when **EVERYTHING FAILS**, help can still spread through **human connection**.
