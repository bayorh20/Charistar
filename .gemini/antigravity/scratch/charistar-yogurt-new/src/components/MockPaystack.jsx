import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, X, ShieldCheck, CheckCircle, Loader2 } from 'lucide-react';

export default function MockPaystack({ amount, email, onSuccess, onCancel }) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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
      alert("Please enter valid card details to simulate payment.");
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
      }, 1000);
      
    }, 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(!isProcessing && !isSuccess) ? onCancel : undefined}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-[400px] glass-panel rounded-3xl overflow-hidden shadow-xl border border-white/10 flex flex-col bg-charistar-dark/95"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-5 border-b border-white/5 bg-black/20">
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-[#0aba5b]" />
              <span className="font-extrabold text-white uppercase tracking-wider text-sm">Secure Checkout</span>
            </div>
            {(!isProcessing && !isSuccess) && (
              <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            )}
          </div>

          <div className="p-6">
            <div className="text-center mb-6">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{email}</p>
              <h2 className="text-3xl font-black text-white">₦{amount.toLocaleString()}</h2>
            </div>

            {isSuccess ? (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center justify-center py-8 space-y-4"
              >
                <div className="w-20 h-20 bg-[#0aba5b]/20 rounded-full flex items-center justify-center border-2 border-[#0aba5b]/40 shadow-[0_0_30px_rgba(10,186,91,0.3)]">
                  <CheckCircle size={40} className="text-[#0aba5b]" />
                </div>
                <p className="text-white font-extrabold text-lg uppercase tracking-wide">Payment Successful</p>
              </motion.div>
            ) : isProcessing ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 space-y-4"
              >
                <Loader2 size={48} className="text-[#0aba5b] animate-spin" />
                <p className="text-gray-400 font-bold text-sm animate-pulse">Authenticating with Bank...</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Credit Card Graphic */}
                <div className="w-full h-40 bg-gradient-to-br from-gray-800 to-black rounded-2xl p-5 flex flex-col justify-between border border-white/10 shadow-lg relative overflow-hidden group">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-[#0aba5b]/10 transition-colors"></div>
                  <div className="flex justify-between items-start">
                    <CreditCard size={24} className="text-gray-400" />
                    <div className="flex gap-1">
                      <div className="w-6 h-6 rounded-full bg-red-500/80 mix-blend-screen"></div>
                      <div className="w-6 h-6 rounded-full bg-yellow-500/80 -ml-3 mix-blend-screen"></div>
                    </div>
                  </div>
                  <div>
                    <p className="text-white/80 font-mono text-lg tracking-widest mb-1">{cardNumber || '•••• •••• •••• ••••'}</p>
                    <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                      <span>Mock Card</span>
                      <span>{expiry || 'MM/YY'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="glass-panel border border-white/10 rounded-xl px-4 py-1.5 focus-within:border-[#0aba5b] transition-colors">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Card Number</label>
                    <input 
                      type="text" 
                      placeholder="0000 0000 0000 0000" 
                      value={cardNumber}
                      onChange={handleCardChange}
                      className="w-full bg-transparent border-none outline-none text-white font-bold text-sm py-1 font-mono placeholder:text-gray-600"
                    />
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1 glass-panel border border-white/10 rounded-xl px-4 py-1.5 focus-within:border-[#0aba5b] transition-colors">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Expiry</label>
                      <input 
                        type="text" 
                        placeholder="MM/YY" 
                        value={expiry}
                        onChange={handleExpiryChange}
                        className="w-full bg-transparent border-none outline-none text-white font-bold text-sm py-1 font-mono placeholder:text-gray-600"
                      />
                    </div>
                    <div className="flex-1 glass-panel border border-white/10 rounded-xl px-4 py-1.5 focus-within:border-[#0aba5b] transition-colors">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">CVV</label>
                      <input 
                        type="password" 
                        placeholder="123" 
                        value={cvv}
                        onChange={handleCvvChange}
                        className="w-full bg-transparent border-none outline-none text-white font-bold text-sm py-1 font-mono placeholder:text-gray-600"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-[#0aba5b] text-white font-extrabold text-[15px] uppercase tracking-wider py-3.5 rounded-xl mt-4 shadow-[0_5px_15px_rgba(10,186,91,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Pay ₦{amount.toLocaleString()}
                </button>
                <div className="text-center mt-3">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">⚡ Secured by MockPaystack</p>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
