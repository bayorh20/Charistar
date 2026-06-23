import { kv } from '@vercel/kv';
import { localDb } from './_local_db.js';


export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Determine if we should use Vercel KV
    const useKV = !!process.env.KV_REST_API_URL;

    // Helper to parse cookies
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

    // Support custom header or query parameter for email (essential for mobile/Capacitor apps)
    if (!email && req.headers['x-user-email']) {
        email = req.headers['x-user-email'];
    }
    if (!email && req.query && req.query.email) {
        email = req.query.email;
    }

    if (!email) {
        res.status(401).json({ error: 'Unauthorized. Please log in.' });
        return;
    }

    // Determine state storage key (partition by deviceId if available, fallback to user email)
    const deviceId = req.query.deviceId;
    const redisKey = deviceId ? `vanguard:state:device:${deviceId}` : `vanguard:state:user:${email}`;

    if (req.method === 'POST') {
        const data = req.body || {};

        // Check if vg_user is in the payload to establish or clear the email session
        if ('vg_user' in data) {
            const vgUser = data['vg_user'];
            if (vgUser && vgUser !== 'null') {
                try {
                    const userObj = JSON.parse(vgUser);
                    if (userObj && userObj.email) {
                        email = userObj.email;
                        // Set cookie for subsequent GET requests (omit Secure on localhost for HTTP testing)
                        const host = req.headers.host || '';
                        const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
                        const cookieString = `vg_email=${encodeURIComponent(email)}; Path=/; HttpOnly; SameSite=Lax; ${isLocal ? '' : 'Secure;'}`;
                        res.setHeader('Set-Cookie', cookieString);
                    }
                } catch (e) {
                    console.error('Failed to parse vg_user:', e);
                }
            } else {
                // User logged out, clear cookie
                res.setHeader('Set-Cookie', 'vg_email=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
            }
        }

        // Clean data: remove vg_user to avoid authentication bloating in state store
        const stateToSave = { ...data };
        delete stateToSave['vg_user'];

        if (Object.keys(stateToSave).length > 0) {
            if (useKV) {
                await kv.hset(redisKey, stateToSave);
            } else {
                await localDb.setState(redisKey, stateToSave);
            }
        }

        res.status(200).json({ success: true });
        return;
    }

    if (req.method === 'GET') {
        let state = {};
        if (useKV) {
            state = (await kv.hgetall(redisKey)) || {};
        } else {
            state = await localDb.getState(redisKey);
        }

        res.status(200).json(state);
        return;
    }

    res.status(405).end('Method Not Allowed');
}
