import React, { useState, useEffect } from "react";
import {
  CloudRain,
  Activity,
  ShieldCheck,
  Zap,
  RefreshCw,
  Settings,
  Mic,
  Download,
  Shield,
  AlertTriangle,
  Globe,
  MapPin,
  Signal,
  Wifi,
  Database,
  Brain,
  ShieldHalf,
  ArrowRight,
} from "lucide-react";
import { safeFetch } from "../config";
import { Link } from "react-router-dom";
import { voiceService } from "../services/voiceService";
import { offlineService } from "../services/offlineService";
import { useI18n, languages } from "../i18n.jsx";

const Dashboard = () => {
  // Simulated operational baselines (for demos when live data is absent)
  const simulatedTelemetry = {
    rain: "12 mm",
    rain_forecast: { next6h: "Light rain expected (simulated)" },
    seismic: "0.6",
    terrain_type: "Foothills corridor (simulated)",
    population_exposure: "Moderate (est. 1.2k) (simulated)",
    evac_routes: "Primary NH-27 • Secondary local roads (simulated)",
  };

  const simulatedStatus = {
    riskIndex: 68, // 0.68 normalized
    confidence: 84,
    reason: "IMD + ISRO feeds synced (simulated)",
  };

  const simulatedReadiness = {
    network_status: "Active (simulated)",
    sensors_status: "Operational (simulated)",
    ai_models_status: "Ready (simulated)",
    offline_pack_status: "Installed",
    overall_readiness: 86,
  };

  const composeStatusMeta = (data) => {
    const baseMeta = deriveStatusMeta(data || {});
    const riskRaw =
      baseMeta.riskIndex !== null && baseMeta.riskIndex !== undefined
        ? baseMeta.riskIndex
        : simulatedStatus.riskIndex;
    const normalized = riskRaw > 1 ? riskRaw / 100 : riskRaw;
    const band =
      normalized >= 0.7 ? "High" : normalized >= 0.5 ? "Moderate" : "Low";
    const riskDisplay =
      riskRaw > 1
        ? `${Math.round(riskRaw)} • ${band}`
        : `${normalized.toFixed(2)} • ${band}`;
    const confidenceVal =
      baseMeta.confidence !== null && baseMeta.confidence !== undefined
        ? baseMeta.confidence
        : simulatedStatus.confidence;
    const confidenceDisplay = `${confidenceVal}%`;
    const reasonText =
      baseMeta.reason && baseMeta.reason !== "Awaiting sensor data"
        ? baseMeta.reason
        : simulatedStatus.reason;

    return {
      ...baseMeta,
      riskIndex:
        riskRaw > 1 ? Math.round(riskRaw) : Math.round(normalized * 100),
      riskIndexDisplay: riskDisplay,
      confidence: confidenceVal,
      confidenceDisplay,
      reason: reasonText,
    };
  };

  const hydrateTelemetry = (data) => ({
    rain: data?.rain ?? simulatedTelemetry.rain,
    rain_forecast: {
      next6h:
        data?.rain_forecast?.next6h ?? simulatedTelemetry.rain_forecast.next6h,
    },
    seismic: data?.seismic ?? simulatedTelemetry.seismic,
    terrain_type: data?.terrain_type ?? simulatedTelemetry.terrain_type,
    population_exposure:
      data?.population_exposure ?? simulatedTelemetry.population_exposure,
    evac_routes: data?.evac_routes ?? simulatedTelemetry.evac_routes,
  });

  const [iotData, setIotData] = useState(simulatedTelemetry);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [recording, setRecording] = useState(false);
  const [voiceResult, setVoiceResult] = useState(null);
  const [packStatus, setPackStatus] = useState(offlineService.getStatus());
  const [activeAlert, setActiveAlert] = useState(null);
  const [readiness, setReadiness] = useState(simulatedReadiness);
  const [statusMeta, setStatusMeta] = useState(() =>
    composeStatusMeta({
      risk_index: simulatedStatus.riskIndex,
      confidence: simulatedStatus.confidence,
      reason: simulatedStatus.reason,
    }),
  );

  const { t, lang, setLang } = useI18n();
  const [missionActive, setMissionActive] = useState(false);

  useEffect(() => {
    fetchData();
    fetchReadiness();
    // Check for active mission
    if (localStorage.getItem("drishti_mission_active") === "true") {
      setMissionActive(true);
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await safeFetch("/iot/feed");
      const telemetry = hydrateTelemetry(data || {});
      setIotData(telemetry);
      const meta = composeStatusMeta({
        ...data,
        risk_index: data?.risk_index ?? simulatedStatus.riskIndex,
        confidence: data?.confidence ?? simulatedStatus.confidence,
        reason: data?.reason ?? data?.status_reason ?? simulatedStatus.reason,
      });
      setStatusMeta(meta);
      setActiveAlert(meta.label === "CRITICAL ALERT" ? meta.reason : null);
      setLastSync(new Date());
    } catch (err) {
      setError(
        "Live sync unavailable; operating on simulated IMD/ISRO feeds for demo.",
      );
      setIotData(simulatedTelemetry);
      const meta = composeStatusMeta({
        risk_index: simulatedStatus.riskIndex,
        confidence: simulatedStatus.confidence,
        reason: simulatedStatus.reason,
      });
      setStatusMeta(meta);
      setActiveAlert(meta.label === "CRITICAL ALERT" ? meta.reason : null);
      setLastSync(new Date());
    }
    setLoading(false);
  };

  const fetchReadiness = async () => {
    const readinessData = await safeFetch("/system/readiness");
    if (readinessData) {
      setReadiness({
        network_status:
          readinessData.network_status ?? simulatedReadiness.network_status,
        sensors_status:
          readinessData.sensors_status ?? simulatedReadiness.sensors_status,
        ai_models_status:
          readinessData.ai_models_status ?? simulatedReadiness.ai_models_status,
        offline_pack_status:
          readinessData.offline_pack_status ??
          simulatedReadiness.offline_pack_status,
        overall_readiness:
          readinessData.overall_readiness ??
          simulatedReadiness.overall_readiness,
      });
      return;
    }
    setReadiness(simulatedReadiness);
  };

  const downloadPack = async () => {
    setLoading(true);
    const result = await offlineService.downloadPack();
    if (result.success) {
      setPackStatus(`Active`);
      alert("✅ Intel Pack Downloaded!");
    } else {
      alert("❌ Download Failed.");
    }
    setLoading(false);
  };

  const handleVoice = async () => {
    if (recording) return;
    setRecording(true);
    setTimeout(async () => {
      setRecording(false);
      const dummyBlob = new Blob(["demo"], { type: "audio/wav" });
      // Pass language code based on selection
      const result = await voiceService.processVoiceCommand(dummyBlob);
      setVoiceResult(result);
      setTimeout(() => setVoiceResult(null), 5000);
    }, 2000);
  };

  const cycleLang = () => {
    const idx = languages.findIndex((l) => l.code === lang);
    const next = languages[(idx + 1) % languages.length];
    setLang(next.code);
  };

  function parseNumber(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    const cleaned = String(value).replace(/[^0-9.\-]/g, "");
    const num = parseFloat(cleaned);
    return Number.isFinite(num) ? num : null;
  }

  function deriveStatusMeta(data) {
    const rainVal = parseNumber(data?.rain);
    const seismicVal = parseNumber(data?.seismic);
    const explicitRisk = parseNumber(data?.risk_index);
    const computedRisk = (() => {
      if (explicitRisk !== null) return explicitRisk;
      const rainRisk = rainVal !== null ? Math.min(100, rainVal * 3) : 0;
      const seismicRisk =
        seismicVal !== null ? Math.min(100, seismicVal * 15) : 0;
      const combined = Math.max(rainRisk, seismicRisk);
      return combined > 0 ? combined : null;
    })();

    const riskIndex = computedRisk !== null ? Math.round(computedRisk) : null;
    const confidence = data?.confidence_score ?? data?.confidence ?? null;
    const reasonFromFeed = data?.reason || data?.status_reason;

    const reason = (() => {
      if (reasonFromFeed) return reasonFromFeed;
      if (seismicVal !== null && seismicVal >= 4) return "Seismic instability";
      if (rainVal !== null && rainVal >= 20) return "Severe rainfall";
      if (rainVal !== null || seismicVal !== null) return "Stable conditions";
      return "Awaiting sensor data";
    })();

    const label = (() => {
      if (data?.status && data.status.toUpperCase() === "CRITICAL")
        return "CRITICAL ALERT";
      if (riskIndex !== null && riskIndex >= 80) return "CRITICAL ALERT";
      if (riskIndex !== null && riskIndex >= 50) return "HEIGHTENED WATCH";
      if (riskIndex !== null) return "ALL CLEAR";
      return "RISK ASSESSMENT";
    })();

    const tone = (() => {
      if (label === "CRITICAL ALERT") return "from-red-600 to-rose-700";
      if (label === "HEIGHTENED WATCH") return "from-amber-500 to-orange-600";
      if (label === "ALL CLEAR") return "from-emerald-500 to-teal-600";
      return "from-blue-600 to-indigo-700";
    })();

    return { label, tone, riskIndex, confidence, reason };
  }

  const interpretRainRisk = (val) => {
    if (val === null)
      return { label: "Stable (simulated)", intent: "text-emerald-600" };
    if (val >= 25)
      return { label: "Flash flood likely", intent: "text-red-600" };
    if (val >= 10)
      return { label: "Heavy rainfall watch", intent: "text-amber-600" };
    return { label: "Low precipitation", intent: "text-emerald-600" };
  };

  const interpretSeismic = (val) => {
    if (val === null)
      return {
        stability: "Stable (simulated)",
        aftershock: "Low",
        intent: "text-emerald-600",
      };
    if (val >= 6)
      return {
        stability: "Severe instability",
        aftershock: "High",
        intent: "text-red-600",
      };
    if (val >= 4)
      return {
        stability: "Moderate instability",
        aftershock: "Medium",
        intent: "text-amber-600",
      };
    if (val >= 2)
      return {
        stability: "Stable",
        aftershock: "Low",
        intent: "text-emerald-600",
      };
    return {
      stability: "Quiet",
      aftershock: "Minimal",
      intent: "text-emerald-600",
    };
  };

  const readinessItem = (
    label,
    value,
    icon,
    fallback = "Operational (simulated)",
  ) => {
    const display = value ?? fallback;
    const ok =
      typeof display === "string"
        ? display.toLowerCase() === "ok" || display.toLowerCase() === "active"
        : false;
    const color = display
      ? ok
        ? "text-emerald-600"
        : "text-slate-800"
      : "text-slate-500";
    return (
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-slate-600">
          {icon}
          <span className="font-semibold">{label}</span>
        </div>
        <span className={`font-bold ${color}`}>{display || fallback}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      {/* STATUS HEADER */}
      <div
        className={`bg-gradient-to-br ${statusMeta.tone} p-6 rounded-3xl text-white shadow-xl shadow-blue-100 relative overflow-hidden`}
      >
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <ShieldCheck size={32} className="opacity-90" />
            <Link
              to="/settings"
              className="bg-white/20 p-2 rounded-full hover:bg-white/30 active:scale-95 transition-all"
            >
              <Settings size={20} className="text-white" />
            </Link>
            {/* Language Toggle */}
            <button
              onClick={cycleLang}
              className="bg-white/20 p-2 rounded-full hover:bg-white/30 active:scale-95 transition-all flex items-center gap-1"
            >
              <Globe size={16} className="text-white" />
              <span className="text-[10px] font-bold uppercase">{lang}</span>
            </button>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-2"
          >
            {loading ? (
              <RefreshCw className="animate-spin" size={10} />
            ) : (
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
            )}
            {loading ? "Syncing..." : "Live"}
          </button>
        </div>
        <div className="flex flex-col gap-1 relative z-10">
          <div className="flex items-center gap-2 text-xs uppercase font-black tracking-widest opacity-80">
            <ShieldHalf size={16} />
            {t("dashboard.status")}
          </div>
          <h2 className="text-3xl font-extrabold">{statusMeta.label}</h2>
          <p className="opacity-80 text-sm">
            {t("dashboard.monitor")}: NE-Alpha
          </p>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 relative z-10 text-white/90">
          <div className="bg-white/10 rounded-2xl p-3">
            <p className="text-[10px] uppercase font-bold opacity-80">
              Risk Index
            </p>
            <p className="text-2xl font-black">{statusMeta.riskIndexDisplay}</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3">
            <p className="text-[10px] uppercase font-bold opacity-80">
              Confidence
            </p>
            <p className="text-2xl font-black">
              {statusMeta.confidenceDisplay}
            </p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3">
            <p className="text-[10px] uppercase font-bold opacity-80">Reason</p>
            <p className="text-sm font-semibold leading-tight">
              {statusMeta.reason}
            </p>
          </div>
        </div>
        {lastSync && (
          <p className="opacity-70 text-[11px] relative z-10">
            Last sync: {lastSync.toLocaleTimeString()}
          </p>
        )}
        {error && (
          <div className="mt-3 bg-red-500/20 border border-red-400/60 text-white text-xs px-3 py-2 rounded-xl relative z-10">
            {error}
          </div>
        )}
        <Zap size={120} className="absolute -right-4 -bottom-4 opacity-10" />
      </div>

      {/* MISSION TRACKING CARD (Visible only if SOS active) */}
      {missionActive && (
        <div className="bg-emerald-500 text-white p-4 rounded-2xl shadow-lg shadow-emerald-200 animate-pulse relative overflow-hidden">
          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2">
              <MapPin className="animate-bounce" />
              <div>
                <p className="text-xs font-black uppercase tracking-widest opacity-80">
                  Rescue Inbound
                </p>
                <p className="font-bold text-lg">ETA: 12 Mins</p>
              </div>
            </div>
            <div className="bg-white/20 px-2 py-1 rounded text-[10px] font-bold">
              LIVE TRACKING
            </div>
          </div>
          {/* Simple Progress Bar */}
          <div className="mt-3 h-1 bg-black/20 rounded-full overflow-hidden">
            <div className="h-full bg-white w-2/3"></div>
          </div>
        </div>
      )}

      {/* CRITICAL ALERT BANNER */}
      {activeAlert && (
        <div className="bg-red-500 text-white p-4 rounded-2xl shadow-lg shadow-red-200 animate-pulse flex items-center gap-3">
          <AlertTriangle className="text-white shrink-0" size={24} />
          <div>
            <p className="text-xs font-black uppercase tracking-widest opacity-80">
              {t("dashboard.alert")}
            </p>
            <p className="font-bold text-sm leading-tight">{activeAlert}</p>
          </div>
        </div>
      )}

      {/* STATUS + ACTIONS ROW */}
      <div className="grid grid-cols-2 gap-3 px-1">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-500 uppercase">
              Monitoring Sector
            </span>
            <span className="text-[11px] font-bold text-slate-600">
              NE-Alpha
            </span>
          </div>
          <div className="space-y-2 text-sm text-slate-700">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Terrain</span>
              <span className="font-bold">{iotData?.terrain_type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Population Exposure</span>
              <span className="font-bold">{iotData?.population_exposure}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Evac Routes</span>
              <span className="font-bold">{iotData?.evac_routes}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-rows-2 gap-3">
          <button
            onClick={downloadPack}
            disabled={loading}
            className={`bg-slate-900 text-white p-3 rounded-2xl flex items-center justify-between gap-3 active:scale-95 transition-transform ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <div className="flex items-center gap-3">
              <Download
                size={18}
                className={packStatus ? "text-emerald-400" : "text-white"}
              />
              <div className="text-left leading-tight">
                <span className="block text-xs font-bold">
                  {packStatus ? "Offline Pack Ready" : t("dashboard.pack")}
                </span>
                {packStatus ? (
                  <span className="block text-[9px] text-emerald-300 font-bold tracking-wider">
                    INSTALLED
                  </span>
                ) : (
                  <span className="block text-[9px] text-slate-200">
                    Tap to download for offline
                  </span>
                )}
              </div>
            </div>
            <ArrowRight size={14} />
          </button>
          <Link
            to="/admin"
            className="bg-white border border-slate-200 text-slate-700 p-3 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Shield size={18} />
            <span className="text-xs font-bold">{t("dashboard.admin")}</span>
          </Link>
        </div>
      </div>

      {/* SENSORS */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <CloudRain className="text-blue-500" />
            <span className="text-[11px] font-black text-slate-500 uppercase">
              {t("dashboard.rain")}
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900">{iotData?.rain}</p>
          {(() => {
            const rainVal = parseNumber(iotData?.rain);
            const rainMeta = interpretRainRisk(rainVal);
            return (
              <div className="text-sm text-slate-700">
                <p className={`font-semibold ${rainMeta.intent}`}>
                  {rainMeta.label}
                </p>
                <p className="text-xs text-slate-500">
                  Next 6h:{" "}
                  {iotData?.rain_forecast?.next6h ??
                    simulatedTelemetry.rain_forecast.next6h}
                </p>
              </div>
            );
          })()}
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <Activity className="text-emerald-500" />
            <span className="text-[11px] font-black text-slate-500 uppercase">
              {t("dashboard.seismic")}
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {iotData?.seismic}
          </p>
          {(() => {
            const seismicVal = parseNumber(iotData?.seismic);
            const sMeta = interpretSeismic(seismicVal);
            return (
              <div className="text-sm text-slate-700">
                <p className={`font-semibold ${sMeta.intent}`}>
                  {sMeta.stability}
                </p>
                <p className="text-xs text-slate-500">
                  Aftershock probability: {sMeta.aftershock}
                </p>
              </div>
            );
          })()}
        </div>
      </div>

      {/* SYSTEM READINESS */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-700 font-black uppercase text-[11px]">
            <Signal size={16} />
            System Readiness
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 font-semibold">Overall</p>
            <p className="text-2xl font-black text-slate-900">
              {`${readiness?.overall_readiness ?? simulatedReadiness.overall_readiness}%`}
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {readinessItem(
            "Network",
            readiness?.network_status,
            <Wifi size={16} className="text-slate-500" />,
          )}
          {readinessItem(
            "Sensors",
            readiness?.sensors_status,
            <Activity size={16} className="text-slate-500" />,
          )}
          {readinessItem(
            "AI Models",
            readiness?.ai_models_status,
            <Brain size={16} className="text-slate-500" />,
          )}
          {readinessItem(
            "Offline Pack",
            readiness?.offline_pack_status || packStatus,
            <Database size={16} className="text-slate-500" />,
          )}
        </div>
      </div>

      {/* VOICE FAB */}
      <div className="fixed bottom-24 right-6 z-40">
        {voiceResult && (
          <div className="absolute bottom-16 right-0 w-64 bg-slate-800 text-white p-4 rounded-2xl shadow-xl mb-2 animate-in slide-in-from-bottom-4">
            <p className="text-[10px] uppercase font-bold text-slate-400">
              Sarvam AI ({lang.toUpperCase()})
            </p>
            <p className="text-sm font-medium mt-1">
              "{voiceResult.translated_text}"
            </p>
            <div className="mt-2 pt-2 border-t border-slate-600 text-green-400 text-xs font-bold">
              {voiceResult.voice_reply}
            </div>
          </div>
        )}
        <button
          onClick={handleVoice}
          className={`p-4 rounded-full shadow-lg shadow-blue-200 transition-all active:scale-90 ${recording ? "bg-red-500 animate-pulse" : "bg-blue-600"}`}
        >
          <Mic className="text-white" size={24} />
        </button>
      </div>
    </div>
  );
};
export default Dashboard;
