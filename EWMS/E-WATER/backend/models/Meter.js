const mongoose = require('mongoose');

// ── Water Meter ──
const meterSchema = new mongoose.Schema({
  meterId:     { type: String, required: true, unique: true },
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive:    { type: Boolean, default: true },
  balance:     { type: Number, default: 0 },         // RWF balance on card
  monthlyUsage: [{                                    // last 6 months
    month: Number, year: Number, usage: Number        // usage in litres
  }],
}, { timestamps: true });

// ── Bill ──
const billSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  meterId:  { type: String, required: true },
  amount:   { type: Number, required: true },         // RWF
  month:    { type: String, required: true },         // e.g. "January"
  year:     { type: Number, required: true },
  dueDate:  { type: Date, required: true },
  status:   { type: String, enum: ['pending', 'paid', 'overdue'], default: 'pending' },
}, { timestamps: true });

// ── Payment ──
const paymentSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  billId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Bill', required: true },
  amount:   { type: Number, required: true },
  method:   { type: String, enum: ['momo', 'airtel'], required: true },
  phone:    { type: String, required: true },
  status:   { type: String, enum: ['pending', 'confirmed', 'failed'], default: 'pending' },
  reference: { type: String },                        // mobile money reference
}, { timestamps: true });

module.exports = {
  Meter:   mongoose.model('Meter',   meterSchema),
  Bill:    mongoose.model('Bill',    billSchema),
  Payment: mongoose.model('Payment', paymentSchema),
};
