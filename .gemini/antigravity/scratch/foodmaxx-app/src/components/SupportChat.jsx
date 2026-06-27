import React, { useContext, useState, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { X, Send, ArrowLeft } from 'lucide-react';
import { playNotificationChime, playTick, playPop } from '../utils/sound';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '../firebase/config';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

export default function SupportChat() {
  const { soundEnabled, currentOrder, cartTotalItems, activeScreen, showSupport, setShowSupport, userProfile, setUnreadSupport, storeConfig } = useContext(AppContext);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('fm_support_messages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      { id: 1, sender: 'bot', text: 'Hello! Welcome to FoodMaxx Live Support. How can we help you with your order today? 🍲', time: 'Just now' }
    ];
  });

  useEffect(() => {
    if (storeConfig?.supportWelcomeMsg) {
      setMessages(prev => prev.map(m => {
        if (m.id === 1 && m.sender === 'bot' && (m.text.startsWith('Hello! Welcome to FoodMaxx Live Support') || m.text.startsWith('Hello! Welcome to Live Support'))) {
          return { ...m, text: storeConfig.supportWelcomeMsg };
        }
        return m;
      }));
    }
  }, [storeConfig]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatStatus, setChatStatus] = useState('active'); // 'active' | 'closed'
  const [roomUnread, setRoomUnread] = useState(0);
  const messagesEndRef = useRef(null);
  const messagesThreadRef = useRef(null);
  const isAtBottom = useRef(true);

  const isInputFocused = useRef(false);
  const blurTimeoutRef = useRef(null);

  const handleInputFocus = () => {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    isInputFocused.current = true;
  };

  const handleInputBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      isInputFocused.current = false;
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, []);

  const [viewportHeight, setViewportHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 0);
  const [viewportOffsetTop, setViewportOffsetTop] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
        setViewportOffsetTop(window.visualViewport.offsetTop);
      } else {
        setViewportHeight(window.innerHeight);
      }
    };

    if (navigator.virtualKeyboard) {
      navigator.virtualKeyboard.overlaysContent = true;
      const handleGeometryChange = (e) => {
        const { height } = e.target.boundingRect;
        setKeyboardHeight(height);
      };
      navigator.virtualKeyboard.addEventListener('geometrychange', handleGeometryChange);
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
    }

    handleResize();

    return () => {
      if (navigator.virtualKeyboard) {
        navigator.virtualKeyboard.removeEventListener('geometrychange', handleGeometryChange);
      }
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      } else {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  const actualHeight = viewportHeight - keyboardHeight;

  // Save messages to localStorage when updated (only if db is not present)
  useEffect(() => {
    if (db) return;
    try {
      localStorage.setItem('fm_support_messages', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Sync messages from other tabs or Firestore
  useEffect(() => {
    if (!db) {
      const handleStorageChange = () => {
        try {
          const saved = localStorage.getItem('fm_support_messages');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              setMessages(parsed);
            }
          }
        } catch {}
      };
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }

    // Get or create guest UID if not logged in
    let guestUid = localStorage.getItem('fm_guest_uid');
    if (!guestUid) {
      guestUid = 'guest_' + Math.floor(10000 + Math.random() * 90000);
      localStorage.setItem('fm_guest_uid', guestUid);
    }

    let unsubscribeDoc = () => {};

    const subscribeToDoc = (docId) => {
      unsubscribeDoc();
      const chatDocRef = doc(db, 'support_chats', docId);
      unsubscribeDoc = onSnapshot(chatDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data.messages)) {
            // Real-time unread alert checking
            setMessages((prev) => {
              if (prev.length > 0 && data.messages.length > prev.length) {
                const latestMsg = data.messages[data.messages.length - 1];
                if ((latestMsg.sender === 'bot' || latestMsg.sender === 'admin') && !showSupport) {
                  setUnreadSupport(true);
                  playNotificationChime(soundEnabled);
                }
              }
              return data.messages;
            });
          }
          // Sync chat open/closed status
          setChatStatus(data.status === 'closed' ? 'closed' : 'active');
          setRoomUnread(data.unread || 0);
        } else {
          // First time welcome message
          const welcomeMsg = { 
            id: 1, 
            sender: 'bot', 
            text: storeConfig?.supportWelcomeMsg || 'Hello! Welcome to FoodMaxx Live Support. How can we help you today? 🍲', 
            time: 'Just now' 
          };
          setDoc(chatDocRef, {
            userId: docId,
            name: userProfile.name || (docId.startsWith('guest_') ? `Guest (${docId.slice(-5)})` : 'PWA Customer'),
            phone: userProfile.phone || '',
            lastMessage: welcomeMsg.text,
            time: welcomeMsg.time,
            unread: 0,
            updatedAt: new Date().toISOString(),
            messages: [welcomeMsg]
          }).catch(err => console.error("Error creating chat doc:", err));
        }
      }, (err) => {
        console.warn("Firestore support chat stream failed:", err);
      });
    };

    // Listen to Auth state changes to switch document IDs dynamically
    const unsubscribeAuth = auth ? auth.onAuthStateChanged((user) => {
      const targetId = user ? user.uid : guestUid;
      subscribeToDoc(targetId);
    }) : (() => {
      subscribeToDoc(guestUid);
      return () => {};
    })();

    return () => {
      unsubscribeAuth();
      unsubscribeDoc();
    };
  }, [userProfile.name, userProfile.phone, storeConfig]);

  const inputRef = useRef(null);

  // Autofocus input when chat opens
  useEffect(() => {
    if (showSupport && inputRef.current) {
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 300);
    }
  }, [showSupport]);

  const handleScroll = (e) => {
    const el = e.target;
    const threshold = 60;
    isAtBottom.current = (el.scrollHeight - el.scrollTop - el.clientHeight) <= threshold;
  };

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isAtBottom.current && messagesThreadRef.current) {
      messagesThreadRef.current.scrollTop = messagesThreadRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (isAtBottom.current && messagesThreadRef.current) {
      const timer = setTimeout(() => {
        if (messagesThreadRef.current) {
          messagesThreadRef.current.scrollTop = messagesThreadRef.current.scrollHeight;
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [actualHeight]);

  const getBotResponse = () => {
    return storeConfig?.supportFallbackMsg || "Thank you for contacting FoodMaxx. A customer support representative has been notified and will attend to you shortly. 📞";
  };

  const handleSend = (text) => {
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    playTick(soundEnabled);
    setInput('');

    // Keep focus
    if (inputRef.current) {
      inputRef.current.focus();
      isInputFocused.current = true;
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          isInputFocused.current = true;
          if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
        }
      }, 30);
    }

    if (db) {
      const activeUid = auth?.currentUser?.uid || localStorage.getItem('fm_guest_uid') || (() => {
        const newGuestUid = 'guest_' + Math.floor(10000 + Math.random() * 90000);
        localStorage.setItem('fm_guest_uid', newGuestUid);
        return newGuestUid;
      })();

      const chatDocRef = doc(db, 'support_chats', activeUid);
      const nextMessages = [...messages, userMsg];

      // Optimistic state update for instant rendering
      setMessages(nextMessages);
      setRoomUnread(1);

      setDoc(chatDocRef, {
        userId: activeUid,
        name: userProfile.name || (activeUid.startsWith('guest_') ? `Guest (${activeUid.slice(-5)})` : 'PWA Customer'),
        phone: userProfile.phone || auth?.currentUser?.phoneNumber || '',
        lastMessage: text,
        time: userMsg.time,
        unread: 1, // notify admin of a new message
        updatedAt: new Date().toISOString(),
        messages: nextMessages
      }).catch(err => console.error("Error writing user message to Firestore:", err));

      const hasAdminJoined = messages.some(m => m.sender === 'admin');
      const alreadyNotified = messages.some(m => m.sender === 'bot' && m.text.includes('will attend to you shortly'));

      if (!hasAdminJoined && !alreadyNotified) {
        setIsTyping(true);
        const botReply = getBotResponse();
        setTimeout(() => {
          const botMsg = {
            id: Date.now() + 1,
            sender: 'bot',
            text: botReply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          
          // Optimistic state update for bot reply
          setMessages((prev) => [...prev, botMsg]);

          setDoc(chatDocRef, {
            userId: activeUid,
            name: userProfile.name || (activeUid.startsWith('guest_') ? `Guest (${activeUid.slice(-5)})` : 'PWA Customer'),
            phone: userProfile.phone || auth?.currentUser?.phoneNumber || '',
            lastMessage: botReply,
            time: botMsg.time,
            unread: 1, // notify admin
            updatedAt: new Date().toISOString(),
            messages: [...nextMessages, botMsg]
          }).catch(err => console.error("Error writing bot reply to Firestore:", err));

          setIsTyping(false);
          playPop(soundEnabled);
        }, 1500);
      }

    } else {
      // LocalStorage fallback
      setMessages(prev => [...prev, userMsg]);
      setRoomUnread(1);
      
      const hasAdminJoined = messages.some(m => m.sender === 'admin');
      const alreadyNotified = messages.some(m => m.sender === 'bot' && m.text.includes('will attend to you shortly'));

      if (!hasAdminJoined && !alreadyNotified) {
        setIsTyping(true);
        setTimeout(() => {
          const botMsg = {
            id: Date.now() + 1,
            sender: 'bot',
            text: getBotResponse(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, botMsg]);
          setRoomUnread(0);
          setIsTyping(false);
          playPop(soundEnabled);
        }, 1500);
      }
    }
  };

  const handleStartNewChat = () => {
    if (!db) {
      setMessages([
        { id: Date.now(), sender: 'bot', text: 'Hello! Welcome back to FoodMaxx Live Support. How can we help you today? 🍲', time: 'Just now' }
      ]);
      setChatStatus('active');
      return;
    }
    const activeUid = auth?.currentUser?.uid || localStorage.getItem('fm_guest_uid');
    if (!activeUid) return;

    const chatDocRef = doc(db, 'support_chats', activeUid);
    const welcomeMsg = {
      id: Date.now(),
      sender: 'bot',
      text: 'Hello! Welcome back to FoodMaxx Live Support. How can we help you today? 🍲',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setDoc(chatDocRef, {
      userId: activeUid,
      name: userProfile.name || (activeUid.startsWith('guest_') ? `Guest (${activeUid.slice(-5)})` : 'PWA Customer'),
      phone: userProfile.phone || auth?.currentUser?.phoneNumber || '',
      lastMessage: welcomeMsg.text,
      time: welcomeMsg.time,
      unread: 1,
      status: 'active',
      updatedAt: new Date().toISOString(),
      messages: [welcomeMsg]
    }).catch(err => console.error("Error restarting support chat:", err));
  };

  const quickReplies = [
    { label: 'Where is my order? 🛵', query: 'Where is my order?' },
    { label: 'Change address details 📍', query: 'I need to change my address' },
    { label: 'Refund request 💳', query: 'How do I get a refund?' },
    { label: 'Talk to an agent 📞', query: 'Talk to a human agent' }
  ];

  const renderCheckmarks = (msg, msgIdx) => {
    if (msg.sender !== 'user') return null;

    // Find if this is the last user message in the array
    const isLastUserMsg = !messages.slice(msgIdx + 1).some(m => m.sender === 'user');
    
    // If it's not the last user message, or if there's any admin/bot reply after it, it has been read
    const hasSubsequentReply = messages.slice(msgIdx + 1).some(m => m.sender === 'admin' || m.sender === 'bot');
    const isRead = hasSubsequentReply || (!isLastUserMsg) || (roomUnread === 0);

    return (
      <svg 
        width="14" 
        height="11" 
        viewBox="0 0 16 12" 
        fill="none" 
        style={{ 
          display: 'inline-block', 
          marginLeft: '5px', 
          verticalAlign: 'middle',
          position: 'relative',
          top: '-1px'
        }}
      >
        {/* First Tick */}
        <path d="M1.5 5.8L4.8 9L11.5 2.2" stroke={isRead ? "#34B7F1" : "#A0A0A0"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        {/* Second Tick overlapping */}
        <path d="M5.2 5.8L8.5 9L15.2 2.2" stroke={isRead ? "#34B7F1" : "#A0A0A0"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  return (
    <>
      <AnimatePresence>
        {showSupport && (
          <motion.div 
            className="support-chat-overlay" 
            onClick={() => setShowSupport(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              top: `${viewportOffsetTop}px`,
              height: `${actualHeight}px`,
              left: 0,
              right: 0,
              bottom: 'auto',
              display: 'flex',
              alignItems: typeof window !== 'undefined' && window.innerWidth <= 640 ? 'flex-start' : 'center',
              justifyContent: 'center',
              perspective: '1500px',
              transformStyle: 'preserve-3d',
              zIndex: 9999,
              padding: typeof window !== 'undefined' && window.innerWidth <= 640 ? '0px' : '16px'
            }}
          >
            <motion.div 
              className="support-chat-window" 
              onClick={(e) => {
                e.stopPropagation();
                // Ensure input field retains focus to keep keypad open
                const isDismissOrInput = e.target.closest('.chat-close-btn') || e.target.closest('.chat-back-btn') || e.target.closest('.chat-restart-btn') || e.target.closest('.chat-input-field') || e.target.closest('.quick-reply-chip');
                if (isInputFocused.current && !isDismissOrInput && inputRef.current) {
                  inputRef.current.focus();
                }
              }}
              onTouchStart={(e) => {
                // Ensure tapping inside doesn't blur input, keeping keypad open
                const isDismissOrInput = e.target.closest('.chat-close-btn') || e.target.closest('.chat-back-btn') || e.target.closest('.chat-restart-btn') || e.target.closest('.chat-input-field') || e.target.closest('.quick-reply-chip');
                if (isInputFocused.current && !isDismissOrInput && inputRef.current) {
                  if (document.activeElement !== inputRef.current) {
                    inputRef.current.focus();
                  }
                }
              }}
              initial={{ opacity: 0, scale: 0.7, rotateX: -45, rotateY: 15, z: -400 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0, rotateY: 0, z: 0 }}
              exit={{ opacity: 0, scale: 0.7, rotateX: 45, rotateY: -15, z: -400 }}
              transition={{ type: "spring", damping: 22, stiffness: 180 }}
              style={{ 
                transformOrigin: 'center center', 
                transformStyle: 'preserve-3d',
                height: typeof window !== 'undefined' && window.innerWidth <= 640 ? '100%' : '80vh',
                maxHeight: typeof window !== 'undefined' && window.innerWidth <= 640 ? '100%' : '650px',
                width: typeof window !== 'undefined' && window.innerWidth <= 640 ? '100%' : '90%',
                borderRadius: typeof window !== 'undefined' && window.innerWidth <= 640 ? '0px' : '28px',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Header */}
              <div className="chat-window-header">
                <div className="chat-header-left-flex">
                  <button className="chat-back-btn" onClick={() => setShowSupport(false)} aria-label="Back">
                    <ArrowLeft size={18} />
                  </button>
                  <div className="chat-header-avatar-group">
                    <div className="chat-header-avatar">⚡</div>
                    <div className="chat-header-meta">
                      <h4 className="chat-header-title">FoodMaxx Support</h4>
                      <span className="chat-header-status">online • staff responds shortly</span>
                    </div>
                  </div>
                </div>
                <button className="chat-close-btn" onClick={() => setShowSupport(false)} aria-label="Close">
                  <X size={18} />
                </button>
              </div>
  
              {/* Message Thread */}
              <div 
                ref={messagesThreadRef}
                onScroll={handleScroll}
                className="chat-messages-thread"
              >
                {messages.map((msg, msgIdx) => (
                  <div key={msg.id} className={`chat-msg-row ${msg.sender === 'user' ? 'outgoing' : 'incoming'}`}>
                    {msg.sender === 'bot' && <div className="chat-msg-avatar">🍲</div>}
                    <div className="chat-msg-bubble">
                       <p className="chat-msg-text">{msg.text}</p>
                       <span className="chat-msg-time">
                         {msg.time}
                         {renderCheckmarks(msg, msgIdx)}
                       </span>
                    </div>
                  </div>
                ))}
  
                {/* Typing Indicator */}
                {isTyping && (
                  <div className="chat-msg-row incoming">
                    <div className="chat-msg-avatar">🍲</div>
                    <div className="chat-msg-bubble typing">
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                    </div>
                  </div>
                )}
                <div className="chat-messages-bottom-spacer" style={{ height: '70px', flexShrink: 0 }} />
                <div ref={messagesEndRef} />
              </div>
  
              {chatStatus === 'closed' ? (
                <div 
                  className="chat-resolved-footer"
                  style={{
                    paddingBottom: keyboardHeight > 0 ? '16px' : 'calc(24px + env(safe-area-inset-bottom, 0px))'
                  }}
                >
                  <p className="chat-resolved-text">This support session has been resolved. ✅</p>
                  <button 
                    className="chat-restart-btn"
                    onClick={handleStartNewChat}
                  >
                    Start New Chat
                  </button>
                </div>
              ) : (
                <>
                  {/* Quick Replies chips */}
                  <div className="chat-quick-replies">
                    {quickReplies.map((reply, index) => (
                      <button 
                        key={index} 
                        className="quick-reply-chip" 
                        onMouseDown={(e) => e.preventDefault()}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          handleSend(reply.query);
                        }}
                        onClick={() => handleSend(reply.query)}
                      >
                        {reply.label}
                      </button>
                    ))}
                  </div>
      
                  {/* Input Form Footer */}
                  <div 
                    className="chat-input-footer"
                    style={{
                      paddingBottom: keyboardHeight > 0 ? '10px' : 'calc(16px + env(safe-area-inset-bottom, 0px))'
                    }}
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Type your message here..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSend(input);
                        }
                      }}
                      className="chat-input-field"
                    />
                    <button 
                      className={`chat-send-btn ${!input.trim() ? 'disabled' : ''}`} 
                      onMouseDown={(e) => e.preventDefault()}
                      onTouchStart={(e) => {
                        if (!input.trim()) return;
                        e.preventDefault();
                        handleSend(input);
                      }}
                      onClick={() => {
                        if (input.trim()) {
                          handleSend(input);
                        }
                      }}
                      type="button"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
 
      <style dangerouslySetInnerHTML={{ __html: `
        .support-chat-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(12px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          perspective: 1500px;
          transform-style: preserve-3d;
        }
 
        .support-chat-window {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 28px;
          width: 90%;
          max-width: 440px;
          height: 80vh;
          max-height: 650px;
          display: flex;
          flex-direction: column;
          box-shadow: 
            0 30px 60px rgba(0, 0, 0, 0.4),
            0 10px 20px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
          overflow: hidden;
          transform-style: preserve-3d;
        }
 
        .chat-window-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 16px;
          padding-top: calc(14px + env(safe-area-inset-top, 0px));
          border-bottom: 1px solid var(--border-color);
          background: var(--bg-card);
        }

        .chat-header-left-flex {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .chat-back-btn {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: var(--bg-secondary);
          color: var(--text-main);
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          flex-shrink: 0;
          transition: transform 0.2s;
        }

        .chat-back-btn:active {
          transform: scale(0.9);
        }
 
        .chat-header-avatar-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }
 
        .chat-header-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: var(--primary-glow);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          border: none;
        }
 
        .chat-header-meta {
          display: flex;
          flex-direction: column;
        }
 
        .chat-header-title {
          font-family: var(--font-accent);
          font-weight: 800;
          font-size: 0.92rem;
          color: var(--text-main);
        }
 
        .chat-header-status {
          font-size: 0.68rem;
          color: var(--secondary);
          font-weight: 600;
        }
 
        .chat-close-btn {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: var(--bg-secondary);
          color: var(--text-main);
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
        }
 
        .chat-messages-thread {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: var(--bg-secondary);
        }
 
        .chat-msg-row {
          display: flex;
          gap: 8px;
          max-width: 85%;
        }
 
        .chat-msg-row.incoming {
          align-self: flex-start;
        }
 
        .chat-msg-row.outgoing {
          align-self: flex-end;
          flex-direction: row-reverse;
          max-width: 80%;
        }
 
        .chat-msg-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--bg-card);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.78rem;
          flex-shrink: 0;
        }
 
        .chat-msg-bubble {
          background: var(--bg-card);
          border: none;
          padding: 10px 12px;
          border-radius: 16px;
          border-top-left-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.015);
        }
 
        .chat-msg-row.outgoing .chat-msg-bubble {
          background: var(--primary);
          color: var(--text-white);
          border-radius: 16px;
          border-top-right-radius: 4px;
          box-shadow: 0 4px 12px rgba(255, 91, 38, 0.1);
        }
 
        .chat-msg-text {
          font-size: 0.78rem;
          line-height: 1.4;
          font-weight: 600;
        }
 
        .chat-msg-time {
          font-size: 0.6rem;
          color: var(--text-muted);
          display: block;
          margin-top: 4px;
          text-align: right;
        }
 
        .chat-msg-row.outgoing .chat-msg-time {
          color: rgba(255, 255, 255, 0.7);
        }
 
        /* Typing indicator dots */
        .chat-msg-bubble.typing {
          display: flex;
          gap: 4px;
          align-items: center;
          padding: 12px 16px;
        }
 
        .typing-dot {
          width: 6px;
          height: 6px;
          background: var(--text-muted);
          border-radius: 50%;
          animation: chatTyping 1.4s infinite;
        }
 
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
 
        @keyframes chatTyping {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
 
        /* Quick replies section */
        .chat-quick-replies {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          white-space: nowrap;
          padding: 10px 16px;
          background: var(--bg-card);
          border-top: 1px solid var(--border-color);
          scrollbar-width: none;
        }
 
        .chat-quick-replies::-webkit-scrollbar {
          display: none;
        }
 
        .quick-reply-chip {
          background: var(--bg-secondary);
          border: none;
          color: var(--text-main);
          font-size: 0.72rem;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 16px;
          cursor: pointer;
        }
 
        .quick-reply-chip:active {
          transform: scale(0.95);
        }
 
        /* Input area */
        .chat-input-footer {
          display: flex;
          gap: 8px;
          padding: 10px 16px;
          padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
          background: var(--bg-card);
          border-top: 1px solid var(--border-color);
          align-items: center;
          flex-shrink: 0;
        }
 
        .chat-input-field {
          flex: 1;
          background: var(--bg-secondary);
          border: none;
          border-radius: 20px;
          padding: 10px 16px;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-main);
        }
 
        .chat-send-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: var(--primary);
          color: var(--text-white);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px var(--primary-glow);
        }
 
        .chat-send-btn.disabled {
          background: var(--bg-secondary);
          color: var(--text-muted);
          box-shadow: none;
          cursor: not-allowed;
          pointer-events: none;
        }

        .chat-resolved-footer {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 24px 16px;
          padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px));
          background: var(--bg-card);
          border-top: 1px solid var(--border-color);
          text-align: center;
          flex-shrink: 0;
        }

        .chat-resolved-text {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-muted);
        }

        .chat-restart-btn {
          width: 100%;
          max-width: 240px;
          height: 42px;
          border-radius: 21px;
          background: var(--primary);
          color: var(--text-white);
          font-size: 0.85rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          box-shadow: 0 4px 12px var(--primary-glow);
          cursor: pointer;
          transition: transform 0.2s;
        }

        .chat-restart-btn:active {
          transform: scale(0.97);
        }
      `}} />
    </>
  );
}
