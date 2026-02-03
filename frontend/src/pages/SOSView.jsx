import React, { useState, useEffect } from "react";
import { Radio, ShieldAlert, Navigation, Signal, CheckCircle, XCircle } from "lucide-react";
import { toast } from "react-hot-toast";
// ✅ NEW: Capacitor Native Haptics
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { useI18n } from "../i18n";

const SOSView = () => {
  const { t } = useI18n();
  const [active, setActive] = useState(false);
  const [logs, setLogs] = useState([]);
  const [stage, setStage] = useState(0); // 0: Idle, 1: Scanning, 2: Locked, 3: Sent

  const toggleSOS = async () => {
    // 📳 NATIVE VIBRATION (Heavy impact for "Emergency" feel)
    await Haptics.impact({ style: ImpactStyle.Heavy });

    if (active) {
      setActive(false);
      setStage(0);
      setLogs([]);
      toast.success("Beacon Deactivated");
      await Haptics.notification({ type: NotificationType.Success });
      return;
    }

    // START SEQUENCE
    setActive(true);
    setStage(1);
    toast.error("DISTRESS SIGNAL ACTIVATED", { icon: "🚨", duration: 4000 });
    
    // Long vibration to confirm activation
    await Haptics.vibrate({ duration: 300 }); 
    
    // Simulate Mesh Hops (The "Movie" Effect)
    const sequence = [
      { msg: "Initializing LORA Module (868 MHz)...", time: 500 },
      { msg: "Scanning Mesh Topology...", time: 1200 },
      { msg: "Found 12 Active Peers in 4km Radius", time: 2000 },
      { msg: "Hop 1: Node #881 (Tawang Sector)", time: 2800 },
      { msg: "Hop 2: Node #902 (Admin Gateway)", time: 3500 },
      { msg: "Handshake Successful. Ack Received.", time: 4500 }
    ];

    sequence.forEach((item, index) => {
      setTimeout(() => {
        setLogs(prev => [item.msg, ...prev]);
        if (index === 2) setStage(2); // Locked
        if (index === 5) {
            setStage(3); // Sent
            Haptics.notification({ type: NotificationType.Success }); // Confirm delivery
        }
      }, item.time);
    });
  };

  return (
    // ✅ SAFE AREAS: pt-safe-top & pb-safe-bottom added
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-700 pt-safe-top pb-safe-bottom ${
      active 
      ? "bg-red-50 dark:bg-red-950" 
      : "bg-slate-50 dark:bg-slate-950"
    }`}>
      
      {/* BACKGROUND PULSE */}
      {active && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/20 rounded-full animate-ping blur-3xl pointer-events-none"></div>
      )}

      {/* HEADER */}
      <div className="z-10 text-center mb-12">
        <h1 className={`text-3xl font-black tracking-tighter mb-2 transition-colors ${active ? "text-red-600 dark:text-white" : "text-slate-900 dark:text-white"}`}>
            {t("sos.title")}
        </h1>
        <p className={`text-xs font-bold uppercase tracking-widest ${active ? "text-red-500 animate-pulse" : "text-slate-500 dark:text-slate-400"}`}>
          {active ? t("sos.broadcasting") : t("sos.standby")}
        </p>
      </div>

      {/* THE BUTTON (Added active states for touch) */}
      <button 
        onClick={toggleSOS}
        className={`z-20 w-48 h-48 rounded-full border-8 shadow-[0_0_60px_rgba(0,0,0,0.2)] dark:shadow-[0_0_60px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center transition-all duration-300 active:scale-90 tap-highlight-transparent ${
          active 
          ? "bg-red-600 border-red-500 shadow-red-500/50 animate-pulse" 
          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
        }`}
      >
        <Radio size={48} className={`mb-2 ${active ? "text-white animate-spin-slow" : "text-slate-400 dark:text-slate-500"}`} />
        <span className={`text-xs font-black uppercase tracking-widest ${active ? "text-white" : "text-slate-400 dark:text-slate-500"}`}>
          {active ? t("sos.stop") : t("sos.press")}
        </span>
      </button>

      {/* STATUS PANEL */}
      <div className="z-10 mt-12 w-full max-w-sm">
        
        {/* Progress Steps */}
        <div className="flex justify-between mb-6 px-4">
           <Step active={stage >= 1} label="SCAN" icon={<Signal size={14}/>} />
           <div className={`flex-1 h-0.5 mt-2 mx-2 transition-colors ${stage >= 1 ? "bg-red-500" : "bg-slate-200 dark:bg-slate-800"}`}></div>
           <Step active={stage >= 2} label="LOCK" icon={<Navigation size={14}/>} />
           <div className={`flex-1 h-0.5 mt-2 mx-2 transition-colors ${stage >= 2 ? "bg-red-500" : "bg-slate-200 dark:bg-slate-800"}`}></div>
           <Step active={stage >= 3} label="SEND" icon={<ShieldAlert size={14}/>} />
        </div>

        {/* Console Logs */}
        <div className="bg-white/80 dark:bg-black/40 backdrop-blur-md rounded-xl p-4 h-32 overflow-hidden border border-slate-200 dark:border-white/5 font-mono text-[10px] shadow-inner transition-colors">
          {logs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-600 italic">
               WAITING FOR INPUT...
            </div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="mb-1 text-red-600 dark:text-red-400 animate-in slide-in-from-bottom-2">
                <span className="opacity-50 mr-2 text-slate-500">[{new Date().toLocaleTimeString().split(" ")[0]}]</span>
                {log}
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};

// Helper Component
const Step = ({ active, label, icon }) => (
    <div className={`flex flex-col items-center gap-2 transition-colors ${active ? "text-red-600 dark:text-red-500" : "text-slate-400 dark:text-slate-600"}`}>
        <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
            active 
            ? "bg-red-600 border-red-600 text-white" 
            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
        }`}>
            {active ? <CheckCircle size={10} /> : icon}
        </div>
        <span className="text-[9px] font-bold">{label}</span>
    </div>
);

export default SOSView;