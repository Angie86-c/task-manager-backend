const path = require('path');
const fs   = require('fs');

let db;

function connectDB() {
  try {
    const initSqlJs = require('sql.js');
    const dbPath    = path.join(__dirname, '../../taskmanager.db');

    return initSqlJs().then((SQL) => {
      if (fs.existsSync(dbPath)) {
        const fileBuffer = fs.readFileSync(dbPath);
        db = new SQL.Database(fileBuffer);
      } else {
        db = new SQL.Database();
      }

      // Save to disk helper
      function saveDB() {
        const data = db.export();
        fs.writeFileSync(dbPath, Buffer.from(data));
      }

      db.save = saveDB;

      createTables();
      saveDB();
      console.log('✅ Connected to SQLite database');
    });
  } catch (err) {
    console.error('❌ DB connection error:', err.message);
    return Promise.reject(err);
  }
}

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS Users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      email      TEXT    NOT NULL UNIQUE,
      password   TEXT    NOT NULL,
      created_at TEXT    DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS Tasks (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL REFERENCES Users(id),
      title       TEXT    NOT NULL,
      description TEXT    DEFAULT '',
      priority    TEXT    DEFAULT 'medium',
      due_date    TEXT,
      completed   INTEGER DEFAULT 0,
      created_at  TEXT    DEFAULT (datetime('now')),
      updated_at  TEXT    DEFAULT (datetime('now'))
    )
  `);

  console.log('✅ Tables ready');
}

function getDB() {
  if (!db) throw new Error('Database not initialised');
  return db;
}

module.exports = { connectDB, getDB };