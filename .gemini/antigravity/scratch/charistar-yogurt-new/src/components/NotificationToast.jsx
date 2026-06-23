import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle, Truck, Utensils, X } from 'lucide-react';
import { useActiveOrder } from '../hooks/useActiveOrder';

const getUniqueNotifId = () => Date.now() + Math.random();

export default function NotificationToast() {
  const { activeOrder } = useActiveOrder();
  const [notifications, setNotifications] = useState([]);
  const prevStatusRef = useRef(null);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Defined before the useEffect that calls it
  const triggerNotification = useCallback((order) => {
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (e) {}

    const newNotif = {
      id: getUniqueNotifId(),
      status: order.status,
      orderId: order.id
    };

    setNotifications(prev => [newNotif, ...prev].slice(0, 3));

    setTimeout(() => {
      removeNotification(newNotif.id);
    }, 5000);
  }, [removeNotification]);

  useEffect(() => {
    if (activeOrder && prevStatusRef.current !== activeOrder.status) {
      if (prevStatusRef.current !== null) {
        // Status changed — trigger notification
        triggerNotification(activeOrder);
      }
      prevStatusRef.current = activeOrder.status;
    }
  }, [activeOrder, triggerNotification]);

  useEffect(() => {
    const handleFCMMessage = (e) => {
      const payload = e.detail;
      if (!payload || !payload.notification) return;

      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }

      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch (err) {}

      const newNotif = {
        id: getUniqueNotifId(),
        isFCM: true,
        title: payload.notification.title || 'Notification',
        desc: payload.notification.body || 'You have an update.'
      };

      setNotifications(prev => [newNotif, ...prev].slice(0, 3));

      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
      }, 5000);
    };

    window.addEventListener('fcm-message-received', handleFCMMessage);
    return () => window.removeEventListener('fcm-message-received', handleFCMMessage);
  }, []);

  // triggerNotification and removeNotification are defined above (useCallback)

  const getStatusContent = (status) => {
    switch (status) {
      case 'preparing':
        return {
          icon: <Utensils size={20} className="text-orange-400" />,
          title: "Order is Preparing",
          desc: "Our chefs are layering your parfait right now!",
          bgGlow: "bg-orange-500/20"
        };
      case 'dispatched':
        return {
          icon: <Truck size={20} className="text-sky-400" />,
          title: "Order Dispatched!",
          desc: "Your craving is on its way. Track it live!",
          bgGlow: "bg-sky-500/20"
        };
      case 'delivered':
        return {
          icon: <CheckCircle size={20} className="text-charistar-green" />,
          title: "Delivered",
          desc: "Your order has arrived. Enjoy!",
          bgGlow: "bg-charistar-green/20"
        };
      default:
        return {
          icon: <Bell size={20} className="text-white" />,
          title: "Order Update",
          desc: "Check your active order for details.",
          bgGlow: "bg-white/10"
        };
    }
  };

  return (
    <div className="fixed top-safe pt-4 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4">
      <AnimatePresence>
        {notifications.map((notif) => {
          const content = notif.isFCM 
            ? {
                icon: <Bell size={20} className="text-charistar-green animate-bounce" />,
                title: notif.title,
                desc: notif.desc,
                bgGlow: "bg-charistar-green/20"
              }
            : getStatusContent(notif.status);
          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="pointer-events-auto w-full max-w-sm glass-panel bg-black/80 border border-white/10 rounded-2xl p-4 flex items-start gap-3 shadow-[0_10px_40px_rgba(0,0,0,0.5)] relative overflow-hidden"
            >
              {/* Animated Glow */}
              <div className={`absolute -top-10 -right-10 w-24 h-24 blur-2xl rounded-full ${content.bgGlow}`}></div>

              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 relative z-10">
                {content.icon}
              </div>

              <div className="flex-1 relative z-10 pt-0.5">
                <h4 className="text-white font-black text-sm">{content.title}</h4>
                <p className="text-gray-400 text-xs font-semibold leading-tight mt-0.5">{content.desc}</p>
              </div>

              <button 
                onClick={() => removeNotification(notif.id)}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-white/5 text-gray-500 hover:text-white transition-colors relative z-10"
              >
                <X size={12} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
