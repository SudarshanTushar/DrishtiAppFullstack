import React, { useState } from "react";
import { Lock } from "lucide-react";
import { adminService } from "../services/adminService";
import CommandDashboard from "./CommandDashboard";

const AdminView = () => {
  const [isAuth, setIsAuth] = useState(adminService.isAuthenticated());
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // ──────────────────────────────────────────────────────────────────────────
  // LOGIN LOGIC
  // ──────────────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    setLoading(true);
    const success = await adminService.login(password);
    setIsAuth(success);
    setLoading(false);
    if (!success) {
      alert("Access Denied. Authorization Code Required.");
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER: LOGIN SCREEN
  // ──────────────────────────────────────────────────────────────────────────
  if (!isAuth) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center p-6 space-y-6">
        <div className="bg-slate-100 p-4 rounded-full">
          <Lock size={40} className="text-slate-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Command Access</h2>
        <input
          type="password"
          placeholder="Enter Secure Code"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleLogin()}
          className="w-full max-w-xs bg-white border border-slate-300 p-3 rounded-xl text-center font-bold tracking-widest"
        />
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full max-w-xs bg-slate-800 text-white py-3 rounded-xl font-bold disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Authorize"}
        </button>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER: COMMAND DASHBOARD (LAZY-LOADED, LIFECYCLE-SAFE)
  // ──────────────────────────────────────────────────────────────────────────
  return <CommandDashboard />;
};

export default AdminView;
