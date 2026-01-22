import React, { useState, useEffect } from 'react';
import { User, Phone, HeartPulse, Save, ShieldCheck, FileText, Info } from 'lucide-react';
import { profileService } from '../services/profileService';

const SettingsView = () => {
  const [formData, setFormData] = useState(profileService.getProfile());
  const [saved, setSaved] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    profileService.saveProfile(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="pb-24 animate-in slide-in-from-right">
      
      {/* 1. IDENTITY HEADER */}
      <div className="bg-slate-900 text-white p-6 pb-8 rounded-b-3xl shadow-lg mb-6">
        <h2 className="text-2xl font-black tracking-tight">Citizen Profile</h2>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Attached to Emergency Beacons</p>
      </div>

      {/* 2. FORM */}
      <div className="px-4 space-y-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Full Name</label>
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <User size={18} className="text-slate-400" />
              <input 
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="bg-transparent w-full font-bold text-slate-800 focus:outline-none"
                placeholder="Enter Name"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Emergency Contact</label>
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <Phone size={18} className="text-slate-400" />
              <input 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="bg-transparent w-full font-bold text-slate-800 focus:outline-none"
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Blood Group</label>
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <ActivityIcon size={18} className="text-red-400" />
                <input 
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  className="bg-transparent w-full font-bold text-slate-800 focus:outline-none"
                  placeholder="O+"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Medical Notes</label>
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <HeartPulse size={18} className="text-slate-400" />
              <input 
                name="medicalConditions"
                value={formData.medicalConditions}
                onChange={handleChange}
                className="bg-transparent w-full font-bold text-slate-800 focus:outline-none"
                placeholder="Allergies, Diabetes, etc."
              />
            </div>
          </div>

          <button 
            onClick={handleSave} 
            className={`w-full py-4 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 ${saved ? 'bg-green-600 text-white' : 'bg-blue-600 text-white active:scale-95'}`}
          >
            {saved ? <CheckIcon /> : <Save size={18} />}
            {saved ? "IDENTITY SAVED" : "SAVE PROFILE"}
          </button>
        </div>

        {/* 3. SYSTEM INFO */}
        <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 space-y-2">
           <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">System Audit</h3>
           
           <div className="flex justify-between items-center text-xs">
             <span className="text-slate-500 flex items-center gap-2"><ShieldCheck size={14}/> Security Level</span>
             <span className="font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">Gov-Grade (A)</span>
           </div>
           
           <div className="flex justify-between items-center text-xs">
             <span className="text-slate-500 flex items-center gap-2"><FileText size={14}/> Build Version</span>
             <span className="font-mono text-slate-700">v2.4.0-RC</span>
           </div>

           <div className="flex justify-between items-center text-xs">
             <span className="text-slate-500 flex items-center gap-2"><Info size={14}/> Data Sources</span>
             <span className="font-bold text-blue-600">ISRO • IMD • NDMA</span>
           </div>
        </div>

      </div>
    </div>
  );
};

// Icons helper
const ActivityIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
);
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);

export default SettingsView;