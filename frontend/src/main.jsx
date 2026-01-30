import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { I18nProvider } from './i18n.jsx';

// --- 🗺️ MAP ENGINE FIXES (Crucial for Offline Maps) ---
// 1. Import Leaflet CSS so the map isn't broken
import "leaflet/dist/leaflet.css"; 
// 2. Import Leaflet JS to fix the "Invisible Marker" bug in production
import L from 'leaflet';

// 3. Manually override the default icon logic
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// --- 🛡️ CRASH PROTECTION SYSTEM ---
// This prevents "White Screen of Death" during the demo.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("🚨 SYSTEM CRITICAL FAILURE:", error, errorInfo);
  }

  // FIX: EMERGENCY RESET FUNCTION
  handleReset = () => {
    localStorage.clear(); // Clear bad data
    sessionStorage.clear(); // Clear boot state
    window.location.href = "/"; // Hard reload to root
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="bg-red-500/10 border border-red-500 p-6 rounded-3xl max-w-sm w-full shadow-2xl">
            <h1 className="text-3xl font-black text-red-500 mb-2">⚠️ SYSTEM FAULT</h1>
            <p className="text-slate-400 text-sm mb-6 font-mono">
              Critical runtime exception detected in Command Node.
            </p>

            <div className="bg-black/50 p-4 rounded-xl text-left mb-6 border border-red-900/50 overflow-hidden">
              <p className="text-[10px] font-mono text-red-400 break-words">
                {this.state.error?.toString() || "Unknown Error"}
              </p>
            </div>

            <button
              onClick={this.handleReset}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>🔄 FACTORY RESET & REBOOT</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- 🚀 APP ENTRY POINT ---
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 1. Language Provider (Global State) */}
    <I18nProvider>
      {/* 2. Error Boundary (Crash Protection) */}
      <ErrorBoundary>
        {/* 3. Main App Logic */}
        <App />
      </ErrorBoundary>
    </I18nProvider>
  </React.StrictMode>,
)