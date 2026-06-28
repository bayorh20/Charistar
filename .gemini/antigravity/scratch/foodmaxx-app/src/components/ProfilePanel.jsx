import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  X, Clock, MapPin, ChevronRight, Phone, Volume2, VolumeX, 
  Moon, Sun, Plus, Trash2, Heart, Bell, Award, Sparkles, 
  User, Check, ChevronDown, ShoppingBag, DollarSign, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playTick } from '../utils/sound';

export default function ProfilePanel() {
  const [profileScrollY, setProfileScrollY] = useState(0);
  const {
    showProfile,
    setShowProfile,
    orderHistory,
    currentOrder,
    setActiveScreen,
    soundEnabled,
    toggleSound,
    theme,
    setTheme,
    savedAddresses,
    addAddress,
    deleteAddress,
    selectAddress,
    selectedAddress,
    reorderItems,
    setIsCartOpen,
    favorites,
    toggleFavorite,
    setCustomizingItem,
    addToCart,
    userProfile,
    updateProfile,
    registerUser,
    logoutUser,
    clearAppCache,
    menuItems
  } = useContext(AppContext);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [versionTaps, setVersionTaps] = useState(0);

  const handleVersionClick = () => {
    setVersionTaps(prev => {
      const next = prev + 1;
      if (next >= 5) {
        if (typeof clearAppCache === 'function') {
          clearAppCache().then(() => {
            window.location.reload();
          });
        } else {
          localStorage.clear();
          sessionStorage.clear();
          window.location.reload();
        }
        return 0;
      }
      return next;
    });
  };

  const [showAddForm, setShowAddForm] = useState(false);
  const [newType, setNewType] = useState('Home');
  const [newName, setNewName] = useState('');
  const [newDetails, setNewDetails] = useState('');

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPhoto, setEditPhoto] = useState('/avatar_male.webp');
  const [editGender, setEditGender] = useState('male');

  const [showGuestSignUp, setShowGuestSignUp] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestError, setGuestError] = useState('');

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!editName.trim() || !editPhone.trim()) return;
    updateProfile({
      name: editName,
      phone: editPhone,
      photo: editPhoto,
      gender: editGender
    });
    setIsEditingProfile(false);
  };

  const handleGuestSignUpSubmit = (e) => {
    e.preventDefault();
    if (!guestName.trim() || !guestPhone.trim()) {
      setGuestError('Please enter both your name and phone number.');
      return;
    }
    if (guestPhone.trim().length < 8) {
      setGuestError('Please enter a valid phone number.');
      return;
    }
    setGuestError('');
    registerUser(guestName.trim(), guestPhone.trim());
    setShowGuestSignUp(false);
  };

  const handleAddAddressSubmit = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newDetails.trim()) return;
    addAddress({
      name: newName,
      type: newType,
      details: newDetails
    });
    setNewName('');
    setNewDetails('');
    setShowAddForm(false);
  };

  const favoriteItems = menuItems.filter(item => favorites.includes(item.id));

  const handleActiveOrderClick = () => {
    setShowProfile(false);
    setActiveScreen('orders');
    playTick(soundEnabled);
  };

  const handleToggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
    playTick(soundEnabled);
  };

  // Stats calculation
  const totalOrders = orderHistory.length;
  const totalSpent = orderHistory.reduce((sum, order) => sum + (order.total || 0), 0);



  // Animation constants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
  };

  return (
    <AnimatePresence>
      {showProfile && (
        <motion.div 
          className="drawer-overlay glass-overlay profile-modal-overlay" 
          onClick={() => setShowProfile(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="drawer-sheet profile-panel-sheet glassmorphic-sheet profile-modal-sheet" 
            onClick={(e) => e.stopPropagation()}
            initial={{ rotateX: 65, y: "110%", z: -300, opacity: 0 }}
            animate={{ rotateX: 0, y: 0, z: 0, opacity: 1 }}
            exit={{ rotateX: 65, y: "110%", z: -300, opacity: 0 }}
            transition={{ type: "spring", damping: 24, stiffness: 160 }}
            style={{ transformStyle: 'preserve-3d' }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.3 }}
            onDragEnd={(e, { offset, velocity }) => {
              if (offset.y > 140 || velocity.y > 400) {
                setShowProfile(false);
              }
            }}
          >
            {/* Background Aurora Mesh */}
            <div className="aurora-glow-container">
              <div className="aurora-blob blob-orange"></div>
              <div className="aurora-blob blob-teal"></div>
              <div className="aurora-blob blob-amber"></div>
            </div>

            <div className="drawer-drag-handle" style={{ zIndex: 11 }}></div>

            {/* Header */}
            <div className={`drawer-header glass-header ${profileScrollY > 15 ? 'scrolled' : ''}`}>
              <div className="header-title-area">
                <h3 className="drawer-title">
                  {profileScrollY > 60 && userProfile.registered && userProfile.name.trim() 
                    ? `Hi, ${userProfile.name.trim().split(' ')[0]}! 👋` 
                    : 'Dashboard'}
                </h3>
                <span className="drawer-subtitle">
                  {profileScrollY > 60 && userProfile.registered 
                    ? 'Active Profile' 
                    : 'Manage account & history'}
                </span>
              </div>

              {/* Mini docked avatar in header */}
              <AnimatePresence>
                {profileScrollY > 60 && (
                  <motion.div 
                    className="header-mini-avatar"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    onClick={() => {
                      const contentEl = document.querySelector('.profile-content');
                      if (contentEl) contentEl.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <span style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                      {userProfile.photo && (userProfile.photo.startsWith('/') || userProfile.photo.includes('.')) ? (
                        <img loading="lazy" decoding="async" src={userProfile.photo} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', backgroundColor: '#FFFFFF', filter: 'brightness(1.08) contrast(1.02)' }} />
                      ) : (
                        userProfile.photo || '🍔'
                      )}
                    </span>
                    <div className="header-mini-avatar-ring"></div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button 
                className="btn-close-circle" 
                onClick={() => setShowProfile(false)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <X size={16} />
              </motion.button>
            </div>

            {/* Content scroll area */}
            <motion.div 
              className="drawer-content profile-content scroll-optimized"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              onScroll={(e) => setProfileScrollY(e.target.scrollTop)}
            >
              
              {/* User Bio Glass Card */}
              <motion.div variants={itemVariants} className="glass-card profile-bio-card">
                {isEditingProfile ? (
                  <form onSubmit={handleSaveProfile} className="profile-edit-form">
                    <div className="profile-edit-header" style={{ flexDirection: 'column', gap: '12px', alignItems: 'stretch' }}>
                      <div className="gender-selector-group">
                        <span className="avatar-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Select Gender Avatar</span>
                        <div className="gender-selector-row">
                          <button
                            type="button"
                            className={`gender-btn ${editGender === 'male' ? 'active' : ''}`}
                            onClick={() => {
                              setEditGender('male');
                              setEditPhoto('/avatar_male.webp');
                              playTick(soundEnabled);
                            }}
                          >
                            👦 Male
                          </button>
                          <button
                            type="button"
                            className={`gender-btn ${editGender === 'female' ? 'active' : ''}`}
                            onClick={() => {
                              setEditGender('female');
                              setEditPhoto('/avatar_female.webp');
                              playTick(soundEnabled);
                            }}
                          >
                            👩 Female
                          </button>
                        </div>
                      </div>
                      <div className="profile-inputs">
                        <input 
                          type="text" 
                          value={editName} 
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Your Name"
                          className="profile-input-field name-input"
                          required
                        />
                        <input 
                          type="text" 
                          value={editPhone} 
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="Phone Number"
                          className="profile-input-field phone-input"
                          required
                        />
                      </div>
                    </div>
                    <div className="profile-edit-actions">
                      <button 
                        type="button" 
                        onClick={() => setIsEditingProfile(false)}
                        className="btn-glass-cancel"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="btn-glass-save"
                      >
                        Save Details
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="profile-bio-display">
                    <div className="bio-top-section">
                      <div 
                        className="avatar-glow-ring"
                        style={{
                          opacity: Math.max(0, 1 - profileScrollY / 100),
                          transform: `scale(${Math.max(0.6, 1 - profileScrollY / 250)})`
                        }}
                      >
                        <div className="user-avatar-circle" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {userProfile.photo && (userProfile.photo.startsWith('/') || userProfile.photo.includes('.')) ? (
                            <img loading="lazy" decoding="async" src={userProfile.photo} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', backgroundColor: '#FFFFFF', filter: 'brightness(1.08) contrast(1.02)' }} />
                          ) : (
                            userProfile.photo || '🍔'
                          )}
                        </div>
                        <div className="avatar-pulse-circle"></div>
                      </div>
                      <div className="bio-user-details">
                        <h4 className="user-name">{userProfile.registered ? userProfile.name : 'Guest Account'}</h4>
                        <span className="user-phone">{userProfile.registered ? userProfile.phone : 'Explore to unlock full rewards'}</span>
                      </div>
                      {userProfile.registered && (
                        <button 
                          onClick={() => {
                            setEditName(userProfile.name);
                            setEditPhone(userProfile.phone);
                            setEditPhoto(userProfile.photo || '/avatar_male.webp');
                            setEditGender(userProfile.gender || 'male');
                            setIsEditingProfile(true);
                            playTick(soundEnabled);
                          }}
                          className="btn-glass-edit"
                        >
                          Edit
                        </button>
                      )}
                    </div>

                    {/* Stats Dashboard Grid */}
                    <div className="profile-stats-dashboard">
                      <div className="stat-card">
                        <div className="stat-icon-wrapper"><ShoppingBag size={14} /></div>
                        <div className="stat-text">
                          <span className="stat-val">{totalOrders}</span>
                          <span className="stat-lbl">Orders</span>
                        </div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-icon-wrapper"><DollarSign size={14} /></div>
                        <div className="stat-text">
                          <span className="stat-val">₦{totalSpent.toLocaleString()}</span>
                          <span className="stat-lbl">Spent</span>
                        </div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-icon-wrapper"><Heart size={14} /></div>
                        <div className="stat-text">
                          <span className="stat-val">{favorites.length}</span>
                          <span className="stat-lbl">Favs</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Guest Late Signup CTA */}
              {!userProfile.registered && (
                <motion.div 
                  variants={itemVariants} 
                  className="glass-card cta-signup-card"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 91, 38, 0.15), rgba(255, 91, 38, 0.05))',
                    borderColor: 'rgba(255, 91, 38, 0.3)'
                  }}
                >
                  {!showGuestSignUp ? (
                    <div className="signup-cta-body">
                      <div className="cta-icon-area">
                        <Sparkles className="cta-sparkle-icon" size={18} />
                        <h5>Claim 200 Welcome Points!</h5>
                      </div>
                      <p>
                        Save addresses, track live orders, and start earning reward points on every single meal!
                      </p>
                      <button
                        onClick={() => {
                          setShowGuestSignUp(true);
                          playTick(soundEnabled);
                          setGuestName('');
                          setGuestPhone('');
                          setGuestError('');
                        }}
                        className="btn-cta-signup"
                      >
                        Create Profile Now
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleGuestSignUpSubmit} className="signup-cta-form">
                      <div className="form-header">
                        <h5>Create Profile</h5>
                        <p>Unlock premium delivery features</p>
                      </div>
                      <div className="signup-input-group">
                        <input
                          type="text"
                          placeholder="Your Full Name"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          className="signup-input"
                        />
                        <input
                          type="tel"
                          placeholder="Phone Number"
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          className="signup-input"
                        />
                      </div>
                      {guestError && (
                        <p className="signup-error-msg">⚠️ {guestError}</p>
                      )}
                      <div className="signup-form-buttons">
                        <button type="submit" className="btn-signup-submit">Sign Up</button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowGuestSignUp(false);
                            playTick(soundEnabled);
                          }}
                          className="btn-signup-cancel"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </motion.div>
              )}

              {/* Active Order Banner */}
              {currentOrder && (
                <motion.div 
                  variants={itemVariants} 
                  className="glass-card active-order-banner glow-order" 
                  onClick={handleActiveOrderClick}
                >
                  <div className="banner-delivery-badge">🛵</div>
                  <div className="banner-details">
                    <div className="status-flex">
                      <span className="banner-title">Rider is delivering</span>
                      <span className="pulse-dot"></span>
                    </div>
                    <span className="banner-subtitle">Current status: {currentOrder.status}</span>
                  </div>
                  <ChevronRight size={16} className="banner-arrow" />
                </motion.div>
              )}

              {/* Saved Addresses Manager */}
              <motion.div variants={itemVariants} className="glass-card settings-glass-section">
                <h5 className="profile-section-title">Saved Locations</h5>
                
                <div className="address-glass-list">
                  {savedAddresses.map((addr) => {
                    const isActive = selectedAddress.name === addr.name;
                    return (
                      <div 
                        key={addr.id} 
                        className={`address-glass-row ${isActive ? 'active-glass-addr' : ''}`}
                        onClick={() => selectAddress(addr)}
                      >
                        <div className="address-row-left">
                          <span className={`addr-pill ${addr.type.toLowerCase()}`}>
                            {addr.type}
                          </span>
                          <div className="addr-text">
                            <span className="addr-name">{addr.name}</span>
                            <span className="addr-details">{addr.details}</span>
                          </div>
                        </div>

                        <div className="address-row-right">
                          {isActive && <span className="active-badge-indicator">Active</span>}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteAddress(addr.id);
                            }}
                            className="btn-delete-addr"
                            aria-label="Delete address"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!showAddForm ? (
                  <button 
                    className="btn-glass-add-addr" 
                    onClick={() => setShowAddForm(true)}
                  >
                    <Plus size={14} /> Add Saved Address
                  </button>
                ) : (
                  <form onSubmit={handleAddAddressSubmit} className="add-address-glass-form">
                    <h6 className="form-sub-title">New Address Details</h6>
                    
                    <div className="form-row-flex">
                      <input
                        type="text"
                        placeholder="e.g. Work Address"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        required
                        className="glass-form-input"
                      />
                      <div className="select-wrapper">
                        <select
                          value={newType}
                          onChange={(e) => setNewType(e.target.value)}
                          className="glass-form-select"
                        >
                          <option value="Home">Home</option>
                          <option value="Work">Work</option>
                          <option value="School">School</option>
                          <option value="Other">Other</option>
                        </select>
                        <ChevronDown size={14} className="select-arrow-icon" />
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="Street Details (e.g. Flat 3, Block D)"
                      value={newDetails}
                      onChange={(e) => setNewDetails(e.target.value)}
                      required
                      className="glass-form-input"
                    />

                    <div className="address-form-buttons">
                      <button type="submit" className="btn-save-addr">Save Location</button>
                      <button 
                        type="button" 
                        onClick={() => setShowAddForm(false)}
                        className="btn-cancel-addr"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>

              {/* Preferences */}
              <motion.div variants={itemVariants} className="glass-card settings-glass-section">
                <h5 className="profile-section-title">Preferences</h5>
                <div className="settings-glass-list">
                  
                  <div className="settings-glass-row">
                    <div className="settings-row-left-content">
                      <div className="settings-icon-bg">
                        {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                      </div>
                      <span>Sound Effects</span>
                    </div>
                    <button
                      className={`toggle-switch-glass ${soundEnabled ? 'on' : ''}`}
                      onClick={toggleSound}
                    >
                      <div className="toggle-glass-handle"></div>
                    </button>
                  </div>

                  <div className="settings-glass-row">
                    <div className="settings-row-left-content">
                      <div className="settings-icon-bg">
                        {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
                      </div>
                      <span>Dark Theme</span>
                    </div>
                    <button
                      className={`toggle-switch-glass ${theme === 'dark' ? 'on' : ''}`}
                      onClick={handleToggleTheme}
                    >
                      <div className="toggle-glass-handle"></div>
                    </button>
                  </div>

                  <div className="settings-glass-row">
                    <div className="settings-row-left-content">
                      <div className="settings-icon-bg">
                        <Bell size={14} />
                      </div>
                      <span>Push Notifications</span>
                    </div>
                    <button
                      className={`toggle-switch-glass ${userProfile.pushEnabled ? 'on' : ''}`}
                      onClick={() => updateProfile({ pushEnabled: !userProfile.pushEnabled })}
                    >
                      <div className="toggle-glass-handle"></div>
                    </button>
                  </div>

                  <div className="settings-glass-row" style={{ marginTop: '14px', borderTop: '1px dashed var(--border-color)', paddingTop: '14px' }}>
                    <button 
                      onClick={() => {
                        if (confirm("This will clear all local storage, active order status, cart items, and flush all cached assets. The app will reload. Continue?")) {
                          const flushPromise = typeof window.flushPWACaches === 'function'
                            ? window.flushPWACaches()
                            : Promise.resolve();
                          
                          flushPromise.then(() => {
                            localStorage.clear();
                            sessionStorage.clear();
                            window.location.reload();
                          });
                        }
                      }}
                      className="btn-glass-cancel"
                      style={{ 
                        width: '100%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '8px', 
                        padding: '10px 14px', 
                        background: 'rgba(239, 68, 68, 0.08)', 
                        color: '#EF4444', 
                        borderColor: 'rgba(239, 68, 68, 0.2)',
                        borderRadius: '12px',
                        fontFamily: 'var(--font-accent)',
                        fontWeight: '800',
                        fontSize: '0.74rem',
                        cursor: 'pointer'
                      }}
                    >
                      <span>🧹 Flush & Reset App Cache</span>
                    </button>
                  </div>

                </div>
              </motion.div>

              {/* Favorites Carousel */}
              <motion.div variants={itemVariants} className="glass-card settings-glass-section">
                <h5 className="profile-section-title">My Favorites</h5>
                {favoriteItems.length > 0 ? (
                  <div className="profile-favorites-carousel scroll-optimized">
                    {favoriteItems.map((item) => (
                      <motion.div 
                        key={item.id}
                        className="fav-carousel-card"
                        whileHover={{ y: -4, scale: 1.02 }}
                        onClick={() => {
                          setShowProfile(false);
                          if (item.customizable) {
                            setCustomizingItem(item);
                          } else {
                            addToCart(item, [], 1);
                            setIsCartOpen(true);
                          }
                        }}
                      >
                        <div className="fav-img-wrapper">
                          <img loading="lazy" decoding="async" src={item.image} alt={item.name} />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(item.id);
                            }}
                            className="fav-heart-btn"
                            aria-label="Remove from favorites"
                          >
                            <Heart size={11} fill="currentColor" />
                          </button>
                        </div>
                        <div className="fav-details">
                          <span className="fav-name">{item.name}</span>
                          <div className="fav-price-row">
                            <span className="fav-price">₦{item.price.toLocaleString()}</span>
                            <div className="fav-add-badge"><Plus size={10} strokeWidth={3} /></div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-favorites-glass">
                    <Heart size={16} className="heart-empty-icon" />
                    <span>No favorites yet. Tap the heart on menu items to save them here!</span>
                  </div>
                )}
              </motion.div>

              {/* Order History */}
              <motion.div variants={itemVariants} className="glass-card settings-glass-section">
                <h5 className="profile-section-title">Order History</h5>
                {orderHistory.length > 0 ? (
                  <div className="history-glass-list">
                    {orderHistory.map((item, idx) => (
                      <div key={idx} className="history-glass-card">
                        <div className="history-glass-top">
                          <div className="history-id-date">
                            <span className="history-id">{item.id}</span>
                            <span className="history-date">{item.date}</span>
                          </div>
                          <span className="history-glass-status">Delivered</span>
                        </div>

                        <div className="history-glass-body">
                          {item.items.map((food, fIdx) => (
                            <div key={fIdx} className="history-food-line-item">
                              <span>{food.quantity}x {food.name}</span>
                              <span>₦{food.price.toLocaleString()}</span>
                            </div>
                          ))}

                          {item.notes && item.notes.trim() && (
                            <div className="history-glass-note">
                              <span className="note-title">Rider Note</span>
                              <p className="note-content">"{item.notes}"</p>
                            </div>
                          )}
                        </div>

                        <div className="history-glass-footer">
                          <div className="history-price-paid">
                            <span className="lbl">Total Paid</span>
                            <strong className="val">₦{item.total.toLocaleString()}</strong>
                          </div>
                          <button
                            className="btn-glass-reorder"
                            onClick={() => {
                              reorderItems(item.items);
                              setShowProfile(false);
                              setIsCartOpen(true);
                            }}
                          >
                            Reorder 🔄
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-history-glass">
                    <span className="package-icon">📦</span>
                    <p>No orders placed yet. Your order history will appear here.</p>
                  </div>
                )}
              </motion.div>

              {/* Sign Out Button — only for registered users */}
              {userProfile.registered && (
                <motion.div variants={itemVariants} style={{ padding: '4px 0 20px 0' }}>
                  {!showLogoutConfirm ? (
                    <button
                      onClick={() => setShowLogoutConfirm(true)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '13px',
                        borderRadius: '14px',
                        border: '1.5px solid rgba(239, 68, 68, 0.25)',
                        background: 'rgba(239, 68, 68, 0.06)',
                        color: '#EF4444',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        letterSpacing: '0.2px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <LogOut size={15} strokeWidth={2.5} />
                      Sign Out
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => setShowLogoutConfirm(false)}
                        style={{
                          flex: 1,
                          padding: '13px',
                          borderRadius: '14px',
                          border: '1.5px solid var(--border)',
                          background: 'var(--bg-input)',
                          color: 'var(--text-muted)',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={logoutUser}
                        style={{
                          flex: 1,
                          padding: '13px',
                          borderRadius: '14px',
                          border: 'none',
                          background: '#EF4444',
                          color: '#FFFFFF',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <LogOut size={14} strokeWidth={2.5} />
                        Yes, Sign Out
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
              {/* Version & Cache Cleaner Footer */}
              <div style={{ textAlign: 'center', padding: '16px 0 8px 0', fontSize: '0.68rem', color: 'var(--profile-text-muted)', fontWeight: '600' }}>
                <span 
                  onClick={handleVersionClick} 
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  FoodMaxx v5.0.0
                </span>
              </div>
            </motion.div>
          </motion.div>

          <style dangerouslySetInnerHTML={{ __html: `
            /* Modern Flat Borderless (Minimal Lineage) Design Tokens */
            :root {
              --profile-bg-sheet: #F9F9FB;       /* Clean light canvas */
              --profile-bg-card: #FFFFFF;        /* Crisp card canvas */
              --profile-bg-subcard: #F3F3F6;     /* Light soft input grey */
              --profile-border-color: #E5E7EB;   /* Subtle grey divider */
              --profile-shadow: 0 4px 20px rgba(0, 0, 0, 0.025);
              --profile-shadow-hover: 0 6px 24px rgba(0, 0, 0, 0.04);
              --profile-text-muted: #71717A;
            }

            .dark-mode {
              --profile-bg-sheet: #09090B;       /* Deep slate/obsidian */
              --profile-bg-card: #18181B;        /* Card slate */
              --profile-bg-subcard: #27272A;     /* Dark soft input grey */
              --profile-border-color: #27272A;   /* Slate divider */
              --profile-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
              --profile-shadow-hover: 0 6px 24px rgba(0, 0, 0, 0.3);
              --profile-text-muted: #A1A1AA;
            }

            .glassmorphic-sheet {
              background: var(--profile-bg-sheet) !important;
              backdrop-filter: none !important;
              -webkit-backdrop-filter: none !important;
              border: none !important;
              border-radius: var(--radius-lg) !important;
              box-shadow: 0 -10px 40px rgba(0,0,0,0.06) !important;
              position: relative;
              overflow: hidden;
              margin: 10px;
              margin-bottom: calc(86px + env(safe-area-inset-bottom, 0px));
              max-height: calc(90vh - 96px - env(safe-area-inset-bottom, 0px));
              max-height: calc(90dvh - 96px - env(safe-area-inset-bottom, 0px));
            }

            .glass-overlay {
              background: rgba(9, 9, 11, 0.3) !important;
              backdrop-filter: blur(4px);
              -webkit-backdrop-filter: blur(4px);
            }

            /* Disable Dotted Paper Backdrop */
            .aurora-glow-container {
              display: none !important;
            }

            /* Flat Borderless Cards */
            .glass-card {
              background: var(--profile-bg-card) !important;
              border: none !important;
              border-radius: 16px !important;
              padding: 16px;
              margin-bottom: 16px;
              box-shadow: var(--profile-shadow) !important;
              position: relative;
              z-index: 1;
              transition: transform 0.2s ease, box-shadow 0.2s ease;
              backdrop-filter: none !important;
              -webkit-backdrop-filter: none !important;
            }

            .glass-card:hover {
              transform: translateY(-2px);
              box-shadow: var(--profile-shadow-hover) !important;
            }

            /* Sticky Header */
            .glass-header {
              background: var(--profile-bg-sheet) !important;
              border-bottom: 1px solid var(--profile-border-color) !important;
              padding: 16px 20px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              z-index: 12 !important;
              transition: all 0.2s ease;
              position: sticky;
              top: 0;
              width: 100%;
              box-sizing: border-box;
            }

            .profile-content {
              padding-top: 16px !important;
              z-index: 2;
              position: relative;
            }

            .header-mini-avatar {
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: var(--profile-bg-card);
              border: none;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 0.95rem;
              position: relative;
              cursor: pointer;
              margin-left: auto;
              margin-right: 12px;
              box-shadow: var(--profile-shadow);
              transition: all 0.2s ease;
            }
            .header-mini-avatar:active {
              transform: scale(0.95);
            }

            .header-mini-avatar-ring {
              position: absolute;
              inset: -3px;
              border-radius: 50%;
              border: 1.5px solid var(--primary);
              animation: pulse-ring 2s infinite;
              pointer-events: none;
            }

            @keyframes pulse-ring {
              0% { transform: scale(0.95); opacity: 0.8; }
              50% { transform: scale(1.1); opacity: 0.2; }
              100% { transform: scale(0.95); opacity: 0.8; }
            }

            .header-title-area {
              display: flex;
              flex-direction: column;
              gap: 2px;
            }

            .glass-header .drawer-title {
              font-family: var(--font-accent);
              font-size: 1.25rem;
              font-weight: 800;
              color: var(--text-main);
              letter-spacing: -0.5px;
            }

            .glass-header .drawer-subtitle {
              font-size: 0.72rem;
              color: var(--profile-text-muted);
              font-weight: 600;
            }

            .btn-close-circle {
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: var(--profile-bg-card);
              border: none;
              color: var(--text-main);
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: var(--profile-shadow);
              transition: all 0.2s ease;
            }

            .btn-close-circle:hover {
              transform: scale(1.05);
              background: var(--profile-bg-subcard);
            }
            .btn-close-circle:active {
              transform: scale(0.95);
            }

            .profile-bio-card {
              overflow: hidden;
            }

            .profile-bio-display {
              display: flex;
              flex-direction: column;
              gap: 16px;
            }

            .bio-top-section {
              display: flex;
              align-items: center;
              gap: 14px;
            }

            .avatar-glow-ring {
              position: relative;
              width: 60px;
              height: 60px;
              border-radius: 50%;
              background: var(--profile-bg-subcard) !important;
              padding: 2px;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 1px solid var(--profile-border-color);
              box-shadow: var(--profile-shadow);
              transition: transform 0.2s ease;
            }

            .user-avatar-circle {
              background: var(--profile-bg-card) !important;
              width: 100%;
              height: 100%;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 2.1rem;
              z-index: 2;
            }

            .bio-user-details {
              display: flex;
              flex-direction: column;
              flex: 1;
            }

            .name-and-badge {
              display: flex;
              align-items: center;
              gap: 8px;
              flex-wrap: wrap;
            }

            .user-name {
              font-family: var(--font-accent);
              font-size: 1.1rem;
              font-weight: 800;
              color: var(--text-main);
            }

            .tier-badge {
              font-size: 0.58rem;
              font-weight: 800;
              padding: 3px 8px;
              border-radius: 20px;
              border: none;
              box-shadow: none;
              letter-spacing: 0.3px;
              text-transform: uppercase;
              color: var(--text-main) !important;
            }

            .tier-subtitle {
              font-size: 0.65rem;
              color: var(--profile-text-muted);
              font-weight: 600;
              margin-top: 2px;
            }

            .btn-glass-edit {
              background: var(--profile-bg-subcard);
              border: none;
              padding: 6px 14px;
              border-radius: 20px;
              font-size: 0.72rem;
              font-weight: 800;
              color: var(--primary);
              box-shadow: var(--profile-shadow);
              transition: all 0.2s ease;
            }

            .btn-glass-edit:hover {
              background: var(--primary);
              color: white;
              transform: translateY(-1px);
            }
            .btn-glass-edit:active {
              transform: scale(0.95);
            }

            .profile-stats-dashboard {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 10px;
              border-top: 1px solid var(--profile-border-color);
              padding-top: 14px;
              margin-top: 4px;
            }

            .stat-card {
              background: var(--profile-bg-subcard) !important;
              border: none !important;
              border-radius: 12px;
              padding: 8px;
              display: flex;
              align-items: center;
              gap: 8px;
              box-shadow: none;
            }

            .stat-icon-wrapper {
              background: var(--primary) !important;
              color: white !important;
              width: 24px;
              height: 24px;
              border-radius: 8px;
              border: none;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .stat-text {
              display: flex;
              flex-direction: column;
            }

            .stat-val {
              font-family: var(--font-accent);
              font-size: 0.8rem;
              font-weight: 800;
              color: var(--text-main);
            }

            .stat-lbl {
              font-size: 0.58rem;
              color: var(--profile-text-muted);
              font-weight: 600;
            }

            .profile-edit-form {
              display: flex;
              flex-direction: column;
              gap: 12px;
            }

            .profile-edit-header {
              display: flex;
              gap: 12px;
              align-items: center;
            }

            .avatar-select-wrapper {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 4px;
            }

            .avatar-dropdown {
              font-size: 1.5rem;
              width: 50px;
              height: 50px;
              border-radius: 50%;
              border: 1px solid var(--profile-border-color);
              background: var(--profile-bg-card);
              text-align: center;
              cursor: pointer;
              box-shadow: var(--profile-shadow);
            }

            .avatar-label {
              font-size: 0.58rem;
              font-weight: 700;
              color: var(--profile-text-muted);
            }

            .profile-inputs {
              flex: 1;
              display: flex;
              flex-direction: column;
              gap: 8px;
            }

            .profile-input-field {
              width: 100%;
              padding: 8px 12px;
              border-radius: 10px;
              border: 1px solid transparent;
              background: var(--profile-bg-subcard);
              font-size: 0.8rem;
              font-weight: 600;
              color: var(--text-main);
              box-sizing: border-box;
              transition: all 0.2s ease;
            }

            .profile-input-field:focus {
              background: var(--profile-bg-card);
              border-color: var(--primary);
              outline: none;
              box-shadow: 0 0 0 3px rgba(255, 91, 38, 0.08);
            }

            .profile-edit-actions {
              display: flex;
              gap: 8px;
              justify-content: flex-end;
            }

            .btn-glass-cancel {
              background: var(--profile-bg-subcard);
              border: none;
              border-radius: 20px;
              padding: 6px 14px;
              font-size: 0.72rem;
              color: var(--text-main);
              font-weight: 800;
              transition: all 0.2s ease;
            }

            .btn-glass-save {
              background: var(--primary);
              color: white;
              border: none;
              border-radius: 20px;
              padding: 6px 14px;
              font-size: 0.72rem;
              font-weight: 800;
              transition: all 0.2s ease;
            }
            .btn-glass-cancel:active, .btn-glass-save:active {
              transform: scale(0.95);
            }

            .settings-glass-section {
              margin-bottom: 16px;
            }

            .profile-section-title {
              font-family: var(--font-accent);
              font-size: 0.72rem;
              font-weight: 800;
              color: var(--profile-text-muted);
              text-transform: uppercase;
              letter-spacing: 0.8px;
              margin-bottom: 10px;
              padding-left: 2px;
            }

            .settings-glass-list {
              display: flex;
              flex-direction: column;
              gap: 2px;
            }

            .settings-glass-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 12px 4px;
              border-bottom: 1px solid var(--profile-border-color);
            }

            .settings-glass-row:last-child {
              border-bottom: none;
            }

            .settings-row-left-content {
              display: flex;
              align-items: center;
              gap: 12px;
              font-size: 0.82rem;
              font-weight: 700;
              color: var(--text-main);
            }

            .settings-icon-bg {
              width: 26px;
              height: 26px;
              border-radius: 8px;
              background: var(--profile-bg-subcard);
              color: var(--primary);
              display: flex;
              align-items: center;
              justify-content: center;
            }

            /* Modern Toggle Switches */
            .toggle-switch-glass {
              width: 42px;
              height: 22px;
              border-radius: 30px;
              background: var(--profile-bg-subcard);
              border: none;
              position: relative;
              transition: all 0.2s ease;
              cursor: pointer;
            }

            .toggle-switch-glass.on {
              background: var(--primary-glow);
            }

            .toggle-glass-handle {
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background: var(--profile-text-muted);
              position: absolute;
              top: 3px;
              left: 3px;
              transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
              box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
            }

            .toggle-switch-glass.on .toggle-glass-handle {
              left: 23px;
              background: var(--primary);
            }

            .address-glass-list {
              display: flex;
              flex-direction: column;
              gap: 8px;
              margin-bottom: 12px;
            }

            .address-glass-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 12px;
              background: var(--profile-bg-subcard) !important;
              border: 1px solid transparent !important;
              border-radius: 12px;
              cursor: pointer;
              transition: all 0.2s ease;
              box-shadow: none;
            }

            .address-glass-row:hover {
              border-color: var(--profile-border-color) !important;
            }

            .active-glass-addr {
              background: var(--profile-bg-card) !important;
              border-color: var(--primary) !important;
              box-shadow: var(--profile-shadow) !important;
            }

            .address-row-left {
              display: flex;
              gap: 10px;
              align-items: flex-start;
              flex: 1;
            }

            .addr-pill {
              font-size: 0.58rem;
              font-weight: 800;
              padding: 2.5px 6px;
              border-radius: 20px;
              margin-top: 1px;
            }

            .addr-pill.home { background: #BFDBFE; color: #1E40AF; }
            .addr-pill.work { background: #A7F3D0; color: #065F46; }
            .addr-pill.school { background: #C7D2FE; color: #3730A3; }
            .addr-pill.other { background: #E5E7EB; color: #374151; }

            .addr-text {
              display: flex;
              flex-direction: column;
              gap: 2px;
            }

            .addr-name {
              font-size: 0.82rem;
              font-weight: 800;
              color: var(--text-main);
            }

            .addr-details {
              font-size: 0.68rem;
              color: var(--profile-text-muted);
              font-weight: 600;
              line-height: 1.3;
              max-width: 170px;
            }

            .address-row-right {
              display: flex;
              align-items: center;
              gap: 8px;
            }

            .active-badge-indicator {
              font-size: 0.72rem;
              color: var(--secondary);
              font-weight: 800;
            }

            .btn-delete-addr {
              color: var(--profile-text-muted);
              padding: 6px;
              border-radius: 50%;
              border: none;
              background: transparent;
            }

            .btn-delete-addr:hover {
              color: #EF4444;
              background: rgba(239, 68, 68, 0.08);
            }

            .btn-glass-add-addr {
              width: 100%;
              padding: 10px;
              font-size: 0.76rem;
              font-weight: 800;
              background: var(--profile-bg-card) !important;
              border: 1.5px dashed var(--profile-border-color) !important;
              border-radius: 12px;
              color: var(--primary);
              justify-content: center;
              gap: 6px;
              transition: all 0.2s ease;
              box-shadow: none;
            }

            .btn-glass-add-addr:hover {
              border-style: solid !important;
              border-color: var(--primary) !important;
              background: var(--profile-bg-subcard) !important;
            }

            .add-address-glass-form {
              background: var(--profile-bg-subcard) !important;
              border: 1px solid var(--profile-border-color) !important;
              border-radius: 12px;
              padding: 14px;
              display: flex;
              flex-direction: column;
              gap: 8px;
              box-shadow: var(--profile-shadow);
            }

            .form-sub-title {
              font-size: 0.76rem;
              font-weight: 800;
              color: var(--text-main);
              margin-bottom: 4px;
            }

            .form-row-flex {
              display: flex;
              gap: 8px;
            }

            .glass-form-input, .glass-form-select {
              flex: 1;
              padding: 8px 12px;
              border-radius: 10px;
              font-size: 0.74rem;
              background: var(--profile-bg-card);
              border: 1px solid var(--profile-border-color);
              color: var(--text-main);
              font-weight: 600;
              box-sizing: border-box;
              transition: all 0.2s ease;
            }

            .glass-form-input:focus, .glass-form-select:focus {
              border-color: var(--primary);
              outline: none;
              box-shadow: 0 0 0 3px rgba(255, 91, 38, 0.08);
            }

            .select-wrapper {
              position: relative;
              display: flex;
              align-items: center;
            }

            .width-100 { width: 100%; }

            .select-arrow-icon {
              position: absolute;
              right: 8px;
              color: var(--profile-text-muted);
              pointer-events: none;
            }

            .btn-save-addr {
              flex: 1;
              font-size: 0.72rem;
              font-weight: 800;
              padding: 8px;
              border-radius: 20px;
              background: var(--primary);
              color: white;
              border: none;
              transition: all 0.2s ease;
            }

            .btn-cancel-addr {
              flex: 1;
              font-size: 0.72rem;
              font-weight: 800;
              padding: 8px;
              border-radius: 20px;
              background: var(--profile-bg-card);
              border: 1px solid var(--profile-border-color);
              color: var(--text-main);
              transition: all 0.2s ease;
            }
            .btn-save-addr:active, .btn-cancel-addr:active {
              transform: scale(0.95);
            }

            .signup-cta-body {
              display: flex;
              flex-direction: column;
              gap: 6px;
            }

            .cta-icon-area {
              display: flex;
              align-items: center;
              gap: 6px;
            }

            .cta-sparkle-icon {
              color: var(--primary);
            }

            .signup-cta-body h5 {
              font-size: 0.84rem;
              font-weight: 800;
              color: var(--primary);
            }

            .signup-cta-body p {
              font-size: 0.74rem;
              color: var(--profile-text-muted);
              line-height: 1.4;
              font-weight: 600;
            }

            .btn-cta-signup {
              background: var(--primary) !important;
              color: white !important;
              border: none;
              border-radius: 20px;
              padding: 8px 16px;
              font-size: 0.76rem;
              font-weight: 800;
              align-self: flex-start;
              margin-top: 4px;
              transition: all 0.2s ease;
            }
            .btn-cta-signup:active {
              transform: scale(0.95);
            }

            .signup-cta-form {
              display: flex;
              flex-direction: column;
              gap: 10px;
            }

            .form-header h5 {
              font-size: 0.8rem;
              font-weight: 800;
              color: var(--text-main);
            }

            .form-header p {
              font-size: 0.65rem;
              color: var(--profile-text-muted);
              font-weight: 600;
            }

            .signup-input-group {
              display: flex;
              flex-direction: column;
              gap: 8px;
            }

            .signup-input {
              width: 100%;
              padding: 8px 12px;
              border-radius: 10px;
              border: 1px solid transparent;
              background: var(--profile-bg-subcard);
              color: var(--text-main);
              font-size: 0.78rem;
              font-weight: 600;
              transition: all 0.2s ease;
            }

            .signup-input:focus {
              background: var(--profile-bg-card);
              border-color: var(--primary);
              outline: none;
              box-shadow: 0 0 0 3px rgba(255, 91, 38, 0.08);
            }

            .signup-error-msg {
              font-size: 0.68rem;
              color: #EF4444;
              font-weight: 600;
            }

            .signup-form-buttons {
              display: flex;
              gap: 8px;
            }

            .btn-signup-submit {
              background: var(--primary);
              color: white;
              border: none;
              border-radius: 20px;
              padding: 6px 12px;
              font-size: 0.74rem;
              font-weight: 800;
              transition: all 0.2s ease;
            }
            .btn-signup-submit:active {
              transform: scale(0.95);
            }

            .btn-signup-cancel {
              background: var(--profile-bg-subcard);
              border: none;
              color: var(--text-main);
              border-radius: 20px;
              padding: 6px 12px;
              font-size: 0.74rem;
              font-weight: 800;
              transition: all 0.2s ease;
            }
            .btn-signup-cancel:active {
              transform: scale(0.95);
            }

            .active-order-banner {
              display: flex;
              align-items: center;
              gap: 12px;
              background: var(--primary-glow) !important;
              border: 1px solid transparent !important;
              border-radius: 16px;
              padding: 12px;
              cursor: pointer;
              box-shadow: var(--profile-shadow) !important;
              transition: all 0.2s ease;
            }
            .active-order-banner:active {
              transform: scale(0.98);
            }

            .banner-delivery-badge {
              font-size: 1.6rem;
            }

            .status-flex {
              display: flex;
              align-items: center;
              gap: 6px;
            }

            .pulse-dot {
              width: 6px;
              height: 6px;
              border-radius: 50%;
              background: var(--primary);
              animation: dot-pulse 1.5s infinite;
            }

            @keyframes dot-pulse {
              0% { transform: scale(0.8); opacity: 0.5; }
              50% { transform: scale(1.3); opacity: 1; }
              100% { transform: scale(0.8); opacity: 0.5; }
            }

            .banner-title {
              font-size: 0.82rem;
              font-weight: 800;
              color: var(--primary);
            }

            .banner-subtitle {
              font-size: 0.68rem;
              color: var(--text-main);
              font-weight: 600;
              margin-top: 1px;
            }

            .banner-arrow {
              color: var(--primary);
            }

            .profile-favorites-carousel {
              display: flex;
              gap: 12px;
              overflow-x: auto;
              padding: 4px;
              scrollbar-width: none;
            }

            .profile-favorites-carousel::-webkit-scrollbar {
              display: none;
            }

            .fav-carousel-card {
              flex: 0 0 125px;
              background: var(--profile-bg-card) !important;
              border-radius: 14px;
              padding: 6px;
              display: flex;
              flex-direction: column;
              gap: 6px;
              cursor: pointer;
              transition: all 0.2s ease;
              box-shadow: var(--profile-shadow);
              border: 1px solid transparent;
            }

            .fav-carousel-card:hover {
              transform: translateY(-2px);
              box-shadow: var(--profile-shadow-hover);
            }
            .fav-carousel-card:active {
              transform: scale(0.96);
            }

            .fav-img-wrapper {
              position: relative;
              width: 100%;
              height: 72px;
              border-radius: 10px;
              overflow: hidden;
            }

            .fav-img-wrapper img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }

            .fav-heart-btn {
              position: absolute;
              top: 4px;
              right: 4px;
              background: #FFFFFF;
              border-radius: 50%;
              width: 22px;
              height: 22px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: var(--primary);
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              border: none;
            }

            .fav-details {
              display: flex;
              flex-direction: column;
              gap: 1px;
            }

            .fav-name {
              font-size: 0.72rem;
              font-weight: 800;
              color: var(--text-main);
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .fav-price-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }

            .fav-price {
              font-size: 0.72rem;
              font-weight: 800;
              color: var(--primary);
            }

            .fav-add-badge {
              background: var(--primary);
              color: white;
              border-radius: 50%;
              width: 18px;
              height: 18px;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .empty-favorites-glass {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 6px;
              padding: 16px;
              text-align: center;
              background: var(--profile-bg-subcard) !important;
              border-radius: 12px;
              font-size: 0.72rem;
              color: var(--profile-text-muted);
              font-weight: 600;
            }

            .heart-empty-icon {
              color: var(--profile-text-muted);
              opacity: 0.8;
            }

            .history-glass-list {
              display: flex;
              flex-direction: column;
              gap: 12px;
            }

            .history-glass-card {
              background: var(--profile-bg-card) !important;
              border-radius: 14px;
              padding: 14px;
              display: flex;
              flex-direction: column;
              gap: 10px;
              box-shadow: var(--profile-shadow);
              border: 1px solid transparent;
            }

            .history-glass-top {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 1px solid var(--profile-border-color) !important;
              padding-bottom: 8px;
            }

            .history-id-date {
              display: flex;
              flex-direction: column;
              gap: 1px;
            }

            .history-id {
              font-family: var(--font-accent);
              font-weight: 800;
              font-size: 0.78rem;
              color: var(--text-main);
            }

            .history-date {
              font-size: 0.65rem;
              color: var(--profile-text-muted);
              font-weight: 600;
            }

            .history-glass-status {
              background: #10B981 !important;
              color: white !important;
              font-size: 0.64rem;
              font-weight: 800;
              padding: 3px 8px;
              border-radius: 20px;
              text-transform: uppercase;
            }

            .history-glass-body {
              display: flex;
              flex-direction: column;
              gap: 4px;
            }

            .history-food-line-item {
              display: flex;
              justify-content: space-between;
              font-size: 0.74rem;
              color: var(--text-main);
              font-weight: 600;
            }

            .history-glass-note {
              margin-top: 4px;
              padding: 8px;
              background: var(--profile-bg-subcard);
              border-radius: 8px;
              border: 1px dashed var(--profile-border-color) !important;
            }

            .history-glass-note .note-title {
              font-weight: 800;
              color: var(--text-main);
              display: block;
              font-size: 0.6rem;
              text-transform: uppercase;
              margin-bottom: 2px;
            }

            .history-glass-note .note-content {
              font-size: 0.7rem;
              color: var(--profile-text-muted);
              line-height: 1.3;
              margin: 0;
            }

            .history-glass-footer {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-top: 1px solid var(--profile-border-color);
              padding-top: 8px;
            }

            .history-price-paid {
              display: flex;
              flex-direction: column;
            }

            .history-price-paid .lbl {
              font-size: 0.64rem;
              color: var(--profile-text-muted);
              font-weight: 600;
            }

            .history-price-paid .val {
              font-family: var(--font-accent);
              color: var(--primary);
              font-size: 0.88rem;
              font-weight: 800;
            }

            .btn-glass-reorder {
              background: var(--primary) !important;
              color: white !important;
              border: none;
              font-size: 0.72rem;
              font-weight: 800;
              padding: 6px 14px;
              border-radius: 20px;
              transition: all 0.2s ease;
              box-shadow: 0 4px 12px rgba(255, 91, 38, 0.15);
              cursor: pointer;
            }

            .btn-glass-reorder:hover {
              background: var(--primary-hover);
              transform: translateY(-1px);
              box-shadow: 0 6px 16px rgba(255, 91, 38, 0.2);
            }
            .btn-glass-reorder:active {
              transform: scale(0.95);
            }

            .empty-history-glass {
              text-align: center;
              padding: 24px 10px;
              font-size: 0.74rem;
              color: var(--profile-text-muted);
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 6px;
            }

            .empty-history-glass .package-icon {
              font-size: 1.8rem;
            }

            .scroll-optimized {
              scrollbar-width: none;
              -webkit-overflow-scrolling: touch;
            }
          `}} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
