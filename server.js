const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/authRoutes');
const dataRoutes = require('./routes/dataRoutes');

// Load environment variables
dotenv.config();

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5001;


// Security and performance middleware
app.use(helmet());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// CORS: universally permissive (no origin restriction, no credentials)
app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));


// Handle preflight requests
app.options('*', cors());

// Rate limiter for API
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 });
app.use('/api', limiter);

app.use(express.json({ limit: '1mb' }));

// Simple healthcheck for uptime checks and debugging
app.get('/api/health', (req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || 'development', time: new Date().toISOString() });
});

// Liveness/readiness/version
app.get('/api/live', (_req, res) => res.status(200).send('OK'));
app.get('/api/ready', (_req, res) => {
  const state = mongoose.connection.readyState; // 1 connected
  res.status(state === 1 ? 200 : 503).json({ dbConnected: state === 1 });
});
app.get('/api/version', (_req, res) => res.json({ version: process.env.APP_VERSION || '1.0.0' }));

// Routes
app.use('/api', authRoutes);
app.use('/api', dataRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Farmer Registration API is running!' });
});

// Serve Angular app in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'frontend', 'dist', 'Dashboard', 'browser');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start HTTP server immediately so port is reachable, connect DB in background
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});

// MongoDB connection (non-fatal on failure)
if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET is not set. JWT operations may fail. Set JWT_SECRET in .env');
}
if (!process.env.MONGODB_URI) {
  console.error('ERROR: MONGODB_URI is not set. Set MONGODB_URI in .env');
}
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((error) => {
  console.error('MongoDB connection error (server still running):', error.message || error);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

module.exports = app;