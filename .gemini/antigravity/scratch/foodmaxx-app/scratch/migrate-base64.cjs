const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');
const { getStorage, ref, uploadString, getDownloadURL } = require('firebase/storage');

// 1. Parse .env.production file manually
const envPath = path.join(__dirname, '..', '.env.production');
if (!fs.existsSync(envPath)) {
  console.error('Error: .env.production file not found at:', envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx > 0) {
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    env[key] = val;
  }
});

// 2. Configure Firebase
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'orderfoodmaxx',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'orderfoodmaxx.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

console.log('Connecting to project:', firebaseConfig.projectId);
console.log('Storage bucket:', firebaseConfig.storageBucket);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

async function runMigration() {
  try {
    console.log('\n--- Migrating Menu Items ---');
    const menuCol = collection(db, 'menu_items');
    const menuSnap = await getDocs(menuCol);
    console.log(`Found ${menuSnap.size} menu items.`);
    
    let menuCount = 0;
    for (const docSnap of menuSnap.docs) {
      const data = docSnap.data();
      const itemId = docSnap.id;
      const image = data.image || '';
      
      if (image.startsWith('data:image/')) {
        console.log(`Migrating image for menu item [${itemId}] ("${data.name}")...`);
        const storagePath = `menu_items/${itemId}_${Date.now()}`;
        const storageRef = ref(storage, storagePath);
        
        // Upload base64 data url string
        const uploadResult = await uploadString(storageRef, image, 'data_url');
        const downloadUrl = await getDownloadURL(uploadResult.ref);
        
        // Update Firestore
        await updateDoc(doc(db, 'menu_items', itemId), { image: downloadUrl });
        console.log(`Successfully uploaded. New URL: ${downloadUrl}`);
        menuCount++;
      }
    }
    console.log(`Menu items migration completed: ${menuCount} items updated.`);

    console.log('\n--- Migrating Categories ---');
    const catCol = collection(db, 'categories');
    const catSnap = await getDocs(catCol);
    console.log(`Found ${catSnap.size} categories.`);
    
    let catCount = 0;
    for (const docSnap of catSnap.docs) {
      const data = docSnap.data();
      const catId = docSnap.id;
      const image = data.image || '';
      
      if (image.startsWith('data:image/')) {
        console.log(`Migrating image for category [${catId}] ("${data.label}")...`);
        const storagePath = `categories/${catId}_${Date.now()}`;
        const storageRef = ref(storage, storagePath);
        
        // Upload base64 data url string
        const uploadResult = await uploadString(storageRef, image, 'data_url');
        const downloadUrl = await getDownloadURL(uploadResult.ref);
        
        // Update Firestore
        await updateDoc(doc(db, 'categories', catId), { image: downloadUrl });
        console.log(`Successfully uploaded. New URL: ${downloadUrl}`);
        catCount++;
      }
    }
    console.log(`Categories migration completed: ${catCount} categories updated.`);
    
    console.log('\nMigration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed with error:', err);
    process.exit(1);
  }
}

runMigration();
