// ── Admin routes ──
const router = require('express').Router();
const { adminMiddleware } = require('../middleware/auth');
const { User }  = require('../models/User');
const { Meter, Bill } = require('../models/Meter');

// GET /api/admin/stats
router.get('/stats', adminMiddleware, async (req, res) => {
  try {
    const [totalUsers, activeMeters, unpaidBills, disconnected] = await Promise.all([
      User.countDocuments(),
      Meter.countDocuments({ isActive: true }),
      Bill.countDocuments({ status: { $ne: 'paid' } }),
      User.countDocuments({ isActive: false }),
    ]);
    res.json({ totalUsers, activeMeters, unpaidBills, disconnected });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/users
router.get('/users', adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash -otpCode').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/add-client — admin creates a homeowner account
router.post('/add-client', adminMiddleware, async (req, res) => {
  try {
    const { name, email, phone, meterId, password, balance } = req.body;

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create user — auto verified since admin is adding them
    const user = await User.create({
      name, email, phone, meterId,
      passwordHash: password,
      isVerified: true,
      isActive:   true,
    });

    // Create their meter automatically
    await Meter.create({
      meterId,
      userId:       user._id,
      isActive:     true,
      balance:      balance || 0,
      monthlyUsage: [],
    });

    res.status(201).json({ message: 'Client added', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/create-bill — create a bill for a client
router.post('/create-bill', adminMiddleware, async (req, res) => {
  try {
    const { userId, meterId, month, year, amount, dueDate } = req.body;

    const bill = await Bill.create({
      userId, meterId, month, year, amount,
      dueDate: new Date(dueDate),
      status: 'pending',
    });

    res.status(201).json({ message: 'Bill created', bill });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/add-reading — add a meter reading for a client
router.post('/add-reading', adminMiddleware, async (req, res) => {
  try {
    const { meterId, month, year, usage, balance } = req.body;

    const meter = await Meter.findOne({ meterId });
    if (!meter) return res.status(404).json({ message: 'Meter not found for this client' });

    // Remove existing entry for same month/year if it exists, then add new one
    meter.monthlyUsage = meter.monthlyUsage.filter(u => !(u.month === month && u.year === year));
    meter.monthlyUsage.push({ month, year, usage });

    if (balance !== undefined) meter.balance = balance;

    await meter.save();
    res.json({ message: 'Meter reading saved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/bills — all bills with client name
router.get('/bills', adminMiddleware, async (req, res) => {
  try {
    const bills = await Bill.find().populate('userId', 'name email').sort({ createdAt: -1 });
    res.json(bills);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/meters — all meters with client name
router.get('/meters', adminMiddleware, async (req, res) => {
  try {
    const meters = await Meter.find().populate('userId', 'name email').sort({ createdAt: -1 });
    res.json(meters);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/admin/bills/:id/mark-paid
router.patch('/bills/:id/mark-paid', adminMiddleware, async (req, res) => {
  try {
    const bill = await Bill.findByIdAndUpdate(req.params.id, { status: 'paid' }, { new: true });
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    res.json({ message: 'Bill marked as paid' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/admin/users/:id/toggle — disconnect or reconnect
router.patch('/users/:id/toggle', adminMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id, { isActive: req.body.isActive }, { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    await Meter.findOneAndUpdate({ userId: user._id }, { isActive: req.body.isActive });
    res.json({ message: `Account ${req.body.isActive ? 'reconnected' : 'disconnected'}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
