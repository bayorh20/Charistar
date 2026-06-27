import puppeteer from 'puppeteer';
import path from 'path';

async function run() {
  console.log("Launching headless browser...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Set viewport to desktop size to see the mockup frame
  await page.setViewport({ width: 1200, height: 900 });
  
  // Capture console logs
  page.on('console', msg => {
    console.log(`[CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.log(`[PAGE ERROR]: ${err.toString()}`);
  });
  
  console.log("Navigating to http://localhost:5174/ ...");
  try {
    await page.goto('http://localhost:5174/', { waitUntil: 'networkidle2', timeout: 15000 });
  } catch (e) {
    console.log("Navigation error:", e.message);
  }
  
  console.log("Waiting 3.5 seconds to bypass splash screen...");
  await new Promise(r => setTimeout(r, 3500));
  
  // Print page title and body text snippet
  console.log("Page Title:", await page.title());
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log("Body text snippet:\n", bodyText.substring(0, 500));

  // Save screenshot to artifacts directory
  const screenshotPath = 'C:\\Users\\Quickprint\\.gemini\\antigravity\\brain\\8bc7e38d-384d-48d4-bfc0-22e38e53d9b2\\app_screenshot.png';
  console.log("Saving screenshot to:", screenshotPath);
  await page.screenshot({ path: screenshotPath });
  
  await browser.close();
  console.log("Done.");
}

run().catch(console.error);
