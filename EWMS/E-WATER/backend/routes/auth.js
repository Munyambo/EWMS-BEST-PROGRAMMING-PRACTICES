// ── Auth routes: register / login / admin-login ──
const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const { User, Admin } = require('../models/User');
const { Meter } = require('../models/Meter');

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, meterId, password } = req.body;

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // isVerified = true — skip OTP for prototype
    const user = await User.create({
      name, email, phone, meterId,
      passwordHash: password,
      isVerified: true,
    });

    await Meter.create({
      meterId,
      userId: user._id,
      isActive: true,
      balance: 0,
      monthlyUsage: [],
    });

    res.status(201).json({ message: 'Account created successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !await user.comparePassword(password)) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account suspended. Contact WASAC.' });
    }

    const token = signToken({ id: user._id, role: 'user', email: user.email });

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/admin-login
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin || !await admin.comparePassword(password)) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const token = signToken({ id: admin._id, role: 'admin', email: admin.email });

    res.json({
      token,
      user: { id: admin._id, name: admin.name, email: admin.email, role: 'admin' },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
