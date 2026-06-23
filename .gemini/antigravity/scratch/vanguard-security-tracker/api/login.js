import { kv } from '@vercel/kv';
import crypto from 'crypto';
import { localDb } from './_local_db.js';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).end('Method Not Allowed');
        return;
    }

    const { email, password } = req.body || {};

    if (!email || !password) {
        res.status(400).end('Please fill in all fields.');
        return;
    }

    const emailClean = email.trim().toLowerCase();
    const useKV = !!process.env.KV_REST_API_URL;

    try {
        const userKey = `vanguard:user:${emailClean}`;
        
        let userJson = null;
        if (useKV) {
            userJson = await kv.get(userKey);
        } else {
            userJson = await localDb.getUser(userKey);
        }

        // Parse user if found in string format
        let user = null;
        if (userJson) {
            user = typeof userJson === 'string' ? JSON.parse(userJson) : userJson;
        }


        if (!user || !user.hash || !user.salt) {
            res.status(400).end('Invalid email or password.');
            return;
        }

        // Verify password
        const checkHash = crypto.pbkdf2Sync(password, user.salt, 1000, 64, 'sha512').toString('hex');

        if (checkHash !== user.hash) {
            res.status(400).end('Invalid email or password.');
            return;
        }

        // Set secure cookie for state sync
        const host = req.headers.host || '';
        const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
        const cookieString = `vg_email=${encodeURIComponent(emailClean)}; Path=/; HttpOnly; SameSite=Lax; ${isLocal ? '' : 'Secure;'}`;
        res.setHeader('Set-Cookie', cookieString);

        res.status(200).json({
            success: true,
            user: {
                name: user.name,
                email: user.email,
                uid: emailClean
            }
        });
    } catch (e) {
        console.error('Login error:', e);
        res.status(500).end('Internal Server Error');
    }
}
