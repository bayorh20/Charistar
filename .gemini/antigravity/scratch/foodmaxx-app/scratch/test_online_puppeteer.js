import puppeteer from 'puppeteer';
import path from 'path';

async function testUrl(url, name) {
  console.log(`\n========================================`);
  console.log(`Testing ${name} URL: ${url}`);
  console.log(`========================================`);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  page.on('console', msg => {
    console.log(`[${name} CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.log(`[${name} PAGE ERROR]: ${err.toString()}`);
  });
  
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
    console.log("Navigation completed. Waiting 4 seconds for any async processes...");
    await new Promise(r => setTimeout(r, 4000));
    
    const title = await page.title();
    console.log("Page Title:", title);
    
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log("Body text snippet (first 300 chars):\n", bodyText.substring(0, 300));
    
    const screenshotPath = `c:\\Users\\Quickprint\\.gemini\\antigravity\\scratch\\foodmaxx-app\\scratch\\${name}_screenshot.png`;
    await page.screenshot({ path: screenshotPath });
    console.log(`Saved screenshot to ${screenshotPath}`);
  } catch (e) {
    console.log("Error during test:", e.message);
  } finally {
    await browser.close();
  }
}

async function run() {
  await testUrl('https://foodmaxx.vercel.app', 'CustomerApp');
  await testUrl('https://foodmaxx-admin.vercel.app', 'AdminApp');
  console.log("Done.");
}

run().catch(console.error);
