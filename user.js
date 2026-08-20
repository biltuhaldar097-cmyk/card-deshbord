const db = require('./db');

const User = {
  findById(id) {
    return db.prepare('SELECT id, username, email, login, provider, created_at FROM users WHERE id = ?').get(id);
  },
  findByLogin(login) {
    return db.prepare('SELECT * FROM users WHERE lower(login) = lower(?) OR lower(email) = lower(?) OR lower(username) = lower(?)').get(login, login, login);
  },
  findByGoogleSub(sub) {
    return db.prepare('SELECT * FROM users WHERE google_sub = ?').get(sub);
  },
  createLocal({ username, email, login, passwordHash }) {
    const info = db.prepare(`INSERT INTO users(username,email,login,password_hash,provider)
      VALUES(?,?,?,?, 'local')`).run(username, email || null, login, passwordHash);
    return this.findById(info.lastInsertRowid);
  },
  createGoogle({ username, email, sub }) {
    const info = db.prepare(`INSERT INTO users(username,email,login,password_hash,provider,google_sub)
      VALUES(?,?,?,NULL,'google',?)`).run(username, email, email.toLowerCase(), sub);
    return this.findById(info.lastInsertRowid);
  }
};

module.exports = User;
