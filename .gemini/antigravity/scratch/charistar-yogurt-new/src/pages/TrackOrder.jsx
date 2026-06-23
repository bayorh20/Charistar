import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Phone, MessageSquare, X, Clock, Loader, Send, ChevronUp, ChevronDown
} from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { STATUS_NOTIFICATIONS } from '../data/statusNotifications';

export default function TrackOrder() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  // States
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  // UI Expand / Close panels
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);
  const [isDialerOpen, setIsDialerOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [riderRating, setRiderRating] = useState(0);
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const [particles, setParticles] = useState([]);
  
  // Chat State
  const [chatMessages, setChatMessages] = useState([
    { sender: 'rider', text: "Hello! I am Chinedu, your Charistar dispatcher. Preparing to load your fresh order! 🛵", time: 'Just now' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isRiderTyping, setIsRiderTyping] = useState(false);
  const [timeWindow, setTimeWindow] = useState('');

  // Delivery time window calculation
  useEffect(() => {
    if (order?.deliverySlot) {
      if (order.deliverySlot === 'lunch') {
        setTimeWindow('Lunch: 10:00 AM - 2:00 PM');
      } else if (order.deliverySlot === 'dinner') {
        setTimeWindow('Dinner: 3:00 PM - 8:00 PM');
      }
      return;
    }

    const calculateTimeWindow = () => {
      const now = new Date();
      const formatTime = (date) => {
        let hours = date.getHours();
        let minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        return `${hours}:${minutes} ${ampm}`;
      };

      const start = new Date(now.getTime() + 15 * 60 * 1000);
      const end = new Date(now.getTime() + 30 * 60 * 1000);
      setTimeWindow(`${formatTime(start)} - ${formatTime(end)}`);
    };
    calculateTimeWindow();
  }, [loading, order]);

  // Firestore Live Connection
  useEffect(() => {
    if (!orderId || orderId === 'demo') {
      setTimeout(() => {
        setOrder({
          id: 'DEMO-777',
          status: 'dispatched',
          createdAt: { toDate: () => new Date() },
          customerDetails: {
            name: 'Jane Doe',
            phone: '+234 812 345 6789',
            address: 'Avenue 3, Samonda Estate, Samonda, Ibadan'
          },
          items: [
            { title: 'Signature Strawberry Yogurt Parfait', quantity: 2, price: '₦4,500' },
            { title: 'Mango Paradise Double Layer Parfait', quantity: 1, price: '₦5,200' }
          ],
          subtotal: 14200,
          deliveryFee: 1500,
          discount: 1500,
          total: 14200,
          paymentMethod: 'wallet'
        });
        setLoading(false);
      }, 0);
      return;
    }

    const docRef = doc(db, 'orders', orderId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const orderData = docSnap.data();
        setOrder({ id: docSnap.id, ...orderData });
      } else {
        setTimeout(() => {
          setOrder({
            id: orderId.slice(0, 8).toUpperCase(),
            status: 'dispatched',
            createdAt: { toDate: () => new Date() },
            customerDetails: {
              name: 'Premium Customer',
              phone: '+234 908 765 4321',
              address: 'Ventura Mall Court, Samonda, Ibadan'
            },
            items: [
              { title: 'Wildberry Deluxe Custom Granola Parfait', quantity: 2, price: '₦5,000' }
            ],
            subtotal: 10000,
            deliveryFee: 1500,
            discount: 0,
            total: 11500,
            paymentMethod: 'card'
          });
        }, 1000);
      }
      setLoading(false);
    }, (err) => {
      console.error("Firestore Subscribe Error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [orderId]);

  const activeStatus = order?.status || 'pending';

  // Realistic movement simulation: smoothly increases progress over time during 'dispatched' status
  useEffect(() => {
    const statusLower = (activeStatus || 'pending').toLowerCase();
    if (statusLower === 'pending' || statusLower === 'confirmed') {
      setProgress(0);
    } else if (statusLower === 'processing' || statusLower === 'preparing') {
      setProgress(15);
    } else if (statusLower === 'delivered') {
      setProgress(100);
    } else if (statusLower === 'dispatched') {
      // Start at 20% and slowly move up to 96%
      setProgress(20);
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 96) {
            clearInterval(interval);
            return 96;
          }
          // Increment randomly by small steps to look like realistic GPS movement
          const increment = Math.random() * 1.5 + 0.5;
          return Math.min(96, prev + increment);
        });
      }, 2500);

      return () => clearInterval(interval);
    }
  }, [activeStatus]);

  // Lock body scroll when chat is open
  useEffect(() => {
    if (isChatOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isChatOpen]);

  // Visual Viewport tracking for mobile keyboards
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!window.visualViewport) return;

    const handleResize = () => {
      // If chat is closed, do nothing to prevent interfering with normal page scrolling
      if (!isChatOpen) return;

      const vvHeight = window.visualViewport.height;
      const layoutHeight = window.innerHeight;
      setViewportHeight(vvHeight);
      
      const diff = layoutHeight - vvHeight;
      if (diff > 60) {
        setKeyboardHeight(diff);
      } else {
        setKeyboardHeight(0);
      }
    };

    window.visualViewport.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.visualViewport.removeEventListener('resize', handleResize);
    };
  }, [isChatOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const triggerStarBurst = () => {
    const newParticles = Array.from({ length: 12 }).map((_, i) => ({
      id: Math.random(),
      x: (Math.random() - 0.5) * 160,
      y: (Math.random() - 0.5) * 100 - 50,
      scale: Math.random() * 0.6 + 0.6,
      angle: Math.random() * 360,
      delay: Math.random() * 0.2
    }));
    setParticles(newParticles);
    setTimeout(() => {
      setParticles([]);
    }, 1500);
  };

  const handleRating = (ratingValue) => {
    setRiderRating(ratingValue);
    if (ratingValue === 5) {
      triggerStarBurst();
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isRiderTyping, showReviewPrompt]);

  useEffect(() => {
    if (isChatOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isChatOpen]);

  const getFormattedTime = () => {
    const d = new Date();
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const triggerChatLifecycle = (text) => {
    // 1. Update status to 'delivered' after 600ms
    setTimeout(() => {
      setChatMessages(prev => {
        const lastCustomerIdx = prev.map(m => m.sender).lastIndexOf('customer');
        if (lastCustomerIdx !== -1) {
          const updated = [...prev];
          updated[lastCustomerIdx] = { ...updated[lastCustomerIdx], status: 'delivered' };
          return updated;
        }
        return prev;
      });
    }, 600);

    // 2. Update status to 'seen' after 1300ms and show typing indicator
    setTimeout(() => {
      setChatMessages(prev => {
        const lastCustomerIdx = prev.map(m => m.sender).lastIndexOf('customer');
        if (lastCustomerIdx !== -1) {
          const updated = [...prev];
          updated[lastCustomerIdx] = { ...updated[lastCustomerIdx], status: 'seen' };
          return updated;
        }
        return prev;
      });
      setIsRiderTyping(true);
    }, 1300);

    // 3. Post rider response after 3200ms
    setTimeout(() => {
      let responseText = "Got it! Pedaling as fast as I can safely go. 🚴‍♂️💨";
      const lower = text.toLowerCase();
      
      if (lower.includes('cold') || lower.includes('melt') || lower.includes('insulate')) {
        responseText = "Your items are secured in our insulated carrier bag. Meticulously packed! ❄️🛍️";
      } else if (lower.includes('where') || lower.includes('located') || lower.includes('position') || lower.includes('currently')) {
        if (progress < 30) {
          responseText = "Just packing up the carrier at the Ibadan Kitchen! Leaving in 1 minute. 🎒📍";
        } else if (progress < 75) {
          responseText = "Cruising past UI Gate and Samonda Road! Zero traffic on my lane. Be with you shortly! 🌉⚡";
        } else {
          responseText = "Almost at your gate! Just sorting parking with security outside. See you in 1 minute! 🏡✨";
        }
      } else if (lower.includes('gate') || lower.includes('call') || lower.includes('arrive')) {
        responseText = "Understood. I will call your phone number directly the moment I approach the lobby! 📞✅";
      } else if (lower.includes('spoon') || lower.includes('napkin') || lower.includes('extra')) {
        responseText = "Yes! I double-checked the package, we included 2 premium wooden spoons and extra napkins for you. 👍";
      } else if (lower.includes('thank')) {
        responseText = "My absolute pleasure! Enjoy your meal. ❤️🍴";
      }

      setChatMessages(prev => [...prev, { sender: 'rider', text: responseText, time: getFormattedTime() }]);
      setIsRiderTyping(false);

      // Sense if the message is satisfactory to trigger a rider review card
      const lowerText = text.toLowerCase();
      if (lowerText.includes('thank') || lowerText.includes('spoon') || lowerText.includes('napkin') || lowerText.includes('extra') || progress >= 90) {
        setTimeout(() => {
          setShowReviewPrompt(true);
        }, 1200);
      }
    }, 3200);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    const timeStr = getFormattedTime();
    const newMsg = { sender: 'customer', text: userMsg, time: timeStr, status: 'sent' };
    
    setChatMessages(prev => [...prev, newMsg]);
    setChatInput('');

    triggerChatLifecycle(userMsg);

    // Keep the input field focused so the keyboard doesn't dismiss/hide
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  };

  const handleSendSuggestion = (suggestText) => {
    const timeStr = getFormattedTime();
    const newMsg = { sender: 'customer', text: suggestText, time: timeStr, status: 'sent' };
    
    setChatMessages(prev => [...prev, newMsg]);

    triggerChatLifecycle(suggestText);
  };


  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`min-h-screen flex flex-col font-sans bg-[#050505] no-scrollbar ${
        isChatOpen ? 'h-screen overflow-hidden' : 'pb-36 overflow-y-auto'
      }`}
    >
      <style>{`

        @keyframes typing-bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-3px); opacity: 1; }
        }
        .typing-dot {
          display: inline-block;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          animation: typing-bounce 0.8s infinite ease-in-out;
        }
        .typing-dot:nth-child(2) {
          animation-delay: 0.15s;
        }
        .typing-dot:nth-child(3) {
          animation-delay: 0.3s;
        }
      `}</style>

      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-[#050505] px-6 pt-12 pb-5 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/orders')} 
            aria-label="Back to orders list"
            className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-white/10 active:scale-95 transition-transform border border-white/5"
          >
            <ArrowLeft size={16} className="text-white" />
          </button>
          <div>
            <h1 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-1">Tracker</h1>
            <p className="text-xs font-bold text-white">Order #{order?.id.toUpperCase()}</p>
          </div>
        </div>

        <span className="text-[9px] font-bold uppercase bg-[#A3C644]/10 text-[#A3C644] px-3.5 py-1.5 rounded-lg border border-[#A3C644]/20 tracking-wider">
          {activeStatus}
        </span>
      </div>

      <div className="px-6 pt-6 space-y-6 flex-1 max-w-[420px] mx-auto w-full">
        
        {/* REJECTION WARNING */}
        {order?.status === 'cancelled' && (
          <div className="p-5 rounded-2xl border border-red-500/20 bg-red-950/10 shadow-sm animate-scaleUp">
            <div className="flex gap-3 items-start">
              <div className="w-10 h-10 bg-red-500/10 text-red-400 rounded-xl flex items-center justify-center border border-red-500/15 flex-shrink-0">
                <X size={18} strokeWidth={2.5} />
              </div>
              <div className="space-y-1">
                <p className="text-[9px] text-red-400 font-bold uppercase tracking-widest">Rejection Alert</p>
                <h2 className="text-sm font-bold text-white tracking-tight">Verification Failed</h2>
                <p className="text-[11px] text-gray-400 font-medium mt-1">
                  {order?.rejectionReason || "This order failed security checks and has been cancelled."}
                </p>
                {order?.paymentMethod === 'wallet' && (
                  <p className="text-[9px] text-[#A3C644] font-bold mt-2">
                    ✓ Refunded to wallet balance
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* TIME WINDOW & ADRESS */}
        <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-between">
          <div className="space-y-1.5 flex-1 pr-4">
            {order?.deliverySlot ? (
              <>
                <p className="text-[9px] text-[#A3C644] font-bold uppercase tracking-widest flex items-center gap-1.5">
                  ⏰ Delivery Schedule Chosen
                </p>
                <h2 className="text-xs font-black text-white uppercase tracking-wider mt-0.5">
                  {order.deliverySlot.startsWith('custom:') 
                    ? `Custom Delivery (${order.deliverySlot.replace('custom:', '')})` 
                    : (order.deliverySlot === 'lunch' ? 'Lunch Delivery (10:00 AM - 2:00 PM)' : 'Dinner Delivery (3:00 PM - 8:00 PM)')}
                </h2>
                <div className="pt-2.5 border-t border-white/5 mt-2.5">
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                    Estimated Delivery
                  </p>
                  <p className="text-[11px] font-bold text-gray-300 mt-0.5 leading-relaxed">
                    Your order will be delivered within 30min-1 hour depending on your location
                  </p>
                </div>
              </>
            ) : (
              <>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                  Estimated Delivery
                </p>
                <h2 className="text-xl font-black text-white tracking-tight leading-none mt-0.5">
                  {activeStatus === 'delivered' ? (
                    <span className="text-[#A3C644]">Delivered</span>
                  ) : (
                    timeWindow || 'Calculating...'
                  )}
                </h2>
              </>
            )}
            <p className="text-[10px] text-gray-500 font-medium mt-2.5 pt-2.5 border-t border-white/5">
              {order?.customerDetails?.address || 'Your Address'}
            </p>
          </div>
          
          <div className="w-10 h-10 bg-white/5 text-gray-400 rounded-xl flex items-center justify-center border border-white/5 flex-shrink-0">
            <Clock size={18} />
          </div>
        </div>

        {/* LINEAR PROGRESS TRACKER */}
        <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] space-y-5">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-gray-500">
            <span>Delivery Progress</span>
            <span className="text-[#A3C644] px-2.5 py-1 rounded bg-[#A3C644]/10 border border-[#A3C644]/20">{activeStatus}</span>
          </div>

          <div className="relative pt-4 pb-2">
            {/* The Track Line */}
            <div className="absolute top-1/2 left-0 right-0 h-[3px] bg-white/5 -translate-y-1/2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#A3C644] transition-all duration-700 ease-out" 
                style={{ width: `${
                  (activeStatus || 'pending').toLowerCase() === 'delivered' ? 100 :
                  (activeStatus || 'pending').toLowerCase() === 'dispatched' ? 66 :
                  ((activeStatus || 'pending').toLowerCase() === 'preparing' || (activeStatus || 'pending').toLowerCase() === 'processing') ? 33 : 0
                }%` }}
              />
            </div>
            
            {/* Nodes */}
            <div className="relative flex justify-between">
              {[
                { label: 'Received' },
                { label: 'Preparing' },
                { label: 'On the Way' },
                { label: 'Delivered' }
              ].map((node, nIdx) => {
                const statusIndices = { pending: 0, confirmed: 0, preparing: 1, processing: 1, dispatched: 2, delivered: 3 };
                const currentIdx = statusIndices[(activeStatus || 'pending').toLowerCase()] ?? 0;
                const isCompleted = currentIdx >= nIdx;
                const isActive = currentIdx === nIdx;
                return (
                  <div key={nIdx} className="flex flex-col items-center z-10">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      isCompleted ? 'bg-[#A3C644] text-black shadow-[0_0_12px_rgba(163,198,68,0.3)]' : 'bg-[#050505] border border-white/10 text-gray-600'
                    }`}>
                      {isCompleted ? (
                        <span className="text-[10px] font-black">✓</span>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-700" />
                      )}
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider mt-2.5 ${
                      isActive ? 'text-[#A3C644]' : isCompleted ? 'text-white' : 'text-gray-600'
                    }`}>
                      {node.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Status Log description */}
          <div className="pt-4 border-t border-white/5 text-center">
            <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
              {STATUS_NOTIFICATIONS[activeStatus.toLowerCase()]?.trackerLog || '⏳ Updating order status...'}
            </p>
          </div>
        </div>

        {/* RIDER DISPATCHER CARD */}
        <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-white/5 flex-shrink-0">
              <img src="https://ui-avatars.com/api/?name=Chinedu+Dispatcher&background=ccff00&color=000&size=100" alt="Rider" className="w-full h-full object-cover" />
            </div>
            
            <div className="space-y-0.5">
              <h3 className="text-white text-xs font-bold tracking-tight">Chinedu Dispatcher</h3>
              {isRiderTyping ? (
                <div className="flex items-center gap-1 text-[#A3C644] text-[9px] font-bold uppercase tracking-widest">
                  <span>Typing</span>
                  <span className="flex gap-0.5 items-center mb-0.5">
                    <span className="typing-dot bg-[#A3C644]" />
                    <span className="typing-dot bg-[#A3C644]" />
                    <span className="typing-dot bg-[#A3C644]" />
                  </span>
                </div>
              ) : (
                <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest">Charistar Dispatch</p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setIsDialerOpen(true)}
              aria-label="Call dispatcher"
              className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 border border-white/5 active:scale-95 transition-transform"
            >
              <Phone size={14} />
            </button>
            <button 
              onClick={() => setIsChatOpen(true)}
              aria-label="Chat with dispatcher"
              className="w-9 h-9 rounded-lg bg-[#A3C644] text-black flex items-center justify-center active:scale-95 transition-transform relative"
            >
              <MessageSquare size={14} strokeWidth={2.5} />
              {isRiderTyping && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-[#050505]"></span>
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ORDER SUMMARY DETAIL */}
        <div className="rounded-2xl border border-white/5 overflow-hidden bg-white/[0.02]">
          <button 
            onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
            aria-label="Toggle order items details"
            className="w-full px-5 py-4 flex items-center justify-between text-left text-[11px] font-bold text-white uppercase tracking-wider"
          >
            <span>Items & Payment</span>
            {isSummaryExpanded ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
          </button>

          <AnimatePresence>
            {isSummaryExpanded && (
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden border-t border-white/5"
              >
                <div className="p-5 space-y-4">
                  <div className="space-y-2">
                    {order?.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-medium truncate max-w-[280px]">
                          {item.quantity}x {item.title}
                        </span>
                        <span className="text-white font-bold">{item.price}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-white/5 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-gray-500">
                      <span>Subtotal</span>
                      <span className="text-gray-300">₦{((order?.subtotal) || (order?.totalAmount ? order?.totalAmount - (order?.deliveryFee || 1500) : 0)).toLocaleString()}</span>
                    </div>
                    {order?.discount > 0 && (
                      <div className="flex justify-between items-center text-[#A3C644] font-bold">
                        <span>Discount</span>
                        <span>-₦{order?.discount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-gray-500">
                      <span>Delivery Fee</span>
                      <span className="text-gray-300">₦{Number(order?.deliveryFee ?? 1500).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2.5 border-t border-white/5 text-[13px] font-bold text-white">
                      <span>Total Paid ({order?.paymentMethod})</span>
                      <span className="text-[#A3C644]">₦{(order?.total || order?.totalAmount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* DIALER MODAL */}
      <AnimatePresence>
        {isDialerOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="w-20 h-20 rounded-full overflow-hidden border border-white/10 mb-6">
              <img src="https://ui-avatars.com/api/?name=Chinedu+Dispatcher&background=ccff00&color=000&size=120" alt="Rider" className="w-full h-full object-cover" />
            </div>
            
            <h2 className="text-lg font-bold text-white tracking-tight">Chinedu Dispatcher</h2>
            <p className="text-gray-500 text-xs mt-2 max-w-[240px]">
              Direct connection to courier line:
            </p>
            <p className="text-white font-bold text-sm mt-1">{order?.customerDetails?.phone || '+234 812 345 6789'}</p>

            <a 
              href={`tel:${order?.customerDetails?.phone || '080000000'}`}
              aria-label="Call dispatcher phone number"
              className="px-6 h-11 bg-[#A3C644] text-black font-bold uppercase tracking-wider text-[11px] rounded-xl flex items-center justify-center gap-2 mt-6 active:scale-95 transition-transform"
            >
              <Phone size={13} /> Launch Call
            </a>

            <button 
              onClick={() => setIsDialerOpen(false)}
              aria-label="Close call dialer panel"
              className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-red-400 border border-white/5 hover:bg-white/10 active:scale-95 transition-transform mt-10"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LIVE CHAT DRAWER */}
      <AnimatePresence>
        {isChatOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-40"
              onClick={() => setIsChatOpen(false)}
            />
            
            <motion.div 
              initial={{ scale: 0.85, opacity: 0, x: '-50%', y: '-50%' }}
              animate={{ scale: 1, opacity: 1, x: '-50%', y: '-50%' }}
              exit={{ scale: 0.85, opacity: 0, x: '-50%', y: '-50%' }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              style={{
                top: '50%',
                left: '50%',
                height: `min(540px, ${viewportHeight - 32}px)`,
                width: 'calc(100% - 32px)'
              }}
              className="fixed bg-[#0c0c0e]/95 backdrop-blur-xl border border-white/10 rounded-[2.2rem] z-50 flex flex-col overflow-hidden max-w-[400px] shadow-[0_25px_60px_rgba(0,0,0,0.85)]"
            >
              {/* Top Spacing */}
              <div className="w-full pt-4 flex-shrink-0"></div>

              {/* Chat Header */}
              <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-white/5">
                    <img src="https://ui-avatars.com/api/?name=Chinedu+Dispatcher&background=ccff00&color=000&size=80" alt="Rider" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-white text-xs font-bold leading-tight">Chinedu Dispatcher</h3>
                    {isRiderTyping ? (
                      <div className="flex items-center gap-1 text-[#A3C644] text-[9px] font-bold uppercase tracking-widest mt-0.5">
                        <span>Typing</span>
                        <span className="flex gap-0.5 items-center mb-0.5">
                          <span className="typing-dot bg-[#A3C644]" />
                          <span className="typing-dot bg-[#A3C644]" />
                          <span className="typing-dot bg-[#A3C644]" />
                        </span>
                      </div>
                    ) : (
                      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                        Transit Rider
                      </p>
                    )}
                  </div>
                </div>
 
                <button 
                  onClick={() => setIsChatOpen(false)}
                  aria-label="Close chat drawer"
                  className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/5 text-white transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
 
              {/* Chat Messages */}
              <div className="flex-1 p-6 overflow-y-auto no-scrollbar space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex flex-col max-w-[80%] ${msg.sender === 'customer' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                  >
                    <div className={`p-3.5 rounded-2xl text-[11px] font-semibold leading-relaxed ${
                      msg.sender === 'customer' 
                        ? 'bg-[#A3C644] text-black rounded-tr-none' 
                        : 'bg-white/5 text-white border border-white/5 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 px-1 justify-end">
                      <span className="text-[8px] text-gray-500 font-semibold">{msg.time}</span>
                      {msg.sender === 'customer' && (
                        <span className="text-[9px] font-bold leading-none select-none flex items-center">
                          {msg.status === 'sent' && <span className="text-gray-600">✓</span>}
                          {msg.status === 'delivered' && <span className="text-gray-500">✓✓</span>}
                          {msg.status === 'seen' && <span className="text-[#A3C644]">✓✓</span>}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
 
                {isRiderTyping && (
                  <div className="flex flex-col mr-auto items-start max-w-[80%]">
                    <div className="bg-white/5 text-white border border-white/5 px-4 py-3.5 rounded-2xl rounded-tl-none flex items-center gap-1">
                      <span className="typing-dot bg-white" />
                      <span className="typing-dot bg-white" />
                      <span className="typing-dot bg-white" />
                    </div>
                  </div>
                )}
                
                {showReviewPrompt && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="mr-auto ml-auto w-full max-w-[85%] bg-white/[0.03] border border-white/10 rounded-2xl p-4.5 text-center space-y-3 shadow-lg my-2 relative overflow-hidden"
                  >
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">How was your delivery?</p>
                    <h4 className="text-white text-xs font-bold">Rate Chinedu Dispatcher</h4>
                    
                    <div className="flex justify-center gap-2 py-1 relative">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRating(star)}
                          className={`text-lg transition-transform active:scale-90 ${
                            star <= riderRating ? 'text-[#A3C644] scale-110 drop-shadow-[0_0_8px_rgba(163,198,68,0.5)]' : 'text-gray-600 hover:text-[#A3C644]/70'
                          }`}
                        >
                          ★
                        </button>
                      ))}

                      {/* Bursting Particles overlay */}
                      {particles.map((p) => (
                        <motion.span
                          key={p.id}
                          initial={{ opacity: 1, x: 0, y: 0, scale: 0, rotate: 0 }}
                          animate={{ 
                            opacity: 0, 
                            x: p.x, 
                            y: p.y, 
                            scale: p.scale, 
                            rotate: p.angle 
                          }}
                          transition={{ duration: 1.2, ease: "easeOut", delay: p.delay }}
                          className="absolute text-yellow-400 pointer-events-none text-xs"
                        >
                          ★
                        </motion.span>
                      ))}
                    </div>
                    
                    {riderRating > 0 ? (
                      <motion.p 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-[#A3C644] text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1"
                      >
                        🌟 Thank you for the {riderRating}-Star Rating!
                      </motion.p>
                    ) : (
                      <p className="text-[9px] text-gray-500 font-medium">Tap stars to submit feedback</p>
                    )}
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
 
              {/* Rapid Suggestions */}
              <div className="px-6 py-2.5 bg-white/[0.01] border-t border-white/5 flex gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
                {[
                  "Where are you currently?",
                  "insulate perfectly please! 🧊",
                  "Call when at gate 👍",
                  "Thank you!"
                ].map((suggest, sIdx) => (
                  <button 
                    key={sIdx}
                    onClick={() => handleSendSuggestion(suggest)}
                    className="flex-shrink-0 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 text-[9px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-full transition-colors"
                  >
                    {suggest}
                  </button>
                ))}
              </div>
 
              {/* Chat Input form */}
              <form onSubmit={handleSendMessage} className="p-4 pb-4 border-t border-white/5 flex gap-3 flex-shrink-0 bg-[#0c0c0e]">
                <div className="flex-1 bg-white/5 rounded-xl px-4 py-2.5 flex items-center border border-white/5 focus-within:border-white/10 transition-colors">
                  <input 
                    ref={inputRef}
                    type="text" 
                    placeholder="Type message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    aria-label="Type message to dispatcher"
                    className="bg-transparent border-none outline-none text-white font-semibold text-xs w-full placeholder:text-gray-600"
                  />
                </div>
                
                <button 
                  type="submit"
                  aria-label="Send text message"
                  className="w-10 h-10 bg-[#A3C644] text-black rounded-xl flex items-center justify-center active:scale-95 transition-transform"
                >
                  <Send size={14} className="stroke-[2.5px]" />
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
