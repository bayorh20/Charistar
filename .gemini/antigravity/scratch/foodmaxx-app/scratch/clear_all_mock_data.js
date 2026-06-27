import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env.production manually to get production credentials
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

if (!firebaseConfig.apiKey) {
  console.error("Error: VITE_FIREBASE_API_KEY is not defined in your .env.production file.");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collections to clear
const collectionsToClear = [
  'menu_items',
  'categories',
  'orders',
  'reviews',
  'coupons',
  'riders',
  'affiliates',
  'audit_logs',
  'users'
];

async function clearCollection(name) {
  console.log(`Checking collection '${name}'...`);
  const colRef = collection(db, name);
  const snapshot = await getDocs(colRef);
  
  if (snapshot.empty) {
    console.log(`- Collection '${name}' is already empty.`);
    return;
  }

  console.log(`- Found ${snapshot.size} documents in '${name}'. Deleting...`);
  const docs = snapshot.docs;
  
  // Batch delete in groups of 400
  const chunks = [];
  for (let i = 0; i < docs.length; i += 400) {
    chunks.push(docs.slice(i, i + 400));
  }

  for (const chunk of chunks) {
    const batch = writeBatch(db);
    chunk.forEach(docSnap => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  }
  console.log(`- Successfully cleared collection '${name}'.`);
}

async function runCleanup() {
  console.log("Starting deletion of mock demo data...");
  for (const colName of collectionsToClear) {
    try {
      await clearCollection(colName);
    } catch (err) {
      console.error(`Error clearing collection '${colName}':`, err.message);
    }
  }
  
  console.log("All mock demo data and fake products cleared successfully! 🧹✨");
  process.exit(0);
}

runCleanup().catch(err => {
  console.error("Cleanup script failed:", err);
  process.exit(1);
});
