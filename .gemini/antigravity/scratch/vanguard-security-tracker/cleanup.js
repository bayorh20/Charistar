const fs = require('fs');
let html = fs.readFileSync('./www/index.html', 'utf8');

const marker1 = '<div class="settings-tabs">';
const marker2 = '<!-- OWNER REMOTE LOCKDOWN SCREEN OVERLAY -->';

const orphanStart = html.indexOf(marker1);
const orphanEnd = html.indexOf(marker2);

if (orphanStart !== -1 && orphanEnd !== -1) {
    html = html.substring(0, orphanStart) + '\n\n        ' + html.substring(orphanEnd);
    fs.writeFileSync('./www/index.html', html);
    console.log('Removed orphaned old settings HTML. New length:', html.length);
} else {
    console.log('Could not find markers. Start:', orphanStart, 'End:', orphanEnd);
}
