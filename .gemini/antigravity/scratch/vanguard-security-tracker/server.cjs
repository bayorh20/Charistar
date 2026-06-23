const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dbPath = path.join(__dirname, 'local_db.json');

function readDb() {
    try {
        if (fs.existsSync(dbPath)) {
            return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        }
    } catch (e) {}
    return { users: {}, states: {} };
}

function writeDb(db) {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
    } catch (e) {}
}

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie, x-user-email');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        return res.end();
    }

    // ─── API: REGISTER ──────────────────────────────────
    if (req.url === '/api/register' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const { name, email, password } = JSON.parse(body);
                if (!name || !email || !password) {
                    res.writeHead(400, { 'Content-Type': 'text/plain' });
                    return res.end('Please provide name, email, and password.');
                }
                const emailClean = email.trim().toLowerCase();
                const userKey = `vanguard:user:${emailClean}`;
                
                const db = readDb();
                if (db.users[userKey]) {
                    res.writeHead(400, { 'Content-Type': 'text/plain' });
                    return res.end('User already exists with this email.');
                }

                const salt = crypto.randomBytes(16).toString('hex');
                const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

                const newUser = {
                    name: name.trim(),
                    email: emailClean,
                    salt,
                    hash,
                    createdAt: new Date().toISOString()
                };

                db.users[userKey] = newUser;
                writeDb(db);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    user: {
                        name: newUser.name,
                        email: newUser.email,
                        uid: emailClean
                    }
                }));
            } catch (e) {
                res.writeHead(400);
                res.end('Bad Request');
            }
        });
        return;
    }

    // ─── API: LOGIN ─────────────────────────────────────
    if (req.url === '/api/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const { email, password } = JSON.parse(body);
                if (!email || !password) {
                    res.writeHead(400, { 'Content-Type': 'text/plain' });
                    return res.end('Please fill in all fields.');
                }
                const emailClean = email.trim().toLowerCase();
                const userKey = `vanguard:user:${emailClean}`;
                
                const db = readDb();
                const user = db.users[userKey];

                if (!user || !user.hash || !user.salt) {
                    res.writeHead(400, { 'Content-Type': 'text/plain' });
                    return res.end('Invalid email or password.');
                }

                const checkHash = crypto.pbkdf2Sync(password, user.salt, 1000, 64, 'sha512').toString('hex');
                if (checkHash !== user.hash) {
                    res.writeHead(400, { 'Content-Type': 'text/plain' });
                    return res.end('Invalid email or password.');
                }

                const cookieString = `vg_email=${encodeURIComponent(emailClean)}; Path=/; HttpOnly; SameSite=Lax`;
                res.setHeader('Set-Cookie', cookieString);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    user: {
                        name: user.name,
                        email: user.email,
                        uid: emailClean
                    }
                }));
            } catch (e) {
                res.writeHead(400);
                res.end('Bad Request');
            }
        });
        return;
    }

    // ─── API: SYNC ──────────────────────────────────────
    if (req.url.startsWith('/api/sync')) {
        const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        
        const cookies = {};
        if (req.headers.cookie) {
            req.headers.cookie.split(';').forEach(cookie => {
                const parts = cookie.split('=');
                if (parts[0]) {
                    cookies[parts[0].trim()] = parts.slice(1).join('=').trim();
                }
            });
        }

        let email = cookies['vg_email'] ? decodeURIComponent(cookies['vg_email']) : null;
        if (!email && req.headers['x-user-email']) {
            email = req.headers['x-user-email'];
        }
        if (!email) {
            email = urlObj.searchParams.get('email');
        }

        if (!email) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Unauthorized. Please log in.' }));
        }

        const deviceId = urlObj.searchParams.get('deviceId');
        const redisKey = deviceId ? `vanguard:state:device:${deviceId}` : `vanguard:state:user:${email}`;

        if (req.method === 'GET') {
            const db = readDb();
            const state = db.states[redisKey] || {};
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify(state));
        }

        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    
                    if ('vg_user' in data) {
                        const vgUser = data['vg_user'];
                        if (vgUser && vgUser !== 'null') {
                            try {
                                const userObj = JSON.parse(vgUser);
                                if (userObj && userObj.email) {
                                    email = userObj.email;
                                    const cookieString = `vg_email=${encodeURIComponent(email)}; Path=/; HttpOnly; SameSite=Lax`;
                                    res.setHeader('Set-Cookie', cookieString);
                                }
                            } catch (e) {}
                        } else {
                            res.setHeader('Set-Cookie', 'vg_email=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
                        }
                    }

                    const stateToSave = { ...data };
                    delete stateToSave['vg_user'];

                    if (Object.keys(stateToSave).length > 0) {
                        const db = readDb();
                        db.states[redisKey] = { ...db.states[redisKey], ...stateToSave };
                        writeDb(db);
                    }

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true }));
                } catch (e) {
                    res.writeHead(400);
                    res.end('Bad Request');
                }
            });
            return;
        }
        return;
    }

    // Serve static files from www
    let filePath = path.join(__dirname, 'www', req.url === '/' ? 'index.html' : req.url.split('?')[0]);
    
    try {
        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
            filePath = path.join(filePath, 'index.html');
        }
    } catch(e) {}

    const extname = path.extname(filePath);
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('Not Found');
            } else {
                res.writeHead(500);
                res.end('Server Error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Live sync and full authentic API routes active.`);
});
