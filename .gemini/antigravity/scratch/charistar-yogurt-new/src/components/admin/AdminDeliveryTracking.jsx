import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Compass, Shield, ChevronRight, Zap, RefreshCw, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminDeliveryTracking() {
  const [activeRiders, setActiveRiders] = useState([
    { id: 'R-101', name: 'Tunde Adebayo', lat: 6.5244, lng: 3.3792, speed: '24 km/h', eta: '5 mins', battery: '82%', currentOrder: '#CH-9824', zone: 'Unilag Main Campus' },
    { id: 'R-102', name: 'Chinedu Okafor', lat: 6.6018, lng: 3.3515, speed: '12 km/h', eta: '11 mins', battery: '95%', currentOrder: '#CH-9721', zone: 'Covenant Estate' },
    { id: 'R-103', name: 'Kabiru Musa', lat: 6.4281, lng: 3.4219, speed: '0 km/h (resting)', eta: 'N/A', battery: '60%', currentOrder: 'None', zone: 'Lekki Phase 1' }
  ]);

  const [geofences, setGeofences] = useState([
    { id: 'Z-1', name: 'University of Lagos (Unilag)', radius: '1.8 km', ordersToday: 48, status: 'high_demand' },
    { id: 'Z-2', name: 'Covenant University Campus', radius: '2.5 km', ordersToday: 82, status: 'high_demand' },
    { id: 'Z-3', name: 'Lekki Residential Zone A', radius: '3.0 km', ordersToday: 15, status: 'normal' },
    { id: 'Z-4', name: 'Ikeja Gra Corporate Zone', radius: '2.0 km', ordersToday: 29, status: 'normal' }
  ]);

  const [selectedRider, setSelectedRider] = useState(null);
  const [isSimulating, setIsSimulating] = useState(true);

  // Simulated GPS coordinate drifting effect
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setActiveRiders(prev => prev.map(r => {
        if (r.speed.includes('0')) return r; // Offline or resting
        const latDrift = (Math.random() - 0.5) * 0.001;
        const lngDrift = (Math.random() - 0.5) * 0.001;
        return {
          ...r,
          lat: parseFloat((r.lat + latDrift).toFixed(5)),
          lng: parseFloat((r.lng + lngDrift).toFixed(5))
        };
      }));
    }, 4000);

    return () => clearInterval(interval);
  }, [isSimulating]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Upper header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-[#050505]/40 p-6 rounded-[1.5rem] border border-white/5">
        <div>
          <h2 className="text-white font-black text-xl tracking-tight flex items-center gap-2">
            <Navigation className="text-charistar-green animate-pulse" size={24} />
            Live Delivery Tracking & Geofencing
          </h2>
          <p className="text-xs text-gray-500 font-semibold mt-1">Real-time GPS routing, geofence analytics, and dynamic ETA prediction.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSimulating(!isSimulating)}
            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
              isSimulating 
                ? 'bg-charistar-green/10 border-charistar-green/30 text-charistar-green hover:bg-charistar-green/20' 
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            {isSimulating ? '⚡ Live GPS Feed Active' : '⏸ GPS Feed Paused'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Simulated Mapbox / SVG Interactive Canvas */}
        <div className="lg:col-span-2 glass-panel p-7.5 rounded-[1.8rem] border border-white/10 bg-[#0c0c0c]/85 shadow-[0_15px_40px_rgba(0,0,0,0.4)] flex flex-col justify-between min-h-[450px] relative overflow-hidden">
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <div className="bg-black/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-[9px] font-black uppercase tracking-widest text-charistar-green flex items-center gap-1.5 shadow-md">
              <Layers size={10} /> Hybrid Layer
            </div>
            <div className="bg-black/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-[9px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5 shadow-md">
              <Compass size={10} /> Mapbox API v3
            </div>
          </div>

          {/* SVG Map Graphics Grid */}
          <div className="flex-1 flex items-center justify-center relative bg-[#050505] rounded-2xl border border-white/5 overflow-hidden p-4 min-h-[320px]">
            {/* Grid Line Underlays */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:30px_30px]" />
            
            {/* Glowing Map Hub Circle */}
            <div className="absolute top-1/2 left-1/2 w-48 h-48 rounded-full border border-charistar-green/10 bg-charistar-green/5 blur-xl -translate-x-1/2 -translate-y-1/2" />
            
            {/* Geofence Circles */}
            <div className="absolute w-64 h-64 border border-charistar-green/20 bg-charistar-green/5 rounded-full flex items-center justify-center animate-pulse" style={{ top: '15%', left: '10%' }}>
              <span className="absolute bottom-2 text-[8px] font-extrabold uppercase tracking-widest text-charistar-green/60">Unilag Geofence</span>
            </div>

            <div className="absolute w-80 h-80 border border-sky-500/10 bg-sky-500/5 rounded-full flex items-center justify-center" style={{ bottom: '5%', right: '5%' }}>
              <span className="absolute top-2 text-[8px] font-extrabold uppercase tracking-widest text-sky-400/60">Lekki Geofence</span>
            </div>

            {/* Simulated Center Pin */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="w-4 h-4 bg-white border-2 border-black rounded-full shadow-lg flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-charistar-green rounded-full" />
              </div>
              <span className="bg-black/95 px-2.5 py-1 rounded-md border border-white/10 text-[8px] font-black uppercase text-white mt-1.5 tracking-wider shadow-md">Charistar HQ</span>
            </div>

            {/* Render Active Rider Markers */}
            {activeRiders.map((rider, i) => (
              <motion.div
                key={rider.id}
                className="absolute cursor-pointer flex flex-col items-center z-10"
                style={{
                  top: `${25 + i * 20}%`,
                  left: `${20 + i * 22}%`
                }}
                onClick={() => setSelectedRider(rider)}
                whileHover={{ scale: 1.1 }}
              >
                <div className="relative">
                  {/* Radar Wave */}
                  {rider.speed !== '0 km/h (resting)' && (
                    <span className="absolute -inset-1.5 bg-charistar-green/30 rounded-full animate-ping" />
                  )}
                  <div className={`w-7.5 h-7.5 rounded-full flex items-center justify-center shadow-lg border-2 ${
                    selectedRider?.id === rider.id ? 'bg-charistar-green border-black text-black' : 'bg-black border-charistar-green text-charistar-green'
                  }`}>
                    <Navigation size={12} className={rider.speed !== '0 km/h (resting)' ? 'rotate-45' : ''} />
                  </div>
                </div>
                <span className="bg-black/90 backdrop-blur-md px-2 py-0.5 rounded border border-white/10 text-[7px] font-extrabold text-white mt-1 uppercase tracking-widest shadow-md">
                  {rider.name.split(' ')[0]}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Quick HUD Readout */}
          {selectedRider && (
            <div className="bg-[#050505]/90 border border-white/5 p-4 rounded-xl mt-4.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black">Selected Courier HUD</p>
                <p className="text-xs font-black text-white mt-0.5">{selectedRider.name} <span className="text-charistar-green font-bold">({selectedRider.id})</span></p>
              </div>
              <div className="flex gap-4">
                <div>
                  <p className="text-[8px] text-gray-500 uppercase tracking-widest font-black">Speed</p>
                  <p className="text-xs font-bold text-white">{selectedRider.speed}</p>
                </div>
                <div>
                  <p className="text-[8px] text-gray-500 uppercase tracking-widest font-black">ETA</p>
                  <p className="text-xs font-bold text-charistar-green">{selectedRider.eta}</p>
                </div>
                <div>
                  <p className="text-[8px] text-gray-500 uppercase tracking-widest font-black">Battery</p>
                  <p className="text-xs font-bold text-white">{selectedRider.battery}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Courier Logs & Zones Sidebar */}
        <div className="space-y-6">
          {/* Active Couriers Lists */}
          <div className="glass-panel p-6 rounded-[1.8rem] border border-white/10 bg-[#0c0c0c]/85 shadow-[0_15px_40px_rgba(0,0,0,0.4)]">
            <h3 className="text-white font-black text-xs tracking-wider uppercase mb-4 flex items-center gap-2">
              <RefreshCw size={14} className="text-charistar-green animate-spin" style={{ animationDuration: '4s' }} />
              Live Fleet Stream ({activeRiders.length})
            </h3>
            <div className="space-y-3.5">
              {activeRiders.map(rider => (
                <div 
                  key={rider.id}
                  onClick={() => setSelectedRider(rider)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex justify-between items-center ${
                    selectedRider?.id === rider.id 
                      ? 'bg-charistar-green/10 border-charistar-green/30' 
                      : 'bg-white/5 border-white/5 hover:border-white/15'
                  }`}
                >
                  <div>
                    <h4 className="text-white text-xs font-bold">{rider.name}</h4>
                    <p className="text-[9px] text-gray-500 font-semibold mt-1">Zone: {rider.zone}</p>
                  </div>
                  <ChevronRight size={14} className="text-gray-500" />
                </div>
              ))}
            </div>
          </div>

          {/* Active Geofenced zones */}
          <div className="glass-panel p-6 rounded-[1.8rem] border border-white/10 bg-[#0c0c0c]/85 shadow-[0_15px_40px_rgba(0,0,0,0.4)]">
            <h3 className="text-white font-black text-xs tracking-wider uppercase mb-4 flex items-center gap-2">
              <Shield size={14} className="text-charistar-green" />
              Active Geofence Zones
            </h3>
            <div className="space-y-4">
              {geofences.map(zone => (
                <div key={zone.id} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                  <div>
                    <p className="text-xs font-bold text-white">{zone.name}</p>
                    <p className="text-[9px] text-gray-500 font-semibold mt-1">Radius: {zone.radius} • {zone.ordersToday} orders today</p>
                  </div>
                  {zone.status === 'high_demand' && (
                    <span className="px-2.5 py-1.5 bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[8px] font-black uppercase tracking-widest rounded-full flex items-center gap-1">
                      <Zap size={9} /> Hotspot
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
