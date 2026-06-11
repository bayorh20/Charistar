import React, { useState } from 'react';
import { User, Wallet, Loader2, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function AdminUsers({ users, setUsers }) {
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [fundAmount, setFundAmount] = useState('');

  const handleFundWallet = async (e) => {
    e.preventDefault();
    if (!selectedUser || !fundAmount) return;
    
    setLoading(true);
    try {
      const amount = parseFloat(fundAmount);
      const newBalance = (selectedUser.walletBalance || 0) + amount;
      
      await updateDoc(doc(db, 'users', selectedUser.id), {
        walletBalance: newBalance
      });
      
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, walletBalance: newBalance } : u));
      setSelectedUser(null);
      setFundAmount('');
      alert("Wallet funded successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to fund wallet");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center mb-2 bg-[#050505]/40 p-6 rounded-[1.5rem] border border-white/5">
        <h2 className="text-white font-black text-xl">Users ({users.length})</h2>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => (
          <div key={user.id} className="glass-panel p-7 rounded-[1.5rem] border border-white/10 bg-[#0c0c0c]/85 hover:bg-[#121212]/95 hover:border-charistar-green/20 transition-all duration-300 shadow-[0_10px_35px_rgba(0,0,0,0.5)] flex items-center justify-between group">
            <div className="flex items-center gap-4.5">
              <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-charistar-green font-black text-lg group-hover:scale-105 transition-transform flex-shrink-0">
                {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || <User size={22} />}
              </div>
              <div className="min-w-0">
                <h4 className="text-white font-black text-sm truncate max-w-[140px] tracking-tight">{user.displayName || user.email?.split('@')[0]}</h4>
                <p className="text-gray-500 text-[10px] font-bold truncate max-w-[140px] mt-1.5">{user.email}</p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3 flex-shrink-0">
              <div className="flex items-center gap-2 bg-charistar-green/10 text-charistar-green px-4 py-2 rounded-full border border-charistar-green/20 shadow-sm">
                <Wallet size={13} className="animate-pulse" />
                <span className="text-xs font-black">₦{(user.walletBalance || 0).toFixed(2)}</span>
              </div>
              <button 
                onClick={() => setSelectedUser(user)}
                className="text-[10px] font-black uppercase tracking-widest text-sky-400 hover:text-sky-300 transition-colors mr-1"
              >
                Fund Wallet
              </button>
            </div>
          </div>
        ))}

        {users.length === 0 && (
          <div className="col-span-full py-16 text-center text-gray-500 italic font-medium">
            No users found.
          </div>
        )}
      </div>

      {/* Fund Wallet Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => !loading && setSelectedUser(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm glass-panel bg-[#090909] rounded-[1.8rem] border border-white/10 p-8.5 shadow-2xl"
            >
              <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Fund Wallet</h2>
              <p className="text-gray-400 text-xs font-medium mb-8">Add funds to <span className="text-white font-bold">{selectedUser.email}</span></p>
              
              <form onSubmit={handleFundWallet} className="space-y-6">
                <div>
                  <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2.5 ml-1">Amount to Add</label>
                  <div className="relative">
                    <DollarSign size={18} className="absolute left-4.5 top-1/2 -translate-y-1/2 text-charistar-green" />
                    <input 
                      type="number" 
                      step="0.01"
                      required 
                      value={fundAmount} 
                      onChange={e=>setFundAmount(e.target.value)} 
                      placeholder="50.00" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-5 py-4 text-white font-black focus:border-charistar-green focus:bg-black/30 outline-none transition-all" 
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button type="button" onClick={() => setSelectedUser(null)} className="flex-1 py-4.5 bg-white/5 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-white/10 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} className="flex-1 py-4.5 bg-charistar-green text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-[#b3e600] transition-colors shadow-sm disabled:opacity-50 font-black">
                    {loading ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Add Funds'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
