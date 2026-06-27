import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { playNewOrderChime, playNewMessageChime } from '../utils/sound';

const OrderAlertContext = createContext();

export const OrderAlertProvider = ({ children }) => {
  const [newOrderAlert, setNewOrderAlert]   = useState(null);
  const [unreadCount, setUnreadCount]       = useState(0);
  const [soundEnabled, setSoundEnabled]     = useState(true);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);

  const initialLoadRef                      = useRef(true);
  const seenOrderIdsRef                     = useRef(new Set());
  const seenMessageIdsRef                   = useRef(new Set());

  useEffect(() => {
    if (!db) return;

    // 1. Real-time listener for incoming orders
    const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(50));
    
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      let hasNewOrder = false;
      let latestOrder = null;
      let activeCount = 0;

      snapshot.docs.forEach((docSnap) => {
        // ✅ FIXED: id lives on docSnap, NOT inside docSnap.data()
        const order = { id: docSnap.id, ...docSnap.data() };
        
        // Count active/non-completed orders (received, preparing, ready, out for delivery)
        if (order.status !== 'Delivered' && order.status !== 'Cancelled') {
          activeCount++;
        }

        // Catch new orders using the real Firestore document ID
        if (!seenOrderIdsRef.current.has(order.id)) {
          seenOrderIdsRef.current.add(order.id);
          
          if (!initialLoadRef.current) {
            hasNewOrder = true;
            latestOrder = order;
          }
        }
      });

      setActiveOrdersCount(activeCount);

      if (hasNewOrder && latestOrder) {
        // Trigger visual alerts
        setNewOrderAlert(latestOrder);
        setUnreadCount(prev => prev + 1);
        
        // Play distinct orders chime
        playNewOrderChime(soundEnabled);
      }

      initialLoadRef.current = false;
    }, (err) => {
      console.error("Firestore orders alert subscription failed:", err);
    });

    // 2. Real-time listener for unread messages across support chats
    const supportQuery = collection(db, 'support_chats');
    const unsubscribeSupport = onSnapshot(supportQuery, (snapshot) => {
      let unreadMessagesCount = 0;
      let hasNewMessage = false;

      snapshot.docs.forEach((roomSnap) => {
        const room = roomSnap.data();
        
        // If the customer sent a message (unread > 0)
        if (room.unread && room.unread > 0) {
          unreadMessagesCount++;
        }

        // Sound chime for incoming chats in real time
        const messagesList = room.messages || [];
        if (messagesList.length > 0) {
          const lastMsg = messagesList[messagesList.length - 1];
          const lastMsgId = lastMsg.id || '';
          if (lastMsgId && !seenMessageIdsRef.current.has(lastMsgId)) {
            seenMessageIdsRef.current.add(lastMsgId);
            // If the last sender was the customer (user) and it is a new message
            if (lastMsg.sender === 'user' && !initialLoadRef.current) {
              hasNewMessage = true;
            }
          }
        }
      });

      if (hasNewMessage) {
        playNewMessageChime(soundEnabled);
      }
    }, (err) => {
      console.error("Firestore support alert subscription failed:", err);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeSupport();
    };
  }, [soundEnabled]);

  const clearAlert = () => {
    setNewOrderAlert(null);
  };

  const resetUnreadCount = () => {
    setUnreadCount(0);
  };

  return (
    <OrderAlertContext.Provider value={{
      newOrderAlert,
      clearAlert,
      unreadCount,
      resetUnreadCount,
      soundEnabled,
      setSoundEnabled,
      activeOrdersCount
    }}>
      {children}
    </OrderAlertContext.Provider>
  );
};

export const useOrderAlert = () => useContext(OrderAlertContext);
