const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Request = require('../models/Request');
const SoldCard = require('../models/SoldCard');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const supplied = Buffer.from(String(req.body.password || ''));
  const expected = Buffer.from(String(process.env.ADMIN_PASSWORD || ''));
  if (!expected.length || supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
    return res.status(401).json({ error: 'Incorrect admin password' });
  }
  const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

router.get('/requests', requireAdmin, async (req, res) => {
  try {
    const rows = await Request.find({})
      .sort({ createdAt: -1 })
      .limit(500)
      .populate('userId', 'username email')
      .lean();

    res.json({
      requests: rows.map(r => ({
        id: r.requestId,
        rowId: r.rowId,
        brand: r.brand,
        num: r.cardNum,
        price: r.price,
        balance: r.balance,
        status: r.status,
        createdAt: r.createdAt,
        username: r.userId?.username || '',
        email: r.userId?.email || ''
      }))
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not load requests' });
  }
});

router.patch('/requests/:id', requireAdmin, async (req, res) => {
  const decision = req.body.decision;
  if (!['Approved', 'Rejected'].includes(decision)) {
    return res.status(400).json({ error: 'Decision must be Approved or Rejected' });
  }

  try {
    const row = await Request.findOne({ requestId: req.params.id });
    if (!row) return res.status(404).json({ error: 'Request not found' });
    if (row.status !== 'Pending') return res.status(409).json({ error: `Request is already ${row.status}` });

    if (decision === 'Approved') {
      try {
        await SoldCard.create({ rowId: row.rowId, requestId: row.requestId });
      } catch (e) {
        if (e?.code === 11000) return res.status(409).json({ error: 'This item was already approved for another request' });
        throw e;
      }
    }

    row.status = decision;
    await row.save();
    res.json({ ok: true, decision, rowId: row.rowId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not update request' });
  }
});

module.exports = router;
