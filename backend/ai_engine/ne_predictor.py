import torch
import torch.nn as nn
import numpy as np
import pandas as pd
import os
import math
import random
import joblib

# --- 1. CONFIG ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
XGB_MODEL_PATH = os.path.join(BASE_DIR, "models", "ne_risk_model.pkl")
GNN_MODEL_PATH = os.path.join(BASE_DIR, "models", "manual_stgnn.pth")

# --- 2. LOAD TRAINED MODELS ---
xgb_model = None
gnn_model = None

def load_models():
    global xgb_model, gnn_model
    print("🔄 Loading AI Models...")
    
    try:
        if os.path.exists(XGB_MODEL_PATH):
            xgb_model = joblib.load(XGB_MODEL_PATH)
            print("✅ XGBoost Risk Model Loaded")
        else:
            print(f"⚠️ XGBoost Model not found at {XGB_MODEL_PATH}")
    except Exception as e:
        print(f"❌ Error loading XGBoost: {e}")

load_models()

# --- 3. HELPER: Mock Data Generator ---
def get_mock_env_data(lat, lng, route_type="valley"):
    rainfall = random.uniform(50, 300) # mm
    moisture = random.uniform(30, 95)  # %
    if route_type == "mountain":
        slope = random.uniform(30, 60)
        landslide_history = 1
    else:
        slope = random.uniform(0, 15)
        landslide_history = 0
    return [rainfall, moisture, slope, landslide_history]

# ==========================================
# 🛡️ FUNCTION 1: LIFE SAVIOUR ROUTING (NEW)
# ==========================================
def find_safest_route(start_lat, start_lng, end_lat, end_lng):
    print(f"🛡️ AI Scanning Routes from {start_lat},{start_lng} to {end_lat},{end_lng}...")

    # Mock Routes
    routes = [
        {
            "id": "route_mountain",
            "name": "Mountain Shortcut (High Risk)",
            "type": "mountain",
            "coordinates": _interpolate_points((start_lat, start_lng), (end_lat, end_lng), 20, 0.05),
            "eta": "2h 30m",
            "distance_km": 85
        },
        {
            "id": "route_valley",
            "name": "Valley Highway (Safest)",
            "type": "valley",
            "coordinates": _interpolate_points((start_lat, start_lng), (end_lat, end_lng), 30, -0.08),
            "eta": "4h 15m",
            "distance_km": 120
        }
    ]

    analyzed_routes = []

    for route in routes:
        segment_risks = []
        max_segment_risk = 0
        
        for point in route['coordinates']:
            features = get_mock_env_data(point[0], point[1], route['type'])
            
            # Predict Risk
            risk_score = 0.5
            if xgb_model:
                try:
                    input_vector = np.array([features]).reshape(1, -1)
                    if hasattr(xgb_model, "predict_proba"):
                        risk_score = xgb_model.predict_proba(input_vector)[0][1]
                    else:
                        risk_score = float(xgb_model.predict(input_vector)[0])
                except:
                    risk_score = 0.8 if features[0] > 150 else 0.2
            else:
                # Manual Fallback
                risk_score = 0.85 if features[0] > 200 else 0.15
            
            segment_risks.append(risk_score)
            max_segment_risk = max(max_segment_risk, risk_score)

        avg_risk = sum(segment_risks) / len(segment_risks)
        
        if max_segment_risk > 0.8: 
            status = "DANGER"
        elif avg_risk > 0.4: 
            status = "CAUTION"
        else: 
            status = "SAFE"

        analyzed_routes.append({
            "id": route['id'],
            "name": route['name'],
            "risk_level": status,
            "risk_score": round(avg_risk, 2),
            "coordinates": route['coordinates'],
            "eta": route['eta'],
            "distance_km": route['distance_km'],
            "weather_data": {
                "rainfall_mm": int(random.uniform(50, 250)),
                "landslide_prob": int(max_segment_risk * 100)
            },
            "recommendation": "Avoid travel." if status == "DANGER" else "Safe for travel."
        })

    analyzed_routes.sort(key=lambda x: x['risk_score'])
    
    return {
        "best_route": analyzed_routes[0],
        "alternatives": analyzed_routes[1:]
    }

# ==========================================
# 🧠 FUNCTION 2: SINGLE POINT PREDICTION (MISSING FIX)
# ==========================================
def predict_ne_risk(data):
    """
    Used for manual point checks via /api/predict-ne
    """
    rainfall = float(data.get('rainfall', 0))
    moisture = float(data.get('soil_moisture', 0))
    slope = float(data.get('slope', 0))
    
    features = [rainfall, moisture, slope, 0] # Default history 0
    
    risk_score = 0
    if xgb_model:
        try:
            input_vector = np.array([features]).reshape(1, -1)
            risk_score = float(xgb_model.predict(input_vector)[0])
        except:
            risk_score = 0.5
    else:
        risk_score = 0.9 if rainfall > 200 else 0.1

    return {
        "risk_score": risk_score,
        "risk_level": "HIGH" if risk_score > 0.7 else "LOW",
        "rainfall": rainfall
    }

# --- Helper ---
def _interpolate_points(p1, p2, num_points=10, deviation=0.0):
    lats = np.linspace(p1[0], p2[0], num_points)
    lngs = np.linspace(p1[1], p2[1], num_points)
    path = []
    for i in range(num_points):
        curve = math.sin(i / num_points * math.pi) * deviation
        path.append([lats[i] + curve, lngs[i] + curve])
    return path