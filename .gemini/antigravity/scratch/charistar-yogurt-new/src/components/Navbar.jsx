import { useState, useEffect } from 'react';
import { Home, User, ShoppingCart, X, Trash2, CreditCard, CheckCircle, Package, Store } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const navigate = useNavigate();

  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    cartTotal,
    cartBump
  } = useCart();

  const {
    currentUser,
    openAuthModal,
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    setAuthModalMode,
    authenticate
  } = useAuth();

  const [checkingOut, setCheckingOut] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);

  // Scroll detection for dynamic island
  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsAtTop(currentScrollY < 20);
      
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsScrollingDown(true);
      } else if (currentScrollY < lastScrollY) {
        setIsScrollingDown(false);
      }
      
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auth form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const isProductPage = currentPath.startsWith('/product');
  const isModalOpen = isCartOpen || isAuthModalOpen;

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isModalOpen]);

  // Reset auth form when modal closes
  useEffect(() => {
    if (!isAuthModalOpen) {
      setName(''); setPhone(''); setPassword('');
      setError(''); setSuccessMsg('');
    }
  }, [isAuthModalOpen]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccessMsg('');
    setAuthLoading(true);
    try {
      if (authModalMode === 'login') {
        await authenticate(phone, password);
        setSuccessMsg('Welcome back! Login successful 👋');
      } else {
        await authenticate(phone, password, name || 'Yogurt Lover', true);
        setSuccessMsg('Account created successfully! ✨');
      }
      setTimeout(() => {
        closeAuthModal();
        setName(''); setPhone(''); setPassword(''); setSuccessMsg('');
        setAuthLoading(false);
        if (cartItems.length > 0) navigate('/checkout');
      }, 1200);
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
      setAuthLoading(false);
    }
  };

  const handleCheckout = () => {
    if (!currentUser) {
      setAuthModalMode('login');
      openAuthModal();
    } else {
      setIsCartOpen(false);
      navigate('/checkout');
    }
  };

  const totalQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);

  const navItems = [
    { path: '/', icon: Home, label: 'Menu' },
    { path: '/shop', icon: Store, label: 'Shop' },
    { action: 'cart', icon: ShoppingCart, label: 'Cart' },
    { path: '/orders', icon: Package, label: 'Orders' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  // On product page with no modal open — hide nav entirely
  if (isProductPage && !isModalOpen) return null;

  return (
    <>
      {/* ── Backdrop — only for auth (cart morphs from nav so doesn't need full backdrop) ── */}
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-[5px] transition-opacity duration-300 ${
          isAuthModalOpen ? 'opacity-100 pointer-events-auto z-40' : 'opacity-0 pointer-events-none -z-10'
        }`}
        onClick={() => { closeAuthModal(); }}
      />

      {/* ── Cart dim backdrop (lighter, just dims bg) ── */}
      <div
        className={`fixed inset-0 bg-black/40 transition-opacity duration-300 ${
          isCartOpen ? 'opacity-100 pointer-events-auto z-[29]' : 'opacity-0 pointer-events-none -z-10'
        }`}
        onClick={() => setIsCartOpen(false)}
      />

      {/* ── AUTH MODAL — fixed centered overlay ── */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start pt-[12vh] justify-center px-4 pointer-events-none">
          <div className="w-full max-w-[400px] bg-charistar-gray rounded-[2rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden pointer-events-auto animate-scaleUp">

            {/* Header */}
            <div className="relative flex justify-start items-center px-5 pt-5 pb-4 border-b border-white/10 flex-shrink-0">
              <h2 className="text-[22px] font-black text-white tracking-tighter uppercase leading-none flex items-center gap-2">
                {authModalMode === 'login' ? (
                  <><span className="text-charistar-green">👋</span> Welcome Back</>
                ) : (
                  <><span className="text-charistar-green">✨</span> Create Account</>
                )}
              </h2>
              <button
                onClick={closeAuthModal}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X size={15} className="text-white" />
              </button>
            </div>

            {/* Form */}
            <div className="px-5 py-5 flex flex-col gap-3">
              {error && (
                <div className="bg-red-500/10 text-red-400 p-2.5 rounded-xl text-[11px] font-semibold border border-red-500/20 text-center">
                  {error}
                </div>
              )}
              {successMsg && (
                <div className="bg-charistar-green/10 text-charistar-green p-2.5 rounded-xl text-[12px] font-black border border-charistar-green/30 text-center animate-scaleUp">
                  {successMsg}
                </div>
              )}
              <form onSubmit={handleAuthSubmit} className="flex flex-col gap-3">
                <p className="text-[11px] font-black text-charistar-green uppercase tracking-wider text-center">
                  {authModalMode === 'login' ? 'Login to continue' : 'Sign up to get started'}
                </p>
                {authModalMode === 'signup' && (
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[13px] font-medium text-white outline-none focus:border-charistar-green transition-all placeholder-gray-500"
                    placeholder="Full Name" />
                )}
                <input type="tel" inputMode="numeric" maxLength={11} required value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 11))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[13px] font-medium text-white outline-none focus:border-charistar-green transition-all placeholder-gray-500"
                  placeholder="Phone Number (11 digits)" />
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[13px] font-medium text-white outline-none focus:border-charistar-green transition-all placeholder-gray-500"
                  placeholder="Password" />
                <button disabled={authLoading} type="submit"
                  className="w-full bg-charistar-green text-black font-black text-[13px] h-12 rounded-xl flex items-center justify-center tracking-wide disabled:opacity-70 shadow-sm active:scale-[0.98] transition-all">
                  {authLoading ? 'Processing...' : authModalMode === 'login' ? 'Log In' : 'Sign Up'}
                </button>
              </form>
              <div className="pt-1 text-center">
                <button type="button"
                  onClick={() => setAuthModalMode(authModalMode === 'login' ? 'signup' : 'login')}
                  className="text-[11px] text-gray-400 font-medium hover:text-white transition-colors">
                  {authModalMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                  <span className="text-charistar-green font-black ml-1">
                    {authModalMode === 'login' ? 'Sign up' : 'Log in'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MORPHING NAV — expands into cart panel when open ── */}
      {!isProductPage && (
        <div className="sticky bottom-6 flex justify-center z-30 pointer-events-none">
          <div
            className={`pointer-events-auto glass-nav border shadow-neon transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] overflow-hidden ${
              isCartOpen
                ? 'w-[92%] max-w-[440px] rounded-[2rem] h-auto max-h-[75vh] border-white/10 opacity-100'
                : isScrollingDown 
                  ? 'w-[75%] max-w-[320px] rounded-[3rem] h-[3.8rem] border-white/5 opacity-80 backdrop-blur-md translate-y-2' 
                  : 'w-[92%] max-w-[440px] rounded-[2.5rem] h-[4.5rem] border-white/10 opacity-100'
            }`}
          >
            {/* ── CART PANEL (rendered inside the morphed nav) ── */}
            <div
              className={`transition-all duration-400 overflow-hidden ${
                isCartOpen ? 'opacity-100 max-h-[70vh]' : 'opacity-0 max-h-0 pointer-events-none'
              }`}
            >
              {/* Cart Header */}
              <div className="flex justify-between items-center px-5 pt-4 pb-3 border-b border-white/10 flex-shrink-0">
                <h2 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                  <span>🛒</span> Your Cart
                </h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X size={15} className="text-white" />
                </button>
              </div>

              {/* Cart Body */}
              <div className="overflow-y-auto no-scrollbar px-4 py-3 space-y-2.5"
                style={{ maxHeight: 'calc(75vh - 11rem)' }}>
                {success ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                    <CheckCircle size={40} className="text-charistar-green" />
                    <h3 className="text-sm font-extrabold text-white">Order Placed!</h3>
                    <p className="text-gray-400 text-[10px]">Your yogurt is on its way.</p>
                  </div>
                ) : cartItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-3">
                      <span className="text-3xl">🛍️</span>
                    </div>
                    <h3 className="text-sm font-black text-white mb-1">Cart is empty</h3>
                    <p className="text-gray-400 text-[10px] font-semibold mb-4 max-w-[180px] mx-auto">Add something delicious first!</p>
                    <button
                      onClick={() => { setIsCartOpen(false); navigate('/'); }}
                      className="bg-charistar-green text-black font-black uppercase tracking-wider text-[10px] px-5 py-2.5 rounded-2xl active:scale-95 transition-all"
                    >Browse Menu 👉</button>
                  </div>
                ) : (
                  cartItems.map(item => (
                    <div key={item.id} className="flex gap-2.5 glass-panel p-2 rounded-2xl items-center relative">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-black/20 flex-shrink-0">
                        <img src={item.image || item.img} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 pr-5">
                        <h4 className="text-white text-[12px] font-extrabold leading-tight truncate">{item.title}</h4>
                        {item.selectedAddons?.length > 0 && (
                          <div className="flex flex-wrap gap-0.5 mt-0.5">
                            {item.selectedAddons.map((addon, i) => (
                              <span key={i} className="text-[8px] font-bold bg-white/5 border border-white/5 rounded px-1 py-0.5 text-gray-400">
                                {addon.name}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-charistar-green text-[11px] font-black mt-0.5">{item.price}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <button onClick={() => updateQuantity(item.id, -1)} className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white text-xs">-</button>
                          <span className="text-white text-xs font-black w-3 text-center">{item.quantity}</span>
                          <button onClick={(e) => updateQuantity(item.id, 1, e)} className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white text-xs">+</button>
                        </div>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="absolute top-2 right-2 text-gray-500 hover:text-red-500 transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Cart Footer */}
              {!success && cartItems.length > 0 && (
                <div className="px-4 pb-4 pt-2.5 border-t border-white/10">
                  <div className="flex justify-between items-center mb-2.5">
                    <span className="text-gray-400 font-semibold text-[10px] uppercase tracking-wider">Total</span>
                    <span className="text-base font-black text-white">₦{cartTotal.toLocaleString()}</span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    disabled={checkingOut}
                    className="w-full bg-charistar-green text-black font-black py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all disabled:opacity-70 text-[11px] tracking-wider uppercase"
                  >
                    {checkingOut ? 'Processing...' : <><CreditCard size={13} /> Checkout Now</>}
                  </button>
                </div>
              )}
            </div>

            {/* ── NAV BAR ITEMS (always visible, hidden when cart is open) ── */}
            <div
              className={`flex flex-row items-center justify-between px-2 transition-all duration-300 ${
                isCartOpen ? 'h-0 opacity-0 overflow-hidden pointer-events-none' : (isScrollingDown ? 'h-[3.8rem] opacity-100' : 'h-[4.5rem] opacity-100')
              }`}
            >
              {navItems.map((item) => {
                const isActive = currentPath === item.path;
                const Icon = item.icon;

                if (item.action === 'cart') {
                  return (
                    <button
                      key="cart"
                      onClick={() => setIsCartOpen(true)}
                      className="flex-1 flex flex-col items-center justify-center gap-0.5 h-full relative"
                    >
                      <div className={`relative flex items-center justify-center transition-all duration-300 ${isScrollingDown ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-charistar-green text-black shadow-sm active:scale-95 ${
                        cartBump ? 'cart-bump-animation' : ''
                      }`}>
                        <Icon size={isScrollingDown ? 16 : 20} strokeWidth={2.5} className="flex-shrink-0" />
                        {totalQuantity > 0 && (
                          <span className={`absolute -top-1 -right-1 bg-black text-charistar-green font-extrabold flex items-center justify-center rounded-full border border-charistar-green ${isScrollingDown ? 'w-3 h-3 text-[7px]' : 'w-4 h-4 text-[9px]'}`}>
                            {totalQuantity > 9 ? '9+' : totalQuantity}
                          </span>
                        )}
                      </div>
                      {!isScrollingDown && <span className="text-[9px] font-bold text-charistar-green tracking-wide uppercase mt-0.5">{item.label}</span>}
                    </button>
                  );
                }

                if (item.path === '/profile' && !currentUser) {
                  return (
                    <button key={item.path} onClick={() => openAuthModal('login')}
                      className="flex-1 flex flex-col items-center justify-center gap-0.5 h-full text-gray-500 hover:text-white transition-colors duration-75">
                      <Icon size={isScrollingDown ? 18 : 20} strokeWidth={2} fill="none" className="flex-shrink-0" />
                      {!isScrollingDown && <span className="text-[9px] font-semibold tracking-wide uppercase mt-0.5">{item.label}</span>}
                    </button>
                  );
                }

                return (
                  <Link key={item.path} to={item.path}
                    className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-colors duration-75 ${
                      isActive ? 'text-charistar-green' : 'text-gray-500 hover:text-white'
                    }`}>
                    <div className={`flex items-center justify-center ${isScrollingDown ? 'w-6 h-6' : 'w-8 h-8'} rounded-full transition-all duration-75 ${
                      isActive ? 'bg-charistar-green/15' : ''
                    }`}>
                      <Icon size={isScrollingDown ? 17 : 19} strokeWidth={isActive ? 2.5 : 2}
                        fill={isActive ? 'currentColor' : 'none'} className="flex-shrink-0" />
                    </div>
                    {!isScrollingDown && <span className={`text-[9px] font-bold tracking-wide uppercase mt-0.5 ${
                      isActive ? 'text-charistar-green' : 'text-gray-500'
                    }`}>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
