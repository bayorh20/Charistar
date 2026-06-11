import puppeteer from 'puppeteer';

async function run() {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.log(`[BROWSER PAGE ERROR]: ${err.toString()}`);
  });
  
  console.log("Navigating to http://localhost:5173/ ...");
  try {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 10000 });
  } catch (e) {
    console.log("Navigation timeout/error:", e.message);
  }
  
  // Wait another 3 seconds for Firestore snapshot to arrive
  console.log("Waiting 4 seconds for Firestore snapshots...");
  await new Promise(r => setTimeout(r, 4000));
  
  // Get products text or empty state
  const html = await page.content();
  console.log("\n=== Page Title ===");
  console.log(await page.title());
  
  console.log("\n=== Checking for empty state text ===");
  const hasEmptyText = await page.evaluate(() => {
    return document.body.innerText.includes("No products found") || document.body.innerText.includes("No products configured");
  });
  console.log("Has empty text:", hasEmptyText);
  
  console.log("\n=== Body Inner Text Snippet ===");
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log(bodyText.substring(0, 1000));
  
  await browser.close();
  console.log("Browser closed.");
}

run().catch(console.error);
