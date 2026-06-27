import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Star, Award, Zap, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import { playTick } from '../utils/sound';
import confetti from 'canvas-confetti';

export default function RewardsScreen() {
  const { 
    userPoints, 
    claimDailyBonus, 
    redeemReward, 
    unlockedPerks, 
    soundEnabled,
    storeConfig
  } = useContext(AppContext);

  const [activeTab, setActiveTab] = useState('REDEEM');
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  const rewardsConfig = storeConfig?.rewardsConfig || {
    nextTierPoints: 2000,
    spendPointsPerThousand: 10,
    referPoints: 500,
    reviewPoints: 50,
    rewardsList: [
      { id: 'free_delivery', title: 'Free Delivery', points: 500, icon: '🛵', color: '#3B82F6' },
      { id: 'ten_percent_off', title: '10% Off Order', points: 1000, icon: '🎟️', color: '#10B981' },
      { id: 'free_amala', title: 'Free VIP Amala', points: 2500, icon: '🍲', color: '#F59E0B' },
      { id: 'cashback_5k', title: '₦5000 Cashback', points: 5000, icon: '💸', color: '#8B5CF6' }
    ]
  };

  const nextTierPoints = rewardsConfig.nextTierPoints || 2000;
  const progress = Math.min(100, (userPoints / nextTierPoints) * 100);

  const rewards = rewardsConfig.rewardsList || [];

  const showToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMsg('');
    }, 3500);
  };

  const handleClaimDaily = () => {
    playTick(soundEnabled);
    const res = claimDailyBonus();
    if (res.success) {
      showToast(res.message, 'success');
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#FBBF24', '#FF5B26']
      });
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleRedeem = (reward) => {
    playTick(soundEnabled);
    if (unlockedPerks.includes(reward.id)) {
      showToast(`"${reward.title}" is already active for your next order! 🌟`, 'success');
      return;
    }
    const res = redeemReward(reward.id, reward.points);
    if (res.success) {
      showToast(`Successfully redeemed "${reward.title}"! 🎉`, 'success');
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#FF5B26']
      });
    } else {
      showToast(res.message, 'error');
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-app)', minHeight: '100%', paddingBottom: '100px', fontFamily: 'inherit', position: 'relative' }}>
      
      {/* Visual Toast Notification Banner */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'absolute',
              top: '12px',
              left: '16px',
              right: '16px',
              zIndex: 3000,
              background: toastType === 'success' ? '#10B981' : '#EF4444',
              color: '#FFFFFF',
              padding: '12px 16px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              fontSize: '0.8rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {toastType === 'success' ? <CheckCircle2 size={16} /> : <span>⚠️</span>}
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ padding: '16px 16px 8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <h2 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-main)', margin: 0, fontFamily: 'var(--font-accent)' }}>Loyalty Rewards</h2>
         <div style={{ background: 'var(--bg-card)', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <Award size={16} color="#FBBF24" />
            <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-main)' }}>Gold Tier</span>
         </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        
        {/* Main Balance Card (Glassmorphism + Gradient) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          style={{
            background: 'linear-gradient(135deg, #1C1512, #332B27)',
            borderRadius: '24px',
            padding: '24px',
            color: '#fff',
            boxShadow: '0 16px 32px rgba(28, 21, 18, 0.2)',
            position: 'relative',
            overflow: 'hidden',
            marginBottom: '24px'
          }}
        >
          {/* Background Glow */}
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '120px', height: '120px', background: 'rgba(251, 191, 36, 0.2)', borderRadius: '50%', filter: 'blur(30px)' }} />
          
          <span style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: '#A0948C', letterSpacing: '0.5px' }}>Available Points</span>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0 24px 0' }}>
            <Star size={36} color="#FBBF24" fill="#FBBF24" />
            <h1 style={{ fontSize: '48px', fontWeight: '900', margin: 0, lineHeight: 1, letterSpacing: '-1px', fontFamily: 'var(--font-accent)' }}>
              {userPoints.toLocaleString()}
            </h1>
          </div>

          {/* Progress Bar */}
          <div>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#A0948C' }}>{userPoints} pts</span>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#FBBF24' }}>
                  {userPoints >= nextTierPoints ? 'Platinum Tier Reached! 👑' : `${nextTierPoints - userPoints} pts to Platinum`}
                </span>
             </div>
             <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <motion.div 
                  initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, delay: 0.2 }}
                  style={{ height: '100%', background: 'linear-gradient(90deg, #F59E0B, #FBBF24)', borderRadius: '4px' }} 
                />
             </div>
          </div>
        </motion.div>

        {/* Animated Loyalty Order Streak */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.1 }}
          style={{ background: 'var(--bg-card)', borderRadius: '20px', padding: '20px', border: '1px solid var(--border-color)', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}
        >
          <motion.div 
            animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0], opacity: [0.1, 0.15, 0.1] }} 
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{ position: 'absolute', right: '-10px', top: '-20px', fontSize: '100px', transformOrigin: 'center' }}
          >
            🔥
          </motion.div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', position: 'relative', zIndex: 2 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-accent)' }}>
                <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>🔥</motion.span> 
                Daily Bonus Claim
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Claim free points once daily to build your streak!</p>
            </div>
            <button 
              onClick={handleClaimDaily}
              style={{ background: '#F59E0B', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: '900', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)' }}
            >
              <Zap size={14} fill="#fff" /> Claim Now
            </button>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', position: 'relative', zIndex: 2 }}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
              const isCompleted = i < 3;
              const isToday = i === 3;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <motion.div 
                    initial={false}
                    animate={{ 
                      scale: isCompleted ? 1 : (isToday ? [1, 1.1, 1] : 1),
                      boxShadow: isCompleted ? '0 4px 8px rgba(245, 158, 11, 0.3)' : (isToday ? '0 0 0 4px rgba(245, 158, 11, 0.1)' : 'none')
                    }}
                    transition={{ duration: 1.5, repeat: isToday ? Infinity : 0 }}
                    style={{ 
                      width: '36px', height: '36px', borderRadius: '50%', 
                      background: isCompleted ? '#F59E0B' : (isToday ? 'var(--bg-card)' : 'var(--bg-secondary)'),
                      border: isToday ? '2px dashed #F59E0B' : '1px solid var(--border-color)',
                      color: isCompleted ? '#fff' : (isToday ? '#F59E0B' : 'var(--text-muted)'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '14px', fontWeight: '900'
                    }}
                  >
                    {isCompleted ? '✓' : day}
                  </motion.div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '4px', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
          {['REDEEM', 'EARN MORE'].map(tab => (
            <button 
              key={tab}
              onClick={() => { setActiveTab(tab); playTick(soundEnabled); }}
              style={{
                flex: 1, padding: '10px 0', border: 'none', borderRadius: '12px',
                background: activeTab === tab ? 'var(--text-main)' : 'transparent',
                color: activeTab === tab ? 'var(--bg-card)' : 'var(--text-muted)',
                fontSize: '13px', fontWeight: '800', transition: '0.2s', cursor: 'pointer'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* REDEEM TAB */}
        {activeTab === 'REDEEM' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3 style={{ fontSize: '16px', fontWeight: '900', color: 'var(--text-main)', marginBottom: '16px', fontFamily: 'var(--font-accent)' }}>Claim Rewards</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
               {rewards.map((reward) => {
                  const isRedeemed = unlockedPerks.includes(reward.id);
                  const isLocked = userPoints < reward.points && !isRedeemed;
                  return (
                    <div key={reward.id} style={{ 
                      background: 'var(--bg-card)', borderRadius: '20px', padding: '16px', 
                      border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                      position: 'relative', overflow: 'hidden', opacity: isLocked ? 0.6 : 1
                    }}>
                       {isLocked && (
                          <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '50%' }}>
                             <Lock size={12} color="var(--text-muted)" />
                          </div>
                       )}
                       {isRedeemed && (
                          <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                             <Sparkles size={10} color="#10B981" />
                             <span style={{ fontSize: '8px', color: '#10B981', fontWeight: 800 }}>Active</span>
                          </div>
                       )}
                       <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${reward.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '12px' }}>
                          {reward.icon}
                       </div>
                       <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>{reward.title}</h4>
                       <p style={{ margin: '0 0 16px 0', fontSize: '12px', fontWeight: '800', color: reward.color }}>{reward.points.toLocaleString()} pts</p>
                       
                       <button 
                         onClick={() => handleRedeem(reward)}
                         disabled={isLocked}
                         style={{ 
                           width: '100%', padding: '10px', border: 'none', borderRadius: '10px', 
                           background: isRedeemed ? '#10B981' : (isLocked ? 'var(--bg-secondary)' : 'var(--text-main)'), 
                           color: isRedeemed ? '#fff' : (isLocked ? 'var(--text-muted)' : 'var(--bg-card)'), 
                           fontWeight: '800', fontSize: '12px', cursor: isLocked ? 'not-allowed' : 'pointer'
                         }}
                       >
                          {isRedeemed ? 'Redeemed ✓' : (isLocked ? 'Locked' : 'Redeem')}
                       </button>
                    </div>
                  );
               })}
            </div>
          </motion.div>
        )}

        {/* EARN MORE TAB */}
        {activeTab === 'EARN MORE' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3 style={{ fontSize: '16px', fontWeight: '900', color: 'var(--text-main)', marginBottom: '16px', fontFamily: 'var(--font-accent)' }}>How to earn points</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
               {[
                 { icon: <Zap size={20} color="#F59E0B" />, title: 'Place an Order', desc: `Earn ${rewardsConfig.spendPointsPerThousand || 10} points for every ₦1000 spent`, pts: 'Variable' },
                 { icon: <Gift size={20} color="#10B981" />, title: 'Refer a Friend', desc: 'When they make their first order', pts: `+${rewardsConfig.referPoints || 500} pts` },
                 { icon: <Star size={20} color="#3B82F6" />, title: 'Leave a Review', desc: 'Rate your food delivery experience', pts: `+${rewardsConfig.reviewPoints || 50} pts` }
               ].map((way, i) => (
                  <div key={i} style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           {way.icon}
                        </div>
                        <div>
                           <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>{way.title}</h4>
                           <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>{way.desc}</p>
                        </div>
                     </div>
                     <span style={{ fontSize: '13px', fontWeight: '900', color: 'var(--text-main)' }}>{way.pts}</span>
                  </div>
               ))}
            </div>
          </motion.div>
        )}
        
      </div>
    </div>
  );
}
