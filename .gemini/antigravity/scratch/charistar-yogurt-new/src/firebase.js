import { initializeApp } from 'firebase/app';
import { initializeFirestore, memoryLocalCache, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getMessaging, isSupported } from 'firebase/messaging';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAJIuiHFAz3lhUHa5vbNVwyV1bJTZJkY3g",
  authDomain: "charistaryogurt.firebaseapp.com",
  projectId: "charistaryogurt",
  storageBucket: "charistaryogurt.firebasestorage.app",
  messagingSenderId: "874957111997",
  appId: "1:874957111997:web:8e6a701bd6422dbe8eedd4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services with high-speed memory local cache for instant updates and auto long-polling
export const db = initializeFirestore(app, {
  localCache: memoryLocalCache(),
  experimentalAutoDetectLongPolling: true
});

export const auth = getAuth(app);
export const storage = getStorage(app);

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
if (isLocalhost && (import.meta.env.VITE_USE_EMULATORS === 'true' || window.location.search.includes('emulator=true'))) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099');
  connectStorageEmulator(storage, '127.0.0.1', 9199);
}

let messaging = null;
isSupported().then((supported) => {
  if (supported) {
    messaging = getMessaging(app);
  }
}).catch(console.error);

export { messaging };

export default app;
