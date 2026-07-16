// ── Meter routes — usage data and account summary ──
const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const { Meter } = require('../models/Meter');
const { Bill }  = require('../models/Meter');

// GET /api/meters/summary — dashboard overview for logged-in user
router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const meter = await Meter.findOne({ userId: req.user.id });
    if (!meter) return res.status(404).json({ message: 'No meter linked to your account' });

    // Find any unpaid bill for this user
    const pending = await Bill.findOne({ userId: req.user.id, status: { $ne: 'paid' } })
                              .sort({ createdAt: -1 });

    res.json({
      usageThisMonth: meter.monthlyUsage.at(-1)?.usage ?? 0,
      balance:        meter.balance,
      pendingBill:    pending?.amount ?? 0,
      cardActive:     meter.isActive,
      monthlyUsage:   meter.monthlyUsage.slice(-6), // last 6 months for chart
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
