import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CheckCircle } from 'lucide-react';

export default function ApplePaySheet({ isOpen, onClose, amount, onSuccess }) {
  const [step, setStep] = useState('initial'); // 'initial', 'scanning', 'success'

  useEffect(() => {
    if (isOpen) {
      setStep('initial');
    }
  }, [isOpen]);

  const handleDoubleClick = () => {
    if (step !== 'initial') return;
    
    setStep('scanning');
    
    // Simulate FaceID scan delay
    setTimeout(() => {
      setStep('success');
      
      // Auto close and trigger success after animation
      setTimeout(() => {
        onSuccess();
      }, 1500);
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-end justify-center pointer-events-none">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#050505]/60 backdrop-blur-sm pointer-events-auto"
            onClick={step === 'initial' ? onClose : undefined}
          />

          {/* Payment Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-[480px] bg-white rounded-t-[2.5rem] relative z-10 pointer-events-auto flex flex-col items-center pb-12 pt-8 px-6 shadow-[0_-20px_60px_rgba(0,0,0,0.5)]"
          >
            {/* Grab handle */}
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mb-8"></div>

            {/* Content */}
            <div className="w-full text-center flex flex-col items-center">
              <h3 className="text-xl font-bold text-black mb-1">Pay with Apple Pay</h3>
              <p className="text-sm text-gray-500 mb-8 font-medium">Charistar Yogurt Checkout</p>

              <div className="text-4xl font-black text-black tracking-tight mb-12">
                ₦{amount.toLocaleString()}
              </div>

              {/* Dynamic Action Area */}
              <div className="h-32 flex items-center justify-center w-full">
                <AnimatePresence mode="wait">
                  {step === 'initial' && (
                    <motion.div 
                      key="initial"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex flex-col items-center gap-4 cursor-pointer"
                      onClick={handleDoubleClick}
                    >
                      <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center animate-pulse">
                        <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                        </svg>
                      </div>
                      <p className="text-sm font-bold text-black uppercase tracking-widest">Double Click to Pay</p>
                    </motion.div>
                  )}

                  {step === 'scanning' && (
                    <motion.div 
                      key="scanning"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex flex-col items-center gap-4"
                    >
                      <div className="relative w-16 h-16">
                        <ShieldCheck size={64} className="text-blue-500 absolute inset-0" strokeWidth={1.5} />
                        <motion.div 
                          className="absolute inset-0 border-[3px] border-blue-500 rounded-xl"
                          animate={{ 
                            rotateX: [0, 180, 360], 
                            borderColor: ['#3b82f6', '#A3C644', '#3b82f6'] 
                          }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        />
                      </div>
                      <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Face ID</p>
                    </motion.div>
                  )}

                  {step === 'success' && (
                    <motion.div 
                      key="success"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center gap-4"
                    >
                      <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
                        <CheckCircle size={32} className="text-white" strokeWidth={3} />
                      </div>
                      <p className="text-sm font-bold text-green-600 uppercase tracking-widest">Done</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

