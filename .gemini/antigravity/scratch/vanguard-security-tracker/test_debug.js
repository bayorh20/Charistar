const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));

  // Click the settings nav button to trigger passcode
  console.log("Clicking nav settings...");
  await page.evaluate(() => {
    document.querySelector('[data-screen="screen-settings"]').click();
  });
  await new Promise(r => setTimeout(r, 800));

  // Get info about the passcode overlay and buttons
  const info = await page.evaluate(() => {
    const overlay = document.getElementById('passcode-overlay');
    const btn1 = document.querySelector('.num-btn[data-val="1"]');
    const overlayRect = overlay ? overlay.getBoundingClientRect() : null;
    const btnRect = btn1 ? btn1.getBoundingClientRect() : null;
    const overlayStyle = overlay ? window.getComputedStyle(overlay) : null;
    const btnStyle = btn1 ? window.getComputedStyle(btn1) : null;
    
    // Check what element is at the button's center
    let topElement = null;
    if (btnRect) {
      const cx = btnRect.left + btnRect.width / 2;
      const cy = btnRect.top + btnRect.height / 2;
      const el = document.elementFromPoint(cx, cy);
      topElement = el ? el.tagName + '.' + el.className + ' id=' + el.id : 'none';
    }
    
    return {
      overlayDisplay: overlayStyle ? overlayStyle.display : 'N/A',
      overlayPosition: overlayStyle ? overlayStyle.position : 'N/A',
      overlayZIndex: overlayStyle ? overlayStyle.zIndex : 'N/A',
      overlayVisible: overlayStyle ? overlayStyle.visibility : 'N/A',
      overlayRect: overlayRect ? {top: overlayRect.top, left: overlayRect.left, width: overlayRect.width, height: overlayRect.height} : null,
      overlayHasActiveClass: overlay ? overlay.classList.contains('active') : false,
      btnExists: !!btn1,
      btnRect: btnRect ? {top: btnRect.top, left: btnRect.left, width: btnRect.width, height: btnRect.height} : null,
      btnPointerEvents: btnStyle ? btnStyle.pointerEvents : 'N/A',
      btnDisplay: btnStyle ? btnStyle.display : 'N/A',
      btnZIndex: btnStyle ? btnStyle.zIndex : 'N/A',
      topElementAtBtn: topElement,
    };
  });
  
  console.log(JSON.stringify(info, null, 2));

  // Check for JS errors
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  
  await browser.close();
})().catch(err => { console.error('ERROR:', err.message); process.exit(1); });
