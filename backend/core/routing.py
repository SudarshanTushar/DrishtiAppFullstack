from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import math
import sys

# Import the new "Government Grade" Model
from intelligence.risk_model import LandslidePredictor

router = APIRouter(prefix="/api/v1/core", tags=["AI War Room"])

class RouteRequest(BaseModel):
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float
    rain_intensity: int = 0

@router.post("/analyze-route")
def analyze_route(req: RouteRequest):
    """
    The 'Brain' of the operation.
    1. Calibrates via IMD Data
    2. Runs Random Forest Logic
    3. Returns Telemetry for UI HUD
    """
    predictor = LandslidePredictor.get_instance()
    
    # 1. Run the Prediction Model
    # We sample the midpoint of the route for the "Average Risk"
    mid_lat = (req.start_lat + req.end_lat) / 2
    mid_lng = (req.start_lng + req.end_lng) / 2
    
    prediction = predictor.predict(req.rain_intensity, mid_lat, mid_lng)
    
    # 2. Calculate Distance (Standard Haversine)
    distance_km = _haversine((req.start_lat, req.start_lng), (req.end_lat, req.end_lng))
    
    # 3. Calculate ETA with Risk Penalty
    # If Risk is CRITICAL, speed drops by 70%
    speed_factor = 1.0
    if prediction['risk_level'] == "CRITICAL": speed_factor = 0.3
    elif prediction['risk_level'] == "DANGEROUS": speed_factor = 0.5
    elif prediction['risk_level'] == "MODERATE": speed_factor = 0.8
    
    base_time_mins = (distance_km / 40) * 60 # 40km/h avg speed
    real_time_mins = base_time_mins / speed_factor

    return {
        "status": "SUCCESS",
        "route_analysis": {
            "distance_km": round(distance_km, 2),
            "eta_mins": int(real_time_mins),
            "risk_score": prediction['risk_score'],
            "risk_level": prediction['risk_level'],
            "risk_factors": prediction['telemetry'], # <--- FEEDS THE HUD
            "explanation": prediction['explanation']
        },
        "meta": {
            "model_version": "RF_v2.1_IMD_Calibrated",
            "data_source": "Ministry of Earth Sciences (Open Data)"
        }
    }

def _haversine(coord1, coord2):
    R = 6371
    lat1, lon1 = math.radians(coord1[0]), math.radians(coord1[1])
    lat2, lon2 = math.radians(coord2[0]), math.radians(coord2[1])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c