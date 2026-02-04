import React, { useState, useEffect, useRef } from "react";
import { 
  Radio, WifiOff, Bluetooth, Send, Activity, 
  RefreshCw, ShieldAlert, Smartphone, Users,
  Cpu, Zap, CheckCircle2, AlertCircle
} from "lucide-react";
import { registerPlugin } from '@capacitor/core';
import { Haptics, NotificationType } from '@capacitor/haptics';

// 🔌 LINK TO YOUR NATIVE JAVA PLUGIN
// Note: Ensure the plugin is properly linked in your Capacitor config
const MeshNetwork = registerPlugin('MeshNetwork');

const NetworkView = () => {
  const [logs, setLogs] = useState([]);
  const [inputText, setInputText] = useState("");
  const [peers, setPeers] = useState([]); 
  const [status, setStatus] = useState("IDLE"); // IDLE, SCANNING, ACTIVE, ERROR
  const logsEndRef = useRef(null);

  // --- 1. SETUP LISTENERS ---
  useEffect(() => {
    // When a device connects via Bluetooth/Nearby
    const peerListener = MeshNetwork.addListener('onPeerConnected', (data) => {
        const nodeId = data.id.substring(0, 5);
        addLog(`Link Established: Node ${nodeId}`, "system");
        setPeers(prev => {
            if (prev.includes(data.id)) return prev;
            return [...prev, data.id];
        });
        Haptics.notification({ type: NotificationType.Success });
    });

    // When a message is received
    const msgListener = MeshNetwork.addListener('onMessageReceived', (data) => {
        const senderId = data.sender ? data.sender.substring(0,4) : "UNK";
        addLog(data.message, "rx", senderId);
        Haptics.vibrate();
    });

    return () => {
        peerListener.remove();
        msgListener.remove();
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Helper for logs with types
  const addLog = (msg, type = "system", senderId = null) => {
    const time = new Date().toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute:'2-digit' });
    setLogs(prev => [...prev, { time, msg, type, senderId }]);
  };

  // --- 2. ACTIONS ---

  const activateMesh = async () => {
    setStatus("SCANNING");
    // Initial haptic feedback
    await Haptics.impact({ style: 'medium' });
    
    // Simulate scanning delay for UX (Scanning feels real)
    setTimeout(async () => {
        try {
            await MeshNetwork.startDiscovery();
            setStatus("ACTIVE");
            addLog("Bluetooth Radio Active. Scanning for local mesh nodes...", "system");
            await Haptics.notification({ type: NotificationType.Success });
        } catch (e) {
            setStatus("ERROR");
            addLog("Initialization Failed: " + e.message, "error");
            await Haptics.notification({ type: NotificationType.Error });
        }
    }, 1500);
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    
    const msgToSend = inputText;
    setInputText(""); // Clear input immediately for responsiveness
    
    // UI Update immediately (Optimistic UI)
    addLog(msgToSend, "tx");
    
    try {
        await MeshNetwork.broadcastMessage({ message: msgToSend });
    } catch (e) {
        addLog("Send Failed: " + e.message, "error");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-500 font-sans overflow-hidden">
      
      {/* --- HEADER (Glassmorphism) --- */}
      <div className="flex-none px-4 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-20 shadow-sm">
        <div className="flex justify-between items-center">
            
            {/* Left: Title & Status */}
            <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border transition-all duration-500 ${
                    status === "ACTIVE" 
                    ? "bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800" 
                    : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                }`}>
                    {status === "ACTIVE" 
                        ? <Bluetooth className="text-blue-600 dark:text-blue-400 animate-pulse" size={22} /> 
                        : <Radio className="text-slate-500 dark:text-slate-400" size={22} />
                    }
                </div>
                <div>
                    <h1 className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase">Matrix Mesh</h1>
                    <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                            status === "ACTIVE" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : 
                            status === "ERROR" ? "bg-red-500" : "bg-slate-400"
                        }`}></span>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {status === "ACTIVE" ? "Secure Link" : status}
                        </span>
                    </div>
                </div>
            </div>
            
            {/* Right: Peers & Internet Status */}
            <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    <Users size={12} className="text-slate-500 dark:text-slate-400"/>
                    <span className="text-xs font-bold font-mono">{peers.length}</span>
                </div>
                
                {/* No Internet Badge */}
                <div className="flex items-center gap-1 opacity-60">
                    <WifiOff size={10} className="text-slate-500"/>
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Offline Mode</span>
                </div>
            </div>
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 relative overflow-hidden bg-slate-50 dark:bg-slate-950">
          
          {/* BACKGROUND PATTERN */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
          </div>

          {/* 1. IDLE STATE (Start Screen) */}
          {status === "IDLE" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-10 animate-in fade-in zoom-in duration-500">
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl animate-pulse"></div>
                    <div className="relative bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800">
                        <Smartphone size={48} className="text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
                    </div>
                    {/* Badge */}
                    <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                        BETA
                    </div>
                </div>
                
                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Offline Comms Grid</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[260px] leading-relaxed mb-8">
                    Connect with nearby devices using Bluetooth Low Energy (BLE) when internet is unavailable.
                </p>

                <button 
                    onClick={activateMesh}
                    className="group relative w-full max-w-xs bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-xl font-bold shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 overflow-hidden"
                >
                    <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-700" />
                    <span>ACTIVATE RADIO</span>
                </button>
            </div>
          )}

          {/* 2. SCANNING STATE */}
          {status === "SCANNING" && (
             <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                 <div className="relative">
                     <span className="absolute inset-0 rounded-full border-2 border-blue-500/30 animate-ping"></span>
                     <span className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-ping" style={{animationDelay: '0.4s'}}></span>
                     <div className="bg-white dark:bg-slate-900 p-4 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 relative z-10">
                        <Activity className="text-blue-500 animate-pulse" size={32} />
                     </div>
                 </div>
                 <p className="mt-6 text-sm font-bold text-slate-500 dark:text-slate-400 tracking-widest animate-pulse">
                     CALIBRATING FREQUENCIES...
                 </p>
             </div>
          )}

          {/* 3. ACTIVE CHAT STATE */}
          {(status === "ACTIVE" || status === "ERROR") && (
              <div className="absolute inset-0 overflow-y-auto p-4 space-y-4 pb-20 no-scrollbar">
                  {/* Encryption Notice */}
                  <div className="flex justify-center mb-4">
                      <div className="bg-slate-200/50 dark:bg-slate-900/50 backdrop-blur text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full text-[10px] font-bold border border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
                          <ShieldAlert size={10} />
                          <span>MESSAGES ARE NOT ENCRYPTED (DEMO)</span>
                      </div>
                  </div>

                  {logs.length === 0 && (
                      <div className="text-center mt-20 opacity-50">
                          <Cpu size={40} className="mx-auto mb-2 text-slate-300 dark:text-slate-700"/>
                          <p className="text-xs font-bold text-slate-400">WAITING FOR PEERS...</p>
                      </div>
                  )}

                  {logs.map((log, i) => (
                      <div key={i} className={`flex flex-col animate-in slide-in-from-bottom-2 duration-300 ${
                          log.type === "tx" ? "items-end" : 
                          log.type === "rx" ? "items-start" : "items-center"
                      }`}>
                          
                          {/* SENDER LABEL (Only for RX) */}
                          {log.type === "rx" && (
                              <span className="text-[10px] font-bold text-slate-400 ml-1 mb-1 font-mono">
                                  NODE_{log.senderId}
                              </span>
                          )}

                          {/* BUBBLE */}
                          <div className={`max-w-[80%] px-4 py-3 text-sm shadow-sm relative ${
                              log.type === "tx" 
                                ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm" 
                                : log.type === "rx" 
                                    ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm"
                                    : log.type === "error"
                                        ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-xl w-full text-center"
                                        : "bg-slate-200/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wide py-1 px-3 rounded-full border border-slate-200 dark:border-slate-700 backdrop-blur-sm" // System
                          }`}>
                              {/* Icon for System Logs */}
                              {log.type === "system" && <Zap size={10} className="inline mr-1 -mt-0.5"/>}
                              {log.type === "error" && <AlertCircle size={14} className="inline mr-1 -mt-0.5"/>}
                              
                              {log.msg}

                              {/* Timestamp for Messages */}
                              {(log.type === "tx" || log.type === "rx") && (
                                  <div className={`text-[9px] text-right mt-1 font-mono opacity-70 ${
                                      log.type === "tx" ? "text-blue-100" : "text-slate-400"
                                  }`}>
                                      {log.time}
                                      {log.type === "tx" && <CheckCircle2 size={10} className="inline ml-1 opacity-80"/>}
                                  </div>
                              )}
                          </div>
                      </div>
                  ))}
                  <div ref={logsEndRef} />
              </div>
          )}
      </div>

      {/* --- INPUT AREA (Fixed Bottom) --- */}
      <div className={`p-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 transition-transform duration-500 ${
          status === "ACTIVE" ? "translate-y-0" : "translate-y-full"
      }`}>
          <div className="flex gap-2 max-w-3xl mx-auto">
              <input 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white px-5 py-3.5 rounded-2xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-inner"
                placeholder="Broadcast message..."
                autoComplete="off"
              />
              <button 
                onClick={sendMessage}
                disabled={!inputText.trim()}
                className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 active:scale-90 disabled:opacity-50 disabled:shadow-none"
              >
                  <Send size={20} className={inputText.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
              </button>
          </div>
      </div>

    </div>
  );
};

export default NetworkView;