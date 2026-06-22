const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-web-security'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });

  // Capture all console output including errors
  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => consoleLogs.push(`[PAGE_ERROR] ${err.message}`));

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));

  // --- Deep diagnostic ---
  const diag = await page.evaluate(() => {
    // 1. Check how many num-btns exist in DOM RIGHT NOW
    const allNumBtns = document.querySelectorAll('.num-btn[data-val]');
    
    // 2. Check if overlay exists
    const overlay = document.getElementById('passcode-overlay');
    
    // 3. Check pinDots
    const pinDots = document.querySelectorAll('.pin-dots .dot');

    // 4. Check appState (if accessible)
    let correctPin = 'UNKNOWN';
    try { correctPin = window._appStateDebug ? window._appStateDebug.correctPin : 'not exposed'; } catch(e){}

    // 5. Try manually opening the overlay
    if (overlay) overlay.classList.add('active');
    
    return {
      numBtnsFoundNow: allNumBtns.length,
      overlayExists: !!overlay,
      overlayInBody: overlay ? overlay.parentElement.tagName : 'N/A',
      pinDotsFound: pinDots.length,
      overlayActiveNow: overlay ? overlay.classList.contains('active') : false,
      scriptPosition: (() => {
        const scripts = Array.from(document.querySelectorAll('script'));
        const appScript = scripts.find(s => s.src && s.src.includes('app.js'));
        if (!appScript) return 'NOT FOUND';
        const overlay2 = document.getElementById('passcode-overlay');
        if (!overlay2) return 'OVERLAY NOT FOUND';
        const pos = appScript.compareDocumentPosition(overlay2);
        // 4 = DOCUMENT_POSITION_FOLLOWING (overlay comes after script)
        // 2 = DOCUMENT_POSITION_PRECEDING (overlay comes before script)
        return pos & 4 ? 'OVERLAY IS AFTER SCRIPT TAG (BUG!)' : 'OVERLAY IS BEFORE SCRIPT TAG (OK)';
      })()
    };
  });
  
  console.log('=== DEEP DIAGNOSTIC ===');
  console.log(JSON.stringify(diag, null, 2));
  
  // 6. Now try clicking a button
  await new Promise(r => setTimeout(r, 500));
  
  const clickResult = await page.evaluate(() => {
    const btn1 = document.querySelector('.num-btn[data-val="1"]');
    if (!btn1) return { error: 'button not found' };
    
    // Fire all relevant events
    btn1.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    btn1.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    btn1.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    
    return {
      buttonFound: true,
      dotsFilledAfterClick: document.querySelectorAll('.pin-dots .dot.filled').length,
      enteredPinInState: 'check appState'
    };
  });
  
  console.log('=== CLICK RESULT ===');
  console.log(JSON.stringify(clickResult, null, 2));
  
  console.log('=== CONSOLE LOGS ===');
  consoleLogs.forEach(l => console.log(l));
  
  await browser.close();
})().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
