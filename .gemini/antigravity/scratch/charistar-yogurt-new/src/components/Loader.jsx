import React from 'react';

export default function Loader({ fullScreen = false }) {
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
