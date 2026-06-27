import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDy6BwipyBfJcpSbw0ISce54kKE3UQFabQ",
  authDomain: "orderfoodmaxx.firebaseapp.com",
  projectId: "orderfoodmaxx",
  storageBucket: "orderfoodmaxx.firebasestorage.app",
  messagingSenderId: "146566000959",
  appId: "1:146566000959:web:15f757c02ebbbb9e4b238a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function inspectDb() {
  const collections = ['categories', 'menu_items', 'orders', 'users', 'admins'];
  console.log("Inspecting Firestore database collections in production...");
  
  for (const name of collections) {
    try {
      const q = query(collection(db, name), limit(10));
      const snap = await getDocs(q);
      console.log(`- Collection '${name}': ${snap.size} documents found (showing top 10 limit query)`);
      snap.forEach(doc => {
        console.log(`  * Doc ID: ${doc.id} =>`, JSON.stringify(doc.data()).substring(0, 100));
      });
    } catch (err) {
      console.error(`- Error reading collection '${name}':`, err.message);
    }
  }
}

inspectDb().then(() => process.exit(0));
