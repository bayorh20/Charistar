import React from 'react';
import { motion } from 'framer-motion';

export default function Loader({ fullScreen = false, type = 'dots', count = 3 }) {
  if (type === 'skeleton') {
    return (
      <div className="flex flex-col gap-6 px-1 w-full">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="glass-panel rounded-2xl p-5 border border-white/5 relative overflow-hidden">
            {/* Shimmer overlay */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent z-10" />
            
            <div className="w-full h-[220px] rounded-xl bg-white/5 mb-4" />
            <div className="w-3/4 h-5 rounded bg-white/10 mb-2" />
            <div className="w-1/2 h-4 rounded bg-white/5 mb-5" />
            
            <div className="flex justify-between items-center">
              <div className="w-1/4 h-6 rounded bg-white/10" />
              <div className="w-11 h-11 rounded-xl bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${fullScreen ? 'fixed inset-0 z-50 bg-charistar-dark/80 backdrop-blur-sm' : 'w-full h-full min-h-[50vh]'}`}>
      <style>{`
        @keyframes pulse-fast {
          0%, 100% { transform: scale(0.6); opacity: 0.3; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        .pulse-dot {
          animation: pulse-fast 0.5s ease-in-out infinite;
        }
      `}</style>
      <div className="flex gap-2 items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-charistar-green pulse-dot" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 rounded-full bg-charistar-green pulse-dot" style={{ animationDelay: '100ms' }}></div>
        <div className="w-2 h-2 rounded-full bg-charistar-green pulse-dot" style={{ animationDelay: '200ms' }}></div>
      </div>
    </div>
  );
}

