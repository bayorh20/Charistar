const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  content = content.replace(/ loading="lazy"/g, '');
  content = content.replace(/ decoding="async"/g, '');
  
  content = content.replace(/<img /g, '<img loading="lazy" decoding="async" ');

  if (file.includes('HeroSlider.jsx')) {
    content = content.replace(/<video\s/g, '<video fetchpriority="high" disablePictureInPicture ');
    content = content.replace(/fetchpriority="high" fetchpriority="high"/g, 'fetchpriority="high"');
    content = content.replace(/disablePictureInPicture disablePictureInPicture/g, 'disablePictureInPicture');
  }

  if (content !== original) {
    fs.writeFileSync(file, content);
  }
});
console.log('Optimized all images and video!');
