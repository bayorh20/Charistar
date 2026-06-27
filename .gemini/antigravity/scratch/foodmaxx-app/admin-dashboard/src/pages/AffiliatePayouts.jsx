import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { db } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { 
  DollarSign, Check, X, ShieldAlert, AlertCircle, Banknote, 
  TrendingUp, Users, Calendar, ArrowUpRight, CheckCircle2
} from 'lucide-react';
import PasscodeModal from '../components/PasscodeModal';

const AffiliatePayouts = () => {
  const { affiliates, logAction } = useApp();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'all'
  
  // Security verification
  const [passcodeOpen, setPasscodeOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { type, id, data }

  // Filter requests
  const pendingPayouts = affiliates.filter(p => p.status === 'Pending');
  const allPayouts = affiliates;

  const displayList = activeTab === 'pending' ? pendingPayouts : allPayouts;

  // Stats calculation
  const totalPending = affiliates
    .filter(p => p.status === 'Pending')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalPaid = affiliates
    .filter(p => p.status === 'Approved')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const uniqueAffiliatesCount = new Set(affiliates.map(p => p.userId)).size;

  // ── High-Risk Security Actions ─────────────────────────────────────────────
  const triggerPayoutAction = (type, id, data = null) => {
    setPendingAction({ type, id, data });
    setPasscodeOpen(true);
  };

  const handleVerifiedAction = async () => {
    if (!pendingAction) return;
    const { type, id } = pendingAction;
    const payoutRef = doc(db, 'affiliates', id);
    const payoutObj = affiliates.find(p => p.id === id);
    const userName = payoutObj?.name || payoutObj?.email || 'Affiliate';

    try {
      if (type === 'approve_payout') {
        await updateDoc(payoutRef, { 
          status: 'Approved',
          approvedAt: new Date().toISOString()
        });
        logAction(`Approved affiliate payout of ₦${(payoutObj?.amount || 0).toLocaleString()} to ${userName}`);
      } else if (type === 'reject_payout') {
        await updateDoc(payoutRef, { 
          status: 'Rejected',
          rejectedAt: new Date().toISOString()
        });
        logAction(`Rejected affiliate payout of ₦${(payoutObj?.amount || 0).toLocaleString()} to ${userName}`);
      }
    } catch (err) {
      alert("Failed to update payout status: " + err.message);
    }

    setPendingAction(null);
  };

  return (
    <div className="space-y-6">
      
      {/* ── KPI Widgets ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Pending Payouts */}
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute -right-3 -bottom-3 w-16 h-16 bg-orange-500/5 rounded-full flex items-center justify-center text-orange-500">
            <Banknote size={36} />
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Pending Queue</span>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">
            ₦{totalPending.toLocaleString()}
          </h3>
          <p className="text-[10.5px] text-slate-400 font-bold mt-1.5 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            {pendingPayouts.length} payout requests waiting
          </p>
        </div>

        {/* Total Paid Out */}
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute -right-3 -bottom-3 w-16 h-16 bg-green-500/5 rounded-full flex items-center justify-center text-green-500">
            <CheckCircle2 size={36} />
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Settled</span>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">
            ₦{totalPaid.toLocaleString()}
          </h3>
          <p className="text-[10.5px] text-slate-400 font-bold mt-1.5">Successfully sent to bank accounts</p>
        </div>

        {/* Total Affiliates */}
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute -right-3 -bottom-3 w-16 h-16 bg-blue-500/5 rounded-full flex items-center justify-center text-blue-500">
            <Users size={36} />
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Affiliate Marketers</span>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">
            {uniqueAffiliatesCount}
          </h3>
          <p className="text-[10.5px] text-slate-400 font-bold mt-1.5">Registered partners sharing referrals</p>
        </div>

      </div>

      {/* ── Tabs selector ──────────────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button 
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'pending' 
              ? 'border-orange-500 text-orange-600 dark:text-orange-400' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <span>Pending Approvals ({pendingPayouts.length})</span>
        </button>
        <button 
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'all' 
              ? 'border-orange-500 text-orange-600 dark:text-orange-400' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <span>All Requests History ({allPayouts.length})</span>
        </button>
      </div>

      {/* ── Table Queue ────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50 dark:border-slate-700 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-900/10">
                <th className="px-6 py-4">Marketer Details</th>
                <th className="px-6 py-4">Payout Amount</th>
                <th className="px-6 py-4">Bank Destination Details</th>
                <th className="px-6 py-4">Request Time</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {displayList.map(payout => {
                const status = payout.status || 'Pending';
                return (
                  <tr key={payout.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition-colors">
                    
                    {/* Marketer profile */}
                    <td className="px-6 py-4">
                      <div className="text-xs">
                        <p className="font-extrabold text-slate-800 dark:text-white">{payout.name || 'Anonymous Partner'}</p>
                        <p className="text-[10px] font-semibold text-slate-450 mt-0.5">{payout.email || 'No email'}</p>
                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">UID: {payout.userId}</p>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4">
                      <span className="font-black text-slate-800 dark:text-white text-sm">
                        ₦{(payout.amount || 0).toLocaleString()}
                      </span>
                    </td>

                    {/* Bank Details */}
                    <td className="px-6 py-4">
                      <div className="text-xs">
                        <p className="font-bold text-slate-700 dark:text-white">{payout.bankName || 'Unknown Bank'}</p>
                        <p className="text-[11px] font-extrabold text-slate-800 dark:text-slate-300 mt-0.5">{payout.accountNumber || '••••••••••'}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{payout.accountName || 'No Name Provided'}</p>
                      </div>
                    </td>

                    {/* Request Time */}
                    <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-400" />
                        <span>
                          {payout.requestedAt 
                            ? new Date(payout.requestedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) 
                            : 'Unknown Date'}
                        </span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                        status === 'Pending'
                          ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20'
                          : status === 'Approved'
                          ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-500/20'
                          : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20'
                      }`}>
                        {status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      {status === 'Pending' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => triggerPayoutAction('approve_payout', payout.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
                          >
                            <Check size={12} />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => triggerPayoutAction('reject_payout', payout.id)}
                            className="flex items-center gap-1 px-3 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 dark:border-slate-700 dark:hover:bg-red-500/10 rounded-xl font-bold text-xs transition-all"
                          >
                            <X size={12} />
                            <span>Decline</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Settled</span>
                      )}
                    </td>

                  </tr>
                );
              })}
              {displayList.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm font-bold text-slate-400">
                    No requests found in this queue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SECURITY PASSCODE MODAL ─────────────────────────────────────────── */}
      <PasscodeModal 
        isOpen={passcodeOpen}
        onClose={() => {
          setPasscodeOpen(false);
          setPendingAction(null);
        }}
        onVerified={handleVerifiedAction}
        actionName={pendingAction ? pendingAction.type.replace('_', ' ') : 'Affiliate Settlement'}
      />

    </div>
  );
};

export default AffiliatePayouts;
