// ── Seed script — run once to set up test data ──
// Usage: node seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const { User, Admin } = require('./models/User');
const { Meter, Bill } = require('./models/Meter');

const MONTHS = ['January','February','March','April','May','June'];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ewms');
  console.log('Connected. Seeding…');

  // Clear existing data
  await Promise.all([User.deleteMany(), Admin.deleteMany(), Meter.deleteMany(), Bill.deleteMany()]);

  // Create admin account
  const admin = await Admin.create({
    name: 'Alvin Munyambo',
    email: 'admin@wasac.rw',
    passwordHash: 'Admin12345!',
  });
  console.log('Admin created:', admin.email);

  // Create a test homeowner
  const user = await User.create({
    name:         'Alvin MUNYAMBO',
    email:        'munyambo04@gmail.com',
    phone:        '+250781384024',
    meterId:      'WASAC-2025-33445',
    passwordHash: 'Test1234!',
    isVerified:   true,
    isActive:     true,
  });
  console.log('User created:', user.email);

  // Create meter with 6 months of usage
  await Meter.create({
    meterId:  'WASAC-2024-00001',
    userId:   user._id,
    isActive: true,
    balance:  12500,
    monthlyUsage: MONTHS.map((_, i) => ({
      month: i + 1,
      year:  2025,
      usage: Math.floor(1200 + Math.random() * 1800), // random litres
    })),
  });

  // Create 3 bills
  const now = new Date();
  await Bill.insertMany([
    { userId: user._id, meterId: 'WASAC-2024-00001', amount: 4500,  month: 'April',   year: 2025, dueDate: new Date('2025-04-30'), status: 'paid' },
    { userId: user._id, meterId: 'WASAC-2024-00001', amount: 5200,  month: 'May',     year: 2025, dueDate: new Date('2025-05-31'), status: 'paid' },
    { userId: user._id, meterId: 'WASAC-2024-00001', amount: 6100,  month: 'June',    year: 2025, dueDate: new Date('2025-06-30'), status: 'pending' },
  ]);

  console.log('Seed complete ✓');
  console.log('\nTest credentials:');
  console.log('  Homeowner → munyambo04@gmail.com / Test1234!');
  console.log('  Admin     → admin@wasac.rw / Admin12345!');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
