import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { db } from '../firebase/config';
import { collection, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { 
  Plus, Edit, Trash2, Ticket, Percent, DollarSign, Calendar, 
  Check, X, AlertCircle, ShoppingBag, ShieldCheck 
} from 'lucide-react';
import PasscodeModal from '../components/PasscodeModal';

const CouponBuilder = () => {
  const { coupons, logAction } = useApp();
  
  // Selection / Modal States
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Security verification
  const [passcodeOpen, setPasscodeOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { type, id, data }

  // Form State
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'percentage', // 'percentage' or 'flat'
    value: 0,
    minOrder: 0,
    maxDiscount: 0,
    startDate: '',
    expiryDate: '',
    active: true
  });

  // High-Risk Security Actions
  const triggerCouponAction = (type, id, data = null) => {
    setPendingAction({ type, id, data });
    setPasscodeOpen(true);
  };

  const handleVerifiedAction = async () => {
    if (!pendingAction) return;
    const { type, id } = pendingAction;
    
    try {
      if (type === 'delete_coupon') {
        const coupon = coupons.find(c => c.id === id);
        await deleteDoc(doc(db, 'coupons', id));
        logAction(`Deleted promotional coupon code: ${coupon?.code || id}`);
      }
    } catch (err) {
      alert("Failed to delete coupon: " + err.message);
    }

    setPendingAction(null);
  };

  // Save Coupon
  const saveCoupon = async (e) => {
    e.preventDefault();
    if (!couponForm.code || couponForm.value <= 0) return;

    const couponId = editingCoupon?.id || couponForm.code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const docData = {
      code: couponForm.code.toUpperCase().replace(/[^A-Z0-9]/g, ''),
      discountType: couponForm.discountType,
      value: Number(couponForm.value),
      minOrder: Number(couponForm.minOrder) || 0,
      maxDiscount: Number(couponForm.maxDiscount) || 0,
      startDate: couponForm.startDate || null,
      expiryDate: couponForm.expiryDate || null,
      active: !!couponForm.active,
      createdAt: editingCoupon?.createdAt || new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'coupons', couponId), docData, { merge: true });
      logAction(`${editingCoupon ? 'Updated' : 'Created'} coupon code: ${docData.code}`);
      setIsFormOpen(false);
      setEditingCoupon(null);
    } catch (err) {
      alert("Error saving coupon: " + err.message);
    }
  };

  const openEditCoupon = (coupon) => {
    setEditingCoupon(coupon);
    setCouponForm({
      code: coupon.code,
      discountType: coupon.discountType || 'percentage',
      value: coupon.value || 0,
      minOrder: coupon.minOrder || 0,
      maxDiscount: coupon.maxDiscount || 0,
      startDate: coupon.startDate || '',
      expiryDate: coupon.expiryDate || '',
      active: !!coupon.active
    });
    setIsFormOpen(true);
  };

  const toggleCouponStatus = async (coupon) => {
    try {
      const couponRef = doc(db, 'coupons', coupon.id);
      const nextStatus = !coupon.active;
      await updateDoc(couponRef, { active: nextStatus });
      logAction(`${nextStatus ? 'Activated' : 'Deactivated'} coupon: ${coupon.code}`);
    } catch (err) {
      alert("Failed to toggle coupon status: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header bar */}
      <div className="flex justify-between items-center bg-white/70 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl backdrop-blur-md shadow-sm">
        <h3 className="font-extrabold text-slate-850 dark:text-white text-sm flex items-center gap-2">
          <Ticket size={18} className="text-orange-500" />
          <span>Active Promo Campaigns</span>
        </h3>
        
        <button
          onClick={() => {
            setEditingCoupon(null);
            setCouponForm({
              code: '', discountType: 'percentage', value: '', minOrder: '', maxDiscount: '', startDate: '', expiryDate: '', active: true
            });
            setIsFormOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm shadow-sm transition-all"
        >
          <Plus size={16} />
          <span>Build Coupon</span>
        </button>
      </div>

      {/* Coupons Stamp Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons.map(coupon => {
          const isNotStarted = coupon.startDate && new Date(coupon.startDate) > new Date();
          const isExpired = coupon.expiryDate && new Date(coupon.expiryDate) < new Date();
          const isActive = coupon.active && !isExpired && !isNotStarted;

          return (
            <div 
              key={coupon.id}
              className={`bg-white dark:bg-slate-800 border rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between ${
                isActive 
                  ? 'border-orange-100 dark:border-orange-500/10' 
                  : 'border-slate-200 dark:border-slate-700 opacity-70'
              }`}
            >
              
              {/* Stamp cutouts styling */}
              <div className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 rounded-full"></div>
              <div className="absolute right-[-8px] top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 rounded-full"></div>

              <div>
                {/* Coupon Header */}
                <div className="flex justify-between items-start border-b border-dashed border-slate-100 dark:border-slate-700/65 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl">
                      {coupon.discountType === 'percentage' ? <Percent size={16} /> : <DollarSign size={16} />}
                    </span>
                    <div>
                      <h4 className="text-sm font-black tracking-wide text-slate-850 dark:text-white uppercase">
                        {coupon.code}
                      </h4>
                      <span className="text-[9px] font-bold text-slate-400">Created: {new Date(coupon.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Status Toggle Button */}
                  <button 
                    onClick={() => toggleCouponStatus(coupon)}
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                      isActive 
                        ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400' 
                        : isNotStarted
                        ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-450'
                        : isExpired
                        ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-405'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                    }`}
                  >
                    {isExpired ? 'Expired' : isNotStarted ? 'Scheduled' : coupon.active ? 'Active' : 'Paused'}
                  </button>
                </div>

                {/* Coupon Body */}
                <div className="mt-4 space-y-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Discount Value:</span>
                    <span className="text-slate-800 dark:text-white font-black">
                      {coupon.discountType === 'percentage' ? `${coupon.value}% Off` : `₦${coupon.value.toLocaleString()} Off`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Min Purchase:</span>
                    <span className="text-slate-800 dark:text-white font-bold">₦{coupon.minOrder.toLocaleString()}</span>
                  </div>
                  {coupon.discountType === 'percentage' && coupon.maxDiscount > 0 && (
                    <div className="flex justify-between">
                      <span>Max Cap:</span>
                      <span className="text-slate-800 dark:text-white font-bold">₦{coupon.maxDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  {coupon.startDate && (
                    <div className="flex justify-between items-center text-[10.5px] pt-1.5 border-t border-slate-50 dark:border-slate-700/60 mt-2 font-bold">
                      <span className="flex items-center gap-1"><Calendar size={12} /> Starts:</span>
                      <span className="text-slate-700 dark:text-slate-350">
                        {new Date(coupon.startDate).toLocaleDateString([], { dateStyle: 'medium' })}
                      </span>
                    </div>
                  )}
                  {coupon.expiryDate && (
                    <div className="flex justify-between items-center text-[10.5px] font-bold">
                      <span className="flex items-center gap-1"><Calendar size={12} /> Ends:</span>
                      <span className={isExpired ? 'text-red-505 font-black' : 'text-slate-700 dark:text-slate-350'}>
                        {new Date(coupon.expiryDate).toLocaleDateString([], { dateStyle: 'medium' })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-dashed border-slate-100 dark:border-slate-700/60">
                <button
                  onClick={() => openEditCoupon(coupon)}
                  className="p-1.5 hover:bg-orange-50 dark:hover:bg-orange-500/10 text-slate-400 hover:text-orange-500 rounded-lg transition-colors"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => triggerCouponAction('delete_coupon', coupon.id)}
                  className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>

            </div>
          );
        })}
        {coupons.length === 0 && (
          <div className="col-span-full bg-white dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 p-12 text-center rounded-3xl">
            <span className="text-3xl">🎫</span>
            <p className="text-sm font-bold text-slate-400 mt-2">No promotional campaigns created yet.</p>
          </div>
        )}
      </div>

      {/* MODAL: COUPON FORM */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-999 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-2xl max-w-md w-full p-6 relative">
            <button 
              onClick={() => {
                setIsFormOpen(false);
                setEditingCoupon(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 transition-colors"
            >
              <X size={20} />
            </button>

            <h3 className="text-base font-black text-slate-850 dark:text-white uppercase mb-6 pl-0.5 flex items-center gap-1.5">
              <Ticket size={18} className="text-orange-500" />
              <span>{editingCoupon ? 'Edit Promo Coupon' : 'Create Promo Campaign'}</span>
            </h3>

            <form onSubmit={saveCoupon} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Promo Code Name</label>
                <input 
                  type="text" 
                  value={couponForm.code}
                  onChange={(e) => setCouponForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. MAXXWELCOME"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-700 rounded-2xl text-sm font-black tracking-widest text-slate-850 dark:text-white focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Discount Type</label>
                  <select 
                    value={couponForm.discountType}
                    onChange={(e) => setCouponForm(prev => ({ ...prev, discountType: e.target.value }))}
                    className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Cash (₦)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Discount Value</label>
                  <input 
                    type="number" 
                    value={couponForm.value}
                    onChange={(e) => setCouponForm(prev => ({ ...prev, value: e.target.value }))}
                    placeholder="e.g. 15 or 1000"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-800 dark:text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Min Purchase (₦)</label>
                  <input 
                    type="number" 
                    value={couponForm.minOrder}
                    onChange={(e) => setCouponForm(prev => ({ ...prev, minOrder: e.target.value }))}
                    placeholder="2500"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Max Cap (₦ - Optional)</label>
                  <input 
                    type="number" 
                    value={couponForm.maxDiscount}
                    onChange={(e) => setCouponForm(prev => ({ ...prev, maxDiscount: e.target.value }))}
                    placeholder="1500"
                    disabled={couponForm.discountType !== 'percentage'}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-800 dark:text-white disabled:opacity-40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Start Date</label>
                  <input 
                    type="date" 
                    value={couponForm.startDate}
                    onChange={(e) => setCouponForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">End / Expiry Date</label>
                  <input 
                    type="date" 
                    value={couponForm.expiryDate}
                    onChange={(e) => setCouponForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-550 select-none cursor-pointer pl-1">
                <input 
                  type="checkbox" 
                  checked={couponForm.active}
                  onChange={(e) => setCouponForm(prev => ({ ...prev, active: e.target.checked }))}
                  className="w-4 h-4 rounded text-orange-500 border-slate-200 focus:ring-0"
                />
                <span>Instantly Active on Placement</span>
              </label>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingCoupon(null);
                  }}
                  className="flex-1 py-3 border border-slate-205 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-black text-xs uppercase transition-all"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-xs uppercase transition-all shadow-sm"
                >
                  {editingCoupon ? 'Save Changes' : 'Build Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECURITY PASSCODE MODAL */}
      <PasscodeModal 
        isOpen={passcodeOpen}
        onClose={() => {
          setPasscodeOpen(false);
          setPendingAction(null);
        }}
        onVerified={handleVerifiedAction}
        actionName={pendingAction ? pendingAction.type.replace('_', ' ') : 'Delete Promo Coupon'}
      />

    </div>
  );
};

export default CouponBuilder;
