import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Phone, MessageSquare, X, Clock, Loader, Send, ChevronUp, ChevronDown
} from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

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
    if (activeStatus === 'pending') {
      setProgress(0);
    } else if (activeStatus === 'processing') {
      setProgress(15);
    } else if (activeStatus === 'delivered') {
      setProgress(100);
    } else if (activeStatus === 'dispatched') {
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

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: 'customer', text: userMsg, time: 'Just now' }]);
    setChatInput('');
    setIsRiderTyping(true);

    setTimeout(() => {
      let responseText = "Got it! Pedaling as fast as I can safely go. 🚴‍♂️💨";
      const lower = userMsg.toLowerCase();
      
      if (lower.includes('cold') || lower.includes('melt')) {
        responseText = "Your items are secured in our insulated carrier bag. Meticulously packed! ❄️🛍️";
      } else if (lower.includes('where') || lower.includes('located') || lower.includes('position')) {
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

      setChatMessages(prev => [...prev, { sender: 'rider', text: responseText, time: 'Just now' }]);
      setIsRiderTyping(false);
    }, 1200);
  };

  const steps = [
    { title: 'Order Confirmed', status: 'pending', desc: 'Received at Kitchen' },
    { title: 'Preparing Order', status: 'processing', desc: 'Kitchen is preparing your meal' },
    { title: 'Out for Delivery', status: 'dispatched', desc: 'Courier is on the way' },
    { title: 'Delivered', status: 'delivered', desc: 'Arrived at your location' }
  ];

  const getStepState = (statusKey, idx) => {
    const statusIndices = { pending: 0, processing: 1, dispatched: 2, delivered: 3 };
    const currentIndex = statusIndices[activeStatus];
    if (idx < currentIndex) return 'completed';
    if (idx === currentIndex) return 'active';
    return 'pending';
  };

  // Calculate coordinates along a smooth curved Bezier path
  // P0 = (30, 130)  - Store (Ibadan Kitchen)
  // P1 = (110, 130) - First control/handle point
  // P2 = (170, 50)  - Intermediate curve control point
  // P3 = (230, 50)  - Intermediate curve control point
  // P4 = (310, 110) - Customer delivery address
  // We approximate the bezier curve with small segments for precise tracking
  const getCoordinatesAt = (percent) => {
    const t = percent / 100;
    
    // Cubic Bezier helper function
    const getBezierPoint = (p0, p1, p2, p3, tVal) => {
      const cx = 3 * (p1.x - p0.x);
      const bx = 3 * (p2.x - p1.x) - cx;
      const ax = p3.x - p0.x - cx - bx;

      const cy = 3 * (p1.y - p0.y);
      const by = 3 * (p2.y - p1.y) - cy;
      const ay = p3.y - p0.y - cy - by;

      const x = ax * Math.pow(tVal, 3) + bx * Math.pow(tVal, 2) + cx * tVal + p0.x;
      const y = ay * Math.pow(tVal, 3) + by * Math.pow(tVal, 2) + cy * tVal + p0.y;
      return { x, y };
    };

    // Define the segments of bezier curves
    // Segment 1 (Curve from Store to Bridge/Midpoint)
    // M 30, 130 -> C 110, 130, 150, 70, 180, 70
    // Segment 2 (Curve from Midpoint to Customer)
    // C 210, 70, 250, 110, 310, 110
    const p0 = { x: 30, y: 130 };
    const p1 = { x: 110, y: 130 };
    const p2 = { x: 150, y: 70 };
    const p3 = { x: 180, y: 70 };

    const q0 = { x: 180, y: 70 };
    const q1 = { x: 210, y: 70 };
    const q2 = { x: 250, y: 110 };
    const q3 = { x: 310, y: 110 };

    let x, y, dx, dy;

    if (t <= 0.5) {
      const localT = t * 2;
      const pt = getBezierPoint(p0, p1, p2, p3, localT);
      x = pt.x;
      y = pt.y;

      // Small delta to compute tangent angle
      const ptNext = getBezierPoint(p0, p1, p2, p3, Math.min(1.0, localT + 0.01));
      dx = ptNext.x - x;
      dy = ptNext.y - y;
    } else {
      const localT = (t - 0.5) * 2;
      const pt = getBezierPoint(q0, q1, q2, q3, localT);
      x = pt.x;
      y = pt.y;

      // Small delta to compute tangent angle
      const ptNext = getBezierPoint(q0, q1, q2, q3, Math.min(1.0, localT + 0.01));
      dx = ptNext.x - x;
      dy = ptNext.y - y;
    }

    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    return { x, y, angle };
  };

  const { x: riderX, y: riderY, angle: riderAngle } = getCoordinatesAt(progress);

  const getDestinationArea = () => {
    const address = order?.customerDetails?.address || order?.address || '';
    if (!address) return 'Samonda, Ibadan';
    
    const ibadanAreas = [
      'Samonda', 'Akobo', 'Challenge', 'Ring Road', 'Iwo Road', 
      'Jericho', 'Oluyole', 'Apata', 'Moniya', 'Agodi', 'UI', 'University of Ibadan',
      'Dugbe', 'Mokola', 'Orogun', 'Ojoo', 'Alakia'
    ];
    
    for (const area of ibadanAreas) {
      if (address.toLowerCase().includes(area.toLowerCase())) {
        return `${area}, Ibadan`;
      }
    }
    
    if (address.toLowerCase().includes('lagos') || address.toLowerCase().includes('lekki') || address.toLowerCase().includes('island')) {
      return 'Samonda, Ibadan';
    }
    
    const parts = address.split(',');
    if (parts.length > 1) {
      return `${parts[parts.length - 2].trim()}, Ibadan`;
    }
    
    return 'Samonda, Ibadan';
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pb-36 flex flex-col font-sans bg-[#050505] overflow-y-auto no-scrollbar"
    >
      <style>{`
        @keyframes rider-vibrate {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-1.5px) rotate(1deg); }
        }
        .vibrating-bike {
          animation: rider-vibrate 0.15s ease-in-out infinite;
        }
      `}</style>

      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-[#050505] px-6 pt-12 pb-5 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/orders')} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-white/10 active:scale-95 transition-transform border border-white/5">
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

        {/* ANIMATED MINIMALIST SVG ROUTE MAP */}
        <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Transit Map</span>
            {activeStatus === 'dispatched' && (
              <span className="text-[9px] text-[#A3C644] font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-[#A3C644] rounded-full animate-ping"></span> Live
              </span>
            )}
          </div>

          <div className="relative w-full h-[180px] bg-[#f8fafc] rounded-2xl border border-slate-200 overflow-hidden shadow-inner">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 340 180" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* STYLIZED GRID PATTERN (Streets background) */}
              <defs>
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(0, 0, 0, 0.03)" strokeWidth="1" />
                </pattern>
                <linearGradient id="routeGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#A3C644" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0.9" />
                </linearGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* WATERWAY (Dandola River Representation) */}
              <path 
                d="M 190 0 L 150 180 H 220 L 260 0 Z" 
                fill="rgba(59, 130, 246, 0.08)" 
                stroke="rgba(59, 130, 246, 0.12)" 
                strokeWidth="1"
              />

              {/* PARKS / GREEN AREAS */}
              <rect x="20" y="15" width="60" height="35" rx="8" fill="rgba(16, 185, 129, 0.05)" stroke="rgba(16, 185, 129, 0.08)" strokeWidth="1" />

              <rect x="250" y="120" width="70" height="40" rx="8" fill="rgba(16, 185, 129, 0.05)" stroke="rgba(16, 185, 129, 0.08)" strokeWidth="1" />

              {/* BACKGROUND DECORATIVE ROADS (Fake street grid) */}
              <path d="M 0 130 H 340" stroke="rgba(0,0,0,0.025)" strokeWidth="4" />
              <path d="M 110 0 V 180" stroke="rgba(0,0,0,0.025)" strokeWidth="4" />
              <path d="M 230 0 V 180" stroke="rgba(0,0,0,0.025)" strokeWidth="4" />
              <path d="M 310 0 V 180" stroke="rgba(0,0,0,0.025)" strokeWidth="4" />

              {/* ACTUAL ACTIVE TRANSIT ROAD OUTLINE */}
              <path 
                d="M 30,130 C 110,130 150,70 180,70 C 210,70 250,110 310,110" 
                stroke="rgba(0,0,0,0.05)" 
                strokeWidth="6" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <path 
                d="M 30,130 C 110,130 150,70 180,70 C 210,70 250,110 310,110" 
                stroke="#e2e8f0" 
                strokeWidth="4" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />

              {/* COMPLETED ROUTE ACTIVE HIGHLIGHT */}
              <path 
                d="M 30,130 C 110,130 150,70 180,70 C 210,70 250,110 310,110" 
                stroke="url(#routeGlow)" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                strokeDasharray="450"
                strokeDashoffset={450 - (450 * progress) / 100}
                className="transition-all duration-300 ease-out"
              />

              {/* LANDMARKS / NODES */}
              {/* Start Store Node (Lagos Kitchen) */}
              <g transform="translate(30, 130)">
                <circle r="9" fill="#ffffff" stroke="#A3C644" strokeWidth="2.5" className="shadow-md" />
                <circle r="4" fill="#A3C644" />
              </g>

              {/* Destination Residence Node */}
              <g transform="translate(310, 110)">
                <circle r="9" fill="#ffffff" stroke={activeStatus === 'delivered' ? '#A3C644' : 'rgba(0,0,0,0.15)'} strokeWidth={2.5} className="shadow-md" />
                <circle r="4" fill={activeStatus === 'delivered' ? '#A3C644' : 'rgba(0,0,0,0.2)'} />
              </g>


              {/* Animated Real Biker Vector Art (Replaces emoji 🛵) */}
              {activeStatus === 'dispatched' && (
                <g 
                  style={{
                    transform: `translate(${riderX}px, ${riderY}px) rotate(${riderAngle}deg)`,
                    transition: 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                  }}
                  className="vibrating-bike"
                >
                  {/* Glowing halo */}
                  <circle r="16" fill="rgba(163, 198, 68, 0.25)" className="animate-pulse" />
                  
                  {/* Vector Scooter Group (Drawn detailed, looks like real delivery operations) */}
                  <g transform="translate(-11, -11)">
                    {/* Delivery Box (Lime Green) */}
                    <rect x="1.5" y="3.5" width="6.5" height="6.5" rx="1" fill="#A3C644" stroke="#000" strokeWidth="0.8" />
                    {/* Box Strap/Detail */}
                    <line x1="1.5" y1="6.5" x2="8" y2="6.5" stroke="#000" strokeWidth="0.5" />
                    {/* Scooter Chassis (Dark grey) */}
                    <path d="M 8 9.5 H 14.5 L 18 13.5 H 10 Z" fill="#222" stroke="#000" strokeWidth="0.8" />
                    {/* Wheels */}
                    <circle cx="5.5" cy="14" r="2.8" fill="#111" stroke="#555" strokeWidth="0.8" />
                    <circle cx="5.5" cy="14" r="1" fill="#fff" />
                    <circle cx="15.5" cy="14" r="2.8" fill="#111" stroke="#555" strokeWidth="0.8" />
                    <circle cx="15.5" cy="14" r="1" fill="#fff" />
                    {/* Biker Body / Jacket (White/Lime) */}
                    <path d="M 8.5 7 L 11.5 4 L 14 8.5 L 11 11 Z" fill="#333" />
                    {/* Helmet */}
                    <circle cx="11.5" cy="3" r="2" fill="#fff" stroke="#000" strokeWidth="0.5" />
                    <path d="M 12 2.5 H 13.5" stroke="#000" strokeWidth="0.8" strokeLinecap="round" />
                    {/* Steering handlebars */}
                    <line x1="15.5" y1="9" x2="16.5" y2="12" stroke="#fff" strokeWidth="1" strokeLinecap="round" />
                  </g>
                </g>
              )}
            </svg>
            <span className="absolute bottom-2 right-6 text-[8px] font-bold uppercase text-gray-500 tracking-wider bg-black/80 px-2 py-0.5 rounded border border-white/5">{getDestinationArea()}</span>
          </div>
        </div>

        {/* LINEAR STATUS TIMELINE */}
        <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] space-y-6">
          <div className="relative pl-6 before:content-[''] before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10">
            {steps.map((step, idx) => {
              const state = getStepState(step.status, idx);
              return (
                <div key={idx} className="relative flex justify-between items-start mb-6 last:mb-0">
                  <div className={`absolute -left-[24px] top-1 w-2.5 h-2.5 rounded-full border flex items-center justify-center transition-all ${
                    state === 'completed' 
                      ? 'bg-[#A3C644] border-[#A3C644]' 
                      : state === 'active' 
                        ? 'bg-[#050505] border-[#A3C644] scale-110' 
                        : 'bg-[#050505] border-white/10'
                  }`}>
                    {state === 'active' && <div className="w-1 h-1 bg-[#A3C644] rounded-full animate-ping" />}
                  </div>

                  <div className="flex-1 min-w-0 ml-2">
                    <h4 className={`text-[11px] font-bold uppercase tracking-wider ${
                      state === 'active' ? 'text-[#A3C644]' : state === 'completed' ? 'text-white' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </h4>
                    <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
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
              <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest">Charistar Dispatch</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setIsDialerOpen(true)}
              className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 border border-white/5 active:scale-95 transition-transform"
            >
              <Phone size={14} />
            </button>
            <button 
              onClick={() => setIsChatOpen(true)}
              className="w-9 h-9 rounded-lg bg-[#A3C644] text-black flex items-center justify-center active:scale-95 transition-transform"
            >
              <MessageSquare size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* ORDER SUMMARY DETAIL */}
        <div className="rounded-2xl border border-white/5 overflow-hidden bg-white/[0.02]">
          <button 
            onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
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
              className="px-6 h-11 bg-[#A3C644] text-black font-bold uppercase tracking-wider text-[11px] rounded-xl flex items-center justify-center gap-2 mt-6 active:scale-95 transition-transform"
            >
              <Phone size={13} /> Launch Call
            </a>

            <button 
              onClick={() => setIsDialerOpen(false)}
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
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 30, stiffness: 250 }}
              className="fixed bottom-0 left-0 right-0 h-[80vh] bg-[#050505] border-t border-white/10 rounded-t-3xl z-50 flex flex-col overflow-hidden max-w-[420px] mx-auto"
            >
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10">
                    <img src="https://ui-avatars.com/api/?name=Chinedu+Dispatcher&background=ccff00&color=000&size=80" alt="Rider" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-white text-xs font-bold leading-tight">Chinedu Dispatcher</h3>
                    <p className="text-[9px] text-[#A3C644] font-bold uppercase tracking-widest mt-0.5">
                      Transit Rider
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/5 text-white"
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
                    <span className="text-[8px] text-gray-500 font-semibold mt-1 px-1">{msg.time}</span>
                  </div>
                ))}

                {isRiderTyping && (
                  <div className="flex flex-col mr-auto items-start max-w-[80%] animate-pulse">
                    <div className="bg-white/5 text-white border border-white/5 p-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-[#A3C644] animate-bounce"></span>
                      <span className="w-1 h-1 rounded-full bg-[#A3C644] animate-bounce delay-150"></span>
                      <span className="w-1 h-1 rounded-full bg-[#A3C644] animate-bounce delay-300"></span>
                    </div>
                  </div>
                )}
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
                    onClick={() => setChatInput(suggest)}
                    className="flex-shrink-0 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 text-[9px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-full transition-colors"
                  >
                    {suggest}
                  </button>
                ))}
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 flex gap-3 flex-shrink-0 bg-[#050505]">
                <div className="flex-1 bg-white/5 rounded-xl px-4 py-2.5 flex items-center border border-white/5 focus-within:border-white/10 transition-colors">
                  <input 
                    type="text" 
                    placeholder="Type message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="bg-transparent border-none outline-none text-white font-semibold text-xs w-full placeholder:text-gray-600"
                  />
                </div>
                
                <button 
                  type="submit"
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
