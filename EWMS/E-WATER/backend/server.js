// ── EWMS Backend — server entry point ──
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({ origin: '*' })); // tighten this in production
app.use(express.json());

// Routes — each file handles one domain
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/meters',   require('./routes/meters'));
app.use('/api/bills',    require('./routes/bills'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin',    require('./routes/admin'));

// Health check — used by Docker healthcheck
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`EWMS server running on port ${PORT}`));
