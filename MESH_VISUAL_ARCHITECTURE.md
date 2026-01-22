# Mesh Network Visual Architecture

## System Overview

```
╔══════════════════════════════════════════════════════════════════════════╗
║                          DRISHTI MESH NETWORK                             ║
║              Offline P2P Communication System (No Internet)               ║
╚══════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE LAYER                          │
│                          (React Components)                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │ SOS Screen   │  │Network View  │  │  Map View    │                 │
│  │              │  │              │  │              │                 │
│  │ • Send SOS   │  │ • Peer List  │  │ • SOS Pins   │                 │
│  │ • Emergency  │  │ • Messages   │  │ • Locations  │                 │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                 │
│         │                 │                 │                          │
│         └─────────────────┴─────────────────┘                          │
│                           │                                             │
│                  ┌────────▼────────┐                                    │
│                  │ useMeshNetwork  │                                    │
│                  │  React Hook     │                                    │
│                  └────────┬────────┘                                    │
└───────────────────────────┼─────────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────────────┐
│                        JAVASCRIPT SERVICE LAYER                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │              meshNetworkService.js                              │  │
│  │                                                                 │  │
│  │  • startMesh() ────────────────► Initialize mesh network       │  │
│  │  • stopMesh() ─────────────────► Shutdown mesh                 │  │
│  │  • sendMessage() ──────────────► Queue message for sending     │  │
│  │  • sendSOS() ──────────────────► Send emergency alert          │  │
│  │  • getPeers() ─────────────────► Get connected devices         │  │
│  │  • getMessages() ──────────────► Retrieve message history      │  │
│  │                                                                 │  │
│  │  Event Listeners:                                               │  │
│  │  • onMessageReceived ──────────► New message arrived            │  │
│  │  • onPeerDiscovered ───────────► Device found nearby           │  │
│  │  • onPeerLost ─────────────────► Device disconnected           │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                            │                                            │
└────────────────────────────┼────────────────────────────────────────────┘
                             │
                             │ Capacitor Plugin Bridge
                             │
┌────────────────────────────▼────────────────────────────────────────────┐
│                       ANDROID NATIVE LAYER (Java)                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                    MeshPlugin.java                              │  │
│  │              (Capacitor Plugin Bridge)                          │  │
│  │                                                                 │  │
│  │  Exposes to JavaScript:                                         │  │
│  │  • startMesh()                                                  │  │
│  │  • stopMesh()                                                   │  │
│  │  • sendMessage(payload, lat, lng, ttl)                          │  │
│  │  • getPeers()                                                   │  │
│  │  • getMessages()                                                │  │
│  └──────────────────────────┬──────────────────────────────────────┘  │
│                             │                                           │
│  ┌──────────────────────────▼──────────────────────────────────────┐  │
│  │                    MeshService.java                             │  │
│  │                (Core Mesh Network Logic)                        │  │
│  │                                                                 │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐ │  │
│  │  │  BLE Module     │  │  Wi-Fi Direct   │  │  DTN Forward  │ │  │
│  │  │                 │  │     Module      │  │    Module     │ │  │
│  │  │ • Advertise ID  │  │ • P2P Discovery │  │ • Store msgs  │ │  │
│  │  │ • Scan for peers│  │ • Group form    │  │ • Carry msgs  │ │  │
│  │  │ • Detect nearby │  │ • Socket connect│  │ • Forward     │ │  │
│  │  │ • Low power mode│  │ • Data exchange │  │ • Increment   │ │  │
│  │  └────────┬────────┘  └────────┬────────┘  └───────┬───────┘ │  │
│  │           │                    │                    │         │  │
│  │           └────────────────────┴────────────────────┘         │  │
│  │                             │                                 │  │
│  └─────────────────────────────┼─────────────────────────────────┘  │
│                                │                                      │
│  ┌─────────────────────────────▼─────────────────────────────────┐  │
│  │                   DTNDatabase.java                            │  │
│  │                  (SQLite Message Store)                       │  │
│  │                                                               │  │
│  │  Table: messages                                              │  │
│  │  ├─ id (UUID)                                                 │  │
│  │  ├─ sender (device ID)                                        │  │
│  │  ├─ payload (JSON/text)                                       │  │
│  │  ├─ lat, lng (location)                                       │  │
│  │  ├─ ttl (time-to-live)                                        │  │
│  │  ├─ hops (current hop count)                                  │  │
│  │  ├─ timestamp                                                 │  │
│  │  └─ delivered (flag)                                          │  │
│  │                                                               │  │
│  │  Operations:                                                  │  │
│  │  • insertMessage() - Store new message                        │  │
│  │  • getPendingMessages() - Get undelivered                     │  │
│  │  • markAsDelivered() - Update status                          │  │
│  │  • deleteExpiredMessages() - Cleanup old                      │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Message Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         MESSAGE PROPAGATION FLOW                         │
└──────────────────────────────────────────────────────────────────────────┘

PHONE A                     PHONE B                     PHONE C
   │                           │                           │
   │ User sends "Help!"        │                           │
   ├─→ Store in DB (hop=0)     │                           │
   │                           │                           │
   │ BLE Advertise ───────────→│                           │
   │←──────────────── BLE Scan │                           │
   │                           │                           │
   │ Wi-Fi Direct Connect ────→│                           │
   │←─────────── Accept Connect│                           │
   │                           │                           │
   │ TCP Socket Open ─────────→│                           │
   │                           │                           │
   │ Send: "Help!" (hop=0) ───→│                           │
   │                           ├─→ Receive message         │
   │                           ├─→ Increment hop (hop=1)   │
   │                           ├─→ Store in DB             │
   │                           │                           │
   │                           │ BLE Advertise ───────────→│
   │                           │←──────────────── BLE Scan │
   │                           │                           │
   │                           │ Wi-Fi Direct Connect ────→│
   │                           │←─────────── Accept Connect│
   │                           │                           │
   │                           │ Send: "Help!" (hop=1) ───→│
   │                           │                           ├─→ Receive
   │                           │                           ├─→ hop=2
   │                           │                           ├─→ Store
   │                           │                           │
   │                           │                           │
   └─── Message propagated 2 hops away from origin ────────┘

TTL = 10 means message can travel up to 10 hops before expiring
```

## Network Topology Examples

### Simple P2P

```
    Phone A ←─────→ Phone B

    • Direct connection
    • 1 hop messages
    • Range: ~100m
```

### Linear Chain

```
    Phone A ←───→ Phone B ←───→ Phone C ←───→ Phone D

    • Message from A reaches D in 3 hops
    • Each phone acts as relay
    • Extended range
```

### Star Network

```
           Phone B
              ↑
              │
    Phone A ←─┼─→ Phone C
              │
              ↓
           Phone D

    • Phone A is hub
    • All messages go through A
    • A can relay between B, C, D
```

### Mesh Network

```
    Phone A ←───→ Phone B
       ↑  ╲         ↑
       │    ╲       │
       │      ╲     │
       ↓        ╲   ↓
    Phone D ←───→ Phone C

    • Multiple paths
    • Redundant connections
    • Message can take any route
    • Most resilient topology
```

## Component Interaction Sequence

```
┌─────────────────────────────────────────────────────────────────────┐
│                   STARTUP SEQUENCE                                  │
└─────────────────────────────────────────────────────────────────────┘

User taps "Start Mesh"
    │
    ▼
JavaScript: meshNetworkService.startMesh()
    │
    ▼
Capacitor Bridge
    │
    ▼
MeshPlugin.startMesh()
    │
    ▼
Bind to MeshService
    │
    ▼
MeshService.startMesh()
    │
    ├─→ Start BLE Advertiser
    │   └─→ Broadcast device UUID
    │
    ├─→ Start BLE Scanner
    │   └─→ Scan for peers every 5 seconds
    │
    ├─→ Start Wi-Fi P2P Discovery
    │   └─→ Enable peer detection
    │
    ├─→ Start TCP Server Socket
    │   └─→ Listen on port 8888
    │
    └─→ Schedule cleanup task
        └─→ Every 60 seconds


┌─────────────────────────────────────────────────────────────────────┐
│              PEER DISCOVERY & MESSAGE SYNC                          │
└─────────────────────────────────────────────────────────────────────┘

BLE Scanner detects peer
    │
    ▼
Notify: onPeerDiscovered(peerId)
    │
    ▼
Initiate Wi-Fi Direct connection
    │
    ├─→ Group formation (5-10 seconds)
    │
    ├─→ Determine group owner
    │   • Owner: Start server socket
    │   • Client: Connect to owner
    │
    ▼
TCP Connection established
    │
    ├─→ Owner: Read pending messages from DB
    ├─→ Owner: Send JSON array to client
    │
    ├─→ Client: Receive messages
    ├─→ Client: Increment hop count
    ├─→ Client: Store new messages in DB
    │
    ├─→ Client: Read pending messages from DB
    ├─→ Client: Send JSON array to owner
    │
    ├─→ Owner: Receive messages
    ├─→ Owner: Increment hop count
    ├─→ Owner: Store new messages in DB
    │
    ▼
Bidirectional sync complete
    │
    ▼
Close connection
    │
    ▼
Notify JavaScript: onMessageReceived()
```

## Data Structures

### DTNMessage Object

```javascript
{
  id: "550e8400-e29b-41d4-a716-446655440000",  // UUID
  sender: "Samsung_a1b2c3d4",                   // Device ID
  payload: "Emergency at location X",          // Message content
  lat: 28.6139,                                 // Latitude
  lng: 77.2090,                                 // Longitude
  ttl: 10,                                      // Max hops allowed
  hops: 2,                                      // Current hop count
  timestamp: 1737552000000,                     // Unix timestamp
  delivered: false                              // Delivery status
}
```

### Peer Object

```javascript
{
  id: "aa:bb:cc:dd:ee:ff",    // Bluetooth MAC address
  lastSeen: 1737552123456,    // Last contact timestamp
  rssi: -45,                  // Signal strength (optional)
  distance: 5.2               // Estimated meters (optional)
}
```

## Permission Requirements

```
╔═══════════════════════════════════════════════════════════════╗
║                    REQUIRED PERMISSIONS                       ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  Android 12+ (API 31+):                                       ║
║  ✓ BLUETOOTH_SCAN          - Scan for nearby devices         ║
║  ✓ BLUETOOTH_CONNECT       - Connect to devices              ║
║  ✓ BLUETOOTH_ADVERTISE     - Advertise device                ║
║  ✓ ACCESS_FINE_LOCATION    - Required for BLE scan           ║
║  ✓ NEARBY_WIFI_DEVICES     - Wi-Fi Direct discovery          ║
║                                                               ║
║  Android 8-11 (API 26-30):                                    ║
║  ✓ BLUETOOTH               - Basic Bluetooth access          ║
║  ✓ BLUETOOTH_ADMIN         - Bluetooth administration        ║
║  ✓ ACCESS_FINE_LOCATION    - Required for BLE scan           ║
║                                                               ║
║  All Versions:                                                ║
║  ✓ ACCESS_WIFI_STATE       - Check Wi-Fi status              ║
║  ✓ CHANGE_WIFI_STATE       - Enable/disable Wi-Fi            ║
║  ✓ CHANGE_NETWORK_STATE    - Modify network settings         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

## Battery Optimization Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│              BATTERY USAGE BREAKDOWN                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  BLE Advertising:         ⚡ Low power (~1-2%/hour)            │
│  BLE Scanning:            ⚡⚡ Medium power (~2-3%/hour)        │
│  Wi-Fi Direct Discovery:  ⚡⚡ Medium power (~2-3%/hour)        │
│  TCP Data Transfer:       ⚡⚡⚡ High power (~3-5%/hour)        │
│  Database Operations:     ⚡ Low power (<1%/hour)              │
│                                                                 │
│  TOTAL ACTIVE:            ⚡⚡⚡⚡ ~8-10%/hour                  │
│  TOTAL IDLE:              ⚡⚡ ~2-3%/hour                       │
│                                                                 │
│  Optimization Techniques:                                       │
│  • Use LOW_POWER scan modes                                     │
│  • Scan intervals (not continuous)                              │
│  • Close connections after sync                                 │
│  • Stop mesh when app backgrounded                              │
│  • Periodic cleanup instead of continuous                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

**This visual guide supplements the technical documentation and helps understand
the mesh network architecture at a glance.**
