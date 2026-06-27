import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, deleteDoc } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read env variables
const envPath = path.resolve(__dirname, '../.env.production');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      process.env[key] = val;
    }
  });
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'orderfoodmaxx',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

console.log("Configured Project ID:", firebaseConfig.projectId);

if (!firebaseConfig.apiKey) {
  console.error("Error: VITE_FIREBASE_API_KEY is not defined in your environment.");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testConnection() {
  console.log("Attempting to write a test document to 'test_connection' collection...");
  const docRef = doc(db, 'test_connection', 'verification_ping');
  
  await setDoc(docRef, {
    status: "success",
    timestamp: new Date().toISOString(),
    message: "Firestore is successfully initialized and accepting requests!"
  });
  
  console.log("✅ Successfully wrote test document to production Firestore!");

  console.log("Attempting to clean up the test document...");
  await deleteDoc(docRef);
  console.log("✅ Successfully deleted test document!");
  
  console.log("🎉 Verification complete. Your Firestore database is fully active and ready for production! 🎉");
  process.exit(0);
}

testConnection().catch(err => {
  console.error("❌ Firestore connection failed:", err);
  process.exit(1);
});
