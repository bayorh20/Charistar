import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { db } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, Power, ShieldAlert, ShieldCheck, DollarSign, Clock, 
  PhoneCall, Eye, Play, Sliders, AlertCircle, Save, Plus, Trash2,
  Edit, MessageSquare, Gift, Award, Star, Zap, Sparkles, UserCheck, Check,
  RefreshCw, Cpu
} from 'lucide-react';
import PasscodeModal from '../components/PasscodeModal';

const GlobalSettings = () => {
  const { storeConfig, logAction } = useApp();

  // Settings State variables
  const [isOpen, setIsOpen] = useState(true);
  const [baseDeliveryFee, setBaseDeliveryFee] = useState(1500);
  const [cookingBufferMinutes, setCookingBufferMinutes] = useState(20);
  const [supportContact, setSupportContact] = useState('+234 812 345 6789');

  // Support Chat Bot States
  const [supportWelcomeMsg, setSupportWelcomeMsg] = useState('Hello! Welcome to FoodMaxx Live Support. How can we help you with your order today? 🍲');
  const [supportFallbackMsg, setSupportFallbackMsg] = useState('Thank you for contacting FoodMaxx. A customer support representative has been notified and will attend to you shortly. 📞');

  // Loyalty Rewards States
  const [nextTierPoints, setNextTierPoints] = useState(2000);
  const [spendPointsPerThousand, setSpendPointsPerThousand] = useState(10);
  const [referPoints, setReferPoints] = useState(500);
  const [reviewPoints, setReviewPoints] = useState(50);
  const [rewardsList, setRewardsList] = useState([
    { id: 'free_delivery', title: 'Free Delivery', points: 500, icon: '🛵', color: '#3B82F6' },
    { id: 'ten_percent_off', title: '10% Off Order', points: 1000, icon: '🎟️', color: '#10B981' },
    { id: 'free_amala', title: 'Free VIP Amala', points: 2500, icon: '🍲', color: '#F59E0B' },
    { id: 'cashback_5k', title: '₦5000 Cashback', points: 5000, icon: '💸', color: '#8B5CF6' }
  ]);

  // Role-Based Permissions Matrix
  const [permissionsMatrix, setPermissionsMatrix] = useState({
    manager: { manage_menu: true, adjust_wallet: true, adjust_points: true, manage_orders: true, edit_settings: false, view_audit_logs: true },
    kitchen: { manage_menu: false, adjust_wallet: false, adjust_points: false, manage_orders: true, edit_settings: false, view_audit_logs: false },
    cashier: { manage_menu: false, adjust_wallet: true, adjust_points: true, manage_orders: true, edit_settings: false, view_audit_logs: false }
  });

  // Form State for Adding/Editing Reward
  const [activeRewardForm, setActiveRewardForm] = useState(null); // 'new' or index
  const [rewardForm, setRewardForm] = useState({
    title: '',
    points: 500,
    icon: '🎁',
    color: '#ea580c'
  });
  
  // Animation config
  const [animationConfig, setAnimationConfig] = useState({
    mode: 'Slide',
    duration: 0.35,
    adminChartSpeed: 1.0,
    adminHoverBounce: true,
    adminBadgePulse: true
  });

  // PIN settings state
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');

  // Passcode states for saving config
  const [passcodeOpen, setPasscodeOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { type }

  // Sync details from Firestore config
  useEffect(() => {
    if (storeConfig) {
      setIsOpen(storeConfig.isOpen !== false);
      setBaseDeliveryFee(storeConfig.baseDeliveryFee || 1500);
      setCookingBufferMinutes(storeConfig.cookingBufferMinutes || 20);
      setSupportContact(storeConfig.supportContact || '+234 812 345 6789');
      if (storeConfig.animationConfig) {
        setAnimationConfig(storeConfig.animationConfig);
      }
      setSupportWelcomeMsg(storeConfig.supportWelcomeMsg || 'Hello! Welcome to FoodMaxx Live Support. How can we help you with your order today? 🍲');
      setSupportFallbackMsg(storeConfig.supportFallbackMsg || 'Thank you for contacting FoodMaxx. A customer support representative has been notified and will attend to you shortly. 📞');
      if (storeConfig.permissionsMatrix) {
        setPermissionsMatrix(storeConfig.permissionsMatrix);
      }
      
      const rCfg = storeConfig.rewardsConfig;
      if (rCfg) {
        setNextTierPoints(rCfg.nextTierPoints || 2000);
        setSpendPointsPerThousand(rCfg.spendPointsPerThousand || 10);
        setReferPoints(rCfg.referPoints || 500);
        setReviewPoints(rCfg.reviewPoints || 50);
        setRewardsList(rCfg.rewardsList || []);
      }
    }
  }, [storeConfig]);

  // Transition Preview trigger state
  const [previewToggle, setPreviewToggle] = useState(true);
  const [previewKey, setPreviewKey] = useState(0);

  const triggerPreview = () => {
    setPreviewKey(prev => prev + 1);
  };

  const getPreviewVariants = () => {
    switch (animationConfig.mode) {
      case 'Fade':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 }
        };
      case 'Zoom':
        return {
          initial: { opacity: 0, scale: 0.8 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.8 }
        };
      case 'Slide':
      default:
        return {
          initial: { opacity: 0, x: -50 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: 50 }
        };
    }
  };

  // Reward handlers
  const handleOpenNewReward = () => {
    setActiveRewardForm('new');
    setRewardForm({
      title: '',
      points: 500,
      icon: '🎁',
      color: '#ea580c'
    });
  };

  const handleSaveRewardForm = () => {
    if (!rewardForm.title) {
      alert("Please enter a reward title");
      return;
    }

    if (activeRewardForm === 'new') {
      const newId = 'reward-' + Date.now();
      setRewardsList(prev => [...prev, { ...rewardForm, id: newId }]);
    } else {
      setRewardsList(prev => {
        const next = [...prev];
        next[activeRewardForm] = { ...next[activeRewardForm], ...rewardForm };
        return next;
      });
    }
    setActiveRewardForm(null);
  };

  const handleDeleteReward = (index) => {
    setRewardsList(prev => prev.filter((_, idx) => idx !== index));
  };

  const openEditReward = (index) => {
    setActiveRewardForm(index);
    setRewardForm(rewardsList[index]);
  };

  // Permission Toggle
  const togglePermission = (role, key) => {
    setPermissionsMatrix(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [key]: !prev[role][key]
      }
    }));
  };

  // Save Operations & Passcode verification
  const triggerSaveSettings = () => {
    setPendingAction({ type: 'save_settings' });
    setPasscodeOpen(true);
  };

  const handleVerifiedAction = async () => {
    if (!pendingAction) return;

    try {
      if (pendingAction.type === 'save_settings') {
        await setDoc(doc(db, 'settings', 'store_config'), {
          isOpen,
          baseDeliveryFee: Number(baseDeliveryFee),
          cookingBufferMinutes: Number(cookingBufferMinutes),
          supportContact,
          animationConfig,
          supportWelcomeMsg,
          supportFallbackMsg,
          permissionsMatrix,
          rewardsConfig: {
            nextTierPoints: Number(nextTierPoints),
            spendPointsPerThousand: Number(spendPointsPerThousand),
            referPoints: Number(referPoints),
            reviewPoints: Number(reviewPoints),
            rewardsList
          }
        }, { merge: true });

        logAction("Updated store operations, bot messages, permissions matrix & rewards config");
        alert("Settings saved successfully!");
      } else if (pendingAction.type === 'purge_customer_cache') {
        const nextVersion = (storeConfig?.cacheVersion || 0) + 1;
        await setDoc(doc(db, 'settings', 'store_config'), {
          cacheVersion: nextVersion
        }, { merge: true });

        logAction(`Triggered Force Global Customer Cache Purge (v${nextVersion})`);
        alert(`Global Customer Cache Purge triggered successfully! (v${nextVersion})`);
      }
    } catch (err) {
      alert("Action failed: " + err.message);
    }

    setPendingAction(null);
  };

  // PIN update handler
  const handleUpdatePin = async (e) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');

    const correctPin = storeConfig?.securityPin || '1234';
    if (currentPinInput !== correctPin) {
      setPinError('Incorrect current security PIN.');
      return;
    }

    if (newPinInput.length < 4 || newPinInput.length > 6) {
      setPinError('New PIN must be between 4 and 6 digits.');
      return;
    }

    if (newPinInput !== confirmPinInput) {
      setPinError('Confirm PIN does not match new PIN.');
      return;
    }

    try {
      await setDoc(doc(db, 'settings', 'store_config'), {
        securityPin: newPinInput
      }, { merge: true });

      logAction("Admin updated Master Security PIN code");
      setPinSuccess('PIN updated successfully!');
      setCurrentPinInput('');
      setNewPinInput('');
      setConfirmPinInput('');
    } catch (err) {
      setPinError("Failed to update PIN: " + err.message);
    }
  };

  const permissionsList = [
    { key: 'manage_menu', label: 'Modify Menu Items & Categories' },
    { key: 'adjust_wallet', label: 'Credit/Debit Customer Wallets' },
    { key: 'adjust_points', label: 'Adjust Customer Loyalty Points' },
    { key: 'manage_orders', label: 'Process & Dispatch Orders' },
    { key: 'edit_settings', label: 'Edit Store Operations Settings' },
    { key: 'view_audit_logs', label: 'Inspect Admin Security Audits' }
  ];

  return (
    <div className="space-y-6">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Operations & chatbot panel (Column 1) */}
        <div className="space-y-6">
          
          {/* Operational Status & Store Controls */}
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-850 dark:text-white flex items-center gap-2">
              <Power size={18} className="text-orange-500" />
              <span>Store Operations Status</span>
            </h3>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="font-extrabold text-xs text-slate-800 dark:text-white uppercase tracking-wider">Restaurant Outlet Status</h4>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">Toggle this off to pause customer orders instantly</p>
              </div>
              
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`px-4 py-2 rounded-xl font-black text-xs uppercase transition-all ${
                  isOpen 
                    ? 'bg-green-600 text-white shadow-md shadow-green-500/10' 
                    : 'bg-red-600 text-white shadow-md shadow-red-500/10'
                }`}
              >
                {isOpen ? 'Open For Orders' : 'Store Closed'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1 flex items-center gap-0.5">
                  <DollarSign size={10} /> Base Delivery Fee (₦)
                </label>
                <input 
                  type="number" 
                  value={baseDeliveryFee}
                  onChange={(e) => setBaseDeliveryFee(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1 flex items-center gap-0.5">
                  <Clock size={10} /> Cooking Buffer (Min)
                </label>
                <input 
                  type="number" 
                  value={cookingBufferMinutes}
                  onChange={(e) => setCookingBufferMinutes(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1 flex items-center gap-0.5">
                  <PhoneCall size={10} /> Support Call Number
                </label>
                <input 
                  type="text" 
                  value={supportContact}
                  onChange={(e) => setSupportContact(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* System Maintenance & Performance Operations */}
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
              <Cpu size={18} className="text-orange-500" />
              <span>System Maintenance & Performance</span>
            </h3>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-extrabold text-xs text-slate-850 dark:text-white uppercase tracking-wider">Local Admin Cache</h4>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">Clears service workers, storage data and reloads the admin dashboard</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Clear local admin application cache and reload? ⚙️')) {
                    if ('serviceWorker' in navigator) {
                      navigator.serviceWorker.getRegistrations().then((regs) => {
                        for (let r of regs) r.unregister();
                      });
                    }
                    if ('caches' in window) {
                      caches.keys().then((keys) => {
                        for (let k of keys) caches.delete(k);
                      });
                    }
                    const preservedKeys = ['firebase:auth', 'admin_logged_in'];
                    const preserved = {};
                    preservedKeys.forEach(k => {
                      for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && key.includes(k)) {
                          preserved[key] = localStorage.getItem(key);
                        }
                      }
                    });
                    localStorage.clear();
                    sessionStorage.clear();
                    Object.entries(preserved).forEach(([k, v]) => {
                      localStorage.setItem(k, v);
                    });
                    alert('Admin Cache Cleared! Reloading...');
                    window.location.reload();
                  }
                }}
                className="w-full md:w-auto px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-350 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 rounded-xl font-black text-xs uppercase transition-all flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={12} />
                <span>Clear Admin Cache</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-extrabold text-xs text-slate-850 dark:text-white uppercase tracking-wider">Remote Customer App Cache Purge</h4>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">Force-invalidates and reloads all active customer PWA app instances globally (v{storeConfig?.cacheVersion || 0})</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPendingAction({ type: 'purge_customer_cache' });
                  setPasscodeOpen(true);
                }}
                className="w-full md:w-auto px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-xs uppercase shadow-md shadow-orange-500/10 transition-all flex items-center justify-center gap-1.5"
              >
                <Zap size={12} />
                <span>Force Global Purge</span>
              </button>
            </div>
          </div>

          {/* Support Chat Bot Settings */}
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
              <MessageSquare size={18} className="text-orange-500" />
              <span>Support Chat Bot Configurations</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Bot Welcome Message</label>
                <textarea 
                  rows={2}
                  value={supportWelcomeMsg}
                  onChange={(e) => setSupportWelcomeMsg(e.target.value)}
                  placeholder="Hello! Welcome to Live Support..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Bot Auto-Response Fallback</label>
                <textarea 
                  rows={3}
                  value={supportFallbackMsg}
                  onChange={(e) => setSupportFallbackMsg(e.target.value)}
                  placeholder="Thank you for contacting us. A representative will attend to you shortly..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Loyalty program & animations panel (Column 2) */}
        <div className="space-y-6">
          
          {/* Loyalty Program Settings */}
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-slate-700/60">
              <h3 className="font-extrabold text-sm text-slate-850 dark:text-white flex items-center gap-2">
                <Gift size={18} className="text-orange-500" />
                <span>Loyalty Rewards Program</span>
              </h3>
              <button 
                onClick={handleOpenNewReward}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl font-black text-xs transition-colors"
              >
                <Plus size={14} /> Add Reward
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1 flex items-center gap-0.5">
                  <Award size={10} /> Platinum Tier Target (pts)
                </label>
                <input 
                  type="number" 
                  value={nextTierPoints}
                  onChange={(e) => setNextTierPoints(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1 flex items-center gap-0.5">
                  <Zap size={10} /> Points per ₦1000 Spent
                </label>
                <input 
                  type="number" 
                  value={spendPointsPerThousand}
                  onChange={(e) => setSpendPointsPerThousand(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1 flex items-center gap-0.5">
                  <Star size={10} /> Refer-a-Friend Points
                </label>
                <input 
                  type="number" 
                  value={referPoints}
                  onChange={(e) => setReferPoints(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1 flex items-center gap-0.5">
                  <Sparkles size={10} /> Review Leave Points
                </label>
                <input 
                  type="number" 
                  value={reviewPoints}
                  onChange={(e) => setReviewPoints(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>
            </div>

            {/* Reward Form Overlay (Inline) */}
            {activeRewardForm !== null && (
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-4">
                <h4 className="text-xs font-black text-slate-700 dark:text-slate-400 uppercase">
                  {activeRewardForm === 'new' ? 'Configure New Reward Card' : 'Edit Reward Card'}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Reward Title</label>
                    <input 
                      type="text" 
                      value={rewardForm.title}
                      onChange={(e) => setRewardForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. Free Ice Cream"
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Points Cost</label>
                    <input 
                      type="number" 
                      value={rewardForm.points}
                      onChange={(e) => setRewardForm(prev => ({ ...prev, points: Number(e.target.value) }))}
                      placeholder="e.g. 1200"
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Emoji / Icon</label>
                    <input 
                      type="text" 
                      value={rewardForm.icon}
                      onChange={(e) => setRewardForm(prev => ({ ...prev, icon: e.target.value }))}
                      placeholder="e.g. 🍦"
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Brand Theme Color</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={rewardForm.color}
                        onChange={(e) => setRewardForm(prev => ({ ...prev, color: e.target.value }))}
                        className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-700 bg-transparent"
                      />
                      <span className="text-xs font-mono font-bold uppercase">{rewardForm.color}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button 
                    type="button"
                    onClick={() => setActiveRewardForm(null)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-650 rounded-xl font-bold text-xs"
                  >
                    Discard
                  </button>
                  <button 
                    type="button"
                    onClick={handleSaveRewardForm}
                    className="px-4 py-2 bg-orange-500 text-white rounded-xl font-bold text-xs"
                  >
                    Apply Reward
                  </button>
                </div>
              </div>
            )}

            {/* Reward list mapping */}
            <div className="space-y-3">
              {rewardsList.map((reward, idx) => (
                <div 
                  key={reward.id || idx}
                  className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-900"
                >
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg border border-slate-200/50" 
                    style={{ backgroundColor: `${reward.color}15` }}
                  >
                    {reward.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-xs text-slate-800 dark:text-white truncate">{reward.title}</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5" style={{ color: reward.color }}>
                      {reward.points.toLocaleString()} Points
                    </p>
                  </div>

                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => openEditReward(idx)}
                      className="p-1.5 hover:bg-orange-50 text-slate-450 hover:text-orange-500 rounded-lg"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteReward(idx)}
                      className="p-1.5 hover:bg-red-50 text-slate-450 hover:text-red-500 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {rewardsList.length === 0 && (
                <div className="text-center py-6 text-slate-455 text-xs font-bold">No active loyalty rewards cards configured.</div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Role-Based Permissions Matrix */}
      <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="font-extrabold text-sm text-slate-850 dark:text-white flex items-center gap-2">
          <UserCheck size={18} className="text-orange-500" />
          <span>Role-Based Staff Permissions Matrix</span>
        </h3>
        <p className="text-xs text-slate-400 font-semibold leading-relaxed">
          Configure what operations sub-administrative accounts can execute on the dashboard. Changes take effect instantly for all logged-in staff.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-semibold">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-900/10">
                <th className="px-4 py-3">Permission Description</th>
                <th className="px-4 py-3 text-center">Owner / Owner</th>
                <th className="px-4 py-3 text-center">Manager</th>
                <th className="px-4 py-3 text-center">Kitchen Staff</th>
                <th className="px-4 py-3 text-center">Cashier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/60">
              {permissionsList.map(perm => (
                <tr key={perm.key} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/10">
                  <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300 font-bold">{perm.label}</td>
                  
                  {/* Owner (Always enabled) */}
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex justify-center">
                      <div className="w-5 h-5 bg-green-500 text-white rounded-md flex items-center justify-center">
                        <Check size={12} />
                      </div>
                    </div>
                  </td>

                  {/* Manager */}
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex justify-center">
                      <input 
                        type="checkbox"
                        checked={!!permissionsMatrix.manager?.[perm.key]}
                        onChange={() => togglePermission('manager', perm.key)}
                        className="w-5 h-5 rounded text-orange-500 border-slate-200 focus:ring-0 cursor-pointer"
                      />
                    </div>
                  </td>

                  {/* Kitchen Staff */}
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex justify-center">
                      <input 
                        type="checkbox"
                        checked={!!permissionsMatrix.kitchen?.[perm.key]}
                        onChange={() => togglePermission('kitchen', perm.key)}
                        className="w-5 h-5 rounded text-orange-500 border-slate-200 focus:ring-0 cursor-pointer"
                      />
                    </div>
                  </td>

                  {/* Cashier */}
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex justify-center">
                      <input 
                        type="checkbox"
                        checked={!!permissionsMatrix.cashier?.[perm.key]}
                        onChange={() => togglePermission('cashier', perm.key)}
                        className="w-5 h-5 rounded text-orange-500 border-slate-200 focus:ring-0 cursor-pointer"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global PIN updating & save buttons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PIN Security credentials modification */}
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-sm">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2 mb-4">
            <ShieldCheck size={18} className="text-orange-500" />
            <span>Master PIN Security settings</span>
          </h3>

          <form onSubmit={handleUpdatePin} className="space-y-4">
            {pinError && (
              <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl border border-red-100 dark:border-red-500/20 flex items-center gap-1.5">
                <AlertCircle size={14} />
                <span>{pinError}</span>
              </div>
            )}
            {pinSuccess && (
              <div className="p-3 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-semibold rounded-xl border border-green-100 dark:border-green-500/20 flex items-center gap-1.5">
                <Check size={14} />
                <span>{pinSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Current PIN</label>
                <input 
                  type="password" 
                  maxLength={6}
                  value={currentPinInput}
                  onChange={(e) => setCurrentPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-center tracking-widest text-slate-800 dark:text-white focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">New PIN</label>
                <input 
                  type="password" 
                  maxLength={6}
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-center tracking-widest text-slate-800 dark:text-white focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Confirm PIN</label>
                <input 
                  type="password" 
                  maxLength={6}
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-center tracking-widest text-slate-800 dark:text-white focus:outline-none"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              className="px-4 py-2 bg-slate-850 hover:bg-slate-900 text-white rounded-xl font-bold text-xs uppercase transition-all shadow-sm"
            >
              Update Security PIN
            </button>
          </form>
        </div>

        {/* Global Save Card */}
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-850 dark:text-white flex items-center gap-2 mb-2">
              <ShieldAlert size={18} className="text-orange-500" />
              <span>Apply Operational Updates</span>
            </h3>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              Confirm changes to all global configurations (pricing, bot messages, reward schedules, and permission tables). A master passcode verification challenge will be triggered.
            </p>
          </div>

          <button 
            onClick={triggerSaveSettings}
            className="w-full mt-6 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md shadow-orange-500/10 flex items-center justify-center gap-2 transition-all"
          >
            <Save size={16} />
            <span>Save Settings & Matrix</span>
          </button>
        </div>

      </div>

      {/* SECURITY PASSCODE MODAL */}
      <PasscodeModal 
        isOpen={passcodeOpen}
        onClose={() => {
          setPasscodeOpen(false);
          setPendingAction(null);
        }}
        onVerified={handleVerifiedAction}
        actionName="Update Global Configs"
      />

    </div>
  );
};

export default GlobalSettings;
