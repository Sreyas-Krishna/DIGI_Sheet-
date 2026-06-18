const mongoose = require('mongoose');

/**
 * Sheet schema — enriched superset of the original Flutter Record model.
 *
 * Core fields are kept identical to the Flutter app for data compatibility:
 *   id, data, isChecked, receivedQty, status, scannedAt, isArchived
 *
 * New web-only fields:
 *   sessionLabel — free-text session/store name (e.g. "Koramangala Branch")
 *   location     — store/warehouse location identifier
 *   managerName  — manager or operator name for audit trail
 *   notes        — freeform notes attached to the record
 */
const sheetSchema = new mongoose.Schema(
  {
    // Client-generated string ID (preserved from Flutter for compatibility)
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Dynamic key-value pairs from OCR extraction:
    //   "SI No", "Description", "HSN", "Order Qty", "Unit"
    data: {
      type: Map,
      of: String,
      default: {},
    },

    // Verification state
    isChecked: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Physical count entered by the operator
    receivedQty: {
      type: Number,
      default: 0,
    },

    // Status after verification
    // "saved"   → received qty matches order qty (or confirmed full)
    // "caution" → received qty differs from order qty
    // "missing" → received qty is 0
    status: {
      type: String,
      enum: ['saved', 'caution', 'missing'],
      default: 'saved',
    },

    // Timestamp of when the document was scanned / record created
    scannedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // Soft-delete flag (archive instead of permanent delete)
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },

    // ── Web-only enrichment fields ──────────────────────────────────────────

    // Logical grouping label (e.g. store branch, shift, PO number)
    sessionLabel: {
      type: String,
      default: '',
      trim: true,
    },

    // Physical location / store code
    location: {
      type: String,
      default: '',
      trim: true,
    },

    // Manager / operator name for audit trail
    managerName: {
      type: String,
      default: '',
      trim: true,
    },

    // Freeform notes
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    // Adds createdAt + updatedAt automatically
    timestamps: true,
  }
);

// Text index for full-text search across description and notes
sheetSchema.index({ 'data.Description': 'text', notes: 'text', sessionLabel: 'text' });

module.exports = mongoose.model('Sheet', sheetSchema);
