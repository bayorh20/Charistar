import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';

export default function MarketingPopup() {
  const [campaign, setCampaign] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Only listen for active campaigns created very recently
    // To keep it simple, we just listen to the most recent active campaign
    const q = query(
      collection(db, 'campaigns'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        
        // Prevent showing old campaigns if user just loaded the app. 
        // We only show it if the campaign was created in the last 15 minutes
        const now = Date.now();
        const createdAt = data.createdAt?.toMillis() || now;
        const minutesSinceCreated = (now - createdAt) / (1000 * 60);

        if (minutesSinceCreated < 15) {
          // Avoid re-showing the exact same campaign if they already dismissed it this session
          const dismissedCampaigns = JSON.parse(sessionStorage.getItem('dismissedCampaigns') || '[]');
          if (!dismissedCampaigns.includes(doc.id)) {
            setCampaign({ id: doc.id, ...data });
            setIsVisible(true);
          }
        }
      } else {
        setIsVisible(false);
      }
    }, (err) => {
      // Silently ignore — campaigns collection may not exist or be restricted
      console.debug('[MarketingPopup] Campaign listener inactive:', err.code);
    });

    return () => unsubscribe();
  }, []);


  const handleDismiss = () => {
    setIsVisible(false);
    if (campaign) {
      const dismissed = JSON.parse(sessionStorage.getItem('dismissedCampaigns') || '[]');
      dismissed.push(campaign.id);
      sessionStorage.setItem('dismissedCampaigns', JSON.stringify(dismissed));
    }
  };

  const handleAction = () => {
    handleDismiss();
    if (campaign?.url) {
      navigate(campaign.url);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && campaign && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 pointer-events-none">
          {/* Overlay background just for the popup focus */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#050505]/60 backdrop-blur-sm pointer-events-auto"
            onClick={handleDismiss}
          />

          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: -20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-sm glass-panel rounded-[2rem] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-charistar-green/30 relative pointer-events-auto overflow-hidden bg-[#0a0a0a]"
          >
            {/* Glowing Accent */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-charistar-green/20 rounded-full blur-3xl"></div>

            <button 
              onClick={handleDismiss}
              className="absolute top-4 right-4 w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-gray-400 hover:text-white active:scale-90 transition-all z-10"
            >
              <X size={16} />
            </button>

            <div className="flex flex-col items-center text-center mt-2 relative z-10">
              <div className="w-16 h-16 bg-charistar-green/10 rounded-full flex items-center justify-center text-charistar-green mb-5 shadow-sm">
                <Zap size={32} className="animate-pulse" />
              </div>
              
              <h3 className="text-xl font-black text-white mb-2">{campaign.title}</h3>
              <p className="text-sm text-gray-400 mb-6 px-2">{campaign.message}</p>
              
              <button 
                onClick={handleAction}
                className="w-full bg-charistar-green text-black font-black uppercase tracking-widest text-xs py-4 rounded-2xl active:scale-95 transition-transform shadow-sm"
              >
                {campaign.url ? 'Check it out' : 'Got it!'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

