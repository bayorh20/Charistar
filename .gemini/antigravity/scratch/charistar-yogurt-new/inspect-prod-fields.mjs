import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAJIuiHFAz3lhUHa5vbNVwyV1bJTZJkY3g",
  authDomain: "charistaryogurt.firebaseapp.com",
  projectId: "charistaryogurt",
  storageBucket: "charistaryogurt.firebasestorage.app",
  messagingSenderId: "874957111997",
  appId: "1:874957111997:web:8e6a701bd6422dbe8eedd4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const snapshot = await getDocs(collection(db, 'products'));
  console.log(`=== PRODUCTS IN PRODUCTION FIRESTORE (${snapshot.size}) ===`);
  snapshot.forEach(docSnap => {
    console.log(`\nDocument ID: ${docSnap.id}`);
    console.log(JSON.stringify(docSnap.data(), null, 2));
  });
  
  const sectionsSnapshot = await getDocs(collection(db, 'homepage_sections'));
  console.log(`\n=== HOMEPAGE SECTIONS (${sectionsSnapshot.size}) ===`);
  sectionsSnapshot.forEach(docSnap => {
    console.log(`\nSection ID: ${docSnap.id}`);
    console.log(JSON.stringify(docSnap.data(), null, 2));
  });

  process.exit(0);
}

run().catch(console.error);
