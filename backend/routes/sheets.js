const express = require('express');
const router = express.Router();
const {
  getAllSheets,
  createSheet,
  updateSheet,
  deleteSheet,
  archiveAll,
  exportCSV,
} = require('../controllers/sheetsController');

// CSV export (must come BEFORE /:id to avoid route collision)
router.get('/export/csv', exportCSV);

// Archive all active records
router.post('/archive', archiveAll);

// CRUD
router.get('/', getAllSheets);
router.post('/', createSheet);
router.put('/:id', updateSheet);
router.delete('/:id', deleteSheet);

module.exports = router;
