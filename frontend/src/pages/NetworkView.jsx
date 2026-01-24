import React, { useState, useEffect } from "react";
import {
  Radio,
  RefreshCw,
  Database,
  Battery,
  Wifi,
  Bluetooth,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  PlugZap,
} from "lucide-react";
import { useMeshNetwork } from "../hooks/useMeshNetwork";
import { registerPlugin } from "@capacitor/core";
import meshNetworkService from "../services/meshNetworkService";

// Direct plugin access for testing
const MeshNetworkPlugin = registerPlugin("MeshNetwork");
const TestPlugin = registerPlugin("TestPlugin");

const NetworkView = () => {
  // Mesh network state from hook
  const {
    isRunning: meshActive,
    peers: peersNearby,
    messages,
    error: meshError,
    startMesh,
    stopMesh,
    sendMessage,
    peerCount,
    messageCount,
    refreshMessages,
  } = useMeshNetwork();

  // Local UI state
  const [isInitializing, setIsInitializing] = useState(false);
  const [batterySaver, setBatterySaver] = useState(false);
  const [log, setLog] = useState("Radio Idle. Waiting for scheduler.");
  const [uiError, setUiError] = useState(null);
  const [status, setStatus] = useState(null);
  const [permissionsGranted, setPermissionsGranted] = useState(true);

  // Update log based on mesh state
  useEffect(() => {
    if (isInitializing) {
      setLog("Initializing BLE/Wi-Fi radios...");
    } else if (meshActive) {
      setLog("Risk assessment in progress across 2.4GHz spectrum...");
    } else {
      setLog("Radio idle. Awaiting scheduler.");
    }
  }, [meshActive, isInitializing]);

  // Reflect hook errors into UI banner
  useEffect(() => {
    if (meshError) setUiError(meshError);
  }, [meshError]);

  // Check permissions on mount
  useEffect(() => {
    let cancelled = false;
    const checkPerms = async () => {
      try {
        const res = await meshNetworkService.checkPermissions();
        if (!cancelled) {
          setPermissionsGranted(!!res?.granted);
        }
      } catch (e) {
        console.warn("[NetworkView] permission check failed", e);
        if (!cancelled) setPermissionsGranted(false);
      }
    };
    checkPerms();
    return () => {
      cancelled = true;
    };
  }, []);

  // Poll status for diagnostics when running
  useEffect(() => {
    let timer;
    const poll = async () => {
      if (!meshActive) return;
      try {
        const s = await meshNetworkService.getStatus();
        setStatus(s);
      } catch (e) {
        console.warn("[NetworkView] status poll failed", e);
      }
      timer = setTimeout(poll, 5000);
    };
    poll();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [meshActive]);

  // Cleanup: stop mesh when leaving the screen to avoid background radios
  useEffect(() => {
    return () => {
      if (meshActive) {
        stopMesh().catch((err) =>
          console.warn("[NetworkView] stopMesh on unmount warning", err),
        );
      }
    };
  }, [meshActive, stopMesh]);

  // Toggle mesh network on/off
  const handleToggleMesh = async () => {
    console.log("═══════════════════════════════════");
    console.log("🔘 FORCE SYNC BUTTON CLICKED");
    console.log("Current State:", {
      meshActive,
      isInitializing,
      peerCount,
      messageCount,
    });
    console.log("═══════════════════════════════════");

    if (meshActive) {
      // Stop mesh
      console.log("⏹️ Stopping mesh network...");
      try {
        await stopMesh();
        setLog("Radio stopped.");
        console.log("✅ Mesh stopped successfully");
      } catch (err) {
        console.error("❌ Failed to stop mesh:", err);
        setLog(`Stop error: ${err.message}`);
      }
    } else {
      // Start mesh
      console.log("▶️ Starting mesh network...");
      setIsInitializing(true);
      setUiError(null);

      try {
        console.log("📡 Calling startMesh()...");
        const result = await startMesh();
        console.log("✅ startMesh() returned:", result);
        console.log("📊 State after startMesh:", { meshActive, peerCount });
        setLog(
          "Mesh network active - conducting risk assessment with nearby relays...",
        );
      } catch (err) {
        console.error("❌ Failed to start mesh:", err);
        console.error("Error details:", {
          message: err.message,
          stack: err.stack,
          name: err.name,
        });
        setLog(`Start error: ${err.message}`);
        setUiError(err.message);
        alert(
          `❌ Mesh Start Failed\n\n${err.message}\n\nCheck console (F12) for details.`,
        );
      } finally {
        setIsInitializing(false);
      }
    }

    console.log("═══════════════════════════════════");
    console.log("✓ BUTTON HANDLER COMPLETE");
    console.log("═══════════════════════════════════\n");
  };

  // Send test message
  const handleSendTestMessage = async () => {
    if (!meshActive) {
      alert("⚠️ Start mesh first!");
      return;
    }

    try {
      const msg = `Test message at ${new Date().toLocaleTimeString()}`;
      console.log("📤 Sending test message:", msg);
      await sendMessage(msg);
      setLog("Test message queued for transmission");
      console.log("✅ Message sent successfully");
    } catch (err) {
      console.error("❌ Failed to send message:", err);
      setLog(`Send error: ${err.message}`);
    }
  };

  // Direct plugin test (bypass hook)
  const handleDirectPluginTest = async () => {
    console.log("\n🧪 ═══ DIRECT PLUGIN TEST ═══");

    // TEST 1: Simple TestPlugin
    console.log("\n1️⃣ Testing simple TestPlugin...");
    try {
      const testResult = await TestPlugin.echo({ value: "Test from UI" });
      console.log("✅ TestPlugin SUCCESS:", testResult);
      alert(`✅ TestPlugin Works!\n\n${JSON.stringify(testResult, null, 2)}`);
    } catch (err) {
      console.error("❌ TestPlugin FAILED:", err);
      alert(
        `❌ TestPlugin Failed!\n\n${err.message}\n\nPlugin system not working!`,
      );
      return; // Stop here if basic plugin doesn't work
    }

    // TEST 2: MeshNetwork Plugin
    console.log("\n2️⃣ Testing MeshNetwork plugin...");
    try {
      console.log("   Checking if plugin exists...");
      console.log("   MeshNetworkPlugin:", MeshNetworkPlugin);
      console.log("   Type:", typeof MeshNetworkPlugin);

      if (!MeshNetworkPlugin) {
        const msg = "❌ Plugin is undefined! Not registered in MainActivity.";
        console.error(msg);
        alert(msg);
        return;
      }

      console.log("   Calling plugin.startMesh() directly...");
      const result = await MeshNetworkPlugin.startMesh();

      console.log("3️⃣ ✅ SUCCESS! Plugin response:");
      console.log(JSON.stringify(result, null, 2));

      const msg = `✅ MeshNetwork Plugin Success!\n\n${JSON.stringify(result, null, 2)}`;
      alert(msg);
      setLog("Direct plugin test: SUCCESS");
    } catch (err) {
      console.error("4️⃣ ❌ FAILED! Error:");
      console.error("   Message:", err.message);
      console.error("   Stack:", err.stack);
      console.error("   Full error:", err);

      const msg = `❌ MeshNetwork Plugin Failed!\n\nError: ${err.message}\n\nRun: adb logcat | grep -i mesh`;
      alert(msg);
      setLog(`Direct test failed: ${err.message}`);
    }

    console.log("═══ END DIRECT TEST ═══\n");
  };

  return (
    <div className="h-full flex flex-col space-y-4 pb-20">
      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* STATUS + CONTROL */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-lg font-black tracking-wide flex items-center gap-2">
              <Radio
                className={
                  meshActive ? "animate-pulse text-green-400" : "text-slate-500"
                }
              />
              Mesh Link
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              {isInitializing
                ? "Initializing radios"
                : meshActive
                  ? "Active scan running"
                  : "Standby"}
            </p>
            <p className="text-[11px] text-slate-300 leading-tight">
              Fail-safe layer; engages only if approved routes fail or
              cellular/internet collapses. Not primary—resilience backup for
              escalation.
            </p>
          </div>
          <div className="text-right space-y-1">
            <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-slate-400 uppercase">
              <span>Protocol: DTN</span>
              <ShieldCheck size={12} className="text-blue-400" />
            </div>
            <div className="text-xs font-mono text-green-300">
              Peers {peerCount} • Msgs {messageCount}
            </div>
          </div>
        </div>

        {uiError && (
          <div className="flex items-start gap-2 bg-red-500/15 border border-red-500/40 text-red-100 p-3 rounded-xl text-[12px]">
            <AlertTriangle size={16} className="mt-0.5" />
            <div>
              <p className="font-bold">Action needed</p>
              <p className="text-red-200">{uiError}</p>
              <p className="text-[11px] text-red-200/80 mt-1">
                If this is a permission issue, accept all Bluetooth / Location /
                Nearby Wi‑Fi prompts then retry.
              </p>
            </div>
          </div>
        )}

        {!permissionsGranted && (
          <div className="flex items-start gap-2 bg-amber-500/15 border border-amber-500/40 text-amber-100 p-3 rounded-xl text-[12px]">
            <AlertTriangle size={16} className="mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Permissions required</p>
              <p className="text-amber-100/90">
                Enable Bluetooth Scan/Connect/Advertise, Nearby Wi‑Fi, and
                Location to start mesh.
              </p>
            </div>
            <button
              onClick={async () => {
                try {
                  const res = await meshNetworkService.requestPermissions();
                  setPermissionsGranted(!!res?.granted);
                } catch (e) {
                  console.warn("[NetworkView] requestPermissions failed", e);
                  setPermissionsGranted(false);
                }
              }}
              className="px-3 py-2 rounded-lg bg-amber-500 text-slate-900 text-[11px] font-bold"
            >
              Grant
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center gap-2">
            <Wifi
              size={16}
              className={meshActive ? "text-green-400" : "text-slate-500"}
            />
            <div>
              <p className="text-slate-300 font-bold">Mesh</p>
              <p className="text-slate-400">
                {meshActive
                  ? "Running"
                  : isInitializing
                    ? "Starting..."
                    : "Stopped"}
              </p>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center gap-2">
            <PlugZap size={16} className="text-amber-300" />
            <div>
              <p className="text-slate-300 font-bold">Battery Saver</p>
              <p className="text-slate-400">
                {batterySaver ? "Eco on" : "Eco off"}
              </p>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center gap-2">
            <Database size={16} className="text-blue-300" />
            <div>
              <p className="text-slate-300 font-bold">Queue</p>
              <p className="text-slate-400">
                {status?.pendingMessages ?? "-"} msgs
              </p>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center gap-2">
            <RefreshCw size={16} className="text-teal-300" />
            <div>
              <p className="text-slate-300 font-bold">Discover</p>
              <p className="text-slate-400">
                {status?.currentDiscoverIntervalMs
                  ? `${Math.round(status.currentDiscoverIntervalMs / 1000)}s`
                  : "-"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleToggleMesh}
            disabled={isInitializing}
            className={`flex-1 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              isInitializing
                ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                : meshActive
                  ? "bg-red-600 hover:bg-red-500 text-white"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/50"
            }`}
          >
            {isInitializing ? (
              <>
                <RefreshCw className="animate-spin" size={16} />
                INITIALIZING...
              </>
            ) : meshActive ? (
              <>
                <Wifi size={16} />
                STOP MESH
              </>
            ) : (
              <>
                <Wifi size={16} />
                START MESH
              </>
            )}
          </button>

          <button
            onClick={() => setBatterySaver(!batterySaver)}
            className={`px-4 rounded-xl border flex flex-col items-center justify-center transition-all ${
              batterySaver
                ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                : "bg-slate-800 border-slate-700 text-slate-300"
            }`}
          >
            <Battery size={18} />
            <span className="text-[9px] font-bold mt-1">ECO</span>
          </button>
        </div>

        <div className="bg-black/50 p-3 rounded-lg border border-white/10 font-mono text-[10px] h-16 overflow-hidden text-green-300">
          {`> ${log}`}
          {meshActive && <span className="animate-ping">_</span>}
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* MESSAGE STORAGE */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-4 overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Database size={14} />
            Local Bundle Store
          </h3>
          <button
            onClick={handleSendTestMessage}
            disabled={!meshActive}
            className={`text-[10px] font-bold underline transition-colors ${
              meshActive
                ? "text-blue-600 hover:text-blue-800"
                : "text-slate-400 cursor-not-allowed opacity-50"
            }`}
          >
            + Test Msg
          </button>
        </div>

        <div className="overflow-y-auto space-y-3 flex-1 pr-1">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-60 text-center space-y-2">
              <Database size={40} className="text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-500">No bundles yet</p>
              <p className="text-[11px] text-slate-400">
                Start mesh and send a test message to see entries here.
              </p>
            </div>
          ) : (
            messages.map((bundle) => (
              <div
                key={bundle.id}
                className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm relative group"
              >
                {/* Status Bar */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${
                    bundle.hops > 0 ? "bg-green-500" : "bg-amber-500"
                  }`}
                />

                <div className="pl-3">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase bg-slate-100 text-slate-500">
                      DTN
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">
                      {new Date(bundle.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-800 line-clamp-2 my-1.5">
                    {bundle.payload}
                  </p>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                    {bundle.hops > 0 ? (
                      <>
                        <div className="bg-green-100 p-1 rounded-full">
                          <Bluetooth size={10} className="text-green-600" />
                        </div>
                        <span className="text-[9px] font-bold text-green-600 uppercase tracking-wide">
                          Forwarded ({bundle.hops} hops)
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="bg-amber-100 p-1 rounded-full">
                          <Database size={10} className="text-amber-600" />
                        </div>
                        <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wide">
                          Stored • Waiting for Node
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* PEERS NEARBY */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Bluetooth size={14} /> Nearby Devices
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            {peerCount} detected
          </div>
        </div>

        {peersNearby.length === 0 ? (
          <div className="text-[11px] text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-xl p-3">
            No peers yet. Keep mesh running and move around to discover devices.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {peersNearby.map((peer, idx) => (
              <div
                key={peer.id || peer.peerId || idx}
                className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-[11px] text-slate-700 flex items-center gap-2"
              >
                <Bluetooth size={12} className="text-green-600" />
                <span className="font-bold">
                  {(peer.name || peer.id || peer.peerId || "Node")
                    .toString()
                    .slice(0, 10)}
                </span>
                {peer.rssi && (
                  <span className="text-slate-500 font-mono">
                    {peer.rssi} dBm
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* DEBUG PANEL */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <div className="bg-blue-900 text-white p-3 rounded-xl shadow-lg">
        <div className="font-bold mb-2 text-blue-200 text-xs">
          🔧 DEBUG PANEL
        </div>

        <div className="space-y-1 text-[10px] font-mono">
          <div className="flex justify-between">
            <span className="text-blue-300">meshActive:</span>
            <span
              className={
                meshActive
                  ? "text-green-400 font-bold"
                  : "text-red-400 font-bold"
              }
            >
              {meshActive ? "✅ TRUE" : "❌ FALSE"}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-blue-300">isInitializing:</span>
            <span
              className={
                isInitializing ? "text-yellow-400 font-bold" : "text-gray-400"
              }
            >
              {isInitializing ? "⏳ TRUE" : "FALSE"}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-blue-300">peerCount:</span>
            <span className="text-green-400">{peerCount}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-blue-300">messageCount:</span>
            <span className="text-green-400">{messageCount}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-blue-300">meshError:</span>
            <span className="text-red-400">{meshError || "None"}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-blue-300">Platform:</span>
            <span className="text-purple-400">
              {typeof window !== "undefined" && window.Capacitor
                ? "📱 Capacitor"
                : "🌐 Browser"}
            </span>
          </div>
        </div>

        {/* Direct Plugin Test Button */}
        <button
          onClick={handleDirectPluginTest}
          className="w-full mt-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-3 rounded text-[11px] transition-colors"
        >
          🧪 TEST DIRECT PLUGIN CALL
        </button>

        <div className="mt-2 pt-2 border-t border-blue-700 text-blue-300 text-[9px]">
          💡 Press F12 to see detailed console logs
        </div>
      </div>
    </div>
  );
};

export default NetworkView;
