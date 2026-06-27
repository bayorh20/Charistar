import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Bell, Volume2, VolumeX, Sun, Moon, LogOut, 
  Menu, X, ClipboardList, Utensils, MessageSquare, Ticket, 
  Users, Truck, Image, Settings, ShieldCheck, Flame, Star, AlertTriangle, Layers, Activity
} from 'lucide-react';
import { useOrderAlert } from '../context/OrderAlertContext';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';

const NAV_ITEMS = [
  { path: '/', label: 'Executive KPIs', icon: LayoutDashboard },
  { path: '/live-feed', label: 'Live Order Feed', icon: Flame, isAlert: true },
  { path: '/orders', label: 'Orders Lifecycle', icon: ClipboardList },
  { path: '/menu', label: 'Menu Manager', icon: Utensils },
  { path: '/page-builder', label: 'Page Builder', icon: Layers },
  { path: '/reviews', label: 'Reviews & Ratings', icon: Star },
  { path: '/coupons', label: 'Coupon Builder', icon: Ticket },
  { path: '/users', label: 'Customer Wallets', icon: Users },
  { path: '/riders', label: 'Riders Fleet', icon: Truck },
  { path: '/affiliates', label: 'Affiliates Queue', icon: Users },
  { path: '/support', label: 'Support Live Chat', icon: MessageSquare },
  { path: '/marketing', label: 'Marketing Manager', icon: Image },
  { path: '/settings', label: 'Global Config', icon: Settings },
  { path: '/performance', label: 'Performance Center', icon: Activity },
  { path: '/audit-logs', label: 'Admin Audit Trail', icon: ShieldCheck }
];

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    // Check local storage or prefers-color-scheme
    const saved = localStorage.getItem('fm_admin_theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const { 
    newOrderAlert, clearAlert, unreadCount, 
    resetUnreadCount, soundEnabled, setSoundEnabled,
    activeOrdersCount
  } = useOrderAlert();

  // Handle Theme Toggle
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('fm_admin_theme', theme);
  }, [theme]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      await signOut(auth).catch(console.error);
      navigate('/login');
    }
  };

  const getPageTitle = () => {
    const active = NAV_ITEMS.find(item => item.path === location.pathname);
    return active ? active.label : 'Admin Command Center';
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      
      {/* ── Desktop Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700 shadow-sm shrink-0">
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-slate-50 dark:border-slate-700">
          <img src="/logo.png" alt="FoodMaxx" className="w-9 h-9 rounded-xl object-cover shadow-sm shrink-0" />
          <span className="font-black text-lg tracking-tight text-slate-800 dark:text-white">
            FoodMaxx <span className="text-orange-500 font-extrabold text-xs uppercase px-1.5 py-0.5 rounded-md bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20">Admin</span>
          </span>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                  isActive 
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/10' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
                {item.isAlert && activeOrdersCount > 0 && (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white text-orange-600' : 'bg-orange-500 text-white animate-pulse'
                  }`}>
                    {activeOrdersCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-50 dark:border-slate-700">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-red-50 dark:bg-slate-700 dark:hover:bg-red-500/10 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 rounded-xl font-bold text-sm transition-all border border-slate-100 dark:border-slate-700"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile Sidebar Drawer ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/60 z-50 lg:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-800 z-50 flex flex-col shadow-2xl lg:hidden"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-slate-50 dark:border-slate-700">
                <div className="flex items-center gap-2.5">
                  <img src="/logo.png" alt="FoodMaxx" className="w-9 h-9 rounded-xl object-cover shadow-sm shrink-0" />
                  <span className="font-black text-lg tracking-tight text-slate-800 dark:text-white">
                    FoodMaxx <span className="text-orange-500 font-extrabold text-xs">Admin</span>
                  </span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                        isActive 
                          ? 'bg-orange-500 text-white shadow-md shadow-orange-500/10' 
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} />
                        <span>{item.label}</span>
                      </div>
                      {item.isAlert && activeOrdersCount > 0 && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          isActive ? 'bg-white text-orange-600' : 'bg-orange-500 text-white'
                        }`}>
                          {activeOrdersCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-slate-50 dark:border-slate-700">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-red-50 dark:bg-slate-700 dark:hover:bg-red-500/10 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 rounded-xl font-bold text-sm transition-all border border-slate-100 dark:border-slate-700"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content Area ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header bar */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 shadow-sm shrink-0 transition-colors">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <Menu size={22} />
            </button>
            <h2 className="text-md sm:text-lg font-black text-slate-800 dark:text-white leading-none">
              {getPageTitle()}
            </h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Audio notifications switch */}
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Mute audio alerts" : "Unmute audio alerts"}
              className={`p-2 rounded-xl border transition-all ${
                soundEnabled 
                  ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-100' 
                  : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100'
              }`}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>

            {/* Light/Dark Toggle */}
            <button 
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
              className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 border border-slate-100 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl transition-all"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Notification Bell */}
            <button 
              onClick={() => {
                resetUnreadCount();
                navigate('/live-feed');
              }}
              className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 border border-slate-100 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl transition-all relative"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-600 text-white rounded-full flex items-center justify-center text-[9px] font-black animate-bounce shadow">
                  {unreadCount}
                </span>
              )}
            </button>

          </div>
        </header>

        {/* Dynamic New Order Warning Banner */}
        <AnimatePresence>
          {newOrderAlert && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-orange-500 text-white font-bold px-6 py-3 flex items-center justify-between text-xs sm:text-sm border-b border-orange-600 shadow"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="animate-bounce" />
                <span>
                  New Order Received! <strong>{newOrderAlert.customerName}</strong> placed Order <strong>#{newOrderAlert.id}</strong> (₦{(newOrderAlert.total || 0).toLocaleString()}).
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    clearAlert();
                    navigate('/live-feed');
                  }}
                  className="bg-white text-orange-600 hover:bg-orange-50 px-3 py-1 rounded-lg font-black text-xs transition-colors"
                >
                  View Feed
                </button>
                <button onClick={clearAlert} className="text-white hover:text-orange-100">
                  <X size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subpage Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

    </div>
  );
};

export default Layout;
