// fix-products-rest.mjs
// Uses the Firebase REST API (no gRPC needed) to fix all products

const PROJECT_ID = 'charistaryogurt';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const IMAGE_BANK = [
  'https://images.unsplash.com/photo-1488477304112-49658c47eefb?w=600&q=80',
  'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&q=80',
  'https://images.unsplash.com/photo-1563805042-7684c8e9e533?w=600&q=80',
  'https://images.unsplash.com/photo-1572449043416-55f4685c9bb7?w=600&q=80',
  'https://images.unsplash.com/photo-1584314918532-841da3671a74?w=600&q=80',
  'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&q=80',
  'https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=600&q=80',
  'https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?w=600&q=80',
  'https://images.unsplash.com/photo-1624939614319-4a6e4c62ca74?w=600&q=80',
  'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=600&q=80',
];

function pickImage(fields, index) {
  const name = (fields.title?.stringValue || fields.name?.stringValue || '').toLowerCase();
  const cat  = (fields.category?.stringValue || '').toLowerCase();

  if (name.includes('fura') || name.includes('nono'))        return IMAGE_BANK[1];
  if (name.includes('zobo') || name.includes('berry'))       return IMAGE_BANK[0];
  if (name.includes('tigernut') || name.includes('coconut')) return IMAGE_BANK[2];
  if (name.includes('mango') || name.includes('pineapple'))  return IMAGE_BANK[3];
  if (name.includes('plain') || name.includes('greek'))      return IMAGE_BANK[4];
  if (name.includes('moringa') || name.includes('green'))    return IMAGE_BANK[5];
  if (cat.includes('smoothie'))                               return IMAGE_BANK[5];
  if (cat.includes('drinks'))                                 return IMAGE_BANK[7];
  return IMAGE_BANK[index % IMAGE_BANK.length];
}

async function fixProducts() {
  // 1. List all product documents
  const listRes = await fetch(`${BASE_URL}/products`);
  if (!listRes.ok) {
    const err = await listRes.json();
    console.error('❌ Could not list products:', err.error?.message);
    process.exit(1);
  }
  const listData = await listRes.json();
  const docs = listData.documents || [];

  if (docs.length === 0) {
    console.log('⚠️  No products found. Check Firestore rules allow unauthenticated reads.');
    process.exit(0);
  }

  console.log(`Found ${docs.length} products. Fixing...\n`);

  let fixed = 0;
  for (let i = 0; i < docs.length; i++) {
    const docData = docs[i];
    const fields  = docData.fields || {};
    const name    = fields.title?.stringValue || fields.name?.stringValue || docData.name.split('/').pop();
    const hasImage = !!(fields.image?.stringValue || fields.img?.stringValue);
    const isActive = fields.active?.booleanValue === true;

    if (hasImage && isActive) {
      console.log(`✓  OK: "${name}"`);
      continue;
    }

    // Build the update patch
    const updateFields = { active: { booleanValue: true } };
    if (!hasImage) {
      updateFields.image = { stringValue: pickImage(fields, i) };
    }

    // PATCH using updateMask so we don't overwrite other fields
    const fieldPaths = Object.keys(updateFields).map(k => `updateMask.fieldPaths=${k}`).join('&');
    const patchUrl   = `${BASE_URL}/${docData.name.split('/documents/')[1]}?${fieldPaths}`;

    const patchRes = await fetch(patchUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: updateFields }),
    });

    if (patchRes.ok) {
      console.log(`✅ Fixed: "${name}"`);
      if (!hasImage) console.log(`   → Image: ${updateFields.image.stringValue}`);
      if (!isActive) console.log(`   → Activated`);
      fixed++;
    } else {
      const err = await patchRes.json();
      console.log(`❌ Failed: "${name}" — ${err.error?.message}`);
    }
  }

  console.log(`\n🎉 Done! Fixed ${fixed} of ${docs.length} products.`);
}

fixProducts().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
