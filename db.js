const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'data', 'app.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  email TEXT,
  login TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  provider TEXT NOT NULL DEFAULT 'local',
  google_sub TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique
ON users(lower(email)) WHERE email IS NOT NULL AND email <> '';

CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  row_id INTEGER NOT NULL,
  brand TEXT NOT NULL,
  card_num TEXT NOT NULL,
  price INTEGER NOT NULL,
  balance INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','Approved','Rejected')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_requests_user_created
ON requests(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS sold_cards (
  row_id INTEGER PRIMARY KEY,
  request_id TEXT NOT NULL UNIQUE,
  approved_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(request_id) REFERENCES requests(id) ON DELETE CASCADE
);
`);

module.exports = db;
