import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, doc, setDoc, connectFirestoreEmulator } from 'firebase/firestore';
import { SEED_CATEGORIES, SEED_MENU_ITEMS } from '../src/data/menu.js';

const firebaseConfig = {
  apiKey: "local-emulator-key",
  authDomain: "localhost",
  projectId: "orderfoodmaxx",
  storageBucket: "orderfoodmaxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Connect to emulators
connectFirestoreEmulator(db, 'localhost', 8080);
connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });

console.log("Connected to local Firebase Emulators (Auth: 9099, Firestore: 8080)");

async function seed() {
  console.log("1. Seeding categories...");
  for (const cat of SEED_CATEGORIES) {
    await setDoc(doc(db, 'categories', cat.id), cat);
    console.log(`   - Category: [${cat.id}] ${cat.label}`);
  }

  console.log("2. Seeding menu items...");
  for (const item of SEED_MENU_ITEMS) {
    await setDoc(doc(db, 'menu_items', item.id), item);
    console.log(`   - Menu Item: [${item.id}] ${item.name}`);
  }

  console.log("3. Creating admin user in Auth Emulator...");
  const adminEmail = 'admin@foodmaxx.com';
  const adminPassword = 'admin123';
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    const user = userCredential.user;
    console.log(`   - Auth User Created: UID = ${user.uid}`);

    console.log("4. Whitelisting admin in Firestore /admins collection...");
    await setDoc(doc(db, 'admins', user.uid), {
      email: adminEmail,
      role: 'Super Admin',
      createdAt: new Date().toISOString()
    });
    console.log(`   - Admin Whitelisted: UID = ${user.uid}`);
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      console.log("   - Admin Auth User already exists in emulator.");
    } else {
      console.error("   - Failed to create Admin user:", err);
    }
  }

  console.log("Seeding complete! Local emulator has categories, menu items, and admin credentials. 🚀");
  process.exit(0);
}

seed().catch(err => {
  console.error("Error during seeding:", err);
  process.exit(1);
});
