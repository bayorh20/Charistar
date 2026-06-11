import { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  useEffect(() => {
    let unsubSnapshot = null;
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (unsubSnapshot) unsubSnapshot();
        unsubSnapshot = onSnapshot(doc(db, 'users', user.uid), (userDoc) => {
          if (userDoc.exists()) {
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              ...userDoc.data()
            });
          } else {
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              displayName: 'Yogurt Lover',
              walletBalance: 0,
              role: 'user'
            });
          }
          setLoading(false);
        }, (error) => {
          console.error("Error listening to user data:", error);
          setCurrentUser({ uid: user.uid, email: user.email });
          setLoading(false);
        });
      } else {
        if (unsubSnapshot) unsubSnapshot();
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubSnapshot) unsubSnapshot();
    };
  }, []);

  async function authenticate(phone, password, name = "Yogurt Lover", isRegister = false) {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    const mockEmail = `${cleanPhone}@charistaryogurt.com`;

    if (isRegister) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, mockEmail, password);
        const user = userCredential.user;
        
        await setDoc(doc(db, 'users', user.uid), {
          displayName: name,
          phone: cleanPhone,
          role: 'user',
          walletBalance: 0,
          createdAt: serverTimestamp()
        });

        return user;
      } catch (signupError) {
        if (signupError.code === 'auth/email-already-in-use') {
           throw new Error("An account with this phone number already exists. Please log in.");
        }
        throw new Error(signupError.message.replace('Firebase: ', '') || "Failed to create an account.");
      }
    } else {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, mockEmail, password);
        return userCredential.user;
      } catch (error) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
           throw new Error("Invalid phone number or password.");
        }
        throw new Error(error.message.replace('Firebase: ', '') || "Authentication failed.");
      }
    }
  }

  function logout() {
    return signOut(auth);
  }

  const value = {
    currentUser,
    authenticate,
    logout,
    isAuthModalOpen,
    authModalMode,
    openAuthModal,
    closeAuthModal,
    setAuthModalMode
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#050505]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-[3px] border-[#A3C644] border-t-transparent animate-spin"></div>
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
