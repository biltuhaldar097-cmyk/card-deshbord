const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../user');
const { requireUser } = require('../middleware/auth');

const router = express.Router();
const google = new OAuth2Client();

function userToken(user) {
  return jwt.sign({ sub: user.id, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '30d' });
}
function publicUser(user) {
  return { id: user.id, username: user.username, email: user.email || '', provider: user.provider };
}

router.post('/signup', async (req, res) => {
  try {
    const username = String(req.body.username || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const login = (email || username).toLowerCase();

    if (username.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email' });
    if (await User.findByLogin(login)) return res.status(409).json({ error: 'Account already exists' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.createLocal({ username, email, login, passwordHash });
    res.status(201).json({ token: userToken(user), user: publicUser(user) });
  } catch (e) {
    if (e?.code === 11000) {
      const field =
        Object.keys(e.keyPattern || {})[0] ||
        Object.keys(e.keyValue || {})[0] ||
        'account';

      if (field === 'email' || field === 'login') {
        return res.status(409).json({ error: 'This email/account already exists. Please sign in instead.' });
      }

      // Username collisions should normally be avoided automatically by user.js.
      return res.status(409).json({ error: `Account field already exists: ${field}` });
    }

    console.error('Signup error:', e);
    res.status(500).json({ error: 'Could not create account' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const identifier = String(req.body.identifier || '').trim();
    const password = String(req.body.password || '');
    const user = await User.findByLogin(identifier);
    if (!user) return res.status(401).json({ error: 'Username or email not found' });
    if (!user.password_hash) return res.status(401).json({ error: 'Use Google sign-in for this account' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Incorrect password' });
    res.json({ token: userToken(user), user: publicUser(user) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/google', async (req, res) => {
  try {
    const credential = String(req.body.credential || '');
    if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).json({ error: 'Google sign-in is not configured on the server' });
    const ticket = await google.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
    const p = ticket.getPayload();
    if (!p?.sub || !p?.email || !p.email_verified) return res.status(401).json({ error: 'Google account could not be verified' });

    let user = await User.findByGoogleSub(p.sub);
    if (!user) user = await User.findByLogin(p.email);
    if (!user) user = await User.createGoogle({ username: p.name || p.email.split('@')[0], email: p.email.toLowerCase(), sub: p.sub });

    res.json({ token: userToken(user), user: publicUser(user) });
  } catch (e) {
    console.error(e);
    res.status(401).json({ error: 'Google sign-in failed' });
  }
});

router.get('/me', requireUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.sub);
    if (!user) return res.status(404).json({ error: 'Account not found' });
    res.json({ user: publicUser(user) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not load account' });
  }
});

module.exports = router;
