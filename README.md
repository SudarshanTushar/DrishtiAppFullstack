<div align="center">

# 🛡️ DRISHTI (Team Matrix)
### *AI-Powered Tactical Disaster Response & Mesh Communication Grid*

![Version](https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge&logo=github)
![Status](https://img.shields.io/badge/System-OPERATIONAL-emerald?style=for-the-badge&logo=statuspage)
![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20Web-orange?style=for-the-badge&logo=android)
![Focus](https://img.shields.io/badge/Region-North_East_India-red?style=for-the-badge&logo=google-maps)
![License](https://img.shields.io/badge/License-MIT-lightgrey?style=for-the-badge)

<br />

> **"In the silence of the storm, DRISHTI speaks."**
>
> *When cellular towers fall and the grid goes dark, we connect the disconnected.*

[ **View Demo** ](http://localhost:5173) • [ **Report Bug** ](https://github.com/yourusername/drishti-fullstack/issues) • [ **Request Feature** ](https://github.com/yourusername/drishti-fullstack/issues)

</div>

---

## 📡 The Mission (Overview)

**Drishti** is not just an application; it is a **military-grade survival tool** engineered for the challenging terrains of North-East India. It bridges the critical gap between disaster onset and relief arrival.

By fusing **Edge AI** with **Offline Mesh Networking**, Drishti creates a decentralized communication web. Devices automatically discover each other using Bluetooth and Wi-Fi Direct, forming a digital lifeline that transmits SOS signals, medical data, and evacuation routes without a single byte of internet data.

### ⚡ Core Capabilities
* **Zero-Internet Communication:** Proprietary Matrix Kernel for offline P2P data transfer.
* **Predictive Intelligence:** Neural Engine analyzing soil/slope telemetry for landslide forecasting.
* **Tactical Ops Map:** 3D Terrain visualization for safe route planning.

---

## 🚀 Technological Arsenal (Features)

### 1. 🕸️ Matrix Mesh Kernel (The Backbone)
* **Ad-Hoc Networking:** Uses a hybrid `P2P_CLUSTER` strategy combining **Bluetooth Low Energy (BLE)** and **Wi-Fi Direct**.
* **High-Power Discovery:** Custom-tuned `MeshPlugin.java` for maximum signal range in dense forests or debris.
* **Auto-Healing:** If a node (phone) disconnects, the network intelligently reroutes the data packet through the next available device.

### 2. 🧠 Neural AI Engine (The Brain)
* **Pre-Disaster Forensics:** Analyzes satellite datasets (Rainfall `mm`, Soil Moisture `%`, Slope `deg`) using STGNN models.
* **Real-Time Risk Scoring:** Generates a dynamic safety score (0-100) for every coordinate in the North-East sector.
* **Early Warning System:** Push notifications for "High Probability" landslide zones before they occur.

### 3. 🗺️ Tactical Ops Map (The Eyes)
* **3D Topography:** Mapbox integration rendering complex terrain elevation data.
* **Resource Triangulation:** Live tracking of Hospitals, Police Stations, and Relief Camps relative to the user.
* **Safe Route AI:** Algorithmic pathfinding that avoids Red Zones (High Risk) and guides users to safety.

### 4. 🚨 One-Tap SOS Beacon (The Lifeline)
* **Broadcast Protocol:** A single tap floods the mesh network with the user's GPS coordinates, blood group, and medical status.
* **Haptic Confirmation:** Cinematic vibration patterns confirm signal transmission in high-stress, low-visibility environments.

---

## 🛠️ The Tech Stack

Built with a fusion of next-gen technologies for speed, reliability, and scale.

| Domain | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | ![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB) ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white) | Glassmorphism UI, Framer Motion Animations |
| **Mobile Core** | ![Capacitor](https://img.shields.io/badge/Capacitor-1199EE?style=flat-square&logo=capacitor&logoColor=white) ![Android](https://img.shields.io/badge/Android_Native-3DDC84?style=flat-square&logo=android&logoColor=white) | Bridge to Native Hardware (Bluetooth/WiFi) |
| **Backend API** | ![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white) ![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat-square&logo=fastapi) | High-Performance Async Server |
| **AI/ML** | ![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=flat-square&logo=pytorch&logoColor=white) ![Scikit](https://img.shields.io/badge/scikit_learn-F7931E?style=flat-square&logo=scikit-learn&logoColor=white) | Risk Prediction Models |
| **Database** | ![Postgres](https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white) ![SQLite](https://img.shields.io/badge/SQLite-07405E?style=flat-square&logo=sqlite&logoColor=white) | Geo-Spatial Data Storage |
| **Mapping** | ![Mapbox](https://img.shields.io/badge/Mapbox-000000?style=flat-square&logo=mapbox&logoColor=white) | Raster DEM Sources & Navigation |

---

## 📸 System Intel (Screenshots)

| **Tactical Dashboard** | **Mesh Radar** | **AI Risk Analysis** |
| :---: | :---: | :---: |
| ![Dashboard](https://github.com/SudarshanTushar/DrishtiAppFullstack/blob/main/assets/Screenshots/Dashboard.png) | ![Mesh](https://github.com/SudarshanTushar/DrishtiAppFullstack/blob/main/assets/Screenshots/Mesh.png) | ![AI](https://github.com/SudarshanTushar/DrishtiAppFullstack/blob/main/assets/Screenshots/RiskAi.png) |
| *Real-time status monitoring* | *Offline device discovery* | *High-precision risk analysis* |

---

## ⚡ Deployment Protocol (Installation)

Follow these steps to deploy the system locally.

### 📋 Prerequisites
* **Node.js** (v18+)
* **Python** (v3.9+)
* **Android Studio** (For APK compilation)
* **Mapbox Token** (For map services)

### 1️⃣ Initialize Base
```bash
git clone [https://github.com/yourusername/drishti-fullstack.git](https://github.com/yourusername/drishti-fullstack.git)
cd drishti-fullstack
```

### 2️⃣ Activate Neural Core (Backend)
The brain of the system.

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
python main.py
```
🟢 System Status: Neural Core active at http://localhost:8000

### 3️⃣ Launch Interface (Frontend)
The pilot's cockpit. Open a new terminal.

```bash
cd frontend
npm install
npm run dev
```
🟢 System Status: Interface active at http://localhost:5173

### 4️⃣ Compile Hardware Link (Android)
Critical: To test the Mesh Network, you must run this on a physical Android device.

```bash
cd frontend
npm run build
npx cap sync
npx cap open android
```
Android Studio will launch. Connect your device via USB (Debugging ON) and hit 'Run'.

```📂 System Blueprint
Drishti-App/
├── 📂 backend/               # 🧠 THE BRAIN (Python)
│   ├── 📂 ai_engine/         # ML Models & Prediction Logic
│   │   └── ne_predictor.py   # Landslide Prediction Algo
│   ├── 📂 intelligence/      # Data Analytics Modules
│   └── main.py               # Server Entry Point
│
├── 📂 frontend/              # 🎮 THE FACE (React + Vite)
│   ├── 📂 android/           # 🤖 THE MUSCLE (Native Code)
│   │   └── .../MeshPlugin.java # The High-Power Mesh Logic
│   ├── 📂 src/
│   │   ├── 📂 components/    # Glassmorphism UI Kits
│   │   ├── 📂 pages/         # 
│   │   │   ├── MapView.jsx   # 3D Terrain Map
│   │   │   ├── SOSView.jsx   # Emergency Beacon
│   │   │   └── NetworkView.jsx # Mesh Visualization
│   │   └── 📂 services/      # Logic Layers
│   └── vite.config.js
│
└── README.md                 # Briefing Document
```
🤝 Alliance (Contributing)
Team Matrix operates on open innovation.

1. Fork the repository.

2. Create your Feature Branch (git checkout -b feature/AmazingFeature).

3. Commit your changes (git commit -m 'Add some AmazingFeature').

4. Push to the branch (git push origin feature/AmazingFeature).

5. Open a Pull Request.

📜 Legal
Distributed under the MIT License. See LICENSE for more information.

<div align="center">

🛡️ Built for Resilience. Built for Life.
Made with ❤️ by Team Matrix

Jai Hind 🇮🇳

</div>
