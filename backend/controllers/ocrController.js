const fetch = require('node-fetch');
const { createWorker } = require('tesseract.js');
const { asyncHandler } = require('../middleware/errorHandler');

// ── Gemini Vision extraction (mirrors Flutter's GeminiService.extractRows) ───

const GEMINI_PROMPT = `You are an expert data extraction assistant. I am providing a document (image or PDF) of a Goods Receipt Note (GRN) datasheet.
Please extract ALL tabular rows of items across ALL pages.
Return ONLY a valid JSON array of objects. Do not include markdown codeblocks like \`\`\`json.
Each object must have exactly these keys (and format values as strings):
"SI No"
"Description"
"HSN"
"Order Qty"
"Unit"

CRITICAL INSTRUCTION: Do NOT hallucinate or guess items. If a row is illegible, skip it. If the entire document is illegible, return an empty array []. Only extract actual product line items — ignore headers, footers, totals, and summary rows.
Process every page of the document.`;

async function extractWithGemini(imageBuffer, mimeType = 'image/jpeg', modelOverride) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  // Model priority: argument override > env var > stable default
  const primaryModel = modelOverride || process.env.GEMINI_MODEL || 'gemini-2.0-flash';

  // Fallback chain — all confirmed available on this API key
  // Builds a deduplicated list so we don't retry the same model twice
  const allModels = [primaryModel, 'gemini-2.5-flash', 'gemini-2.0-flash'];
  const modelsToTry = [...new Set(allModels)];

  const base64Image = imageBuffer.toString('base64');

  const payload = {
    contents: [
      {
        parts: [
          { text: GEMINI_PROMPT },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Image,
            },
          },
        ],
      },
    ],
  };

  // 1 retry per model — with 3 models in the chain that's still 3 total attempts
  // and avoids a 12-second wait on a single overloaded model
  const MAX_RETRIES = 1;

  let lastError = null;

  for (const model of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    console.log(`🤖 Trying Gemini model: ${model}`);

    try {
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errBody = await response.text();
          const isRetryable = response.status === 503 || response.status === 429;

          if (isRetryable && attempt < MAX_RETRIES) {
            const delay = 2000 * (attempt + 1);
            console.warn(`⚠️ Gemini ${model} returned ${response.status} — retrying in ${delay / 1000}s (attempt ${attempt + 1}/${MAX_RETRIES})`);
            await new Promise((r) => setTimeout(r, delay));
            continue;
          }

          throw new Error(`Gemini API error ${response.status}: ${errBody}`);
        }

        const json = await response.json();
        let text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        text = text.trim();

        // Strip markdown code fences if Gemini wraps the response
        if (text.startsWith('```')) {
          const firstNewline = text.indexOf('\n');
          if (firstNewline !== -1) text = text.slice(firstNewline + 1);
          const lastFence = text.lastIndexOf('```');
          if (lastFence !== -1) text = text.slice(0, lastFence);
        }
        text = text.trim();

        if (!text || text === '[]') return [];

        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) throw new Error('Gemini returned non-array JSON');

        console.log(`✅ Gemini (${model}) succeeded`);
        return parsed;
      }
    } catch (err) {
      console.warn(`⚠️ Model ${model} failed: ${err.message}`);
      lastError = err;
      // Continue to next model in the outer loop
    }
  }

  throw new Error(lastError ? lastError.message : 'All Gemini models are currently unavailable. Please try again in a moment.');
}

// ── Tesseract.js fallback (local, offline) ────────────────────────────────────

async function extractWithTesseract(imageBuffer) {
  console.log('🔄 Using Tesseract.js OCR fallback...');
  const worker = await createWorker('eng');

  const { data } = await worker.recognize(imageBuffer);
  await worker.terminate();

  const rawText = data.text || '';
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

  // Heuristic: find lines that look like table rows (contain numbers / multiple columns)
  const rows = [];
  let counter = 0;
  for (const line of lines) {
    const parts = line.split(/\s{2,}|\t/); // split on 2+ spaces or tabs
    if (parts.length >= 3) {
      rows.push({
        'SI No': String(++counter),
        Description: parts[0] || '',
        HSN: parts[1] || '',
        'Order Qty': parts[2] || '',
        Unit: parts[3] || '',
      });
    }
  }

  return rows;
}

// ── POST /api/ocr/process ─────────────────────────────────────────────────────
const processImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded. Please attach an image (JPG/PNG/WebP) or PDF.');
  }

  const isPDF = req.file.mimetype === 'application/pdf';
  console.log(`📄 Processing ${isPDF ? 'PDF' : 'image'}: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`);

  const { buffer, mimetype } = req.file;

  let rows = [];
  let engine = 'gemini';

  try {
    rows = await extractWithGemini(buffer, mimetype);
    console.log(`✅ Gemini extracted ${rows.length} row(s)`);
  } catch (geminiErr) {
    console.warn(`⚠️ Gemini failed (${geminiErr.message})`);

    // PDFs cannot be processed by Tesseract (it only handles images)
    if (isPDF) {
      throw new Error(`Gemini OCR failed for PDF: ${geminiErr.message}. Ensure your GEMINI_API_KEY is valid.`);
    }

    console.warn('Falling back to Tesseract for image...');
    engine = 'tesseract';
    try {
      rows = await extractWithTesseract(buffer);
      console.log(`✅ Tesseract extracted ${rows.length} row(s)`);
    } catch (tessErr) {
      console.error(`❌ Tesseract also failed: ${tessErr.message}`);
      throw new Error('OCR processing failed with both engines');
    }
  }

  // Normalise & deduplicate
  const now = Date.now();
  const records = rows
    .filter((r) => r.Description && r.Description.trim() !== '')
    .map((r, i) => ({
      id: `web_${now}_${i}_${(r['SI No'] || '').hashCode || Math.random().toString(36).slice(2, 5)}`,
      data: {
        'SI No': String(r['SI No'] || ''),
        Description: String(r['Description'] || ''),
        HSN: String(r['HSN'] || ''),
        'Order Qty': String(r['Order Qty'] || ''),
        Unit: String(r['Unit'] || ''),
      },
      isChecked: false,
      receivedQty: 0,
      status: 'saved',
      scannedAt: new Date().toISOString(),
    }));

  res.json({
    engine,
    count: records.length,
    records,
  });
});

module.exports = { processImage };
