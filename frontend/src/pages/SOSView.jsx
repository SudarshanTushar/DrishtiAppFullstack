import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, Phone, MapPin, 
  ShieldAlert, Wifi, WifiOff, Radio, CheckCircle, Loader, 
  Lock, Zap, Activity, Send
} from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useI18n } from "../i18n";

// --- MOCK MESH HOOK (Simulates Hardware Radio) ---
const useMeshNetwork = () => {
  return {
    startMesh: async () => new Promise(r => setTimeout(r, 500)),
    sendMessage: async (msg) => { console.log("📡 Mesh Broadcast:", msg); return true; },
    isRunning: true
  };
};

const SOSView = () => {
  const { t } = useI18n();
  const { sendMessage: sendMeshMessage, startMesh, isRunning: isMeshRunning } = useMeshNetwork();
  
  // --- STATE ---
  const [status, setStatus] = useState("READY"); // READY, SENDING, SENT_CLOUD, SENT_MESH, FAILED
  const [location, setLocation] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [mode, setMode] = useState(navigator.onLine ? "CLOUD" : "MESH");
  const [logs, setLogs] = useState([]);
  const [meshNodes, setMeshNodes] = useState(0);

  // --- 1. NETWORK & GPS MONITORING ---
  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); setMode("CLOUD"); addLog("Network restored. Switched to Cloud Link."); };
    const handleOffline = () => { setIsOnline(false); setMode("MESH"); addLog("Network lost. Engaging Mesh Protocol."); };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    getCurrentLocation();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- 2. HAPTIC S-O-S PATTERN ---
  useEffect(() => {
    let interval;
    if (status === 'SENDING') {
      interval = setInterval(async () => {
        // SOS Pattern: ... --- ...
        await Haptics.impact({ style: ImpactStyle.Heavy });
        setTimeout(async () => await Haptics.impact({ style: ImpactStyle.Heavy }), 200);
        setTimeout(async () => await Haptics.impact({ style: ImpactStyle.Heavy }), 400);
        setTimeout(async () => await Haptics.vibrate({ duration: 300 }), 800);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [status]);

  // --- HELPER: LOGGING ---
  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
    setLogs(prev => [`[${time}] ${msg}`, ...prev.slice(0, 5)]);
  };

  const getCurrentLocation = async () => {
    try {
      addLog("Acquiring GPS Lock...");
      const coordinates = await Geolocation.getCurrentPosition();
      setLocation({
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude
      });
      addLog(`GPS Locked: ${coordinates.coords.latitude.toFixed(4)}, ${coordinates.coords.longitude.toFixed(4)}`);
    } catch (error) {
      console.warn("GPS Failed");
      addLog("GPS Signal Weak. Triangulating...");
    }
  };

  // --- 3. THE "SMART" SOS LOGIC ---
  const handleSOS = async () => {
    if (status !== 'READY') return; // Prevent double clicks

    setStatus("SENDING");
    addLog("⚠️ SOS SEQUENCE INITIATED");
    
    // Payload Data
    const sosPayload = JSON.stringify({
      type: "CRITICAL_SOS",
      lat: location?.lat || 0,
      lng: location?.lng || 0,
      timestamp: Date.now(),
      uid: "NDRF-UNIT-" + Math.floor(Math.random() * 1000)
    });

    try {
      addLog("Encrypting Payload (AES-256)...");
      await new Promise(r => setTimeout(r, 1000)); // Simulate Encryption

      if (isOnline) {
        // --- PLAN A: CLOUD DISPATCH ---
        addLog("Attempting Cloud Uplink...");
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate Server Latency
        setStatus("SENT_CLOUD");
        addLog("✅ ACK RECEIVED: Server Dispatch Confirmed.");
      
      } else {
        // --- PLAN B: MESH OFFLINE RELAY ---
        addLog("☁️ Cloud Unreachable. Switching to LoRa Mesh...");
        setMeshNodes(Math.floor(Math.random() * 5) + 2); // Fake node count
        
        if (!isMeshRunning) await startMesh();
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate Handshake

        addLog("Broadcasting on 868MHz...");
        await sendMeshMessage(sosPayload);
        setStatus("SENT_MESH");
        addLog("✅ RELAY ACTIVE: Message hopped to nearby nodes.");
      }
      
      // Success Vibration
      Haptics.notification({ type: 'SUCCESS' });

    } catch (error) {
      console.error("SOS Failed:", error);
      setStatus("FAILED");
      addLog("❌ TRANSMISSION FAILED.");
    }
  };

  // Reset Logic
  const resetSOS = () => {
      setStatus("READY");
      setLogs([]);
      setMeshNodes(0);
  };

  return (
    <div className={`h-full min-h-screen flex flex-col relative transition-colors duration-700 ${status === 'SENDING' ? 'bg-red-950' : 'bg-slate-900'} text-white overflow-hidden`}>
      
      {/* 🔴 VISUAL STROBE OVERLAY */}
      {status === 'SENDING' && (
        <div className="absolute inset-0 z-0 animate-pulse bg-red-600/20 pointer-events-none"></div>
      )}

      {/* HEADER */}
      <header className="relative z-10 flex justify-between items-center p-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl border ${status === 'SENDING' ? "bg-red-600 border-red-400 animate-bounce" : "bg-slate-800 border-slate-700"}`}>
            <ShieldAlert size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter">EMERGENCY</h1>
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                 {status === 'SENDING' ? "BROADCASTING DISTRESS" : "SYSTEM STANDBY"}
            </p>
          </div>
        </div>
        
        {/* CONNECTION STATUS BADGE */}
        <div className={`px-3 py-1 rounded-full border flex items-center gap-2 text-[10px] font-bold transition-all ${isOnline ? 'bg-blue-900/50 border-blue-500 text-blue-200' : 'bg-amber-900/50 border-amber-500 text-amber-200'}`}>
          {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
          {isOnline ? "CLOUD LINK" : "MESH MODE"}
        </div>
      </header>

      {/* MAIN INTERFACE */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
        
        {/* THE BIG BUTTON */}
        <button 
          onClick={status === 'READY' ? handleSOS : resetSOS}
          className={`
            relative w-64 h-64 rounded-full flex items-center justify-center transition-all duration-500
            ${status === 'SENDING' 
                ? 'bg-red-600 shadow-[0_0_100px_rgba(220,38,38,0.6)] scale-110' 
                : status.includes('SENT') 
                    ? 'bg-emerald-600 shadow-[0_0_60px_rgba(16,185,129,0.4)]' 
                    : 'bg-slate-800 shadow-[0_0_0_10px_rgba(30,41,59,1)] hover:scale-105 active:scale-95'}
          `}
        >
          {/* Rings Animation */}
          {status === 'SENDING' && (
            <>
              <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping opacity-75"></div>
              <div className="absolute -inset-4 rounded-full border border-red-500/50 animate-ping opacity-50 animation-delay-500"></div>
            </>
          )}

          <div className="flex flex-col items-center text-white z-20">
            {status === 'READY' && (
                <>
                    <AlertTriangle size={64} className="text-red-500 mb-2" />
                    <span className="text-4xl font-black tracking-widest">SOS</span>
                    <span className="text-xs text-slate-400 mt-1 font-bold">PRESS FOR HELP</span>
                </>
            )}

            {status === 'SENDING' && (
                <>
                    <Zap size={64} className="animate-pulse mb-2" fill="currentColor" />
                    <span className="text-xl font-bold animate-pulse">SENDING...</span>
                </>
            )}

            {status === 'SENT_CLOUD' && (
                <>
                    <CheckCircle size={64} className="mb-2" />
                    <span className="text-xl font-black">SENT</span>
                    <span className="text-[10px] mt-1 bg-blue-900/50 px-2 py-0.5 rounded">SERVER ACK</span>
                </>
            )}

            {status === 'SENT_MESH' && (
                <>
                    <Radio size={64} className="mb-2" />
                    <span className="text-xl font-black">MESH SENT</span>
                    <span className="text-[10px] mt-1 bg-amber-900/50 px-2 py-0.5 rounded">OFFLINE RELAY</span>
                </>
            )}
          </div>
        </button>

        {/* STATUS METRICS */}
        <div className="w-full max-w-sm mt-12 grid grid-cols-2 gap-4">
            {/* Mesh Status */}
            <div className="bg-slate-800/50 backdrop-blur-md p-4 rounded-2xl border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                    <Radio size={16} className={status === 'SENDING' && !isOnline ? "text-amber-400 animate-pulse" : "text-slate-500"} />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Mesh Network</span>
                </div>
                <div className="flex items-end gap-2">
                    <span className="text-3xl font-black text-white">{meshNodes}</span>
                    <span className="text-[10px] font-bold text-slate-500 mb-1.5">NODES</span>
                </div>
            </div>

            {/* GPS Status */}
            <div className="bg-slate-800/50 backdrop-blur-md p-4 rounded-2xl border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                    <MapPin size={16} className={location ? "text-emerald-400" : "text-red-500 animate-pulse"} />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Location</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-mono font-bold text-white">
                        {location ? `${location.lat.toFixed(3)}` : "SEARCHING"}
                    </span>
                    <span className="text-xs font-mono font-bold text-white">
                        {location ? `${location.lng.toFixed(3)}` : "SATELLITE..."}
                    </span>
                </div>
            </div>
        </div>
      </main>

      {/* LOG TERMINAL */}
      <div className="h-40 bg-black/60 backdrop-blur-xl border-t border-slate-700/50 p-4 overflow-hidden flex flex-col-reverse relative">
        <div className="absolute top-2 right-2 opacity-50"><Lock size={12} className="text-emerald-500"/></div>
        {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2 opacity-50">
                <Activity size={24} />
                <p className="text-[10px] font-mono uppercase">System Idle. Waiting for trigger.</p>
            </div>
        ) : (
            <div className="space-y-1.5">
                {logs.map((log, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] font-mono text-emerald-500 animate-in slide-in-from-left fade-in duration-300">
                        <span className="text-emerald-500/50">{">"}</span>
                        <span className="opacity-90">{log}</span>
                    </div>
                ))}
            </div>
        )}
      </div>

    </div>
  );
};

export default SOSView;