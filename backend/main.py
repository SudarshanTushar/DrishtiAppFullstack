from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
from datetime import datetime

# --- 🔧 CRITICAL PATH FIX ---
# Current folder ko Python Path mein zabardasti add karte hain
# Taaki Gunicorn 'ai_engine' folder ko dhoond sake
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__)
CORS(app)

# --- 🧠 IMPORT AI ENGINE (With Error Capture) ---
import_error = None
try:
    # Humne folder rename kiya tha 'xgboost' -> 'ai_engine'
    from ai_engine.ne_predictor import predict_ne_risk, find_safest_route
    print("✅ AI Engine Loaded Successfully")
except Exception as e:
    # Agar error aaya, toh usse save kar lo
    import_error = str(e)
    print(f"❌ FATAL IMPORT ERROR: {e}")

    # Fallback functions (Dummy) taaki server crash na ho
    def find_safest_route(sl, slg, el, elg):
        return {"error": f"Server Import Failed: {import_error}"}

    def predict_ne_risk(data):
        return {"error": f"Server Import Failed: {import_error}"}

# ==========================================
# 🏠 ROUTE 1: HOME (Health Check)
# ==========================================
@app.route('/')
def home():
    """
    Browser mein check karne ke liye.
    Agar AI fail hai, toh yahan reason dikhega.
    """
    return jsonify({
        "status": "Online",
        "system": "Drishti Backend (Life Saviour Mode)",
        "ai_engine_status": "✅ Active" if not import_error else f"❌ Inactive (Error: {import_error})",
        "timestamp": datetime.now().isoformat()
    })

# ==========================================
# 🛡️ ROUTE 2: LIFE SAVIOUR ROUTING
# ==========================================
@app.route('/api/v1/core/analyze-route', methods=['POST'])
def analyze_route_risk():
    try:
        data = request.json
        start_lat = data.get('start_lat')
        start_lng = data.get('start_lng')
        end_lat = data.get('end_lat')
        end_lng = data.get('end_lng')

        if not all([start_lat, start_lng, end_lat, end_lng]):
            return jsonify({"error": "Coordinates missing"}), 400

        # 🔥 Call AI Brain
        result = find_safest_route(start_lat, start_lng, end_lat, end_lng)
        
        # Check if fallback error occurred
        if "error" in result:
            return jsonify(result), 500

        # Extract Best Route
        best_route = result.get('best_route', {})
        
        return jsonify({
            "status": "success",
            "route_analysis": {
                "route_id": best_route.get('id'),
                "name": best_route.get('name'),
                "risk_level": best_route.get('risk_level'),
                "risk_score": best_route.get('risk_score'),
                "coordinates": best_route.get('coordinates'),
                "distance_km": best_route.get('distance_km'),
                "eta": best_route.get('eta'),
                "weather_data": best_route.get('weather_data'),
                "recommendation": best_route.get('recommendation')
            },
            "timestamp": datetime.now().isoformat()
        })

    except Exception as e:
        print(f"❌ Routing API Error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

# ==========================================
# 🚀 ROUTE 3: POINT PREDICTION (Manual)
# ==========================================
@app.route('/api/predict-ne', methods=['POST'])
def predict_north_east():
    try:
        data = request.json
        if not data: return jsonify({"error": "No data"}), 400
        result = predict_ne_risk(data)
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# ==========================================
# ⚠️ ROUTE 4: ALERTS
# ==========================================
@app.route('/api/alert', methods=['POST'])
def send_alert():
    try:
        data = request.json
        print(f"⚠️ ALERT: {data}")
        return jsonify({"status": "sent", "message": "Alert Broadcasted"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)