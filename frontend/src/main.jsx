import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom'; // 👈 CRITICAL: Must use HashRouter for Android APK
import App from './App.jsx';
import './index.css';
import { I18nProvider } from './i18n.jsx';

// --- 🗺️ LEAFLET FIXES (Keep as fallback) ---
import "leaflet/dist/leaflet.css"; 
import L from 'leaflet';
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

  handleReset = () => {
    localStorage.clear(); 
    sessionStorage.clear(); 
    window.location.reload(); 
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
    <I18nProvider>
      <ErrorBoundary>
        {/* ✅ HashRouter is used here to ensure routing works inside the Android APK */}
        <HashRouter>
          <App />
        </HashRouter>
      </ErrorBoundary>
    </I18nProvider>
  </React.StrictMode>,
);