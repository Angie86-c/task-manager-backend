const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../taskmanager.db');
let db;

function connectDB() {
  try {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    createTables();
    console.log('✅ Connected to SQLite database');
    return Promise.resolve(db);
  } catch (err) {
    console.error('❌ DB connection error:', err.message);
    return Promise.reject(err);
  }
}

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS Users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      email      TEXT    NOT NULL UNIQUE,
      password   TEXT    NOT NULL,
      created_at TEXT    DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS Tasks (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
      title       TEXT    NOT NULL,
      description TEXT    DEFAULT '',
      priority    TEXT    DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
      due_date    TEXT,
      completed   INTEGER DEFAULT 0,
      created_at  TEXT    DEFAULT (datetime('now')),
      updated_at  TEXT    DEFAULT (datetime('now'))
    );
  `);

  console.log('✅ Tables ready');
}

function getDB() {
  if (!db) throw new Error('Database not initialised');
  return db;
}

module.exports = { connectDB, getDB };