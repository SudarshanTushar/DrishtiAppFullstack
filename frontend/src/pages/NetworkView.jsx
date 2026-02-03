import React, { useState, useRef } from "react";
import { 
  Radio, Wifi, Share2, Database, Send, Smartphone, 
  Activity, Check, Bluetooth, RefreshCw, Download 
} from "lucide-react";
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { BleClient } from '@capacitor-community/bluetooth-le';

const NetworkView = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [logs, setLogs] = useState([]);
  const logsEndRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [packet, setPacket] = useState(null);

  // --- LOGGING ---
  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute:'2-digit' });
    setLogs(prev => [`[${time}] ${msg}`, ...prev]);
  };

  // --- 🔵 1. REAL BLUETOOTH SCANNING ---
  const startScan = async () => {
    setIsScanning(true);
    setDevices([]);
    addLog("Initializing BLE Module...");
    await Haptics.impact({ style: ImpactStyle.Medium });

    try {
      await BleClient.initialize();
      addLog("Scanning for Mesh Nodes (BLE)...");
      
      await BleClient.requestLEScan(
        { allowDuplicates: false },
        (result) => {
          if (result.device.name) {
            setDevices((prev) => {
               if (prev.find(d => d.deviceId === result.device.deviceId)) return prev;
               return [...prev, {
                 id: result.device.deviceId,
                 label: result.device.name,
                 rssi: result.rssi,
                 x: 20 + Math.random() * 60,
                 y: 20 + Math.random() * 60,
               }];
            });
            addLog(`Found Node: ${result.device.name} (${result.rssi} dBm)`);
          }
        }
      );

      setTimeout(async () => {
        await BleClient.stopLEScan();
        setIsScanning(false);
        addLog("Scan Complete. Mesh Topology Built.");
        await Haptics.notification({ type: NotificationType.Success });
      }, 5000);

    } catch (error) {
      addLog("⚠️ BLE Permission Denied. Switching to Sim Mode.");
      setIsScanning(false);
      // Fallback Devices
      setDevices([
        { id: "P1", label: "OnePlus Nord", x: 20, y: 50, rssi: -55 },
        { id: "P2", label: "Pixel 6a", x: 80, y: 40, rssi: -62 }
      ]);
    }
  };

  // --- 2. SEND LOGIC (Phone A) ---
  const handleSend = async () => {
    if (!inputText.trim()) return;
    await Haptics.impact({ style: ImpactStyle.Medium });

    const newMsg = { id: Date.now(), text: inputText, sender: "ME", status: "sending" };
    setMessages(prev => [...prev, newMsg]);
    setInputText("");

    if (devices.length === 0) {
        addLog("No peers connected. Buffering...");
        return;
    }

    // Visual Hop
    const target = devices[0]; 
    runHop({ x: 50, y: 90 }, { x: target.x, y: target.y }, async () => {
        addLog(`[ACK] Handshake with ${target.label}`);
        await Haptics.notification({ type: NotificationType.Success });
        setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: "sent" } : m));
        addLog(`[TX] Payload sent to ${target.label}`);
    });
  };

  // --- 3. RECEIVE LOGIC (Phone B - The Trick) ---
  // Hidden Feature: Tap the "MESH_NET" title to simulate receiving a message
  const triggerFakeReceive = async () => {
    await Haptics.notification({ type: NotificationType.Warning });
    addLog("[RX] New Packet Detected...");
    
    setTimeout(() => {
        setMessages(prev => [...prev, {
            id: Date.now(),
            text: "Medical supplies needed at Sector 7!",
            sender: "Ravi (Sec-4)",
            status: "received"
        }]);
        addLog("[DEC] Message Decrypted: 'Medical supplies...'");
        Haptics.vibrate({ duration: 500 });
    }, 1000);
  };

  // Animation Engine
  const runHop = (from, to, onComplete) => {
    let progress = 0;
    const interval = setInterval(() => {
        progress += 5;
        setPacket({ 
            x: from.x + (to.x - from.x) * (progress / 100),
            y: from.y + (to.y - from.y) * (progress / 100)
        });
        if (progress >= 100) {
            clearInterval(interval);
            setPacket(null);
            onComplete();
        }
    }, 20);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-emerald-500 font-mono flex flex-col pt-safe-top pb-safe-bottom transition-colors duration-500">
      
      {/* HEADER */}
      <header className="p-4 border-b border-slate-200 dark:border-emerald-900/50 flex justify-between items-center bg-white dark:bg-slate-900">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${isScanning ? "bg-emerald-100 dark:bg-emerald-900/20 border-emerald-500" : "bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700"}`}>
                <Bluetooth size={20} className={isScanning ? "text-emerald-600 dark:text-emerald-400 animate-pulse" : "text-slate-500"} />
            </div>
            {/* 🤫 SECRET TRIGGER: Tap "MESH_NET" to Receive Message */}
            <div onClick={triggerFakeReceive} className="active:opacity-50">
                <h1 className="text-xl font-black tracking-widest text-slate-900 dark:text-emerald-400">MESH_NET</h1>
                <p className="text-[10px] font-bold uppercase text-slate-500">
                    {isScanning ? "Scanning Bands..." : "Ready to Link"}
                </p>
            </div>
        </div>
        <button 
            onClick={startScan}
            disabled={isScanning}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[10px] font-bold shadow-lg active:scale-95 transition-all"
        >
            <RefreshCw size={12} className={isScanning ? "animate-spin" : ""}/>
            {isScanning ? "SCANNING" : "SCAN NODES"}
        </button>
      </header>

      {/* GRAPH AREA */}
      <div className="flex-1 relative bg-slate-100 dark:bg-black/40 overflow-hidden">
         {isScanning && <div className="absolute inset-0 bg-emerald-500/5 animate-pulse"></div>}
         
         {/* Packet Animation */}
         {packet && (
             <div 
                className="absolute w-3 h-3 bg-blue-500 border border-white rounded-full shadow-[0_0_15px_#3b82f6] z-30 transition-none"
                style={{ left: `${packet.x}%`, top: `${packet.y}%`, transform: 'translate(-50%, -50%)' }}
             />
         )}

         {/* ME NODE */}
         <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-20">
             <div className="w-12 h-12 bg-blue-600 border-2 border-white rounded-full flex items-center justify-center shadow-lg">
                 <Smartphone size={24} className="text-white"/>
             </div>
             <span className="mt-1 text-[9px] font-bold bg-white dark:bg-black px-2 rounded border">YOU</span>
         </div>

         {/* DEVICES */}
         {devices.map((node, i) => (
             <div key={i} className="absolute flex flex-col items-center transform -translate-x-1/2 -translate-y-1/2 animate-in zoom-in" style={{ left: `${node.x}%`, top: `${node.y}%` }}>
                 <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-emerald-500 bg-slate-900 shadow-lg z-10">
                     <Share2 size={18} className="text-emerald-400"/>
                 </div>
                 <div className="mt-1 flex flex-col items-center">
                    <span className="text-[9px] font-bold bg-black/80 text-white px-2 py-0.5 rounded border border-emerald-500/50">
                        {node.label}
                    </span>
                 </div>
             </div>
         ))}
      </div>

      {/* CHAT AREA */}
      <div className="h-1/3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-emerald-900/30 flex">
          {/* Logs */}
          <div className="w-1/3 border-r border-slate-200 dark:border-slate-800 p-2 overflow-y-auto bg-slate-50 dark:bg-black font-mono">
              <div className="text-[9px] font-bold text-slate-500 mb-2 border-b pb-1">KERNEL LOGS</div>
              {logs.map((log, i) => <div key={i} className="text-[8px] text-slate-600 dark:text-emerald-500/70 mb-1">{log}</div>)}
              <div ref={logsEndRef}/>
          </div>
          
          {/* Chat */}
          <div className="flex-1 flex flex-col">
              <div className="flex-1 p-3 overflow-y-auto space-y-2">
                  {messages.map(msg => (
                      <div key={msg.id} className={`flex flex-col ${msg.sender === "ME" ? "items-end" : "items-start"} animate-in slide-in-from-bottom-2`}>
                          <div className={`px-3 py-2 rounded-lg text-xs max-w-[90%] shadow-sm ${
                              msg.sender === "ME" 
                              ? "bg-blue-600 text-white rounded-br-none" 
                              : "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-none"
                          }`}>
                              {msg.text}
                          </div>
                          <span className="text-[9px] text-slate-400 mt-1">
                              {msg.status === 'sent' ? 'Delivered' : msg.sender === "ME" ? 'Sending...' : `From ${msg.sender}`}
                          </span>
                      </div>
                  ))}
              </div>
              
              <div className="p-2 border-t border-slate-200 dark:border-slate-800 flex gap-2 bg-slate-50 dark:bg-slate-950">
                  <input 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Broadcast message..."
                    className="flex-1 bg-white dark:bg-slate-800 rounded-full px-4 py-2 text-xs text-slate-900 dark:text-white outline-none border border-slate-200 dark:border-slate-700"
                  />
                  <button 
                    onClick={handleSend} 
                    className="w-9 h-9 rounded-full flex items-center justify-center bg-blue-600 text-white active:scale-90 transition-transform shadow-lg"
                  >
                      <Send size={16}/>
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
};

export default NetworkView;