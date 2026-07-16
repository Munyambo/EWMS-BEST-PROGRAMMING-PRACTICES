const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ── Homeowner model ──
const userSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true },
  phone:        { type: String, required: true },
  passwordHash: { type: String, required: true },
  meterId:      { type: String, required: true },
  isActive:     { type: Boolean, default: true },
  isVerified:   { type: Boolean, default: false }, // OTP verified
  otpCode:      { type: String },                  // temporary OTP store
  otpExpires:   { type: Date },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  next();
});

// Compare plain password against stored hash
userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

// ── Admin model ──
const adminSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  email:        { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role:         { type: String, default: 'admin' },
}, { timestamps: true });

adminSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  next();
});

adminSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

module.exports = {
  User:  mongoose.model('User',  userSchema),
  Admin: mongoose.model('Admin', adminSchema),
};
