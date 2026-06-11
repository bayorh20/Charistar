import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActiveOrder } from '../hooks/useActiveOrder';
import { motion } from 'framer-motion';
import { Navigation, Ghost, Home, Compass } from 'lucide-react';
import Loader from '../components/Loader';
import { createPortal } from 'react-dom';

export default function ActiveTrack() {
  const { activeOrder, loading } = useActiveOrder();
  const navigate = useNavigate();
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && activeOrder) {
      // Auto-redirect to the specific tracking ID
      navigate(`/track-order/${activeOrder.id}`, { replace: true });
    }
  }, [activeOrder, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen pb-36 bg-[#050505] font-sans">
        {/* Header Skeleton */}
        <div className="sticky top-0 z-30 bg-[#050505] px-6 pt-12 pb-5 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/5 rounded-xl animate-pulse" />
            <div>
              <div className="w-12 h-3 bg-white/5 rounded animate-pulse mb-1" />
              <div className="w-20 h-4 bg-white/10 rounded animate-pulse" />
            </div>
          </div>
          <div className="w-16 h-7 bg-white/5 rounded-lg animate-pulse" />
        </div>

        {/* Content Skeleton */}
        <div className="px-6 pt-6 space-y-6 max-w-[420px] mx-auto w-full">
          {/* Time Window Skeleton */}
          <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-between animate-pulse">
            <div className="space-y-2 flex-1 pr-4">
              <div className="w-24 h-3 bg-white/10 rounded" />
              <div className="w-40 h-5 bg-white/15 rounded" />
              <div className="w-full h-3 bg-white/5 rounded mt-3" />
            </div>
            <div className="w-10 h-10 bg-white/5 rounded-xl flex-shrink-0" />
          </div>

          {/* Transit Map Skeleton */}
          <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] animate-pulse">
            <div className="w-16 h-3 bg-white/5 rounded mb-4" />
            <div className="w-full h-[180px] bg-white/5 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const container = mounted ? document.getElementById('phone-wrapper') : null;

  return (
    <>
      {container ? createPortal(
        <div className="absolute inset-0 z-50 bg-[#050505] flex flex-col items-center justify-center text-center px-6 overflow-hidden" style={{ height: '100dvh' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative w-32 h-32 rounded-[2rem] border border-white/5 bg-white/[0.02] flex items-center justify-center mb-8 shadow-card"
            style={{ color: 'var(--accent)' }}
          >
            <div className="absolute inset-0 bg-[var(--accent)] opacity-5 blur-2xl rounded-full"></div>
            <Compass size={48} strokeWidth={1.5} className="z-10" />
          </motion.div>
          <h1 className="text-[24px] font-black text-white tracking-tighter mb-4">Sorry, you don't have active orders</h1>
          <p className="text-gray-400 mb-10 max-w-[280px] mx-auto text-sm leading-relaxed font-medium">
            You dont have any orders in progress
          </p>
          
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-black tap-target transition-transform hover:scale-[1.02] active:scale-95 shadow-sm"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            <Home size={18} strokeWidth={2.5} />
            Return to Menu
          </button>
        </div>,
        container
      ) : null}
    </>
  );
}
