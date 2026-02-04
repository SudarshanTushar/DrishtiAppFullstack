import React, { useState } from "react";
import { 
  ArrowLeft, CloudRain, Droplets, Activity, 
  AlertTriangle, CheckCircle, ShieldAlert 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config"; // ✅ Connects to your live config
import { toast } from "react-hot-toast";

const PredictionView = () => {
  const navigate = useNavigate();
  
  // State for Inputs
  const [rainfall, setRainfall] = useState("");
  const [soilMoisture, setSoilMoisture] = useState("");
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);

  // --- PREDICT LOGIC ---
  const handlePredict = async () => {
    // 1. Validation
    if (!rainfall || !soilMoisture) {
      toast.error("Please enter both values");
      return;
    }

    setLoading(true);
    setPrediction(null);

    try {
      // 2. API Call to Live Server
      const response = await fetch(`${API_BASE_URL}/api/predict-ne`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rainfall: parseFloat(rainfall),
          soil_moisture: parseFloat(soilMoisture),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // 3. Success
        setPrediction(data.data);
        toast.success("Prediction Complete");
      } else {
        throw new Error(data.message || "Server Error");
      }
    } catch (error) {
      console.error(error);
      toast.error("Prediction Failed: Check Internet");
    } finally {
      setLoading(false);
    }
  };

  // Helper for Result Color
  const getRiskColor = (level) => {
    if (level === 1) return "bg-red-600 shadow-red-500/50"; // High Risk
    return "bg-emerald-600 shadow-emerald-500/50"; // Low Risk
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans pt-safe-top pb-safe-bottom transition-colors duration-500">
      
      {/* HEADER */}
      <header className="flex items-center gap-4 p-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-black tracking-tight">AI PREDICTOR</h1>
      </header>

      {/* MAIN CONTENT */}
      <main className="p-6 max-w-lg mx-auto space-y-8">
        
        {/* Intro Card */}
        <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-20"><Activity size={120} /></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-black mb-2">Check Flood Risk</h2>
            <p className="text-blue-100 text-sm font-medium">Enter sensor data to predict disaster probability using XGBoost.</p>
          </div>
        </div>

        {/* Form Inputs */}
        <div className="space-y-4">
          
          {/* Rainfall Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-500 tracking-widest ml-1">Rainfall (mm)</label>
            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 focus-within:ring-2 ring-blue-500 transition-all shadow-sm">
              <CloudRain className="text-blue-500 mr-4" size={24} />
              <input 
                type="number" 
                placeholder="e.g. 150.5" 
                className="bg-transparent w-full outline-none font-bold text-lg placeholder:text-slate-300 dark:placeholder:text-slate-700"
                value={rainfall}
                onChange={(e) => setRainfall(e.target.value)}
              />
            </div>
          </div>

          {/* Moisture Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-500 tracking-widest ml-1">Soil Moisture (%)</label>
            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 focus-within:ring-2 ring-blue-500 transition-all shadow-sm">
              <Droplets className="text-cyan-500 mr-4" size={24} />
              <input 
                type="number" 
                placeholder="e.g. 30" 
                className="bg-transparent w-full outline-none font-bold text-lg placeholder:text-slate-300 dark:placeholder:text-slate-700"
                value={soilMoisture}
                onChange={(e) => setSoilMoisture(e.target.value)}
              />
            </div>
          </div>

        </div>

        {/* Predict Button */}
        <button 
          onClick={handlePredict}
          disabled={loading}
          className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-5 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading ? <Activity className="animate-spin" /> : <ShieldAlert size={24} />}
          {loading ? "ANALYZING..." : "CALCULATE RISK"}
        </button>

        {/* RESULTS AREA */}
        {prediction && (
          <div className="animate-in slide-in-from-bottom-10 fade-in duration-500">
            <div className={`p-6 rounded-3xl shadow-2xl text-white relative overflow-hidden ${getRiskColor(prediction.risk_level)}`}>
              <div className="flex justify-between items-start mb-4">
                 <div>
                    <h3 className="text-xs font-bold uppercase opacity-80 mb-1">Prediction Result</h3>
                    <h2 className="text-4xl font-black tracking-tighter">
                      {prediction.risk_level === 1 ? "HIGH RISK" : "NO RISK"}
                    </h2>
                 </div>
                 {prediction.risk_level === 1 ? <AlertTriangle size={40} /> : <CheckCircle size={40} />}
              </div>
              
              <div className="bg-black/20 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                <div className="flex justify-between text-sm font-bold mb-1">
                  <span>Confidence Score</span>
                  <span>{(prediction.confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white rounded-full transition-all duration-1000" 
                    style={{ width: `${prediction.confidence * 100}%` }}
                  />
                </div>
              </div>

              <p className="mt-4 text-xs font-medium opacity-80 leading-relaxed">
                {prediction.recommendation}
              </p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default PredictionView;