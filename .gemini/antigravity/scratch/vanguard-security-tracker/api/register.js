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

    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
        res.status(400).end('Please provide name, email, and password.');
        return;
    }

    const emailClean = email.trim().toLowerCase();
    const useKV = !!process.env.KV_REST_API_URL;

    try {
        const userKey = `vanguard:user:${emailClean}`;
        
        // Check if user exists
        let existingUser = null;
        if (useKV) {
            existingUser = await kv.get(userKey);
        } else {
            existingUser = await localDb.getUser(userKey);
        }

        if (existingUser) {
            res.status(400).end('User already exists with this email.');
            return;
        }

        // Hash password securely
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

        const newUser = {
            name: name.trim(),
            email: emailClean,
            salt,
            hash,
            createdAt: new Date().toISOString()
        };

        if (useKV) {
            await kv.set(userKey, JSON.stringify(newUser));
        } else {
            await localDb.setUser(userKey, newUser);
        }


        res.status(200).json({
            success: true,
            user: {
                name: newUser.name,
                email: newUser.email,
                uid: emailClean
            }
        });
    } catch (e) {
        console.error('Registration error:', e);
        res.status(500).end('Internal Server Error');
    }
}
