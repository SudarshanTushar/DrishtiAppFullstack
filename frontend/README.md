# 🎯 DRISHTI-NE Frontend: Disaster Response Interface

> **Progressive Web App** - React + Vite + Capacitor for Cross-Platform Deployment

## 🔥 Overview

The DRISHTI-NE frontend provides a comprehensive disaster response interface for both **citizens** and **government command centers**. Built with React and designed for offline-first operation with mesh networking capabilities.

## 🛠️ Tech Stack

- **Framework:** React 18.2 + Vite 5.0
- **Routing:** React Router DOM v6
- **Styling:** Tailwind CSS 3.4 + clsx + tailwind-merge
- **Maps:** Mapbox GL 3.1 + React-Map-GL 7.1 + Leaflet 1.9
- **Icons:** Lucide React
- **PDF:** jsPDF + jsPDF-AutoTable
- **Mobile:** Capacitor 5.7 (Android/iOS)
- **Capacitor Plugins:**
  - Geolocation, Filesystem, Haptics
  - App, Share

## 🌟 Key Features

### 1. **Citizen Dashboard** (`Dashboard.jsx`)

- Real-time risk assessment display
- Voice command interface with AI fallback
- Mesh network connectivity status
- Quick SOS access

### 2. **Interactive Map View** (`MapView.jsx`)

- AI-powered route analysis with risk visualization
- Emergency hospital finder (18+ real NE India locations)
- 3D terrain toggle
- Voice navigation feedback
- PDF route report generation
- Backend connectivity monitoring

### 3. **Admin Command Center** (`AdminPanel.jsx`, `CommandDashboard.jsx`)

- Biometric authentication simulation
- Live incident management
- SITREP (Situation Report) generation
- Drone reconnaissance interface (UI demo)
- Authority approval workflows

### 4. **Offline Network View** (`NetworkView.jsx`, `OfflineNetworkScreen.jsx`)

- P2P peer discovery simulation
- Bluetooth mesh network status
- DTN (Delay-Tolerant Networking) message relay
- Signal strength monitoring

### 5. **Emergency SOS** (`SOSView.jsx`)

- One-tap emergency broadcast
- Location sharing
- Profile "Digital Dog Tag" for rescue teams

## 📁 Project Structure

```
frontend/
├── src/
│   ├── App.jsx                   # Main app shell with boot sequence
│   ├── main.jsx                  # React entry point
│   ├── i18n.jsx                  # Multi-language support
│   ├── config.js                 # API endpoints configuration
│   │
│   ├── pages/                    # Route components
│   │   ├── Dashboard.jsx         # Citizen main screen
│   │   ├── MapView.jsx           # AI routing interface
│   │   ├── SOSView.jsx           # Emergency screen
│   │   ├── NetworkView.jsx       # Mesh network status
│   │   ├── AdminPanel.jsx        # Admin login
│   │   ├── CommandDashboard.jsx  # Government C&C
│   │   ├── SettingsView.jsx      # App settings
│   │   └── HomeScreen.jsx        # Landing page
│   │
│   ├── services/                 # Business logic layer
│   │   ├── aiRoutingService.js   # Backend route API calls
│   │   ├── voiceService.js       # Voice AI with fallback
│   │   ├── meshNetworkService.js # Bluetooth mesh logic
│   │   ├── peerDiscoveryService.js # P2P simulation
│   │   ├── emergencyService.js   # SOS handling
│   │   ├── locationService.js    # GPS utilities
│   │   ├── profileService.js     # User data
│   │   ├── offlineService.js     # Offline storage
│   │   ├── ServiceManager.js     # Service orchestration
│   │   └── ...                   # Other services
│   │
│   ├── components/               # Reusable UI components
│   │   ├── InteractiveMap.jsx
│   │   ├── MapboxMap.jsx
│   │   ├── RiskMap.jsx
│   │   └── MeshNetworkTest.jsx
│   │
│   ├── layouts/
│   │   └── AppShell.jsx          # Common layout wrapper
│   │
│   ├── hooks/
│   │   └── useMeshNetwork.js     # Mesh network hook
│   │
│   └── assets/                   # Images, icons, etc.
│
├── android/                      # Capacitor Android project
├── public/                       # Static assets
├── package.json
├── vite.config.js               # Vite configuration
├── tailwind.config.js           # Tailwind CSS config
├── capacitor.config.json        # Capacitor config
└── README.md
```

## 🚀 Development Setup

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

**App runs at:** `http://localhost:5173`

### 3. Build for Production

```bash
npm run build
```

Output: `dist/` folder

### 4. Preview Production Build

```bash
npm run preview
```

## 📱 Mobile Development (Capacitor)

### Setup Android

```bash
# Install Capacitor CLI globally (optional)
npm install -g @capacitor/cli

# Sync web assets to Android
npx cap sync android

# Open in Android Studio
npx cap open android
```

### Build Android APK

1. Open in Android Studio: `npx cap open android`
2. Build → Build Bundle(s) / APK(s) → Build APK(s)
3. APK location: `android/app/build/outputs/apk/debug/`

### iOS Setup (macOS only)

```bash
npx cap sync ios
npx cap open ios
```

## ⚙️ Configuration

### Backend API Endpoint ([src/config.js](src/config.js))

```javascript
export const API_BASE_URL = "https://your-backend.com";
// or for local: "http://localhost:8000"
```

### Mapbox Token ([src/pages/MapView.jsx](src/pages/MapView.jsx))

Update `mapboxAccessToken` with your Mapbox API key.

## 🎨 Key Technologies Explained

### Vite Configuration

- **Base: `./`** - Critical for Android relative paths
- **Source maps enabled** - Better debugging on mobile
- **Minify disabled** - Prevents crashes during demos
- **Mapbox GL optimized** - Prevents "global is not defined" errors

### Capacitor Plugins Used

- **Geolocation** - GPS location for routing
- **Haptics** - Vibration feedback for SOS
- **Filesystem** - Offline data storage
- **Share** - Route sharing functionality

### Service Layer Architecture

- **ServiceManager** - Centralized service initialization
- **PlatformGuard** - Detects mobile vs. browser environment
- **NetworkManager** - Monitors connectivity
- **HardwareManager** - Hardware abstraction layer

## 🧪 Testing

### Desktop Browser Testing

All features work in Chrome/Firefox/Edge with simulation modes:

- Mesh networking simulated with random peer discovery
- Voice commands use browser Speech Synthesis API
- Geolocation uses browser API with fallback

### Mobile Testing

Best tested on actual Android device for:

- Real Bluetooth Low Energy mesh
- Accurate GPS
- Haptic feedback
- Native performance

## 📊 Performance Notes

- **First Load:** ~2-3 seconds (includes boot animation)
- **Route Calculation:** 2-5 seconds (backend dependent)
- **Map Rendering:** Instant with Mapbox WebGL
- **Bundle Size:** ~2MB (minified production build)

## 🐛 Troubleshooting

**Issue:** White screen on Android  
**Solution:** Ensure `base: './'` in `vite.config.js`

**Issue:** Maps not loading  
**Solution:** Check Mapbox token, verify `optimizeDeps` includes mapbox-gl

**Issue:** Voice commands not working  
**Solution:** Browser must support Web Speech API (Chrome/Edge supported)

**Issue:** "Module not found" errors  
**Solution:** Run `npm install` again, clear `node_modules` and reinstall

## 🌍 Multi-Language Support

Currently supports:

- English (en)
- Hindi (hi)
- Assamese (as)

Add more in [src/i18n.jsx](src/i18n.jsx)

## 📝 NPM Scripts

| Command                | Description                   |
| ---------------------- | ----------------------------- |
| `npm run dev`          | Start dev server (hot reload) |
| `npm run build`        | Production build              |
| `npm run preview`      | Preview production build      |
| `npx cap sync`         | Sync web assets to mobile     |
| `npx cap open android` | Open Android Studio           |

## 🔒 Security Notes

- All API calls go through service layer for centralized error handling
- Offline data stored in browser localStorage (unencrypted)
- Backend uses CORS middleware for cross-origin requests
- No sensitive credentials stored in frontend code

## 📄 License

Part of the DRISHTI-NE project. For educational and disaster response purposes.
