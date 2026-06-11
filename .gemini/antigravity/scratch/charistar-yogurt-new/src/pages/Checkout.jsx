import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, CreditCard, Wallet, Smartphone, MapPin, Phone, User, 
  CheckCircle, Ticket, ShoppingBag, Bike, AlertCircle, Sparkles, 
  ChevronRight, ArrowRight, Loader2, ClipboardList, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { payWithPaystack } from '../utils/paystack';
import { getDeliveryFee } from '../utils/deliveryMapEngine';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const ConfettiGenerator = () => {
  const particles = Array.from({ length: 60 });
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((_, i) => {
        const size = Math.random() * 8 + 4;
        const color = ['#A3C644', '#10b981', '#3b82f6', '#ec4899', '#f59e0b'][Math.floor(Math.random() * 5)];
        return (
          <motion.div
            key={i}
            initial={{ x: "50%", y: "100%", scale: 0, rotate: 0, opacity: 1 }}
            animate={{ 
              x: `${Math.random() * 100}%`, 
              y: `${Math.random() * 80}%`,
              scale: [0, 1.2, 1, 0],
              rotate: Math.random() * 360 * 3,
              opacity: [1, 1, 0.8, 0]
            }}
            transition={{ duration: Math.random() * 2.5 + 2, ease: "easeOut", delay: Math.random() * 0.8 }}
            className="absolute rounded-sm"
            style={{ width: size, height: size, backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
          />
        );
      })}
    </div>
  );
};

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { currentUser, authenticate } = useAuth();
  
  // Auth Form State (for unregistered users checkout)
  const [isLogin, setIsLogin] = useState(true);
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Form State
  const [delName, setDelName] = useState(() => localStorage.getItem('charistar_del_name') || '');
  const [delPhone, setDelPhone] = useState(() => localStorage.getItem('charistar_del_phone') || '');
  const [delAddress, setDelAddress] = useState(() => localStorage.getItem('charistar_del_address') || '');
  const [delNotes, setDelNotes] = useState(() => localStorage.getItem('charistar_del_notes') || '');
  const [scheduleType, setScheduleType] = useState('lunch');
  const [customTime, setCustomTime] = useState('');

  // Sync to local storage on change
  useEffect(() => {
    localStorage.setItem('charistar_del_name', delName);
  }, [delName]);
  useEffect(() => {
    localStorage.setItem('charistar_del_phone', delPhone);
  }, [delPhone]);
  useEffect(() => {
    localStorage.setItem('charistar_del_address', delAddress);
  }, [delAddress]);
  useEffect(() => {
    localStorage.setItem('charistar_del_notes', delNotes);
  }, [delNotes]);

  // Promo Code
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState('');
  const [discount, setDiscount] = useState(0);

  // Payment Options & Status
  const [paymentMethod, setPaymentMethod] = useState('wallet'); // premium default
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState('');
  
  // Wallet Refill Flow States
  const [showRefill, setShowRefill] = useState(false);
  const [refillAmount, setRefillAmount] = useState('');
  const [isRefilling, setIsRefilling] = useState(false);
  const [refillSuccess, setRefillSuccess] = useState(false);

  // Delivery / Geolocation Map
  const [deliveryFee, setDeliveryFee] = useState(1500);
  const [delLatitude, setDelLatitude] = useState(null);
  const [delLongitude, setDelLongitude] = useState(null);
  const [delPlaceName, setDelPlaceName] = useState('');

  // Custom Toast State (replaces blocking alert dialogs)
  const [toast, setToast] = useState({ show: false, msg: '', type: 'error' });

  const triggerToast = (msg, type = 'error') => {
    setToast({ show: true, msg, type });
    // Automatically close toast after 3 seconds
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3200);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccessMsg('');
    setAuthLoading(true);
    try {
      await authenticate(authPhone, authPassword, authName || "Yogurt Lover", !isLogin);
      setAuthSuccessMsg('Authentication successful! ✨');
      setTimeout(() => {
        setAuthSuccessMsg('');
        setAuthLoading(false);
      }, 1200);
    } catch (err) {
      setAuthError(err.message.replace('Firebase: ', ''));
      setAuthLoading(false);
    }
  };

  const subtotalAfterDiscount = Math.max(0, cartTotal - discount);
  const finalTotal = subtotalAfterDiscount + deliveryFee;

  useEffect(() => {
    if (currentUser) {
      if (!localStorage.getItem('charistar_del_name')) setDelName(currentUser.name || currentUser.displayName || '');
      if (!localStorage.getItem('charistar_del_phone')) setDelPhone(currentUser.phone || '');
      if (currentUser.latitude && currentUser.longitude) {
        setDelLatitude(currentUser.latitude);
        setDelLongitude(currentUser.longitude);
        setDelPlaceName(currentUser.nearestPoi || '');
        if (currentUser.savedAddresses?.[0] && !localStorage.getItem('charistar_del_address')) setDelAddress(currentUser.savedAddresses[0]);
        if (currentUser.deliveryNote && !localStorage.getItem('charistar_del_notes')) setDelNotes(currentUser.deliveryNote);
        setDeliveryFee(getDeliveryFee(currentUser.longitude, currentUser.latitude));
      }
    }
  }, [currentUser]);



  const handleApplyPromo = (e) => {
    e.preventDefault();
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    
    if (code === 'CHARISTAR' || code === 'FREEFEED') {
      setDiscount(1500);
      setAppliedPromo(code);
      triggerToast(code === 'CHARISTAR' ? 'Promo Applied! -₦1,500 🎉' : 'Free Delivery! 🚚', "success");
    } else if (code === 'YOGURT20') {
      const discountVal = Math.round(cartTotal * 0.20);
      setDiscount(discountVal);
      setAppliedPromo(code);
      triggerToast(`20% off! -₦${discountVal.toLocaleString()} 🍦`, "success");
    } else {
      triggerToast('Invalid promo code. ❌', 'error');
      setDiscount(0);
      setAppliedPromo('');
    }
  };

  const validateForm = () => {
    if (cartItems.length === 0) {
      triggerToast("Your cart is empty.", "error");
      return false;
    }
    if (!delName.trim()) {
      triggerToast("Please enter your full name.", "error");
      return false;
    }
    if (!delPhone.trim()) {
      triggerToast("Please enter your phone number.", "error");
      return false;
    }
    if (!delAddress.trim()) {
      triggerToast("Please enter your delivery address.", "error");
      return false;
    }
    if (scheduleType === 'custom' && !customTime.trim()) {
      triggerToast("Please enter your preferred custom time.", "error");
      return false;
    }
    return true;
  };

  const getCustomerEmail = () => {
    if (!currentUser) return 'guest@charistaryogurt.com';
    const nameToUse = delName || currentUser.name || currentUser.displayName || 'customer';
    return `${nameToUse.trim().replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'customer'}@charistaryogurt.com`;
  };

  const handlePlaceOrder = () => {
    if (!validateForm()) return;

    if (paymentMethod === 'card') {
      const reference = 'ord_' + Date.now();
      // Call synchronously to preserve browser user-gesture context (needed for popup)
      payWithPaystack({
        email: getCustomerEmail(),
        amount: finalTotal,
        reference: reference,
        onSuccess: async (response) => {
          setIsProcessing(true);
          await createOrder('card');
        },
        onCancel: () => {
          setIsProcessing(false);
          triggerToast('Payment cancelled.', 'error');
        }
      });
    } else {
      setIsProcessing(true);
      createOrder('wallet');
    }
  };

  const createOrder = async (method) => {
    if (cartItems.length === 0) {
      setIsProcessing(false);
      return;
    }
    try {
      if (method === 'wallet') {
        if (!currentUser) {
          triggerToast("You must be logged in to pay with Charistar Wallet.", "error");
          setIsProcessing(false);
          return;
        }
        const walletBalance = currentUser?.walletBalance || 0;
        if (walletBalance < finalTotal) {
          const shortage = finalTotal - walletBalance;
          setRefillAmount(shortage.toString());
          setShowRefill(true);
          triggerToast(`Refill your wallet to complete this order.`, "error");
          setIsProcessing(false);
          return;
        }
      }

      const firebaseOrderData = {
        paymentMethod: method === 'card' ? 'Debit Card' : 'Charistar Wallet',
        customerName: delName || 'Yogurt Lover',
        address: delAddress || '',
        customerPhone: delPhone || '',
        customerEmail: getCustomerEmail(),
        notes: delNotes || '',
        deliverySlot: scheduleType === 'custom' ? 'custom:' + customTime : scheduleType,
        items: cartItems.map(item => ({
          id: item.id,
          title: item.title,
          quantity: item.quantity,
          price: item.price,
          category: item.category || 'Uncategorized',
          image: item.image || item.img || ''
        })),
        customerId: currentUser?.uid || 'guest',
        userId: currentUser?.uid || 'guest',
        totalAmount: finalTotal,
        status: 'pending',
        createdAt: Date.now()
      };
      
      const orderRef = await addDoc(collection(db, 'orders'), firebaseOrderData);

      if (method === 'wallet') {
        const walletBalance = currentUser?.walletBalance || 0;
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          walletBalance: walletBalance - finalTotal
        });

        await addDoc(collection(db, 'users', currentUser.uid, 'transactions'), {
          type: 'debit',
          amount: finalTotal,
          description: `Order Payment (#${orderRef.id.slice(-6).toUpperCase()})`,
          createdAt: serverTimestamp()
        });
      }
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        const existingAddresses = currentUser.savedAddresses || [];
        const trimmedAddress = delAddress.trim();
        
        const addressExists = existingAddresses.some(a => 
          typeof a === 'object' ? a.address === trimmedAddress : a === trimmedAddress
        );
        
        let mergedAddresses = existingAddresses;
        if (!addressExists && trimmedAddress) {
          mergedAddresses = [...existingAddresses, {
            placeName: "Recent Delivery",
            address: trimmedAddress,
            deliveryNote: delNotes.trim()
          }];
        }
        
        await updateDoc(userRef, {
          name: delName,
          phone: delPhone,
          savedAddresses: mergedAddresses,
          deliveryNote: delNotes
        }).catch(err => console.error("Could not sync user profile:", err));
      }

      setCreatedOrderId(orderRef.id);
      setSuccess(true);
      setIsProcessing(false);
      clearCart();
    } catch (error) {
      console.error("Order failed:", error);
      triggerToast("Failed to place order. Please try again.", "error");
      setIsProcessing(false);
    }
  };

  const handleRefillWallet = () => {
    const amountVal = parseFloat(refillAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      triggerToast("Please enter a valid amount.", "error");
      return;
    }
    setIsRefilling(true);
    const reference = 'topup_' + Date.now();
    payWithPaystack({
      email: getCustomerEmail(),
      amount: amountVal,
      reference: reference,
      onSuccess: async (response) => {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userRef, {
            walletBalance: (currentUser.walletBalance || 0) + amountVal
          });
          await addDoc(collection(db, 'users', currentUser.uid, 'transactions'), {
            type: 'credit',
            amount: amountVal,
            description: `Refill via Checkout Paystack`,
            createdAt: serverTimestamp()
          });
          setRefillSuccess(true);
          setIsRefilling(false);
          triggerToast(`Wallet topped up successfully!`, 'success');
          // Automatically close modal after success animation
          setTimeout(() => {
            setShowRefill(false);
            setRefillSuccess(false);
            setRefillAmount('');
          }, 2000);
        } catch (err) {
          console.error("Refill credit error:", err);
          triggerToast("Payment succeeded, but failed to credit wallet.", "error");
          setIsRefilling(false);
        }
      },
      onCancel: () => {
        setIsRefilling(false);
        triggerToast("Top-up cancelled.", "error");
      }
    });
  };

  useEffect(() => {
    if (success) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [success]);

  useEffect(() => {
    if (showRefill) {
      document.body.style.overflow = 'hidden';
      window.__lenis?.stop();
    } else {
      document.body.style.overflow = '';
      window.__lenis?.start();
    }
    return () => {
      document.body.style.overflow = '';
      window.__lenis?.start();
    };
  }, [showRefill]);

  const stepsHeader = [
    { label: 'Basket' },
    { label: 'Delivery' },
    { label: 'Payment' }
  ];

  if (!currentUser) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="min-h-screen pb-32 flex flex-col bg-[#050505] font-sans items-center justify-center p-6 text-center relative overflow-hidden"
      >
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-charistar-green/10 blur-[100px] -translate-x-1/2"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-emerald-500/5 blur-[120px] translate-x-1/2"></div>

        <div className="max-w-md w-full glass-panel p-8 rounded-[2.5rem] border border-white/10 bg-[#0c0c0c]/85 shadow-[0_20px_50px_rgba(0,0,0,0.6)] z-10 text-left flex flex-col relative">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-[1.2rem] bg-charistar-green/10 border border-charistar-green/20 flex items-center justify-center text-charistar-green mb-4 shadow-inner mx-auto animate-pulse">
              <User size={26} strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-none mb-2 uppercase">
              {isLogin ? (
                <>
                  Welcome <span className="text-charistar-green">Back</span>
                </>
              ) : (
                <>
                  Join <span className="text-charistar-green">Charistar</span>
                </>
              )}
            </h1>
            <p className="text-gray-400 text-xs font-semibold">
              {isLogin ? 'Log in now to secure premium yogurt checkout' : 'Create a digital wallet in seconds'}
            </p>
          </div>

          {authError && (
            <div className="bg-red-500/10 text-red-400 p-3 rounded-2xl mb-4 text-xs font-bold border border-red-500/20 text-center animate-shake">
              {authError}
            </div>
          )}

          {authSuccessMsg && (
            <div className="bg-charistar-green/10 text-charistar-green p-3 rounded-2xl mb-4 text-xs font-black border border-charistar-green/30 text-center animate-scaleUp">
              {authSuccessMsg}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {!isLogin && (
              <div className="glass-panel rounded-2xl p-1 flex items-center border border-white/5 focus-within:border-charistar-green/50 transition-colors">
                <div className="w-11 h-11 flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-gray-500" />
                </div>
                <input 
                  type="text" 
                  required 
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  className="bg-transparent border-none outline-none text-white font-bold text-xs w-full pr-4 placeholder:text-gray-600"
                  placeholder="Full Name"
                />
              </div>
            )}
            
            <div className="glass-panel rounded-2xl p-1 flex items-center border border-white/5 focus-within:border-charistar-green/50 transition-colors">
              <div className="w-11 h-11 flex items-center justify-center flex-shrink-0">
                <Phone size={16} className="text-gray-500" />
              </div>
              <input 
                type="tel" 
                inputMode="numeric"
                maxLength={11}
                required 
                value={authPhone}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^\d]/g, '').slice(0, 11);
                  setAuthPhone(val);
                }}
                className="bg-transparent border-none outline-none text-white font-bold text-xs w-full pr-4 placeholder:text-gray-600"
                placeholder="Phone Number (11 digits)"
              />
            </div>
            
            <div className="glass-panel rounded-2xl p-1 flex items-center border border-white/5 focus-within:border-charistar-green/50 transition-colors">
              <div className="w-11 h-11 flex items-center justify-center flex-shrink-0">
                <Lock size={16} className="text-gray-500" />
              </div>
              <input 
                type="password" 
                required 
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="bg-transparent border-none outline-none text-white font-bold text-xs w-full pr-4 placeholder:text-gray-600"
                placeholder="Password"
              />
            </div>

            <button 
              disabled={authLoading}
              type="submit" 
              className="w-full bg-charistar-green text-black font-extrabold text-xs uppercase tracking-wider h-12 rounded-2xl mt-4 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-70"
            >
              {authLoading ? 'Verifying Account...' : (isLogin ? 'Sign In & Checkout' : 'Register & Checkout')}
            </button>
          </form>

          <div className="mt-5 text-center border-t border-white/5 pt-4">
            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-[11px] text-gray-500 font-bold uppercase tracking-wider hover:text-white transition-colors"
            >
              {isLogin ? "No account? " : "Already registered? "}
              <span className="text-charistar-green font-black ml-1">{isLogin ? 'Join now' : 'Log in'}</span>
            </button>
          </div>

          <button
            onClick={() => navigate('/')}
            className="w-full py-4 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all mt-3"
          >
            ← Back to Shop
          </button>
        </div>
      </motion.div>
    );
  }

  if (success) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="min-h-screen pb-32 flex flex-col items-center justify-center p-6 text-center bg-[#050505] relative overflow-hidden"
      >
        <ConfettiGenerator />
        
        <div className="relative z-10 max-w-[360px] w-full space-y-8 px-2">
          <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            {/* Animated thumbs-up container with custom success icon */}
            <div className="relative mx-auto w-24 h-24 mb-4 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute inset-0 bg-charistar-green/15 rounded-full border-2 border-charistar-green/30 shadow-[0_0_30px_rgba(163,198,68,0.25)]"
              />
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: [0, 1.3, 1], rotate: [0, 15, -10, 0] }}
                transition={{ delay: 0.2, duration: 0.8, type: "spring", stiffness: 200 }}
                className="text-4xl z-10"
              >
                👍
              </motion.div>
            </div>
            
            <h1 className="text-2xl font-black text-white tracking-tight uppercase leading-snug">
              Congratulation!<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-charistar-green to-emerald-400">Your Payment is Successful</span>
            </h1>
            <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mt-2">Order received and currently preparing</p>
          </motion.div>

          {/* 3D Ticket Receipt */}
          <div className="perspective-container" style={{ perspective: 1200 }}>
            <motion.div
              initial={{ scale: 0.8, rotateX: 25, y: 50, opacity: 0 }}
              animate={{ scale: 1, rotateX: [4, -4, 4], rotateY: [-3, 3, -3], y: [0, -6, 0], opacity: 1 }}
              transition={{ y: { duration: 5, repeat: Infinity, ease: "easeInOut" }, rotateX: { duration: 6, repeat: Infinity, ease: "easeInOut" } }}
              className="glass-panel p-6 rounded-[2.2rem] border border-white/10 relative shadow-[0_15px_40px_rgba(0,0,0,0.6)] bg-black/60 flex flex-col items-center overflow-hidden"
            >
              {/* Receipt Cut edges */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-white/10 to-transparent flex gap-1">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="w-2.5 h-1.5 bg-[#050505] rounded-b-full"></div>
                ))}
              </div>

              <span className="text-gray-500 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Order Receipt</span>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Charistar Foods Company LTD.</h3>
              
              <div className="w-full flex items-center gap-1.5 my-4">
                <div className="flex-1 border-b border-dashed border-white/10"></div>
              </div>

              <div className="w-full space-y-3.5 text-xs text-left">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold uppercase tracking-wider text-[9px]">Receipt ID</span>
                  <span className="text-white font-mono font-extrabold text-xs">#{createdOrderId?.slice(-8).toUpperCase() || '7A89DE9B'}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-gray-500 font-bold uppercase tracking-wider text-[9px]">Delivery to</span>
                  <span className="text-white font-extrabold text-right max-w-[180px] truncate">{delAddress || 'Your Address'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold uppercase tracking-wider text-[9px]">Delivery Slot</span>
                  <span className="text-white font-extrabold uppercase text-[10px] tracking-wider">
                    {scheduleType === 'custom' 
                      ? `Custom (${customTime})` 
                      : (scheduleType === 'lunch' ? 'Lunch (10:00 AM - 2:00 PM)' : 'Dinner (3:00 PM - 8:00 PM)')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold uppercase tracking-wider text-[9px]">Method</span>
                  <span className="text-charistar-green font-extrabold uppercase text-[10px] tracking-wider">{paymentMethod === 'card' ? 'Debit Card' : 'Charistar Wallet'}</span>
                </div>
                {paymentMethod === 'wallet' && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-bold uppercase tracking-wider text-[9px]">Remaining Balance</span>
                    <span className="text-emerald-400 font-extrabold text-[10px] tracking-wider">₦{(currentUser?.walletBalance || 0).toLocaleString()}</span>
                  </div>
                )}

                <div className="pt-3.5 border-t border-dashed border-white/10 flex justify-between items-center">
                  <span className="text-white font-black uppercase text-[10px] tracking-widest">Total Secured</span>
                  <span className="text-charistar-green text-xl font-black">₦{finalTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Barcode illustration */}
              <div className="mt-6 flex flex-col items-center gap-1 opacity-45">
                <div className="h-8 flex gap-[2px] items-center">
                  {[1,3,1,2,1,4,2,1,3,1,2,4,1,2,1,3,2,1,4,1,2].map((w, idx) => (
                    <div key={idx} className="bg-white h-full" style={{ width: w }}></div>
                  ))}
                </div>
                <span className="text-[7px] text-gray-500 font-mono">10238947293847293</span>
              </div>
            </motion.div>
          </div>

          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-3 pt-3">
            <button 
              onClick={() => navigate(`/track-order/${createdOrderId || 'demo'}`)} 
              className="w-full h-13 bg-charistar-green text-black font-extrabold text-[13px] uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-[0_8px_20px_rgba(163,198,68,0.25)]"
            >
              <Bike size={18} /> Track your Order
            </button>
            <button 
              onClick={() => navigate('/')} 
              className="w-full h-12 bg-white/5 text-white font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 hover:bg-white/10 active:scale-95 transition-all border border-white/5"
            >
              Order more Cravings!
            </button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="min-h-full pb-32 flex flex-col bg-[#050505] font-sans"
    >
      {/* Immersive Glass Header */}
      <div className="sticky top-0 z-30 bg-[#050505]/80 backdrop-blur-[20px] px-6 pt-12 pb-4 flex items-center justify-between border-b border-white/5 shadow-md">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 hover:bg-white/10 active:scale-95 transition-all">
            <ArrowLeft size={18} className="text-white" />
          </button>
          <h1 className="text-xl font-black text-white tracking-tight uppercase">Checkout</h1>
        </div>
        
        {/* Step progress pills removed */}
      </div>

      <div className="px-6 pt-6 space-y-6">
        {/* SINGLE PAGE CHECKOUT FLOW */}
        <div className="space-y-10">
          
          {/* SECTION 1: BASKET */}
          <div className="space-y-6">
              {/* Step Title */}
              <div>
                <h2 className="text-lg font-black text-white tracking-tight uppercase flex items-center gap-2">
                  <ClipboardList size={18} className="text-charistar-green" /> 1. Review your Cart
                </h2>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Make sure everything is perfect</p>
              </div>

              {/* Bento Card: Cart Items Horizontal Scroll */}
              <div className="glass-panel p-5 rounded-[2rem] border border-white/5 bg-black/35 shadow-sm">
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex-shrink-0 w-44 bg-[#0a0a0a] rounded-[1.8rem] p-3 border border-white/5 flex flex-col justify-between aspect-[3/4] relative group">
                      <div className="w-full aspect-square bg-white/5 rounded-2xl overflow-hidden mb-2 relative">
                        {item.image || item.img ? (
                          <img src={item.image || item.img} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag size={24} className="text-gray-500 m-auto absolute inset-0" />
                        )}
                        <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 backdrop-blur rounded-lg text-[9px] text-charistar-green font-black">{item.quantity}x</span>
                      </div>
                      <div className="px-1 min-w-0">
                        <h4 className="text-white text-xs font-black truncate mb-0.5 leading-snug">{item.title}</h4>
                        <span className="text-gray-400 text-[10px] font-black uppercase tracking-wider">{item.category}</span>
                        {item.selectedAddons && item.selectedAddons.length > 0 && (
                          <div className="flex flex-col gap-0.5 mt-1 max-h-[40px] overflow-y-auto no-scrollbar">
                            {item.selectedAddons.map((addon, index) => (
                              <span key={index} className="text-[9px] font-bold text-charistar-green truncate">
                                + {addon.name}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex justify-between items-center mt-2.5">
                          <span className="text-white font-extrabold text-xs">{item.price}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bento Card: Promo Code */}
              <div className="glass-panel p-6 rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#0c0c0c] to-[#050505] relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-charistar-green/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <h3 className="text-xs font-black uppercase text-gray-200 tracking-widest mb-4 flex items-center gap-2">
                  <Ticket size={16} className="text-charistar-green"/> 
                  Apply Promo Code
                </h3>
                <form onSubmit={handleApplyPromo} className="flex gap-3 relative">
                  <div className="flex-1 relative">
                    <input 
                      type="text" 
                      placeholder="Enter Promo Code" 
                      value={promoCode} 
                      onChange={e => setPromoCode(e.target.value)} 
                      className="w-full bg-black/50 text-white text-sm font-black px-4 py-4 rounded-xl border border-white/10 outline-none uppercase placeholder:normal-case placeholder:text-gray-500 focus:border-charistar-green/60 focus:bg-[#0a0a0a] transition-all shadow-inner" 
                    />
                    {promoCode && (
                      <div className="absolute inset-0 rounded-xl border border-charistar-green/20 pointer-events-none animate-pulse"></div>
                    )}
                  </div>
                  <button 
                    type="submit" 
                    className="bg-charistar-green text-black font-black uppercase tracking-widest text-xs px-7 rounded-xl hover:bg-white active:scale-95 transition-all shadow-[0_0_15px_rgba(163,198,68,0.2)] hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] flex items-center gap-1.5"
                  >
                    Apply <ChevronRight size={14} strokeWidth={3}/>
                  </button>
                </form>
              </div>

              {/* Bento Card: Delivery Time Slot */}
              <div className="glass-panel p-5 rounded-[2rem] border border-white/5 bg-black/35 mb-4">
                <h3 className="text-xs font-black uppercase text-gray-300 tracking-widest mb-3 flex items-center gap-1.5">⏰ Delivery Schedule</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    onClick={() => setScheduleType('lunch')}
                    className={`p-4 rounded-2xl border-2 flex flex-col justify-center items-center cursor-pointer transition-all ${
                      scheduleType === 'lunch'
                        ? 'border-charistar-green bg-charistar-green/10 shadow-[0_0_15px_rgba(163,198,68,0.1)]'
                        : 'border-white/5 bg-[#0a0a0a] hover:border-white/10'
                    }`}
                  >
                    <span className="text-xs font-black text-white uppercase tracking-wider">Lunch</span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase mt-1">10:00 AM - 2:00 PM</span>
                  </div>
                  <div 
                    onClick={() => setScheduleType('dinner')}
                    className={`p-4 rounded-2xl border-2 flex flex-col justify-center items-center cursor-pointer transition-all ${
                      scheduleType === 'dinner'
                        ? 'border-charistar-green bg-charistar-green/10 shadow-[0_0_15px_rgba(163,198,68,0.1)]'
                        : 'border-white/5 bg-[#0a0a0a] hover:border-white/10'
                    }`}
                  >
                    <span className="text-xs font-black text-white uppercase tracking-wider">Dinner</span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase mt-1">3:00 PM - 8:00 PM</span>
                  </div>
                  <div 
                    onClick={() => setScheduleType('custom')}
                    className={`col-span-2 p-4 rounded-2xl border-2 flex flex-col justify-center items-center cursor-pointer transition-all ${
                      scheduleType === 'custom'
                        ? 'border-charistar-green bg-charistar-green/10 shadow-[0_0_15px_rgba(163,198,68,0.1)]'
                        : 'border-white/5 bg-[#0a0a0a] hover:border-white/10'
                    }`}
                  >
                    <span className="text-xs font-black text-white uppercase tracking-wider">Custom Time Schedule</span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase mt-1">Request custom operational delivery time</span>
                  </div>
                </div>

                {scheduleType === 'custom' && (
                  <div className="glass-panel border border-white/5 bg-[#0a0a0a] rounded-xl px-4 py-1.5 mt-3 focus-within:border-charistar-green/40 transition-colors">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Preferred Delivery Time</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 11:30 AM - 12:30 PM, or 4:30 PM" 
                      value={customTime} 
                      onChange={e => setCustomTime(e.target.value)} 
                      className="w-full bg-transparent border-none outline-none text-white font-bold text-xs py-1" 
                    />
                  </div>
                )}
              </div>

              {/* Bento Card: Delivery Notes */}
              <div className="glass-panel p-5 rounded-[2rem] border border-white/5 bg-black/35">
                <h3 className="text-xs font-black uppercase text-gray-300 tracking-widest mb-3 flex items-center gap-1.5">🛵 Delivery Instructions</h3>
                <textarea 
                  placeholder="E.g. Ring doorbell, drop at reception, call when outside..." 
                  value={delNotes} 
                  onChange={e => setDelNotes(e.target.value)} 
                  rows="2" 
                  className="w-full bg-[#0a0a0a] text-white text-xs font-semibold px-4 py-3 rounded-xl border border-white/5 outline-none focus:border-charistar-green/45 transition-colors resize-none placeholder:text-gray-600" 
                />
              </div>
          </div>

          {/* SECTION 2: DELIVERY */}
          <div className="space-y-6">
              {/* Step Title */}
              <div>
                <h2 className="text-lg font-black text-white tracking-tight uppercase flex items-center gap-2">
                  <MapPin size={18} className="text-charistar-green" /> 2. Input your address
                </h2>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">What is your Delivery Address?</p>
              </div>

              {/* Saved Address Quick-Pick */}
              {currentUser?.savedAddresses?.length > 0 && (
                <div>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2">📍 Saved Addresses — tap to use</p>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {currentUser.savedAddresses.map((addr, idx) => {
                      const addrText = typeof addr === 'object' ? addr.address : addr;
                      const placeName = typeof addr === 'object' ? addr.placeName : 'Saved';
                      return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setDelAddress(addrText);
                          if (typeof addr === 'object' && addr.deliveryNote) setDelNotes(addr.deliveryNote);
                        }}
                        className={`flex-shrink-0 min-w-[140px] max-w-[200px] text-left px-3 py-2.5 rounded-xl border transition-all active:scale-95 flex flex-col justify-center ${
                          delAddress === addrText
                            ? 'border-charistar-green bg-charistar-green/10 text-charistar-green'
                            : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20'
                        }`}
                      >
                        <div className="font-black mb-0.5 text-[11px] truncate flex items-center gap-1">
                          <MapPin size={10} className={delAddress === addrText ? 'text-charistar-green' : 'text-gray-500'} /> {placeName}
                        </div>
                        <div className="text-[9px] line-clamp-2 leading-relaxed opacity-80">{addrText}</div>
                      </button>
                    )})}
                    <button
                      type="button"
                      onClick={() => {
                        setDelAddress('');
                        setDelNotes('');
                        document.getElementById('delAddressInput')?.focus();
                      }}
                      className="flex-shrink-0 w-[120px] text-left px-3 py-2.5 rounded-xl border border-dashed border-white/20 bg-transparent hover:border-charistar-green hover:bg-white/5 text-gray-400 transition-all active:scale-95 flex flex-col items-center justify-center gap-1.5"
                    >
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white"><span className="text-sm leading-none">+</span></div>
                      <span className="font-bold text-[9px] uppercase">New Address</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Bento Card: Location Info Form */}
              <div className="glass-panel p-5 rounded-[2rem] border border-white/5 bg-black/35 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase text-gray-300 tracking-widest">Receiver's Destails</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="charistar-input-group">
                    <User size={18} />
                    <div className="w-full">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-0.5">Contact Name</label>
                      <input 
                        type="text" 
                        placeholder="Full Name" 
                        value={delName} 
                        onChange={e => setDelName(e.target.value)} 
                      />
                    </div>
                  </div>

                  <div className="charistar-input-group">
                    <Phone size={18} />
                    <div className="w-full">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-0.5">Contact Phone</label>
                      <input 
                        type="tel" 
                        inputMode="numeric"
                        maxLength={11}
                        placeholder="e.g. 08123456789" 
                        value={delPhone} 
                        onChange={e => setDelPhone(e.target.value.replace(/[^\d]/g, ''))} 
                      />
                    </div>
                  </div>

                  <div className="charistar-input-group items-start pt-3">
                    <MapPin size={18} className="mt-1" />
                    <div className="w-full">
                      <div className="flex justify-between items-center mb-0.5">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Delivery Address</label>
                        {delAddress && (
                          <button 
                            type="button" 
                            onClick={() => setDelAddress('')}
                            className="text-[8px] text-red-400 font-bold uppercase tracking-wider hover:text-white transition-colors"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <textarea 
                        id="delAddressInput"
                        placeholder="Street name, apartment, area info..." 
                        value={delAddress} 
                        onChange={e => setDelAddress(e.target.value)} 
                        rows="2" 
                      />
                    </div>
                  </div>
                </div>

                {delPlaceName && (
                  <div className="text-[10px] text-gray-400 font-medium bg-white/5 p-3.5 rounded-xl border border-white/5 flex items-center justify-between gap-2">
                    <div className="flex gap-2">
                      <span className="text-charistar-green font-bold">📍 Locked Location:</span>
                      <span>{delPlaceName}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        setDelPlaceName('');
                        setDelLatitude(null);
                        setDelLongitude(null);
                        setDeliveryFee(1500); // Reset to base Ibadan operational delivery fee
                      }}
                      className="text-[9px] bg-red-500/10 text-red-400 px-2.5 py-1 rounded-md border border-red-500/20 uppercase font-bold hover:bg-red-500/20 active:scale-95 transition-all flex-shrink-0"
                    >
                      Reset Location
                    </button>
                  </div>
                )}
              </div>
          </div>

          {/* SECTION 3: PAYMENT */}
          <div className="space-y-6">
              {/* Step Title */}
              <div>
                <h2 className="text-lg font-black text-white tracking-tight uppercase flex items-center gap-2">
                  <CreditCard size={18} className="text-charistar-green" /> 3. Make your Payment
                </h2>
              </div>

              {/* Payment Grid */}
              <div className="glass-panel p-5 rounded-[2rem] border border-white/5 bg-black/35 space-y-4">
                <h3 className="text-xs font-black uppercase text-gray-300 tracking-widest mb-1">select Payment Method</h3>
                
                <div className="flex flex-col gap-3">
                  {/* Option 1: Charistar Wallet */}
                  {currentUser && (
                    <div 
                      onClick={() => setPaymentMethod('wallet')} 
                      className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                        paymentMethod === 'wallet' 
                          ? 'border-charistar-green bg-charistar-green/10 shadow-[0_0_15px_rgba(163,198,68,0.1)]' 
                          : 'border-white/5 bg-[#0a0a0a] hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          paymentMethod === 'wallet' ? 'bg-charistar-green text-black' : 'bg-white/5 text-gray-400'
                        }`}>
                          <Wallet size={20} />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-black text-white uppercase tracking-wider">Charistar Wallet</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Pay from Wallet</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                          currentUser?.walletBalance >= finalTotal ? 'bg-charistar-green/20 text-charistar-green' : 'bg-red-500/20 text-red-400'
                        }`}>
                          ₦{(currentUser?.walletBalance || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}



                  {/* Option 3: Debit Card */}
                  <div 
                    onClick={() => setPaymentMethod('card')} 
                    className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                      paymentMethod === 'card' 
                        ? 'border-charistar-green bg-charistar-green/10 shadow-[0_0_15px_rgba(163,198,68,0.1)]' 
                        : 'border-white/5 bg-[#0a0a0a] hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        paymentMethod === 'card' ? 'bg-charistar-green text-black' : 'bg-white/5 text-gray-400'
                      }`}>
                        <CreditCard size={20} />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-black text-white uppercase tracking-wider">Pay with Paystack</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Secure online payment</p>
                      </div>
                    </div>
                    <CreditCard size={18} className={paymentMethod === 'card' ? 'text-charistar-green' : 'text-gray-500'} />
                  </div>
                </div>
              </div>
          </div>
        </div>

        {/* Bento Card: Order Costs Summary (Always Visible) */}
        <div className="glass-panel p-5 rounded-[2rem] border border-white/5 bg-black/35 space-y-3.5">
          <div className="flex justify-between items-center text-sm font-bold text-gray-300">
            <span className="uppercase tracking-wider">Subtotal</span>
            <span className="text-white">₦{cartTotal.toLocaleString()}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between items-center text-xs font-bold text-charistar-green">
              <span className="uppercase tracking-wider">Promo Discount</span>
              <span>-₦{discount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm font-bold text-gray-300">
            <span className="uppercase tracking-wider">Delivery Fee</span>
            <span className="text-white">₦{deliveryFee.toLocaleString()}</span>
          </div>
          
          <div className="pt-3.5 border-t border-white/5 flex justify-between items-center">
            <span className="text-xs font-black uppercase text-white tracking-widest">Total Amount</span>
            <span className="text-charistar-green text-lg font-black">₦{finalTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* FIXED BOTTOM FLOATING CONTROLS */}
      <div className="fixed bottom-0 left-0 w-full p-6 pb-8 bg-[#050505]/90 backdrop-blur-xl border-t border-white/5 z-40 flex gap-4">
        <button 
          onClick={handlePlaceOrder}
          disabled={isProcessing || cartItems.length === 0}
          className="flex-1 h-14 bg-charistar-green text-black font-black uppercase text-xs tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_8px_20px_rgba(163,198,68,0.2)] disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin text-black" size={16} strokeWidth={3} /> processing
            </>
          ) : (
            `Complete Order • ₦${finalTotal.toLocaleString()}`
          )}
        </button>
      </div>

      {/* Modern custom toast alerts (Non-blocking) */}
      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-24 left-6 right-6 z-50 pointer-events-none flex justify-center"
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

      {/* Refill Wallet Overlay Modal */}
      <AnimatePresence>
        {showRefill && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#000000]/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="glass-panel p-6 rounded-[2.5rem] border border-white/10 bg-[#0a0a0a]/95 shadow-[0_20px_50px_rgba(0,0,0,0.8)] max-w-sm w-full relative overflow-hidden text-center flex flex-col gap-5 text-white"
            >
              {/* Top accent line */}
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-red-500 via-charistar-green to-emerald-400"></div>

              {/* Wallet illustration header */}
              <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 bg-red-500/10 rounded-2xl border border-red-500/20 animate-pulse"></div>
                <Wallet className="text-red-400 animate-bounce" size={28} />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Refill Your Wallet</h3>
                <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">You don't have enough yogurt credits</p>
              </div>

              {/* Statistics details */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-white/5 rounded-2xl border border-white/5 text-left">
                <div>
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Cart Total</span>
                  <span className="text-white font-extrabold text-xs">₦{finalTotal.toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Wallet Balance</span>
                  <span className="text-red-400 font-extrabold text-xs">₦{(currentUser?.walletBalance || 0).toLocaleString()}</span>
                </div>
                <div className="col-span-2 border-t border-white/5 pt-2.5 mt-1 flex justify-between items-center">
                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Refill Needed</span>
                  <span className="text-charistar-green font-black text-sm">₦{Math.max(0, finalTotal - (currentUser?.walletBalance || 0)).toLocaleString()}</span>
                </div>
              </div>

              {/* Pre-defined refill options */}
              <div className="space-y-2.5">
                <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest block text-left">Quick-select Refill</span>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setRefillAmount(Math.max(0, finalTotal - (currentUser?.walletBalance || 0)).toString())}
                    className="py-2.5 bg-charistar-green/10 border border-charistar-green/20 text-charistar-green text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-charistar-green hover:text-black transition-colors"
                  >
                    Exact Diff
                  </button>
                  <button 
                    onClick={() => setRefillAmount("2000")}
                    className="py-2.5 bg-white/5 border border-white/5 text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-white/10 transition-colors"
                  >
                    + ₦2,000
                  </button>
                  <button 
                    onClick={() => setRefillAmount("5000")}
                    className="py-2.5 bg-white/5 border border-white/5 text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-white/10 transition-colors"
                  >
                    + ₦5,000
                  </button>
                  <button 
                    onClick={() => setRefillAmount("10000")}
                    className="py-2.5 bg-white/5 border border-white/5 text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-white/10 transition-colors"
                  >
                    + ₦10,000
                  </button>
                </div>
              </div>

              {/* Input for custom amount */}
              <div className="glass-panel border border-white/5 bg-[#0a0a0a] rounded-xl px-4 py-2 flex items-center gap-2 focus-within:border-charistar-green/40 transition-colors">
                <span className="text-gray-500 font-black text-xs">₦</span>
                <input 
                  type="number"
                  placeholder="Enter custom amount"
                  value={refillAmount}
                  onChange={e => setRefillAmount(e.target.value)}
                  className="bg-transparent border-none outline-none text-white font-extrabold text-xs w-full placeholder:text-gray-600"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={handleRefillWallet}
                  disabled={isRefilling || !refillAmount || parseFloat(refillAmount) <= 0}
                  className="h-12 bg-charistar-green text-black font-black uppercase text-xs tracking-wider rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_5px_15px_rgba(163,198,68,0.2)] disabled:opacity-50"
                >
                  {isRefilling ? (
                    <>
                      <Loader2 className="animate-spin text-black" size={14} strokeWidth={3} /> Processing Topup
                    </>
                  ) : (
                    `Top Up Wallet`
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowRefill(false);
                    setRefillAmount('');
                  }}
                  className="h-11 bg-white/5 text-gray-400 hover:text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all border border-white/5"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
