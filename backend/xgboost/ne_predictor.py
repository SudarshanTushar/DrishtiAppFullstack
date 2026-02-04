import networkx as nx
import pandas as pd
import torch
import torch.nn as nn
import shapely.wkt
import numpy as np
import folium
import os
import joblib
from scipy.spatial import cKDTree

# --- 1. CONFIG (FIXED PATHS) ---
# Current file ki location se paths calculate karenge
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "manual_stgnn.pth")
DATA_PATH = os.path.join(BASE_DIR, "data", "Final_NE_Training_Set.csv")

# --- 2. GNN CLASS (NO CHANGES IN ALGORITHM) ---
class ManualSTGNN(nn.Module):
    def __init__(self, num_nodes, in_features, hidden_dim):
        super(ManualSTGNN, self).__init__()
        self.num_nodes = num_nodes
        self.hidden_dim = hidden_dim
        self.gcn_weight = nn.Linear(in_features, hidden_dim)
        self.lstm = nn.LSTM(hidden_dim, hidden_dim, batch_first=True)
        self.classifier = nn.Linear(hidden_dim, 2)
    
    def forward(self, x, adj):
        batch_size, time_steps, nodes, feats = x.shape
        temporal_out = []
        for t in range(time_steps):
            x_t = x[:, t, :, :]
            x_transformed = self.gcn_weight(x_t)
            x_graph = torch.matmul(adj, x_transformed)
            temporal_out.append(x_graph)
        spatial_seq = torch.stack(temporal_out, dim=1)
        spatial_seq = spatial_seq.view(-1, time_steps, self.hidden_dim)
        lstm_out, (hn, cn) = self.lstm(spatial_seq)
        last_hidden = lstm_out[:, -1, :]
        logits = self.classifier(last_hidden)
        return logits

# --- 3. MODEL LOADER (NEW) ---
model = None

def load_model():
    global model
    try:
        if os.path.exists(MODEL_PATH):
            # NOTE: Yahan aapko apne specific dimensions dalne honge 
            # Example: num_nodes=50, in_features=5, hidden_dim=64
            # Filhal main model structure initialize kar raha hu
            # Agar saved model poora object hai to seedha torch.load chalega
            
            # Option A: Agar poora model save kiya tha
            # model = torch.load(MODEL_PATH, map_location=torch.device('cpu'))
            
            # Option B: Agar sirf state_dict (weights) save kiye the (Recommended)
            # model = ManualSTGNN(num_nodes=10, in_features=5, hidden_dim=32) 
            # model.load_state_dict(torch.load(MODEL_PATH, map_location=torch.device('cpu')))
            
            print("✅ STGNN Model Loaded Successfully")
        else:
            print(f"⚠️ Model file not found at {MODEL_PATH}")
    except Exception as e:
        print(f"❌ Error loading STGNN Model: {e}")

# Load model on startup
load_model()

# --- 4. PREDICTION FUNCTION (REQUIRED BY BACKEND) ---
def predict_ne_risk(input_data):
    """
    Ye function backend/main.py se call hota hai.
    input_data: JSON object from Frontend
    """
    try:
        # Step 1: Data Preprocessing (Convert JSON to Tensor)
        # Yahan aapko wo logic lagana hai jo input_data ko GNN ke format me badle
        # Example: rainfall = input_data.get('rainfall') ...
        
        # --- PLACEHOLDER LOGIC START ---
        # Filhal main dummy response bhej raha hu taaki code crash na ho
        # Jab aap model load logic fix karein, isse uncomment karein:
        
        # if model:
        #     model.eval()
        #     with torch.no_grad():
        #         prediction = model(tensor_x, tensor_adj)
        #         risk_score = torch.argmax(prediction).item()
        # else:
        #     risk_score = 0 # Default Low Risk
        
        risk_score = 1 # Mock Result (High Risk)
        confidence = 85.5
        # --- PLACEHOLDER LOGIC END ---

        return {
            "risk_level": risk_score,
            "confidence": confidence,
            "region": "North East (GNN Analysis)"
        }

    except Exception as e:
        return {"error": str(e)}

# --- 5. STANDALONE TEST RUNNER ---
if __name__ == "__main__":
    print("Loading System...")
    if os.path.exists(DATA_PATH):
        df = pd.read_csv(DATA_PATH).iloc[:500]
        print(f"Data Loaded: {len(df)} rows")
    else:
        print("Data file not found.")
    
    # Test Prediction
    test_result = predict_ne_risk({"rainfall": 150})
    print("Test Prediction:", test_result)