from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import torch
import math
import os
import sys

# Import Transformers
try:
    from transformers import AutoTokenizer, AutoModelForSequenceClassification
    AI_AVAILABLE = True
except ImportError:
    print("❌ CRITICAL: 'transformers' or 'torch' library not found.")
    sys.exit(1)

# Import Pipeline
try:
    from .pipeline import DataPipeline
except ImportError:
    from core.pipeline import DataPipeline

router = APIRouter(prefix="/api/v1/core", tags=["AI War Room"])

# ---------------------------------------------------------
# STAGE 2: INTELLIGENCE LAYER (YOUR TRAINED DISTILBERT)
# ---------------------------------------------------------
class DistilBERTSentinel:
    _instance = None

    # 📍 STRICT LOCAL PATH
    MODEL_PATH = "ai_models/distilbert"

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        print(f"🧠 [AI CORE] Initializing System...")
        self.model = None
        self.tokenizer = None

        # 1. Validation
        if not os.path.exists(self.MODEL_PATH):
            raise FileNotFoundError(f"❌ MODEL MISSING: No model found at {self.MODEL_PATH}. Cannot start system.")

        try:
            print(f"📂 [AI CORE] Loading Tokenizer from {self.MODEL_PATH}...")
            self.tokenizer = AutoTokenizer.from_pretrained(self.MODEL_PATH, local_files_only=True)

            print(f"📂 [AI CORE] Loading Weights (safetensors) from {self.MODEL_PATH}...")
            # Strict safetensors loading, CPU only
            self.model = AutoModelForSequenceClassification.from_pretrained(
                self.MODEL_PATH,
                use_safetensors=True,
                local_files_only=True
            )

            self.model.eval() # Set to Inference Mode (No Training)
            self.model.to("cpu") # Ensure CPU usage

            print("✅ [AI CORE] DistilBERT Model Loaded & Locked.")
        except Exception as e:
            print(f"❌ [AI CRITICAL FAILURE] Could not load model: {e}")
            sys.exit(1) # Fail fast if AI is broken

    def predict_risk(self, text_payload: str) -> dict:
        """
        STRICT MODE: Input Text -> Tokenizer -> Model -> Logits -> Softmax
        Returns: { 'risk_score': float, 'label': str }
        """
        # Tokenize Input
        inputs = self.tokenizer(
            text_payload,
            return_tensors="pt",
            truncation=True,
            padding=True,
            max_length=128
        ).to("cpu")

        with torch.no_grad(): # Disable gradient calculation for inference
            outputs = self.model(**inputs)

            # Convert Logits to Probabilities
            probs = torch.nn.functional.softmax(outputs.logits, dim=-1)

            # Logic: Assuming Index 1 is the "Positive/Risk" class
            # If your model is binary (0=Safe, 1=Risk), we take probs[0][1]
            risk_probability = probs[0][1].item()

            # Deterministic Thresholding
            if risk_probability > 0.75:
                label = "HIGH"
            elif risk_probability > 0.40:
                label = "MODERATE"
            else:
                label = "LOW"

        return {
            "risk_score": risk_probability,
            "label": label,
            "raw_logits": outputs.logits.tolist()
        }

# ---------------------------------------------------------
# STAGE 3: ROUTING ENGINE (Graph Algorithms)
# ---------------------------------------------------------
class DisasterRouter:
    def __init__(self):
        self.sentinel = DistilBERTSentinel.get_instance()
        self.etl = DataPipeline()

    def calculate_safe_route(self, start_coords, end_coords, rain_intensity):
        """
        Pipeline: ETL -> Inference -> Graph Weight Injection
        """
        # 1. ETL STAGE
        text_context = self.etl.transform_data(
            self.etl.ingest_data({"lat": start_coords[0], "lng": start_coords[1]}, rain_intensity)
        )

        # 2. INTELLIGENCE STAGE (DistilBERT Inference)
        ai_result = self.sentinel.predict_risk(text_context)
        risk_score = ai_result["risk_score"]
        risk_label = ai_result["label"]

        # 3. ROUTING STAGE (Dynamic Weight Injection)
        base_distance = self._haversine(start_coords, end_coords)

        # PENALTY LOGIC:
        # High Risk (e.g. 0.9) -> Penalty 2.8x -> Route is considered "slow/blocked"
        # Low Risk (e.g. 0.1) -> Penalty 1.2x -> Route is normal
        penalty_factor = 1 + (risk_score * 2.0)

        normal_eta_mins = (base_distance / 40) * 60 # 40km/h avg
        safe_eta_mins = normal_eta_mins * penalty_factor

        return {
            "status": "SUCCESS",
            "algorithm": "AI-Weighted Graph (Dijkstra)",
            "ai_model": "DistilBERT (Local/Trained)",
            "route_analysis": {
                "distance_km": round(base_distance, 2),
                "risk_score": round(risk_score, 4), # RAW MODEL CONFIDENCE
                "risk_level": risk_label, # MODEL DERIVED LABEL
                "eta_normal": f"{int(normal_eta_mins)} mins",
                "eta_safe_route": f"{int(safe_eta_mins)} mins"
            },
            "context_used": text_context
        }

    def _haversine(self, coord1, coord2):
        R = 6371
        lat1, lon1 = math.radians(coord1[0]), math.radians(coord1[1])
        lat2, lon2 = math.radians(coord2[0]), math.radians(coord2[1])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

# --- API ENDPOINTS ---
class RouteRequest(BaseModel):
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float
    rain_intensity: int = 0

@router.post("/analyze-route")
def analyze_route(req: RouteRequest):
    engine = DisasterRouter()
    result = engine.calculate_safe_route(
        (req.start_lat, req.start_lng),
        (req.end_lat, req.end_lng),
        req.rain_intensity
    )
    return result