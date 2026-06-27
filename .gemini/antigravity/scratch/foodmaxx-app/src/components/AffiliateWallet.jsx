import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowDownToLine, Share2, Copy, CheckCircle2, TrendingUp, Users, ArrowUpRight, X, Mail, Image, Link, Trophy, Settings as SettingsIcon, Medal, Banknote, Edit3, ChevronDown, LayoutDashboard, Phone, MessageSquare } from 'lucide-react';
import { playTick } from '../utils/sound';
import { db, auth } from '../firebase/config';
import { doc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const MOCK_TRANSACTIONS = [
  { id: 1, title: 'Commission (Order #1042)', date: 'Today, 10:45 AM', amount: '+₦500', type: 'credit', rawAmount: 500 },
  { id: 2, title: 'Withdrawal to GTBank', date: 'Yesterday', amount: '-₦15,000', type: 'debit', rawAmount: 15000 },
  { id: 3, title: 'Commission (Order #992)', date: 'Oct 12, 2:30 PM', amount: '+₦1,200', type: 'credit', rawAmount: 1200 },
];

const MOCK_LOGS = [
  { time: '10:45 AM', day: 'Today', event: 'New Signup', category: 'SIGNUPS', desc: 'Sarah logged in via your link', icon: '👤', color: 'var(--secondary)' },
  { time: '09:20 AM', day: 'Today', event: 'Link Clicked', category: 'CLICKS', desc: 'Campaign: IG_Story_Promo', icon: '🔗', color: '#3B82F6' },
  { time: 'Yesterday', day: 'Yesterday', event: 'First Order', category: 'ORDERS', desc: 'Mike bought Amala Combo (₦4,500)', icon: '🛍️', color: '#F59E0B' },
  { time: 'Yesterday', day: 'Yesterday', event: 'Commission Paid', category: 'EARNINGS', desc: '₦225 added to wallet', icon: '💸', color: 'var(--primary)' },
  { time: 'Oct 12', day: 'Older', event: 'Link Clicked', category: 'CLICKS', desc: 'Campaign: WhatsApp_Broadcast', icon: '🔗', color: '#3B82F6' },
  { time: 'Oct 11', day: 'Older', event: 'New Signup', category: 'SIGNUPS', desc: 'David joined via campaign link', icon: '👤', color: 'var(--secondary)' },
  { time: 'Oct 10', day: 'Older', event: 'Commission Paid', category: 'EARNINGS', desc: '₦1,200 added to wallet', icon: '💸', color: 'var(--primary)' }
];

const AffiliateWallet = () => {
  const [activeTab, setActiveTab] = useState('HOME');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [activityFilter, setActivityFilter] = useState('ALL');
  
  const menuRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [walletBalance, setWalletBalance] = useState(145500);
  const [referralLink, setReferralLink] = useState("https://foodmaxx.app/ref/JOHN123");
  
  const [transactions, setTransactions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ views: 1200, clicks: 342, signups: 28 });

  const [bankName, setBankName] = useState('Guaranty Trust Bank');
  const [accountNo, setAccountNo] = useState('0123456789');
  const [accountName, setAccountName] = useState('John Doe');

  const [isEditingPayout, setIsEditingPayout] = useState(false);
  const [tempBank, setTempBank] = useState('Guaranty Trust Bank');
  const [tempAccountNo, setTempAccountNo] = useState('0123456789');
  const [tempAccountName, setTempAccountName] = useState('John Doe');

  useEffect(() => {
    setTempBank(bankName);
    setTempAccountNo(accountNo);
    setTempAccountName(accountName);
  }, [bankName, accountNo, accountName]);

  useEffect(() => {
    if (!db || !auth) {
      setTransactions(MOCK_TRANSACTIONS);
      setLogs(MOCK_LOGS);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const affDocRef = doc(db, 'affiliates', user.uid);
        const unsubscribeDoc = onSnapshot(affDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setWalletBalance(data.balance !== undefined ? data.balance : 0);
            setBankName(data.bankName || 'Guaranty Trust Bank');
            setAccountNo(data.accountNo || '0123456789');
            setAccountName(data.accountName || 'John Doe');
            setReferralLink(`https://foodmaxx.app/ref/${data.code || user.uid.slice(0, 7).toUpperCase()}`);
            setStats({
              views: data.views !== undefined ? data.views : 1200,
              clicks: data.clicks !== undefined ? data.clicks : 342,
              signups: data.signups !== undefined ? data.signups : 28
            });
            setTransactions(data.transactions || MOCK_TRANSACTIONS);
            setLogs(data.logs || MOCK_LOGS);
          } else {
            const defaultCode = user.uid.slice(0, 7).toUpperCase();
            setDoc(affDocRef, {
              userId: user.uid,
              balance: 145500,
              bankName: 'Guaranty Trust Bank',
              accountNo: '0123456789',
              accountName: user.displayName || 'John Doe',
              code: defaultCode,
              views: 1200,
              clicks: 342,
              signups: 28,
              transactions: MOCK_TRANSACTIONS,
              logs: MOCK_LOGS,
              createdAt: new Date().toISOString()
            }).catch(err => console.error("Error seeding affiliate doc:", err));
          }
        }, (err) => {
          console.warn("Firestore affiliate snapshot listener failed:", err);
        });
        return () => unsubscribeDoc();
      } else {
        setTransactions([]);
        setLogs([]);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    playTick(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWithdraw = (e) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount) || walletBalance;
    if (amt <= 0) return;
    if (amt > walletBalance) {
      alert('Insufficient wallet balance!');
      return;
    }

    const newTx = {
      id: Date.now(),
      title: `Withdrawal to ${bankName}`,
      date: 'Just now',
      amount: `-₦${amt.toLocaleString()}`,
      type: 'debit',
      rawAmount: amt
    };

    const newLog = {
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      day: 'Today',
      event: 'Withdrawal Requested',
      category: 'EARNINGS',
      desc: `Withdrew ₦${amt.toLocaleString()} to ${bankName}`,
      icon: '💸',
      color: 'var(--primary)'
    };

    if (db && auth.currentUser) {
      updateDoc(doc(db, 'affiliates', auth.currentUser.uid), {
        balance: walletBalance - amt,
        transactions: [newTx, ...transactions],
        logs: [newLog, ...logs]
      }).catch(err => console.error("Error recording withdrawal:", err));
    } else {
      setWalletBalance(prev => prev - amt);
      setTransactions(prev => [newTx, ...prev]);
    }

    setShowWithdrawModal(false);
    setWithdrawAmount('');
    alert(`Withdrawal request of ₦${amt.toLocaleString()} has been sent to your bank! 🏦`);
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-app)', minHeight: '100%', paddingBottom: '100px', fontFamily: 'inherit' }}>
      
      {/* Top Nav (Dashboard Dropdown Menu) */}
      <div ref={menuRef} style={{ padding: '16px', position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'var(--glass-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <div 
          onClick={() => { setIsMenuOpen(!isMenuOpen); playTick(true); }}
          style={{ 
            background: 'var(--bg-card)', padding: '14px 16px', borderRadius: '16px', 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
            boxShadow: '0 4px 12px rgba(26, 21, 18, 0.05)', border: '1px solid var(--border-color)',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
             <div style={{ width: '32px', height: '32px', background: 'var(--primary-glow)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <LayoutDashboard size={18} />
             </div>
             <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Wallet Menu</span>
                <span style={{ fontSize: '15px', color: 'var(--text-main)', fontWeight: '900' }}>{activeTab}</span>
             </div>
          </div>
          <ChevronDown size={20} color="#8E867E" style={{ transform: isMenuOpen ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />
        </div>
        
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
               initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.2 }}
               style={{ 
                 position: 'absolute', top: '80px', left: '16px', right: '16px', 
                 background: 'var(--bg-card)', borderRadius: '16px', boxShadow: '0 12px 32px rgba(0,0,0,0.12)', 
                 border: '1px solid var(--border-color)', overflow: 'hidden', zIndex: 100 
               }}
            >
               {['HOME', 'ANALYTICS', 'REWARD STRATEGIES', 'REFERRAL DETAILS', 'MARKETING TOOLS', 'LEADERBOARD', 'PROFILE'].map(tab => (
                  <div 
                    key={tab}
                    onClick={() => { setActiveTab(tab); setIsMenuOpen(false); playTick(true); }}
                    style={{ 
                      padding: '16px 20px', borderBottom: '1px solid var(--border-color)', 
                      background: activeTab === tab ? 'rgba(255, 91, 38, 0.04)' : '#FFFFFF', 
                      color: activeTab === tab ? '#FF5B26' : '#1C1512', 
                      fontWeight: '800', fontSize: '13px', display: 'flex', justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                  >
                    {tab}
                    {activeTab === tab && <CheckCircle2 size={16} />}
                  </div>
               ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ padding: '16px' }}>
        <AnimatePresence mode="wait">
          
          {/* HOME TAB */}
          {activeTab === 'HOME' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Profile Header (Name, Image, Date Joined) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--bg-secondary)', border: '2px solid #FF5B26', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(255, 91, 38, 0.15)', overflow: 'hidden' }}>
                  <img loading="lazy" decoding="async" src="https://i.pravatar.cc/150?img=33" alt="John Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Hi, John! 👋</h2>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Marketer since Oct 2026</p>
                </div>
              </div>



              {/* Premium Glassmorphic Orange Card */}
              <div style={{
                background: 'linear-gradient(135deg, #FF6D3B, #E04818)',
                borderRadius: '24px',
                padding: '24px',
                color: '#fff',
                boxShadow: '0 16px 32px rgba(255, 91, 38, 0.25)',
                marginBottom: '24px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(20px)' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', position: 'relative', zIndex: 2 }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', opacity: 0.9, letterSpacing: '0.5px' }}>Total Earnings</span>
                  <button onClick={() => setShowBalance(!showBalance)} style={{ background: 'transparent', border: 'none', color: '#fff', opacity: 0.8, cursor: 'pointer' }}>
                    {showBalance ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px', position: 'relative', zIndex: 2 }}>
                  <span style={{ fontSize: '24px', fontWeight: '800' }}>₦</span>
                  <h1 style={{ fontSize: '42px', fontWeight: '900', margin: 0, letterSpacing: '-1px' }}>
                    {showBalance ? walletBalance.toLocaleString() : '••••'}
                  </h1>
                </div>

                <button 
                  onClick={() => setShowWithdrawModal(true)} 
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    padding: '14px',
                    borderRadius: '16px',
                    color: '#fff',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '15px'
                  }}
                >
                  <ArrowDownToLine size={18} /> Withdraw Funds
                </button>
              </div>

              {/* Get a Reward Banner */}
              <div style={{ background: '#1C1512', borderRadius: '16px', padding: '20px', marginBottom: '24px', color: 'var(--text-white)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#FBBF24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🎁 Get a Reward!
                  </h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Refer 5 more users to unlock a free VIP meal.</p>
                </div>
                <button 
                  onClick={() => { alert('Congratulations! You claimed your free VIP meal voucher. Check your rewards! 🎁'); playTick(true); }}
                  style={{ background: '#FBBF24', color: 'var(--text-main)', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: '900', fontSize: '12px', cursor: 'pointer' }}
                >
                  Claim
                </button>
              </div>

              {/* Activity Analysis */}
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '16px' }}>Activity Analysis</h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr 1fr', 
                gap: '8px', 
                marginBottom: '24px' 
              }}>
                {[
                  { label: 'Views', value: stats.views.toLocaleString(), change: '+12%', color: '#3B82F6', icon: <Eye size={16} color="#3B82F6" /> },
                  { label: 'Clicks', value: stats.clicks.toLocaleString(), change: '+5%', color: '#F59E0B', icon: <TrendingUp size={16} color="#F59E0B" /> },
                  { label: 'Signups', value: stats.signups.toLocaleString(), change: '+2%', color: 'var(--secondary)', icon: <Users size={16} color="#10B981" /> }
                ].map((stat, i) => (
                  <div key={i} style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '16px 12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ marginBottom: '8px', background: stat.color + '15', padding: '6px', borderRadius: '10px' }}>
                      {stat.icon}
                    </div>
                    <span style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-main)', lineHeight: 1 }}>{stat.value}</span>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>{stat.label}</span>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: stat.color, marginTop: '8px', background: stat.color + '10', padding: '2px 6px', borderRadius: '4px' }}>{stat.change}</span>
                  </div>
                ))}
              </div>

              {/* Transaction History (Clean List) */}
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '16px' }}>Recent Activity</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {transactions.map(tx => (
                  <div key={tx.id} style={{
                    background: 'var(--bg-card)',
                    borderRadius: '16px',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 2px 8px rgba(26, 21, 18, 0.04)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '12px',
                        background: tx.type === 'credit' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 91, 38, 0.1)',
                        color: tx.type === 'credit' ? '#10B981' : '#FF5B26',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {tx.type === 'credit' ? <ArrowUpRight size={18} /> : <ArrowDownToLine size={18} />}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>{tx.title}</p>
                        <p style={{ margin: 0, fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)', marginTop: '2px' }}>{tx.date}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: '15px', fontWeight: '900', color: tx.type === 'credit' ? '#10B981' : '#1C1512' }}>
                      {tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* REFERRAL DETAILS TAB */}
          {activeTab === 'REFERRAL DETAILS' && (
            <motion.div 
              key="referrals"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '20px', textAlign: 'center', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  <Users size={24} color="#FF5B26" style={{ marginBottom: '8px' }} />
                  <p style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Total Referrals</p>
                  <p style={{ fontSize: '28px', fontWeight: '900', color: 'var(--text-main)', margin: 0 }}>{stats.signups}</p>
                </div>
                <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '20px', textAlign: 'center', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  <TrendingUp size={24} color="#10B981" style={{ marginBottom: '8px' }} />
                  <p style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Conversion</p>
                  <p style={{ fontSize: '28px', fontWeight: '900', color: 'var(--text-main)', margin: 0 }}>{stats.clicks > 0 ? Math.round((stats.signups / stats.clicks) * 100) : 12}%</p>
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '20px', marginBottom: '24px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Share2 size={16} color="#FF5B26" /> Your Referral Link
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>Share this link to earn 5% commission on every new customer's first order.</p>
                
                <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: '12px', padding: '4px', alignItems: 'center' }}>
                  <input type="text" readOnly value={referralLink} style={{ flex: 1, background: 'transparent', border: 'none', padding: '0 12px', fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', outline: 'none' }} />
                  <button onClick={handleCopy} style={{ background: copied ? '#10B981' : '#FFFFFF', color: copied ? '#FFFFFF' : '#FF5B26', border: 'none', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Referred Customers</h3>
                <span onClick={() => { setActiveTab('ANALYTICS'); playTick(true); }} style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary)', background: 'var(--primary-glow)', padding: '4px 10px', borderRadius: '12px', cursor: 'pointer' }}>View Full Analytics</span>
              </div>
              <div style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                {[
                  { name: 'Alice Williams', status: 'Active', spent: '₦45,000', comm: '₦2,250', time: 'Last order: 2 days ago', image: 'https://i.pravatar.cc/150?u=alice', phone: '+2348031234567' },
                  { name: 'Chuks Okafor', status: 'Dormant', spent: '₦12,500', comm: '₦625', time: 'Last order: 3 weeks ago', image: 'https://i.pravatar.cc/150?u=chuks', phone: '+2348129876543' },
                  { name: 'Michael Johnson', status: 'Active', spent: '₦8,000', comm: '₦400', time: 'Just signed up', image: 'https://i.pravatar.cc/150?u=michael', phone: '+2349055554321' }
                ].map((user, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', padding: '16px', borderBottom: i === 2 ? 'none' : '1px solid #ECE9E2' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                           <img loading="lazy" decoding="async" src={user.image} alt={user.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ECE9E2' }} />
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: '14px', fontWeight: '900', color: 'var(--text-main)' }}>{user.name}</span>
                              <span style={{ fontSize: '10px', fontWeight: '800', color: user.status === 'Active' ? '#10B981' : '#F59E0B', background: user.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', padding: '2px 6px', borderRadius: '6px', textTransform: 'uppercase', width: 'max-content' }}>{user.status}</span>
                           </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px' }}>
                           {/* WhatsApp Chat Button */}
                           <a 
                             href={`https://wa.me/${user.phone.replace(/[^0-9]/g, '')}`} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             onClick={() => playTick(true)}
                             style={{ 
                               width: '32px', 
                               height: '32px', 
                               borderRadius: '8px', 
                               background: 'rgba(52, 211, 153, 0.1)', 
                               color: 'var(--secondary)', 
                               display: 'flex', 
                               alignItems: 'center', 
                               justify: 'center',
                               textDecoration: 'none',
                               border: '1px solid rgba(16, 185, 129, 0.2)',
                               transition: '0.2s'
                             }}
                             title={`Chat with ${user.name} on WhatsApp`}
                           >
                              <MessageSquare size={14} />
                           </a>

                           {/* Phone Call Button */}
                           <a 
                             href={`tel:${user.phone}`} 
                             onClick={() => playTick(true)}
                             style={{ 
                               width: '32px', 
                               height: '32px', 
                               borderRadius: '8px', 
                               background: 'rgba(59, 130, 246, 0.1)', 
                               color: '#3B82F6', 
                               display: 'flex', 
                               alignItems: 'center', 
                               justify: 'center',
                               textDecoration: 'none',
                               border: '1px solid rgba(59, 130, 246, 0.2)',
                               transition: '0.2s'
                             }}
                             title={`Call ${user.name}`}
                           >
                              <Phone size={14} />
                           </a>
                        </div>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '10px', borderRadius: '12px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>{user.time}</span>
                        <div style={{ display: 'flex', gap: '12px' }}>
                           <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-main)' }}>Spent: {user.spent}</span>
                           <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--secondary)' }}>Earned: {user.comm}</span>
                        </div>
                     </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* MARKETING TOOLS TAB */}
          {activeTab === 'MARKETING TOOLS' && (
            <motion.div 
              key="marketing"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              {[
                { icon: <Image size={24} color="#FF5B26" />, title: 'Promo Banners', desc: 'Download graphics for your social media' },
                { icon: <Mail size={24} color="#FF5B26" />, title: 'Email Templates', desc: 'Pre-written emails to send to your network' },
                { icon: <Link size={24} color="#FF5B26" />, title: 'Custom Deep Links', desc: 'Generate links to specific menu items' }
              ].map((tool, i) => (
                <div key={i} style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {tool.icon}
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '800', color: 'var(--text-main)' }}>{tool.title}</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>{tool.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* LEADERBOARD TAB */}
          {activeTab === 'LEADERBOARD' && (
            <motion.div 
              key="leaderboard"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div style={{ background: '#1C1512', borderRadius: '24px', padding: '24px', color: 'var(--text-white)', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '900', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Trophy size={18} color="#FBBF24" /> Marketer Contest
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 20px 0', lineHeight: 1.4 }}>Refer 50 users this month to win a Free Amala VIP Combo!</p>
                <div style={{ height: '8px', background: '#332B27', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, Math.round((stats.signups / 50) * 100))}%`, height: '100%', background: '#FBBF24', borderRadius: '4px' }} />
                </div>
                <p style={{ margin: '8px 0 0 0', fontSize: '11px', fontWeight: '800', textAlign: 'right', color: '#FBBF24', letterSpacing: '1px' }}>{stats.signups} / 50 REFERRALS</p>
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '16px' }}>Top Affiliates</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(() => {
                  const leaderboardList = [
                    { id: 1, name: 'Seye Alabi', refs: 142, color: '#FBBF24' },
                    { id: 2, name: `${accountName.split(' ')[0]} (You)`, refs: stats.signups, color: '#9CA3AF' },
                    { id: 3, name: 'Tosin A.', refs: 18, color: '#B45309' },
                  ];
                  leaderboardList.sort((a, b) => b.refs - a.refs);
                  const rankedList = leaderboardList.map((usr, index) => ({
                    ...usr,
                    rank: index + 1,
                    color: index === 0 ? '#FBBF24' : (index === 1 ? '#9CA3AF' : '#B45309')
                  }));
                  return rankedList.map((usr) => (
                    <div key={usr.id} style={{
                      background: 'var(--bg-card)', padding: '16px', borderRadius: '16px', border: usr.id === 2 ? '2px solid #FF5B26' : '1px solid #ECE9E2',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justify: 'center', fontWeight: '900', color: 'var(--text-muted)' }}>
                          {usr.rank <= 3 ? <Medal size={18} color={usr.color} /> : `#${usr.rank}`}
                        </div>
                        <div>
                          <p style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>{usr.name}</p>
                          <p style={{ margin: 0, fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rank #{usr.rank}</p>
                        </div>
                      </div>
                      <div style={{ background: 'var(--primary-glow)', padding: '6px 12px', borderRadius: '10px' }}>
                        <span style={{ fontSize: '15px', fontWeight: '900', color: 'var(--primary)' }}>{usr.refs}</span>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--primary)', marginLeft: '4px', textTransform: 'uppercase' }}>Refs</span>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </motion.div>
          )}

          {/* ANALYTICS & PROGRESS PORTAL */}
          {activeTab === 'ANALYTICS' && (
            <motion.div 
              key="analytics"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Progress Tracker */}
              <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border-color)', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '900', color: 'var(--text-main)', margin: '0 0 4px 0' }}>Monthly Target</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 16px 0', fontWeight: '600' }}>Your progress toward the 50 onboard target.</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '28px', fontWeight: '900', color: 'var(--text-main)', lineHeight: 1 }}>{stats.signups}</span>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--secondary)', background: 'rgba(52, 211, 153, 0.1)', padding: '4px 8px', borderRadius: '8px' }}>{Math.min(100, Math.round((stats.signups / 50) * 100))}% Completed</span>
                </div>
                <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, Math.round((stats.signups / 50) * 100))}%` }} transition={{ duration: 1 }} style={{ height: '100%', background: 'linear-gradient(90deg, #FF6D3B, #E04818)', borderRadius: '4px' }} />
                </div>
                <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{Math.max(0, 50 - stats.signups)} more to hit your goal</p>
              </div>

              {/* Onboarding Stats Grid */}
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '12px' }}>Onboarding Rate</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '24px' }}>
                {[
                  { label: 'Today', value: Math.round(stats.signups * 0.1).toString(), trend: '+1', color: '#3B82F6' },
                  { label: 'This Week', value: Math.round(stats.signups * 0.6).toString(), trend: '+5', color: 'var(--secondary)' },
                  { label: 'This Month', value: stats.signups.toString(), trend: '+12', color: '#F59E0B' }
                ].map((stat, i) => (
                  <div key={i} style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>{stat.label}</span>
                    <span style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-main)', marginBottom: '4px' }}>{stat.value}</span>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: stat.color, background: stat.color + '15', padding: '2px 6px', borderRadius: '4px' }}>{stat.trend}</span>
                  </div>
                ))}
              </div>

              {/* Detailed Activity Log */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Detailed Activity Log</h3>
              </div>

              {/* Category Filter Pills */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                {[
                  { id: 'ALL', label: 'All', icon: '⚡', color: 'var(--primary)' },
                  { id: 'CLICKS', label: 'Clicks', icon: '🔗', color: '#3B82F6' },
                  { id: 'SIGNUPS', label: 'Signups', icon: '👤', color: 'var(--secondary)' },
                  { id: 'ORDERS', label: 'Orders', icon: '🛍️', color: '#F59E0B' },
                  { id: 'EARNINGS', label: 'Earnings', icon: '💸', color: '#8B5CF6' }
                ].map((pill) => {
                  const allLogs = logs.length > 0 ? logs : MOCK_LOGS;
                  const isActive = activityFilter === pill.id;
                  const count = pill.id === 'ALL' ? allLogs.length : allLogs.filter(l => l.category === pill.id).length;
                  return (
                    <button
                      key={pill.id}
                      onClick={() => { setActivityFilter(pill.id); playTick(true); }}
                      style={{
                        flexShrink: 0,
                        background: isActive ? pill.color : '#FFFFFF',
                        color: isActive ? '#FFFFFF' : '#574D47',
                        border: isActive ? `1px solid ${pill.color}` : '1px solid #ECE9E2',
                        borderRadius: '20px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        boxShadow: isActive ? `0 4px 10px ${pill.color}30` : '0 2px 6px rgba(0,0,0,0.02)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span>{pill.icon}</span>
                      <span>{pill.label}</span>
                      <span style={{ 
                        background: isActive ? 'rgba(255, 255, 255, 0.25)' : '#F0EDE8', 
                        color: isActive ? '#FFFFFF' : '#8E867E',
                        padding: '2px 6px',
                        borderRadius: '8px',
                        fontSize: '10px',
                        fontWeight: '900'
                      }}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Log Timeline grouped by day */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(() => {
                  const allLogs = logs.length > 0 ? logs : MOCK_LOGS;

                  const filteredLogs = allLogs.filter(log => activityFilter === 'ALL' || log.category === activityFilter);
                  const groups = ['Today', 'Yesterday', 'Older'];

                  if (filteredLogs.length === 0) {
                    return (
                      <div style={{ textAlign: 'center', padding: '40px 16px', background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', marginTop: '8px' }}>
                        <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>🔍</span>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>No logs found</h4>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>No activity matching this category was recorded.</p>
                      </div>
                    );
                  }

                  return groups.map(group => {
                    const logsInGroup = filteredLogs.filter(log => log.day === group);
                    if (logsInGroup.length === 0) return null;
                    return (
                      <div key={group} style={{ marginBottom: '12px' }}>
                        <h4 style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{group === 'Older' ? 'Earlier Activity' : group}</span>
                          <div style={{ flex: 1, height: '1px', background: '#ECE9E2' }} />
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {logsInGroup.map((log, idx) => (
                            <motion.div
                              layout
                              initial={{ opacity: 0, scale: 0.96 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.2 }}
                              key={log.event + log.time + idx}
                              style={{ 
                                display: 'flex', 
                                gap: '14px', 
                                background: 'var(--bg-card)', 
                                padding: '14px 16px', 
                                borderRadius: '20px', 
                                border: '1px solid var(--border-color)', 
                                boxShadow: '0 4px 12px rgba(26,21,18,0.01)',
                                position: 'relative'
                              }}
                            >
                              <div style={{ 
                                width: '40px', 
                                height: '40px', 
                                borderRadius: '14px', 
                                background: log.color + '12', 
                                color: log.color,
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                fontSize: '18px', 
                                flexShrink: 0 
                              }}>
                                {log.icon}
                              </div>
                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '14px', fontWeight: '900', color: 'var(--text-main)' }}>{log.event}</span>
                                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>{log.time}</span>
                                </div>
                                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-main)', fontWeight: '500', lineHeight: 1.4 }}>
                                  {log.desc}
                                </p>
                                <div style={{ display: 'flex', marginTop: '4px' }}>
                                  <span style={{ 
                                    fontSize: '9px', 
                                    fontWeight: '900', 
                                    color: log.color, 
                                    background: log.color + '12', 
                                    padding: '2px 8px', 
                                    borderRadius: '6px', 
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px' 
                                  }}>
                                    {log.category}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </motion.div>
          )}

          {/* REWARD STRATEGIES TAB */}
          {activeTab === 'REWARD STRATEGIES' && (
            <motion.div 
              key="reward_strategies"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div style={{ background: '#1C1512', borderRadius: '24px', padding: '24px', color: 'var(--text-white)', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-50px', right: '-20px', width: '120px', height: '120px', background: 'rgba(251, 191, 36, 0.2)', borderRadius: '50%', filter: 'blur(30px)' }} />
                <h3 style={{ fontSize: '20px', fontWeight: '900', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 2, position: 'relative' }}>
                  <Trophy size={20} color="#FBBF24" /> Active Challenges
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 20px 0', lineHeight: 1.4, zIndex: 2, position: 'relative' }}>Maximize your earnings by completing these exclusive marketer milestones.</p>
                <div style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '16px', padding: '16px', zIndex: 2, position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-white)' }}>Weekend Warrior</span>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-main)', background: '#FBBF24', padding: '4px 8px', borderRadius: '8px' }}>1.5x Multiplier</span>
                  </div>
                  <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--text-muted)' }}>Earn 1.5x commission on all referral orders placed between Friday 5PM and Sunday Midnight.</p>
                  <div style={{ height: '6px', background: 'rgba(0,0,0,0.3)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: '100%', background: '#FBBF24', borderRadius: '3px' }} />
                  </div>
                  <p style={{ margin: '8px 0 0 0', fontSize: '10px', fontWeight: '800', color: 'var(--secondary)', textAlign: 'right' }}>ACTIVATED UNTIL SUN 11:59PM</p>
                </div>
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '16px' }}>Unlockable Bonuses</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { title: 'The Fast Onboarder', desc: 'Get an extra ₦2,000 bonus if a new referral makes their first order within 48 hours of signing up.', req: 'Requires: 1 quick conversion', progress: '0/1', icon: '⚡', color: '#3B82F6', isLocked: false },
                  { title: 'Whale Hunter', desc: 'Secure a massive ₦5,000 instant bonus when any of your referrals places a single order above ₦30,000.', req: 'Requires: ₦30k single order', progress: 'Current highest: ₦18k', icon: '🐳', color: '#8B5CF6', isLocked: false },
                  { title: 'Power Recruiter', desc: 'Refer at least 15 active customers to unlock a permanent +1% base commission boost.', req: 'Requires: 15 Referrals', progress: '9/15 Referrals', icon: '🔥', color: '#F59E0B', isLocked: false },
                  { title: 'The Centurion', desc: 'Hit 100 total active referrals to receive a personalized FoodMaxx Care Package delivered to your door + ₦20,000 cash.', req: 'Requires: 100 Referrals', progress: '24/100', icon: '👑', color: 'var(--primary)', isLocked: true }
                ].map((strat, i) => (
                  <div key={i} style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '20px', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                    {strat.isLocked && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(2px)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ background: '#1C1512', color: '#fff', padding: '8px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '800' }}>LOCKED</div></div>}
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: strat.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
                        {strat.icon}
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '900', color: 'var(--text-main)' }}>{strat.title}</h4>
                        <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--text-main)', lineHeight: 1.4 }}>{strat.desc}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '10px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>{strat.req}</span>
                          <span style={{ fontSize: '11px', fontWeight: '800', color: strat.color }}>{strat.progress}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'PROFILE' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Profile Card */}
              <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border-color)', marginBottom: '24px', textAlign: 'center' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-secondary)', margin: '0 auto 16px auto', overflow: 'hidden', border: '4px solid #fff', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
                  <img loading="lazy" decoding="async" src="https://i.pravatar.cc/150?img=33" alt="John Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '900', color: 'var(--text-main)' }}>John Doe</h2>
                <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>john.doe@marketing.com • +234 800 000 0000</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                  <button style={{ background: 'var(--primary)', color: 'var(--text-white)', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '800', fontSize: '13px' }}>Edit Profile</button>
                  <button style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '800', fontSize: '13px' }}>Share ID Card</button>
                </div>
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Banknote size={18} color="#FF5B26" /> Payout Account
              </h3>
              <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
                {isEditingPayout ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px' }}>BANK NAME</label>
                      <input 
                        type="text" 
                        value={tempBank} 
                        onChange={(e) => setTempBank(e.target.value)} 
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '13px', background: 'var(--bg-secondary)', outline: 'none', color: 'var(--text-main)', fontWeight: 700 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px' }}>ACCOUNT NUMBER</label>
                      <input 
                        type="text" 
                        value={tempAccountNo} 
                        onChange={(e) => setTempAccountNo(e.target.value)} 
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '13px', background: 'var(--bg-secondary)', outline: 'none', color: 'var(--text-main)', fontWeight: 700 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px' }}>ACCOUNT NAME</label>
                      <input 
                        type="text" 
                        value={tempAccountName} 
                        onChange={(e) => setTempAccountName(e.target.value)} 
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '13px', background: 'var(--bg-secondary)', outline: 'none', color: 'var(--text-main)', fontWeight: 700 }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button 
                        type="button"
                        onClick={() => setIsEditingPayout(false)} 
                        style={{ flex: 1, padding: '10px', background: 'var(--bg-secondary)', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setBankName(tempBank);
                          setAccountNo(tempAccountNo);
                          setAccountName(tempAccountName);
                          setIsEditingPayout(false);
                          playTick(true);
                          if (db && auth.currentUser) {
                            updateDoc(doc(db, 'affiliates', auth.currentUser.uid), {
                              bankName: tempBank,
                              accountNo: tempAccountNo,
                              accountName: tempAccountName
                            }).catch(err => console.error("Error saving bank details:", err));
                          }
                        }} 
                        style={{ flex: 1, padding: '10px', background: 'var(--primary)', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 800, color: 'var(--text-white)', cursor: 'pointer' }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {[
                      { label: 'Bank Name', value: bankName },
                      { label: 'Account Number', value: accountNo },
                      { label: 'Account Name', value: accountName }
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', marginBottom: '12px', borderBottom: i === 2 ? 'none' : '1px solid #ECE9E2' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{item.label}</span>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>{item.value}</span>
                      </div>
                    ))}
                    <button 
                      onClick={() => {
                        setTempBank(bankName);
                        setTempAccountNo(accountNo);
                        setTempAccountName(accountName);
                        setIsEditingPayout(true);
                        playTick(true);
                      }}
                      style={{ width: '100%', padding: '12px', background: 'var(--bg-secondary)', color: 'var(--primary)', border: 'none', borderRadius: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px', cursor: 'pointer' }}
                    >
                      <Edit3 size={16} /> Edit Details
                    </button>
                  </>
                )}
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SettingsIcon size={18} color="#FF5B26" /> Preferences
              </h3>
              <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>Email Notifications</p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Alert me for new signups</p>
                  </div>
                  <div style={{ width: '44px', height: '24px', background: '#10B981', borderRadius: '12px', position: 'relative' }}>
                    <div style={{ width: '20px', height: '20px', background: 'var(--bg-card)', borderRadius: '50%', position: 'absolute', top: '2px', right: '2px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                  </div>
                </div>
                
                <div style={{ height: '1px', background: '#ECE9E2', margin: '0 0 16px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>Custom Link Slug</p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>{referralLink.replace('https://', '')}</p>
                  </div>
                  <button 
                    onClick={() => {
                      const newSlug = prompt("Enter new referral code / slug (alphanumeric only):");
                      if (newSlug && newSlug.trim()) {
                        const cleanSlug = newSlug.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
                        if (cleanSlug) {
                          if (db && auth.currentUser) {
                            updateDoc(doc(db, 'affiliates', auth.currentUser.uid), {
                              code: cleanSlug
                            }).catch(err => console.error("Error updating affiliate slug:", err));
                          } else {
                            setReferralLink(`https://foodmaxx.app/ref/${cleanSlug}`);
                          }
                          playTick(true);
                        }
                      }
                    }}
                    style={{ padding: '8px 16px', background: 'var(--bg-secondary)', color: 'var(--primary)', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '12px', textTransform: 'uppercase' }}
                  >
                    Change
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Clean iOS Style Withdraw Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          >
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{ width: '100%', maxWidth: '500px', background: 'var(--bg-card)', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', padding: '24px', paddingBottom: 'env(safe-area-inset-bottom, 24px)' }}
            >
              <div style={{ width: '40px', height: '4px', background: '#ECE9E2', borderRadius: '2px', margin: '0 auto 20px auto' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: 'var(--text-main)' }}>Withdraw Funds</h2>
                <button onClick={() => setShowWithdrawModal(false)} style={{ background: 'var(--bg-secondary)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleWithdraw}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Amount to Withdraw</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '20px', fontWeight: '900', color: 'var(--text-main)' }}>₦</span>
                    <input 
                      type="number" 
                      placeholder={walletBalance.toLocaleString()}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '16px 16px 16px 40px', fontSize: '24px', fontWeight: '900', color: 'var(--text-main)', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Available: ₦{walletBalance.toLocaleString()}</span>
                    <button type="button" onClick={() => setWithdrawAmount(walletBalance)} style={{ background: 'var(--primary-glow)', border: 'none', color: 'var(--primary)', fontWeight: '800', fontSize: '11px', padding: '4px 8px', borderRadius: '6px' }}>MAX</button>
                  </div>
                </div>
                
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Destination</p>
                    <p style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: 'var(--text-main)' }}>{bankName} •••• {accountNo.slice(-4)}</p>
                  </div>
                  <div style={{ width: '40px', height: '40px', background: 'var(--bg-card)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <Banknote size={20} />
                  </div>
                </div>

                <button type="submit" style={{ width: '100%', background: 'var(--primary)', color: 'var(--text-white)', border: 'none', padding: '18px', borderRadius: '16px', fontSize: '16px', fontWeight: '900', boxShadow: '0 8px 16px rgba(255, 91, 38, 0.2)' }}>
                  Confirm Withdrawal
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AffiliateWallet;
