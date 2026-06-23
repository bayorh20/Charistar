import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'local_db.json');
const isServerless = !!process.env.VERCEL;
const bucket = 'vanguard_theft_tracker_db_5824';

// Local file DB operations
function readLocalDb() {
    try {
        if (fs.existsSync(dbPath)) {
            return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        }
    } catch (e) {}
    return { users: {}, states: {} };
}

function writeLocalDb(db) {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
    } catch (e) {}
}

// Remote public REST KV operations (fallback for Vercel without environment variables)
async function readRemoteKey(key) {
    try {
        const res = await fetch(`https://kvdb.io/${bucket}/${encodeURIComponent(key)}`);
        if (res.status === 404) return null;
        const text = await res.text();
        return JSON.parse(text);
    } catch (e) {
        console.error(`Error reading key ${key} from remote KV:`, e);
    }
    return null;
}

async function writeRemoteKey(key, value) {
    try {
        await fetch(`https://kvdb.io/${bucket}/${encodeURIComponent(key)}`, {
            method: 'POST',
            body: JSON.stringify(value)
        });
    } catch (e) {
        console.error(`Error writing key ${key} to remote KV:`, e);
    }
}

export const localDb = {
    getUser: async (key) => {
        if (isServerless) {
            return await readRemoteKey(key);
        }
        const db = readLocalDb();
        return db.users[key] || null;
    },
    setUser: async (key, user) => {
        if (isServerless) {
            await writeRemoteKey(key, user);
            return;
        }
        const db = readLocalDb();
        db.users[key] = user;
        writeLocalDb(db);
    },
    getState: async (key) => {
        if (isServerless) {
            const data = await readRemoteKey(key);
            return data || {};
        }
        const db = readLocalDb();
        return db.states[key] || {};
    },
    setState: async (key, state) => {
        if (isServerless) {
            const current = (await readRemoteKey(key)) || {};
            await writeRemoteKey(key, { ...current, ...state });
            return;
        }
        const db = readLocalDb();
        db.states[key] = { ...db.states[key], ...state };
        writeLocalDb(db);
    }
};
