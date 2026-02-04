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

# --- 2. LOAD TRAINED MODELS ---
xgb_model = None

def load_models():
    global xgb_model
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

# --- 3. HELPER: Haversine Distance Calculation (Real Math) ---
def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) * math.sin(dlat / 2) +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) * math.sin(dlon / 2))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

# --- 4. HELPER: Smart Mock Environment Data ---
def get_mock_env_data(lat, lng, route_type="valley"):
    # Ab random nahi, logical data banayenge
    if route_type == "mountain":
        # Mountain mein zyada slope aur risk
        rainfall = random.uniform(100, 350)  # Heavy rain
        moisture = random.uniform(60, 95)
        slope = random.uniform(40, 75)       # Steep slope
        landslide_history = 1
    else:
        # Valley mein kam risk
        rainfall = random.uniform(20, 150)   # Less rain
        moisture = random.uniform(30, 70)
        slope = random.uniform(5, 25)        # Gentle slope
        landslide_history = 0
    return [rainfall, moisture, slope, landslide_history]

# ==========================================
# 🛡️ FUNCTION 1: LIFE SAVIOUR ROUTING (FIXED)
# ==========================================
def find_safest_route(start_lat, start_lng, end_lat, end_lng):
    # 1. Calculate Real Aerial Distance
    aerial_dist = calculate_distance(start_lat, start_lng, end_lat, end_lng)
    
    # 2. Define Routes with Logic based on Aerial Distance
    # Mountain Route: Shorter but riskier (Aerial * 1.2 curvy factor)
    dist_mountain = round(aerial_dist * 1.2, 1)
    
    # Valley Route: Longer but safer (Aerial * 1.5 curvy factor)
    dist_valley = round(aerial_dist * 1.5, 1)

    routes = [
        {
            "id": "route_mountain",
            "name": "Mountain Shortcut (High Risk)",
            "type": "mountain",
            "coordinates": _interpolate_points((start_lat, start_lng), (end_lat, end_lng), 20, 0.05),
            "distance_km": dist_mountain,
            "avg_speed": 30 # km/h (Slower on mountains)
        },
        {
            "id": "route_valley",
            "name": "Valley Highway (Safest)",
            "type": "valley",
            "coordinates": _interpolate_points((start_lat, start_lng), (end_lat, end_lng), 30, -0.08),
            "distance_km": dist_valley,
            "avg_speed": 50 # km/h (Faster on highway)
        }
    ]

    analyzed_routes = []

    for route in routes:
        segment_risks = []
        max_segment_risk = 0
        total_rainfall = 0
        
        for point in route['coordinates']:
            # Get logical data based on route type
            features = get_mock_env_data(point[0], point[1], route['type'])
            total_rainfall += features[0]
            
            # Predict Risk (Model or Logical Fallback)
            risk_score = 0
            if xgb_model:
                try:
                    input_vector = np.array([features]).reshape(1, -1)
                    if hasattr(xgb_model, "predict_proba"):
                        risk_score = xgb_model.predict_proba(input_vector)[0][1]
                    else:
                        risk_score = float(xgb_model.predict(input_vector)[0])
                except:
                    # Fallback if model fails
                    risk_score = 0.85 if route['type'] == 'mountain' else 0.2
            else:
                # Manual Smart Logic
                # Normalize logic: Mountain is naturally riskier
                base_risk = 0.6 if route['type'] == 'mountain' else 0.1
                rain_factor = (features[0] / 300) * 0.4  # Max 0.4 from rain
                risk_score = base_risk + rain_factor
            
            # Cap risk between 0 and 1
            risk_score = max(0.0, min(1.0, risk_score))
            
            segment_risks.append(risk_score)
            max_segment_risk = max(max_segment_risk, risk_score)

        avg_risk = sum(segment_risks) / len(segment_risks)
        avg_rainfall = total_rainfall / len(route['coordinates'])

        # Logical Status Determination
        if max_segment_risk > 0.75: 
            status = "DANGER"
        elif avg_risk > 0.4: 
            status = "CAUTION"
        else: 
            status = "SAFE"

        # Calculate ETA (Time = Distance / Speed)
        hours = int(route['distance_km'] / route['avg_speed'])
        minutes = int(((route['distance_km'] / route['avg_speed']) - hours) * 60)
        eta_str = f"{hours}h {minutes}m"

        analyzed_routes.append({
            "id": route['id'],
            "name": route['name'],
            "risk_level": status,
            "risk_score": round(avg_risk, 2),
            "coordinates": route['coordinates'],
            "eta": eta_str,
            "distance_km": route['distance_km'],
            "weather_data": {
                "rainfall_mm": int(avg_rainfall),
                "landslide_prob": int(max_segment_risk * 100)
            },
            "recommendation": "High landslide risk! Avoid this route." if status == "DANGER" else "Safe for travel."
        })

    # Sort: Safest route first (Lowest risk score)
    analyzed_routes.sort(key=lambda x: x['risk_score'])
    
    return {
        "best_route": analyzed_routes[0],
        "alternatives": analyzed_routes[1:]
    }

# ==========================================
# 🧠 FUNCTION 2: SINGLE POINT PREDICTION (ROBUST)
# ==========================================
def predict_ne_risk(data):
    """
    Used for manual point checks via /api/predict-ne
    """
    try:
        rainfall = float(data.get('rainfall', 0) or 0)
        moisture = float(data.get('soil_moisture', 0) or 0)
        slope = float(data.get('slope', 0) or 0)
        
        features = [rainfall, moisture, slope, 0] 
        risk_score = 0
        model_used = False

        # Try AI Model
        if xgb_model:
            try:
                input_vector = np.array([features]).reshape(1, -1)
                if hasattr(xgb_model, "predict_proba"):
                    risk_score = float(xgb_model.predict_proba(input_vector)[0][1])
                else:
                    risk_score = float(xgb_model.predict(input_vector)[0])
                
                if not math.isnan(risk_score):
                    model_used = True
            except:
                pass

        # Manual Logic (If model missing/failed)
        if not model_used:
            norm_rain = min(rainfall, 300) / 300.0
            norm_slope = min(slope, 60) / 60.0
            norm_moisture = min(moisture, 100) / 100.0
            
            # Weighted Formula
            risk_score = (norm_rain * 0.5) + (norm_slope * 0.3) + (norm_moisture * 0.2)
            
            # Boost for dangerous combinations
            if rainfall > 150 and slope > 30:
                risk_score += 0.2

        risk_score = max(0.01, min(risk_score, 0.99))

        return {
            "risk_score": round(risk_score, 2),
            "risk_level": "HIGH" if risk_score > 0.6 else "LOW",
            "rainfall": rainfall
        }
    except Exception as e:
        return {"risk_score": 0.5, "risk_level": "ERROR", "error": str(e)}

# --- Helper ---
def _interpolate_points(p1, p2, num_points=10, deviation=0.0):
    lats = np.linspace(p1[0], p2[0], num_points)
    lngs = np.linspace(p1[1], p2[1], num_points)
    path = []
    for i in range(num_points):
        # Create a slight curve
        curve = math.sin(i / num_points * math.pi) * deviation
        path.append([lats[i] + curve, lngs[i] + curve])
    return path