import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Navigation, ChevronRight, Clock, CheckCircle, Truck, XCircle, ArrowLeft, ShoppingBag, RefreshCw } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const formatDate = (dateVal) => {
  if (!dateVal) return '';
  if (typeof dateVal.toDate === 'function') return dateVal.toDate().toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
  if (dateVal instanceof Date) return dateVal.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
  if (typeof dateVal === 'number') return new Date(dateVal).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
  if (typeof dateVal === 'string') return new Date(dateVal).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
  if (dateVal.seconds) return new Date(dateVal.seconds * 1000).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
  return '';
};

const StatusBadge = ({ status }) => {
  const statusMap = {
    pending:    { label: 'Pending',    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
    confirmed:  { label: 'Confirmed',  color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',       icon: CheckCircle },
    preparing:  { label: 'Preparing',  color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: Package },
    dispatched: { label: 'On the Way', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Truck },
    delivered:  { label: 'Delivered',  color: 'bg-charistar-green/20 text-charistar-green border-charistar-green/30', icon: CheckCircle },
    cancelled:  { label: 'Cancelled',  color: 'bg-red-500/20 text-red-400 border-red-500/30',          icon: XCircle },
  };
  const s = statusMap[status] || statusMap['pending'];
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${s.color}`}>
      <Icon size={9} strokeWidth={2.5} />
      {s.label}
    </span>
  );
};

export default function OrdersPage() {
  const { currentUser, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // Try indexed query first, fallback to all-orders scan if index missing
    const fetchOrders = async () => {
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        const unsub = onSnapshot(q, (snapshot) => {
          setOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
          setLoading(false);
        }, async (err) => {
          // Fallback: scan all orders for this user (no composite index needed)
          try {
            const allSnap = await getDocs(collection(db, 'orders'));
            const userOrders = allSnap.docs
              .map(d => ({ id: d.id, ...d.data() }))
              .filter(o => o.userId === currentUser.uid)
              .sort((a, b) => {
                const aTime = a.createdAt?.seconds || (typeof a.createdAt === 'number' ? a.createdAt / 1000 : 0);
                const bTime = b.createdAt?.seconds || (typeof b.createdAt === 'number' ? b.createdAt / 1000 : 0);
                return bTime - aTime;
              });
            setOrders(userOrders);
          } catch {}
          setLoading(false);
        });
        return unsub;
      } catch (err) {
        console.error('Orders fetch error:', err);
        setLoading(false);
      }
    };

    let cleanup;
    fetchOrders().then(fn => { cleanup = fn; });
    return () => { if (cleanup) cleanup(); };
  }, [currentUser]);

  // Active orders = not delivered/cancelled
  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  const pastOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));

  if (loading) {
    return (
      <div className="min-h-screen pb-36 bg-[#050505] font-sans">
        {/* Header Skeleton */}
        <div className="sticky top-0 z-30 bg-black/85 backdrop-blur-xl border-b border-white/5 px-5 pt-10 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/5 animate-pulse" />
              <div>
                <div className="w-24 h-5 bg-white/10 rounded-md animate-pulse mb-1.5" />
                <div className="w-16 h-3 bg-white/5 rounded-md animate-pulse" />
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white/5 animate-pulse" />
          </div>
        </div>

        {/* Orders list skeleton */}
        <div className="px-5 pt-6 space-y-6">
          <div className="space-y-4">
            <div className="w-32 h-4.5 bg-white/5 rounded-md animate-pulse mb-2" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-panel rounded-2xl border border-white/5 p-4 flex items-center justify-between gap-3 animate-pulse">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex-shrink-0" />
                  <div className="space-y-2">
                    <div className="w-20 h-3 bg-white/10 rounded-md" />
                    <div className="w-24 h-2 bg-white/5 rounded-md" />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="w-14 h-3.5 bg-white/10 rounded-md" />
                  <div className="w-16 h-4 bg-white/5 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-6">
        <div className="w-20 h-20 bg-charistar-green/10 rounded-full flex items-center justify-center">
          <ShoppingBag size={36} className="text-charistar-green" />
        </div>
        <div>
          <h2 className="text-white font-black text-2xl mb-2">Sign in to see your orders</h2>
          <p className="text-gray-400 text-sm font-medium">Your order history will appear here once you're logged in.</p>
        </div>
        <button
          onClick={() => openAuthModal('login')}
          className="bg-charistar-green text-black font-black px-10 py-3.5 rounded-2xl text-sm tracking-wide hover:scale-105 active:scale-95 transition-all"
        >
          Log In / Sign Up
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-36">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/5 px-5 pt-10 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-charistar-green/10 flex items-center justify-center">
              <Package size={18} className="text-charistar-green" />
            </div>
            <div>
              <h1 className="text-white font-black text-xl leading-tight">My Orders</h1>
              <p className="text-gray-500 text-[11px] font-semibold">{orders.length} order{orders.length !== 1 ? 's' : ''} total</p>
            </div>
          </div>
          <Link to="/" className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all">
            <ArrowLeft size={16} />
          </Link>
        </div>
      </div>

      <div className="px-5 pt-6 space-y-8">
        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center pt-16 text-center gap-5"
          >
            <div className="w-28 h-28 bg-white/5 border border-white/10 rounded-full flex items-center justify-center">
              <span className="text-5xl">🥣</span>
            </div>
            <div>
              <h3 className="text-white font-black text-xl mb-2">No orders yet!</h3>
              <p className="text-gray-500 text-sm font-medium max-w-[240px] mx-auto">Place your first order and track it right here.</p>
            </div>
            <Link
              to="/shop"
              className="bg-charistar-green text-black font-black px-10 py-3.5 rounded-2xl text-sm tracking-wide hover:scale-105 active:scale-95 transition-all"
            >
              Shop Now 🍓
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Active Orders */}
            {activeOrders.length > 0 && (
              <section>
                <h2 className="text-white font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-charistar-green animate-pulse inline-block" />
                  Active Orders
                </h2>
                <div className="space-y-3">
                  {activeOrders.map((order, i) => (
                    <OrderCard key={order.id} order={order} index={i} />
                  ))}
                </div>
              </section>
            )}

            {/* Past Orders */}
            {pastOrders.length > 0 && (
              <section>
                <h2 className="text-white font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Clock size={13} className="text-gray-500" />
                  Order History
                </h2>
                <div className="space-y-3">
                  {pastOrders.map((order, i) => (
                    <OrderCard key={order.id} order={order} index={i} past />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Sticky Footer Actions */}
      <div className="fixed bottom-20 left-0 right-0 z-40 px-5">
        <div className="glass-panel border border-white/10 rounded-[2rem] p-3 flex gap-3 bg-black/70 backdrop-blur-xl shadow-2xl max-w-sm mx-auto">
          <Link
            to="/"
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl bg-white/10 border border-white/10 text-white font-black text-xs uppercase tracking-wider hover:bg-white/15 active:scale-95 transition-all"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Back
          </Link>
          <Link
            to="/shop"
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl bg-charistar-green text-black font-black text-xs uppercase tracking-wider shadow-[0_5px_20px_rgba(163,198,68,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <ShoppingBag size={14} strokeWidth={2.5} />
            Order More
          </Link>
        </div>
      </div>
    </div>
  );
}


function OrderCard({ order, index, past }) {
  const items = order.items || [];
  const totalAmount = order.totalAmount || order.total || 0;
  const isTrackable = !['delivered', 'cancelled'].includes(order.status);

  // Compact row for ALL orders (both active and past)
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`glass-panel rounded-2xl border p-4 flex items-center justify-between gap-3 transition-opacity ${
        past
          ? 'border-white/5 opacity-75 hover:opacity-100'
          : 'border-charistar-green/20 shadow-[0_0_16px_rgba(163,198,68,0.08)]'
      }`}
    >
      {/* Left: icon + info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          past ? 'bg-white/5' : 'bg-charistar-green/10'
        }`}>
          <Package size={16} className={past ? 'text-gray-400' : 'text-charistar-green'} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-white text-xs font-bold truncate">#{order.id.slice(-6).toUpperCase()}</p>
            <span className="text-gray-500 text-[10px] flex-shrink-0">• {items.length} item{items.length !== 1 ? 's' : ''}</span>
          </div>
          <p className="text-gray-500 text-[10px] font-semibold">{formatDate(order.createdAt)}</p>
        </div>
      </div>

      {/* Right: amount + status + track */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <p className="text-white font-black text-sm">₦{Number(totalAmount).toLocaleString()}</p>
        {isTrackable ? (
          <Link
            to={`/track-order/${order.id}`}
            className="flex items-center gap-1 bg-charistar-green text-black font-black text-[10px] px-3 py-1.5 rounded-lg hover:scale-105 active:scale-95 transition-all uppercase tracking-wider"
          >
            <Navigation size={10} strokeWidth={2.5} />
            Track
          </Link>
        ) : (
          <StatusBadge status={order.status} />
        )}
      </div>
    </motion.div>
  );
}

