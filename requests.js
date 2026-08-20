const express = require('express');
const Request = require('../models/Request');
const SoldCard = require('../models/SoldCard');
const { requireUser } = require('../middleware/auth');

const router = express.Router();

function toPublicRequest(r) {
  return {
    id: r.requestId,
    rowId: r.rowId,
    brand: r.brand,
    num: r.cardNum,
    price: r.price,
    balance: r.balance,
    status: r.status,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt
  };
}

router.get('/history', requireUser, async (req, res) => {
  try {
    const rows = await Request.find({ userId: req.user.sub }).sort({ createdAt: -1 }).lean();
    res.json({ history: rows.map(toPublicRequest) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not load history' });
  }
});

router.post('/requests', requireUser, async (req, res) => {
  try {
    const rowId = Number(req.body.rowId);
    const brand = String(req.body.brand || '').slice(0, 30);
    const num = String(req.body.num || '').slice(0, 80);
    const price = Number(req.body.price);
    const balance = Number(req.body.balance || 0);

    if (!Number.isInteger(rowId) || !brand || !num || !Number.isFinite(price)) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    if (await SoldCard.exists({ rowId })) return res.status(409).json({ error: 'This item is no longer available' });
    if (await Request.exists({ userId: req.user.sub, rowId, status: 'Pending' })) {
      return res.status(409).json({ error: 'You already have a pending request for this item' });
    }

    const requestId = `REQ-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const created = await Request.create({
      requestId,
      userId: req.user.sub,
      rowId,
      brand,
      cardNum: num,
      price: Math.round(price),
      balance: Math.round(balance),
      status: 'Pending'
    });

    res.status(201).json({ request: toPublicRequest(created) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not submit request' });
  }
});

router.get('/cards/sold', async (req, res) => {
  try {
    const rows = await SoldCard.find({}, { rowId: 1, _id: 0 }).sort({ rowId: 1 }).lean();
    res.json({ soldIds: rows.map(r => r.rowId) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not load sold items' });
  }
});

module.exports = router;
