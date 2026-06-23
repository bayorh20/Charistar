import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Bike, Loader, Clock, MapPin, ChefHat } from 'lucide-react';
import { useActiveOrder } from '../hooks/useActiveOrder';
import { STATUS_NOTIFICATIONS } from '../data/statusNotifications';

export default function ActiveOrderBanner() {
  const { activeOrder, loading } = useActiveOrder();
  const navigate = useNavigate();

  if (loading || !activeOrder) return null;

  const getStatusDetails = (status) => {
    const s = (status || 'pending').toLowerCase();
    const info = STATUS_NOTIFICATIONS[s] || STATUS_NOTIFICATIONS['pending'];
    switch (s) {
      case 'pending':
        return { 
          icon: <Clock size={18} className="text-yellow-400 animate-pulse" />, 
          text: info.bannerTitle, 
          desc: info.bannerDesc,
          progress: 15,
          colorClass: 'from-[#050505] via-[#0c0c05] to-yellow-500/5',
          borderClass: 'border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.06)]',
          badgeText: info.badgeLabel,
          badgeColor: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
        };
      case 'preparing':
      case 'processing':
        return { 
          icon: <ChefHat size={18} className="text-charistar-green animate-bounce" />, 
          text: info.bannerTitle, 
          desc: info.bannerDesc,
          progress: 45,
          colorClass: 'from-[#050505] via-[#050c05] to-charistar-green/5',
          borderClass: 'border-charistar-green/30 shadow-[0_0_20px_rgba(163,198,68,0.06)]',
          badgeText: info.badgeLabel,
          badgeColor: 'bg-[#A3C644]/10 text-charistar-green border-[#A3C644]/20'
        };
      case 'dispatched':
        return { 
          icon: <Bike size={18} className="text-purple-400 animate-pulse" />, 
          text: info.bannerTitle, 
          desc: info.bannerDesc,
          progress: 80,
          colorClass: 'from-[#050505] via-[#0c050f] to-purple-500/5',
          borderClass: 'border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.06)]',
          badgeText: info.badgeLabel,
          badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
        };
      default:
        return { 
          icon: <Loader size={18} className="text-gray-400 animate-spin" />, 
          text: info.bannerTitle, 
          desc: info.bannerDesc,
          progress: 10,
          colorClass: 'from-[#050505] to-white/5',
          borderClass: 'border-white/10',
          badgeText: info.badgeLabel,
          badgeColor: 'bg-white/10 text-white border-white/10'
        };
    }
  };

  const details = getStatusDetails(activeOrder.status);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        onClick={() => navigate(`/track-order/${activeOrder.id}`)}
        className={`mb-6 mx-5 cursor-pointer tap-target group relative overflow-hidden rounded-3xl border p-4 flex flex-col gap-3.5 bg-gradient-to-r ${details.colorClass} ${details.borderClass}`}
      >
        {/* Animated background sweep */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full group-hover:animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
        
        {/* Top block */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner relative flex-shrink-0">
              {details.icon}
              {activeOrder.status === 'dispatched' && (
                <div className="absolute -inset-1 rounded-xl border border-purple-500/50 animate-ping opacity-60"></div>
              )}
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-white font-black text-[14px] uppercase tracking-tight">{details.text}</h3>
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/5">
                  #{activeOrder.id.slice(-5).toUpperCase()}
                </span>
              </div>
              <p className="text-gray-400 text-[11px] font-semibold">{details.desc}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${details.badgeColor} tracking-wider`}>
              {details.badgeText}
            </span>
          </div>
        </div>

        {/* Bottom tracker block */}
        <div className="relative z-10 flex items-center gap-3 mt-1.5 pt-3.5 border-t border-white/5">
          {/* Thick progress bar */}
          <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden relative border border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${details.progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-charistar-green to-emerald-400 relative rounded-full"
            >
              <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse"></div>
            </motion.div>
          </div>
          
          {/* Call to action label */}
          <div className="flex items-center gap-1.5 text-charistar-green text-[10px] font-black uppercase tracking-wider group-hover:scale-105 transition-transform flex-shrink-0">
            <span className="w-1.5 h-1.5 bg-charistar-green rounded-full animate-ping" />
            <span>Track Order</span>
            <MapPin size={11} strokeWidth={3} />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
