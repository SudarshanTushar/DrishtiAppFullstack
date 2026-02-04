from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import json
from datetime import datetime

# --- 1. IMPORT NEW XGBOOST/GNN MODULE ---
# Hum 'xgboost' folder ke andar 'ne_predictor.py' se function bula rahe hain
try:
    from xgboost.ne_predictor import predict_ne_risk
    print("✅ XGBoost/GNN Module Imported Successfully")
except ImportError as e:
    print(f"⚠️ Warning: Could not import NE Predictor. Check folder structure. Error: {e}")
    # Dummy function to prevent crash if import fails
    def predict_ne_risk(data):
        return {"error": "Model module not found", "risk_level": 0}

# --- 2. APP SETUP ---
app = Flask(__name__)
CORS(app)  # React Frontend ko allow karne ke liye

# --- 3. DATABASE SETUP (Placeholder based on requirements.txt) ---
# Agar aapko DB connect karna hai toh yahan credentials dalein
# from flask_sqlalchemy import SQLAlchemy
# app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///disaster.db')
# db = SQLAlchemy(app)

# --- ROUTES ---

@app.route('/')
def home():
    return jsonify({
        "status": "Online",
        "system": "Disaster Management Backend (XGBoost Enabled)",
        "timestamp": datetime.now().isoformat()
    })

# ==========================================
# 🚀 ROUTE 1: NEW XGBOOST / GNN PREDICTION
# ==========================================
@app.route('/api/predict-ne', methods=['POST'])
def predict_north_east():
    """
    Ye route North East region ke liye special XGBoost/GNN model use karta hai.
    Input Example: { "rainfall": 120, "soil_moisture": 45, "river_level": 8.5 }
    """
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        print(f"Incoming NE Data: {data}")

        # Call the function from ne_predictor.py
        result = predict_ne_risk(data)

        # Response Formatting
        response = {
            "status": "success",
            "model_used": "ManualSTGNN + XGBoost",
            "timestamp": datetime.now().isoformat(),
            "data": result
        }
        return jsonify(response)

    except Exception as e:
        print(f"❌ Error in NE Prediction: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

# ==========================================
# 🚀 ROUTE 2: GENERAL DISASTER ALERTS (Previous Feature)
# ==========================================
@app.route('/api/alert', methods=['POST'])
def send_alert():
    """
    Ye route general alerts handle karta hai (SMS/Notification logic yahan aayega).
    """
    try:
        data = request.json
        location = data.get('location', 'Unknown')
        alert_type = data.get('type', 'General')
        
        # Yahan aap SMS/Email logic add kar sakte hain
        print(f"⚠️ ALERT RECEIVED: {alert_type} at {location}")

        return jsonify({
            "status": "sent",
            "message": f"Alert for {alert_type} broadcasted to {location}."
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
# 🚀 ROUTE 3: REPORT GENERATION (FPDF Feature)
# ==========================================
@app.route('/api/generate-report', methods=['GET'])
def generate_report():
    """
    PDF Report generate karne ka placeholder (FPDF2 installed hai).
    """
    try:
        # Simple Logic to demonstrate FPDF usage
        from fpdf import FPDF
        
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)
        pdf.cell(200, 10, txt="Disaster Management Report", ln=1, align='C')
        pdf.cell(200, 10, txt=f"Generated: {datetime.now()}", ln=2, align='C')
        pdf.cell(200, 10, txt="Status: All Systems Operational", ln=3, align='L')
        
        report_path = "report.pdf"
        pdf.output(report_path)
        
        return f"Report Generated: {report_path} (Logic Ready)"
    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == '__main__':
    # '0.0.0.0' allows access from other devices (Mobile App Testing)
    app.run(host='0.0.0.0', port=5000, debug=True)