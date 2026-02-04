import React, { useState } from 'react';
import { 
  CloudRain, Droplets, Mountain, Activity, 
  AlertTriangle, CheckCircle, ArrowRight, Wind, Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';

// ✅ LIVE SERVER CONFIG
const API_URL = "https://157.245.111.124.nip.io/api/predict-ne";

const PredictionView = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // 📝 Input State
  const [formData, setFormData] = useState({
    rainfall: 150,      // mm
    soil_moisture: 60,  // %
    slope: 30           // degrees
  });

  // --- HELPER: Get Intensity Color ---
  // Returns color based on value severity for visual feedback
  const getIntensityColor = (val, max) => {
    const percentage = val / max;
    if (percentage < 0.4) return "text-emerald-500";
    if (percentage < 0.7) return "text-amber-500";
    return "text-red-500";
  };

  const getProgressColor = (val, max) => {
    const percentage = val / max;
    if (percentage < 0.4) return "bg-emerald-500";
    if (percentage < 0.7) return "bg-amber-500";
    return "bg-red-500";
  };

  // --- 🧠 AI CHECK FUNCTION ---
  const checkRisk = async () => {
    // Basic Haptic Feedback
    if (navigator.vibrate) navigator.vibrate(50);
    
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.status === "success") {
        setResult(data.data);
        if (data.data.risk_level === "HIGH") {
          toast.error("CRITICAL RISK DETECTED!", { 
            icon: '🚨', 
            style: { background: '#ef4444', color: '#fff' } 
          });
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]); // SOS Vibe
        } else {
          toast.success("Conditions Stable", { 
            icon: '✅',
            style: { background: '#10b981', color: '#fff' }
          });
        }
      } else {
        toast.error("Prediction Failed");
      }
    } catch (error) {
      console.error(error);
      toast.error("Server Offline? Check Connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-6 pb-32 font-sans transition-colors duration-500 relative overflow-hidden">
      <Toaster position="top-center" />

      {/* 🌌 Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-[80px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-emerald-500/10 rounded-full blur-[80px]"></div>
      </div>

      {/* HEADER */}
      <div className="relative z-10 flex items-center justify-between mb-8 mt-2">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">AI PREDICTOR</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">Real-time Analysis</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800">
          <Activity className="text-blue-600 dark:text-blue-500" size={24} />
        </div>
      </div>

      {/* 🎛️ INPUT CARD (Glassmorphism) */}
      <div className="relative z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Rainfall Input */}
        <div className="space-y-3 group">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                <CloudRain size={20} />
              </div>
              <span className="text-sm font-bold uppercase tracking-wide">Rainfall</span>
            </div>
            <span className={`text-xl font-black ${getIntensityColor(formData.rainfall, 300)}`}>
              {formData.rainfall} <span className="text-xs font-bold text-slate-400">mm</span>
            </span>
          </div>
          
          <input 
            type="range" min="0" max="500" step="10"
            value={formData.rainfall}
            onChange={(e) => setFormData({...formData, rainfall: Number(e.target.value)})}
            className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
          />
          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
            <span>Dry</span>
            <span>Torrential</span>
          </div>
        </div>

        {/* Moisture Input */}
        <div className="space-y-3 group">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl text-cyan-600 dark:text-cyan-400">
                <Droplets size={20} />
              </div>
              <span className="text-sm font-bold uppercase tracking-wide">Soil Moisture</span>
            </div>
            <span className={`text-xl font-black ${getIntensityColor(formData.soil_moisture, 100)}`}>
              {formData.soil_moisture}<span className="text-sm">%</span>
            </span>
          </div>
          <input 
            type="range" min="0" max="100" step="5"
            value={formData.soil_moisture}
            onChange={(e) => setFormData({...formData, soil_moisture: Number(e.target.value)})}
            className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition-all"
          />
        </div>

        {/* Slope Input */}
        <div className="space-y-3 group">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                <Mountain size={20} />
              </div>
              <span className="text-sm font-bold uppercase tracking-wide">Terrain Slope</span>
            </div>
            <span className={`text-xl font-black ${getIntensityColor(formData.slope, 60)}`}>
              {formData.slope}°
            </span>
          </div>
          <input 
            type="range" min="0" max="90" step="5"
            value={formData.slope}
            onChange={(e) => setFormData({...formData, slope: Number(e.target.value)})}
            className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all"
          />
        </div>

        {/* ANALYZE BUTTON */}
        <button 
          onClick={checkRisk} 
          disabled={loading}
          className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-2xl font-black text-white text-lg shadow-xl shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-3 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          {loading ? (
            <>
              <Activity className="animate-spin" /> SCANNING...
            </>
          ) : (
            <>
              SCAN AREA RISK <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform"/>
            </>
          )}
        </button>
      </div>

      {/* 📊 RESULT CARD (Cinematic Reveal) */}
      {result && (
        <div className={`relative z-20 mt-6 p-1 rounded-[2rem] shadow-2xl animate-in slide-in-from-bottom-10 duration-700 ${
          result.risk_level === "HIGH" 
            ? "bg-gradient-to-br from-red-500 via-orange-500 to-red-600" 
            : "bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600"
        }`}>
          <div className="bg-white dark:bg-slate-900 rounded-[1.9rem] p-6 h-full relative overflow-hidden">
            
            {/* Ambient Backlight inside card */}
            <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] opacity-20 pointer-events-none ${
               result.risk_level === "HIGH" ? "bg-red-500" : "bg-emerald-500"
            }`}></div>

            <div className="relative z-10 flex items-start gap-5">
              <div className={`p-4 rounded-2xl shadow-lg shrink-0 ${
                result.risk_level === "HIGH" 
                  ? "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500" 
                  : "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-500"
              }`}>
                {result.risk_level === "HIGH" ? <AlertTriangle size={36} strokeWidth={2.5}/> : <CheckCircle size={36} strokeWidth={2.5}/>}
              </div>
              
              <div>
                <h2 className={`text-4xl font-black tracking-tighter ${
                   result.risk_level === "HIGH" ? "text-red-600 dark:text-red-500" : "text-emerald-600 dark:text-emerald-500"
                }`}>
                  {result.risk_level} RISK
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-2 w-24 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${result.risk_level === "HIGH" ? "bg-red-500" : "bg-emerald-500"}`} 
                      style={{width: `${result.risk_score * 100}%`}}
                    ></div>
                  </div>
                  <span className="text-xs font-bold text-slate-400">{(result.risk_score * 100).toFixed(0)}% Probability</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">AI Recommendation</p>
              <p className={`text-lg font-medium leading-relaxed ${
                 result.risk_level === "HIGH" ? "text-slate-800 dark:text-white" : "text-slate-700 dark:text-slate-200"
              }`}>
                {result.risk_level === "HIGH" 
                  ? "⚠️ Evacuate immediately! High landslide probability detected. Soil saturation is critical."
                  : "✅ Conditions are stable. Standard travel protocols apply. Monitor weather updates."}
              </p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default PredictionView;