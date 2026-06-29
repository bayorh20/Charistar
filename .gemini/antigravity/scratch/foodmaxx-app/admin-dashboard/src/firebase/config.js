import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID
};

if (!firebaseConfig.apiKey && import.meta.env.MODE !== 'test') {
  console.error('[Admin Firebase Config] Firebase environment variables are missing! Please copy .env.example to .env and fill in details.');
}

let app     = null;
let db      = null;
let auth    = null;
let storage = null;

try {
  app     = initializeApp(firebaseConfig);
  db      = getFirestore(app);
  auth    = getAuth(app);
  storage = getStorage(app);

  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true' && isLocalhost) {
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    console.log('[Admin Firebase] Connected to local emulators (Auth:9099, Firestore:8080)');
  } else {
    console.log('[Admin Firebase] Connected to production project:', firebaseConfig.projectId);
  }
} catch (err) {
  console.error('[Admin Firebase] Initialization error:', err);
}

export { db, auth, storage, app };
