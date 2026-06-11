import React, { useState } from 'react';
import { Package, ShieldAlert, CheckCircle2, ChevronRight, Plus, RefreshCw, ShoppingBag, Truck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminInventory() {
  const [ingredients, setIngredients] = useState([
    { id: 'ING-01', name: 'Premium Greek Yogurt Base', level: 25, threshold: 30, unit: 'liters', category: 'Dairy Base', supplier: 'FreshDairy Farms' },
    { id: 'ING-02', name: 'Wild Organic Honey', level: 12, threshold: 10, unit: 'kg', category: 'Sweetener', supplier: 'OrganoFruit Merchants' },
    { id: 'ING-03', name: 'Organic Honey Granola Oats', level: 8, threshold: 15, unit: 'kg', category: 'Dry Toppings', supplier: 'Nuts & Granola Co.' },
    { id: 'ING-04', name: 'Fresh Strawberries', level: 5, threshold: 10, unit: 'kg', category: 'Fruits', supplier: 'OrganoFruit Merchants' },
    { id: 'ING-05', name: 'Fresh Blueberries', level: 18, threshold: 10, unit: 'kg', category: 'Fruits', supplier: 'OrganoFruit Merchants' }
  ]);

  const [loading, setLoading] = useState(false);

  const handleAutoRestock = (ingId) => {
    setLoading(true);
    setTimeout(() => {
      setIngredients(prev => prev.map(ing => {
        if (ing.id === ingId) {
          return {
            ...ing,
            level: ing.level + ing.threshold * 2 // Fully replenished
          };
        }
        return ing;
      }));
      setLoading(false);
      alert("Order placed successfully with supplier! Stock levels replenished.");
    }, 1000);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-[#050505]/40 p-6 rounded-[1.5rem] border border-white/5">
        <div>
          <h2 className="text-white font-black text-xl tracking-tight flex items-center gap-2">
            <Package className="text-charistar-green" size={24} />
            Ingredient Inventory & Stock levels
          </h2>
          <p className="text-xs text-gray-500 font-semibold mt-1">Monitor real-time ingredient volumes, auto-alert thresholds, and place supply restock requests.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Ingredient Stock Controller */}
        <div className="lg:col-span-2 glass-panel p-7.5 rounded-[1.8rem] border border-white/10 bg-[#0c0c0c]/85 shadow-[0_15px_40px_rgba(0,0,0,0.4)]">
          <h3 className="text-white font-black text-base tracking-tight mb-5">Ingredient Meter</h3>

          <div className="space-y-6">
            {ingredients.map(ing => {
              const isLow = ing.level <= ing.threshold;
              const percent = Math.min((ing.level / (ing.threshold * 2.5)) * 100, 100);

              return (
                <div key={ing.id} className="bg-white/5 p-5 rounded-2xl border border-white/5 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-white font-black text-sm tracking-tight">{ing.name}</h4>
                      <p className="text-[10px] text-gray-500 font-bold mt-1.5 uppercase tracking-wider">{ing.category} • Supplier: {ing.supplier}</p>
                    </div>

                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                      isLow 
                        ? 'bg-red-400/10 border-red-400/20 text-red-400 animate-pulse' 
                        : 'bg-charistar-green/10 border-charistar-green/20 text-charistar-green'
                    }`}>
                      {isLow ? (
                        <>
                          <ShieldAlert size={10} /> Low Stock Alert
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={10} /> Optimal Stock
                        </>
                      )}
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-400">
                      <span>Stock: {ing.level} {ing.unit}</span>
                      <span>Target: {ing.threshold * 2} {ing.unit}</span>
                    </div>
                    <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isLow ? 'bg-red-400 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-charistar-green shadow-[0_0_10px_rgba(163,198,68,0.3)]'
                        }`} 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {isLow && (
                    <div className="flex justify-between items-center border-t border-white/5 pt-3 mt-1.5">
                      <p className="text-[10px] text-gray-500 font-semibold">Suggested Restock Amount: {ing.threshold * 2} {ing.unit}</p>
                      <button 
                        onClick={() => handleAutoRestock(ing.id)}
                        disabled={loading}
                        className="px-4 py-2 bg-charistar-green text-black font-black uppercase tracking-widest text-[9px] rounded-xl hover:bg-[#b3e600] active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1"
                      >
                        <RefreshCw size={10} className={loading ? 'animate-spin' : ''} /> Dispatch Restock Order
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Supplier & purchase stats */}
        <div className="glass-panel p-7.5 rounded-[1.8rem] border border-white/10 bg-[#0c0c0c]/85 shadow-[0_15px_40px_rgba(0,0,0,0.4)] flex flex-col justify-between">
          <div>
            <h3 className="text-white font-black text-xs tracking-wider uppercase mb-5 flex items-center gap-2">
              <Truck className="text-charistar-green" size={14} />
              Supplier Dispatch SLA
            </h3>
            <p className="text-xs text-gray-400 font-semibold leading-relaxed mb-6">
              Track outstanding supply dispatch lines, purchase history ledger, and restocking logs.
            </p>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-3.5 bg-white/5 rounded-xl border border-white/5">
                <span className="text-xs font-semibold text-gray-300">Active Supply Lines</span>
                <span className="text-xs font-black text-white">3 Active</span>
              </div>
              <div className="flex justify-between items-center p-3.5 bg-white/5 rounded-xl border border-white/5">
                <span className="text-xs font-semibold text-gray-300">Pending Restock Orders</span>
                <span className="text-xs font-black text-amber-400">1 Dispatch</span>
              </div>
              <div className="flex justify-between items-center p-3.5 bg-white/5 rounded-xl border border-white/5">
                <span className="text-xs font-semibold text-gray-300">Avg. Supplier fulfillment</span>
                <span className="text-xs font-black text-charistar-green">4.2 Hours</span>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 mt-6">
            <span className="text-[9px] text-gray-600 uppercase tracking-widest font-black block mb-2.5">Auto-Restock System</span>
            <div className="bg-[#050505]/40 border border-white/5 p-4 rounded-xl flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-charistar-green rounded-full animate-pulse" />
              <p className="text-[10px] font-black text-white uppercase tracking-wider">Predictive AI stock on</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
