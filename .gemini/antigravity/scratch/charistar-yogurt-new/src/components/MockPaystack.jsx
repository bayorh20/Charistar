import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, X, ShieldCheck, CheckCircle, Loader2, Lock, ArrowRight } from 'lucide-react';

export default function MockPaystack({ amount, email, onSuccess, onCancel }) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [cardFocused, setCardFocused] = useState(false);

  // Format card number with spaces
  const handleCardChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    const formatted = val.replace(/(.{4})/g, '$1 ').trim();
    if (formatted.length <= 19) setCardNumber(formatted);
  };

  // Format expiry MM/YY
  const handleExpiryChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length >= 2) {
      setExpiry(`${val.slice(0, 2)}/${val.slice(2, 4)}`);
    } else {
      setExpiry(val);
    }
  };

  const handleCvvChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 3) setCvv(val);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (cardNumber.length < 19 || expiry.length < 5 || cvv.length < 3) {
      return;
    }
    
    setIsProcessing(true);
    
    // Simulate network delay and processing
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      
      // Pass back a simulated Paystack reference
      setTimeout(() => {
        onSuccess({
          reference: 'mock_pay_' + Math.floor((Math.random() * 1000000000) + 1),
          status: 'success'
        });
      }, 1200);
      
    }, 2000);
  };

  const getCardType = (number) => {
    const trimmed = number.replace(/\s+/g, '');
    if (/^4/.test(trimmed)) return 'visa';
    if (/^(5[1-5]|2[2-7])/.test(trimmed)) return 'mastercard';
    return 'generic';
  };

  const cardType = getCardType(cardNumber);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(!isProcessing && !isSuccess) ? onCancel : undefined}
          className="absolute inset-0 bg-[#000000]/80 backdrop-blur-[8px]"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-[420px] glass-panel rounded-[2.5rem] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.85)] border border-white/10 flex flex-col bg-[#080808]/95 text-white"
        >
          {/* Top Paystack Brand line Accent */}
          <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-emerald-500 via-[#3bb75e] to-teal-400"></div>

          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#3bb75e]/10 border border-[#3bb75e]/25 flex items-center justify-center text-[#3bb75e]">
                <ShieldCheck size={18} strokeWidth={2.5} />
              </div>
              <div className="text-left">
                <span className="font-black text-white uppercase tracking-wider text-xs block">Paystack Secure Checkout</span>
                <span className="text-[8px] text-[#3bb75e] font-black uppercase tracking-widest block">✦ 256-bit SSL Protected</span>
              </div>
            </div>
            {(!isProcessing && !isSuccess) && (
              <button onClick={onCancel} className="w-8 h-8 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center text-gray-400">
                <X size={16} />
              </button>
            )}
          </div>

          <div className="p-7">
            <div className="text-center mb-6">
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.15em] mb-1">{email}</p>
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-gray-400 font-extrabold text-lg select-none">₦</span>
                <h2 className="text-4xl font-black text-white tracking-tight leading-none">{amount.toLocaleString()}</h2>
              </div>
            </div>

            {isSuccess ? (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center justify-center py-10 space-y-4"
              >
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border-2 border-emerald-500/30 shadow-[0_0_35px_rgba(16,185,129,0.35)]">
                  <CheckCircle size={36} className="text-[#3bb75e]" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-white font-black text-lg uppercase tracking-wide">Payment Authorized</p>
                  <p className="text-gray-500 text-[9px] uppercase font-black tracking-widest">Generating secure receipt id...</p>
                </div>
              </motion.div>
            ) : isProcessing ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-14 space-y-4"
              >
                <Loader2 size={42} className="text-[#3bb75e] animate-spin" strokeWidth={3} />
                <div className="text-center space-y-1">
                  <p className="text-gray-400 font-bold text-xs animate-pulse">Contacting card issuing bank...</p>
                  <p className="text-gray-500 text-[9px] uppercase font-black tracking-widest">Do not close this gateway</p>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Credit Card Graphic mockup design */}
                <div className="w-full h-44 bg-gradient-to-br from-[#121212] via-[#0c0c0c] to-[#050505] rounded-[1.8rem] p-5.5 flex flex-col justify-between border border-white/8 shadow-2xl relative overflow-hidden group">
                  <div className="absolute -right-8 -top-8 w-28 h-28 bg-[#3bb75e]/5 rounded-full blur-2xl group-hover:bg-[#3bb75e]/10 transition-colors"></div>
                  
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-7 bg-amber-400/20 rounded border border-amber-400/30 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-x-1 inset-y-1 border border-amber-400/25 opacity-30 rounded-sm"></div>
                      <div className="absolute inset-x-3 inset-y-2 bg-amber-400/20"></div>
                    </div>
                    <div className="flex gap-1.5 items-center">
                      {cardType === 'visa' && <span className="text-white font-black text-xs italic tracking-wider">VISA</span>}
                      {cardType === 'mastercard' && (
                        <div className="flex">
                          <div className="w-6 h-6 rounded-full bg-red-500/80 mix-blend-screen"></div>
                          <div className="w-6 h-6 rounded-full bg-yellow-500/80 -ml-2.5 mix-blend-screen"></div>
                        </div>
                      )}
                      {cardType === 'generic' && <CreditCard size={18} className="text-gray-500" />}
                    </div>
                  </div>

                  <div>
                    <p className="text-white font-mono text-base tracking-[0.18em] font-semibold mb-1">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </p>
                    <div className="flex justify-between text-[8px] text-gray-500 font-black uppercase tracking-[0.2em] pt-0.5">
                      <span>Cardholder Name</span>
                      <span>{expiry || 'MM/YY'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-1">
                  <div className="glass-panel border border-white/5 bg-black/45 rounded-2xl px-5 py-2.5 focus-within:border-[#3bb75e]/40 transition-colors">
                    <label className="block text-[8px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Card Number</label>
                    <input 
                      type="text" 
                      placeholder="0000 0000 0000 0000" 
                      value={cardNumber}
                      onChange={handleCardChange}
                      className="w-full bg-transparent border-none outline-none text-white font-extrabold text-xs py-0.5 font-mono placeholder:text-gray-600 focus:ring-0"
                    />
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1 glass-panel border border-white/5 bg-black/45 rounded-2xl px-5 py-2.5 focus-within:border-[#3bb75e]/40 transition-colors">
                      <label className="block text-[8px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Expiry Date</label>
                      <input 
                        type="text" 
                        placeholder="MM/YY" 
                        value={expiry}
                        onChange={handleExpiryChange}
                        className="w-full bg-transparent border-none outline-none text-white font-extrabold text-xs py-0.5 font-mono placeholder:text-gray-600 focus:ring-0"
                      />
                    </div>
                    <div className="flex-1 glass-panel border border-white/5 bg-black/45 rounded-2xl px-5 py-2.5 focus-within:border-[#3bb75e]/40 transition-colors">
                      <label className="block text-[8px] font-black text-gray-500 uppercase tracking-widest mb-0.5">CVV Code</label>
                      <input 
                        type="password" 
                        maxLength={3}
                        placeholder="123" 
                        value={cvv}
                        onChange={handleCvvChange}
                        className="w-full bg-transparent border-none outline-none text-white font-extrabold text-xs py-0.5 font-mono placeholder:text-gray-600 focus:ring-0"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={cardNumber.length < 19 || expiry.length < 5 || cvv.length < 3}
                  className="w-full h-13 bg-[#3bb75e] text-white font-black uppercase text-xs tracking-widest rounded-2xl mt-4 shadow-[0_8px_25px_rgba(59,183,94,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  Confirm Payment <ArrowRight size={14} strokeWidth={2.5} />
                </button>
                
                <div className="text-center flex items-center justify-center gap-1.5 opacity-40">
                  <Lock size={10} />
                  <span className="text-[8px] text-gray-400 font-black uppercase tracking-widest">Secured payment powered by paystack</span>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

