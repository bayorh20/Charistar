import React, { useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useOrderAlert } from '../context/OrderAlertContext';
import {
  TrendingUp, ShoppingBag, Landmark, ChevronRight,
  Flame, Clock, CheckCircle2, Package, Truck, XCircle,
  AlertCircle, RefreshCw, ClipboardList
} from 'lucide-react';

// ── Status colour helper ──────────────────────────────────────────────────────
const statusStyle = (status) => {
  switch (status) {
    case 'Order Received':   return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
    case 'Preparing':        return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
    case 'Ready':            return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400';
    case 'Out for Delivery': return 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400';
    case 'Delivered':        return 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400';
    case 'Cancelled':        return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400';
    default:                 return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
  }
};

const statusIcon = (status) => {
  switch (status) {
    case 'Order Received':   return AlertCircle;
    case 'Preparing':        return Package;
    case 'Ready':            return CheckCircle2;
    case 'Out for Delivery': return Truck;
    case 'Delivered':        return CheckCircle2;
    case 'Cancelled':        return XCircle;
    default:                 return Clock;
  }
};

const MobileHome = () => {
  const navigate = useNavigate();
  const { orders, menuItems } = useApp();

  const getItemImage = (item) => {
    if (item.image) return item.image;
    const found = (menuItems || []).find(m => m.id === item.id);
    return found?.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80';
  };
  const { activeOrdersCount } = useOrderAlert();

  // Try to get the sheet opener from MobileLayout outlet context
  let openOrderSheet;
  try {
    const ctx = useOutletContext();
    openOrderSheet = ctx?.openOrderSheet;
  } catch (_) {}

  // Today's metrics
  const today = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayOrders = (orders || []).filter(o => {
      const d = o.createdAt ? new Date(o.createdAt) : null;
      return d && d >= todayStart;
    });

    const completed = todayOrders.filter(o => o.status === 'Delivered');
    const revenue   = completed.reduce((s, o) => s + (o.total || 0), 0);
    const active    = todayOrders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');

    return { total: todayOrders.length, revenue, active, completed: completed.length };
  }, [orders]);

  // Live active orders (newest first)
  const activeOrders = useMemo(() => {
    return (orders || [])
      .filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [orders]);

  // Recent 5 completed/all orders
  const recentOrders = useMemo(() => {
    return (orders || [])
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);
  }, [orders]);

  return (
    <div className="space-y-0">

      {/* ── Hero KPI Strip ──────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-orange-500 to-red-500 px-4 pt-4 pb-8">
        <p className="text-orange-100 text-[11px] font-bold uppercase tracking-widest mb-3">Today's Performance</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-white">
            <Landmark size={18} className="mb-1.5 opacity-80" />
            <p className="text-[10px] font-bold opacity-70 uppercase tracking-wide">Revenue</p>
            <p className="text-lg font-black leading-tight">₦{today.revenue >= 1000 ? `${(today.revenue/1000).toFixed(1)}k` : today.revenue.toLocaleString()}</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-white">
            <ShoppingBag size={18} className="mb-1.5 opacity-80" />
            <p className="text-[10px] font-bold opacity-70 uppercase tracking-wide">Orders</p>
            <p className="text-lg font-black leading-tight">{today.total}</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-white relative">
            <Flame size={18} className="mb-1.5 opacity-80" />
            <p className="text-[10px] font-bold opacity-70 uppercase tracking-wide">Active</p>
            <p className="text-lg font-black leading-tight">{today.active.length}</p>
            {today.active.length > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-white rounded-full animate-ping opacity-80" />
            )}
          </div>
        </div>
      </div>

      {/* ── Pull-down card starts here (overlaps hero) ──────────────────────── */}
      <div className="bg-slate-50 dark:bg-slate-900 -mt-4 rounded-t-3xl space-y-5 pt-5 px-4">

        {/* ── Active Orders ───────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <h2 className="font-black text-sm text-slate-800 dark:text-white">Active Queue</h2>
              {activeOrdersCount > 0 && (
                <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {activeOrdersCount}
                </span>
              )}
            </div>
            <button
              onClick={() => navigate('/live-feed')}
              className="flex items-center gap-1 text-orange-500 font-bold text-xs"
            >
              See All <ChevronRight size={14} />
            </button>
          </div>

          {activeOrders.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center border border-slate-100 dark:border-slate-700">
              <span className="text-3xl">📭</span>
              <p className="text-slate-400 font-bold text-xs mt-2">No active orders right now</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeOrders.slice(0, 4).map(order => {
                const StatusIcon = statusIcon(order.status);
                return (
                  <button
                    key={order.id}
                    onClick={() => openOrderSheet?.(order)}
                    className="w-full bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
                  >
                    {/* Food Avatars stack instead of generic status style icon */}
                    <div className="flex -space-x-2.5 shrink-0 mr-1">
                      {(order.cart || order.items || []).slice(0, 3).map((item, idx) => (
                        <div key={idx} className="relative w-9 h-9 rounded-full overflow-hidden bg-slate-100 border-2 border-white dark:border-slate-800 shadow-sm">
                          <img 
                            src={getItemImage(item)} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'; }}
                          />
                        </div>
                      ))}
                      {(order.cart || order.items || []).length > 3 && (
                        <div className="w-9 h-9 rounded-full bg-orange-500 text-white font-extrabold text-[8px] flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm">
                          +{(order.cart || order.items || []).length - 3}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-black text-xs text-slate-800 dark:text-white">#{order.id}</span>
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${statusStyle(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="font-semibold text-xs text-slate-500 dark:text-slate-400 truncate">
                        {order.customerName} · {order.cart?.length || 0} items
                      </p>
                    </div>

                    {/* Amount + arrow */}
                    <div className="text-right shrink-0">
                      <p className="font-black text-sm text-orange-500">₦{(order.total || 0).toLocaleString()}</p>
                      <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 ml-auto mt-0.5" />
                    </div>
                  </button>
                );
              })}

              {activeOrders.length > 4 && (
                <button
                  onClick={() => navigate('/orders')}
                  className="w-full py-3 text-center text-orange-500 font-bold text-xs bg-orange-50 dark:bg-orange-500/10 rounded-2xl border border-orange-100 dark:border-orange-500/20"
                >
                  +{activeOrders.length - 4} more orders — See All
                </button>
              )}
            </div>
          )}
        </section>

        {/* ── Quick Actions ───────────────────────────────────────────────── */}
        <section>
          <h2 className="font-black text-sm text-slate-800 dark:text-white mb-3">Quick Actions</h2>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Live Feed',  icon: Flame,         path: '/live-feed', color: 'bg-orange-500' },
              { label: 'Orders',     icon: ClipboardList, path: '/orders',    color: 'bg-blue-500'   },
              { label: 'Menu',       icon: Package,        path: '/menu',      color: 'bg-emerald-500'},
              { label: 'Riders',     icon: Truck,          path: '/riders',    color: 'bg-purple-500' },
            ].map(({ label, icon: Icon, path, color }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 active:scale-95 transition-transform"
              >
                <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shadow-sm`}>
                  <Icon size={18} className="text-white" />
                </div>
                <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 leading-tight text-center">{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Recent Orders ───────────────────────────────────────────────── */}
        <section className="pb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-sm text-slate-800 dark:text-white">Recent Orders</h2>
            <button
              onClick={() => navigate('/orders')}
              className="flex items-center gap-1 text-orange-500 font-bold text-xs"
            >
              All Orders <ChevronRight size={14} />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm divide-y divide-slate-50 dark:divide-slate-700/50">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-slate-400 font-bold text-xs">No orders yet. They'll appear here once customers order.</p>
              </div>
            ) : (
              recentOrders.map(order => (
                <button
                  key={order.id}
                  onClick={() => openOrderSheet?.(order)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left active:bg-slate-50 dark:active:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Food Avatars stack */}
                    <div className="flex -space-x-2 shrink-0">
                      {(order.cart || order.items || []).slice(0, 2).map((item, idx) => (
                        <div key={idx} className="relative w-7 h-7 rounded-full overflow-hidden bg-slate-100 border-2 border-white dark:border-slate-800 shadow-sm">
                          <img 
                            src={getItemImage(item)} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'; }}
                          />
                        </div>
                      ))}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-slate-800 dark:text-white">#{order.id}</span>
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${statusStyle(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-semibold truncate mt-0.5">{order.customerName}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-sm text-slate-800 dark:text-white">₦{(order.total || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">{order.timestamp || ''}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

      </div>
    </div>
  );
};

export default MobileHome;
