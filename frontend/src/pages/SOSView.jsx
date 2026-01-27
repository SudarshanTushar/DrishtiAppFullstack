import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, Send, Phone, MapPin, 
  ShieldAlert, Wifi, WifiOff, Radio, CheckCircle 
} from 'lucide-react';
import { useMeshNetwork } from '../hooks/useMeshNetwork'; // Import the Mesh Hook
import { Geolocation } from '@capacitor/geolocation';

const SOSView = () => {
  // 1. INTEGRATE MESH NETWORK
  const { sendMessage: sendMeshMessage, startMesh, isRunning: isMeshRunning } = useMeshNetwork();

  const [status, setStatus] = useState("READY"); // READY, SENDING, SENT, FAILED
  const [location, setLocation] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [mode, setMode] = useState(navigator.onLine ? "CLOUD" : "MESH");

  // Monitor Network Status
  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); setMode("CLOUD"); };
    const handleOffline = () => { setIsOnline(false); setMode("MESH"); };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Get initial location
    getCurrentLocation();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getCurrentLocation = async () => {
    try {
      const coordinates = await Geolocation.getCurrentPosition();
      setLocation({
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude
      });
    } catch (error) {
      console.error("Location Error:", error);
      // Fallback for demo
      setLocation({ lat: 26.14, lng: 91.73 });
    }
  };

  const handleSOS = async () => {
    setStatus("SENDING");
    
    // Payload
    const sosPayload = JSON.stringify({
      type: "CRITICAL_SOS",
      lat: location?.lat || 0,
      lng: location?.lng || 0,
      timestamp: Date.now(),
      uid: "USER-" + Math.floor(Math.random() * 1000)
    });

    try {
      if (isOnline) {
        // --- PLAN A: CLOUD API ---
        console.log("Attempting Cloud Dispatch...");
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mock success (replace with real API call if available)
        setStatus("SENT_CLOUD");
      
      } else {
        // --- PLAN B: MESH NETWORK (DTN) ---
        console.log("Cloud Unreachable. Engaging Mesh Protocol...");
        
        // 1. Ensure Mesh is Active
        if (!isMeshRunning) {
          console.log("Booting Radio Layer...");
          await startMesh();
          // Wait for radio spin-up
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // 2. Broadcast via Bluetooth
        const success = await sendMeshMessage(sosPayload, 'BROADCAST');
        
        if (success) {
          setStatus("SENT_MESH");
        } else {
          throw new Error("Mesh Propagation Failed");
        }
      }
    } catch (error) {
      console.error("SOS Failed:", error);
      setStatus("FAILED");
    }
  };

  return (
    <div className={`min-h-screen flex flex-col p-6 transition-colors duration-500 ${status === 'SENDING' ? 'bg-red-900' : 'bg-slate-900'} text-white relative overflow-hidden`}>
      
      {/* Background Pulse Animation */}
      {status === 'SENDING' && (
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-red-600 animate-ping opacity-20"></div>
        </div>
      )}

      {/* HEADER */}
      <div className="relative z-10 flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <ShieldAlert className="text-red-500" size={28} />
          <h1 className="text-2xl font-black tracking-tighter">EMERGENCY</h1>
        </div>
        <div className={`px-3 py-1 rounded-full border flex items-center gap-2 text-xs font-bold ${isOnline ? 'bg-blue-900/50 border-blue-500 text-blue-200' : 'bg-amber-900/50 border-amber-500 text-amber-200'}`}>
          {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
          {isOnline ? "CLOUD LINK" : "MESH MODE"}
        </div>
      </div>

      {/* MAIN SOS BUTTON */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
        <button 
          onClick={handleSOS}
          disabled={status === 'SENDING' || status.includes('SENT')}
          className={`
            w-64 h-64 rounded-full border-8 border-slate-800 shadow-[0_0_50px_rgba(239,68,68,0.3)]
            flex flex-col items-center justify-center transition-all duration-300 transform
            ${status === 'SENDING' ? 'scale-95 bg-red-800 border-red-900' : 'bg-gradient-to-br from-red-600 to-red-800 hover:scale-105 active:scale-95'}
            ${status.includes('SENT') ? 'bg-green-600 border-green-800' : ''}
          `}
        >
          {status === 'READY' && (
            <>
              <AlertTriangle size={64} className="mb-2 text-white/90" />
              <span className="text-3xl font-black">SOS</span>
              <span className="text-xs text-white/70 mt-1">HOLD FOR HELP</span>
            </>
          )}

          {status === 'SENDING' && (
            <>
              <Radio size={64} className="mb-2 text-white/90 animate-pulse" />
              <span className="text-xl font-bold animate-pulse">BROADCASTING...</span>
              <span className="text-xs text-white/70 mt-1">{mode === 'MESH' ? 'VIA BLUETOOTH' : 'VIA SATELLITE'}</span>
            </>
          )}

          {status === 'SENT_CLOUD' && (
            <>
              <CheckCircle size={64} className="mb-2 text-white" />
              <span className="text-xl font-bold">DISPATCHED</span>
              <span className="text-xs text-blue-200 mt-1 bg-blue-900/50 px-2 py-1 rounded">SERVER CONFIRMED</span>
            </>
          )}

          {status === 'SENT_MESH' && (
            <>
              <Radio size={64} className="mb-2 text-white" />
              <span className="text-xl font-bold">MESH RELAYED</span>
              <span className="text-xs text-amber-200 mt-1 bg-amber-900/50 px-2 py-1 rounded">OFFLINE PROTOCOL</span>
            </>
          )}
        </button>

        {/* Location Status */}
        <div className="mt-8 flex items-center gap-2 text-slate-400 bg-slate-800/50 px-4 py-2 rounded-lg">
          <MapPin size={16} className={location ? "text-green-400" : "text-slate-500"} />
          <span className="text-xs font-mono">
            {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "ACQUIRING GPS..."}
          </span>
        </div>
      </div>

      {/* FOOTER INFO */}
      <div className="relative z-10 mt-auto pt-6 border-t border-slate-800">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-slate-800 rounded-lg">
            <Phone size={20} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">Emergency Contacts</h3>
            <p className="text-xs text-slate-500">Alerts will be forwarded to nearby NDRF units and registered family members.</p>
          </div>
        </div>
        
        {/* MESH STATUS INDICATOR */}
        {!isOnline && (
          <div className="mt-4 bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg flex items-center gap-3">
            <div className="relative">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping absolute"></div>
              <div className="w-2 h-2 bg-amber-500 rounded-full relative"></div>
            </div>
            <div>
              <p className="text-xs font-bold text-amber-400">DRISHTI MESH ACTIVE</p>
              <p className="text-[10px] text-amber-200/70">Scanning for peer devices to relay SOS...</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default SOSView;