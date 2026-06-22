const fs = require('fs');
let html = fs.readFileSync('./www/index.html', 'utf8');

// Find the passcode overlay block and extract it
const pinStart = html.indexOf('            <!-- PIN DISARM INPUT');
if (pinStart === -1) { console.log('PIN block not found - may already be moved'); process.exit(0); }

// Find end of the passcode-overlay div
const overlayStart = html.indexOf('<div class="passcode-overlay"', pinStart);
// Count div depth to find closing tag
let depth = 0;
let i = overlayStart;
let overlayEnd = -1;
while (i < html.length) {
  if (html.slice(i, i+4) === '<div') depth++;
  else if (html.slice(i, i+6) === '</div>') {
    depth--;
    if (depth === 0) { overlayEnd = i + 6; break; }
  }
  i++;
}
if (overlayEnd === -1) { console.log('Could not find end of overlay'); process.exit(1); }

const passcodeBlock = '\n' + html.substring(overlayStart, overlayEnd).trim() + '\n';
// Remove comment + block from original location
html = html.substring(0, pinStart) + html.substring(overlayEnd);

// Insert right before </body>
html = html.replace('</body>', passcodeBlock + '\n</body>');

fs.writeFileSync('./www/index.html', html);
console.log('Done. Passcode overlay moved to body level.');
console.log('Overlay block length:', passcodeBlock.length);
