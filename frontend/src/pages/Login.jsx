import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Lock, ChevronRight, AlertTriangle } from "lucide-react";
import { toast } from "react-hot-toast";
// ✅ NEW: Capacitor Native Plugins
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';

const Login = ({ setAuth }) => {
  const navigate = useNavigate();
  const [creds, setCreds] = useState({ id: "", pass: "" });
  const [loading, setLoading] = useState(false);

  // --- NATIVE INITIALIZATION ---
  useEffect(() => {
    const initNative = async () => {
        try {
            await StatusBar.setStyle({ style: Style.Dark });
            await StatusBar.setOverlaysWebView({ overlay: true });
        } catch (e) {}
    };
    initNative();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // 📳 Haptic Feedback on Press
    await Haptics.impact({ style: ImpactStyle.Medium });
    
    setLoading(true);
    
    // 🔐 SIMULATED GOVT AUTHENTICATION
    setTimeout(async () => {
      if (creds.id === "admin" && creds.pass === "admin") {
        setAuth(true); // <--- UNLOCKS THE APP
        
        // 📳 Success Vibration
        await Haptics.notification({ type: NotificationType.Success });
        toast.success("Identity Verified via NIC Server");
        navigate("/admin");
      } else {
        // 📳 Error Vibration
        await Haptics.notification({ type: NotificationType.Error });
        toast.error("Access Denied: Invalid Credentials");
        setLoading(false);
      }
    }, 1500);
  };

  return (
    // ✅ ROOT: Safe Areas added (pt-safe-top, pb-safe-bottom)
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans transition-colors duration-500 pt-safe-top pb-safe-bottom">
      
      {/* Background Grid (Adapts opacity) */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 dark:opacity-5 pointer-events-none"></div>
      
      <div className="z-10 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl relative transition-colors duration-500">
        
        {/* GOVT HEADER */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-inner border border-slate-200 dark:border-slate-700">
             <img 
               src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" 
               alt="Satyamev Jayate" 
               className="w-10 h-10 opacity-80 dark:invert"
             />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-widest text-center">DRISHTI-NE</h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] font-bold mt-1 text-center">
            Disaster Response Integrated System
          </p>
          <div className="mt-4 px-3 py-1 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-full text-red-600 dark:text-red-400 text-[10px] font-bold flex items-center gap-2 animate-pulse">
            <ShieldCheck size={12} /> RESTRICTED ACCESS: LEVEL 5
          </div>
        </div>

        {/* FORM */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Official ID</label>
            <input 
              type="text" 
              placeholder="e.g. DM-SHILLONG-01" 
              className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700 font-mono text-sm"
              value={creds.id}
              onChange={(e) => setCreds({...creds, id: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Secure PIN</label>
            <div className="relative">
                <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700 font-mono text-sm"
                value={creds.pass}
                onChange={(e) => setCreds({...creds, pass: e.target.value})}
                />
                <Lock className="absolute right-4 top-3 text-slate-400 dark:text-slate-600" size={16} />
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 mt-6 outline-none tap-highlight-transparent"
          >
            {loading ? (
                <span className="flex items-center gap-2 text-xs uppercase tracking-widest"><ShieldCheck size={16} className="animate-bounce"/> Authenticating...</span>
            ) : (
                <>SECURE LOGIN <ChevronRight size={18} /></>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-[9px] text-slate-500 dark:text-slate-600 font-mono flex flex-col gap-1">
              <span>Unauthorized access is a punishable offense under</span>
              <span className="font-bold text-blue-600 dark:text-blue-500">IT Act 2000 & DPDP Act 2023</span>
            </p>
            <div className="mt-2 flex justify-center gap-2 opacity-30 text-slate-400 dark:text-slate-500">
               <ShieldCheck size={12} /> <Lock size={12} /> <AlertTriangle size={12} />
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;