import { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export function useReviews(productId) {
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;

    const safeProductId = String(productId);
    const q = query(
      collection(db, 'products', safeProductId, 'reviews'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const revs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReviews(revs);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching reviews:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [productId]);

  const submitReview = async (rating, comment) => {
    if (!currentUser) throw new Error("Must be logged in to review");
    if (!productId) throw new Error("Invalid product");

    const safeProductId = String(productId);
    try {
      await addDoc(collection(db, 'products', safeProductId, 'reviews'), {
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email.split('@')[0],
        rating: Number(rating),
        comment: comment,
        createdAt: serverTimestamp()
      });
      return true;
    } catch (err) {
      console.error("Error submitting review:", err);
      throw err;
    }
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return { reviews, loading, submitReview, averageRating };
}
