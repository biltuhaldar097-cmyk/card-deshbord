const jwt = require('jsonwebtoken');

function readBearer(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

function requireUser(req, res, next) {
  try {
    const token = readBearer(req);
    if (!token) return res.status(401).json({ error: 'Login required' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== 'user') return res.status(403).json({ error: 'User access required' });
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Session expired or invalid' });
  }
}

function requireAdmin(req, res, next) {
  try {
    const token = readBearer(req);
    if (!token) return res.status(401).json({ error: 'Admin login required' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    req.admin = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Admin session expired or invalid' });
  }
}

module.exports = { requireUser, requireAdmin };
