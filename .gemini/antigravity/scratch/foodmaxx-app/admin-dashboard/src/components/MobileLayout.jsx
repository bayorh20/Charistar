import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Flame, ClipboardList, Utensils, MessageSquare,
  Settings, Bell, Volume2, VolumeX, Sun, Moon, LogOut,
  Users, ChevronRight, X, AlertTriangle, Truck, Star,
  Ticket, ShieldCheck, Image, MoreHorizontal, CheckCircle2,
  Package, RotateCcw, XCircle, Layers
} from 'lucide-react';
import { useOrderAlert } from '../context/OrderAlertContext';
import { useApp } from '../context/AppContext';
import { db } from '../firebase/config';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';

// ── Primary bottom tab items (5 max for thumb reach) ─────────────────────────
const PRIMARY_TABS = [
  { path: '/',          label: 'Dashboard', icon: LayoutDashboard },
  { path: '/live-feed', label: 'Live Feed',  icon: Flame,          isAlert: true },
  { path: '/orders',    label: 'Orders',     icon: ClipboardList },
  { path: '/support',   label: 'Support',    icon: MessageSquare },
  { path: '/more',      label: 'More',       icon: MoreHorizontal },
];

// ── "More" drawer items ───────────────────────────────────────────────────────
const MORE_ITEMS = [
  { path: '/menu',          label: 'Menu Manager',     icon: Utensils },
  { path: '/page-builder',  label: 'Page Builder',     icon: Layers },
  { path: '/users',         label: 'Customers',         icon: Users },
  { path: '/riders',        label: 'Riders Fleet',      icon: Truck },
  { path: '/coupons',       label: 'Coupon Builder',    icon: Ticket },
  { path: '/reviews',       label: 'Reviews',           icon: Star },
  { path: '/marketing',     label: 'Marketing',         icon: Image },
  { path: '/affiliates',    label: 'Affiliates',        icon: Users },
  { path: '/audit-logs',    label: 'Audit Trail',       icon: ShieldCheck },
  { path: '/settings',      label: 'Settings',          icon: Settings },
];

// ── Status update sheet options ───────────────────────────────────────────────
const STATUS_OPTIONS = [
  { s: 'Preparing',       idx: 1, icon: Package,      color: 'bg-blue-500'   },
  { s: 'Ready',           idx: 2, icon: CheckCircle2,  color: 'bg-green-500'  },
  { s: 'Out for Delivery',idx: 3, icon: Truck,         color: 'bg-purple-500' },
  { s: 'Delivered',       idx: 4, icon: CheckCircle2,  color: 'bg-emerald-600'},
  { s: 'Cancelled',       idx: 5, icon: XCircle,       color: 'bg-red-500'    },
];

// ── Order Bottom Sheet ────────────────────────────────────────────────────────
const OrderBottomSheet = ({ order, onClose, onStatusChange, menuItems }) => {
  if (!order) return null;

  const getItemImage = (item) => {
    if (item.image) return item.image;
    const found = (menuItems || []).find(m => m.id === item.id);
    return found?.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="fixed bottom-0 left-0 right-0 z-[201] bg-white dark:bg-slate-800 rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto"
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-200 dark:bg-slate-600 rounded-full" />
        </div>

        <div className="px-5 pb-8 space-y-5">
          {/* Order header */}
          <div className="flex items-start justify-between pt-2">
            <div>
              <h3 className="font-black text-lg text-slate-800 dark:text-white">#{order.id}</h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">{order.customerName} · {order.customerPhone}</p>
              <p className="text-xs text-slate-400 font-semibold truncate max-w-[220px]">{order.address?.name || 'No address'}</p>
            </div>
            <div className="text-right">
              <span className="font-black text-xl text-orange-500">₦{(order.total || 0).toLocaleString()}</span>
              <span className={`block text-[10px] font-black uppercase mt-1 px-2 py-0.5 rounded-full w-fit ml-auto ${
                order.status === 'Order Received' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                order.status === 'Preparing'      ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                order.status === 'Delivered'      ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                order.status === 'Cancelled'      ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
              }`}>{order.status}</span>
            </div>
          </div>

          {/* Items list */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-3 space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Order Items</p>
            {(order.cart || order.items || []).map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-3 bg-white dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                    <img 
                      src={getItemImage(item)} 
                      alt={item.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'; }}
                    />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight truncate">
                      {item.quantity}x {item.name}
                    </p>
                    {item.customizations && item.customizations.length > 0 && (
                      <p className="text-[9px] text-orange-500 font-semibold mt-0.5 leading-none">
                        + {typeof item.customizations[0] === 'object' ? item.customizations.map(c => c.name).join(', ') : item.customizations.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
                <span className="font-extrabold text-xs text-slate-700 dark:text-slate-350 shrink-0">
                  ₦{((item.price || 0) * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {/* Quick status buttons */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">Update Status</p>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map(({ s, idx, icon: Icon, color }) => (
                <button
                  key={s}
                  onClick={() => { onStatusChange(s, idx); onClose(); }}
                  className={`flex items-center gap-2 p-3 rounded-2xl text-white font-bold text-sm transition-all active:scale-95 ${
                    order.status === s
                      ? `${color} shadow-lg opacity-100`
                      : `${color} opacity-60 hover:opacity-100`
                  }`}
                >
                  <Icon size={16} />
                  <span className="text-xs font-black">{s}</span>
                  {order.status === s && (
                    <CheckCircle2 size={14} className="ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-black text-sm"
          >
            Close
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// ── More Drawer ───────────────────────────────────────────────────────────────
const MoreDrawer = ({ open, onClose, theme, setTheme, soundEnabled, setSoundEnabled, onLogout }) => {
  const navigate = useNavigate();
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed bottom-0 left-0 right-0 z-[151] bg-white dark:bg-slate-800 rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-200 dark:bg-slate-600 rounded-full" />
            </div>

            <div className="px-5 pt-3 pb-10 space-y-2">
              {/* Quick toggles */}
              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-50 dark:bg-slate-700 rounded-2xl font-bold text-sm text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-600"
                >
                  {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                  {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                </button>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm border ${
                    soundEnabled
                      ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400'
                      : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400'
                  }`}
                >
                  {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                  {soundEnabled ? 'Sound On' : 'Muted'}
                </button>
              </div>

              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-3">More Pages</p>

              {MORE_ITEMS.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); onClose(); }}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-2xl border border-slate-100 dark:border-slate-700 transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-600 flex items-center justify-center shadow-sm">
                        <Icon size={18} className="text-orange-500" />
                      </div>
                      <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{item.label}</span>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 dark:text-slate-500" />
                  </button>
                );
              })}

              {/* Logout */}
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 mt-4 py-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl font-bold text-sm border border-red-100 dark:border-red-500/20"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ── Main Mobile Layout ────────────────────────────────────────────────────────
const MobileLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen]           = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('fm_admin_theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const { orders, logAction, menuItems } = useApp();
  const {
    newOrderAlert, clearAlert, unreadCount,
    resetUnreadCount, soundEnabled, setSoundEnabled,
    activeOrdersCount
  } = useOrderAlert();

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    theme === 'dark' ? root.classList.add('dark') : root.classList.remove('dark');
    localStorage.setItem('fm_admin_theme', theme);
  }, [theme]);

  // Close more drawer on nav
  useEffect(() => { setMoreOpen(false); }, [location.pathname]);

  // Keep selected order fresh from live stream
  useEffect(() => {
    if (!selectedOrder || !orders) return;
    const fresh = orders.find(o => o.id === selectedOrder.id);
    if (fresh) setSelectedOrder(fresh);
  }, [orders]);

  const handleLogout = async () => {
    if (window.confirm('Sign out of admin?')) {
      await signOut(auth).catch(console.error);
      navigate('/login');
    }
  };

  const handleStatusChange = async (newStatus, index) => {
    if (!selectedOrder) return;
    try {
      const orderRef = doc(db, 'orders', selectedOrder.id);
      await updateDoc(orderRef, {
        status: newStatus,
        statusIndex: index,
        activityLogs: arrayUnion({
          event: newStatus,
          timestamp: new Date().toISOString(),
          actor: 'Admin Mobile',
          note: `Status updated to ${newStatus} via mobile dashboard`
        })
      });
      logAction(`Mobile: Updated Order #${selectedOrder.id} → ${newStatus}`);
    } catch (err) {
      alert('Failed to update: ' + err.message);
    }
  };

  const getPageTitle = () => {
    const allItems = [...PRIMARY_TABS, ...MORE_ITEMS];
    const match = allItems.find(i => i.path === location.pathname);
    return match ? match.label : 'FoodMaxx Admin';
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors duration-300">

      {/* ── Sticky Top Header ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-[100] bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 shadow-sm">
        {/* Main header row */}
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="FoodMaxx" className="w-7 h-7 rounded-lg object-cover shadow-sm shrink-0" />
            <h1 className="font-black text-sm text-slate-800 dark:text-white leading-tight">
              {getPageTitle()}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <button
              onClick={() => { resetUnreadCount(); navigate('/live-feed'); }}
              className="relative p-2 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-600"
            >
              <Bell size={18} className="text-slate-600 dark:text-slate-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white rounded-full flex items-center justify-center text-[9px] font-black animate-bounce shadow">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── Persistent new-order alert banner ───────────────────────────── */}
        <AnimatePresence>
          {newOrderAlert && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-orange-500 px-4 py-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle size={15} className="text-white shrink-0 animate-bounce" />
                  <p className="text-white text-[11px] font-bold truncate">
                    New Order! <strong>{newOrderAlert.customerName}</strong> — ₦{(newOrderAlert.total || 0).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => { clearAlert(); navigate('/live-feed'); }}
                    className="bg-white text-orange-600 text-[10px] font-black px-2.5 py-1 rounded-lg"
                  >
                    View
                  </button>
                  <button onClick={clearAlert}>
                    <X size={16} className="text-white" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Page Content ───────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto pb-24 px-0">
        {/* Expose selectedOrder setter + handleStatusChange to child pages via context workaround — 
            pages already use their own data; this layout just controls the bottom sheet */}
        <Outlet context={{ openOrderSheet: (order) => setSelectedOrder(order) }} />
      </main>

      {/* ── Bottom Tab Bar ─────────────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        <div className="flex items-stretch h-[60px]">
          {PRIMARY_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = tab.path === '/more'
              ? moreOpen
              : location.pathname === tab.path && !moreOpen;

            return (
              <button
                key={tab.path}
                onClick={() => {
                  if (tab.path === '/more') {
                    setMoreOpen(prev => !prev);
                  } else {
                    setMoreOpen(false);
                    navigate(tab.path);
                  }
                }}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-all relative ${
                  isActive ? 'text-orange-500' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-orange-500 rounded-full"
                  />
                )}

                {/* Icon wrapper — pulse on active alert */}
                <div className={`relative ${isActive ? 'scale-110' : ''} transition-transform`}>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                  {tab.isAlert && activeOrdersCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-orange-500 text-white rounded-full flex items-center justify-center text-[9px] font-black px-0.5 animate-pulse shadow">
                      {activeOrdersCount}
                    </span>
                  )}
                  {tab.path === '/support' && unreadCount > 0 && !tab.isAlert && (
                    <span className="absolute -top-1.5 -right-2 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-800 shadow" />
                  )}
                </div>

                <span className={`text-[10px] font-bold leading-none ${isActive ? 'font-extrabold' : ''}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Safe area spacer for phones with home bar */}
        <div className="h-safe-bottom bg-white dark:bg-slate-800" style={{ height: 'env(safe-area-inset-bottom)' }} />
      </nav>

      {/* ── More Drawer ────────────────────────────────────────────────────── */}
      <MoreDrawer
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        theme={theme}
        setTheme={setTheme}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onLogout={handleLogout}
      />

      {/* ── Order Bottom Sheet ──────────────────────────────────────────────── */}
      {selectedOrder && (
        <OrderBottomSheet
          order={selectedOrder}
          menuItems={menuItems}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
};

export default MobileLayout;
