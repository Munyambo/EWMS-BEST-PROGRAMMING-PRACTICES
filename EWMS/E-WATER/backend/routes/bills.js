// ── Bills routes ──
const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const { Bill } = require('../models/Meter');

// GET /api/bills/my-bills
router.get('/my-bills', authMiddleware, async (req, res) => {
  try {
    const bills = await Bill.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(bills);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
