import React, { useState } from 'react';
import { Sparkles, ShieldCheck, Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react';

export default function AuthPage({ onAuthSuccess, onBack }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAuthSuccess({ email, name: name || 'Developer' });
  };

  return (
    <div className="min-h-screen w-screen bg-[#070913] text-slate-100 flex items-center justify-center overflow-hidden relative select-none">
      
      {/* Background glow meshes */}
      <div className="absolute top-[-10%] right-[20%] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[130px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

      {/* Main Glassmorphic Card */}
      <div className="w-full max-w-md bg-bgPanel/60 border border-white/10 p-8 rounded-3xl shadow-premium backdrop-blur-md space-y-6 relative z-10 animate-[fadeIn_0.25s_ease-out]">
        
        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute top-6 left-6 text-slate-500 hover:text-white transition-colors flex items-center gap-1 text-[11px] font-semibold tracking-wide uppercase"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>

        {/* Brand Banner */}
        <div className="flex flex-col items-center text-center space-y-2 pt-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5.5 h-5.5 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white mt-1">Unlock Lumina Workspace</h2>
          <p className="text-xs text-slate-400 max-w-[280px]">
            Save your progress, configure API keys, and launch your apps.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-xl border border-white/5 text-center">
          <button
            onClick={() => setIsSignUp(false)}
            className={`py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              !isSignUp ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsSignUp(true)}
            className={`py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              isSignUp ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Your Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-slate-950 border border-white/5 focus:border-indigo-500/50 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition-colors"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-950 border border-white/5 focus:border-indigo-500/50 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between pl-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
              {!isSignUp && (
                <a href="#reset" className="text-[10px] text-purple-400 hover:underline">Forgot?</a>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-white/5 focus:border-indigo-500/50 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all select-none active:scale-97"
          >
            {isSignUp ? 'Create Account & Start' : 'Sign In & Start'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 py-1 bg-slate-950/40 rounded-lg border border-white/5">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          Your login details are secure.
        </div>

        {/* Guest access option */}
        <div className="text-center pt-2">
          <button
            onClick={() => onAuthSuccess({ name: 'Guest Developer', isGuest: true })}
            className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-wider text-[10px] border-b border-transparent hover:border-purple-400"
          >
            Continue as Guest (Offline Mode)
          </button>
        </div>

      </div>

    </div>
  );
}
