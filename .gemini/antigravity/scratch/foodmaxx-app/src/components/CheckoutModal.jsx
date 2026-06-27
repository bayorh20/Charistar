import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { ArrowLeft, CreditCard, Lock, Smartphone, ShieldCheck, MapPin, X, CheckCircle, Clock, MessageSquare, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playTick, playSuccessChime } from '../utils/sound';
import { safeStorage as localStorage } from '../utils/storage';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

export default function CheckoutModal() {
  const {
    getCartTotal,
    placeOrder,
    setActiveScreen,
    soundEnabled,
    cart,
    savedAddresses,
    addAddress,
    setShowSupport
  } = useContext(AppContext);

  const [phoneNumber, setPhoneNumber] = useState(localStorage.getItem('foodmaxx_user_phone') || (savedAddresses?.length > 0 ? savedAddresses[savedAddresses.length - 1].phone || '' : ''));
  const [streetAddress, setStreetAddress] = useState(savedAddresses?.length > 0 ? savedAddresses[savedAddresses.length - 1].details || '' : '');
  const [notes, setNotes] = useState('');
  const [allergies, setAllergies] = useState('');
  
  const [scheduleType, setScheduleType] = useState('lunch'); // 'lunch', 'dinner', 'custom'
  const [customDate, setCustomDate] = useState('');
  const [customTimeVal, setCustomTimeVal] = useState('');
  const [selectedTime, setSelectedTime] = useState('11:00 AM');

  // Parse time slots based on schedule selection
  const timeSlots = scheduleType === 'lunch'
    ? ['11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM']
    : scheduleType === 'dinner'
      ? ['2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM']
      : [];

  useEffect(() => {
    if (scheduleType === 'lunch') {
      setSelectedTime('11:00 AM');
    } else if (scheduleType === 'dinner') {
      setSelectedTime('2:00 PM');
    } else {
      setSelectedTime('');
    }
  }, [scheduleType]);

  const parseTimeForClock = (timeStr) => {
    if (!timeStr) return { hour: 12, minute: 0 };
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return { hour: hours, minute: minutes };
  };

  const { hour, minute } = parseTimeForClock(selectedTime);
  const minuteAngle = minute * 6;
  const hourAngle = (hour % 12) * 30 + minute * 0.5;

  // Get current date/time strings for min attributes
  const now = new Date();
  const todayString = now.toISOString().split('T')[0];
  const currentTimeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  // Flow: 'details' → 'paystack_card' → 'paystack_pin' → 'paystack_otp' → 'processing' → 'success'
  const [phase, setPhase] = useState('details');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [pin, setPin] = useState('');
  const [otp, setOtp] = useState('');
  const [processingMessage, setProcessingMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isFaqOpen, setIsFaqOpen] = useState(false);

  const [isSdkLoading, setIsSdkLoading] = useState(!window.PaystackPop);
  
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 4000);
  };

  const handleSpecialRequestClick = () => {
    setShowSupport(true);
    playTick(soundEnabled);
  };

  useEffect(() => {
    if (!window.PaystackPop) {
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v2/inline.js';
      script.async = true;
      script.onload = () => setIsSdkLoading(false);
      script.onerror = () => {
        setIsSdkLoading(false);
        showError('Failed to load Paystack payment SDK. Please check your connection.');
      };
      document.body.appendChild(script);
    }
  }, []);

  const subtotal = getCartTotal();
  const serviceCharge = 200;

  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      discount = (subtotal * appliedCoupon.value) / 100;
      if (appliedCoupon.maxDiscount > 0 && discount > appliedCoupon.maxDiscount) {
        discount = appliedCoupon.maxDiscount;
      }
    } else if (appliedCoupon.discountType === 'flat') {
      discount = appliedCoupon.value;
    }
  }

  const total = Math.max(0, subtotal + serviceCharge - discount);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');
    
    if (!couponCode.trim()) return;

    if (!navigator.onLine) {
      setCouponError('You are offline. Cannot validate coupon.');
      return;
    }

    try {
      const code = couponCode.toUpperCase().trim();
      const docRef = doc(db, 'coupons', code);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setCouponError('Invalid coupon code.');
        return;
      }

      const data = docSnap.data();

      if (data.active === false) {
        setCouponError('This coupon is inactive.');
        return;
      }

      if (data.expiryDate && new Date(data.expiryDate) < new Date()) {
        setCouponError('This coupon has expired.');
        return;
      }

      if (subtotal < (data.minOrder || 0)) {
        setCouponError(`Minimum order of ₦${(data.minOrder || 0).toLocaleString()} required.`);
        return;
      }

      // Valid coupon!
      setAppliedCoupon(data);
      setCouponSuccess(`Coupon "${code}" applied successfully!`);
      playSuccessChime(soundEnabled);
    } catch (err) {
      setCouponError('Failed to apply coupon. Try again.');
      console.error(err);
    }
  };

  const payWithPaystack = () => {
    if (!window.PaystackPop) {
      // Fallback to beautiful local card checkout simulator when Paystack is blocked/offline
      setPhase('paystack_card');
      return;
    }
    if (!navigator.onLine) {
      showError('You are offline. Cannot process Paystack payment. Please check your connection.');
      return;
    }
    try {
      // Try v2 modern transaction flow
      const paystack = new window.PaystackPop();
      paystack.newTransaction({
        key: 'pk_test_114553ffb90cdb1598f3e238b6d19b1d6e176a27',
        email: 'customer@foodmaxx-ibadan.com',
        amount: Math.round(total * 100),
        currency: 'NGN',
        reference: 'FM_' + Math.floor(Math.random() * 100000000 + 1),
        onSuccess: (transaction) => {
          localStorage.setItem('foodmaxx_user_phone', phoneNumber);
          setPhase('processing');
          setProcessingMessage('Verifying payment: ' + transaction.reference);
          setTimeout(() => {
            placeOrder({ 
              method: 'Paystack', 
              ref: transaction.reference, 
              phone: phoneNumber, 
              street: streetAddress,
              notes,
              allergies,
              scheduleType,
              customTime: scheduleType === 'custom' ? `${customDate}T${customTimeVal}` : (scheduleType === 'lunch' || scheduleType === 'dinner' ? selectedTime : ''),
              totalAmount: total,
              couponCode: appliedCoupon ? appliedCoupon.code : null,
              discount: discount
            });
          }, 100);
        },
        onCancel: () => {
          showError('Payment was canceled. Feel free to try again.');
        }
      });
    } catch (v2Error) {
      console.warn("Paystack v2 initialization failed, trying v1 setup fallback...", v2Error);
      try {
        // Fallback to v1 setup syntax
        const handler = window.PaystackPop.setup({
          key: 'pk_test_114553ffb90cdb1598f3e238b6d19b1d6e176a27',
          email: 'customer@foodmaxx-ibadan.com',
          amount: Math.round(total * 100),
          currency: 'NGN',
          reference: 'FM_' + Math.floor(Math.random() * 100000000 + 1),
          callback: (response) => {
            localStorage.setItem('foodmaxx_user_phone', phoneNumber);
            setPhase('processing');
            setProcessingMessage('Verifying payment: ' + response.reference);
            setTimeout(() => {
              placeOrder({ 
                method: 'Paystack', 
                ref: response.reference, 
                phone: phoneNumber, 
                street: streetAddress,
                notes,
                allergies,
                scheduleType,
                customTime: scheduleType === 'custom' ? `${customDate}T${customTimeVal}` : (scheduleType === 'lunch' || scheduleType === 'dinner' ? selectedTime : ''),
                totalAmount: total,
                couponCode: appliedCoupon ? appliedCoupon.code : null,
                discount: discount
              });
            }, 100);
          },
          onClose: () => {
            showError('Payment was canceled. Feel free to try again.');
          }
        });
        handler.openIframe();
      } catch (v1Error) {
        console.warn("Paystack v1 initialization failed too. Routing to simulated card payment modal.", v1Error);
        setPhase('paystack_card');
      }
    }
  };

  const handleDetailsSubmit = (e) => {
    e.preventDefault();
    if (!navigator.onLine) {
      showError('You are offline. Please check your internet connection before checking out.');
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.trim().length < 10) {
      showError('Please enter a valid Nigerian phone number (e.g. 08123456789).');
      return;
    }
    if (!streetAddress.trim()) {
      showError('Please enter your street address for delivery.');
      return;
    }
    if (scheduleType === 'custom' && (!customDate || !customTimeVal)) {
      showError('Please select both a custom delivery date and time.');
      return;
    }

    // Auto-save the address if it's new
    const isExisting = savedAddresses.some(addr => 
      addr.details.toLowerCase() === streetAddress.toLowerCase()
    );
    if (!isExisting) {
      addAddress({
        name: 'Saved Address',
        type: 'Other',
        details: streetAddress,
        phone: phoneNumber
      });
    }

    playTick(soundEnabled);
    if (!window.PaystackPop && isSdkLoading) {
      setProcessingMessage('Initializing secure payment gateway...');
      setPhase('processing');
      const checkInterval = setInterval(() => {
        if (window.PaystackPop) {
          clearInterval(checkInterval);
          setPhase('details');
          setProcessingMessage('');
          payWithPaystack();
        }
      }, 500);
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.PaystackPop) {
          setPhase('details');
          setProcessingMessage('');
          showError('Payment gateway timeout. Please check your internet connection.');
        }
      }, 8000);
      return;
    }
    payWithPaystack();
  };

  // ✅ FIXED: was missing — caused runtime crash
  const handleCardSubmit = (e) => {
    e.preventDefault();
    if (cardNumber.replace(/\s/g, '').length < 16) {
      showError('Please enter a valid 16-digit card number.');
      return;
    }
    if (expiry.length < 5) {
      showError('Please enter a valid expiry date (MM/YY).');
      return;
    }
    if (cvv.length < 3) {
      showError('Please enter your 3-digit CVV.');
      return;
    }
    playTick(soundEnabled);
    setPhase('paystack_pin');
  };

  // ✅ FIXED: was missing — caused runtime crash
  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pin.length < 4) {
      showError('Please enter your 4-digit card PIN.');
      return;
    }
    playTick(soundEnabled);
    setPhase('paystack_otp');
  };

  // ✅ FIXED: was missing — caused runtime crash
  const handleOtpSubmit = (e) => {
    e.preventDefault();
    if (!navigator.onLine) {
      showError('You are offline. Cannot authorize card transaction.');
      return;
    }
    if (otp.length < 4) {
      showError('Please enter the OTP sent to your phone.');
      return;
    }
    playTick(soundEnabled);
    setPhase('processing');
    setProcessingMessage('Authorizing your card transaction...');
    localStorage.setItem('foodmaxx_user_phone', phoneNumber);
    setTimeout(() => {
      placeOrder({
        method: 'Card (Simulated)',
        cardLast4: cardNumber.replace(/\s/g, '').slice(-4),
        phone: phoneNumber,
        street: streetAddress,
        notes,
        allergies,
        scheduleType,
        customTime: scheduleType === 'custom' ? `${customDate}T${customTimeVal}` : (scheduleType === 'lunch' || scheduleType === 'dinner' ? selectedTime : ''),
        totalAmount: total,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        discount: discount
      });
    }, 100);
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const parts = [];
    for (let i = 0; i < v.length && i < 16; i += 4) {
      parts.push(v.substring(i, i + 4));
    }
    return parts.join(' ');
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) return `${v.slice(0, 2)}/${v.slice(2, 4)}`;
    return v;
  };

  const goBack = () => {
    if (phase === 'paystack_card') setPhase('details');
    else if (phase === 'paystack_pin') setPhase('paystack_card');
    else if (phase === 'paystack_otp') setPhase('paystack_pin');
    else { setActiveScreen('home'); playTick(soundEnabled); }
  };

  return (
    <motion.div 
      className="checkout-overlay"
      initial={{ opacity: 0, y: "100%", rotateX: 20, z: -150, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, rotateX: 0, z: 0, scale: 1 }}
      exit={{ opacity: 0, y: "100%", rotateX: 15, z: -100, scale: 0.94 }}
      transition={{ type: "spring", damping: 26, stiffness: 220 }}
      style={{ transformStyle: 'preserve-3d', transformOrigin: 'bottom center' }}
    >
      {/* Top Header with safe area */}
      <div className="checkout-header">
        <button className="checkout-back-btn" onClick={goBack} aria-label="Go back">
          <ArrowLeft size={20} />
        </button>
        <span className="checkout-header-title">
          {phase === 'details' && 'Checkout'}
          {phase === 'paystack_card' && 'Secure Payment'}
          {phase === 'paystack_pin' && 'Card PIN'}
          {phase === 'paystack_otp' && 'OTP Verification'}
          {phase === 'processing' && 'Processing...'}
        </span>
        <button className="checkout-back-btn" onClick={() => { setActiveScreen('home'); playTick(soundEnabled); }} aria-label="Close checkout">
          <X size={20} />
        </button>
      </div>


      {/* Error banner */}
      {errorMsg && (
        <div className="custom-error-banner anim-scale-in">
          <span>⚠️</span> {errorMsg}
        </div>
      )}

      {/* Body */}
      <div className="checkout-body">

        {/* Phase 1: Delivery Details */}
        {phase === 'details' && (
          <form onSubmit={handleDetailsSubmit} className="details-form anim-scale-in">
            <h3 className="checkout-section-title">Delivery details</h3>
            <p className="checkout-section-subtitle">
              Tell us where to deliver your food.
            </p>

            {savedAddresses && savedAddresses.length > 0 && (
              <div className="input-group">
                <label className="input-label">Quick Select Saved Address</label>
                <div className="saved-address-scroller">
                  {savedAddresses.map(addr => (
                    <div 
                      key={addr.id} 
                      className={`saved-address-pill ${streetAddress === addr.details ? 'selected' : ''}`}
                      onClick={() => {
                        setStreetAddress(addr.details);
                        if (addr.phone) setPhoneNumber(addr.phone);
                        playTick(soundEnabled);
                      }}
                    >
                      <span className="addr-name">{addr.details.length > 25 ? `${addr.details.substring(0, 25)}...` : addr.details}</span>
                      <span className="addr-detail">{addr.phone || 'No phone'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="input-group">
              <label htmlFor="streetAddress" className="input-label">Delivery Address</label>
              <input
                id="streetAddress"
                type="text"
                placeholder="e.g. Plot 12, Bodija Housing Estate, Ibadan"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                required
                className="checkout-input-field"
              />
            </div>

            <div className="input-group">
              <label htmlFor="phoneNumber" className="input-label">Phone Number</label>
              <input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9+]/g, ''))}
                required
                maxLength={11}
                className="checkout-input-field"
              />
            </div>

            <div className="input-group">
              <label htmlFor="deliveryNotes" className="input-label">Rider Instructions (Optional)</label>
              <textarea
                id="deliveryNotes"
                placeholder="Rider instructions (gate code, block number, etc.)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="checkout-textarea-field"
              />
            </div>

            <div className="input-group">
              <label htmlFor="allergyNotes" className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Allergies or Dietary Restrictions (Optional)</span>
                <span className="allergy-badge">⚠️ Care</span>
              </label>
              <textarea
                id="allergyNotes"
                placeholder="e.g. Peanut allergy, gluten-free, no onions, etc."
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                className="checkout-textarea-field allergy-input"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Delivery Schedule</label>
              <div className="checkout-preorder-alert">
                <Clock size={16} className="alert-icon" />
                <span className="alert-text">
                  <strong>Pre-Order Only:</strong> Lunch order closes at 10 AM. Dinner delivery starts at 3 PM.
                </span>
              </div>
              <div className="schedule-options" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {['lunch', 'dinner', 'custom'].map(type => (
                  <div 
                    key={type} 
                    className={`schedule-pill ${scheduleType === type ? 'selected' : ''}`}
                    onClick={() => setScheduleType(type)}
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      gridColumn: type === 'custom' ? 'span 2' : 'auto' 
                    }}
                  >
                    {type === 'lunch' && (
                      <>
                        <span>Lunch</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8, marginTop: '2px', fontWeight: 'normal' }}>11:00 AM - 2:00 PM</span>
                      </>
                    )}
                    {type === 'dinner' && (
                      <>
                        <span>Dinner</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8, marginTop: '2px', fontWeight: 'normal' }}>2:00 PM - 6:00 PM</span>
                      </>
                    )}
                    {type === 'custom' && <span>Custom Time</span>}
                  </div>
                ))}
              </div>
              
              {(scheduleType === 'lunch' || scheduleType === 'dinner') && (
                <div className="animated-time-picker-section anim-slide-down">
                  <div className="clock-picker-flex">
                    <div className="clock-svg-wrapper">
                      <svg width="80" height="80" viewBox="0 0 100 100" className="clock-svg">
                        {/* Outer Glow & Border Ring */}
                        <circle cx="50" cy="50" r="46" stroke="var(--border-color)" strokeWidth="1.5" fill="var(--bg-card)" />
                        <circle cx="50" cy="50" r="43" stroke="var(--primary-glow)" strokeWidth="3" fill="none" />
                        
                        {/* 12 Hour Ticks */}
                        {[...Array(12)].map((_, i) => {
                          const angle = i * 30;
                          const isQuarter = angle % 90 === 0;
                          return (
                            <line
                              key={i}
                              x1="50"
                              y1="8"
                              x2="50"
                              y2={isQuarter ? "16" : "12"}
                              stroke={isQuarter ? "var(--primary)" : "var(--text-muted)"}
                              strokeWidth={isQuarter ? "2.5" : "1.2"}
                              strokeLinecap="round"
                              transform={`rotate(${angle} 50 50)`}
                            />
                          );
                        })}

                        {/* Quarter numbers */}
                        <text x="50" y="27" textAnchor="middle" fontSize="9" fontWeight="900" fill="var(--text-main)" style={{ fontFamily: 'var(--font-accent)' }}>12</text>
                        <text x="78" y="53" textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="900" fill="var(--text-main)" style={{ fontFamily: 'var(--font-accent)' }}>3</text>
                        <text x="50" y="80" textAnchor="middle" fontSize="9" fontWeight="900" fill="var(--text-main)" style={{ fontFamily: 'var(--font-accent)' }}>6</text>
                        <text x="22" y="53" textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="900" fill="var(--text-main)" style={{ fontFamily: 'var(--font-accent)' }}>9</text>

                        {/* Hour Hand */}
                        <line 
                          x1="50" 
                          y1="50" 
                          x2="50" 
                          y2="28" 
                          stroke="var(--text-main)" 
                          strokeWidth="4.5" 
                          strokeLinecap="round" 
                          className="clock-hand"
                          style={{ transform: `rotate(${hourAngle}deg)` }}
                        />
                        {/* Minute Hand */}
                        <line 
                          x1="50" 
                          y1="50" 
                          x2="50" 
                          y2="18" 
                          stroke="var(--primary)" 
                          strokeWidth="2.5" 
                          strokeLinecap="round" 
                          className="clock-hand"
                          style={{ transform: `rotate(${minuteAngle}deg)` }}
                        />
                        
                        {/* Center Cap / Pin */}
                        <circle cx="50" cy="50" r="4.5" fill="var(--primary)" />
                        <circle cx="50" cy="50" r="2" fill="#FFFFFF" />
                      </svg>
                    </div>
                    <div className="clock-picker-details">
                      <span className="clock-picker-label">Desired delivery time:</span>
                      <div className="selected-time-digital">{selectedTime}</div>
                    </div>
                  </div>
                  <div className="time-slots-container">
                    {timeSlots.map(slot => (
                      <button
                        key={slot}
                        type="button"
                        className={`time-slot-pill ${selectedTime === slot ? 'selected' : ''}`}
                        onClick={() => { setSelectedTime(slot); playTick(soundEnabled); }}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {scheduleType === 'custom' && (
                <div className="custom-time-picker anim-slide-down">
                  <p className="checkout-section-subtitle" style={{ marginTop: '12px', marginBottom: '12px', fontSize: '0.8rem' }}>
                    Pick exactly when you want your meal to arrive.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ position: 'relative' }}>
                      <label style={{ position: 'absolute', top: '6px', left: '14px', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Delivery Date</label>
                      <input
                        id="customDate"
                        type="date"
                        value={customDate}
                        min={todayString}
                        onChange={(e) => {
                          setCustomDate(e.target.value);
                          // Reset time if they pick today and the existing time is in the past
                          if (e.target.value === todayString && customTimeVal && customTimeVal < currentTimeString) {
                            setCustomTimeVal('');
                          }
                        }}
                        required={scheduleType === 'custom'}
                        className="checkout-input-field"
                        style={{ paddingTop: '24px', paddingBottom: '8px', height: '56px' }}
                      />
                    </div>
                    <div style={{ position: 'relative' }}>
                      <label style={{ position: 'absolute', top: '6px', left: '14px', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Delivery Time</label>
                      <input
                        id="customTimeVal"
                        type="time"
                        value={customTimeVal}
                        min={customDate === todayString ? currentTimeString : undefined}
                        onChange={(e) => setCustomTimeVal(e.target.value)}
                        required={scheduleType === 'custom'}
                        className="checkout-input-field"
                        style={{ paddingTop: '24px', paddingBottom: '8px', height: '56px' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Special Delivery Request Info Banner */}
              <div className="special-request-banner" onClick={handleSpecialRequestClick}>
                <MessageSquare size={14} className="support-chat-icon" />
                <span>Wants a special delivery schedule request, let us know! <strong className="banner-link-btn">Chat with us</strong></span>
              </div>

              {/* FAQ Trigger Link */}
              <div className="faq-trigger-banner" onClick={() => { setIsFaqOpen(true); playTick(soundEnabled); }}>
                <span className="faq-trigger-text">Want to know more about our delivery schedule?</span>
                <button type="button" className="faq-trigger-btn">FAQ Click Here</button>
            </div>
            
            {/* Promo Code Input */}
            <div className="input-group" style={{ marginTop: '16px', padding: '0 8px' }}>
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Tag size={14} style={{ color: 'var(--primary)' }} />
                <span>Promo Code / Discount Coupon</span>
              </label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <input
                  type="text"
                  placeholder="ENTER CODE (e.g. WELCOME)"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    setCouponError('');
                    setCouponSuccess('');
                  }}
                  className="checkout-input-field"
                  style={{ textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="btn-apply-coupon"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '16px',
                    padding: '0 16px',
                    fontSize: '0.72rem',
                    fontWeight: 'black',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    height: '52px',
                    textTransform: 'uppercase'
                  }}
                >
                  Apply
                </button>
              </div>
              {couponError && (
                <p style={{ color: '#ef4444', fontSize: '0.68rem', fontWeight: 'bold', marginTop: '4px', paddingLeft: '4px' }}>
                  ❌ {couponError}
                </p>
              )}
              {couponSuccess && (
                <p style={{ color: '#10b981', fontSize: '0.68rem', fontWeight: 'bold', marginTop: '4px', paddingLeft: '4px' }}>
                  ✅ {couponSuccess}
                </p>
              )}
            </div>

            <div className="checkout-pricing-card" style={{ margin: '20px 8px' }}>
              {cart.slice(0, 3).map((item) => (
                <div key={item.uniqueId} className="price-line" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.quantity}× {item.name}
                  </span>
                  <span>₦{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              {cart.length > 3 && (
                <div className="price-line" style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.72rem', marginBottom: '6px' }}>
                  <span>+{cart.length - 3} more item{cart.length - 3 > 1 ? 's' : ''}...</span>
                </div>
              )}
              <div className="price-line" style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '8px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
                <span>Delivery</span>
                <span className="success-text" style={{ color: '#10b981', fontWeight: 'bold' }}>FREE</span>
              </div>
              <div className="price-line" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
                <span>Service Charge</span>
                <span>₦{serviceCharge.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="price-line" style={{ color: '#10b981', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
                  <span>Discount ({appliedCoupon?.code})</span>
                  <span>-₦{discount.toLocaleString()}</span>
                </div>
              )}
              <div className="price-line total" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 'black', color: 'var(--text-main)' }}>
                <span>Total to Pay</span>
                <span>₦{total.toLocaleString()}</span>
              </div>
            </div>
            </div>

            <button type="submit" className="btn-pay-details-submit">
              <Lock size={16} style={{ marginRight: '8px' }} />
              Proceed to Secure Payment
            </button>

            <div className="checkout-trust-bar">
              <ShieldCheck size={14} style={{ color: 'var(--secondary)' }} />
              <span>256-bit SSL Encrypted • Powered by Paystack</span>
            </div>
          </form>
        )}

        {/* Phase 2: Card Entry */}
        {phase === 'paystack_card' && (
          <div className="paystack-card-container anim-scale-in">
            <div className="paystack-iframe-simulator">
              <div className="paystack-header">
                <div className="paystack-header-left">
                  <div className="paystack-dot-decor" />
                  <span className="paystack-merchant">FOODMAXX</span>
                </div>
                <span className="paystack-amount">₦{total.toLocaleString()}</span>
              </div>

              <p className="paystack-prompt">Enter your debit card details to complete payment</p>

              <form onSubmit={handleCardSubmit} className="paystack-card-form">
                <div className="paystack-input-wrapper">
                  <input
                    type="text"
                    placeholder="Card Number"
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    required
                    className="paystack-input"
                    inputMode="numeric"
                  />
                  <CreditCard size={18} className="paystack-input-icon" />
                </div>

                <div className="paystack-card-row">
                  <input
                    type="text"
                    placeholder="MM / YY"
                    maxLength={5}
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    required
                    className="paystack-input"
                    inputMode="numeric"
                  />
                  <input
                    type="password"
                    placeholder="CVV"
                    maxLength={3}
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/[^0-9]/g, ''))}
                    required
                    className="paystack-input"
                    inputMode="numeric"
                  />
                </div>

                <button type="submit" className="btn-paystack-submit">
                  <Lock size={16} />
                  Pay ₦{total.toLocaleString()}
                </button>
              </form>

              <div className="paystack-footer">
                <ShieldCheck size={14} className="paystack-shield" />
                <span>Secured by <strong>paystack</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* Phase 3: PIN */}
        {phase === 'paystack_pin' && (
          <div className="paystack-card-container anim-scale-in">
            <div className="paystack-iframe-simulator text-center">
              <div className="paystack-header">
                <span className="paystack-merchant">Enter Card PIN</span>
                <span className="paystack-amount">₦{total.toLocaleString()}</span>
              </div>
              <p className="paystack-prompt">Enter your 4-digit card PIN to authorize this transaction.</p>

              <form onSubmit={handlePinSubmit} className="paystack-form-pin">
                <input
                  type="password"
                  maxLength={4}
                  placeholder="• • • •"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                  required
                  className="paystack-pin-input"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
                <button type="submit" className="btn-paystack-submit mt-16">
                  Authorize
                </button>
              </form>

              <div className="paystack-footer">
                <Smartphone size={14} className="paystack-shield" />
                <span>Do not close or press back</span>
              </div>
            </div>
          </div>
        )}

        {/* Phase 4: OTP */}
        {phase === 'paystack_otp' && (
          <div className="paystack-card-container anim-scale-in">
            <div className="paystack-iframe-simulator text-center">
              <div className="paystack-header">
                <span className="paystack-merchant">OTP Verification</span>
                <span className="paystack-amount">₦{total.toLocaleString()}</span>
              </div>
              <p className="paystack-prompt">
                A one-time password has been sent to your registered phone number. Enter it below.
              </p>

              <form onSubmit={handleOtpSubmit} className="paystack-form-pin">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  required
                  className="paystack-pin-input"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
                <button type="submit" className="btn-paystack-submit mt-16">
                  <CheckCircle size={16} />
                  Verify &amp; Pay
                </button>
              </form>

              <div className="paystack-footer">
                <Lock size={14} className="paystack-shield" />
                <span>OTP expires in 5 minutes</span>
              </div>
            </div>
          </div>
        )}

        {/* Phase 5: Processing */}
        {phase === 'processing' && (
          <div className="checkout-processing-view anim-fade">
            <div className="processing-icon-ring">
              <div className="paystack-loader-ring" />
              <div className="processing-inner-dot" />
            </div>
            <div className="checkout-processing-title">Processing Payment</div>
            <p className="checkout-processing-text">{processingMessage}</p>
            <p className="checkout-processing-subtext">Please do not go back or refresh.</p>
          </div>
        )}
      </div>

      {/* Mini FAQ Modal Overlay */}
      <AnimatePresence>
        {isFaqOpen && (
          <motion.div 
            className="faq-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsFaqOpen(false)}
          >
            <motion.div 
              className="faq-modal-card"
              initial={{ scale: 0.85, y: 40, rotateX: 15, rotateY: -10, opacity: 0 }}
              animate={{ scale: 1, y: 0, rotateX: 0, rotateY: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: 40, rotateX: 15, rotateY: -10, opacity: 0 }}
              transition={{ type: "spring", damping: 22, stiffness: 250 }}
              style={{ transformStyle: 'preserve-3d', transformOrigin: 'center center' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="faq-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={18} style={{ color: 'var(--primary)' }} />
                  <h4 className="faq-modal-title">Delivery Schedule FAQ</h4>
                </div>
                <button 
                  type="button" 
                  className="faq-modal-close-btn"
                  onClick={() => { setIsFaqOpen(false); playTick(soundEnabled); }}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="faq-modal-body">
                <div className="faq-item">
                  <h5 className="faq-question">What are the ordering deadlines and delivery windows?</h5>
                  <p className="faq-answer">
                    FoodMaxx operates strictly on a scheduled pre-order model to ensure maximum freshness:
                    <br />
                    • <strong>Lunch (11 AM - 2 PM Delivery)</strong>: Place order before <strong>10:00 AM</strong>.
                    <br />
                    • <strong>Dinner (3 PM - 6 PM Delivery)</strong>: Place order before <strong>2:00 PM</strong> (delivery starts at 3:00 PM).
                  </p>
                </div>

                <div className="faq-item">
                  <h5 className="faq-question">How does Lunch &amp; Dinner delivery work?</h5>
                  <p className="faq-answer">
                    Lunch delivery is scheduled between <strong>11:00 AM and 2:00 PM</strong>, and Dinner is between <strong>2:00 PM and 6:00 PM</strong>. You can pick any half-hour slot within these hours. Our riders prioritize orders in batches to ensure food arrives steaming hot!
                  </p>
                </div>

                <div className="faq-item">
                  <h5 className="faq-question">Can I schedule a custom time outside these hours?</h5>
                  <p className="faq-answer">
                    Yes! Select the <strong>"Custom Time"</strong> option to choose any date and time. If you need a special arrangement or group delivery, click the <strong>"Chat with us"</strong> button to talk to support.
                  </p>
                </div>

                <div className="faq-item">
                  <h5 className="faq-question">What if my order is delayed?</h5>
                  <p className="faq-answer">
                    We track every rider in real-time. If there is a rain delay or heavy traffic in Ibadan, you will get a live notification. You can track your rider's route from your Profile tab!
                  </p>
                </div>

                <div className="faq-item">
                  <h5 className="faq-question">Is delivery really free?</h5>
                  <p className="faq-answer">
                    Yes, FoodMaxx offers <strong>100% Free Delivery</strong> on all standard lunch and dinner schedules! A minimal service charge of ₦200 applies for order processing.
                  </p>
                </div>
              </div>

              <button 
                type="button" 
                className="faq-modal-ok-btn"
                onClick={() => { setIsFaqOpen(false); playTick(soundEnabled); }}
              >
                Got It
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        /* Modern Flat Borderless (Minimal Lineage) Design Tokens */
        :root {
          --checkout-bg-app: #F9F9FB;       /* Light cool white */
          --checkout-bg-card: #FFFFFF;      /* Crisp card canvas */
          --checkout-bg-input: #F3F3F6;     /* Light soft input grey */
          --checkout-border-color: #E5E7EB; /* Subtle grey divider */
          --checkout-shadow: 0 4px 20px rgba(0, 0, 0, 0.025);
          --checkout-shadow-hover: 0 6px 24px rgba(0, 0, 0, 0.04);
          --checkout-text-muted: #71717A;
        }

        .dark-mode {
          --checkout-bg-app: #09090B;       /* Deep slate/obsidian */
          --checkout-bg-card: #18181B;      /* Card slate */
          --checkout-bg-input: #27272A;     /* Dark soft input grey */
          --checkout-border-color: #27272A; /* Slate divider */
          --checkout-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          --checkout-shadow-hover: 0 6px 24px rgba(0, 0, 0, 0.3);
          --checkout-text-muted: #A1A1AA;
        }

        .checkout-overlay {
          position: absolute;
          inset: 0;
          background-color: var(--checkout-bg-app);
          z-index: 3000;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          white-space: normal;
        }

        .checkout-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          padding-top: calc(12px + env(safe-area-inset-top, 0px));
          border-bottom: 1px solid var(--checkout-border-color);
          background: var(--checkout-bg-card);
          flex-shrink: 0;
          min-height: 56px;
        }

        .checkout-back-btn {
          color: var(--text-main);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--checkout-bg-input);
          border: none;
          transition: all 0.2s ease;
        }

        .checkout-back-btn:hover {
          background: var(--checkout-border-color);
          transform: scale(1.05);
        }
        .checkout-back-btn:active {
          transform: scale(0.95);
        }

        .checkout-header-title {
          font-family: var(--font-accent);
          font-weight: 800;
          font-size: 1rem;
          color: var(--text-main);
        }

        /* Progress steps */
        .checkout-steps {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px 20px;
          background: var(--checkout-bg-card);
          border-bottom: 1px solid var(--checkout-border-color);
          flex-shrink: 0;
          gap: 0;
        }

        .step-item {
          display: flex;
          align-items: center;
        }

        .step-dot {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--checkout-bg-input);
          border: none;
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--checkout-text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }

        .step-dot.active {
          background: var(--primary);
          color: white;
          box-shadow: 0 0 0 3px rgba(255, 91, 38, 0.15);
          font-weight: 900;
        }

        .step-dot.done {
          background: var(--secondary);
          color: white;
        }

        .step-line {
          width: 32px;
          height: 2px;
          background: var(--checkout-border-color);
          margin: 0 2px;
          transition: all 0.3s ease;
        }

        .step-line.done {
          background: var(--secondary);
        }

        .custom-error-banner {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.15);
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 0.78rem;
          font-weight: 700;
          color: #ef4444;
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 10px 16px 0 16px;
          flex-shrink: 0;
        }

        .checkout-body {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 16px;
          padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px));
          -webkit-overflow-scrolling: touch;
        }

        .checkout-section-title {
          font-family: var(--font-accent);
          font-weight: 800;
          font-size: 1.15rem;
          color: var(--text-main);
          margin-bottom: 4px;
        }

        .checkout-section-subtitle {
          font-size: 0.78rem;
          color: var(--checkout-text-muted);
          margin-bottom: 18px;
          line-height: 1.5;
          font-weight: 500;
        }

        .input-group {
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .input-label {
          font-size: 0.68rem;
          font-weight: 800;
          color: var(--checkout-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.6px;
          padding-left: 2px;
        }

        .static-field {
          background: var(--checkout-bg-card);
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 0.84rem;
          font-weight: 600;
          color: var(--text-main);
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: var(--checkout-shadow);
        }

        .static-field-icon { color: var(--primary); }

        .checkout-input-field {
          background: var(--checkout-bg-input);
          border: 1px solid transparent;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 0.86rem;
          color: var(--text-main);
          width: 100%;
          font-weight: 600;
          transition: all 0.2s ease;
          font-family: inherit;
          box-sizing: border-box;
        }

        .checkout-input-field:focus {
          background: var(--checkout-bg-card);
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(255, 91, 38, 0.08);
          outline: none;
        }

        .checkout-textarea-field {
          background: var(--checkout-bg-input);
          border: 1px solid transparent;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 0.86rem;
          color: var(--text-main);
          width: 100%;
          min-height: 76px;
          font-weight: 600;
          resize: none;
          transition: all 0.2s ease;
          font-family: inherit;
          box-sizing: border-box;
        }

        .checkout-textarea-field:focus {
          background: var(--checkout-bg-card);
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(255, 91, 38, 0.08);
          outline: none;
        }

        .saved-address-scroller {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 2px 2px 8px 2px;
          scrollbar-width: none;
        }
        .saved-address-scroller::-webkit-scrollbar {
          display: none;
        }

        .saved-address-pill {
          flex: 0 0 auto;
          background: var(--checkout-bg-card);
          border-radius: 12px;
          padding: 10px 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: var(--checkout-shadow);
          display: flex;
          flex-direction: column;
          gap: 2px;
          border: 1px solid transparent;
        }

        .saved-address-pill.selected {
          border-color: var(--primary);
          background: var(--checkout-bg-card);
          box-shadow: 0 4px 14px rgba(255, 91, 38, 0.06);
        }

        .saved-address-pill .addr-name {
          font-size: 0.78rem;
          font-weight: 800;
          color: var(--text-main);
        }

        .saved-address-pill .addr-detail {
          font-size: 0.68rem;
          color: var(--checkout-text-muted);
          font-weight: 600;
        }

        .schedule-options {
          display: grid;
          gap: 8px;
        }

        .schedule-pill {
          background: var(--checkout-bg-card);
          border-radius: 12px;
          padding: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1.5px solid transparent;
          box-shadow: var(--checkout-shadow);
          font-weight: 700;
          font-size: 0.84rem;
          color: var(--text-main);
          text-align: center;
        }

        .schedule-pill.selected {
          border-color: var(--primary);
          box-shadow: 0 4px 12px rgba(255, 91, 38, 0.06);
        }

        .custom-time-picker {
          background: var(--checkout-bg-card);
          border-radius: 14px;
          padding: 14px;
          box-shadow: var(--checkout-shadow);
          margin-top: 8px;
        }

        .checkout-pricing-card {
          background: var(--checkout-bg-card);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin: 20px 0;
          box-shadow: var(--checkout-shadow);
        }

        .price-line {
          display: flex;
          justify-content: space-between;
          font-size: 0.78rem;
          color: var(--checkout-text-muted);
          font-weight: 600;
        }

        .price-line.total {
          border-top: 1px solid var(--checkout-border-color);
          padding-top: 10px;
          margin-top: 4px;
          font-size: 0.98rem;
          color: var(--text-main);
          font-family: var(--font-accent);
          font-weight: 800;
        }

        .price-line.total span:last-child {
          color: var(--primary);
          font-weight: 900;
        }

        .success-text { color: var(--secondary); font-weight: 800; }

        .btn-pay-details-submit {
          width: 100%;
          background: var(--primary);
          color: #fff;
          border-radius: 30px;
          padding: 14px 20px;
          font-weight: 700;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          box-shadow: 0 6px 20px rgba(255, 91, 38, 0.15);
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .btn-pay-details-submit:hover {
          background: var(--primary-hover);
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(255, 91, 38, 0.2);
        }
        .btn-pay-details-submit:active {
          transform: scale(0.98);
        }

        .checkout-trust-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 0.68rem;
          color: var(--checkout-text-muted);
          font-weight: 600;
          margin-top: 16px;
          padding-bottom: 8px;
        }

        /* Paystack Simulator */
        .paystack-card-container { padding-top: 8px; }

        .paystack-iframe-simulator {
          background: var(--checkout-bg-card);
          border-radius: 16px;
          padding: 20px 16px;
          box-shadow: var(--checkout-shadow);
          border: 1px solid var(--checkout-border-color);
        }

        .paystack-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 14px;
          border-bottom: 1px solid var(--checkout-border-color);
          margin-bottom: 16px;
        }

        .paystack-header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .paystack-dot-decor {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #01c25a;
          animation: pulse 1s infinite;
        }

        .paystack-merchant {
          font-weight: 800;
          font-size: 0.74rem;
          letter-spacing: 1.5px;
          color: var(--text-main);
        }

        .paystack-amount {
          font-family: var(--font-accent);
          font-weight: 900;
          font-size: 1.05rem;
          color: var(--primary);
        }

        .paystack-prompt {
          font-size: 0.76rem;
          color: var(--checkout-text-muted);
          text-align: center;
          margin-bottom: 16px;
          font-weight: 600;
          line-height: 1.45;
        }

        .paystack-card-form { display: flex; flex-direction: column; gap: 10px; }

        .paystack-input-wrapper { position: relative; }

        .paystack-input-icon {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--checkout-text-muted);
        }

        .paystack-input {
          width: 100%;
          background: var(--checkout-bg-input);
          border: 1px solid transparent;
          border-radius: 12px;
          padding: 12px 38px 12px 14px;
          font-size: 0.88rem;
          color: var(--text-main);
          font-weight: 600;
          font-family: var(--font-accent);
          transition: all 0.2s ease;
          letter-spacing: 0.5px;
          box-sizing: border-box;
        }

        .paystack-input:focus {
          background: var(--checkout-bg-card);
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(255, 91, 38, 0.08);
          outline: none;
        }

        .paystack-card-row { display: flex; gap: 10px; }
        .paystack-card-row .paystack-input { padding-right: 14px; }

        .btn-paystack-submit {
          width: 100%;
          background: #01c25a;
          color: #fff;
          border-radius: 30px;
          padding: 14px;
          font-weight: 800;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 8px;
          border: none;
          transition: all 0.2s ease;
          box-shadow: 0 6px 16px rgba(1, 194, 90, 0.2);
          cursor: pointer;
        }

        .btn-paystack-submit:hover {
          background: #01a84e;
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(1, 194, 90, 0.25);
        }
        .btn-paystack-submit:active {
          transform: scale(0.98);
        }

        .paystack-footer {
          margin-top: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 0.68rem;
          color: var(--checkout-text-muted);
          font-weight: 600;
        }

        .paystack-shield { color: #10b981; }

        .text-center { text-align: center; }

        .paystack-form-pin {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 8px;
        }

        .paystack-pin-input {
          width: 140px;
          border: 1px solid transparent;
          border-radius: 12px;
          padding: 14px;
          font-size: 1.6rem;
          font-weight: 900;
          letter-spacing: 8px;
          text-align: center;
          color: var(--text-main);
          background: var(--checkout-bg-input);
          display: block;
          transition: all 0.2s ease;
          font-family: var(--font-accent);
        }

        .paystack-pin-input:focus {
          background: var(--checkout-bg-card);
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(255, 91, 38, 0.08);
          outline: none;
        }

        .mt-16 { margin-top: 16px; }

        /* Processing */
        .checkout-processing-view {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 280px;
          text-align: center;
          padding: 20px;
        }

        .processing-icon-ring {
          position: relative;
          width: 72px;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }

        .paystack-loader-ring {
          position: absolute;
          inset: 0;
          border: 4px solid var(--checkout-border-color);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.9s linear infinite;
        }

        .processing-inner-dot {
          width: 16px;
          height: 16px;
          background: var(--primary);
          border-radius: 50%;
          animation: pulse 1.4s infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .checkout-processing-title {
          font-family: var(--font-accent);
          font-weight: 800;
          font-size: 1.2rem;
          color: var(--text-main);
          margin-bottom: 8px;
        }

        .checkout-processing-text {
          font-size: 0.84rem;
          color: var(--primary);
          font-weight: 700;
          margin-bottom: 6px;
        }

        .checkout-processing-subtext {
          font-size: 0.72rem;
          color: var(--checkout-text-muted);
          max-width: 220px;
          line-height: 1.4;
        }
      `}} />
    </motion.div>
  );
}
