import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

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

async function testOrderWrite() {
  console.log("Starting testOrderWrite...");
  const orderId = `FMX-TEST-${Math.floor(10000 + Math.random() * 90000)}`;
  const orderRef = doc(db, 'orders', orderId);
  
  console.log("Calling setDoc for orderId:", orderId);
  await setDoc(orderRef, {
    id: orderId,
    userId: 'guest',
    customerName: 'Test Guest',
    total: 5000,
    status: 'Order Received',
    createdAt: new Date().toISOString()
  });
  console.log("✅ Successfully wrote test order to production Firestore!");
}

console.log("Executing script...");
testOrderWrite()
  .then(() => {
    console.log("Script completed successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Script failed with error:", err);
    process.exit(1);
  });
