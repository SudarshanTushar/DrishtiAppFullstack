import React, { useState, useEffect, useRef } from "react";
import { 
  Radio, Wifi, ShieldCheck, Activity, 
  Server, Share2, Search, Database, Lock, Send, Smartphone, RefreshCw
} from "lucide-react";
import { useI18n } from "../i18n";

const NetworkView = () => {
  const { t } = useI18n();
  const [isScanning, setIsScanning] = useState(true);
  const [nodes, setNodes] = useState([]);
  const [logs, setLogs] = useState([]);
  const [packets, setPackets] = useState(0);
  const [inputText, setInputText] = useState("");
  const logsEndRef = useRef(null);

  // --- 1. SIMULATION LOGIC (NODE DISCOVERY) ---
  useEffect(() => {
    if (!isScanning) return;

    const possibleNodes = [
      { id: "Bravo-7", signal: 85, type: "Relay", dist: "12m" },
      { id: "Alpha-9", signal: 60, type: "Mobile", dist: "45m" },
      { id: "Delta-2", signal: 40, type: "Gateway", dist: "120m" },
      { id: "Echo-5", signal: 92, type: "Drone", dist: "500m" },
      { id: "NDRF-Unit", signal: 99, type: "Command", dist: "1km" },
    ];

    const interval = setInterval(() => {
      // 30% chance to find a new node
      if (Math.random() > 0.7 && nodes.length < 5) {
        const newNode = possibleNodes[nodes.length % possibleNodes.length];
        // Check if node exists to avoid duplicates in visual
        setNodes(prev => {
            if (prev.find(n => n.id === newNode.id)) return prev;
            addLog(`[DISCOVERY] Handshake > ${newNode.id} (${newNode.type})`);
            return [...prev, { ...newNode, addedAt: Date.now() }];
        });
      }

      // Simulate Background Packet Transfer
      if (nodes.length > 0) {
        if (Math.random() > 0.5) {
            setPackets(p => p + 1);
            const target = nodes[Math.floor(Math.random() * nodes.length)].id;
            // Only log sometimes to avoid clutter
            if(Math.random() > 0.7) addLog(`[RELAY] Packet >> ${target} [ACK 20ms]`);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isScanning, nodes]);

  // --- 2. LOGGING SYSTEM ---
  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
    setLogs(prev => [...prev, `[${time}] ${msg}`].slice(-50)); // Keep last 50
  };

  // Scroll to bottom of logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // --- 3. USER MESSAGING (FROM V1) ---
  const handleSend = () => {
    if (!inputText.trim()) return;
    
    // Simulate sending to mesh
    addLog(`[TX-USER] Broadcasting: "${inputText}"`);
    setPackets(p => p + 12); // Message adds size
    setInputText("");

    // Simulate Response
    setTimeout(() => {
        addLog(`[RX] Echo-5: Message Received. Forwarding...`);
    }, 1500);
  };

  return (
    <div className="h-full min-h-screen bg-slate-950 text-emerald-500 font-mono p-4 flex flex-col relative overflow-hidden">
      
      {/* BACKGROUND GRID */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

      {/* HEADER */}
      <header className="flex justify-between items-center mb-4 z-10 border-b border-emerald-900/50 pb-4">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-900/20 rounded-lg border border-emerald-500/30">
                <Radio className={isScanning ? "animate-pulse" : ""} size={20} />
            </div>
            <div>
                <h1 className="text-xl font-black tracking-widest text-emerald-400">MESH_NET_V4</h1>
                <p className="text-[10px] text-emerald-700 font-bold uppercase">Decentralized Emergency Link</p>
            </div>
        </div>
        <div className="flex flex-col items-end">
            <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase ${isScanning ? "text-emerald-400" : "text-red-500"}`}>
                <div className={`w-2 h-2 rounded-full ${isScanning ? "bg-emerald-400 animate-pulse" : "bg-red-500"}`}></div>
                {isScanning ? "ONLINE" : "SILENT"}
            </div>
            <span className="text-[9px] uppercase text-emerald-800">{nodes.length} Active Nodes</span>
        </div>
      </header>

      {/* RADAR VISUALIZER */}
      <div className="flex-1 flex items-center justify-center relative z-10 mb-4 min-h-[250px]">
        
        {/* Radar Circles */}
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full border border-emerald-900/50 flex items-center justify-center bg-emerald-900/5">
            <div className="absolute inset-0 rounded-full border border-emerald-800/30 w-full h-full animate-[spin_10s_linear_infinite]"></div>
            <div className="absolute w-48 h-48 rounded-full border border-emerald-700/30 border-dashed"></div>
            <div className="absolute w-32 h-32 rounded-full border border-emerald-600/30"></div>
            
            {/* Center (You) */}
            <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500 z-20 shadow-[0_0_20px_#10b981]">
                <Smartphone size={12} className="text-emerald-100" />
            </div>

            {/* Rotating Scanner Beam */}
            {isScanning && (
                <div className="absolute top-1/2 left-1/2 w-[50%] h-[2px] bg-gradient-to-r from-transparent to-emerald-500 origin-left animate-[spin_3s_linear_infinite] opacity-50"></div>
            )}

            {/* Discovered Nodes (Dots) */}
            {nodes.map((node, i) => {
                const angle = (i * 72) * (Math.PI / 180);
                const radius = 80 + (i * 15); 
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;

                return (
                    <div 
                        key={node.id}
                        className="absolute w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_10px_#34d399] flex items-center justify-center animate-in zoom-in duration-500"
                        style={{ transform: `translate(${x}px, ${y}px)` }}
                    >
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-bold text-emerald-200 whitespace-nowrap bg-black/80 border border-emerald-900/50 px-1.5 py-0.5 rounded backdrop-blur-md">
                            {node.id}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {/* STATS & TOGGLE ROW */}
      <div className="grid grid-cols-3 gap-3 mb-4 z-10">
          <div className="col-span-1 bg-emerald-900/10 border border-emerald-800/50 p-3 rounded-xl flex flex-col justify-center">
              <span className="text-[9px] font-bold uppercase opacity-70 mb-1">Total Packets</span>
              <span className="text-xl font-mono text-white leading-none">{packets}</span>
          </div>
          <div className="col-span-2">
             <button 
                onClick={() => setIsScanning(!isScanning)}
                className={`w-full h-full rounded-xl font-bold flex items-center justify-center gap-2 transition-all border ${
                    isScanning 
                    ? "bg-emerald-900/10 text-emerald-400 border-emerald-800 hover:bg-emerald-900/20" 
                    : "bg-emerald-600 text-black border-emerald-500 shadow-lg shadow-emerald-900/50"
                }`}
             >
                {isScanning ? <Activity className="animate-spin" size={16}/> : <RefreshCw size={16}/>}
                {isScanning ? "SCANNING..." : "START MESH"}
             </button>
          </div>
      </div>

      {/* LIVE TERMINAL (With Scroll) */}
      <div className="h-32 bg-black/80 border border-emerald-900/50 rounded-xl p-3 overflow-y-auto font-mono text-[10px] shadow-inner z-10 mb-4 scrollbar-thin scrollbar-thumb-emerald-900 scrollbar-track-transparent">
          {logs.length === 0 && <span className="text-emerald-900 italic">Initializing radio protocols...</span>}
          {logs.map((log, i) => (
              <div key={i} className="flex gap-2 text-emerald-500/90 border-l-2 border-emerald-900 pl-2 mb-1 animate-in slide-in-from-left-2 fade-in duration-200">
                  <span className="opacity-50">{">"}</span>
                  {log}
              </div>
          ))}
          <div ref={logsEndRef} />
      </div>

      {/* MESSAGE INPUT (New Feature) */}
      <div className="relative z-10 flex gap-2">
         <div className="relative flex-1">
             <div className="absolute left-3 top-1/2 -translate-y-1/2">
                 <div className={`w-1.5 h-1.5 rounded-full ${isScanning ? "bg-emerald-500 animate-pulse" : "bg-slate-600"}`}></div>
             </div>
             <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={!isScanning}
                placeholder={isScanning ? "Broadcast encrypted message..." : "Start Mesh to send..."}
                className="w-full bg-emerald-900/10 border border-emerald-800/50 text-emerald-100 text-xs rounded-xl pl-7 pr-4 py-3.5 focus:outline-none focus:border-emerald-500/80 transition-all placeholder:text-emerald-800/50 disabled:opacity-50"
             />
         </div>
         <button 
            onClick={handleSend}
            disabled={!isScanning || !inputText.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 text-black p-3.5 rounded-xl disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-600 transition-all active:scale-95"
         >
            <Send size={18} />
         </button>
      </div>

    </div>
  );
};

export default NetworkView;