# DigiSheet 🧾

A MERN stack web app that replicates the core functionality of **Star Scan** — a Flutter mobile app for GRN document scanning and digital log management.

## Project Structure

```
DigiSheet/
├── backend/           ← Node.js + Express + MongoDB
│   ├── config/db.js
│   ├── controllers/
│   │   ├── sheetsController.js
│   │   └── ocrController.js
│   ├── middleware/errorHandler.js
│   ├── models/Sheet.js
│   ├── routes/
│   │   ├── sheets.js
│   │   └── ocr.js
│   ├── server.js
│   └── .env           ← Copy from .env.example and fill in credentials
│
└── frontend/          ← Vite + React + Tailwind CSS
    ├── src/
    │   ├── api/recordsApi.js
    │   ├── components/
    │   │   ├── EmptyState.jsx
    │   │   ├── Navbar.jsx
    │   │   ├── QtyModal.jsx
    │   │   ├── RecordCard.jsx
    │   │   ├── StatsBar.jsx
    │   │   └── StatusBadge.jsx
    │   └── pages/
    │       ├── Dashboard.jsx
    │       └── ScanPage.jsx
    └── index.html
```

## Quick Start

### 1. Backend

```bash
cd backend
cp .env.example .env  # Fill in MONGO_URI and GEMINI_API_KEY
npm install
npm run dev           # Starts on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev           # Starts on http://localhost:5173
```

## API Reference

| Method | Endpoint                  | Description                    |
|--------|---------------------------|--------------------------------|
| GET    | `/api/records`            | Fetch all active records       |
| POST   | `/api/records`            | Create a new record            |
| PUT    | `/api/records/:id`        | Update a record by client ID   |
| DELETE | `/api/records/:id`        | Hard delete a record           |
| POST   | `/api/records/archive`    | Soft-delete all active records |
| GET    | `/api/records/export/csv` | Download all records as CSV    |
| POST   | `/api/ocr/process`        | Upload image and extract rows  |
| GET    | `/health`                 | Health check                   |

## OCR Strategy

- **Primary**: Gemini Vision API (same prompt as the Flutter app)
- **Fallback**: Tesseract.js (local, offline — kicks in if Gemini key is absent or API returns an error)

## Migrating from Star Scan

The MongoDB schema is fully compatible with the existing `DIGI_Sheet_Backend` records.  
The `id` field on each record is the client-generated string UUID from Flutter, so existing data continues to work.
