import React, { useState } from 'react';
import { Store, ShieldCheck, DollarSign, Package, MapPin, Search, Plus, Trash2, Edit } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminVendors() {
  const [vendors, setVendors] = useState([
    { id: 'V-201', name: 'FreshDairy Farms', category: 'Dairy & Yogurt Base', productsCount: 12, rating: 4.9, active: true, balance: 145000.00, repName: 'Kunle Oladele', phone: '08023456789' },
    { id: 'V-202', name: 'OrganoFruit Merchants', category: 'Fresh Fruit & Toppings', productsCount: 18, rating: 4.8, active: true, balance: 89000.00, repName: 'Funmi Adeleye', phone: '08134567890' },
    { id: 'V-203', name: 'Nuts & Granola Co.', category: 'Dry Ingredients & Snacks', productsCount: 6, rating: 4.6, active: true, balance: 35000.00, repName: 'Ibrahim Bala', phone: '09045678901' },
    { id: 'V-204', name: 'Campus Parfait Kitchens', category: 'Prepared Snacks', productsCount: 4, rating: 4.2, active: false, balance: 0.00, repName: 'Efe Johnson', phone: '08056789012' }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleSuccess, setSettleSuccess] = useState('');

  const handleToggleActive = (id) => {
    setVendors(prev => prev.map(v => v.id === id ? { ...v, active: !v.active } : v));
  };

  const handleSettlePayout = (e) => {
    e.preventDefault();
    if (!selectedVendor || !settleAmount) return;
    const amount = parseFloat(settleAmount);
    if (amount > selectedVendor.balance) {
      alert("Error: Settlement amount exceeds outstanding balance.");
      return;
    }

    setVendors(prev => prev.map(v => v.id === selectedVendor.id ? { ...v, balance: v.balance - amount } : v));
    setSettleSuccess(`Payout of ₦${amount.toLocaleString()} processed successfully.`);
    setTimeout(() => {
      setSelectedVendor(null);
      setSettleAmount('');
      setSettleSuccess('');
    }, 2000);
  };

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.repName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-[#050505]/40 p-6 rounded-[1.5rem] border border-white/5">
        <div>
          <h2 className="text-white font-black text-xl tracking-tight flex items-center gap-2">
            <Store className="text-charistar-green" size={24} />
            Vendor & Supplier Directory
          </h2>
          <p className="text-xs text-gray-500 font-semibold mt-1">Manage corporate suppliers, track balances, and authorize partner settlements.</p>
        </div>
        <button 
          onClick={() => alert("Simulation: Add Vendor screen launched")}
          className="flex items-center gap-2 px-6 py-3.5 bg-charistar-green text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#b3e600] active:scale-95 transition-all shadow-sm"
        >
          <Plus size={14} /> Add Vendor Partner
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="relative">
        <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
        <input 
          type="text" 
          placeholder="Search by vendor name or contact representative..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-[#0c0c0c]/80 border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-white text-xs font-semibold focus:border-charistar-green outline-none transition-colors"
        />
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredVendors.map(vendor => (
          <div key={vendor.id} className="glass-panel p-7 rounded-[1.8rem] border border-white/10 bg-[#0c0c0c]/85 hover:border-charistar-green/20 transition-all duration-300 shadow-[0_15px_40px_rgba(0,0,0,0.4)] flex flex-col justify-between gap-6 group">
            
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-charistar-green flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Store size={22} />
                </div>
                <div>
                  <h4 className="text-white font-black text-sm tracking-tight flex items-center gap-2">
                    {vendor.name}
                    {vendor.active && <ShieldCheck size={14} className="text-charistar-green" />}
                  </h4>
                  <p className="text-[10px] text-gray-500 font-bold mt-1.5 uppercase tracking-wider">{vendor.category}</p>
                </div>
              </div>

              {/* Status Switcher */}
              <button 
                onClick={() => handleToggleActive(vendor.id)}
                className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all ${
                  vendor.active 
                    ? 'bg-charistar-green/10 border-charistar-green/20 text-charistar-green' 
                    : 'bg-red-400/10 border-red-400/20 text-red-400'
                }`}
              >
                {vendor.active ? 'Active' : 'Disabled'}
              </button>
            </div>

            {/* Vendor Representative Details */}
            <div className="bg-[#050505]/40 p-4 rounded-xl border border-white/5 space-y-2">
              <p className="text-[10px] text-gray-500 font-bold flex justify-between">
                <span>Representative:</span>
                <span className="text-white">{vendor.repName}</span>
              </p>
              <p className="text-[10px] text-gray-500 font-bold flex justify-between">
                <span>Phone Contact:</span>
                <span className="text-white">{vendor.phone}</span>
              </p>
              <p className="text-[10px] text-gray-500 font-bold flex justify-between">
                <span>Products Catalog:</span>
                <span className="text-charistar-green font-black">{vendor.productsCount} Items Supplied</span>
              </p>
            </div>

            {/* Balances & Payout Action */}
            <div className="flex justify-between items-center border-t border-white/5 pt-4">
              <div>
                <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black">Settlement Balance</p>
                <p className="text-base font-black text-white mt-1">₦{vendor.balance.toLocaleString()}</p>
              </div>
              <button 
                onClick={() => setSelectedVendor(vendor)}
                disabled={vendor.balance === 0 || !vendor.active}
                className="px-5 py-2.5 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-gray-100 disabled:opacity-40 transition-all shadow-md"
              >
                Settle Payout
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* Payout modal */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={() => setSelectedVendor(null)} />
          <div className="relative w-full max-w-sm glass-panel bg-[#090909] rounded-[1.8rem] border border-white/10 p-8 shadow-2xl">
            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Vendor Settlement</h2>
            <p className="text-gray-400 text-xs font-semibold mb-6">Initiating payment to <span className="text-white font-black">{selectedVendor.name}</span></p>

            {settleSuccess ? (
              <div className="bg-charistar-green/10 border border-charistar-green/20 text-charistar-green p-4.5 rounded-2xl text-xs font-black text-center leading-relaxed">
                {settleSuccess}
              </div>
            ) : (
              <form onSubmit={handleSettlePayout} className="space-y-6">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-1.5">Outstanding Ledger Balance</p>
                  <p className="text-lg font-black text-white leading-tight">₦{selectedVendor.balance.toLocaleString()}</p>
                </div>

                <div>
                  <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Payout Amount</label>
                  <div className="relative">
                    <span className="absolute left-4.5 top-1/2 -translate-y-1/2 text-charistar-green font-black text-sm">₦</span>
                    <input 
                      type="number" 
                      max={selectedVendor.balance}
                      required 
                      value={settleAmount} 
                      onChange={e => setSettleAmount(e.target.value)} 
                      placeholder="e.g. 20000" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-5 py-4 text-white font-black focus:border-charistar-green focus:bg-black/30 outline-none transition-all text-sm" 
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setSelectedVendor(null)} className="flex-1 py-4 bg-white/5 text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-white/10 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 py-4 bg-charistar-green text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-[#b3e600] transition-colors shadow-sm font-black">
                    Disburse Settlement
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
