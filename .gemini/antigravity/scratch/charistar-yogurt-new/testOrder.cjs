const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

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

async function makeOrder() {
  try {
    const docRef = await addDoc(collection(db, 'orders'), {
      customerName: 'Quickprint Boss (Test Order)',
      customerPhone: '09011112222',
      address: 'Charistar HQ',
      notes: 'Please ring the bell',
      items: [
        { title: 'Classic Yogurt', quantity: 2, price: '₦1,500' },
        { title: 'Granola Add-on', quantity: 1, price: '₦500' }
      ],
      totalAmount: 3500,
      paymentMethod: 'wallet',
      status: 'pending',
      createdAt: Date.now()
    });
    console.log('Order created successfully with ID:', docRef.id);
    process.exit(0);
  } catch (e) {
    console.error('Error adding order:', e);
    process.exit(1);
  }
}
makeOrder();
