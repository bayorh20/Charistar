import React, { useState } from 'react';
import { School, MapPin, Percent, Users, Plus, Trash2, ShieldAlert, BadgePercent, Landmark } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminCampus() {
  const [campuses, setCampuses] = useState([
    { id: 'C-301', name: 'University of Lagos (Unilag)', buildings: ['Moremi Hall', 'Jaja Hall', 'Eni Njoku Hall', 'Faculty of Law'], studentDiscount: 15, activeHotspots: 8, ordersToday: 124 },
    { id: 'C-302', name: 'Covenant University Campus', buildings: ['Peter Hall', 'Esther Hall', 'Paul Hall', 'Senate Building'], studentDiscount: 20, activeHotspots: 12, ordersToday: 245 },
    { id: 'C-303', name: 'Lagos State University (LASU)', buildings: ['FSS Hostel', 'Faculty of Arts', 'Student Union Building'], studentDiscount: 10, activeHotspots: 5, ordersToday: 68 },
    { id: 'C-304', name: 'University of Ibadan (UI)', buildings: ['Mellanby Hall', 'Tedder Hall', 'Kuti Hall', 'Queen Elizabeth Hall'], studentDiscount: 12, activeHotspots: 9, ordersToday: 88 }
  ]);

  const [selectedCampus, setSelectedCampus] = useState(null);
  const [newBuildingName, setNewBuildingName] = useState('');
  const [discountSlider, setDiscountSlider] = useState(10);

  const handleUpdateDiscount = (campusId, newDiscount) => {
    setCampuses(prev => prev.map(c => c.id === campusId ? { ...c, studentDiscount: newDiscount } : c));
  };

  const handleAddBuilding = (e) => {
    e.preventDefault();
    if (!selectedCampus || !newBuildingName) return;

    setCampuses(prev => prev.map(c => {
      if (c.id === selectedCampus.id) {
        return {
          ...c,
          buildings: [...c.buildings, newBuildingName]
        };
      }
      return c;
    }));
    
    setSelectedCampus(prev => ({
      ...prev,
      buildings: [...prev.buildings, newBuildingName]
    }));
    
    setNewBuildingName('');
  };

  const handleRemoveBuilding = (campusId, buildingName) => {
    setCampuses(prev => prev.map(c => {
      if (c.id === campusId) {
        return {
          ...c,
          buildings: c.buildings.filter(b => b !== buildingName)
        };
      }
      return c;
    }));

    if (selectedCampus && selectedCampus.id === campusId) {
      setSelectedCampus(prev => ({
        ...prev,
        buildings: prev.buildings.filter(b => b !== buildingName)
      }));
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-[#050505]/40 p-6 rounded-[1.5rem] border border-white/5">
        <div>
          <h2 className="text-white font-black text-xl tracking-tight flex items-center gap-2">
            <School className="text-charistar-green" size={24} />
            Campus & Logistics Center
          </h2>
          <p className="text-xs text-gray-500 font-semibold mt-1">Configure geofenced academic zones, building/hostel drop points, and student pricing rates.</p>
        </div>
        <button 
          onClick={() => alert("Simulation: Launching New Campus onboarding console")}
          className="flex items-center gap-2 px-6 py-3.5 bg-charistar-green text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#b3e600] active:scale-95 transition-all shadow-sm"
        >
          <Plus size={14} /> Add University Location
        </button>
      </div>

      {/* Campus Lists and pricing configurations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Campuses & Pricing Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-7.5 rounded-[1.8rem] border border-white/10 bg-[#0c0c0c]/85 shadow-[0_15px_40px_rgba(0,0,0,0.4)]">
            <h3 className="text-white font-black text-base tracking-tight mb-5 flex items-center gap-2">
              <Landmark className="text-charistar-green" size={18} />
              Active Academic Clusters
            </h3>
            
            <div className="space-y-4">
              {campuses.map(campus => (
                <div key={campus.id} className="bg-white/5 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-charistar-green/10 rounded-xl flex items-center justify-center text-charistar-green flex-shrink-0">
                      <School size={18} />
                    </div>
                    <div>
                      <h4 className="text-white font-black text-sm tracking-tight">{campus.name}</h4>
                      <p className="text-gray-500 text-[10px] font-semibold mt-1">
                        {campus.buildings.length} Drop Hotspots • {campus.ordersToday} Orders Transacted Today
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
                    {/* Student Discount Control */}
                    <div className="text-right sm:text-right">
                      <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black flex items-center gap-1"><BadgePercent size={11} className="text-charistar-green" /> Student Discount</p>
                      <div className="flex items-center gap-2 mt-1">
                        <input 
                          type="range" 
                          min="0" 
                          max="40" 
                          value={campus.studentDiscount}
                          onChange={(e) => handleUpdateDiscount(campus.id, parseInt(e.target.value))}
                          className="w-16 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-charistar-green" 
                        />
                        <span className="text-xs font-black text-white">{campus.studentDiscount}%</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => setSelectedCampus(campus)}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                    >
                      Hotspots
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hotspots / Buildings Manager */}
        <div className="glass-panel p-7.5 rounded-[1.8rem] border border-white/10 bg-[#0c0c0c]/85 shadow-[0_15px_40px_rgba(0,0,0,0.4)] flex flex-col justify-between min-h-[350px]">
          {selectedCampus ? (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-white font-black text-xs tracking-wider uppercase">Hotspots Manager</h3>
                    <p className="text-[10px] text-charistar-green font-bold mt-1 leading-tight">{selectedCampus.name}</p>
                  </div>
                  <button onClick={() => setSelectedCampus(null)} className="text-gray-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest">
                    Clear
                  </button>
                </div>

                <div className="max-h-[160px] overflow-y-auto pr-1 no-scrollbar space-y-2 mb-6">
                  {selectedCampus.buildings.map(b => (
                    <div key={b} className="flex justify-between items-center bg-white/5 px-4 py-2.5 rounded-xl border border-white/5">
                      <span className="text-xs font-semibold text-white">{b}</span>
                      <button 
                        onClick={() => handleRemoveBuilding(selectedCampus.id, b)}
                        className="text-gray-500 hover:text-red-400 transition-colors"
                        title="Remove Hotspot"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  {selectedCampus.buildings.length === 0 && (
                    <p className="text-gray-500 text-xs italic text-center py-4">No geofenced drop-offs active.</p>
                  )}
                </div>
              </div>

              {/* Add New building / hotspot Form */}
              <form onSubmit={handleAddBuilding} className="border-t border-white/5 pt-5 space-y-4">
                <div>
                  <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">New Drop Hotspot</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-charistar-green" />
                    <input 
                      type="text" 
                      required 
                      value={newBuildingName}
                      onChange={e => setNewBuildingName(e.target.value)}
                      placeholder="e.g. Postgraduate Block C" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-xs text-white font-semibold focus:border-charistar-green focus:bg-black/30 outline-none transition-all" 
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3.5 bg-charistar-green text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-[#b3e600] active:scale-95 transition-all shadow-sm flex items-center justify-center gap-1.5 font-black"
                >
                  <Plus size={12} /> Add Drop Point
                </button>
              </form>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-center p-6">
              <School size={36} className="text-gray-600 mb-4 animate-pulse" />
              <h4 className="text-white font-black text-sm tracking-tight mb-2">Select a Campus Cluster</h4>
              <p className="text-gray-500 text-[10px] leading-relaxed font-semibold max-w-[180px]">
                Click "Hotspots" on any academic institution to manage building drop coordinates and geofences.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
