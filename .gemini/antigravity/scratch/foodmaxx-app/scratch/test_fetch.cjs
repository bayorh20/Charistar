const http = require('http');

const urls = [
  'http://localhost:5173/',
  'http://127.0.0.1:5173/',
  'http://[::1]:5173/',
  'http://localhost:5174/',
  'http://127.0.0.1:5174/',
  'http://[::1]:5174/',
  'http://localhost:5175/',
  'http://127.0.0.1:5175/',
  'http://[::1]:5175/'
];

function testUrl(url) {
  return new Promise((resolve) => {
    console.log(`Testing ${url} ...`);
    const req = http.get(url, { timeout: 2000 }, (res) => {
      console.log(`  -> SUCCESS! Status: ${res.statusCode}`);
      resolve(true);
    });
    req.on('error', (err) => {
      console.log(`  -> FAILED: ${err.message}`);
      resolve(false);
    });
    req.on('timeout', () => {
      console.log(`  -> TIMEOUT`);
      req.destroy();
      resolve(false);
    });
  });
}

async function run() {
  for (const url of urls) {
    await testUrl(url);
  }
}

run();
