import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, connectFirestoreEmulator } from 'firebase/firestore';
import { SEED_CATEGORIES, SEED_MENU_ITEMS } from '../src/data/menu.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env manually
const envPath = path.resolve(__dirname, '../.env');
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
  console.error("Error: VITE_FIREBASE_API_KEY is not defined in your .env file.");
  console.error("Please configure your Firebase credentials in foodmaxx-app/.env first, then run this seeder.");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

if (process.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  connectFirestoreEmulator(db, 'localhost', 8080);
  console.log("Seeder connected to local Firestore Emulator");
}

async function seed() {
  console.log("Starting Firebase Firestore Seeding...");
  
  console.log("Seeding categories...");
  for (const cat of SEED_CATEGORIES) {
    await setDoc(doc(db, 'categories', cat.id), cat);
    console.log(`- Loaded Category: [${cat.id}] ${cat.label}`);
  }

  console.log("Seeding menu items...");
  for (const item of SEED_MENU_ITEMS) {
    await setDoc(doc(db, 'menu_items', item.id), item);
    console.log(`- Loaded Menu Item: [${item.id}] ${item.name}`);
  }

  console.log("Firestore seeding completed successfully! 🎉");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seeding encountered an error:", err);
  process.exit(1);
});
