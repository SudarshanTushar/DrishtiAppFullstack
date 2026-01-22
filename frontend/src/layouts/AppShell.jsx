import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map, Radio, AlertTriangle, ShieldCheck } from 'lucide-react';

const AppShell = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Status', icon: LayoutDashboard },
    { path: '/map', label: 'Route', icon: Map },
    { path: '/network', label: 'Comm', icon: Radio },
    { path: '/sos', label: 'SOS', icon: AlertTriangle, isCritical: true }
  ];

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC]">
      {/* NATIVE HEADER */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-blue-600" size={24} />
          <h1 className="text-lg font-bold text-slate-800 tracking-tight">DRISHTI NE</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Live Grid</span>
        </div>
      </header>

      {/* SCROLLABLE MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="p-5 pb-28"> {/* Extra padding for Nav Bar */}
          <Outlet />
        </div>
      </main>

      {/* NATIVE BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-md border-t border-slate-200 flex justify-around items-center px-4 pb-2 z-50">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300 ${
                isActive ? 'text-blue-600' : 'text-slate-400'
              }`}
            >
              <div className={`p-2 rounded-xl ${isActive ? 'bg-blue-50' : ''}`}>
                <Icon size={isActive ? 28 : 24} strokeWidth={isActive ? 2.5 : 2} 
                  className={item.isCritical && !isActive ? 'text-red-400' : ''} />
              </div>
              <span className={`text-[10px] mt-1 font-bold uppercase tracking-tighter ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default AppShell;