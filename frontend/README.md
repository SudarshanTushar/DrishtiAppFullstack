<div align="center">

# 📱 DRISHTI: TACTICAL INTERFACE
### *The Frontline of Disaster Response & Mesh Communication*

![System Status](https://img.shields.io/badge/System-OPERATIONAL-emerald?style=for-the-badge&logo=statuspage&logoColor=white)
![React](https://img.shields.io/badge/React-18.2-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind](https://img.shields.io/badge/Style-Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Android](https://img.shields.io/badge/Native-Android_Mesh-3DDC84?style=for-the-badge&logo=android&logoColor=white)

<br />

> **"Chaos needs clarity."**
>
> *Visualizing the invisible mesh, mapping the danger, and bridging the gap between victim and rescue.*

[ **Launch Demo** ](http://localhost:5173) • [ **Architecture** ](#-system-architecture) • [ **Deploy** ](#-deployment-protocol)

</div>

---

## 📡 System Overview

The **Drishti Frontend** is a high-performance, offline-first tactical dashboard designed for extreme conditions. It acts as the bridge between the human operator and the complex **Matrix Mesh Kernel** running on the device hardware.

Built with **Glassmorphism principles** and **Cinematic UX**, it ensures high visibility in low-light disaster zones while managing complex data streams from the offline mesh network and AI predictors.

### ⚡ Core Capabilities
* **Offline-First Architecture:** UI functionality remains 100% accessible without an internet connection.
* **Tactical Ops Map:** Real-time 3D terrain rendering using **Mapbox GL**, displaying safe routes and danger zones.
* **Mesh Radar Visualization:** Visual interface for the invisible Bluetooth/Wi-Fi Direct mesh network nodes.
* **Haptic Feedback Engine:** Uses device vibration motors to confirm SOS signals in high-stress environments.

---

## 🛠️ The Tech Arsenal

Engineered for speed, responsiveness, and native hardware access.

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Core Framework** | **React.js (Vite)** | High-performance Component Architecture |
| **Styling Engine** | **Tailwind CSS** | Utility-first, responsive Glassmorphism design |
| **Native Bridge** | **Capacitor.js** | Access to Android Bluetooth, GPS, and Filesystem |
| **Mapping Engine** | **Mapbox GL / React-Map-GL** | 3D Terrain & Geospatial Visualization |
| **Icons & Assets** | **Lucide React** | Lightweight, scalable vector iconography |
| **State Logic** | **React Hooks + Context** | Real-time data synchronization |

---

## 📂 System Architecture

The frontend is structured for modularity and rapid feature deployment:

```bash
frontend/
├── 📂 android/             # 🤖 NATIVE KERNEL (Java/Kotlin)
│   └── .../MeshPlugin.java # The Bluetooth Mesh Logic
│
├── 📂 src/
│   ├── 📂 components/      # 🧩 UI MODULES
│   │   ├── InteractiveMap.jsx  # 3D Terrain Renderer
│   │   ├── RiskMap.jsx         # AI Heatmap Overlay
│   │   └── MeshNetworkTest.jsx # Debugging Tools
│   │
│   ├── 📂 pages/           # 📱 TACTICAL SCREENS
│   │   ├── Dashboard.jsx       # Command Center
│   │   ├── MapView.jsx         # Navigation & Ops
│   │   ├── SOSView.jsx         # Emergency Beacon
│   │   ├── NetworkView.jsx     # Mesh Radar
│   │   └── PredictionView.jsx  # AI Forecasting Interface
│   │
│   ├── 📂 services/        # ⚙️ LOGIC LAYERS
│   │   ├── meshNetworkService.js # Bridge to Native Plugin
│   │   ├── emergencyService.js   # SOS Logic
│   │   └── locationService.js    # GPS Tracking
│   │
│   ├── App.jsx             # Root Logic & Boot Sequence
│   └── main.jsx            # Entry Point
│
├── tailwind.config.js      # Design System Config
└── vite.config.js          # Build Configuration
```
⚡ Deployment Protocol (Setup Guide)
Follow this sequence to activate the Interface on your local machine.

### 1️⃣ Prerequisite Check
Node.js (v18+) installed.

Android Studio (Required only for Mesh Network testing).

### 2️⃣ Install Dependencies
Load the tactical libraries.

```bash
npm install
```
### 3️⃣ Configure Environment
Create a .env file in the frontend root to link with external satellites.

Code snippet
VITE_MAPBOX_TOKEN=pk.your_mapbox_public_key
VITE_BACKEND_URL=http://localhost:8000
### 4️⃣ Activate Interface (Web Mode)
Launch the development server. Note: Mesh features will be simulated in Web Mode.

```bash
npm run dev
```
🟢 Status: Dashboard active at http://localhost:5173

📲 Native Android Build (The Real Deal)
To unlock the full power of the Offline Mesh Network, you must compile the app to Android hardware.

### 1️⃣ Build Web Assets
Compile the React code into static assets.

```bash
npm run build
```
### 2️⃣ Sync with Capacitor
Transfer the web assets to the Android native project.

```bash
npx cap sync
```
### 3️⃣ Launch Android Studio
Open the native project IDE.

```bash
npx cap open android
```
Connect your physical Android device via USB (Debugging ON) and hit the Run button.

🎮 UX Philosophy: "The Glass Cockpit"
The UI is designed to mimic modern military aviation displays:

Dark Mode Native: Reduces eye strain and battery consumption in the field.

High Contrast Alerts: Critical warnings (Landslide Risk, SOS) use distinct color spectrums (Red/Amber).

Micro-Interactions: Buttons respond instantly with visual ripples and haptic feedback to confirm actions.

🚀 Production Build
To generate a production-ready folder for deployment to static hosting (Netlify/Vercel):

```bash
npm run build
```
Output will be located in the dist/ directory.

<div align="center">

🛡️ Visualizing Safety. Connecting the Unconnected.
Frontend Engineered by Team Matrix

Jai Hind 🇮🇳

</div>
