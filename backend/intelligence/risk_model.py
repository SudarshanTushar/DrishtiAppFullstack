import joblib
import os
import numpy as np

class RandomForestPredictor:
    def __init__(self):
        self.model_path = "intelligence/landslide_model.pkl"
        self.model = None
        self._load_model()

    def _load_model(self):
        if os.path.exists(self.model_path):
            try:
                self.model = joblib.load(self.model_path)
                print(f"🌲 [AI] Random Forest Loaded: {self.model_path}")
            except Exception as e:
                print(f"⚠️ [AI] Model Load Failed: {e}")
        else:
            print("⚠️ [AI] No trained model found. Using Heuristic Mode.")

    def predict_risk(self, features: dict) -> float:
        """
        Returns Risk Probability (0.0 - 1.0)
        """
        # 1. REAL AI MODE
        if self.model:
            try:
                # Prepare input vector [rain, slope, soil]
                # Default mock values for missing keys
                vector = np.array([[
                    features.get('rainfall', 0),
                    features.get('slope', 30),
                    features.get('soil', 50)
                ]])
                
                # Predict Class (0, 1, 2)
                prediction = self.model.predict(vector)[0]
                
                # Convert Class to Probability (Roughly)
                if prediction == 2: return 0.9 # Danger
                if prediction == 1: return 0.5 # Caution
                return 0.1 # Safe
            except Exception as e:
                print(f"Prediction Error: {e}")
        
        # 2. HEURISTIC FALLBACK (If model fails or missing)
        rain = features.get('rainfall', 0)
        if rain > 80: return 0.85
        if rain > 50: return 0.55
        return 0.2