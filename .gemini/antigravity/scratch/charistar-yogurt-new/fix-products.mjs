// Script: fix-products.mjs
// Connects to Firebase, activates every product, and assigns a fitting image
// if one is missing. Run with: node fix-products.mjs

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

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

// A bank of high-quality yogurt/parfait images from Unsplash
const IMAGE_BANK = [
  'https://images.unsplash.com/photo-1488477304112-49658c47eefb?w=600&q=80', // parfait layers
  'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&q=80', // yogurt bowl
  'https://images.unsplash.com/photo-1563805042-7684c8e9e533?w=600&q=80', // smoothie bowl
  'https://images.unsplash.com/photo-1572449043416-55f4685c9bb7?w=600&q=80', // mango yogurt
  'https://images.unsplash.com/photo-1584314918532-841da3671a74?w=600&q=80', // greek yogurt
  'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&q=80', // green smoothie
  'https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=600&q=80', // berry parfait
  'https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?w=600&q=80', // fruit yogurt
  'https://images.unsplash.com/photo-1624939614319-4a6e4c62ca74?w=600&q=80', // creamy parfait
  'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=600&q=80', // granola bowl
];

// Smart image picker: tries to match image to product name/category
function pickImage(product, index) {
  const name = (product.title || product.name || '').toLowerCase();
  const cat  = (product.category || '').toLowerCase();

  if (name.includes('fura') || name.includes('nono'))       return IMAGE_BANK[1];
  if (name.includes('zobo') || name.includes('berry'))      return IMAGE_BANK[0];
  if (name.includes('tigernut') || name.includes('coconut'))return IMAGE_BANK[2];
  if (name.includes('mango') || name.includes('pineapple')) return IMAGE_BANK[3];
  if (name.includes('plain') || name.includes('greek'))     return IMAGE_BANK[4];
  if (name.includes('moringa') || name.includes('green'))   return IMAGE_BANK[5];
  if (name.includes('berry') || name.includes('straw'))     return IMAGE_BANK[6];
  if (cat.includes('smoothie'))                              return IMAGE_BANK[5];
  if (cat.includes('drinks'))                                return IMAGE_BANK[7];
  // Fallback: cycle through the bank
  return IMAGE_BANK[index % IMAGE_BANK.length];
}

async function fixProducts() {
  console.log('🔍 Fetching all products from Firebase...\n');
  const snapshot = await getDocs(collection(db, 'products'));
  
  if (snapshot.empty) {
    console.log('⚠️  No products found in the "products" collection.');
    process.exit(0);
  }

  console.log(`Found ${snapshot.size} products. Processing...\n`);

  let fixed = 0;
  let index = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const updates = {};

    // Always activate
    if (data.active !== true) {
      updates.active = true;
    }

    // Add image if missing
    if (!data.image && !data.img) {
      updates.image = pickImage(data, index);
    }

    if (Object.keys(updates).length > 0) {
      await updateDoc(doc(db, 'products', docSnap.id), updates);
      const name = data.title || data.name || docSnap.id;
      console.log(`✅ Fixed: "${name}"`);
      if (updates.image) console.log(`   → Added image: ${updates.image}`);
      if (updates.active) console.log(`   → Activated`);
      fixed++;
    } else {
      const name = data.title || data.name || docSnap.id;
      console.log(`✓  OK: "${name}" (already active & has image)`);
    }

    index++;
  }

  console.log(`\n🎉 Done! Fixed ${fixed} of ${snapshot.size} products.`);
  process.exit(0);
}

fixProducts().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
