import React, { useState, useEffect, useRef } from "react";
import { 
  Radio, WifiOff, Bluetooth, Send, Activity, 
  RefreshCw, ShieldAlert, Smartphone, Users
} from "lucide-react";
import { registerPlugin } from '@capacitor/core';
import { Haptics, NotificationType } from '@capacitor/haptics';

// 🔌 LINK TO YOUR NATIVE JAVA PLUGIN
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
        addLog(`[LINK] 🔗 Node Connected: ${nodeId}`, "system");
        setPeers(prev => {
            if (prev.includes(data.id)) return prev;
            return [...prev, data.id];
        });
        Haptics.notification({ type: NotificationType.Success });
    });

    // When a message is received
    const msgListener = MeshNetwork.addListener('onMessageReceived', (data) => {
        const senderId = data.sender.substring(0,4);
        addLog(`[RX] ${senderId}: ${data.message}`, "rx");
        Haptics.vibrate();
    });

    return () => {
        peerListener.remove();
        msgListener.remove();
    };
  }, []);

  // Auto-scroll
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Helper for logs with types (tx, rx, system, error)
  const addLog = (msg, type = "system") => {
    const time = new Date().toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute:'2-digit' });
    setLogs(prev => [...prev, { time, msg, type }]);
  };

  // --- 2. ACTIONS ---

  const activateMesh = async () => {
    setStatus("SCANNING");
    addLog("Initializing Offline Mesh Kernel...", "system");
    try {
        await MeshNetwork.startDiscovery();
        setStatus("ACTIVE");
        addLog("✅ Bluetooth Radio Active. Scanning...", "success");
    } catch (e) {
        setStatus("ERROR");
        addLog("❌ Error: " + e.message, "error");
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    
    // UI Update immediately
    addLog(`ME: ${inputText}`, "tx");
    
    try {
        await MeshNetwork.broadcastMessage({ message: inputText });
        setInputText("");
    } catch (e) {
        addLog("❌ Send Failed: " + e.message, "error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-emerald-500 font-mono flex flex-col pt-safe-top pb-safe-bottom">
      
      {/* --- HEADER --- */}
      <div className="p-4 bg-slate-900 border-b border-emerald-900/50 shadow-lg z-10">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
                {/* Status Icon */}
                <div className={`p-2 rounded-lg border ${status === "ACTIVE" ? "bg-emerald-500/10 border-emerald-500" : "bg-slate-800 border-slate-700"}`}>
                    {status === "ACTIVE" ? <Bluetooth className="text-blue-400 animate-pulse" size={20} /> : <Radio className="text-slate-500" size={20} />}
                </div>
                <div>
                    <h1 className="text-lg font-black tracking-widest text-emerald-400 leading-none">MATRIX MESH</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`w-2 h-2 rounded-full ${status === "ACTIVE" ? "bg-emerald-500 animate-ping" : "bg-slate-600"}`}></span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {status === "ACTIVE" ? "OFFLINE LINK SECURE" : "RADIO SILENCE"}
                        </span>
                    </div>
                </div>
            </div>
            
            {/* Peer Counter */}
            <div className="flex flex-col items-end">
                <div className="flex items-center gap-1 text-emerald-400">
                    <Users size={14} />
                    <span className="text-xl font-bold">{peers.length}</span>
                </div>
                <span className="text-[9px] text-slate-500 uppercase">Nodes</span>
            </div>
        </div>

        {/* Network Mode Indicator */}
        <div className="mt-4 flex items-center justify-between bg-black/40 rounded p-2 border border-slate-800">
            <div className="flex items-center gap-2 opacity-50">
                <WifiOff size={14} className="text-red-500" />
                <span className="text-[10px] text-slate-400 line-through">INTERNET</span>
            </div>
            <div className="h-4 w-[1px] bg-slate-700"></div>
            <div className="flex items-center gap-2">
                <Bluetooth size={14} className={status === "ACTIVE" ? "text-blue-400" : "text-slate-600"} />
                <span className={`text-[10px] ${status === "ACTIVE" ? "text-blue-400 font-bold" : "text-slate-600"}`}>
                    BLUETOOTH P2P
                </span>
            </div>
        </div>
      </div>

      {/* --- MAIN CONTENT / LOGS --- */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-black/90 relative">
          
          {/* Welcome / Start Screen */}
          {status === "IDLE" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center opacity-80">
                <div className="mb-6 relative">
                    <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full"></div>
                    <Smartphone size={48} className="text-slate-500 relative z-10" />
                </div>
                <button 
                    onClick={activateMesh}
                    className="group relative bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold shadow-2xl transition-all active:scale-95 w-full max-w-xs overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <div className="flex items-center justify-center gap-3">
                        <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" /> 
                        INITIALIZE RADIO
                    </div>
                </button>
                <p className="text-xs text-slate-500 mt-4 max-w-[200px]">
                    Disconnects Internet. Uses Bluetooth for Disaster Comms.
                </p>
            </div>
          )}

          {/* Scanning Animation */}
          {status === "SCANNING" && (
             <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <Activity className="text-emerald-500 animate-bounce" size={40} />
                 <p className="text-emerald-500 text-xs mt-4 tracking-widest animate-pulse">CALIBRATING FREQUENCIES...</p>
             </div>
          )}

          {/* Chat Logs */}
          {logs.map((log, i) => (
              <div key={i} className={`flex flex-col ${
                  log.type === "tx" ? "items-end" : 
                  log.type === "rx" ? "items-start" : "items-center"
              }`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-lg text-xs md:text-sm mb-1 ${
                      log.type === "tx" ? "bg-blue-900/40 text-blue-200 border border-blue-800 rounded-tr-none" :
                      log.type === "rx" ? "bg-emerald-900/40 text-emerald-200 border border-emerald-800 rounded-tl-none" :
                      log.type === "error" ? "bg-red-900/20 text-red-400 border border-red-900/50" :
                      "text-slate-500 text-[10px] uppercase tracking-widest my-2" // System logs
                  }`}>
                      {log.type !== "system" && log.type !== "error" && (
                          <span className="block text-[9px] opacity-50 mb-1">{log.time}</span>
                      )}
                      {log.msg}
                  </div>
              </div>
          ))}
          <div ref={logsEndRef} />
      </div>

      {/* --- INPUT AREA --- */}
      <div className="p-3 bg-slate-900 border-t border-emerald-900/50 flex gap-2 shadow-[0_-5px_15px_rgba(0,0,0,0.5)]">
          <input 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={status !== "ACTIVE"}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 bg-black/50 border border-slate-700 text-white px-4 py-3 rounded-xl text-sm focus:border-blue-500 focus:bg-black outline-none transition-all placeholder:text-slate-600 disabled:opacity-50"
            placeholder={status === "ACTIVE" ? "Broadcast via Bluetooth..." : "Radio Offline"}
          />
          <button 
            onClick={sendMessage}
            disabled={status !== "ACTIVE"}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                status === "ACTIVE" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50 active:scale-95 hover:bg-blue-500" 
                : "bg-slate-800 text-slate-600"
            }`}
          >
              <Send size={18} />
          </button>
      </div>

    </div>
  );
};

export default NetworkView;