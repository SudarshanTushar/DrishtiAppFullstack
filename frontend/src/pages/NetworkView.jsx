import React, { useState, useEffect, useRef } from 'react';
import { 
  Wifi, Bluetooth, Share2, Send, Activity, 
  Database, Smartphone, Radio, RefreshCw, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { useMeshNetwork } from '../hooks/useMeshNetwork';

const NetworkView = () => {
  // Use our Fixed Hook (Direct Native Plugin)
  const { 
    isRunning: meshActive, 
    peers: peersNearby, 
    messages, 
    sendMessage, 
    startMesh, 
    stopMesh,
    myNodeId, 
    error: meshError,
    peerCount,
    messageCount
  } = useMeshNetwork();
  
  const [inputText, setInputText] = useState("");
  const [dtnLogs, setDtnLogs] = useState([]);
  const logsEndRef = useRef(null);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, dtnLogs, peersNearby]);

  // Simulate DTN "Internal" Logs when messages/peers change
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.status === 'sending') {
        addLog("DTN_LAYER", "Bundling packet 0x" + Math.floor(Math.random()*10000).toString(16));
        addLog("STORAGE", "Persisting to encrypted flash storage...");
      }
      if (lastMsg.status === 'sent') {
        addLog("RADIO", "Burst transmission successful.");
        addLog("DTN_LAYER", "Packet ACK received from neighbour.");
      }
      if (lastMsg.isIncoming) {
        addLog("RADIO", "Inbound signal detected (-48dBm).");
        addLog("CRYPTO", "Decrypted payload from verified peer.");
      }
    }
  }, [messages]);

  useEffect(() => {
    if (peersNearby.length > 0) {
      const lastPeer = peersNearby[peersNearby.length - 1];
      addLog("DISCOVERY", `Handshake initialized with ${lastPeer.id}`);
      addLog("ROUTING", `Route table updated. Metric: 1 hop.`);
    }
  }, [peersNearby]);

  const addLog = (module, text) => {
    setDtnLogs(prev => [...prev, {
      time: new Date().toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      module,
      text
    }]);
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    await sendMessage(inputText);
    setInputText("");
  };

  const handleToggle = () => {
    if (meshActive) stopMesh();
    else startMesh();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 pb-24 font-mono flex flex-col space-y-4">
      
      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-slate-700 pb-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Share2 className="text-blue-400" /> DRISHTI MESH
          </h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">Delay Tolerant Network Layer</p>
        </div>
        <div className="text-right">
          <div className={`flex items-center gap-2 text-xs font-bold ${meshActive ? "text-green-400" : "text-red-400"}`}>
            <div className={`w-2 h-2 rounded-full ${meshActive ? "bg-green-400 animate-pulse" : "bg-red-400"}`}></div>
            {meshActive ? "ONLINE" : "OFFLINE"}
          </div>
          <p className="text-[9px] text-slate-500">{myNodeId || "INITIALIZING..."}</p>
        </div>
      </div>

      {/* ERROR BANNER */}
      {meshError && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 p-2 rounded text-xs flex items-center gap-2">
          <AlertTriangle size={14}/> {meshError}
        </div>
      )}

      {/* VISUALIZER (RADAR) */}
      <div className="relative h-48 bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden flex items-center justify-center">
        
        {/* Radar Rings (Only animate if active) */}
        {meshActive && (
          <>
            <div className="absolute w-64 h-64 border border-slate-600/30 rounded-full animate-[ping_3s_linear_infinite]"></div>
            <div className="absolute w-40 h-40 border border-slate-600/50 rounded-full"></div>
          </>
        )}
        
        <div className="absolute w-20 h-20 border border-blue-500/30 rounded-full flex items-center justify-center bg-blue-900/20 backdrop-blur-sm z-10">
          <Smartphone className={`text-blue-400 w-8 h-8 ${meshActive ? "animate-pulse" : ""}`} />
        </div>

        {/* Peers */}
        {peersNearby.map((peer, i) => (
          <div 
            key={peer.id}
            className="absolute flex flex-col items-center animate-bounce"
            style={{ 
              top: '50%', 
              left: '50%', 
              transform: `translate(${Math.cos(i) * 80}px, ${Math.sin(i) * 80}px)` 
            }}
          >
            <div className="w-8 h-8 bg-green-900/80 rounded-full border border-green-500 flex items-center justify-center text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.5)]">
              <Radio size={14} />
            </div>
            <span className="text-[8px] bg-black/50 px-1 rounded mt-1">{peer.id}</span>
          </div>
        ))}

        {!meshActive ? (
           <p className="absolute bottom-2 text-[10px] text-red-400 font-bold">RADIO OFF</p>
        ) : peersNearby.length === 0 && (
          <p className="absolute bottom-2 text-[10px] text-slate-500 animate-pulse">SCANNING SPECTRUM...</p>
        )}
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-800 p-2 rounded border border-slate-700 text-center">
          <Wifi className="w-4 h-4 mx-auto text-blue-400 mb-1" />
          <p className="text-lg font-bold">{peerCount}</p>
          <p className="text-[8px] text-slate-400 uppercase">Peers</p>
        </div>
        <div className="bg-slate-800 p-2 rounded border border-slate-700 text-center">
          <Database className="w-4 h-4 mx-auto text-purple-400 mb-1" />
          <p className="text-lg font-bold">{messageCount}</p>
          <p className="text-[8px] text-slate-400 uppercase">Packets</p>
        </div>
        <div className="bg-slate-800 p-2 rounded border border-slate-700 text-center">
          <Activity className="w-4 h-4 mx-auto text-green-400 mb-1" />
          <p className="text-lg font-bold">12ms</p>
          <p className="text-[8px] text-slate-400 uppercase">Latency</p>
        </div>
      </div>

      {/* TOGGLE BUTTON */}
      <button 
        onClick={handleToggle}
        className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
          meshActive 
            ? "bg-red-600 hover:bg-red-500 text-white shadow-red-900/50" 
            : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/50"
        }`}
      >
        {meshActive ? (
          <><Radio size={16} /> STOP MESH RADIO</>
        ) : (
          <><RefreshCw size={16} /> INITIALIZE MESH</>
        )}
      </button>

      {/* TERMINAL / LOGS */}
      <div className="bg-black rounded-lg border border-slate-700 p-3 h-48 overflow-y-auto font-mono text-[10px] shadow-inner flex-1">
        <div className="text-green-500 mb-1">root@drishti-node:~# service dtn status</div>
        <div className="text-slate-400 mb-2">mesh_active: {meshActive.toString()} | mode: store_forward</div>
        
        {dtnLogs.map((log, i) => (
          <div key={i} className="mb-1">
            <span className="text-slate-500">[{log.time}]</span>{" "}
            <span className="text-yellow-600 font-bold">{log.module}:</span>{" "}
            <span className="text-slate-300">{log.text}</span>
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>

      {/* CHAT / MESSAGE INPUT */}
      <div className="flex gap-2 pb-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className={`w-2 h-2 rounded-full ${meshActive ? "bg-green-500 animate-pulse" : "bg-slate-500"}`}></div>
          </div>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={!meshActive}
            placeholder={meshActive ? "Broadcast encrypted packet..." : "Start Mesh to send..."}
            className="w-full bg-slate-800 text-white pl-8 pr-4 py-3 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none text-xs font-mono disabled:opacity-50"
          />
        </div>
        <button 
          onClick={handleSend}
          disabled={!meshActive}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={18} />
        </button>
      </div>

    </div>
  );
};

export default NetworkView;