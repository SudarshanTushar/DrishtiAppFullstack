import React, { useState, useEffect } from "react";
import { 
  Globe, Smartphone, Trash2, RefreshCw, 
  Battery, Shield, Info, ChevronRight, Moon, 
  Volume2, Power, User, Save, Activity, CheckCircle, HeartPulse
} from "lucide-react";
import { useI18n, languages } from "../i18n";
import { Device } from '@capacitor/device';

const SettingsView = () => {
  const { t, lang, setLang } = useI18n();
  const [batteryInfo, setBatteryInfo] = useState({ level: 0.85, isCharging: true });
  const [storageUsed, setStorageUsed] = useState("124 MB");
  const [saved, setSaved] = useState(false);

  // --- 1. PROFILE STATE ---
  const [profile, setProfile] = useState(() => {
    const savedProfile = localStorage.getItem("drishti_profile");
    return savedProfile ? JSON.parse(savedProfile) : { name: "", phone: "", blood: "", medical: "" };
  });

  const handleProfileChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });

  const handleSaveProfile = () => {
    localStorage.setItem("drishti_profile", JSON.stringify(profile));
    setSaved(true);
    if (navigator.vibrate) navigator.vibrate(50);
    setTimeout(() => setSaved(false), 2000);
  };

  // --- 2. DEVICE INFO ---
  useEffect(() => {
    const getInfo = async () => {
      try {
        const info = await Device.getBatteryInfo();
        setBatteryInfo(info);
      } catch (e) {
        setBatteryInfo({ level: 0.92, isCharging: false }); // Fallback
      }
    };
    getInfo();
  }, []);

  // --- 3. SYSTEM ACTIONS ---
  const handleResetBoot = () => {
    if (window.confirm("Re-run system boot sequence?")) {
      sessionStorage.removeItem("routeai_booted");
      window.location.reload();
    }
  };

  const handleClearCache = () => {
    localStorage.clear();
    setStorageUsed("0 MB");
    alert("System Cache Purged.");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 font-sans animate-in slide-in-from-right duration-300">
      
      {/* HEADER */}
      <div className="bg-white px-6 py-6 border-b border-slate-200 sticky top-0 z-10">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Settings</h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">System Configuration</p>
      </div>

      <div className="p-4 space-y-6">

        {/* --- LANGUAGE SECTION --- */}
        <section>
          <h2 className="text-xs font-bold text-slate-400 uppercase mb-3 ml-2">Localization</h2>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`w-full flex items-center justify-between p-4 border-b border-slate-100 last:border-0 transition-colors ${
                  lang === l.code ? "bg-blue-50" : "hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${lang === l.code ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"}`}>
                    <Globe size={18} />
                  </div>
                  <span className={`font-bold ${lang === l.code ? "text-blue-700" : "text-slate-700"}`}>
                    {l.label}
                  </span>
                </div>
                {lang === l.code && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
              </button>
            ))}
          </div>
        </section>

        {/* --- PROFILE SECTION (NEW) --- */}
        <section>
          <h2 className="text-xs font-bold text-slate-400 uppercase mb-3 ml-2">User Profile</h2>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
             {/* Name */}
             <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-3">
                <User size={16} className="text-slate-400" />
                <input name="name" value={profile.name} onChange={handleProfileChange} placeholder="Enter Full Name" className="bg-transparent w-full text-sm font-bold focus:outline-none"/>
             </div>
             
             <div className="grid grid-cols-2 gap-3">
                {/* Blood */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-3">
                    <Activity size={16} className="text-red-400" />
                    <input name="blood" value={profile.blood} onChange={handleProfileChange} placeholder="Blood Grp" className="bg-transparent w-full text-sm font-bold focus:outline-none"/>
                </div>
                {/* Phone */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-3">
                    <Smartphone size={16} className="text-slate-400" />
                    <input name="phone" value={profile.phone} onChange={handleProfileChange} placeholder="Phone No." className="bg-transparent w-full text-sm font-bold focus:outline-none"/>
                </div>
             </div>

             {/* Medical */}
             <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex gap-3">
                <HeartPulse size={16} className="text-purple-400 mt-1" />
                <textarea name="medical" value={profile.medical} onChange={handleProfileChange} placeholder="Medical Notes (Allergies etc.)" className="bg-transparent w-full text-sm font-medium focus:outline-none resize-none h-16"/>
             </div>

             <button onClick={handleSaveProfile} className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all ${saved ? "bg-emerald-600 text-white" : "bg-slate-900 text-white"}`}>
                {saved ? <CheckCircle size={16} /> : <Save size={16} />}
                {saved ? "Saved!" : "Save Profile"}
             </button>
          </div>
        </section>

        {/* --- DEVICE DIAGNOSTICS --- */}
        <section>
          <h2 className="text-xs font-bold text-slate-400 uppercase mb-3 ml-2">Device Health</h2>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                <div className="flex items-center gap-2 mb-2 text-emerald-600">
                    <Battery size={18} />
                    <span className="text-[10px] font-bold uppercase">Power</span>
                </div>
                <p className="text-xl font-black text-emerald-800">{(batteryInfo.level * 100).toFixed(0)}%</p>
                <p className="text-[10px] text-emerald-600">{batteryInfo.isCharging ? "Charging" : "Discharging"}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 mb-2 text-blue-600">
                    <Smartphone size={18} />
                    <span className="text-[10px] font-bold uppercase">Storage</span>
                </div>
                <p className="text-xl font-black text-blue-800">{storageUsed}</p>
                <p className="text-[10px] text-blue-600">Map Cache</p>
            </div>
          </div>
        </section>

        {/* --- SYSTEM ACTIONS --- */}
        <section>
          <h2 className="text-xs font-bold text-slate-400 uppercase mb-3 ml-2">Maintenance</h2>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            
            <button onClick={handleClearCache} className="w-full flex items-center justify-between p-4 border-b border-slate-100 active:bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><Trash2 size={18} /></div>
                <span className="font-medium text-sm text-slate-700">Clear Local Data</span>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </button>

            <button onClick={handleResetBoot} className="w-full flex items-center justify-between p-4 border-b border-slate-100 active:bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><RefreshCw size={18} /></div>
                <span className="font-medium text-sm text-slate-700">Replay Boot Sequence</span>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </button>

            <div className="p-4 flex items-center justify-between bg-slate-50">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-slate-200 text-slate-600 rounded-lg"><Moon size={18} /></div>
                 <span className="font-medium text-sm text-slate-700">Dark Mode</span>
               </div>
               <span className="text-xs font-bold text-slate-400">AUTO</span>
            </div>

          </div>
        </section>

        {/* --- ABOUT --- */}
        <div className="text-center pt-6 pb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-200 rounded-full mb-2">
                <Shield size={12} className="text-slate-500" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Version 1.0.4 (Beta)</span>
            </div>
            <p className="text-[10px] text-slate-400">
                Built for DrishtiNE Hackathon<br/>
                Team Matrix • 2026
            </p>
        </div>

      </div>
    </div>
  );
};

export default SettingsView;