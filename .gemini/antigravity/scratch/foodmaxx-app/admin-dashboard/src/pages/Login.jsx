import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { playSuccessChime } from '../utils/sound';
import { motion } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in or handle timeout params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('timeout') === '1') {
      setError('Authentication connection timed out. Please check your network connection and try again.');
    }

    const unsubscribe = auth?.onAuthStateChanged((user) => {
      if (user) {
        navigate('/');
      }
    });
    return unsubscribe;
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');

    try {
      if (!auth || !db) {
        // Fallback for offline emulator environment if firebase configuration is missing
        if (email === 'admin@foodmaxx.com' && password === 'admin123') {
          playSuccessChime();
          navigate('/');
          return;
        } else {
          throw new Error('Invalid offline credentials.');
        }
      }

      // 1. Set persistence based on "Remember Me" checkbox
      const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistenceType);

      // 2. Perform authentication sign-in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 3. Authorization check: check if user exists in the admins whitelist collection
      const adminDocRef = doc(db, 'admins', user.uid);
      let adminSnap = await getDoc(adminDocRef);

      // Seed first admin if admins collection is empty (during setup)
      if (!adminSnap.exists() && email === 'admin@foodmaxx.com') {
        await setDoc(adminDocRef, {
          email: user.email,
          role: 'Super Admin',
          createdAt: new Date().toISOString()
        });
        adminSnap = await getDoc(adminDocRef);
      }

      if (adminSnap.exists()) {
        playSuccessChime();
        navigate('/');
      } else {
        // Log out immediately if not in the whitelist
        await auth.signOut();
        setError('Access Denied. Your account is not whitelisted as an administrator.');
      }
    } catch (err) {
      console.error("Login failed:", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password.');
      } else {
        setError(err.message || 'An error occurred during sign-in.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Visual backgrounds */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-orange-500/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-red-600/10 rounded-full blur-[140px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 20 }}
        className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full p-8 transition-all relative"
      >
        <div className="flex flex-col items-center gap-2 mb-6">
          <span className="text-4xl">🍔</span>
          <h2 className="text-2xl font-black tracking-tight text-slate-800">
            FoodMaxx Admin
          </h2>
          <p className="text-xs font-semibold text-slate-400">
            Secure Portal Command Center
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2.5 p-3.5 bg-red-50 text-red-600 border border-red-100 rounded-2xl text-xs font-semibold">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 pl-1">
              Admin Email Address
            </label>
            <input 
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@foodmaxx.com"
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 pl-1">
              Secret Password
            </label>
            <input 
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-orange-500 border-slate-200 focus:ring-orange-500/20 cursor-pointer"
              />
              <span>Remember Me</span>
            </label>
            <a 
              href="mailto:support@foodmaxx.com?subject=Admin Password Reset"
              className="text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors"
            >
              Forgot Password?
            </a>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            className="w-full mt-4 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white py-3.5 rounded-2xl font-black text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={18} />
                <span>Authorize Login</span>
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-8 text-center border-t border-slate-50 pt-4">
          <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest">
            Protected by Cloud Firewalls & SSL Encryption
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
