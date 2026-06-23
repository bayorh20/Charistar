import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, LogOut, Package, Clock, X, User, Phone, MapPin, 
  Lock, Bell, Moon, Mail, Shield, AlertCircle, ChevronRight, 
  HelpCircle, MessageSquare, Heart, Edit3, Plus, Trash2, 
  TrendingUp, TrendingDown, CreditCard, PlusCircle, CheckCircle, 
  Sparkles, ShieldCheck, Settings, Calendar
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, setDoc, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { payWithPaystack } from '../utils/paystack';


export default function Profile() {
  const { currentUser, logout, authenticate } = useAuth();
  const navigate = useNavigate();

  // Loading States
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);

  // Edit Profile States
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  // Top Up States
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpLoading, setTopUpLoading] = useState(false);

  // Addresses Modal States
  const [isAddressesOpen, setIsAddressesOpen] = useState(false);
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [newAddressName, setNewAddressName] = useState('');
  const [newAddressText, setNewAddressText] = useState('');
  const [newAddressNote, setNewAddressNote] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);

  // FAQ Modal States
  const [isFaqOpen, setIsFaqOpen] = useState(false);

  // Theme states (ambient glow toggler & theme switcher)
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('charistar_theme') || 'dark'; } catch { return 'dark'; }
  });
  const [prefGlowTheme, setPrefGlowTheme] = useState(() => {
    try { return localStorage.getItem('charistar_glow') !== 'off'; } catch { return true; }
  });

  // Handle setting/changing the app core theme keys
  const THEMES = {
    dark: 'Dark Mode',
    light: 'Light Theme',
    green: 'Forest Green'
  };

  useEffect(() => {
    try { localStorage.setItem('charistar_theme', theme); } catch {}
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-light', 'theme-green');
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  // Persist glow pref + apply body class
  useEffect(() => {
    try { localStorage.setItem('charistar_glow', prefGlowTheme ? 'on' : 'off'); } catch {}
    if (prefGlowTheme) {
      document.body.classList.add('ambient-glow-on');
    } else {
      document.body.classList.remove('ambient-glow-on');
    }
  }, [prefGlowTheme]);

  const handleCycleTheme = () => {
    const themeKeys = Object.keys(THEMES);
    const currentIndex = themeKeys.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeKeys.length;
    setTheme(themeKeys[nextIndex]);
  };

  // Date formatting utility helper
  const formatDate = (dateVal) => {
    if (!dateVal) return 'Recently';
    if (dateVal instanceof Date) return dateVal.toLocaleDateString();
    if (typeof dateVal === 'string') return new Date(dateVal).toLocaleDateString();
    if (dateVal.seconds) return new Date(dateVal.seconds * 1000).toLocaleDateString();
    return 'Recently';
  };

  // Auth flow states for logged-out view
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  // Custom Toast State
  const [toast, setToast] = useState({ show: false, msg: '', type: 'error' });

  const triggerToast = (msg, type = 'error') => {
    setToast({ show: true, msg, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3200);
  };

  // Data streams and Firestore triggers
  useEffect(() => {
    if (!currentUser) return;

    setEditName(currentUser.displayName || '');
    setEditPhone(currentUser.phone || '');

    // Fetch Orders once on load
    async function fetchOrders() {
      try {
        const q = query(
          collection(db, 'orders'), 
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error fetching orders:", err);
      }
      setLoading(false);
    }
    fetchOrders();

    // Subscribe to transactions real-time
    const qTrans = query(
      collection(db, 'users', currentUser.uid, 'transactions'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribeTrans = onSnapshot(qTrans, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingTransactions(false);
    }, (err) => {
      console.error("Failed to fetch transactions:", err);
      setLoadingTransactions(false);
    });

    return () => {
      unsubscribeTrans();
    };
  }, [currentUser]);

  // Handle body overflow locking on popup/modal overlay open
  useEffect(() => {
    if (isEditProfileOpen || isAddressesOpen || isFaqOpen || isTopUpOpen || isAddAddressOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isEditProfileOpen, isAddressesOpen, isFaqOpen, isTopUpOpen, isAddAddressOpen]);

  // Event handlers
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setAuthLoading(true);
    try {
      await authenticate(phone, password, name || "Yogurt Lover", !isLogin);
      setSuccessMsg('Authentication successful! ✨');
      setJustLoggedIn(true);
      setTimeout(() => {
        setSuccessMsg('');
        setAuthLoading(false);
        setJustLoggedIn(false);
      }, 1200);
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
      setAuthLoading(false);
    }
  };

  const handleTopUpSubmit = async (e) => {
    e.preventDefault();
    const amountVal = Math.floor(parseFloat(topUpAmount));
    if (isNaN(amountVal) || amountVal <= 0) {
      triggerToast("Please enter a valid top-up amount.", "error");
      return;
    }
    
    setTopUpLoading(true);
    const reference = 'topup_' + Date.now();
    const nameToUse = currentUser?.displayName || 'customer';
    const userEmail = `${nameToUse.trim().replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'customer'}@charistaryogurt.com`;
    
    // payWithPaystack is synchronous — do NOT await it.
    // The onSuccess / onCancel callbacks handle result asynchronously.
    payWithPaystack({
      email: userEmail,
      amount: amountVal,
      reference: reference,
      onSuccess: async (response) => {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const currentBalance = Number(currentUser.walletBalance || 0);
          const newBalance = isNaN(currentBalance) ? amountVal : currentBalance + amountVal;
          await setDoc(userRef, { walletBalance: newBalance }, { merge: true });
          
          await addDoc(collection(db, 'users', currentUser.uid, 'transactions'), {
            type: 'credit',
            amount: amountVal,
            description: `Top-Up via Paystack Card`,
            createdAt: serverTimestamp()
          });
          
          setIsTopUpOpen(false);
          setTopUpAmount('');
          setTopUpLoading(false);
          triggerToast(`Wallet topped up with ₦${amountVal.toLocaleString()}! 🔋`, "success");
        } catch (writeErr) {
          console.error("Failed to credit wallet balance after payment:", writeErr);
          triggerToast("Payment successful, but failed to credit wallet. Contact support.", "error");
          setTopUpLoading(false);
        }
      },
      onCancel: () => {
        triggerToast("Top-up cancelled.", "error");
        setTopUpLoading(false);
      }
    });
  };


  const handleEditProfileSubmit = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      triggerToast("Display Name cannot be empty.", "error");
      return;
    }
    setEditLoading(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, {
        displayName: editName,
        phone: editPhone
      }, { merge: true });
      setIsEditProfileOpen(false);
      triggerToast("Profile updated successfully! ✨", "success");
    } catch (err) {
      console.error("Failed to update profile:", err);
      triggerToast("Could not update profile. Try again.", "error");
    } finally {
      setEditLoading(false);
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!newAddressText.trim()) return;
    setSavingAddress(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const existingAddresses = currentUser.savedAddresses || [];
      const updated = [...existingAddresses, {
        placeName: newAddressName.trim() || 'My Spot',
        address: newAddressText.trim(),
        deliveryNote: newAddressNote.trim(),
      }];
      await setDoc(userRef, { savedAddresses: updated }, { merge: true });
      setNewAddressName('');
      setNewAddressText('');
      setNewAddressNote('');
      setIsAddAddressOpen(false);
    } catch (err) {
      console.error('Failed to save location:', err);
      triggerToast("Could not save address. Try again.", "error");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (index) => {
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const existingAddresses = currentUser.savedAddresses || [];
      const updated = existingAddresses.filter((_, idx) => idx !== index);
      await setDoc(userRef, {
        savedAddresses: updated
      }, { merge: true });
    } catch (err) {
      console.error("Failed to delete saved location:", err);
    }
  };

  // Render Logged out layout state
  if (!currentUser || justLoggedIn) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 15 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen bg-charistar-dark px-6 pt-12 pb-24 flex flex-col justify-start font-sans overflow-x-hidden relative"
      >
        {/* Animated Background Orbs */}
        <div className="absolute top-1/4 -right-10 w-96 h-96 bg-charistar-green/10 rounded-full blur-[80px] pointer-events-none -z-10 animate-spin-slow"></div>
        <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none -z-10 animate-reverse-spin"></div>

        <div className="flex items-center justify-between flex-shrink-0 mb-6">
          <Link to="/" className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all z-10 text-white">
            <ArrowLeft size={20} />
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full z-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-charistar-green to-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-[0_10px_30px_rgba(163,198,68,0.3)] transform rotate-3">
              <User size={32} className="text-charistar-dark" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-1 drop-shadow-md">Charistar ID</h1>
            <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest">Unlock premium perks & instant refunds</p>
          </div>

          <div className="bg-charistar-gray border border-white/10 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden">
            {error && (
              <div className="bg-red-500/10 text-red-400 p-3 rounded-2xl text-[11px] font-bold border border-red-500/20 text-center mb-5 flex items-center justify-center gap-2">
                <AlertCircle size={14} /> {error}
              </div>
            )}
            {successMsg && (
              <div className="bg-charistar-green/10 text-charistar-green p-3 rounded-2xl text-xs font-black border border-charistar-green/30 text-center mb-5 animate-scaleUp">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
              {!isLogin && (
                <div className="charistar-input-group">
                  <User size={18} />
                  <input 
                    type="text" 
                    required 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                  />
                </div>
              )}
              
              <div className="charistar-input-group">
                <Phone size={18} />
                <input 
                  type="tel" 
                  required 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 11))}
                  placeholder="Phone Number"
                />
              </div>

              <div className="charistar-input-group">
                <Lock size={18} />
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                />
              </div>

              <button 
                disabled={authLoading}
                type="submit" 
                className="w-full bg-gradient-to-r from-charistar-green to-emerald-500 text-charistar-dark font-black text-[13px] uppercase tracking-wider h-14 rounded-2xl mt-4 shadow-[0_10px_25px_rgba(163,198,68,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-70"
              >
                {authLoading ? 'Verifying...' : (isLogin ? 'Sign In Securely' : 'Create Account')}
              </button>
            </form>

            <div className="mt-6 text-center border-t border-white/5 pt-5">
              <button 
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-[11px] text-gray-500 font-bold uppercase tracking-wider hover:text-white transition-colors"
              >
                {isLogin ? "No account? " : "Already registered? "}
                <span className="text-charistar-green font-black ml-1">{isLogin ? 'Join now' : 'Log in'}</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Render Logged in layout view
  return (
    <div className="min-h-screen bg-charistar-dark font-sans relative overflow-x-hidden pb-32">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-24 left-6 right-6 z-[10000] pointer-events-none flex justify-center"
          >
            <div className={`px-5 py-4 rounded-2xl border backdrop-blur-[30px] flex items-center gap-3 shadow-xl max-w-sm w-full pointer-events-auto ${
              toast.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              {toast.type === 'success' ? <CheckCircle size={18} className="flex-shrink-0" /> : <AlertCircle size={18} className="flex-shrink-0" />}
              <span className="text-[11px] font-black uppercase tracking-wider leading-snug">{toast.msg}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Dynamic Gradient Cover Photo */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-br from-charistar-green/20 via-charistar-dark to-indigo-500/10 -z-10">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-3xl" style={{ maskImage: 'linear-gradient(to bottom, black, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)' }}></div>
      </div>
      
      {/* Glow Effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-charistar-green/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute top-1/3 left-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -z-10"></div>

      {/* Main Profile Header with Floating Avatar */}
      <div className="px-6 pt-12 pb-2 relative flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-4">
          <Link to="/" className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all z-10 relative">
            <ArrowLeft size={16} />
          </Link>
          <button 
            onClick={handleLogout}
            className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all z-10 relative"
          >
            <LogOut size={16} />
          </button>
        </div>
        
        {/* Centered Floating Avatar */}
        <div className="relative z-10 mb-4 mt-2">
          <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-b from-charistar-green to-transparent shadow-[0_10px_30px_rgba(163,198,68,0.2)]">
            <img 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || 'User')}&background=A3C644&color=000&size=150&font-size=0.33&rounded=true&bold=true`}
              alt="Avatar"
              className="w-full h-full rounded-full border-[3px] border-charistar-dark object-cover"
            />
          </div>
          <button 
            onClick={() => setIsEditProfileOpen(true)}
            className="absolute bottom-0 right-0 w-8 h-8 bg-charistar-dark border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors shadow-lg"
          >
            <Edit3 size={12} />
          </button>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{currentUser.displayName || 'Yogurt Lover'}</h2>
          <p className="text-xs text-gray-400 font-semibold uppercase mt-1 tracking-widest">{currentUser.phone}</p>
        </div>
      </div>

      <div className="px-6 mt-6 space-y-6">
        
        {/* Bento Grid: Wallet & Actions */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 glass-panel rounded-[2rem] border border-charistar-green/20 p-5 relative overflow-hidden bg-gradient-to-br from-[#A3C644]/10 to-transparent">
            <div className="absolute top-0 right-0 w-32 h-32 bg-charistar-green/10 blur-2xl rounded-full pointer-events-none"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-1.5 mb-1">
                  <CreditCard size={12} className="text-charistar-green" /> Wallet Balance
                </p>
                <h3 className="text-3xl font-black text-white tracking-tight mt-1 drop-shadow-sm">
                  <span className="text-charistar-green/70 pr-1">₦</span>{(currentUser.walletBalance || 0).toLocaleString()}
                </h3>
              </div>
              <button 
                onClick={() => setIsTopUpOpen(true)}
                className="h-12 px-5 rounded-2xl bg-charistar-green text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_5px_15px_rgba(163,198,68,0.25)] hover:scale-105 active:scale-95 transition-all"
              >
                <Plus size={16} strokeWidth={3} /> Top Up
              </button>
            </div>
          </div>
        </div>

        {/* Grouped Floating Cards */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-2 mb-2">Account Settings</h3>
          <div className="space-y-2">
            <button 
              onClick={() => setIsAddressesOpen(true)}
              className="w-full glass-panel border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-all group active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white group-hover:text-charistar-green transition-colors">
                  <MapPin size={18} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-white uppercase tracking-wide">Delivery Addresses</p>
                  <p className="text-[10px] text-gray-500 font-medium">{(currentUser.savedAddresses || []).length} saved locations</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-600 group-hover:text-white transition-colors" />
            </button>
          </div>

          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-2 mb-2 mt-6">App Preferences</h3>
          <div className="space-y-2">
            <button 
              onClick={handleCycleTheme}
              className="w-full glass-panel border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-all group active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white group-hover:text-charistar-green transition-colors">
                  <Moon size={18} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-white uppercase tracking-wide">App Theme</p>
                  <p className="text-[10px] text-gray-500 font-medium">{THEMES[theme] || 'Custom theme'}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-600 group-hover:text-white transition-colors" />
            </button>

            <div className="w-full glass-panel border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white">
                  <Sparkles size={18} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-white uppercase tracking-wide">Ambient Glow</p>
                  <p className="text-[10px] text-gray-500 font-medium">Vibrant backgrounds</p>
                </div>
              </div>
              <button 
                onClick={() => setPrefGlowTheme(!prefGlowTheme)}
                className={`w-12 h-6 rounded-full transition-colors flex items-center px-0.5 relative ${prefGlowTheme ? 'bg-charistar-green' : 'bg-white/10'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-black transition-transform transform absolute ${prefGlowTheme ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-2 mb-2 mt-6">Support</h3>
          <div className="space-y-2">
            <button 
              onClick={() => setIsFaqOpen(true)}
              className="w-full glass-panel border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-all group active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white group-hover:text-charistar-green transition-colors">
                  <HelpCircle size={18} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-white uppercase tracking-wide">Help & FAQ</p>
                  <p className="text-[10px] text-gray-500 font-medium">Refund policy & delivery</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-600 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>

        {/* Transaction History stream */}
        <div className="mt-8 space-y-3">
          <div className="flex items-center justify-between pl-2 pr-1 mb-1">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Wallet Ledger</h3>
            <Clock size={12} className="text-gray-600" />
          </div>
          <div className="glass-panel rounded-3xl border border-white/5 p-1 shadow-md">
            {loadingTransactions ? (
              <p className="text-[10px] text-gray-500 font-semibold text-center py-8">Syncing ledger details...</p>
            ) : transactions.length === 0 ? (
              <p className="text-[10px] text-gray-500 font-semibold text-center py-8">No ledger actions recorded yet.</p>
            ) : (
              <div className="flex flex-col gap-1">
                {transactions.map(item => (
                  <div key={item.id} className="p-3 rounded-2xl hover:bg-white/5 transition-colors flex items-center justify-between">
                    <div className="min-w-0 pr-3 flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${item.type === 'credit' ? 'bg-charistar-green/10 text-charistar-green' : 'bg-red-500/10 text-red-400'}`}>
                        {item.type === 'credit' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="text-xs font-bold text-white uppercase tracking-wide truncate">{item.description || 'Ledger action'}</p>
                        <p className="text-[10px] text-gray-500 font-medium mt-0.5">{formatDate(item.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-[13px] font-black flex-shrink-0 tracking-tight ${item.type === 'credit' ? 'text-charistar-green' : 'text-white'}`}>
                        {item.type === 'credit' ? '+' : '-'}₦{parseFloat(item.amount).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* MODALS & BOTTOM SHEETS */}
      <AnimatePresence>
        
        {/* Edit Profile — centered overlay */}
        {isEditProfileOpen && (
          <div className="fixed inset-0 z-[9999] flex items-start pt-[12vh] justify-center px-4 bg-black/70 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setIsEditProfileOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="relative z-10 w-full max-w-[400px] bg-charistar-dark rounded-[2rem] border border-white/10 p-6 flex flex-col gap-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Update Account Details</h3>
                <button onClick={() => setIsEditProfileOpen(false)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white"><X size={15} /></button>
              </div>
              <form onSubmit={handleEditProfileSubmit} className="flex flex-col gap-4 mt-2">
                <div className="charistar-input-group">
                  <User size={18} />
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Display name"
                  />
                </div>
                <div className="charistar-input-group">
                  <Phone size={18} />
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 11))}
                    placeholder="Phone"
                  />
                </div>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="w-full h-12 rounded-xl bg-charistar-green text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center shadow-sm disabled:opacity-50 mt-2"
                >
                  {editLoading ? 'Saving...' : 'Save Settings'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Top Up — centered overlay */}
        {isTopUpOpen && (
          <div className="fixed inset-0 z-[9999] flex items-start pt-[12vh] justify-center px-4 bg-black/70 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setIsTopUpOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="relative z-10 w-full max-w-[400px] bg-charistar-dark rounded-[2rem] border border-white/10 p-6 flex flex-col gap-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Add Cash to Wallet</h3>
                <button onClick={() => setIsTopUpOpen(false)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white"><X size={15} /></button>
              </div>
              <form onSubmit={handleTopUpSubmit} className="flex flex-col gap-4 mt-2">
                <div className="glass-panel rounded-2xl p-1 flex items-center border border-white/5">
                  <div className="w-11 h-11 flex items-center justify-center flex-shrink-0 text-gray-500 font-extrabold">₦</div>
                  <input
                    type="number"
                    required
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    className="bg-transparent border-none outline-none text-white font-bold text-xs w-full pr-4 focus:ring-0"
                    placeholder="Enter amount (e.g. 5000)"
                  />
                </div>
                <button
                  type="submit"
                  disabled={topUpLoading}
                  className="w-full h-12 rounded-xl bg-charistar-green text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center shadow-sm disabled:opacity-50 mt-2"
                >
                  {topUpLoading ? 'Processing...' : 'Pay with Paystack'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Saved Locations — centered overlay */}
        {isAddressesOpen && (
          <div className="fixed inset-0 z-[9999] flex items-start pt-[12vh] justify-center px-4 bg-black/70 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setIsAddressesOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="relative z-10 w-full max-w-[400px] bg-charistar-dark rounded-[2rem] border border-white/10 p-6 flex flex-col gap-4 shadow-2xl max-h-[80vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Your Verified Spots</h3>
                <button onClick={() => setIsAddressesOpen(false)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white"><X size={15} /></button>
              </div>
              <div className="space-y-3.5 my-2">
                {(currentUser.savedAddresses || []).length === 0 ? (
                  <p className="text-[10px] text-gray-500 font-semibold text-center py-6">No locations saved yet. Map a spot below!</p>
                ) : (
                  (currentUser.savedAddresses || []).map((addr, idx) => (
                    <div key={idx} className="glass-panel p-3.5 rounded-2xl flex items-center justify-between border border-white/5 relative">
                      <div className="min-w-0 pr-8 text-left">
                        <h4 className="text-xs font-black text-white uppercase tracking-wide truncate">{addr.placeName}</h4>
                        <p className="text-[10px] text-gray-500 font-medium leading-relaxed truncate mt-0.5">{addr.address}</p>
                        {addr.deliveryNote && <p className="text-[9px] text-charistar-green font-bold truncate mt-1">📝 {addr.deliveryNote}</p>}
                      </div>
                      <button 
                        onClick={() => handleDeleteAddress(idx)}
                        className="w-8 h-8 rounded-xl hover:bg-white/5 flex items-center justify-center text-gray-500 hover:text-red-400 absolute top-2 right-2 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
              <button 
                onClick={() => { setIsAddressesOpen(false); setIsAddAddressOpen(true); }}
                className="w-full h-12 rounded-xl bg-charistar-green text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm mt-2"
              >
                <Plus size={14} /> Add New Address
              </button>
            </motion.div>
          </div>
        )}

        {/* FAQ — centered overlay */}
        {isFaqOpen && (
          <div className="fixed inset-0 z-[9999] flex items-start pt-[12vh] justify-center px-4 bg-black/70 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setIsFaqOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="relative z-10 w-full max-w-[400px] bg-charistar-dark rounded-[2rem] border border-white/10 p-6 flex flex-col gap-4 shadow-2xl max-h-[80vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Help & Guidelines</h3>
                <button onClick={() => setIsFaqOpen(false)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white"><X size={15} /></button>
              </div>
              <div className="space-y-4 my-2 text-left">
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wide">1. Delivery Zones</h4>
                  <p className="text-[10px] text-gray-400 font-semibold leading-relaxed mt-0.5">We deliver live parfaits within Lagos city hubs. Rates depend on exact Map Coordinates calculated by our delivery engine.</p>
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wide">2. What is Active Balance?</h4>
                  <p className="text-[10px] text-gray-400 font-semibold leading-relaxed mt-0.5">Your active wallet cash. It unlocks instant refund capabilities for canceled deliveries and bypasses card processing on checkout.</p>
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wide">3. Cooler Insulated Bags</h4>
                  <p className="text-[10px] text-gray-400 font-semibold leading-relaxed mt-0.5">All parfait items are shipped inside sub-zero cooling packs. Your order is guaranteed to remain chilled during route dispatch.</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

      </AnimatePresence>

        {/* Add Address — centered overlay */}
        {isAddAddressOpen && (
          <div className="fixed inset-0 z-[9999] flex items-start pt-[12vh] justify-center px-4 bg-black/70 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setIsAddAddressOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="relative z-10 w-full max-w-[400px] bg-charistar-dark rounded-[2rem] border border-white/10 p-6 flex flex-col gap-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Add Delivery Spot</h3>
                  <p className="text-[10px] text-gray-500 font-medium mt-0.5">Type your address below</p>
                </div>
                <button onClick={() => setIsAddAddressOpen(false)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white"><X size={15} /></button>
              </div>

              <form onSubmit={handleSaveAddress} className="flex flex-col gap-3">
                {/* Label / nickname */}
                <div className="charistar-input-group">
                  <MapPin size={18} />
                  <input
                    type="text"
                    value={newAddressName}
                    onChange={(e) => setNewAddressName(e.target.value)}
                    placeholder="Label (e.g. Home, Office)"
                  />
                </div>

                {/* Full address */}
                <div className="charistar-input-group items-start">
                  <MapPin size={18} className="mt-1" />
                  <textarea
                    required
                    rows={3}
                    value={newAddressText}
                    onChange={(e) => setNewAddressText(e.target.value)}
                    placeholder="Full address (e.g. 12 Allen Avenue, Ikeja, Lagos)"
                  />
                </div>

                {/* Delivery note */}
                <div className="charistar-input-group items-start">
                  <Edit3 size={18} className="mt-1" />
                  <textarea
                    rows={2}
                    value={newAddressNote}
                    onChange={(e) => setNewAddressNote(e.target.value)}
                    placeholder="Delivery note (e.g. Call when arriving, red gate)"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingAddress || !newAddressText.trim()}
                  className="w-full h-12 rounded-xl bg-charistar-green text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 mt-1"
                >
                  {savingAddress ? 'Saving...' : <><CheckCircle size={14} /> Save Delivery Spot</>}
                </button>
              </form>
            </motion.div>
          </div>
        )}

    </div>
  );
}