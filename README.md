# 🛡️ DRISHTI (Team Matrix)
### *AI-Powered Offline Disaster Response & Mesh Communication Unit*

![Project Status](https://img.shields.io/badge/Status-Operational-emerald?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-MERN%20%2B%20Python%20AI-blue?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20Web-orange?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-lightgrey?style=for-the-badge)

> **"When all networks fail, DRISHTI works."**
> _Connecting Lives when the Internet Disconnects._

---

## 🌟 Overview

**Drishti** is a revolutionary disaster management system designed for challenging terrains like North-East India. It is not just an app; it is a **Life-Saving Tool** that maintains communication lines even when the internet is down.

Powered by our proprietary **Matrix Kernel**, it establishes an **Offline Mesh Network** using Bluetooth and Wi-Fi Direct, allowing devices to daisy-chain messages during a crisis. Simultaneously, the **Neural Engine** analyzes terrain data to predict landslide and flood risks in real-time.

---

## 🚀 Key Features

### 📡 1. Matrix Mesh Network (No Internet Required)
* **Zero Connectivity Comms:** Functions perfectly when cell towers are down.
* **Encrypted P2P:** Uses a hybrid Bluetooth Low Energy (BLE) & Wi-Fi Direct protocol for secure, local broadcasting.
* **Auto-Healing:** If one node fails, the network automatically reroutes messages.
* _Powered by Native Android Plugin (`MeshPlugin.java`)._

### 🧠 2. Neural AI Predictor
* **Pre-Disaster Warning:** Analyzes satellite data (Rainfall, Soil Moisture, Slope) to predict disaster probability.
* **Live Risk Score:** Returns a real-time safety score (Safe 🟢 to Critical 🔴).
* _Powered by Python AI Engine (`ne_predictor.py`)._

### 🗺️ 3. Interactive Ops Map
* **3D Terrain Visualization:** Mapbox integration for detailed topographical views.
* **Safe Route AI:** Intelligently suggests evacuation routes avoiding danger zones.
* **Resource Tracking:** Real-time visibility of Hospitals, Relief Camps, and Police Stations.

### 🚨 4. One-Tap SOS Beacon
* **Instant Alert:** Broadcasts GPS location and medical status to the entire mesh network with a single tap.
* **Haptic Feedback:** Professional vibration patterns for confirmation in high-stress environments.

---

## 🛠️ Tech Stack

This project is a fusion of cutting-edge technologies:

| Domain | Technologies Used |
| :--- | :--- |
| **Frontend (App)** | React.js, Vite, Tailwind CSS, Framer Motion |
| **Mobile Native** | Capacitor.js, Android Native (Java/Kotlin) for Mesh |
| **Backend API** | Python (FastAPI/Flask), SQLAlchemy, Pydantic |
| **AI/ML Engine** | PyTorch, Scikit-Learn (STGNN Models) |
| **Database** | PostgreSQL / SQLite (Geo-spatial Data) |
| **Mapping** | Mapbox GL JS, Raster DEM Sources |

---

## 📸 Screen Preview

| **The Dashboard** | **Mesh Network** | **AI Prediction** |
| :---: | :---: | :---: |
| _Real-time status monitoring hub_ | _Offline device discovery radar_ | _High-precision risk analysis_ |

---

## ⚡ Installation & Setup Guide

Follow these steps to deploy the system locally.

### Prerequisites
* Node.js (v18+)
* Python (v3.9+)
* Android Studio (For APK build)

### 1️⃣ Clone Repository
```bash
git clone [https://github.com/yourusername/drishti-fullstack.git](https://github.com/yourusername/drishti-fullstack.git)
cd drishti-fullstack
```

### 2️⃣ Backend Setup (The Brain)
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
Server is now live at http://localhost:8000.

### 3️⃣ Frontend Setup (The Interface)
Open a new terminal:

```Bash
cd frontend
npm install
npm run dev
```
App is now live at http://localhost:5173.

### 4️⃣ Android Build (The Real Deal)
To test the Mesh Network features, you must run it on a physical device:

```Bash
cd frontend
npm run build
npx cap sync
npx cap open android
Android Studio will launch. Connect your phone via USB and hit 'Run'.
```
```
📂 Project Structure
Drishti-App/
├── 📂 backend/             # Python Neural Core & API
│   ├── 📂 ai_engine/       # ML Models & Prediction Logic
│   ├── 📂 intelligence/    # Data Analytics Modules
│   └── main.py             # Server Entry Point
│
├── 📂 frontend/            # React + Capacitor App
│   ├── 📂 android/         # Native Java Code (Mesh Plugin)
│   ├── 📂 src/
│   │   ├── 📂 components/  # UI Elements (Glassmorphism)
│   │   ├── 📂 pages/       # Map, SOS, Network Screens
│   │   └── 📂 services/    # Logic Layers
│   └── vite.config.js
│
└── README.md               # Documentation
```
🤝 Contribution
Team Matrix believes in open innovation.

1. Fork the repo.

2. Create your feature branch (git checkout -b feature/AmazingFeature).

3. Commit your changes.

4. Push to the branch.

5. Open a Pull Request.

📜 License
Distributed under the MIT License. See LICENSE for more information.

<div align="center">

Built with ❤️ by Team Matrix for a Safer Tomorrow. Jai Hind 🇮🇳

</div>
