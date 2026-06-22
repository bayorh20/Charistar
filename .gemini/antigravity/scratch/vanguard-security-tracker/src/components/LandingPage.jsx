import React, { useState } from 'react';
import { Sparkles, Terminal, Cpu, ArrowRight, Zap, Smartphone, Globe, Layers, Disc, Play, MessageSquareCode } from 'lucide-react';

export default function LandingPage({ onStartBuild }) {
  const [localPrompt, setLocalPrompt] = useState('');

  const sampleTags = [
    { text: "Music Player App", isMobile: true },
    { text: "Sales Dashboard", isMobile: false },
    { text: "Fitness Tracker App", isMobile: true },
    { text: "Smart Home Controls", isMobile: true }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (localPrompt.trim()) {
      onStartBuild(localPrompt.trim());
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#070913] text-slate-100 flex flex-col justify-between overflow-x-hidden relative select-none">
      
      {/* Background Animated Blobs */}
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[140px] pointer-events-none animate-[floatBlob_10s_infinite_ease-in-out]"></div>
      <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[130px] pointer-events-none animate-[floatBlob_8s_infinite_ease-in-out_2s]"></div>
      
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

      {/* Header */}
      <header className="px-8 h-20 flex items-center justify-between border-b border-white/5 backdrop-blur-md z-10 relative">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
              Lumina Studio
            </h1>
            <span className="text-[9px] font-bold font-mono text-purple-400 uppercase tracking-widest mt-0.5 block">
              Easy AI Builder
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => onStartBuild("Create a Sales Dashboard")}
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Sign In
          </button>
          <button 
            onClick={() => onStartBuild("")}
            className="px-4 py-2 bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all flex items-center gap-1"
          >
            Start Building
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 py-16 z-10 max-w-7xl mx-auto w-full space-y-16">
        
        {/* Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 text-left space-y-6 flex flex-col justify-center">
            
            {/* Animated Banner */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-purple-500/20 text-purple-400 text-xs font-semibold shadow shadow-purple-500/5 select-none w-fit">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-current animate-pulse" />
              Make phone and web apps without coding
            </div>

            {/* Title */}
            <div className="space-y-4">
              <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight font-sans">
                Build Web & Phone Apps <br />
                <span className="shimmer-text">With Simple English</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed">
                Type what you want. Lumina writes the code and builds your app in 10 seconds. Click preview elements to edit or download files to launch on your phone.
              </p>
            </div>

            {/* Input Box */}
            <form 
              onSubmit={handleSubmit}
              className="w-full max-w-xl bg-bgPanel/60 border border-white/10 p-3 rounded-2xl shadow-premium backdrop-blur-md space-y-3 focus-within:border-purple-500/40 focus-within:shadow-[0_0_20px_rgba(139,92,246,0.1)] transition-all duration-300 hover:border-white/20"
            >
              <div className="flex gap-3 items-center bg-slate-950/80 p-2.5 rounded-xl border border-white/5">
                <Terminal className="w-5 h-5 text-purple-400 flex-shrink-0" />
                <input
                  type="text"
                  value={localPrompt}
                  onChange={(e) => setLocalPrompt(e.target.value)}
                  placeholder="What app do you want to make?"
                  className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder-slate-500"
                />
                <button
                  type="submit"
                  disabled={!localPrompt.trim()}
                  className="px-5 py-2.5 bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:hover:from-violet-600 disabled:hover:to-indigo-600 text-white rounded-lg text-xs font-bold shadow shadow-indigo-500/10 flex items-center gap-1.5 transition-all active:scale-97"
                >
                  Build App
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Suggestions */}
              <div className="flex flex-wrap gap-2 items-center justify-start pl-1 pt-1 select-none">
                {sampleTags.map((tag, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setLocalPrompt(tag.text)}
                    className="px-2.5 py-1 rounded-full bg-slate-900 border border-white/5 text-[10px] text-slate-400 hover:text-white hover:border-purple-500/30 hover:bg-slate-900/80 transition-colors flex items-center gap-1"
                  >
                    {tag.isMobile ? <Smartphone className="w-2.5 h-2.5 text-purple-400" /> : <Globe className="w-2.5 h-2.5 text-teal-400" />}
                    {tag.text}
                  </button>
                ))}
              </div>
            </form>
          </div>

          {/* Right Visual Floating Sandbox Column */}
          <div className="lg:col-span-5 hidden lg:block relative">
            <div className="absolute inset-0 bg-indigo-500/10 rounded-2xl blur-3xl pointer-events-none animate-pulse"></div>
            
            {/* Mock IDE Card */}
            <div className="w-full bg-[#111625]/90 border border-white/10 rounded-2xl shadow-premium overflow-hidden backdrop-blur-md relative z-10 hover:border-purple-500/30 transition-colors duration-300 card-hover-lift">
              
              {/* Mock Header Tabs */}
              <div className="h-10 bg-[#0c0f1a] border-b border-white/5 px-4 flex items-center justify-between text-xs text-slate-500">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1 rounded-md text-[10px] font-mono text-indigo-400 border border-white/5">
                  <MessageSquareCode className="w-3 h-3" />
                  App.jsx
                </div>
                <span className="w-4"></span>
              </div>

              {/* Mock App preview panel */}
              <div className="p-6 space-y-4 bg-slate-950/60">
                <div className="flex justify-between items-center bg-slate-900/60 p-3 rounded-xl border border-white/5 animate-border-glow">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold border border-purple-500/20 animate-pulse">
                      ✨
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white leading-none">AeroBeat App</h4>
                      <span className="text-[9px] text-slate-500">Status: Running</span>
                    </div>
                  </div>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold animate-pulse">Live</span>
                </div>

                {/* Disc player simulation preview */}
                <div className="bg-[#0b0f19] border border-white/5 p-6 rounded-2xl flex flex-col items-center gap-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-purple-600/5 rounded-full blur-2xl"></div>
                  
                  {/* Disk */}
                  <div className="w-28 h-28 rounded-full border-4 border-slate-900 bg-slate-950 overflow-hidden shadow-2xl relative flex items-center justify-center animate-[spin_8s_linear_infinite]">
                    <img 
                      src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&q=80" 
                      alt="Vinyl cover" 
                      className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.5)_80%)]"></div>
                    <div className="absolute w-6 h-6 rounded-full bg-[#0b0f19] flex items-center justify-center border border-slate-800">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                    </div>
                  </div>

                  {/* Text */}
                  <div className="text-center space-y-0.5 z-10">
                    <div className="text-xs font-bold text-white">Neon Horizon</div>
                    <div className="text-[9px] text-purple-400 font-semibold uppercase tracking-wider">Hyperion</div>
                  </div>

                  {/* Play Buttons */}
                  <div className="flex items-center gap-4 z-10">
                    <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-[10px] text-slate-400">⏮</div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg text-white">
                      <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-[10px] text-slate-400">⏭</div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 w-full pt-6 border-t border-white/5">
          <div className="p-6 rounded-2xl bg-slate-900/20 border border-white/5 hover:border-purple-500/20 hover:bg-slate-900/40 transition-all text-left space-y-3 card-hover-lift">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Click to Edit</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Click any part of your app preview. Type what you want to change, and the AI updates it instantly.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/20 border border-white/5 hover:border-purple-500/20 hover:bg-slate-900/40 transition-all text-left space-y-3 card-hover-lift">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Get Phone Apps</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Download your app files. You can turn them into real apps for Android phones and iPhones easily.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/20 border border-white/5 hover:border-purple-500/20 hover:bg-slate-900/40 transition-all text-left space-y-3 card-hover-lift">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Runs in Browser</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              No setup needed. Lumina builds and runs your app right inside your web browser, even offline.
            </p>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="px-8 h-16 border-t border-white/5 backdrop-blur-md flex items-center justify-between text-xs text-slate-500 z-10">
        <span>&copy; 2026 Lumina AI.</span>
        <div className="flex gap-4">
          <a href="#terms" className="hover:text-slate-300">Terms</a>
          <a href="#privacy" className="hover:text-slate-300">Privacy</a>
        </div>
      </footer>

    </div>
  );
}
