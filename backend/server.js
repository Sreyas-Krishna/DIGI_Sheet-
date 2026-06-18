require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

const sheetsRouter = require('./routes/sheets');
const ocrRouter = require('./routes/ocr');

// ── App Setup ─────────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

// ── CORS ──────────────────────────────────────────────────────────────────────
// In development: allow any localhost / 127.0.0.1 port (Vite picks a free port
// each run, so hardcoding 5173 causes CORS errors when it lands on 5174 etc.)
// In production: restrict to CLIENT_ORIGIN set in .env

const LOCALHOST_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (Postman, curl, mobile apps)
      if (!origin) return cb(null, true);

      // Always allow any localhost origin in dev
      if (LOCALHOST_RE.test(origin)) return cb(null, true);

      // In production, only allow the explicit CLIENT_ORIGIN
      if (process.env.CLIENT_ORIGIN && origin === process.env.CLIENT_ORIGIN) {
        return cb(null, true);
      }

      cb(new Error(`CORS: origin "${origin}" not allowed`));
    },
    credentials: true,
  })
);

// ── Body Parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Database ──────────────────────────────────────────────────────────────────
connectDB();

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'DigiSheet Backend',
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/records', sheetsRouter);
app.use('/api/ocr', ocrRouter);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 DigiSheet Backend running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Records API:  http://localhost:${PORT}/api/records`);
  console.log(`   OCR API:      http://localhost:${PORT}/api/ocr/process\n`);
});
