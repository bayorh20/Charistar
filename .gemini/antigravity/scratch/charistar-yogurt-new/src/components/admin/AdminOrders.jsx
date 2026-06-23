import React, { useState } from 'react';
import { Package, Truck, CheckCircle, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function AdminOrders({ orders, setOrders }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const filteredOrders = orders.filter(o => {
    if (filter !== 'all' && o.status !== filter) return false;
    if (search && !o.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update order status");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'bg-charistar-green/20 text-charistar-green border-charistar-green/30';
      case 'dispatched': return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
      case 'preparing': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center bg-[#050505]/40 p-6 rounded-[1.5rem] border border-white/5">
        <div className="relative w-full sm:max-w-xs">
          <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search Order ID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-sm text-white focus:border-charistar-green focus:bg-black/30 outline-none transition-all"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0">
          {['all', 'pending', 'preparing', 'dispatched', 'delivered'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                filter === f ? 'bg-white text-black' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredOrders.map((order) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={order.id} 
              className="glass-panel p-7 rounded-[1.5rem] border border-white/10 bg-[#0c0c0c]/85 hover:bg-[#121212]/95 hover:border-charistar-green/20 transition-all duration-300 shadow-[0_10px_35px_rgba(0,0,0,0.5)] flex flex-col"
            >
              <div className="flex justify-between items-start mb-5">
                <div>
                  <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1.5 ml-0.5">
                    {new Date(order.createdAt?.seconds * 1000).toLocaleString()}
                  </p>
                  <h4 className="text-white font-black text-sm tracking-tight">Order #{order.id.slice(-6).toUpperCase()}</h4>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                  {order.status}
                </div>
              </div>

              <div className="space-y-3.5 mb-7">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-black/30 px-3.5 py-2.5 rounded-xl border border-white/5">
                    <span className="text-gray-300 font-bold truncate pr-2">{item.quantity}x {item.title}</span>
                    <span className="text-gray-500 font-bold whitespace-nowrap">{item.price}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-5 border-t border-white/10 mt-auto">
                <div>
                  <p className="text-gray-500 text-[10px] font-extrabold uppercase tracking-widest mb-0.5">Total</p>
                  <p className="text-charistar-green font-black text-lg">₦{(order.total || order.totalAmount || 0).toLocaleString()}</p>
                </div>

                <div className="flex gap-2">
                  <div className="relative">
                    <select 
                      value={order.status}
                      onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                      className="bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl px-4 py-3.5 outline-none border border-white/10 appearance-none text-center cursor-pointer hover:bg-white/20 transition-all"
                    >
                      <option value="pending" className="bg-black">Pending</option>
                      <option value="preparing" className="bg-black">Preparing</option>
                      <option value="dispatched" className="bg-black">Dispatched</option>
                      <option value="delivered" className="bg-black">Delivered</option>
                      <option value="cancelled" className="bg-black text-red-500">Cancelled</option>
                    </select>
                  </div>
                  <button 
                    onClick={() => setSelectedOrder(order)}
                    className="bg-white/10 hover:bg-white/20 text-white w-11 h-11 rounded-xl flex items-center justify-center transition-all border border-white/5 active:scale-95"
                  >
                    <Package size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Package size={48} className="text-gray-600 mb-4 animate-pulse" />
          <h3 className="text-white font-black text-lg">No orders found</h3>
          <p className="text-gray-500 text-sm">Try adjusting your search or filters.</p>
        </div>
      )}

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setSelectedOrder(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg glass-panel bg-[#090909] rounded-[1.8rem] border border-white/10 p-8.5 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-black text-white mb-8 tracking-tight">Order Details</h2>
              <div className="space-y-8">
                <div>
                  <h4 className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2.5 ml-1">Customer</h4>
                  <p className="text-white font-bold bg-white/5 px-5 py-4 rounded-xl border border-white/5 text-sm">{selectedOrder.userId}</p>
                </div>
                <div>
                  <h4 className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2.5 ml-1">Delivery Address</h4>
                  <p className="text-white font-medium bg-[#050505]/40 p-6 rounded-2xl border border-white/5 text-sm leading-relaxed">
                    {selectedOrder.address ? (
                      <>
                        <span className="text-white font-black">
                          {typeof selectedOrder.address === 'object' ? selectedOrder.address.location : selectedOrder.address}
                        </span><br/>
                        <span className="text-gray-400 font-bold text-xs mt-1.5 inline-block">
                          Phone: {selectedOrder.customerPhone || (typeof selectedOrder.address === 'object' ? selectedOrder.address.phone : '')}
                        </span><br/>
                        {(selectedOrder.notes || (typeof selectedOrder.address === 'object' ? selectedOrder.address.notes : '')) && (
                          <div className="mt-3 bg-charistar-green/10 text-charistar-green border border-charistar-green/20 px-3.5 py-2 rounded-xl text-xs font-bold italic">
                            Note: {selectedOrder.notes || (typeof selectedOrder.address === 'object' ? selectedOrder.address.notes : '')}
                          </div>
                        )}
                      </>
                    ) : 'No address provided'}
                  </p>
                </div>
                <div>
                  <h4 className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2.5 ml-1">Items</h4>
                  <div className="bg-white/5 rounded-xl border border-white/5 divide-y divide-white/5">
                    {selectedOrder.items?.map((item, i) => (
                      <div key={i} className="p-4.5 flex justify-between items-center text-sm">
                        <span className="text-white font-bold">{item.quantity}x {item.title}</span>
                        <span className="text-gray-400 font-extrabold">{item.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="w-full mt-10 bg-white/10 hover:bg-white/20 text-white font-black uppercase tracking-widest text-xs py-4.5 rounded-[1.2rem] transition-all"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
