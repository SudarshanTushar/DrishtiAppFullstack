import React from 'react';
import { Navigation2, MapPin, ShieldCheck, AlertTriangle, X, Clock } from 'lucide-react';

const RouteNavigationUI = ({ routeData, isNavigating, onStartNavigation, onStopNavigation, onCloseRoute }) => {
  if (!routeData) return null;

  // 🚀 ACTIVE NAVIGATION MODE (Minimal Top Banner)
  if (isNavigating) {
    return (
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-md animate-in slide-in-from-top-10 duration-500">
        <div className="bg-emerald-600/95 backdrop-blur-xl border border-emerald-500 rounded-3xl p-4 shadow-2xl flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl animate-pulse">
              <Navigation2 size={28} className="text-white fill-white" />
            </div>
            <div>
              <div className="text-3xl font-black tracking-tight">{routeData.eta || "14 Min"}</div>
              <div className="text-sm font-bold opacity-90 flex items-center gap-1">
                {routeData.distance || "3.2 km"} <span className="opacity-50">•</span> To Safe Zone
              </div>
            </div>
          </div>
          {/* Back Button -> Stops driving, returns to summary */}
          <button 
            onClick={onStopNavigation} 
            className="bg-red-500 hover:bg-red-600 p-3 rounded-2xl backdrop-blur-md shadow-lg transition-transform active:scale-90"
          >
            <X size={24} className="text-white" />
          </button>
        </div>
      </div>
    );
  }

  // 📊 ROUTE SUMMARY MODE (Bottom Card)
  return (
    <div className="absolute bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-2"></div>

        <div className="p-5 pt-2">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {routeData.destinationName || "Safe Zone Alpha"}
              </h2>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                <MapPin size={14} /> From Current Location
              </p>
            </div>
            {/* Close Button -> Completely removes route and goes to search */}
            <button onClick={onCloseRoute} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-red-500 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex gap-3 mb-6">
            <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-2xl p-3">
              <ShieldCheck className="text-emerald-500 mb-1" size={20} />
              <div className="text-lg font-black text-emerald-700 dark:text-emerald-400">{routeData.safetyScore || "92%"}</div>
              <div className="text-[10px] font-bold text-emerald-600/70 uppercase">Safety Score</div>
            </div>
            
            <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-2xl p-3">
              <Clock className="text-blue-500 mb-1" size={20} />
              <div className="text-lg font-black text-blue-700 dark:text-blue-400">{routeData.eta || "14 Min"}</div>
              <div className="text-[10px] font-bold text-blue-600/70 uppercase">{routeData.distance || "3.2 km"}</div>
            </div>

            {routeData.hasRisk && (
              <div className="flex-1 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/50 rounded-2xl p-3">
                <AlertTriangle className="text-orange-500 mb-1" size={20} />
                <div className="text-lg font-black text-orange-700 dark:text-orange-400">{routeData.riskZones || "2"}</div>
                <div className="text-[10px] font-bold text-orange-600/70 uppercase">Risk Zones</div>
              </div>
            )}
          </div>

          <button 
            onClick={onStartNavigation}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all"
          >
            <Navigation2 size={24} className="fill-white" /> START SAFE ROUTE
          </button>
        </div>
      </div>
    </div>
  );
};

export default RouteNavigationUI;