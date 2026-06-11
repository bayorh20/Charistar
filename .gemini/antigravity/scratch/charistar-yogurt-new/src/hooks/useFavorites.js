import { useState, useEffect } from 'react';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export function useFavorites() {
  const { currentUser } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    const favRef = collection(db, 'users', currentUser.uid, 'favorites');
    const unsubscribe = onSnapshot(favRef, (snapshot) => {
      const favs = snapshot.docs.map(doc => doc.id);
      setFavorites(favs);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching favorites:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const toggleFavorite = async (productId) => {
    if (!currentUser) {
      // Could open auth modal here, but for now we'll just alert
      alert("Please log in to save favorites!");
      return;
    }

    const safeProductId = String(productId);
    const docRef = doc(db, 'users', currentUser.uid, 'favorites', safeProductId);
    
    if (favorites.includes(safeProductId)) {
      // Remove favorite
      try {
        await deleteDoc(docRef);
      } catch (err) {
        console.error("Error removing favorite:", err);
      }
    } else {
      // Add favorite
      try {
        await setDoc(docRef, { addedAt: new Date() });
      } catch (err) {
        console.error("Error adding favorite:", err);
      }
    }
  };

  const isFavorite = (productId) => favorites.includes(String(productId));

  return { favorites, isFavorite, toggleFavorite, loading };
}
