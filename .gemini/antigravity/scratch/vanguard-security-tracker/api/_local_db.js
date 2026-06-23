import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'local_db.json');

function readDb() {
    try {
        if (fs.existsSync(dbPath)) {
            return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        }
    } catch (e) {
        console.error("Error reading local db:", e);
    }
    return { users: {}, states: {} };
}

function writeDb(db) {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
    } catch (e) {
        console.error("Error writing local db:", e);
    }
}

export const localDb = {
    getUser: async (key) => {
        const db = readDb();
        return db.users[key] || null;
    },
    setUser: async (key, user) => {
        const db = readDb();
        db.users[key] = user;
        writeDb(db);
    },
    getState: async (key) => {
        const db = readDb();
        return db.states[key] || {};
    },
    setState: async (key, state) => {
        const db = readDb();
        db.states[key] = { ...db.states[key], ...state };
        writeDb(db);
    }
};
