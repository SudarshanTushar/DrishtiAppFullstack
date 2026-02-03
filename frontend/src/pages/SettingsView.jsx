import React, { useState, useEffect } from "react";
import { 
  Globe, Smartphone, Trash2, RefreshCw, 
  Shield, ChevronRight, Moon, Sun,
  User, Save, Activity, CheckCircle, ArrowLeft 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
// ✅ NEW: Capacitor Native Plugins
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useI18n, languages } from "../i18n";

const SettingsView = () => {
  const navigate = useNavigate();
  const { t, lang, setLang } = useI18n();
  
  // --- THEME STATE ---
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [saved, setSaved] = useState(false);

  // --- 1. THEME LOGIC (Native Status Bar Sync) ---
  useEffect(() => {
    const root = window.document.documentElement;
    const applyTheme = async () => {
        if (theme === "dark") {
            root.classList.add("dark");
            try { await StatusBar.setStyle({ style: Style.Dark }); } catch(e){}
        } else {
            root.classList.remove("dark");
            try { await StatusBar.setStyle({ style: Style.Light }); } catch(e){}
        }
        localStorage.setItem("theme", theme);
    };
    applyTheme();
  }, [theme]);

  const toggleTheme = async () => {
    await Haptics.impact({ style: ImpactStyle.Light }); // 📳 Haptic
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // --- 2. PROFILE STATE ---
  const [profile, setProfile] = useState(() => {
    const savedProfile = localStorage.getItem("drishti_profile");
    return savedProfile ? JSON.parse(savedProfile) : { name: "", phone: "", blood: "", medical: "" };
  });

  const handleProfileChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });

  const handleSaveProfile = async () => {
    localStorage.setItem("drishti_profile", JSON.stringify(profile));
    setSaved(true);
    await Haptics.notification({ type: NotificationType.Success }); // 📳 Success Vibe
    setTimeout(() => setSaved(false), 2000);
  };

  // --- 3. SYSTEM ACTIONS ---
  const handleResetBoot = async () => {
    await Haptics.impact({ style: ImpactStyle.Medium });
    if (window.confirm("Re-run system boot sequence?")) {
      sessionStorage.removeItem("routeai_booted");
      window.location.href = "/";
    }
  };

  const handleClearCache = async () => {
    await Haptics.impact({ style: ImpactStyle.Medium });
    if(window.confirm("Clear all local maps and user data?")) {
        localStorage.clear();
        window.location.reload();
    }
  };

  const handleBack = async () => {
      await Haptics.impact({ style: ImpactStyle.Light });
      navigate(-1);
  };

  return (
    // ✅ SAFE AREAS: pt-safe-top prevents Notch overlap
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 pb-safe-bottom pt-safe-top font-sans transition-colors duration-500 selection:bg-transparent">
      
      {/* HEADER */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-6 py-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 flex items-center gap-4 transition-colors duration-500">
        <button onClick={handleBack} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full active:bg-slate-200 dark:active:bg-slate-700 transition-colors active:scale-90">
            <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
        </button>
        <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{t("settings.header")}</h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("settings.subHeader")}</p>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-lg mx-auto pb-24">

        {/* --- LANGUAGE SECTION --- */}
        <section>
          <h2 className="text-xs font-bold text-slate-500 uppercase mb-3 ml-2">{t("settings.lang")}</h2>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors duration-500">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={async () => {
                    await Haptics.impact({ style: ImpactStyle.Light });
                    setLang(l.code);
                }}
                className={`w-full flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors active:bg-slate-50 dark:active:bg-slate-800 ${
                  lang === l.code ? "bg-blue-50 dark:bg-blue-900/20" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${lang === l.code ? "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                    <Globe size={18} />
                  </div>
                  <span className={`block font-bold text-sm ${lang === l.code ? "text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"}`}>
                        {l.label}
                  </span>
                </div>
                {lang === l.code && <div className="w-2 h-2 bg-blue-600 dark:bg-blue-500 rounded-full"></div>}
              </button>
            ))}
          </div>
        </section>

        {/* --- THEME TOGGLE --- */}
        <section>
           <h2 className="text-xs font-bold text-slate-500 uppercase mb-3 ml-2">Appearance</h2>
           <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between shadow-sm transition-colors duration-500">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                    {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                 </div>
                 <span className="font-medium text-sm text-slate-700 dark:text-slate-300">
                    {theme === 'dark' ? "Dark Mode" : "Light Mode"}
                 </span>
              </div>
              
              {/* THE SWITCH */}
              <button 
                onClick={toggleTheme}
                className={`w-14 h-8 rounded-full p-1 flex items-center transition-all duration-300 active:scale-95 ${
                    theme === 'dark' ? "bg-purple-600 justify-end" : "bg-slate-300 justify-start"
                }`}
              >
                 <div className="w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center">
                    {theme === 'dark' ? <Moon size={12} className="text-purple-600"/> : <Sun size={12} className="text-amber-500"/>}
                 </div>
              </button>
           </div>
        </section>

        {/* --- PROFILE SECTION --- */}
        <section>
          <h2 className="text-xs font-bold text-slate-500 uppercase mb-3 ml-2">{t("settings.profileTitle")}</h2>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4 transition-colors duration-500">
              {/* Name */}
              <div className="bg-slate-50 dark:bg-black/30 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 focus-within:border-blue-500 transition-colors">
                <User size={16} className="text-slate-400 dark:text-slate-500" />
                <input 
                    name="name" 
                    value={profile.name} 
                    onChange={handleProfileChange} 
                    placeholder={t("settings.namePlaceholder")} 
                    className="bg-transparent w-full text-sm font-bold focus:outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-black/30 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 focus-within:border-red-500 transition-colors">
                    <Activity size={16} className="text-red-500" />
                    <input 
                        name="blood" 
                        value={profile.blood} 
                        onChange={handleProfileChange} 
                        placeholder={t("settings.bloodLabel")} 
                        className="bg-transparent w-full text-sm font-bold focus:outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />
                </div>
                <div className="bg-slate-50 dark:bg-black/30 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 focus-within:border-blue-500 transition-colors">
                    <Smartphone size={16} className="text-slate-400 dark:text-slate-500" />
                    <input 
                        name="phone" 
                        value={profile.phone} 
                        onChange={handleProfileChange} 
                        placeholder={t("settings.phoneLabel")} 
                        className="bg-transparent w-full text-sm font-bold focus:outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />
                </div>
              </div>

              <button 
                onClick={handleSaveProfile} 
                className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md ${saved ? "bg-emerald-600 text-white" : "bg-blue-600 text-white hover:bg-blue-500"}`}
              >
                {saved ? <CheckCircle size={18} /> : <Save size={18} />}
                {saved ? t("settings.saved") : t("settings.save")}
              </button>
          </div>
        </section>

        {/* --- SYSTEM ACTIONS --- */}
        <section>
          <h2 className="text-xs font-bold text-slate-500 uppercase mb-3 ml-2">{t("settings.maintenance")}</h2>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors duration-500">
            
            <button onClick={handleClearCache} className="w-full flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 active:bg-slate-50 dark:active:bg-slate-800 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 rounded-lg"><Trash2 size={18} /></div>
                <span className="font-medium text-sm text-slate-700 dark:text-slate-300">{t("settings.clearCache")}</span>
              </div>
              <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
            </button>

            <button onClick={handleResetBoot} className="w-full flex items-center justify-between p-4 active:bg-slate-50 dark:active:bg-slate-800 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-500 rounded-lg"><RefreshCw size={18} /></div>
                <span className="font-medium text-sm text-slate-700 dark:text-slate-300">{t("settings.resetBoot")}</span>
              </div>
              <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
            </button>

          </div>
        </section>

        {/* --- ABOUT --- */}
        <div className="text-center pt-6 pb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-full mb-3">
                <Shield size={12} className="text-blue-600 dark:text-blue-500" />
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Version 2.4.0 (RC-1)</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-600">
                {t("settings.about")}<br/>
                {t("settings.team")}
            </p>
        </div>

      </div>
    </div>
  );
};

export default SettingsView;