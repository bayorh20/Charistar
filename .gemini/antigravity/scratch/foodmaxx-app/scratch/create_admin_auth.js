import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDy6BwipyBfJcpSbw0ISce54kKE3UQFabQ",
  authDomain: "orderfoodmaxx.firebaseapp.com",
  projectId: "orderfoodmaxx",
  storageBucket: "orderfoodmaxx.firebasestorage.app",
  messagingSenderId: "146566000959",
  appId: "1:146566000959:web:15f757c02ebbbb9e4b238a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const email = 'admin@foodmaxx.com';
const password = 'admin123';

async function createAdmin() {
  console.log(`Attempting to create Auth account for ${email}...`);
  let user;
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    user = userCredential.user;
    console.log(`Success: Created Firebase Auth user with UID: ${user.uid}`);
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      console.log(`User ${email} already exists. Attempting sign-in to get UID...`);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      user = userCredential.user;
      console.log(`Success: Signed in as existing user with UID: ${user.uid}`);
    } else {
      throw err;
    }
  }

  console.log(`Checking Firestore admins collection for UID: ${user.uid}...`);
  const adminDocRef = doc(db, 'admins', user.uid);
  const adminSnap = await getDoc(adminDocRef);

  if (!adminSnap.exists()) {
    console.log(`Seeding admin role in Firestore under /admins/${user.uid}...`);
    await setDoc(adminDocRef, {
      email: user.email,
      role: 'Super Admin',
      createdAt: new Date().toISOString()
    });
    console.log('Admin document successfully seeded! 🎉');
  } else {
    console.log('Admin document already exists in Firestore! ✅');
  }
}

createAdmin()
  .then(() => {
    console.log('Script execution finished.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error occurred:', err);
    process.exit(1);
  });
