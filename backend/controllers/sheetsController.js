const Sheet = require('../models/Sheet');
const { asyncHandler } = require('../middleware/errorHandler');
const { stringify } = require('csv-stringify/sync');

// ── GET /api/records ─────────────────────────────────────────────────────────
// Returns all non-archived records, supports ?search= query param
const getAllSheets = asyncHandler(async (req, res) => {
  const { search, session, status } = req.query;

  const filter = { isArchived: { $ne: true } };

  if (session) filter.sessionLabel = { $regex: session, $options: 'i' };
  if (status && ['saved', 'caution', 'missing'].includes(status)) filter.status = status;

  let records = await Sheet.find(filter).sort({ scannedAt: -1 });

  // Client-side search across data fields (Map fields not indexed for regex in MongoDB Atlas free tier)
  if (search) {
    const q = search.toLowerCase();
    records = records.filter((r) => {
      const desc = (r.data.get('Description') || '').toLowerCase();
      const hsn = (r.data.get('HSN') || '').toLowerCase();
      const si = (r.data.get('SI No') || '').toLowerCase();
      const label = (r.sessionLabel || '').toLowerCase();
      return desc.includes(q) || hsn.includes(q) || si.includes(q) || label.includes(q);
    });
  }

  res.json(records);
});

// ── POST /api/records ────────────────────────────────────────────────────────
// Create a new sheet record
const createSheet = asyncHandler(async (req, res) => {
  const body = req.body;

  // Ensure a client-side id is present; generate one if missing
  if (!body.id) {
    body.id = `web_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  }

  const newSheet = new Sheet(body);
  await newSheet.save();

  res.status(201).json(newSheet);
});

// ── PUT /api/records/:id ─────────────────────────────────────────────────────
// Update a record by its client-generated string id
const updateSheet = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Prevent overwriting immutable fields
  delete updateData._id;
  delete updateData.id;
  delete updateData.createdAt;

  const updated = await Sheet.findOneAndUpdate(
    { id },
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!updated) {
    res.status(404);
    throw new Error(`Record with id "${id}" not found`);
  }

  res.json(updated);
});

// ── DELETE /api/records/:id ──────────────────────────────────────────────────
// Hard delete a single record
const deleteSheet = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deleted = await Sheet.findOneAndDelete({ id });

  if (!deleted) {
    res.status(404);
    throw new Error(`Record with id "${id}" not found`);
  }

  res.json({ message: 'Record deleted', id });
});

// ── POST /api/records/archive ────────────────────────────────────────────────
// Soft-delete all active (non-archived) records
const archiveAll = asyncHandler(async (req, res) => {
  const result = await Sheet.updateMany(
    { isArchived: { $ne: true } },
    { $set: { isArchived: true } }
  );

  res.json({
    message: 'All active records archived',
    modifiedCount: result.modifiedCount,
  });
});

// ── GET /api/records/export/csv ───────────────────────────────────────────────
// Export all non-archived records as a CSV download
const exportCSV = asyncHandler(async (req, res) => {
  const records = await Sheet.find({ isArchived: { $ne: true } }).sort({ scannedAt: -1 });

  if (records.length === 0) {
    res.status(404);
    throw new Error('No records to export');
  }

  const rows = records.map((r) => ({
    'SI No': r.data.get('SI No') || '',
    Description: r.data.get('Description') || '',
    HSN: r.data.get('HSN') || '',
    'Order Qty': r.data.get('Order Qty') || '',
    Unit: r.data.get('Unit') || '',
    'Received Qty': r.receivedQty,
    Status: r.status,
    Checked: r.isChecked ? 'Yes' : 'No',
    Session: r.sessionLabel || '',
    Location: r.location || '',
    Manager: r.managerName || '',
    'Scanned At': new Date(r.scannedAt).toLocaleString(),
  }));

  const csv = stringify(rows, { header: true });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="digisheet_export_${Date.now()}.csv"`
  );
  res.send(csv);
});

module.exports = {
  getAllSheets,
  createSheet,
  updateSheet,
  deleteSheet,
  archiveAll,
  exportCSV,
};
