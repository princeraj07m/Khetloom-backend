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

// Simple CORS middleware - apply first
app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log('Request from origin:', origin);
  
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Origin');
  res.header('Access-Control-Allow-Credentials', 'false');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Security and performance middleware
app.use(helmet());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// CORS: More permissive configuration for production
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all localhost for development
    if (origin && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    // Allow Vercel domains
    if (origin && origin.includes('vercel.app')) {
      return callback(null, true);
    }
    
    // Allow your specific domains
    const allowedOrigins = [
      'http://localhost:4200',
      'http://localhost:3000',
      'https://khetloom-pkes.vercel.app',
      'https://khetloom-pkes.vercel.app/',
      'http://13.60.157.181:5001',
      'http://13.60.157.181'
    ];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Log for debugging
    console.log('CORS checking origin:', origin);
    return callback(null, true); // Temporarily allow all origins for debugging
  },
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));


// Handle preflight requests with explicit headers
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  console.log('OPTIONS request from origin:', origin);
  
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Origin');
  res.header('Access-Control-Allow-Credentials', 'false');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  res.status(200).end();
});

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