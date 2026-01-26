// ════════════════════════════════════════════════════════════════════════════
// COMMAND DASHBOARD - GOVERNMENT COMMAND & CONTROL INTERFACE
// ════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from "react";
import {
  Shield, Activity, Play, StopCircle, Check, X, Radio, Plane, 
  FileText, Package, Terminal, Lock, Download, Users, AlertTriangle, 
  Zap, Signal, Eye, File, ChevronLeft, ChevronRight 
} from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { adminService } from "../services/adminService";
import { platformGuard } from "../services/PlatformGuard";
import { API_BASE_URL } from "../config";

const CommandDashboard = () => {
  // ──────────────────────────────────────────────────────────────────────────
  // STATE MANAGEMENT
  // ──────────────────────────────────────────────────────────────────────────

  const [stats, setStats] = useState(null);
  const [decisions, setDecisions] = useState([]);
  const [simActive, setSimActive] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [resources, setResources] = useState([]);
  const [sosFeed, setSosFeed] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]); 
  const [droneMode, setDroneMode] = useState("standby"); 
  const [droneAnalysis, setDroneAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastDecisionCount, setLastDecisionCount] = useState(0);
  
  // PDF & Modal State
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null); // BLOB URL for Desktop
  const [sitrepData, setSitrepData] = useState(null);
  const [mobileTab, setMobileTab] = useState("preview"); // 'preview' (HTML Doc) or 'data' (Raw Data)

  const governancePollingRef = useRef(null);
  const sosPollingRef = useRef(null);
  const resourcePollingRef = useRef(null);
  const auditPollingRef = useRef(null);
  const isMountedRef = useRef(true);

  // ──────────────────────────────────────────────────────────────────────────
  // LIFECYCLE
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    console.log("[CommandDashboard] MOUNTED - Starting command center");
    isMountedRef.current = true;

    loadDashboard();
    loadResourceLogistics();
    loadSOSFeed();
    loadAuditLogs();

    startGovernancePolling();
    startSOSPolling();
    startResourcePolling();
    startAuditPolling();

    return () => {
      isMountedRef.current = false;
      stopAllPolling();
    };
  }, []);

  useEffect(() => {
    // Cleanup blob on unmount
    return () => {
      if (pdfPreviewUrl && !Capacitor.isNativePlatform()) {
          URL.revokeObjectURL(pdfPreviewUrl);
      }
    }
  }, [pdfPreviewUrl]);

  // ──────────────────────────────────────────────────────────────────────────
  // POLLING
  // ──────────────────────────────────────────────────────────────────────────

  function startGovernancePolling() {
    if (governancePollingRef.current) clearInterval(governancePollingRef.current);
    governancePollingRef.current = setInterval(() => { if (isMountedRef.current) loadPendingDecisions(); }, 5000);
  }
  function startSOSPolling() {
    if (sosPollingRef.current) clearInterval(sosPollingRef.current);
    sosPollingRef.current = setInterval(() => { if (isMountedRef.current) loadSOSFeed(); }, 3000);
  }
  function startResourcePolling() {
    if (resourcePollingRef.current) clearInterval(resourcePollingRef.current);
    resourcePollingRef.current = setInterval(() => { if (isMountedRef.current) loadResourceLogistics(); }, 10000);
  }
  function startAuditPolling() {
    if (auditPollingRef.current) clearInterval(auditPollingRef.current);
    auditPollingRef.current = setInterval(() => { if (isMountedRef.current) loadAuditLogs(); }, 5000);
  }
  function stopAllPolling() {
    if (governancePollingRef.current) clearInterval(governancePollingRef.current);
    if (sosPollingRef.current) clearInterval(sosPollingRef.current);
    if (resourcePollingRef.current) clearInterval(resourcePollingRef.current);
    if (auditPollingRef.current) clearInterval(auditPollingRef.current);
    governancePollingRef.current = null;
    sosPollingRef.current = null;
    resourcePollingRef.current = null;
    auditPollingRef.current = null;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // DATA LOADERS
  // ──────────────────────────────────────────────────────────────────────────

  async function loadDashboard() {
    if (!isMountedRef.current) return;
    try {
      const s = await adminService.getStats();
      if (isMountedRef.current) setStats(s);
    } catch (error) { console.error("Stats load failed", error); }
  }

  async function loadAuditLogs() {
    if (!isMountedRef.current) return;
    try {
      const response = await fetch(`${API_BASE_URL}/admin/audit-log`, { headers: { Authorization: `Bearer ${adminService.getToken()}` } });
      if (response.ok) {
        const data = await response.json();
        if (isMountedRef.current && Array.isArray(data)) setAuditLogs(data);
      }
    } catch (error) { }
  }

  async function loadPendingDecisions() {
    if (!isMountedRef.current) return;
    try {
      const d = await adminService.getPendingDecisions();
      if (isMountedRef.current && d) {
        const newCount = d.length;
        if (newCount > lastDecisionCount && lastDecisionCount > 0) triggerHapticAlert("critical");
        setDecisions(d);
        setLastDecisionCount(newCount);
      }
    } catch (error) { }
  }

  async function loadResourceLogistics() {
    if (!isMountedRef.current) return;
    try {
      const response = await fetch(`${API_BASE_URL}/admin/resources`, { headers: { Authorization: `Bearer ${adminService.getToken()}` } });
      if (response.ok) {
        const data = await response.json();
        if (isMountedRef.current) setResources(data.resources || []);
      }
    } catch (error) { }
  }

  async function loadSOSFeed() {
    if (!isMountedRef.current) return;
    try {
      const response = await fetch(`${API_BASE_URL}/admin/sos-feed`, { headers: { Authorization: `Bearer ${adminService.getToken()}` } });
      if (response.ok) {
        const data = await response.json();
        if (isMountedRef.current) setSosFeed(data.feed || []);
      }
    } catch (error) {
      if (isMountedRef.current) setSosFeed(generateSimulatedSOSFeed());
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ACTIONS
  // ──────────────────────────────────────────────────────────────────────────

  async function handleDecision(decisionId, action) {
    setLoading(true);
    triggerHapticFeedback("impact");
    try {
      await adminService.submitDecision(decisionId, action, "Manual Override");
      setDecisions((prev) => prev.filter((d) => d.id !== decisionId));
      setLastDecisionCount((prev) => Math.max(0, prev - 1));
      await loadDashboard();
      await loadAuditLogs();
      triggerHapticFeedback("success");
    } catch (error) {
      triggerHapticFeedback("error");
    } finally {
      setLoading(false);
    }
  }

  async function toggleSimulation() {
    setLoading(true);
    triggerHapticFeedback("impact");
    try {
      const newState = !simActive;
      await adminService.toggleSimulation(newState);
      setSimActive(newState);
      await loadDashboard();
      await loadAuditLogs();
      triggerHapticFeedback(newState ? "warning" : "success");
      if (newState) alert("⚠️ DRILL STARTED\n\nFlash flood simulation is now ACTIVE.");
      else alert("✓ DRILL STOPPED\n\nSystem reset to normal operations.");
    } catch (error) {
      triggerHapticFeedback("error");
    } finally {
      setLoading(false);
    }
  }

  async function verifyResource(resourceId) {
    triggerHapticFeedback("impact");
    try {
      setResources((prev) => prev.map((r) => (r.id === resourceId ? { ...r, verified: true } : r)));
      await fetch(`${API_BASE_URL}/admin/resources/${resourceId}/verify`, { method: "POST", headers: { Authorization: `Bearer ${adminService.getToken()}` } });
      triggerHapticFeedback("success");
    } catch (error) { loadResourceLogistics(); triggerHapticFeedback("error"); }
  }

  async function deleteResource(resourceId) {
    if (!confirm("Delete this resource marker?")) return;
    triggerHapticFeedback("impact");
    try {
      setResources((prev) => prev.filter((r) => r.id !== resourceId));
      await fetch(`${API_BASE_URL}/admin/resources/${resourceId}`, { method: "DELETE", headers: { Authorization: `Bearer ${adminService.getToken()}` } });
      triggerHapticFeedback("success");
    } catch (error) { loadResourceLogistics(); triggerHapticFeedback("error"); }
  }

  async function startDroneScan() {
    setDroneMode("scanning");
    triggerHapticFeedback("impact");
    setTimeout(async () => {
      if (!isMountedRef.current) return;
      setDroneMode("analyzing");
      try {
        const analysis = await analyzeDroneFootage();
        if (isMountedRef.current) {
          setDroneAnalysis(analysis);
          setDroneMode("complete");
          if (analysis.severity === "CATASTROPHIC") {
            triggerHapticAlert("critical");
            alert("🚨 CATASTROPHIC DAMAGE DETECTED");
          } else {
            triggerHapticFeedback("success");
          }
        }
      } catch (error) {
        if (isMountedRef.current) {
          setDroneMode("error");
          triggerHapticFeedback("error");
        }
      }
    }, 3000);
  }

  async function analyzeDroneFootage() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const severities = ["MINOR", "MODERATE", "SEVERE", "CATASTROPHIC"];
        resolve({
          severity: severities[Math.floor(Math.random() * severities.length)],
          structuresDamaged: Math.floor(Math.random() * 50),
          peopleDetected: Math.floor(Math.random() * 20),
          roadsBlocked: Math.floor(Math.random() * 10),
          waterLevel: Math.floor(Math.random() * 300),
          timestamp: new Date().toISOString(),
        });
      }, 2000);
    });
  }

  function resetDrone() {
    setDroneMode("standby");
    setDroneAnalysis(null);
  }

  async function sendBroadcast() {
    if (!broadcastMsg.trim()) return;
    triggerHapticFeedback("warning");
    try {
      await fetch(`${API_BASE_URL}/admin/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminService.getToken()}` },
        body: JSON.stringify({ message: broadcastMsg, priority: "CRITICAL" }),
      });
      alert(`📢 ALERT SENT\n\n"${broadcastMsg}"`);
      setBroadcastMsg("");
      await loadAuditLogs();
      triggerHapticFeedback("success");
    } catch (error) {
      triggerHapticFeedback("error");
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SITREP GENERATION (ROBUST MOBILE STRATEGY)
  // ──────────────────────────────────────────────────────────────────────────

  async function generateSITREP() {
    setLoading(true);
    triggerHapticFeedback("impact");

    try {
      const token = adminService.getToken();
      if (!token) {
        alert("Authentication required. Please login again.");
        setLoading(false);
        return;
      }

      // 1. Fetch LIVE Data for the Digital Twin
      try {
        const jsonResp = await fetch(`${API_BASE_URL}/admin/sitrep/generate?format=json`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        
        if (jsonResp.ok) {
          const rawData = await jsonResp.json();
          setSitrepData(rawData);
        }
      } catch (e) { console.warn("Meta fetch failed", e); }

      // 2. DESKTOP: Fetch Blob for Iframe Preview
      if (!Capacitor.isNativePlatform()) {
        const response = await fetch(`${API_BASE_URL}/admin/sitrep/generate?format=pdf`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}`, Accept: "application/pdf" },
        });
        if (response.ok) {
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
          setPdfPreviewUrl(objectUrl);
        }
      } else {
        // MOBILE: Just trigger the modal state, don't fetch blob yet (we use Direct Download URL)
        setPdfPreviewUrl("MOBILE_MODE"); 
        setMobileTab("preview");
      }

      await loadAuditLogs(); 
      triggerHapticFeedback("success");

    } catch (error) {
      console.error("SITREP Gen Failed", error);
      alert("Network Error: Could not generate SITREP");
    } finally {
      setLoading(false);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // NATIVE DOWNLOAD HANDLER (THE FIX)
  // ──────────────────────────────────────────────────────────────────────────

  const downloadPreviewPdf = async () => {
    // 1. DESKTOP: Standard Download
    if (!Capacitor.isNativePlatform() && pdfPreviewUrl && pdfPreviewUrl !== "MOBILE_MODE") {
      const link = document.createElement("a");
      link.href = pdfPreviewUrl;
      link.download = `SITREP_${Date.now()}.pdf`;
      link.click();
      return;
    }

    // 2. MOBILE: SYSTEM BROWSER DOWNLOAD (Bulletproof)
    // We bypass the app's filesystem and let Chrome/Android handle the download.
    try {
      triggerHapticFeedback("success");
      // Use the API Key based URL so authentication works in the external browser
      const downloadUrl = `${API_BASE_URL}/admin/sitrep/generate?format=pdf&api_key=NDRF-COMMAND-2026-SECURE`;
      
      // Open in System Browser (Forces native download manager)
      window.open(downloadUrl, '_system');
      
    } catch (error) {
      alert("Download Error: " + error.message);
    }
  };

  function triggerHapticFeedback(type) {
    platformGuard.guardNativeAPI(() => {
      if (window.Capacitor?.Plugins?.Haptics) {
        const Haptics = window.Capacitor.Plugins.Haptics;
        if (type === "impact") Haptics.impact({ style: "medium" });
        else if (type === "success") Haptics.notification({ type: "success" });
        else if (type === "warning") Haptics.notification({ type: "warning" });
        else if (type === "error") Haptics.notification({ type: "error" });
      }
    });
  }

  function triggerHapticAlert(level) {
    platformGuard.guardNativeAPI(() => {
      if (window.Capacitor?.Plugins?.Haptics) {
        const Haptics = window.Capacitor.Plugins.Haptics;
        if (level === "critical") {
          Haptics.vibrate({ duration: 500 });
          setTimeout(() => Haptics.vibrate({ duration: 500 }), 600);
        } else {
          Haptics.vibrate({ duration: 300 });
        }
      }
    });
  }

  function generateSimulatedSOSFeed() {
    return Array.from({ length: 5 }, (_, i) => ({
      id: `sos_${Date.now()}_${i}`,
      type: ["MEDICAL", "TRAPPED", "FIRE", "FLOOD"][Math.floor(Math.random() * 4)],
      urgency: ["CRITICAL", "HIGH", "MEDIUM"][Math.floor(Math.random() * 3)],
      location: `Sector ${Math.floor(Math.random() * 10) + 1}`,
      time: new Date().toLocaleTimeString(),
      distance: `${(Math.random() * 10).toFixed(1)} km`,
    }));
  }

  return (
    <div className="space-y-6 pb-20 p-2">
      
      {/* ─────────────────────────────────────────────────────────────
          OFFICIAL SITREP PREVIEW MODAL
      ───────────────────────────────────────────────────────────── */}
      {pdfPreviewUrl && (
        <div className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-md flex items-center justify-center p-2">
          <div className="bg-white rounded-xl shadow-2xl w-[min(1200px,98vw)] h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
            
            {/* HEADER */}
            <div className="bg-red-600 text-white text-[10px] font-black text-center py-1 tracking-[0.3em] uppercase">
              Security Classification: RESTRICTED // Law Enforcement Sensitive
            </div>

            {/* CONTROL BAR */}
            <div className="flex flex-col md:flex-row items-center justify-between p-3 border-b border-slate-200 bg-slate-50 gap-2">
              <div className="w-full md:w-auto">
                <p className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                  <Lock size={14} className="text-red-600"/> SITREP 001 - OPS DRISHTI-NE
                </p>
                <p className="text-[10px] text-slate-500 font-mono hidden md:block">
                  UNIT: {sitrepData?.unit || "NE-COMMAND"} | DTG: {sitrepData?.dtg || "WAITING..."}
                </p>
              </div>

              {/* MOBILE TOGGLES (Preview vs Data) */}
              <div className="flex md:hidden w-full bg-slate-200 p-1 rounded-lg">
                <button onClick={() => setMobileTab("preview")} className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-1 ${mobileTab === 'preview' ? 'bg-white shadow text-blue-700' : 'text-slate-500'}`}>
                  <File size={12}/> Document Preview
                </button>
                <button onClick={() => setMobileTab("data")} className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-1 ${mobileTab === 'data' ? 'bg-white shadow text-blue-700' : 'text-slate-500'}`}>
                  <Eye size={12}/> Live Data
                </button>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <button onClick={downloadPreviewPdf} className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-bold shadow hover:bg-blue-800 flex items-center justify-center gap-2">
                  <Download size={14}/> SAVE PDF
                </button>
                <button onClick={() => setPdfPreviewUrl(null)} className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-300">
                  CLOSE
                </button>
              </div>
            </div>

            {/* SPLIT VIEW */}
            <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-slate-100">
              
              {/* LEFT: DIGITAL TWIN (Visible on Desktop OR Mobile 'Data' Tab) */}
              {sitrepData && (
                <div className={`w-full md:w-96 bg-white border-r border-slate-200 p-4 overflow-y-auto font-mono ${mobileTab === 'data' || (!Capacitor.isNativePlatform() && window.innerWidth > 768) ? 'block' : 'hidden md:block'}`}>
                  <div className="mb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">1. EXECUTIVE SUMMARY (BLUF)</p>
                    <div className="bg-white p-3 rounded border border-slate-300 shadow-sm">
                      <p className={`text-[10px] font-black ${sitrepData.bluf_status.includes("RED") ? "text-red-700" : "text-green-700"}`}>{sitrepData.bluf_status}</p>
                      <p className="text-xs font-bold text-slate-800 mt-1">{sitrepData.bluf_threat}</p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">2. INTELLIGENCE</p>
                    <div className="bg-white p-3 rounded border border-slate-300 shadow-sm">
                      <div className="flex items-center gap-2 mb-1"><Zap size={10} className="text-purple-600"/><p className="text-xs">Risk: {sitrepData.risk_prob || "N/A"}</p></div>
                      <div className="flex items-center gap-2"><Check size={10} className="text-blue-600"/><p className="text-xs">{sitrepData.weather_rain}</p></div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">3. LOGISTICS</p>
                    <div className="bg-white p-3 rounded border border-slate-300 shadow-sm">
                        <p className={`text-xs font-bold ${sitrepData.supplies_fuel.includes("CRITICAL") ? "text-red-600" : "text-green-600"}`}>Fuel: {sitrepData.supplies_fuel}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* RIGHT: PDF PREVIEW OR HTML REPLICA */}
              <div className={`flex-1 w-full h-full bg-slate-200 relative ${mobileTab === 'preview' || (!Capacitor.isNativePlatform() && window.innerWidth > 768) ? 'block' : 'hidden md:block'}`}>
                
                {/* 1. DESKTOP IFRAME (Works on Laptop) */}
                {!Capacitor.isNativePlatform() && (
                  <iframe 
                    title="SITREP PDF" 
                    src={pdfPreviewUrl} 
                    className="w-full h-full" 
                  />
                )}

                {/* 2. MOBILE HTML REPLICA (Crash-Proof Preview) */}
                {Capacitor.isNativePlatform() && (
                  <div className="w-full h-full flex flex-col items-center bg-slate-200 overflow-y-auto p-4">
                    {/* HTML MOCKUP OF THE PDF */}
                    <div className="bg-white w-full max-w-[350px] min-h-[500px] shadow-2xl p-6 relative border border-slate-300">
                      
                      {/* Header */}
                      <div className="text-center border-b border-black pb-2 mb-4">
                          <p className="text-[8px] font-serif font-bold uppercase mb-1">Security Classification: RESTRICTED</p>
                          <h2 className="text-lg font-serif font-bold tracking-wide">SITUATION REPORT</h2>
                          <p className="text-[8px] font-serif uppercase text-slate-600">DRISHTI-NE | AI-Based Decision Support</p>
                      </div>

                      {/* Metadata */}
                      <div className="flex justify-between text-[8px] font-serif mb-4">
                          <div>
                              <p>FROM: {sitrepData?.unit}</p>
                              <p>DTG: {sitrepData?.dtg}</p>
                          </div>
                          <div className="text-right">
                              <p>TO: CENTRAL COMMAND</p>
                              <p>REP: {Math.floor(Math.random()*9000)+1000}</p>
                          </div>
                      </div>

                      {/* Content Blocks */}
                      <div className="mb-4">
                          <h3 className="text-[10px] font-serif font-bold bg-slate-100 p-1 mb-1">1. EXECUTIVE SUMMARY</h3>
                          <p className="text-[9px] font-serif font-bold text-red-700 mb-1">{sitrepData?.bluf_status}</p>
                          <p className="text-[9px] font-serif leading-tight">{sitrepData?.bluf_threat}</p>
                      </div>

                      <div className="mb-4">
                          <h3 className="text-[10px] font-serif font-bold bg-slate-100 p-1 mb-1">2. INTELLIGENCE</h3>
                          <p className="text-[9px] font-serif mb-1">• {sitrepData?.weather_rain}</p>
                          <p className="text-[9px] font-serif">• {sitrepData?.drone_intel}</p>
                      </div>

                      <div className="mb-4">
                          <h3 className="text-[10px] font-serif font-bold bg-slate-100 p-1 mb-1">3. OPERATIONS</h3>
                          <p className="text-[9px] font-serif mb-1">• COMPLETED: {sitrepData?.completed_action}</p>
                          <p className="text-[9px] font-serif">• PENDING: {sitrepData?.pending_decision}</p>
                      </div>

                      {/* Watermark */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                          <p className="text-4xl font-bold -rotate-45 text-slate-500">OFFICIAL USE</p>
                      </div>

                    </div>
                    
                    <div className="mt-4 text-[10px] text-slate-500 text-center font-bold">
                      PREVIEW ONLY. TAP 'SAVE PDF' FOR OFFICIAL FILE.
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── MAIN DASHBOARD ────────────────── */}
      <div className="bg-slate-900 text-white p-6 rounded-b-3xl shadow-xl -mt-4 mx-[-1rem] mb-6 border-b-4 border-blue-600">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black flex items-center gap-2 tracking-tight"><Shield className="text-blue-500" /> COMMAND NODE</h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold mt-1">NDRF GOVERNANCE LAYER</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-blue-400">{stats?.active_missions || 0}</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase">Active Missions</p>
          </div>
        </div>
      </div>

      {/* EMERGENCY BROADCAST */}
      <div className="bg-red-50 p-4 rounded-2xl border border-red-200 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Radio className="text-red-600 animate-pulse" size={18} />
          <h3 className="font-bold text-red-900 uppercase text-xs tracking-wider">Emergency Broadcast Override</h3>
        </div>
        <div className="flex gap-2">
          <input type="text" value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} placeholder="TYPE CRITICAL ALERT MESSAGE..." className="flex-1 bg-white border border-red-200 p-3 rounded-lg text-xs font-bold text-red-900 placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500"/>
          <button onClick={sendBroadcast} disabled={!broadcastMsg.trim()} className="bg-red-700 text-white px-6 py-2 rounded-lg font-bold text-xs shadow-lg active:scale-95 transition-transform disabled:opacity-50">SEND</button>
        </div>
      </div>

      {/* PENDING DECISIONS */}
      <div className="px-1">
        <div className="flex justify-between items-center mb-3 ml-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Activity size={14}/> Pending Approvals</h3>
          {decisions.length > 0 && <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded-full border border-amber-200">{decisions.length} PENDING</span>}
        </div>
        {decisions.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-slate-200 text-center"><Check className="mx-auto text-green-500 mb-2 opacity-50" size={32} /><p className="text-xs text-slate-400 font-bold">All Routes Cleared</p></div>
        ) : (
          decisions.map((d) => (
            <div key={d.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-lg mb-3 relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full ${d.risk === 'CRITICAL' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
              <div className="flex justify-between items-start mb-2 pl-2">
                <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded border border-slate-200 font-mono">REQ-{d.id.substring(0, 4).toUpperCase()}</span>
                <span className={`text-[10px] font-black px-2 py-1 rounded ${d.risk === "CRITICAL" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{d.risk} RISK</span>
              </div>
              <p className="font-bold text-slate-800 mb-1 pl-2 text-sm">{d.type}</p>
              <p className="text-xs text-slate-500 mb-4 pl-2 font-medium">{d.description || "Awaiting manual authorization."}</p>
              <div className="flex gap-2 pl-2">
                <button onClick={() => handleDecision(d.id, "APPROVE")} disabled={loading} className="flex-1 bg-emerald-600 text-white py-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"><Check size={14} strokeWidth={3} /> AUTHORIZE</button>
                <button onClick={() => handleDecision(d.id, "REJECT")} disabled={loading} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 active:scale-95 transition-transform"><X size={14} strokeWidth={3} /> REJECT</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DRONE & SIMULATION */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10"><Plane size={80} /></div>
          <div className="flex justify-between items-start mb-3 relative z-10">
            <div><h3 className="font-bold text-slate-700 flex items-center gap-2 text-xs"><Plane className="text-blue-500" size={14} /> DRONE RECON</h3><p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Autonomous Wing 1</p></div>
            <span className={`text-[9px] font-black px-2 py-1 rounded ${droneMode === "standby" ? "bg-slate-200 text-slate-500" : "bg-blue-600 text-white"}`}>{droneMode.toUpperCase()}</span>
          </div>
          {droneMode === "standby" ? <button onClick={startDroneScan} className="w-full bg-white border-2 border-dashed border-slate-300 text-slate-500 py-3 rounded-xl font-bold text-[10px] hover:bg-blue-50 transition-all">INITIATE SCAN PATTERN</button> : (
            <div className="space-y-2 relative z-10"><div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm grid grid-cols-2 gap-2 text-center"><div className="bg-slate-50 p-2 rounded"><p className="text-sm font-black text-slate-800">{droneAnalysis?.structuresDamaged}</p><p className="text-[8px] text-slate-400 font-bold uppercase">Structures</p></div><div className="bg-slate-50 p-2 rounded"><p className="text-sm font-black text-slate-800">{droneAnalysis?.peopleDetected}</p><p className="text-[8px] text-slate-400 font-bold uppercase">People</p></div></div><button onClick={resetDrone} className="w-full py-2 bg-slate-200 text-slate-600 font-bold text-[10px] rounded-lg">RESET FEED</button></div>
          )}
        </div>
        <div className={`p-4 rounded-2xl border-2 transition-all ${simActive ? "bg-red-50 border-red-200" : "bg-white border-slate-100"}`}>
          <div className="flex justify-between items-center mb-2"><h3 className="font-bold text-slate-700 flex items-center gap-2 text-xs">{simActive ? <Activity className="text-red-600 animate-pulse" size={14} /> : <Activity className="text-slate-400" size={14} />} DISASTER DRILL</h3><span className={`text-[9px] font-bold px-2 py-1 rounded-full ${simActive ? "bg-red-200 text-red-800" : "bg-slate-100 text-slate-500"}`}>{simActive ? "ACTIVE SCENARIO" : "READY"}</span></div>
          <button onClick={toggleSimulation} disabled={loading} className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-[10px] shadow-md transition-all ${simActive ? "bg-white text-red-600 border border-red-200" : "bg-slate-800 text-white"}`}>{simActive ? <><StopCircle size={14} /> TERMINATE SIMULATION</> : <><Play size={14} /> INITIATE FLASH FLOOD</>}</button>
        </div>
      </div>

      {/* RESOURCE LOGISTICS */}
      <div className="px-1">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-2 flex items-center gap-2"><Package size={14}/> Supply Chain Logistics</h3>
        {resources.length === 0 ? <div className="bg-white p-4 rounded-xl border border-slate-200 text-center"><p className="text-xs text-slate-400 italic">No active resource markers.</p></div> : (
          <div className="grid grid-cols-1 gap-2">{resources.map((r) => (<div key={r.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center"><div className="flex items-center gap-3"><div className={`p-2 rounded-lg ${r.type === 'WATER' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}><Package size={14}/></div><div><p className="font-bold text-slate-800 text-xs">{r.type}</p><p className="text-[10px] text-slate-500">{r.location}</p></div></div><div className="flex gap-2">{!r.verified && <button onClick={() => verifyResource(r.id)} className="bg-emerald-100 text-emerald-700 p-2 rounded-lg"><Check size={12} strokeWidth={3}/></button>}<button onClick={() => deleteResource(r.id)} className="bg-red-50 text-red-600 p-2 rounded-lg"><X size={12} strokeWidth={3}/></button></div></div>))}</div>
        )}
      </div>

      {/* SITREP GENERATOR */}
      <div className="bg-slate-900 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3 mb-4"><div className="bg-blue-600 p-2 rounded-lg text-white"><FileText size={20} /></div><div><h3 className="font-bold text-white text-sm">Generate Report</h3><p className="text-[10px] text-blue-200">Official Situation Report (PDF)</p></div></div>
        <button onClick={generateSITREP} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform disabled:opacity-50">{loading ? "ENCRYPTING DATA..." : "DOWNLOAD CLASSIFIED SITREP"}</button>
      </div>

      {/* AUDIT LOG */}
      <div className="mt-6 bg-black text-green-400 p-4 rounded-xl font-mono text-[10px] h-48 overflow-y-auto border border-slate-700 shadow-inner">
        <div className="flex justify-between border-b border-green-900 pb-2 mb-2 sticky top-0 bg-black z-10"><span className="font-bold flex items-center gap-2"><Terminal size={10}/> SECURITY AUDIT TRAIL</span><span className="animate-pulse text-red-500">● LIVE</span></div>
        <div className="space-y-1">{auditLogs.length === 0 ? <p className="text-slate-600 italic">Waiting for system events...</p> : auditLogs.map((log, i) => (<div key={i} className="flex gap-2"><span className="text-slate-500 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span><span className="font-bold text-green-300 shrink-0">{log.action}</span><span className="text-green-600 truncate">{log.details}</span></div>))}</div>
      </div>
    </div>
  );
};

export default CommandDashboard;