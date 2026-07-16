// ── Payments routes ──
const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const { Bill, Payment } = require('../models/Meter');

// POST /api/payments/pay
router.post('/pay', authMiddleware, async (req, res) => {
  try {
    const { billId, method, phone } = req.body;
    const bill = await Bill.findById(billId);

    if (!bill)                  return res.status(404).json({ message: 'Bill not found' });
    if (bill.status === 'paid') return res.status(400).json({ message: 'Bill already paid' });

    const payment = await Payment.create({
      userId: req.user.id, billId, amount: bill.amount, method, phone,
      reference: 'EWMS-' + Date.now(),
      status: 'confirmed',
    });

    bill.status = 'paid';
    await bill.save();

    res.json({ message: 'Payment confirmed', reference: payment.reference });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
