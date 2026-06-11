import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import { products } from '../data/products.js';

export async function seedProductsToFirestore() {
  try {
    console.log('Starting data seed...');
    const productsRef = collection(db, 'products');
    
    for (const product of products) {
      // We use the local ID as the Firestore document ID so routing remains consistent
      const docRef = doc(productsRef, product.id.toString());
      await setDoc(docRef, product);
      console.log(`Uploaded: ${product.title}`);
    }
    
    console.log('Successfully seeded all products to Firestore!');
    return true;
  } catch (error) {
    console.error('Error seeding data:', error);
    return false;
  }
}
