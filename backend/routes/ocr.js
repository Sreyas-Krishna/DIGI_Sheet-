const express = require('express');
const router = express.Router();
const multer = require('multer');
const { processImage } = require('../controllers/ocrController');

// Store uploaded files in memory (buffer) — no disk writes needed
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max (PDFs can be large)
  fileFilter: (req, file, cb) => {
    const allowed = [
      // Images
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
      // PDF — Gemini 1.5 Flash handles PDFs natively
      'application/pdf',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Supported: JPG, PNG, WebP, HEIC, PDF`));
    }
  },
});

// POST /api/ocr/process  — accepts multipart/form-data with field name "image"
// (field name kept as "image" for frontend compatibility; accepts PDFs too)
router.post('/process', upload.single('image'), processImage);

module.exports = router;
