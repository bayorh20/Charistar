import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { trackPixelEvent } from '../utils/pixel';

const CartContext = createContext();
const FlyingContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function useFlyingItems() {
  return useContext(FlyingContext);
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('charistar_cart');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('Cart localStorage corrupted, resetting:', e);
      localStorage.removeItem('charistar_cart');
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [flyingItems, setFlyingItems] = useState([]);
  const [cartBump, setCartBump] = useState(false);

  useEffect(() => {
    localStorage.setItem('charistar_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = useCallback((product, quantity = 1, selectedAddonsOrEvent = [], e = null) => {
    let selectedAddons = [];
    let clickEvent = e;

    if (Array.isArray(selectedAddonsOrEvent)) {
      selectedAddons = selectedAddonsOrEvent;
    } else {
      clickEvent = selectedAddonsOrEvent;
    }

    // Capture starting coordinates (click or touch)
    let startX = window.innerWidth / 2;
    let startY = window.innerHeight / 3;

    if (clickEvent) {
      if (typeof clickEvent.clientX === 'number' && typeof clickEvent.clientY === 'number' && clickEvent.clientX > 0 && clickEvent.clientY > 0) {
        startX = clickEvent.clientX;
        startY = clickEvent.clientY;
      } else if (clickEvent.touches && clickEvent.touches[0] && typeof clickEvent.touches[0].clientX === 'number') {
        startX = clickEvent.touches[0].clientX;
        startY = clickEvent.touches[0].clientY;
      } else if (clickEvent.changedTouches && clickEvent.changedTouches[0] && typeof clickEvent.changedTouches[0].clientX === 'number') {
        startX = clickEvent.changedTouches[0].clientX;
        startY = clickEvent.changedTouches[0].clientY;
      } else if (clickEvent.currentTarget || clickEvent.target) {
        try {
          const rect = (clickEvent.currentTarget || clickEvent.target).getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            startX = rect.left + rect.width / 2;
            startY = rect.top + rect.height / 2;
          }
        } catch (err) {
          console.error("Bounding box coordinate fallback failed:", err);
        }
      }
    }

    const animId = Date.now() + Math.random().toString();
    const newItem = {
      id: animId,
      image: product.image || product.img || "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=300&q=80",
      startX,
      startY
    };

    setFlyingItems(prev => [...prev, newItem]);

    setTimeout(() => {
      setFlyingItems(prev => prev.filter(item => item.id !== animId));
      setCartBump(true);
      setTimeout(() => setCartBump(false), 350);
    }, 1800);

    const getCartItemId = (productId, addonsList = []) => {
      const sortedNames = [...addonsList].map(a => a.name).sort().join('|');
      return sortedNames ? `${productId}_${sortedNames}` : String(productId);
    };

    const cartItemId = getCartItemId(product.id, selectedAddons);
    const basePrice = product.price ? parseFloat(String(product.price).replace(/[^\d.]/g, '')) : 0;
    const addonsTotal = selectedAddons.reduce((sum, addon) => {
      const addonPrice = addon.price ? parseFloat(String(addon.price).replace(/[^\d.]/g, '')) : 0;
      return sum + addonPrice;
    }, 0);
    const combinedPrice = basePrice + addonsTotal;
    const formattedPrice = `₦${combinedPrice.toLocaleString()}`;

    trackPixelEvent('AddToCart', {
      content_ids: [product.id],
      content_name: product.title,
      content_type: 'product',
      value: combinedPrice * quantity,
      currency: 'NGN'
    });

    setCartItems(prev => {
      const existing = prev.find(item => item.id === cartItemId);
      if (existing) {
        return prev.map(item =>
          item.id === cartItemId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, id: cartItemId, productId: product.id, price: formattedPrice, selectedAddons, quantity }];
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId, delta, e = null) => {
    if (delta > 0) {
      setCartItems(prev => {
        const product = prev.find(item => item.id === productId);
        if (product) {
          let startX = window.innerWidth / 2;
          let startY = window.innerHeight / 3;

          if (e) {
            if (typeof e.clientX === 'number' && typeof e.clientY === 'number' && e.clientX > 0 && e.clientY > 0) {
              startX = e.clientX;
              startY = e.clientY;
            } else if (e.touches && e.touches[0] && typeof e.touches[0].clientX === 'number') {
              startX = e.touches[0].clientX;
              startY = e.touches[0].clientY;
            } else if (e.changedTouches && e.changedTouches[0] && typeof e.changedTouches[0].clientX === 'number') {
              startX = e.changedTouches[0].clientX;
              startY = e.changedTouches[0].clientY;
            } else if (e.currentTarget || e.target) {
              try {
                const rect = (e.currentTarget || e.target).getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                  startX = rect.left + rect.width / 2;
                  startY = rect.top + rect.height / 2;
                }
              } catch (err) {
                console.warn('Failed to get bounding rect for flying animation:', err);
              }
            }
          }

          const id = Date.now() + Math.random().toString();
          const newItem = {
            id,
            image: product.image || product.img || "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=300&q=80",
            startX,
            startY
          };

          setFlyingItems(p => [...p, newItem]);
          setTimeout(() => {
            setFlyingItems(p => p.filter(item => item.id !== id));
          }, 1800);
        }
        return prev.reduce((acc, item) => {
          if (item.id === productId) {
            const newQ = item.quantity + delta;
            if (newQ > 0) acc.push({ ...item, quantity: newQ });
          } else {
            acc.push(item);
          }
          return acc;
        }, []);
      });
    } else {
      setCartItems(prev => prev.reduce((acc, item) => {
        if (item.id === productId) {
          const newQ = item.quantity + delta;
          if (newQ > 0) acc.push({ ...item, quantity: newQ });
        } else {
          acc.push(item);
        }
        return acc;
      }, []));
    }
  }, []);

  const clearCart = useCallback(() => setCartItems([]), []);
  const toggleCart = useCallback(() => setIsCartOpen(prev => !prev), []);

  // ── Derived values — only recomputed when cartItems changes ────────────────
  const cartTotal = useMemo(() =>
    cartItems.reduce((sum, item) => {
      const p = typeof item.price === 'string'
        ? parseFloat(item.price.replace(/[^\d.]/g, ''))
        : parseFloat(item.price);
      return sum + (isNaN(p) ? 0 : p * item.quantity);
    }, 0),
  [cartItems]);

  const cartCount = useMemo(() =>
    cartItems.reduce((sum, item) => sum + item.quantity, 0),
  [cartItems]);

  // ── Stable context value — only changes when cart data actually changes ────
  const value = useMemo(() => ({
    cartItems, isCartOpen, addToCart, removeFromCart,
    updateQuantity, clearCart, toggleCart, setIsCartOpen,
    cartTotal, cartCount, cartBump,
  }), [cartItems, isCartOpen, addToCart, removeFromCart,
      updateQuantity, clearCart, toggleCart, cartTotal, cartCount, cartBump]);

  const flyingValue = useMemo(() => ({ flyingItems }), [flyingItems]);

  return (
    <CartContext.Provider value={value}>
      <FlyingContext.Provider value={flyingValue}>
        {children}
        <FlyingOverlay />
      </FlyingContext.Provider>
    </CartContext.Provider>
  );
}

// ── Flying animation isolated — never re-renders cart consumers ────────────
function FlyingOverlay() {
  const { flyingItems } = useFlyingItems();
  if (flyingItems.length === 0 || typeof document === 'undefined') return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
    >
      {flyingItems.map(item => {
        const endX = window.innerWidth / 2 - item.startX;
        const endY = (window.innerHeight - 56) - item.startY;
        const midX = endX * 0.45;
        const midY = endY * 0.35 - 200;
        return (
          <div
            key={item.id}
            className="flying-cart-item rounded-full bg-transparent flex items-center justify-center"
            style={{
              left: item.startX - 45, top: item.startY - 45,
              width: '90px', height: '90px',
              '--end-x': `${endX}px`, '--end-y': `${endY}px`,
              '--mid-x': `${midX}px`, '--mid-y': `${midY}px`,
            }}
          >
            <div className="absolute inset-0 rounded-full bg-charistar-green/30 blur-[25px] scale-125 animate-pulse pointer-events-none" />
            <div
              className="absolute inset-0 rounded-full p-[3px] bg-gradient-to-tr from-charistar-green via-emerald-400 to-lime-300 shadow-sm flex items-center justify-center"
              style={{ animation: 'spin 1.2s linear infinite', transformStyle: 'preserve-3d' }}
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-black border border-white/20">
                <img src={item.image} alt="" className="w-full h-full object-cover" style={{ transform: 'scale(1.15)' }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>,
    document.body
  );
}
