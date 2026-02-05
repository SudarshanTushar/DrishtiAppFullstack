<div align="center">

# 🧠 DRISHTI: NEURAL CORE
### *The Central Intelligence & Predictive Engine*

![System Status](https://img.shields.io/badge/System-ONLINE-emerald?style=for-the-badge&logo=statuspage&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.9%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)
![AI Model](https://img.shields.io/badge/Model-STGNN-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)
![API](https://img.shields.io/badge/API-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)

<br />

> **"Data is noise. Intelligence is survival."**
>
> *Processing terrain telemetry, predicting catastrophes, and orchestrating the rescue grid.*

[ **API Docs** ](http://localhost:8000/docs) • [ **Architecture** ](#-system-architecture) • [ **Deploy** ](#-deployment-protocol)

</div>

---

## 📡 System Overview

The **Drishti Backend** serves as the **"Cortex"** of the entire disaster management ecosystem. While the mobile units operate in a decentralized mesh, the Backend aggregates, analyzes, and learns from data when connectivity is available.

It houses the **Pre-Disaster Prediction Engine**, a custom-trained **Spatio-Temporal Graph Neural Network (STGNN)** that analyzes geological data (slope, moisture, rainfall) to forecast landslides with high precision.

### ⚡ Core Capabilities
* **Predictive Forensics:** Real-time inference of landslide risks using PyTorch.
* **Tactical Data Aggregation:** Syncs logs from offline mesh networks when they regain connectivity.
* **Geospatial Intelligence:** Manages critical resource locations (Hospitals, Helipads).
* **Identity Management:** Secure authentication for Command Centre admins.

---

## 🛠️ The Tech Arsenal

Built for speed, scalability, and scientific accuracy.

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Runtime** | ![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white) | Core Logic Execution |
| **API Framework** | **FastAPI / Flask** | High-performance Async Endpoints |
| **AI/ML Engine** | **PyTorch + Scikit-Learn** | Neural Network Inference (STGNN) |
| **Database** | **PostgreSQL / SQLite** | Geo-Spatial Persistent Storage |
| **ORM** | **SQLAlchemy + Alembic** | Database Schema & Migrations |
| **Deployment** | **Gunicorn + Docker** | Production Process Management |

---

## 📂 System Architecture

The backend is modularized into tactical intelligence units:

```bash
backend/
├── 📂 ai_engine/           # 🧠 THE CORTEX (Machine Learning)
│   ├── 📂 data/            # Training Telemetry (CSV)
│   ├── 📂 models/          # Trained Weights (.pth)
│   └── ne_predictor.py     # Inference Logic (The Brain)
│
├── 📂 intelligence/        # 📊 TACTICAL MODULES
│   ├── analytics.py        # Disaster Trends
│   ├── risk_model.py       # Mathematical Risk Calculation
│   ├── iot_network.py      # Sensor Grid Sync
│   └── gis.py              # Map Data Processing
│
├── 📂 core/                # ⚙️ KERNEL
│   ├── routing.py          # Evacuation Path Algorithms
│   └── pipeline.py         # Data Ingestion Pipelines
│
├── 📂 db/                  # 💾 MEMORY
│   ├── models.py           # Database Schemas
│   └── session.py          # Connection Pooling
│
├── main.py                 # 🚀 ENTRY POINT
└── requirements.txt        # Dependency Manifest
```
⚡ Deployment Protocol (Setup Guide)
Follow this sequence to activate the Neural Core on your local machine.

### 1️⃣ Prerequisite Check
Ensure your environment meets the military standards:

Python 3.9+ installed.

Virtual Environment capability.

### 2️⃣ Initialize Virtual Environment
Isolate dependencies to prevent system conflict.

```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```
### 3️⃣ Install Dependencies
Load the tactical libraries.

```bash
pip install -r requirements.txt
```
### 4️⃣ Activate Neural Core
Launch the server. The AI Engine will preload the manual_stgnn.pth model into memory.

```bash
python main.py
```
🟢 Status: Server active at http://localhost:8000 📄 Docs: Swagger UI available at http://localhost:8000/docs

🧠 AI Engine Details (The Science)
The heart of the backend is the ne_predictor.py module.

Model Architecture: Spatio-Temporal Graph Neural Network (STGNN).

Input Features:

🌧️ Rainfall (mm): 7-day cumulative precipitation.

💧 Soil Moisture (%): Saturation levels via satellite telemetry.

⛰️ Slope (degrees): Terrain angle derived from DEM data.

Output: Probability Score (0.0 - 1.0) classification for "Landslide Event".

🔐 Configuration (.env)
Create a .env file in the root directory to secure your perimeter.

Code snippet
# Database Configuration
DATABASE_URL=sqlite:///./drishti.db  # Or PostgreSQL URL

# Security Keys
SECRET_KEY=your_super_secret_military_grade_key
ALGORITHM=HS256

# Mapbox / External APIs
MAPBOX_API_KEY=pk.your_mapbox_token
🚀 Production Deployment
To deploy this unit to DigitalOcean or a VPS, use the included deployment script.

```bash
# Give execution permissions
chmod +x deploy_digitalocean.sh

# Execute Deployment
./deploy_digitalocean.sh
```
This script sets up Gunicorn, Nginx, and Systemd services automatically.

<div align="center">

🛡️ Providing Intelligence. Saving Lives.
Backend Engineered by Team Matrix

Jai Hind 🇮🇳

</div>
