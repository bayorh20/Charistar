const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

    // Open settings to trigger passcode
    console.log("Clicking settings...");
    await page.click('#nav-btn-settings');
    await page.waitForTimeout(500);

    // Check if passcode overlay is visible
    const isVisible = await page.evaluate(() => {
        const el = document.getElementById('passcode-overlay');
        return el && window.getComputedStyle(el).display !== 'none';
    });
    console.log("Passcode overlay visible:", isVisible);

    // Click button '1'
    console.log("Clicking '1'...");
    await page.evaluate(() => {
        document.querySelector('.num-btn[data-val="1"]').click();
    });
    
    await page.waitForTimeout(100);

    // Check if dot is filled
    const dotsFilled = await page.evaluate(() => {
        return document.querySelectorAll('.pin-dots .dot.filled').length;
    });
    console.log("Dots filled:", dotsFilled);

    await browser.close();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
