import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export function useActiveOrder() {
  const { currentUser } = useAuth();
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setActiveOrder(null);
      setLoading(false);
      return;
    }

    // Query for the most recent order by this user
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        const orderData = docSnap.data();
        
        // Only consider it "active" if it's not delivered
        if (orderData.status !== 'delivered') {
          setActiveOrder({ id: docSnap.id, ...orderData });
        } else {
          setActiveOrder(null);
        }
      } else {
        setActiveOrder(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Error fetching active order:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  return { activeOrder, loading };
}
