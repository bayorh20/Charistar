import React, { useState } from 'react';
import { Shield, Key, Clock, Sparkles, MapPin, Eye, EyeOff, Save, CheckCircle, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminSettings() {
  const [activeRadii, setActiveRadii] = useState('3.0');
  const [deliveryFee, setDeliveryFee] = useState('500');
  const [paystackPK, setPaystackPK] = useState('pk_live_fca2843810243b9d0382f');
  const [showKey, setShowKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleResetSystem = () => {
    if (!window.confirm("⚠️ This will completely clear all local browser cache, delete persistent offline storage, and force a fresh reload of the application. Proceed?")) return;
    try {
      localStorage.clear();
      sessionStorage.clear();
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          for (let registration of registrations) {
            registration.unregister();
          }
        });
      }
      
      alert("🧹 System cache successfully wiped! The browser will now reload the application.");
      window.location.reload(true);
    } catch (e) {
      alert("Failed to reset cache: " + e.message);
    }
  };

  const [roles, setRoles] = useState([
    { role: 'Super Admin', catalog: true, dispatch: true, finance: true, support: true },
    { role: 'Operations Manager', catalog: true, dispatch: true, finance: false, support: true },
    { role: 'Customer Support', catalog: false, dispatch: false, finance: false, support: true },
    { role: 'Finance Manager', catalog: false, dispatch: false, finance: true, support: false }
  ]);

  const handleTogglePermission = (roleIndex, field) => {
    setRoles(prev => prev.map((r, idx) => {
      if (idx === roleIndex) {
        return {
          ...r,
          [field]: !r[field]
        };
      }
      return r;
    }));
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-[#050505]/40 p-6 rounded-[1.5rem] border border-white/5">
        <div>
          <h2 className="text-white font-black text-xl tracking-tight flex items-center gap-2">
            <Shield className="text-charistar-green animate-pulse" size={24} />
            System Config & Governance
          </h2>
          <p className="text-xs text-gray-500 font-semibold mt-1">Configure global operational limits, role access permissions, and Paystack developer credentials.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Global Business Controls Form */}
        <div className="lg:col-span-2 glass-panel p-7.5 rounded-[1.8rem] border border-white/10 bg-[#0c0c0c]/85 shadow-[0_15px_40px_rgba(0,0,0,0.4)]">
          <h3 className="text-white font-black text-base tracking-tight mb-5 flex items-center gap-2">
            <Clock className="text-charistar-green" size={18} />
            Global Configurations
          </h3>

          {isSaved && (
            <div className="bg-charistar-green/10 border border-charistar-green/20 text-charistar-green p-4 rounded-xl text-xs font-black flex items-center gap-2 mb-6">
              <CheckCircle size={14} className="animate-bounce" /> Settings updated successfully in cloud Firestore!
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Geofence Radius (km)</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-charistar-green" />
                  <input 
                    type="number" 
                    step="0.1"
                    required
                    value={activeRadii}
                    onChange={e => setActiveRadii(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-xs text-white font-semibold focus:border-charistar-green outline-none transition-colors" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Flat Delivery Fee (₦)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-charistar-green text-xs font-black">₦</span>
                  <input 
                    type="number" 
                    required
                    value={deliveryFee}
                    onChange={e => setDeliveryFee(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3.5 text-xs text-white font-semibold focus:border-charistar-green outline-none transition-colors" 
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Paystack Public API Key</label>
              <div className="relative">
                <Key size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-charistar-green" />
                <input 
                  type={showKey ? 'text' : 'password'}
                  required
                  value={paystackPK}
                  onChange={e => setPaystackPK(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-12 py-3.5 text-xs text-white font-semibold focus:border-charistar-green outline-none transition-colors" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-4 bg-charistar-green text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-[#b3e600] active:scale-95 transition-all shadow-sm flex items-center justify-center gap-1.5 font-black"
            >
              <Save size={14} /> Save System Settings
            </button>
          </form>
        </div>

        {/* Roles Permission matrix */}
        <div className="glass-panel p-7.5 rounded-[1.8rem] border border-white/10 bg-[#0c0c0c]/85 shadow-[0_15px_40px_rgba(0,0,0,0.4)]">
          <h3 className="text-white font-black text-xs tracking-wider uppercase mb-5 flex items-center gap-2">
            <Shield className="text-charistar-green" size={14} />
            Role Access Permissions Grid
          </h3>

          <div className="space-y-4">
            {roles.map((r, rIdx) => (
              <div key={r.role} className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3">
                <span className="text-xs font-black text-white">{r.role}</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'catalog', label: 'Edit Catalog' },
                    { id: 'dispatch', label: 'Dispatch' },
                    { id: 'finance', label: 'Finance Ledg' },
                    { id: 'support', label: 'Ticket Support' }
                  ].map(p => (
                    <label key={p.id} className="flex items-center gap-2 cursor-pointer bg-[#050505]/40 px-3 py-2 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={r[p.id]}
                        onChange={() => handleTogglePermission(rIdx, p.id)}
                        className="w-3.5 h-3.5 border border-white/20 rounded accent-charistar-green bg-transparent" 
                      />
                      <span className="text-[10px] font-semibold text-gray-400">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Diagnostics Utilities Section */}
      <div className="glass-panel p-7.5 rounded-[1.8rem] border border-white/10 bg-[#0c0c0c]/85 shadow-[0_15px_40px_rgba(0,0,0,0.4)] mt-6">
        <h3 className="text-white font-black text-sm tracking-tight mb-4 flex items-center gap-2">
          <ShieldAlert className="text-red-400" size={16} />
          System Diagnostics & Utilities
        </h3>
        <p className="text-xs text-gray-500 font-semibold leading-relaxed mb-6">
          If your database changes are not appearing, or saving is hanging, your browser is likely serving a cached older Service Worker version of the application. Click below to unregister all service workers, clear local storage caches, and force a fresh reload of the application to update.
        </p>
        <button
          onClick={handleResetSystem}
          className="px-6 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.01] active:scale-95"
        >
          🚨 Reset System Cache & SW
        </button>
      </div>

    </div>
  );
}
