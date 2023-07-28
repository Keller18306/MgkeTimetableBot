import SQLite3 from 'better-sqlite3';
import { existsSync, readFileSync } from 'fs';

const db = new SQLite3('sqlite3.db');

if (!existsSync('sqlite3.db')) {
    db.exec(readFileSync('scheme.sqlite3', 'utf8'));
}

export default db;