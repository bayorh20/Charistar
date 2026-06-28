import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useOrderAlert } from '../context/OrderAlertContext';
import { useNavigate } from 'react-router-dom';
import { 
  Flame, Clock, ShieldCheck, ArrowRight, PhoneCall,
  ChevronRight, Volume2, User, Phone, MapPin, ListCollapse,
  MessageSquare, UserCheck, AlertOctagon, RefreshCw
} from 'lucide-react';
import { db } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import PasscodeModal from '../components/PasscodeModal';

// Live Kitchen Prep Timer component
const PrepTimer = ({ createdAt, status }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (status === 'Delivered' || status === 'Cancelled') return;
    
    const calculate = () => {
      const diffMs = Date.now() - new Date(createdAt).getTime();
      setElapsed(Math.floor(diffMs / 1000));
    };
    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [createdAt, status]);

  const elapsedMin = Math.floor(elapsed / 60);
  const targetPrep = 25; // 25 minutes target prep time
  const timeLeft = targetPrep - elapsedMin;
  const isDelayed = timeLeft < 0;

  if (status === 'Ready' || status === 'Out for Delivery') {
    return (
      <span className="text-[9px] font-black bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-md uppercase">
        Ready to Dispatch
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 text-[9.5px] font-black uppercase px-2.5 py-0.5 rounded-md shadow-xs ${
      isDelayed 
        ? 'bg-red-600 text-white animate-pulse' 
        : timeLeft <= 5 
          ? 'bg-amber-500 text-slate-950 animate-pulse' 
          : 'bg-green-500/10 text-green-600 dark:text-green-400'
    }`}>
      <Clock size={10} />
      <span>
        {isDelayed ? `Delayed: ${Math.abs(timeLeft)}m` : `${timeLeft}m left`}
      </span>
    </div>
  );
};

const LiveOrderFeed = () => {
  const { orders, menuItems, riders, logAction } = useApp();
  const { newOrderAlert, clearAlert, soundEnabled } = useOrderAlert();
  const navigate = useNavigate();

  // Highlight effect state
  const [highlightId, setHighlightId] = useState(null);

  useEffect(() => {
    if (newOrderAlert) {
      setHighlightId(newOrderAlert.id);
      const timer = setTimeout(() => {
        setHighlightId(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [newOrderAlert]);

  const getItemImage = (item) => {
    if (item.image) return item.image;
    const found = (menuItems || []).find(m => m.id === item.id);
    return found?.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80';
  };

  // Filter active live orders
  const liveOrders = (orders || [])
    .filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Whatsapp and Call action triggers
  const getWhatsappLink = (phone, orderId) => {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '234' + cleanPhone.substring(1);
    }
    const message = `Hello, this is FoodMaxx Ibadan regarding your order #${orderId}. We are preparing your meal.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  // Rider assignment handle
  const handleAssignRider = async (orderId, riderName) => {
    if (!riderName) return;
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        driverName: riderName,
        status: 'Out for Delivery',
        statusIndex: 3,
        updatedAt: new Date().toISOString()
      });
      logAction(`Assigned rider ${riderName} to order #${orderId}`);
    } catch (err) {
      console.error('Failed to assign rider:', err);
    }
  };

  // Status progression bulk actions
  const handleUpdateStatus = async (orderId, nextStatus, nextIndex) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: nextStatus,
        statusIndex: nextIndex,
        updatedAt: new Date().toISOString()
      });
      logAction(`Updated order #${orderId} status to: ${nextStatus}`);
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Status Banner */}
      <div className="glass-card p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center animate-pulse">
            <Flame size={20} />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-850 dark:text-white leading-none">Real-Time Kitchen Feed</h4>
            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Listening directly to live Firestore orders stream</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></span>
          <span>Live Alert Feed Active</span>
        </div>
      </div>

      {/* Incoming Orders Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Feed Queue */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Incoming Active Queue ({liveOrders.length})</h4>
          
          {liveOrders.length === 0 ? (
            <div className="glass-card p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-800">
              <span className="text-3xl">📭</span>
              <h5 className="font-bold text-slate-750 dark:text-slate-350 mt-3 text-sm">No Active Orders</h5>
              <p className="text-xs text-slate-400 mt-1">New customer checkouts will appear here instantly without refreshing.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {liveOrders.map(order => {
                const isHighlighted = highlightId === order.id;
                
                // Priority Logic
                const timeDiffMs = Date.now() - new Date(order.createdAt).getTime();
                const minutesElapsed = Math.floor(timeDiffMs / 60000);
                const isCritical = minutesElapsed >= 20 && order.status === 'Order Received';
                const isVip = order.total >= 10000;
                
                return (
                  <div 
                    key={order.id} 
                    className={`glass-card p-5 rounded-3xl border transition-all duration-500 bg-white dark:bg-slate-800 flex flex-col justify-between min-h-[180px] ${
                      isHighlighted 
                        ? 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-500/5 dark:bg-orange-500/10 translate-x-1' 
                        : 'border-slate-150 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-50 dark:border-slate-700/50 pb-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-slate-800 dark:text-white">
                            #{order.id}
                          </span>
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                            order.status === 'Order Received' ? 'bg-orange-500/10 text-orange-500' : 'bg-green-500/10 text-green-600'
                          }`}>
                            {order.status}
                          </span>
                          
                          {/* Priority Labels */}
                          {isCritical ? (
                            <span className="text-[9px] bg-red-600 text-white font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                              <AlertOctagon size={8} /> CRITICAL WAIT
                            </span>
                          ) : isVip ? (
                            <span className="text-[9px] bg-amber-500 text-slate-900 font-black uppercase px-2 py-0.5 rounded-md">
                              ★ VIP HIGH
                            </span>
                          ) : null}

                          {isHighlighted && (
                            <span className="text-[9px] bg-red-600 text-white font-black uppercase px-2 py-0.5 rounded-md animate-bounce">
                              NEW
                            </span>
                          )}
                        </div>

                        {/* Kitchen Prep Timer */}
                        <PrepTimer createdAt={order.createdAt} status={order.status} />
                      </div>

                      {/* Card Details Body */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Customer Information & Whatsapp Trigger */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-350">
                            <User size={13} className="text-slate-400" />
                            <span>{order.customerName}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                            <Phone size={13} className="text-slate-400" />
                            <span>{order.customerPhone}</span>
                            
                            {/* Copy & WhatsApp panel */}
                            <a 
                              href={getWhatsappLink(order.customerPhone, order.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 hover:bg-green-50 dark:hover:bg-green-950/20 text-green-600 rounded-md transition-colors ml-1"
                              title="Chat on WhatsApp"
                            >
                              <MessageSquare size={12} />
                            </a>
                            <a 
                              href={`tel:${order.customerPhone}`}
                              className="p-1 hover:bg-blue-50 dark:hover:bg-blue-950/20 text-blue-600 rounded-md transition-colors"
                              title="Call customer"
                            >
                              <PhoneCall size={12} />
                            </a>
                          </div>

                          <div className="flex items-start gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                            <MapPin size={13} className="text-slate-400 mt-0.5 shrink-0" />
                            <span className="line-clamp-1">{order.address?.name || 'No address provided'}</span>
                          </div>
                        </div>

                        {/* Order Items List */}
                        <div className="flex flex-wrap gap-1.5 justify-end">
                          {(order.cart || order.items || []).map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-1.5 rounded-2xl pr-3 text-left shadow-xs">
                              <div className="relative w-8 h-8 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                                <img 
                                  src={getItemImage(item)} 
                                  alt={item.name} 
                                  className="w-full h-full object-cover"
                                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'; }}
                                />
                              </div>
                              <div className="text-[10px] leading-tight font-black text-slate-700 dark:text-slate-250">
                                <span className="text-orange-500 mr-1">{item.quantity}x</span>
                                {item.name}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Rider Assignment & Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-700/50 pt-3 mt-4">
                      {/* Rider Dropdown Selector */}
                      <div className="flex items-center gap-2">
                        <UserCheck size={14} className="text-slate-400" />
                        <select
                          value={order.driverName || ''}
                          onChange={(e) => handleAssignRider(order.id, e.target.value)}
                          className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-bold text-slate-750 dark:text-slate-350 focus:outline-none"
                        >
                          <option value="">-- Assign Dispatch Rider --</option>
                          {riders?.map(r => (
                            <option key={r.id} value={r.name}>{r.name} ({r.status || 'Active'})</option>
                          ))}
                        </select>
                      </div>

                      {/* Status updates button */}
                      <div className="flex gap-2">
                        {order.status === 'Order Received' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'Preparing', 1)}
                            className="bg-orange-500 hover:bg-orange-600 text-white font-black text-[10px] uppercase px-3 py-1.5 rounded-xl shadow-xs transition-colors"
                          >
                            Accept & Prep
                          </button>
                        )}
                        {order.status === 'Preparing' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'Ready', 2)}
                            className="bg-green-600 hover:bg-green-700 text-white font-black text-[10px] uppercase px-3 py-1.5 rounded-xl shadow-xs transition-colors"
                          >
                            Mark Ready
                          </button>
                        )}
                        <button 
                          onClick={() => navigate('/orders', { state: { highlightOrderId: order.id } })}
                          className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-xl font-bold text-[10px] transition-colors"
                        >
                          <span>Manage</span>
                          <ArrowRight size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live Audio Controls Panel */}
        <div className="space-y-4">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Alert Controls</h4>
          
          <div className="glass-card p-5 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-750 dark:text-slate-350">Audio Notifications</span>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                soundEnabled ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
              }`}>
                {soundEnabled ? 'Enabled' : 'Muted'}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
              When a customer places a new order, a chime will play automatically. You can toggle audio alerts globally from the Topbar.
            </p>

            {newOrderAlert && (
              <button 
                onClick={clearAlert}
                className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold text-xs transition-colors shadow-md shadow-orange-500/10"
              >
                Dismiss Active Alert Banner
              </button>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default LiveOrderFeed;
