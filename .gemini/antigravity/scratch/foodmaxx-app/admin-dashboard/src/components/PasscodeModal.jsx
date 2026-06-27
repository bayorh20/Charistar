import React, { useState } from 'react';
import { ShieldCheck, X, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

const PasscodeModal = ({ isOpen, onClose, onVerified, actionName }) => {
  const { storeConfig } = useApp();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const correctPin = storeConfig?.securityPin || '1234';
    
    if (pin === correctPin) {
      setPin('');
      setError('');
      onVerified();
      onClose();
    } else {
      setError('Incorrect security PIN. Access denied.');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-999 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full border border-slate-100 dark:border-slate-700 shadow-2xl p-6 relative overflow-hidden transition-all duration-300 transform scale-100">
        
        {/* Glow decoration */}
        <div className="absolute -top-10 -left-10 w-24 h-24 bg-orange-500/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-red-500/10 rounded-full blur-xl"></div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center gap-3 mt-2">
          <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center text-red-500 dark:text-red-400">
            <ShieldCheck size={26} />
          </div>
          
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Security Verification</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Executing high-risk action: <span className="font-extrabold text-red-600 dark:text-red-400 uppercase">{actionName || 'Confirm Action'}</span>.
            <br />Please enter the master security PIN to proceed.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <input 
              type="password"
              maxLength={6}
              autoFocus
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, '')); // only allow numbers
                setError('');
              }}
              placeholder="••••"
              className="w-full text-center tracking-widest text-2xl font-bold py-2.5 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs font-semibold text-red-500 bg-red-50 dark:bg-red-500/10 p-2.5 rounded-xl border border-red-100 dark:border-red-500/20">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pin.length < 4}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              Verify PIN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasscodeModal;
