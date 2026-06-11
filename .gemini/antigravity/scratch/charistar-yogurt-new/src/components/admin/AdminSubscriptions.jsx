import React, { useState } from 'react';
import { Tag, BadgePercent, Gift, Users, Plus, ShieldCheck, Zap, Star, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminSubscriptions() {
  const [plans, setPlans] = useState([
    { id: 'SUB-A', name: 'Daily Yogurt Pack', price: 9500, period: 'weekly', subscribers: 142, revenue: 1349000, active: true },
    { id: 'SUB-B', name: 'Weekly Parfait Club', price: 28000, period: 'monthly', subscribers: 84, revenue: 2352000, active: true },
    { id: 'SUB-C', name: 'Corporate Healthy Snack', price: 75000, period: 'monthly', subscribers: 18, revenue: 1350000, active: true },
    { id: 'SUB-D', name: 'Student Yogurt Saver', price: 6500, period: 'weekly', subscribers: 215, revenue: 1397500, active: false }
  ]);

  const [selectedPlan, setSelectedPlan] = useState(null);

  const handleTogglePlan = (id) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-[#050505]/40 p-6 rounded-[1.5rem] border border-white/5">
        <div>
          <h2 className="text-white font-black text-xl tracking-tight flex items-center gap-2">
            <Sparkles className="text-charistar-green" size={24} />
            Charistar Yogurt Club Subscriptions
          </h2>
          <p className="text-xs text-gray-500 font-semibold mt-1">Manage active corporate/student yogurt subscription programs and track Monthly Recurring Revenue (MRR).</p>
        </div>
        <button 
          onClick={() => alert("Simulation: New subscription packages creation sheet launched")}
          className="flex items-center gap-2 px-6 py-3.5 bg-charistar-green text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#b3e600] active:scale-95 transition-all shadow-sm"
        >
          <Plus size={14} /> Create Package Tier
        </button>
      </div>

      {/* Subscription Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div key={plan.id} className="glass-panel p-7 rounded-[1.8rem] border border-white/10 bg-[#0c0c0c]/85 hover:border-charistar-green/20 transition-all duration-300 shadow-[0_15px_40px_rgba(0,0,0,0.4)] flex flex-col justify-between gap-6 group">
            
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-charistar-green flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Star size={22} className="fill-charistar-green/10" />
                </div>
                <div>
                  <h4 className="text-white font-black text-sm tracking-tight">{plan.name}</h4>
                  <p className="text-[10px] text-gray-500 font-bold mt-1.5 uppercase tracking-wider">₦{plan.price.toLocaleString()} / {plan.period}</p>
                </div>
              </div>

              {/* Toggle switch */}
              <button 
                onClick={() => handleTogglePlan(plan.id)}
                className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all ${
                  plan.active 
                    ? 'bg-charistar-green/10 border-charistar-green/20 text-charistar-green' 
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}
              >
                {plan.active ? 'Active' : 'Archived'}
              </button>
            </div>

            {/* Plan Metrics */}
            <div className="bg-[#050505]/40 p-4 rounded-xl border border-white/5 space-y-2">
              <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold">
                <span>Active Subscribers:</span>
                <span className="text-white font-black">{plan.subscribers} Accounts</span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold">
                <span>Accrued Revenue:</span>
                <span className="text-charistar-green font-black">₦{plan.revenue.toLocaleString()}</span>
              </div>
            </div>

            {/* Subscription Detail HUD */}
            <div className="border-t border-white/5 pt-4">
              <button 
                onClick={() => alert(`Selected ${plan.name} subscribers ledger.`)}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white border border-white/5 hover:border-white/15 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Inspect Subscribers List
              </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
