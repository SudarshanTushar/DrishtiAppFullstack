# 🧠 DRISHTI-NE Backend: AI Routing Engine

> **Real Data AI Routing Engine** - DistilBERT + OSMnx + NetworkX

## 🔥 Architecture Overview

This backend powers the **DRISHTI-NE Disaster Response System** with real AI-driven route analysis and risk assessment.

### Core Technologies

- **FastAPI** - High-performance async Python web framework
- **DistilBERT** - Transformer model for text risk classification (config.json + tokenizer + vocab)
- **OSMnx** - Real OpenStreetMap road network data for Northeast India
- **NetworkX** - Graph algorithms for shortest path calculation
- **PyTorch** - Deep learning inference (CPU optimized)
- **PostgreSQL** - Database with Alembic migrations

## 🌟 Key Features

### 1. **Real AI Risk Assessment**

- DistilBERT model analyzes disaster intelligence reports
- Outputs risk levels: `CLEAR`, `CAUTION`, `BLOCKED` with confidence scores
- Dynamic risk scoring (not hardcoded percentages)
- Model files verified: `config.json`, `tokenizer.json`, `vocab.txt`, `model.safetensors`

### 2. **Geographic Intelligence**

- Real terrain analysis with slope calculation (°)
- Weather data integration (rainfall patterns for NE India)
- Actual POI database (hospitals/shelters in Assam/Meghalaya/Manipur/etc.)
- Seasonal monsoon risk factors

### 3. **Advanced Routing**

- OSMnx downloads real road networks on-demand
- NetworkX computes shortest paths with disaster avoidance
- Intelligent route comparison (standard vs. safe alternative)
- Support for inter-state long-distance routing (150+ km)
- Lazy loading for fast server startup

### 4. **Emergency Response**

- `/nearest_hospital` - Finds closest medical facility from 18+ real NE India hospitals
- Emergency mode prioritization
- Real-time distance and duration calculation using Haversine formula

## 📡 API Endpoints

### Core Endpoints

| Method | Endpoint            | Description                     |
| ------ | ------------------- | ------------------------------- |
| `GET`  | `/`                 | Health check with system status |
| `GET`  | `/system/readiness` | Detailed system diagnostics     |
| `GET`  | `/docs`             | Interactive API documentation   |

### Intelligence Endpoints

| Method | Endpoint            | Description                                   |
| ------ | ------------------- | --------------------------------------------- |
| `GET`  | `/iot/feed`         | Real-time risk index from DistilBERT analysis |
| `GET`  | `/analyze`          | Route analysis (URL params)                   |
| `POST` | `/analyze_route`    | Route analysis (JSON body)                    |
| `POST` | `/nearest_hospital` | Emergency hospital finder                     |

### Request Example: `/analyze_route`

```json
{
  "start_lat": 26.1445,
  "start_lng": 91.7362,
  "end_lat": 25.5788,
  "end_lng": 91.8933,
  "emergency": false
}
```

### Response Structure

```json
{
  "type": "SAFE",
  "confidence_score": 12,
  "reason": "✅ Route is clear. No disasters detected on path.",
  "coordinates": [[91.7362, 26.1445], ...],
  "distance_km": 104.5,
  "duration_min": 145,
  "weather_data": {
    "rainfall_mm": 35,
    "season": "Monsoon"
  },
  "terrain_data": {
    "slope_degrees": 18,
    "terrain_type": "Hills"
  },
  "ai_model_confidence": 0.92,
  "algorithm_metadata": {
    "model_path": "./ai_models/distilbert",
    "using_real_model": true,
    "device": "cpu",
    "algorithm": "OSMnx + NetworkX + DistilBERT AI"
  }
}
```

## 🚀 Setup & Installation

### Prerequisites

- Python 3.11+
- pip (Python package manager)
- 2GB+ RAM (for DistilBERT inference)
- Internet connection (for OSMnx map downloads)

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

**Key packages:**

- `fastapi==0.109.0` - Web framework
- `torch==2.2.0+cpu` - PyTorch CPU-only
- `transformers==4.37.2` - HuggingFace DistilBERT
- `osmnx`, `networkx` - Routing engine
- `sqlalchemy`, `alembic`, `psycopg2-binary` - Database

### 2. Run Development Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Server starts at:** `http://localhost:8000`  
**API Docs:** `http://localhost:8000/docs`

### 3. Database Migration (Optional)

```bash
# Initialize database
alembic upgrade head
```

## 🏗️ Project Structure

```
backend/
├── main.py                   # FastAPI app + AI routing engine
├── requirements.txt          # Python dependencies
├── alembic.ini              # Database migration config
├── ai_models/
│   └── distilbert/          # DistilBERT model files
│       ├── config.json
│       ├── model.safetensors
│       ├── tokenizer.json
│       ├── vocab.txt
│       └── ...
├── alembic/                 # Database migrations
│   ├── env.py
│   └── versions/
├── db/                      # Database models
│   ├── models.py
│   └── session.py
├── intelligence/            # AI modules
│   ├── analytics.py
│   ├── risk_model.py
│   ├── vision.py
│   └── ...
└── core/                    # Core services
    ├── pipeline.py
    ├── routing.py
    └── voice.py
```

## 🌍 Deployment

### DigitalOcean Droplet

```bash
# Use provided deployment script
bash deploy_digitalocean.sh
```

See [DIGITALOCEAN_DEPLOY.md](DIGITALOCEAN_DEPLOY.md) for detailed production setup.

### Environment Variables

```bash
# Optional: Set custom Mapbox token
export MAPBOX_TOKEN="your_token_here"

# Optional: Database URL
export DATABASE_URL="postgresql://user:pass@localhost/drishti"
```

## 🧪 Testing

```bash
# Test health endpoint
curl http://localhost:8000/

# Test route analysis
curl -X POST http://localhost:8000/analyze_route \
  -H "Content-Type: application/json" \
  -d '{
    "start_lat": 26.1445,
    "start_lng": 91.7362,
    "end_lat": 25.5788,
    "end_lng": 91.8933
  }'
```

## 📊 Performance Notes

- **First Request:** 10-15 seconds (OSMnx downloads road network)
- **Subsequent Requests:** 2-5 seconds (graph cached)
- **Long Routes (>150km):** Uses bbox method for reliability
- **Memory Usage:** ~1.5GB with DistilBERT loaded

## 🔧 Troubleshooting

**Issue:** OSMnx timeout errors  
**Solution:** Increase timeout in `main.py`: `ox.settings.timeout = 180`

**Issue:** Model not loading  
**Solution:** Check `ai_models/distilbert/` contains all required files

**Issue:** No route found  
**Solution:** Check coordinates are within OSM coverage area

## 📝 License

Part of the DRISHTI-NE project. For educational and disaster response purposes.
