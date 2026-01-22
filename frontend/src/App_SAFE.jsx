// ════════════════════════════════════════════════════════════════════════════
// APP.JSX - SAFE SHELL (ZERO CRASH GUARANTEE)
// ════════════════════════════════════════════════════════════════════════════
//
// PURPOSE: Minimal, fast, crash-free app shell
//
// DOES:
// ✅ Splash screen
// ✅ Navigation container
// ✅ Theme provider
// ✅ Error boundaries
//
// DOES NOT:
// ❌ Initialize DTN
// ❌ Start Bluetooth
// ❌ Load maps
// ❌ Access hardware
// ❌ Make network calls
//
// BOOT TARGET: < 100ms to interactive
//
// ════════════════════════════════════════════════════════════════════════════

import React, { lazy, Suspense, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// ──────────────────────────────────────────────────────────────────────────
// EAGER IMPORTS (Safe, small, essential only)
// ──────────────────────────────────────────────────────────────────────────

import "./App_SAFE.css";

// Import screen-specific CSS (these are lightweight)
import "./pages/HomeScreen.css";
import "./pages/OfflineNetworkScreen.css";

// Platform detection (safe)
import { Capacitor } from "@capacitor/core";

// ──────────────────────────────────────────────────────────────────────────
// LAZY IMPORTS (All heavy features)
// ──────────────────────────────────────────────────────────────────────────

const HomeScreen = lazy(() => import("./pages/HomeScreen"));
const MapScreen = lazy(() => import("./pages/MapView"));
const SosScreen = lazy(() => import("./pages/SOSView"));
const OfflineNetworkScreen = lazy(() => import("./pages/OfflineNetworkScreen"));
const CommandScreen = lazy(() => import("./pages/AdminView"));
const SettingsScreen = lazy(() => import("./pages/SettingsView"));

// ──────────────────────────────────────────────────────────────────────────
// LOADING COMPONENTS
// ──────────────────────────────────────────────────────────────────────────

const SplashScreen = () => (
  <div className="splash-screen">
    <div className="splash-content">
      <div className="splash-logo">🚨</div>
      <h1 className="splash-title">DrishtiNE</h1>
      <p className="splash-subtitle">Emergency Response System</p>
      <div className="splash-spinner"></div>
    </div>
  </div>
);

const LoadingFallback = ({ screen = "Screen" }) => (
  <div className="loading-fallback">
    <div className="loading-spinner"></div>
    <p className="loading-text">Loading {screen}...</p>
  </div>
);

// ──────────────────────────────────────────────────────────────────────────
// ERROR BOUNDARY
// ──────────────────────────────────────────────────────────────────────────

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("App Error:", error, errorInfo);

    // Log to crash reporting service (if available)
    if (window.crashReporter) {
      window.crashReporter.log(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-screen">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <h1 className="error-title">System Error</h1>
            <p className="error-message">
              An unexpected error occurred. The app will restart.
            </p>
            <button
              className="error-button"
              onClick={() => window.location.reload()}
            >
              Restart App
            </button>
            <details className="error-details">
              <summary>Technical Details</summary>
              <pre>{this.state.error?.toString()}</pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// MAIN APP COMPONENT
// ──────────────────────────────────────────────────────────────────────────

function App() {
  const [isReady, setIsReady] = useState(false);
  const [authUser, setAuthUser] = useState(null);

  // ────────────────────────────────────────────────────────────────────────
  // SAFE INITIALIZATION (No heavy operations)
  // ────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const initialize = async () => {
      try {
        // Only do SAFE, FAST initialization

        // 1. Detect platform (already done via Capacitor)
        const platform = Capacitor.getPlatform();
        console.log("Platform:", platform);

        // 2. Load saved auth state (localStorage only)
        const savedUser = localStorage.getItem("auth_user");
        if (savedUser) {
          try {
            setAuthUser(JSON.parse(savedUser));
          } catch (e) {
            console.warn("Auth parse error", e);
          }
        }

        // 3. Mark as ready (< 100ms)
        setIsReady(true);
      } catch (error) {
        console.error("Initialization error:", error);
        // Still mark as ready (fail gracefully)
        setIsReady(true);
      }
    };

    initialize();
  }, []);

  // ────────────────────────────────────────────────────────────────────────
  // SHOW SPLASH WHILE INITIALIZING
  // ────────────────────────────────────────────────────────────────────────

  if (!isReady) {
    return <SplashScreen />;
  }

  // ────────────────────────────────────────────────────────────────────────
  // MAIN APP RENDER
  // ────────────────────────────────────────────────────────────────────────

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="app-container">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Home (default) */}
              <Route path="/" element={<HomeScreen />} />

              {/* Main features (lazy-loaded) */}
              <Route
                path="/map"
                element={
                  <Suspense fallback={<LoadingFallback screen="Map" />}>
                    <MapScreen />
                  </Suspense>
                }
              />

              <Route
                path="/sos"
                element={
                  <Suspense
                    fallback={<LoadingFallback screen="Emergency SOS" />}
                  >
                    <SosScreen />
                  </Suspense>
                }
              />

              <Route
                path="/network"
                element={
                  <Suspense
                    fallback={<LoadingFallback screen="Offline Network" />}
                  >
                    <OfflineNetworkScreen />
                  </Suspense>
                }
              />

              {/* Command dashboard (auth required) */}
              <Route
                path="/command"
                element={
                  authUser?.role === "AUTHORITY" ? (
                    <Suspense
                      fallback={<LoadingFallback screen="Command Center" />}
                    >
                      <CommandScreen />
                    </Suspense>
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />

              <Route
                path="/settings"
                element={
                  <Suspense fallback={<LoadingFallback screen="Settings" />}>
                    <SettingsScreen />
                  </Suspense>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
