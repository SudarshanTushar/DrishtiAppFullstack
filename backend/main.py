from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
from datetime import datetime

# --- 🔧 CRITICAL PATH FIX ---
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__)
CORS(app)

# --- 🧠 IMPORT AI ENGINE ---
import_error = None
try:
    from ai_engine.ne_predictor import predict_ne_risk, find_safest_route
    print("✅ AI Engine Loaded Successfully")
except Exception as e:
    import_error = str(e)
    print(f"❌ FATAL IMPORT ERROR: {e}")

    # Fallback functions
    def find_safest_route(sl, slg, el, elg):
        return {"error": f"Server Import Failed: {import_error}"}

    def predict_ne_risk(data):
        return {"error": f"Server Import Failed: {import_error}"}

# ==========================================
# 🏠 ROUTE 1: HOME
# ==========================================
@app.route('/')
def home():
    return jsonify({
        "status": "Online",
        "system": "Drishti Backend (Life Saviour Mode)",
        "ai_engine_status": "✅ Active" if not import_error else f"❌ Inactive ({import_error})"
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
        
        if "error" in result:
            return jsonify(result), 500

        # ✅ Extract Best Route & Risky Alternatives
        best_route = result.get('best_route', {})
        alternatives = result.get('alternatives', []) # Risky routes
        
        return jsonify({
            "status": "success",
            "route_analysis": best_route,   # GREEN ROUTE
            "risky_routes": alternatives,   # RED ROUTES (DANGER)
            "timestamp": datetime.now().isoformat()
        })

    except Exception as e:
        print(f"❌ Routing API Error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

# ==========================================
# 🚀 ROUTE 3: PREDICTION
# ==========================================
@app.route('/api/predict-ne', methods=['POST'])
def predict_north_east():
    try:
        data = request.json
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