import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, User, Phone, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function AuthModal() {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    authenticate,
    authModalMode,
    setAuthModalMode
  } = useAuth();

  // 3D perspective sheet shift trigger
  useEffect(() => {
    const contentEl = document.querySelector('.under-sheet-content');
    if (!contentEl) return;
    if (isAuthModalOpen) {
      contentEl.classList.add('sheet-open');
    } else {
      contentEl.classList.remove('sheet-open');
    }
    return () => {
      contentEl.classList.remove('sheet-open');
    };
  }, [isAuthModalOpen]);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isAuthModalOpen) {
      setName('');
      setPhone('');
      setPassword('');
      setError('');
      setShowPassword(false);
    }
  }, [isAuthModalOpen, authModalMode]);

  // Disable background scrolling when modal is open
  useEffect(() => {
    if (isAuthModalOpen) {
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
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const isRegister = authModalMode === 'register';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isRegister && !name.trim()) {
      return setError('Please enter your full name');
    }

    const cleanPhone = phone.replace(/[^\d]/g, '');
    
    if (!cleanPhone || cleanPhone.length !== 11) {
      return setError('Please enter a valid 11-digit phone number');
    }
    
    if (!password || password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }
    
    setError('');
    setLoading(true);
    try {
      await authenticate(phone, password, name.trim(), isRegister);
      closeAuthModal();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overscroll-contain touch-none"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.85, rotateX: 12, y: 30 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, rotateX: 12, y: 30 }}
          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: "center bottom", transformStyle: "preserve-3d" }}
          className="w-full max-w-md bg-charistar-dark/95 border border-white/10 rounded-[2rem] p-6 pb-8 shadow-xl relative overflow-hidden glass-panel"
        >
          {/* Close button */}
          <button 
            onClick={closeAuthModal}
            className="absolute top-4 right-4 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors z-10"
          >
            <X size={16} className="text-white" />
          </button>

          <div className="mt-4 mb-8 text-center">
            <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
              {isRegister ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-gray-400 text-sm font-medium mt-1">
              {isRegister ? 'Join Charistar and get rewards.' : 'Log in to continue ordering.'}
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 text-red-400 p-3 rounded-xl mb-4 text-sm font-medium border border-red-500/20 text-center animate-fadeIn">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {/* Name Field (Only for Register) */}
            <AnimatePresence>
              {isRegister && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 0 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="overflow-hidden"
                >
                  <div className="charistar-input-group">
                    <User size={18} />
                    <input 
                      type="text" 
                      required={isRegister}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full Name"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="charistar-input-group">
              <Phone size={18} />
              <input 
                type="tel" 
                inputMode="numeric"
                maxLength={11}
                required 
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^\d]/g, '').slice(0, 11);
                  setPhone(val);
                }}
                placeholder="Phone Number (11 digits)"
              />
            </div>
            
            <div className="charistar-input-group pr-12">
              <Lock size={18} />
              <input 
                type={showPassword ? "text" : "password"}
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            <button 
              disabled={loading}
              type="submit" 
              className="w-full bg-charistar-green text-black font-extrabold text-[16px] h-14 rounded-2xl mt-2 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center tracking-wide disabled:opacity-70"
            >
              {loading ? 'Authenticating...' : (isRegister ? 'Sign Up' : 'Log In')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              type="button"
              onClick={() => setAuthModalMode(isRegister ? 'login' : 'register')}
              className="text-[13px] text-gray-400 font-medium hover:text-white transition-colors"
            >
              {isRegister ? (
                <>Already have an account? <span className="text-charistar-green font-bold">Log In</span></>
              ) : (
                <>Don't have an account? <span className="text-charistar-green font-bold">Sign Up</span></>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
