import React, { useState } from 'react';
import { DollarSign, ShieldCheck, Download, Calendar, Search, ArrowUpRight, TrendingUp, CreditCard, Banknote, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminFinance() {
  const [ledgers, setLedgers] = useState([
    { ref: 'PSTK-982401', user: 'funmi@covenant.edu', type: 'Card Payment', amount: 3500.00, gateway: 'Paystack', status: 'success', time: '10:05 AM' },
    { ref: 'PSTK-982390', user: 'kunle@gmail.com', type: 'Bank Transfer', amount: 5200.00, gateway: 'Paystack', status: 'success', time: '09:42 AM' },
    { ref: 'PSTK-982382', user: 'obi_chinedu@unilag.edu', type: 'Wallet Debit', amount: 1800.00, gateway: 'Internal', status: 'success', time: '08:15 AM' },
    { ref: 'PSTK-982371', user: 'tunde_ade@yahoo.com', type: 'Card Payment', amount: 4500.00, gateway: 'Paystack', status: 'failed', time: '07:30 AM' }
  ]);

  const [dateRange, setDateRange] = useState('Today');
  const [search, setSearch] = useState('');

  const filteredLedger = ledgers.filter(l => 
    l.ref.toLowerCase().includes(search.toLowerCase()) || 
    l.user.toLowerCase().includes(search.toLowerCase())
  );

  const downloadCSV = () => {
    const headers = "Transaction Ref,User Account,Channel,Amount,Gateway,Status,Timestamp\n";
    const rows = ledgers.map(l => {
      return `"${l.ref}","${l.user}","${l.type}","${l.amount}","${l.gateway}","${l.status}","${l.time}"`;
    }).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Charistar_Paystack_Ledger.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* KPI stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="glass-panel p-6 rounded-[1.5rem] border border-white/10 bg-[#0c0c0c]/85 shadow-lg relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-charistar-green/20 blur-3xl opacity-20"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-charistar-green">
              <DollarSign size={18} />
            </div>
            <span className="text-[10px] text-charistar-green font-bold flex items-center gap-1"><TrendingUp size={11} /> +12.4%</span>
          </div>
          <h3 className="text-gray-500 font-extrabold text-[10px] mb-1 uppercase tracking-widest leading-none">Net Transactions</h3>
          <p className="text-white font-black text-xl tracking-tight mt-1">₦345,800.00</p>
        </div>

        <div className="glass-panel p-6 rounded-[1.5rem] border border-white/10 bg-[#0c0c0c]/85 shadow-lg relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-sky-400/20 blur-3xl opacity-20"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-sky-400">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="text-gray-500 font-extrabold text-[10px] mb-1 uppercase tracking-widest leading-none">Paystack Gateway</div>
          <div className="text-white font-black text-xl tracking-tight mt-1">₦242,500.00</div>
        </div>

        <div className="glass-panel p-6 rounded-[1.5rem] border border-white/10 bg-[#0c0c0c]/85 shadow-lg relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-amber-400/20 blur-3xl opacity-20"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-amber-400">
              <Banknote size={18} />
            </div>
          </div>
          <div className="text-gray-500 font-extrabold text-[10px] mb-1 uppercase tracking-widest leading-none">Tax Estimator</div>
          <div className="text-white font-black text-xl tracking-tight mt-1">₦17,290.00</div>
        </div>

        <div className="glass-panel p-6 rounded-[1.5rem] border border-white/10 bg-[#0c0c0c]/85 shadow-lg relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-pink-400/20 blur-3xl opacity-20"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-pink-400">
              <Sparkles size={18} />
            </div>
          </div>
          <div className="text-gray-500 font-extrabold text-[10px] mb-1 uppercase tracking-widest leading-none">Cashback Disbursed</div>
          <div className="text-white font-black text-xl tracking-tight mt-1">₦14,000.00</div>
        </div>

      </div>

      {/* Paystack ledger list */}
      <div className="glass-panel p-7.5 rounded-[1.8rem] border border-white/10 bg-[#0c0c0c]/85 shadow-[0_15px_40px_rgba(0,0,0,0.4)]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-6">
          <div>
            <h3 className="text-white font-black text-base tracking-tight flex items-center gap-2">
              <ShieldCheck className="text-charistar-green" size={18} />
              Paystack Audit Ledger
            </h3>
            <p className="text-xs text-gray-500 font-semibold mt-1">Real-time payment callback endpoints and digital transaction trails.</p>
          </div>
          
          <button 
            onClick={downloadCSV}
            className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:border-white/20 transition-all active:scale-95 flex-shrink-0"
          >
            <Download size={12} /> Export Ledger CSV
          </button>
        </div>

        {/* Filter / Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            <input 
              type="text" 
              placeholder="Search reference keys, email addresses..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#050505]/60 border border-white/5 rounded-xl pl-11 pr-4 py-3.5 text-xs text-white font-semibold focus:border-charistar-green outline-none transition-colors"
            />
          </div>
        </div>

        {/* Ledger table */}
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="pb-4 text-[10px] text-gray-500 font-black uppercase tracking-widest">Transaction Ref</th>
                <th className="pb-4 text-[10px] text-gray-500 font-black uppercase tracking-widest">User Account</th>
                <th className="pb-4 text-[10px] text-gray-500 font-black uppercase tracking-widest">Payment Channel</th>
                <th className="pb-4 text-[10px] text-gray-500 font-black uppercase tracking-widest">Gateway</th>
                <th className="pb-4 text-[10px] text-gray-500 font-black uppercase tracking-widest">Amount</th>
                <th className="pb-4 text-[10px] text-gray-500 font-black uppercase tracking-widest">Time</th>
                <th className="pb-4 text-right text-[10px] text-gray-500 font-black uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLedger.map(l => (
                <tr key={l.ref} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 text-xs font-black text-white flex items-center gap-1.5">
                    {l.ref}
                    <ArrowUpRight size={11} className="text-gray-500" />
                  </td>
                  <td className="py-4 text-xs font-semibold text-gray-400">{l.user}</td>
                  <td className="py-4 text-xs font-semibold text-gray-400">{l.type}</td>
                  <td className="py-4 text-xs font-extrabold text-white uppercase tracking-wider">{l.gateway}</td>
                  <td className="py-4 text-xs font-black text-charistar-green">₦{l.amount.toLocaleString()}</td>
                  <td className="py-4 text-xs font-semibold text-gray-500">{l.time}</td>
                  <td className="py-4 text-right">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      l.status === 'success'
                        ? 'bg-charistar-green/10 border-charistar-green/20 text-charistar-green'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredLedger.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-gray-500 italic text-xs">No records matching transaction filter</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
