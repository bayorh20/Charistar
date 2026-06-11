import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  LayoutDashboard, 
  Package, 
  Users, 
  MessageSquare, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  HelpCircle,
  Truck,
  Navigation,
  Store,
  School,
  Tag,
  DollarSign,
  BarChart3,
  Bell,
  Sparkles,
  Settings,
  ShoppingBag,
  Compass
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Import All 17 Dashboard Modules
import AdminOverview from '../components/admin/AdminOverview';
import AdminOrders from '../components/admin/AdminOrders';
import AdminProducts from '../components/admin/AdminProducts';
import AdminHomepage from '../components/admin/AdminHomepage';
import AdminUsers from '../components/admin/AdminUsers';
import AdminDrivers from '../components/admin/AdminDrivers';
import AdminDeliveryTracking from '../components/admin/AdminDeliveryTracking';
import AdminVendors from '../components/admin/AdminVendors';
import AdminCampus from '../components/admin/AdminCampus';
import AdminPromotions from '../components/admin/AdminPromotions';
import AdminFinance from '../components/admin/AdminFinance';
import AdminAnalytics from '../components/admin/AdminAnalytics';
import AdminNotifications from '../components/admin/AdminNotifications';
import AdminReviews from '../components/admin/AdminReviews';
import AdminInventory from '../components/admin/AdminInventory';
import AdminSettings from '../components/admin/AdminSettings';

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract active tab from route subpath: e.g. "/admin/orders" -> "orders"
  const getActiveTabFromPath = () => {
    const parts = location.pathname.split('/');
    const tabId = parts[2];
    return tabId || 'overview';
  };

  const activeTab = getActiveTabFromPath();

  const setActiveTab = (tabId) => {
    if (tabId === 'overview') {
      navigate('/admin');
    } else {
      navigate(`/admin/${tabId}`);
    }
  }; 
  
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Autonomous Admin Auth Session State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return localStorage.getItem('charistar_admin_logged_in') === 'true';
  });
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  useEffect(() => {
    // Real-time listener for orders
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      setOrders(snapshot.docs.map(doc => {
        const data = doc.data();
        let createdAtMs = 0;
        if (data.createdAt) {
          if (typeof data.createdAt === 'number') createdAtMs = data.createdAt;
          else if (data.createdAt.seconds) createdAtMs = data.createdAt.seconds * 1000;
          else if (data.createdAt.toMillis) createdAtMs = data.createdAt.toMillis();
        }
        
        // Mock a Firebase Timestamp if it was saved as a number, so child components don't break
        const normalizedCreatedAt = (data.createdAt && typeof data.createdAt === 'number') 
          ? { seconds: Math.floor(data.createdAt / 1000), nanoseconds: 0 }
          : data.createdAt;

        return { 
          id: doc.id, 
          ...data,
          createdAt: normalizedCreatedAt,
          _sortTime: createdAtMs
        };
      }).sort((a,b) => b._sortTime - a._sortTime));
    });

    // Real-time listener for products
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      fetched.sort((a, b) => {
        const orderA = a.sortOrder !== undefined ? Number(a.sortOrder) : 9999;
        const orderB = b.sortOrder !== undefined ? Number(b.sortOrder) : 9999;
        return orderA - orderB;
      });
      setProducts(fetched);
    });

    // Real-time listener for categories
    const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Real-time listener for users
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    setLoading(false);

    return () => {
      unsubOrders();
      unsubProducts();
      unsubCategories();
      unsubUsers();
    };
  }, []);

  const handleAdminLogin = (e) => {
    if (e) e.preventDefault();
    setIsSubmittingAuth(true);
    setAuthError('');

    // Admin Credentials Bypass or Specific credentials match
    const isMockBypass = !adminPhone && !adminPassword;
    const isCredMatch = (adminPhone === 'admin' && adminPassword === 'admin') || (adminPhone === '09000000000' && adminPassword === 'adminpass');

    if (isMockBypass || isCredMatch) {
      setTimeout(() => {
        localStorage.setItem('charistar_admin_logged_in', 'true');
        setIsAdminLoggedIn(true);
        setIsSubmittingAuth(false);
      }, 500);
    } else {
      setTimeout(() => {
        setAuthError('Access Denied: Invalid administrator credentials. Tip: Click "Demo Bypass Login" below.');
        setIsSubmittingAuth(false);
      }, 500);
    }
  };

  const handleAdminLogout = () => {
    if (window.confirm("Disconnect from Charistar Admin Console?")) {
      localStorage.removeItem('charistar_admin_logged_in');
      setIsAdminLoggedIn(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'products', label: 'Products & Menu', icon: Package },
    { id: 'homepage', label: 'Homepage Layout', icon: Compass },
    { id: 'users', label: 'Customers', icon: Users },
    { id: 'drivers', label: 'Drivers & Riders', icon: Truck },
    { id: 'tracking', label: 'Delivery Tracking', icon: Navigation },
    { id: 'promotions', label: 'Promotions', icon: Tag },
    { id: 'finance', label: 'Wallet & Finance', icon: DollarSign },
    { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
    { id: 'notifications', label: 'Push Center', icon: Bell },
    { id: 'reviews', label: 'Reviews', icon: MessageSquare },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // ── Authentication Gateway UI ──────────────────────────────────────
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-[#050505] font-sans flex items-center justify-center p-6 relative overflow-hidden">
        {/* Dynamic Blurred Background Blobs */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-charistar-green/10 blur-[100px] -translate-x-1/2"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-emerald-500/5 blur-[120px] translate-x-1/2"></div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="w-full max-w-md glass-panel p-8.5 rounded-[1.8rem] border border-white/10 bg-[#0c0c0c]/85 shadow-[0_20px_50px_rgba(0,0,0,0.6)] z-10 text-center flex flex-col items-center"
        >
          {/* Futuristic Gateway Logo */}
          <div className="w-16 h-16 rounded-[1.2rem] bg-charistar-green/10 border border-charistar-green/20 flex items-center justify-center text-charistar-green mb-6 shadow-inner animate-pulse">
            <Lock size={26} strokeWidth={2} />
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight leading-none mb-2">Admin Terminal</h1>
          <p className="text-[10px] font-black text-charistar-green uppercase tracking-[0.2em] mb-8">Charistar Yogurt HQ</p>

          {authError && (
            <div className="w-full bg-red-500/10 border border-red-500/20 text-red-400 p-4.5 rounded-2xl text-xs font-bold leading-relaxed text-left mb-6">
              {authError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="w-full space-y-5 text-left">
            <div>
              <label className="block text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Terminal ID</label>
              <input 
                type="text" 
                placeholder="e.g. admin"
                value={adminPhone} 
                onChange={e => setAdminPhone(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-charistar-green focus:bg-black/40 outline-none transition-all text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Console Key</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password"
                  value={adminPassword} 
                  onChange={e => setAdminPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-5 pr-12 py-4 text-white focus:border-charistar-green focus:bg-black/40 outline-none transition-all text-sm font-semibold"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmittingAuth}
              className="w-full py-4.5 bg-white text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-gray-100 transition-all shadow-md mt-2 flex items-center justify-center gap-2"
            >
              {isSubmittingAuth ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <ShieldCheck size={16} /> Connect Securely
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Bypass */}
          <div className="w-full border-t border-white/5 mt-8 pt-6 flex flex-col items-center">
            <span className="text-[10px] text-gray-600 font-extrabold uppercase tracking-widest mb-3 flex items-center gap-1.5"><HelpCircle size={10}/> Safe Sandbox Environment</span>
            <button
              onClick={() => handleAdminLogin()}
              className="relative group overflow-hidden w-full py-4 bg-charistar-green/10 border border-charistar-green/20 hover:border-charistar-green/50 text-charistar-green hover:text-white hover:bg-charistar-green/20 transition-all font-black uppercase tracking-widest text-[11px] rounded-xl shadow-lg"
            >
              {/* Glowing pulsar element inside button */}
              <div className="absolute inset-0 bg-charistar-green/10 group-hover:scale-105 blur-md transition-transform duration-500 rounded-xl"></div>
              <span className="relative z-10 flex items-center justify-center gap-2">
                ⚡ Quick Bypass: Launch Demo
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main Dashboard Workspace ───────────────────────────────────────
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="min-h-screen bg-charistar-dark font-sans flex flex-col md:flex-row md:overflow-hidden"
    >
      {/* Header / Desktop Sidebar */}
      <div className="sticky top-0 z-30 bg-[#050505]/95 backdrop-blur-xl px-6 pt-12 pb-5 border-b border-white/5 md:w-[280px] md:h-screen md:flex-shrink-0 md:border-b-0 md:border-r md:pt-8 md:flex md:flex-col justify-between">
        <div>
          <div className="flex items-center gap-4 mb-6 md:mb-12">
            <Link to="/" className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 active:scale-95 transition-transform border border-white/5 flex-shrink-0">
              <ArrowLeft size={18} className="text-white" />
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight">Admin Console</h1>
              <p className="text-[10px] font-black text-charistar-green uppercase tracking-widest mt-1">Clearance Active ✦</p>
            </div>
          </div>

          {/* Scrollable Navigation Tabs List */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 md:flex-col md:gap-2.5 md:overflow-y-auto md:max-h-[calc(100vh-220px)] pr-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-5 py-2.5 md:py-3 rounded-xl text-[10px] md:text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all w-full text-left ${
                  activeTab === tab.id 
                    ? 'bg-white text-black shadow-[0_5px_15px_rgba(255,255,255,0.2)] md:scale-102 md:ml-1' 
                    : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10 hover:text-white'
                }`}
              >
                <tab.icon size={14} className={activeTab === tab.id ? "text-black" : "text-gray-400"} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lock Terminal Button */}
        <div className="hidden md:block pt-6 border-t border-white/5 mt-auto text-center">
          <button
            onClick={handleAdminLogout}
            className="flex items-center justify-center gap-2.5 w-full py-4 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 border border-white/5 hover:border-red-500/20 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all mb-3"
          >
            <Lock size={12} /> Lock Terminal
          </button>
          <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest block text-center">Console v1.4.0 ✦ Wiped & Zero Calories</span>
        </div>
      </div>

      {/* Main content viewport */}
      <div className="p-6 md:flex-1 md:overflow-y-auto md:h-screen md:p-10 md:pb-24 pb-32">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-charistar-green border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              { activeTab === 'overview' && <AdminOverview orders={orders} users={users} products={products} /> }
              { activeTab === 'orders' && <AdminOrders orders={orders} setOrders={setOrders} /> }
              { activeTab === 'products' && <AdminProducts products={products} setProducts={setProducts} /> }
              { activeTab === 'homepage' && <AdminHomepage products={products} categories={categories} /> }
              { activeTab === 'users' && <AdminUsers users={users} setUsers={setUsers} /> }
              { activeTab === 'drivers' && <AdminDrivers /> }
              { activeTab === 'tracking' && <AdminDeliveryTracking /> }
              { activeTab === 'promotions' && <AdminPromotions /> }
              { activeTab === 'finance' && <AdminFinance /> }
              { activeTab === 'analytics' && <AdminAnalytics /> }
              { activeTab === 'notifications' && <AdminNotifications users={users} /> }
              { activeTab === 'reviews' && <AdminReviews /> }
              { activeTab === 'inventory' && <AdminInventory /> }
              { activeTab === 'settings' && <AdminSettings /> }
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
