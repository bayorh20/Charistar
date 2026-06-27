const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const possibleChromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Users\\Quickprint\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Users\\Quickprint\\AppData\\Local\\Local\\Google\\Chrome\\Application\\chrome.exe'
];

let executablePath = null;
for (const p of possibleChromePaths) {
  if (fs.existsSync(p)) {
    executablePath = p;
    break;
  }
}

if (!executablePath) {
  console.error("Error: Could not find chrome.exe");
  process.exit(1);
}

async function run() {
  console.log("Launching headless browser...");
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 900 });

  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.log(`[BROWSER PAGE ERROR]: ${err.toString()}`);
  });

  const testUrl = 'http://[::1]:5174/#/login';
  console.log(`Navigating to ${testUrl} ...`);
  try {
    await page.goto(testUrl, { timeout: 8000 });
  } catch (e) {
    console.log("Navigation timeout/warning (continuing anyway):", e.message);
  }

  console.log("Wait for page to render (5s)...");
  await new Promise(r => setTimeout(r, 5000));

  console.log("Page Title:", await page.title());

  // Let's attempt login
  console.log("Waiting for email input selector...");
  try {
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
  } catch (e) {
    console.log("Error waiting for selector:", e.message);
    const bodyHTML = await page.evaluate(() => document.body.innerHTML);
    console.log("Body HTML content:", bodyHTML);
    await page.screenshot({ path: path.join(__dirname, 'admin_error_screenshot.png') });
    await browser.close();
    process.exit(1);
  }

  console.log("Typing login credentials...");
  await page.type('input[type="email"]', 'admin@foodmaxx.com');
  await page.type('input[type="password"]', 'admin123');

  console.log("Submitting login form...");
  await page.click('button[type="submit"]');

  await new Promise(r => setTimeout(r, 4000));

  console.log("URL after login:", page.url());

  // Click on the Menu tab/link
  console.log("Navigating to menu page...");
  await page.evaluate(() => {
    const sidebarLinks = Array.from(document.querySelectorAll('a, button, div, span'));
    const menuLink = sidebarLinks.find(el => el.innerText && el.innerText.trim() === 'Menu');
    if (menuLink) {
      menuLink.click();
      console.log("Clicked Menu link");
    } else {
      console.log("Could not find Menu link, finding by text content containing 'Menu'");
      const menuLink2 = sidebarLinks.find(el => el.innerText && el.innerText.includes('Menu'));
      if (menuLink2) {
        menuLink2.click();
        console.log("Clicked Menu link (partial match)");
      } else {
        console.log("Really could not find Menu link");
      }
    }
  });

  await new Promise(r => setTimeout(r, 3000));
  console.log("URL on Menu page:", page.url());

  // Click "Add Menu Item"
  console.log("Clicking Add Menu Item button...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const addBtn = buttons.find(btn => btn.innerText && btn.innerText.includes('Add Menu Item'));
    if (addBtn) {
      addBtn.click();
      console.log("Clicked Add Menu Item");
    } else {
      console.log("Could not find Add Menu Item button");
    }
  });

  await new Promise(r => setTimeout(r, 2000));

  // Fill in form details
  console.log("Filling in form...");
  await page.type('input[placeholder*="Smoky Ibadan Jollof"]', 'Test Product');
  await page.type('textarea[placeholder*="Describe ingredients"]', 'Delicious test product description');
  
  // Clear default price if any and type
  await page.evaluate(() => {
    const priceInput = Array.from(document.querySelectorAll('input')).find(input => input.placeholder === '4500');
    if (priceInput) {
      priceInput.value = '';
    }
  });
  await page.type('input[placeholder="4500"]', '1500');

  // Submit form
  console.log("Submitting form...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const submitBtn = buttons.find(btn => btn.innerText && btn.innerText.includes('Publish Item'));
    if (submitBtn) {
      submitBtn.click();
      console.log("Clicked Publish Item button");
    } else {
      console.log("Could not find Publish Item button");
    }
  });

  await new Promise(r => setTimeout(r, 5500));

  console.log("Taking screenshot of result...");
  await page.screenshot({ path: path.join(__dirname, 'admin_save_screenshot.png') });

  await browser.close();
  console.log("E2E Test finished.");
}

run().catch(console.error);
