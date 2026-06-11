import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "fake-key",
  authDomain: "charistaryogurt.firebaseapp.com",
  projectId: "charistaryogurt",
  storageBucket: "charistaryogurt.firebasestorage.app",
  messagingSenderId: "12345",
  appId: "1:12345:web:123"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
connectFirestoreEmulator(db, '127.0.0.1', 8080);

const products = [
  {
    id: "0",
    title: 'Fura da Nono Blend',
    category: 'Parfait',
    active: true,
    subtitle: 'Traditional millet & creamy greek yogurt',
    description: 'A luxurious modern take on the traditional northern Nigerian Fura da Nono. We blend premium, thick greek yogurt with perfectly spiced millet dough (Fura) for a filling, culturally rich parfait experience.',
    price: '₦3,500',
    image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&q=80',
    liked: true,
    nutrition: { kcal: 240, protein: 18.5, fats: 10.2, carbo: 32.4 },
    rating: 4.8
  },
  {
    id: "1",
    title: 'Zobo Berry Parfait',
    category: 'Parfait',
    active: true,
    subtitle: 'Hibiscus infused yogurt with fresh fruits',
    description: 'Rich greek yogurt infused with our signature Zobo (hibiscus) reduction, giving it a vibrant ruby color and tart flavor. Layered with fresh local strawberries, blueberries, and crunchy granola.',
    price: '₦4,200',
    image: 'https://images.unsplash.com/photo-1488477304112-49658c47eefb?w=500&q=80',
    liked: false,
    nutrition: { kcal: 198, protein: 15.2, fats: 8.8, carbo: 28.7 },
    rating: 4.9
  },
  {
    id: "2",
    title: 'Tigernut Coconut',
    category: 'Yogurt',
    active: true,
    subtitle: 'Kunu Aya blended with coconut milk',
    description: 'A creamy, dairy-free inspired option featuring local Tigernuts (Kunu Aya) and fresh coconut milk blended into a smooth yogurt base. Naturally sweet, earthy, and incredibly refreshing.',
    price: '₦3,800',
    image: 'https://images.unsplash.com/photo-1563805042-7684c8e9e533?w=500&q=80',
    liked: true,
    nutrition: { kcal: 210, protein: 12.0, fats: 14.5, carbo: 22.0 },
    rating: 4.7
  },
  {
    id: "3",
    title: 'Mango Pineapple',
    category: 'Yogurt',
    active: true,
    subtitle: 'Tropical blend with locally sourced fruits',
    description: 'A burst of sunshine in a cup. We mix our thick yogurt with fresh, sweet Ogbomosho mangoes and tangy pineapple chunks. Perfect for a hot Nigerian afternoon.',
    price: '₦4,000',
    image: 'https://images.unsplash.com/photo-1572449043416-55f4685c9bb7?w=500&q=80',
    liked: false,
    nutrition: { kcal: 185, protein: 14.0, fats: 5.5, carbo: 30.2 },
    rating: 4.6
  },
  {
    id: "4",
    title: 'Plain Greek Yogurt',
    category: 'Yogurt',
    active: true,
    subtitle: 'Thick, creamy, unsweetened local dairy',
    description: 'Sometimes simple is best. Our classic, unsweetened Greek yogurt is sourced from the finest local dairy farms. Thick, creamy, and packed with probiotics. Perfect for your own mix-ins.',
    price: '₦3,000',
    image: 'https://images.unsplash.com/photo-1584314918532-841da3671a74?w=500&q=80',
    liked: false,
    nutrition: { kcal: 150, protein: 20.0, fats: 6.0, carbo: 8.0 },
    rating: 4.5
  },
  {
    id: "5",
    title: 'Moringa Green Blend',
    category: 'Smoothie',
    active: true,
    subtitle: 'Detox yogurt smoothie with fresh Moringa',
    description: 'A powerhouse of nutrition. We blend our signature yogurt with fresh Moringa leaves, a touch of ginger, and sweet apples for a detoxifying, energy-boosting super-smoothie.',
    price: '₦3,700',
    image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&q=80',
    liked: true,
    nutrition: { kcal: 175, protein: 16.5, fats: 7.2, carbo: 20.5 },
    rating: 4.8
  }
];

const categories = [
  { name: 'Parfait' },
  { name: 'Yogurt' },
  { name: 'Drinks' },
  { name: 'Smoothie' }
];

async function seed() {
  console.log("Seeding products to local emulator...");
  for (const product of products) {
    await setDoc(doc(db, "products", product.id), product);
    console.log(`Seeded product: ${product.title}`);
  }
  console.log("Seeding categories...");
  for (const cat of categories) {
    await setDoc(doc(db, "categories", cat.name.toLowerCase()), cat);
    console.log(`Seeded category: ${cat.name}`);
  }
  console.log("Done seeding!");
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
