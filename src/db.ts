import SQLite3 from 'better-sqlite3'
import { existsSync, readFileSync } from 'fs'

const exists = existsSync('sqlite3.db')

const db = new SQLite3('sqlite3.db')

if (!exists) db.exec(readFileSync('scheme.sqlite3', 'utf8'))

export default db