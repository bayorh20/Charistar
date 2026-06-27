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

  const testUrl = 'http://localhost:5173/#/login';
  console.log(`Navigating to ${testUrl} ...`);
  try {
    await page.goto(testUrl, { timeout: 8000 });
  } catch (e) {
    console.log("Navigation timeout/warning (continuing anyway):", e.message);
  }

  console.log("Wait for page to render (5s)...");
  await new Promise(r => setTimeout(r, 5000));

  // Let's attempt login
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
    if (menuLink) menuLink.click();
  });

  await new Promise(r => setTimeout(r, 3000));
  console.log("URL on Menu page:", page.url());

  // Click Categories tab
  console.log("Clicking Categories tab...");
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const catTab = tabs.find(t => t.innerText && t.innerText.includes('Categories'));
    if (catTab) {
      catTab.click();
      console.log("Clicked Categories tab");
    } else {
      console.log("Could not find Categories tab");
    }
  });

  await new Promise(r => setTimeout(r, 2000));

  // Select the first category and click edit button
  console.log("Clicking Edit on first category...");
  await page.evaluate(() => {
    const editButtons = Array.from(document.querySelectorAll('button'));
    // Find edit button (which has svg inside, or we can look for edit icon wrapper)
    const editBtn = editButtons.find(btn => btn.innerHTML && btn.innerHTML.includes('svg'));
    if (editBtn) {
      editBtn.click();
      console.log("Clicked Edit Category button");
    } else {
      console.log("Could not find Edit Category button");
    }
  });

  await new Promise(r => setTimeout(r, 2000));

  // Modify image to a small base64 mock image data URL
  console.log("Injecting base64 image data...");
  const mockBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  await page.evaluate((img) => {
    // Find image input field
    const imageInput = Array.from(document.querySelectorAll('input')).find(input => input.placeholder && input.placeholder.includes('Paste Image URL'));
    if (imageInput) {
      imageInput.value = img;
      // Trigger react onChange
      imageInput.dispatchEvent(new Event('input', { bubbles: true }));
      console.log("Set Category Image to mock base64");
    } else {
      console.log("Could not find Category Image input");
    }
  }, mockBase64);

  // Submit Category Form
  console.log("Submitting category form...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const submitBtn = buttons.find(btn => btn.innerText && btn.innerText.includes('Update Category'));
    if (submitBtn) {
      submitBtn.click();
      console.log("Clicked Update Category button");
    } else {
      console.log("Could not find Update Category button");
    }
  });

  await new Promise(r => setTimeout(r, 6000));

  console.log("Taking screenshot of result...");
  await page.screenshot({ path: path.join(__dirname, 'admin_category_screenshot.png') });

  await browser.close();
  console.log("E2E Category Test finished.");
}

run().catch(console.error);
