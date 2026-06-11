import React, { useState } from 'react';
import { Truck, ShieldCheck, Star, Users, MapPin, X, Check, DollarSign, Award, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDrivers() {
  const [riders, setRiders] = useState([
    { id: 'R-101', name: 'Tunde Adebayo', status: 'active', phone: '08034567890', vehicle: 'Motorcycle', rating: 4.8, trips: 142, wallet: 18500.00, verified: true },
    { id: 'R-102', name: 'Chinedu Okafor', status: 'active', phone: '08123456789', vehicle: 'Bicycle', rating: 4.9, trips: 98, wallet: 12400.00, verified: true },
    { id: 'R-103', name: 'Kabiru Musa', status: 'offline', phone: '09012345678', vehicle: 'Motorcycle', rating: 4.5, trips: 230, wallet: 35000.00, verified: true },
    { id: 'R-104', name: 'Babajide Balogun', status: 'pending', phone: '08098765432', vehicle: 'Motorcycle', rating: 0.0, trips: 0, wallet: 0.00, verified: false }
  ]);

  const [selectedRider, setSelectedRider] = useState(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutSuccess, setPayoutSuccess] = useState('');

  const handleVerify = (riderId, approve) => {
    setRiders(prev => prev.map(r => {
      if (r.id === riderId) {
        return {
          ...r,
          verified: approve,
          status: approve ? 'active' : 'suspended'
        };
      }
      return r;
    }));
  };

  const handlePayout = (e) => {
    e.preventDefault();
    if (!selectedRider || !payoutAmount) return;
    const amount = parseFloat(payoutAmount);
    if (amount > selectedRider.wallet) {
      alert("Error: Payout amount exceeds rider wallet balance.");
      return;
    }
    
    setRiders(prev => prev.map(r => {
      if (r.id === selectedRider.id) {
        return {
          ...r,
          wallet: r.wallet - amount
        };
      }
      return r;
    }));

    setPayoutSuccess(`Successfully disbursed ₦${amount.toLocaleString()} to ${selectedRider.name}'s account.`);
    setTimeout(() => {
      setSelectedRider(null);
      setPayoutAmount('');
      setPayoutSuccess('');
    }, 2000);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Upper Title / Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-[#050505]/40 p-6 rounded-[1.5rem] border border-white/5">
        <div>
          <h2 className="text-white font-black text-xl tracking-tight flex items-center gap-2">
            <Truck className="text-charistar-green" size={24} />
            Drivers & Riders Management
          </h2>
          <p className="text-xs text-gray-500 font-semibold mt-1">Onboard, verify, monitor attendance, and disburse courier earnings.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-[#0c0c0c]/80 border border-white/10 px-5 py-3 rounded-2xl flex items-center gap-3">
            <Users size={16} className="text-charistar-green" />
            <div>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black">Active Riders</p>
              <p className="text-sm font-black text-white">{riders.filter(r => r.status === 'active').length}</p>
            </div>
          </div>
          <div className="bg-[#0c0c0c]/80 border border-white/10 px-5 py-3 rounded-2xl flex items-center gap-3">
            <Clock size={16} className="text-amber-400" />
            <div>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black">Pending Approval</p>
              <p className="text-sm font-black text-white">{riders.filter(r => r.status === 'pending').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding / Verification Panel */}
      <div className="glass-panel p-7.5 rounded-[1.8rem] border border-white/10 bg-[#0c0c0c]/80 shadow-[0_15px_40px_rgba(0,0,0,0.4)]">
        <h3 className="text-white font-black text-base tracking-tight mb-5 flex items-center gap-2">
          <ShieldCheck className="text-charistar-green" size={18} />
          Onboarding & Verification Pipeline
        </h3>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="pb-4 text-[10px] text-gray-500 font-black uppercase tracking-widest">Rider ID</th>
                <th className="pb-4 text-[10px] text-gray-500 font-black uppercase tracking-widest">Courier Name</th>
                <th className="pb-4 text-[10px] text-gray-500 font-black uppercase tracking-widest">Vehicle</th>
                <th className="pb-4 text-[10px] text-gray-500 font-black uppercase tracking-widest">Phone</th>
                <th className="pb-4 text-[10px] text-gray-500 font-black uppercase tracking-widest">Verification Status</th>
                <th className="pb-4 text-right text-[10px] text-gray-500 font-black uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
              {riders.map(rider => (
                <tr key={rider.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 text-xs font-black text-charistar-green">{rider.id}</td>
                  <td className="py-4 text-xs font-bold text-white flex items-center gap-2">
                    {rider.name}
                    {rider.verified && <ShieldCheck size={14} className="text-charistar-green fill-charistar-green/10" />}
                  </td>
                  <td className="py-4 text-xs font-semibold text-gray-400">{rider.vehicle}</td>
                  <td className="py-4 text-xs font-semibold text-gray-400">{rider.phone}</td>
                  <td className="py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      rider.verified 
                        ? 'bg-charistar-green/10 border-charistar-green/20 text-charistar-green' 
                        : rider.status === 'pending'
                        ? 'bg-amber-400/10 border-amber-400/20 text-amber-400'
                        : 'bg-red-400/10 border-red-400/20 text-red-400'
                    }`}>
                      {rider.verified ? 'Verified Active' : rider.status === 'pending' ? 'Needs Review' : 'Suspended'}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    {!rider.verified ? (
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleVerify(rider.id, true)}
                          className="w-8 h-8 rounded-xl bg-charistar-green/20 hover:bg-charistar-green text-charistar-green hover:text-black flex items-center justify-center border border-charistar-green/10 hover:border-transparent transition-all"
                          title="Approve Rider"
                        >
                          <Check size={14} />
                        </button>
                        <button 
                          onClick={() => handleVerify(rider.id, false)}
                          className="w-8 h-8 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white flex items-center justify-center border border-red-500/10 hover:border-transparent transition-all"
                          title="Reject / Suspend"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleVerify(rider.id, false)}
                        className="text-[10px] font-black text-red-400 hover:text-red-300 uppercase tracking-widest transition-colors"
                      >
                        Revoke Credentials
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ledger & earnings dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active performance list */}
        <div className="lg:col-span-2 glass-panel p-7.5 rounded-[1.8rem] border border-white/10 bg-[#0c0c0c]/85 shadow-[0_15px_40px_rgba(0,0,0,0.4)]">
          <h3 className="text-white font-black text-base tracking-tight mb-5 flex items-center gap-2">
            <Award className="text-charistar-green" size={18} />
            Courier Earnings & Trip Metrics
          </h3>
          <div className="space-y-4">
            {riders.filter(r => r.verified).map(rider => (
              <div key={rider.id} className="flex flex-col sm:flex-row justify-between sm:items-center bg-white/5 p-5 rounded-2xl border border-white/5 gap-4 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-charistar-green/10 rounded-xl flex items-center justify-center text-charistar-green flex-shrink-0">
                    <Truck size={18} />
                  </div>
                  <div>
                    <h4 className="text-white font-black text-sm tracking-tight">{rider.name}</h4>
                    <p className="text-gray-500 text-[10px] font-semibold mt-1 flex items-center gap-2">
                      <span className="flex items-center gap-0.5 text-amber-400">
                        <Star size={11} className="fill-amber-400" /> {rider.rating}
                      </span>
                      • {rider.trips} Trips Completed
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
                  <div className="text-right sm:text-right">
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black">Accrued Wallet</p>
                    <p className="text-base font-black text-white mt-0.5">₦{rider.wallet.toLocaleString()}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedRider(rider)}
                    className="px-5 py-2.5 bg-charistar-green text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-[#b3e600] active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <DollarSign size={12} /> Disburse
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance Monitor Summary */}
        <div className="glass-panel p-7.5 rounded-[1.8rem] border border-white/10 bg-[#0c0c0c]/85 shadow-[0_15px_40px_rgba(0,0,0,0.4)] flex flex-col justify-between">
          <div>
            <h3 className="text-white font-black text-base tracking-tight mb-5 flex items-center gap-2">
              <Clock className="text-charistar-green" size={18} />
              Attendance Monitor
            </h3>
            <p className="text-xs text-gray-400 font-semibold leading-relaxed mb-6">
              Visualizes real-time courier check-in status, operational logs, and geographical coverage metrics.
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-xl border border-white/5">
                <span className="text-xs text-gray-300 font-semibold">Active & Online</span>
                <span className="text-xs font-black text-charistar-green">3 Couriers</span>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-xl border border-white/5">
                <span className="text-xs text-gray-300 font-semibold">Offline Status</span>
                <span className="text-xs font-black text-gray-500">1 Courier</span>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-xl border border-white/5">
                <span className="text-xs text-gray-300 font-semibold">Average On-Time Delivery</span>
                <span className="text-xs font-black text-sky-400">96.8%</span>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 mt-6">
            <span className="text-[9px] text-gray-600 uppercase tracking-widest font-black block mb-2.5">Quick Actions</span>
            <button 
              onClick={() => alert("Simulation: Emergency system broadcast sent to all active riders.")}
              className="w-full py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Broadcast Alert (All Riders)
            </button>
          </div>
        </div>
      </div>

      {/* Disbursal Modal */}
      <AnimatePresence>
        {selectedRider && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setSelectedRider(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm glass-panel bg-[#090909] rounded-[1.8rem] border border-white/10 p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Payout Disbursal</h2>
              <p className="text-gray-400 text-xs font-semibold mb-6">Disbursing earnings to <span className="text-white font-black">{selectedRider.name}</span></p>

              {payoutSuccess ? (
                <div className="bg-charistar-green/10 border border-charistar-green/20 text-charistar-green p-4.5 rounded-2xl text-xs font-black text-center leading-relaxed">
                  {payoutSuccess}
                </div>
              ) : (
                <form onSubmit={handlePayout} className="space-y-6">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-1.5">Available Wallet Balance</p>
                    <p className="text-lg font-black text-white leading-tight">₦{selectedRider.wallet.toLocaleString()}</p>
                  </div>

                  <div>
                    <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Disbursement Amount</label>
                    <div className="relative">
                      <span className="absolute left-4.5 top-1/2 -translate-y-1/2 text-charistar-green font-black text-sm">₦</span>
                      <input 
                        type="number" 
                        max={selectedRider.wallet}
                        required 
                        value={payoutAmount} 
                        onChange={e => setPayoutAmount(e.target.value)} 
                        placeholder="e.g. 5000" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-5 py-4 text-white font-black focus:border-charistar-green focus:bg-black/30 outline-none transition-all text-sm" 
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setSelectedRider(null)} className="flex-1 py-4 bg-white/5 text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-white/10 transition-colors">
                      Cancel
                    </button>
                    <button type="submit" className="flex-1 py-4 bg-charistar-green text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-[#b3e600] transition-colors shadow-sm font-black">
                      Confirm Disburse
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
