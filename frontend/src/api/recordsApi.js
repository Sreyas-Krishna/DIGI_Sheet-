import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000, // 60s for OCR requests
});

// ── Records ───────────────────────────────────────────────────────────────────

export const fetchRecords = (params = {}) =>
  api.get('/records', { params }).then((r) => r.data);

export const createRecord = (record) =>
  api.post('/records', record).then((r) => r.data);

export const updateRecord = (id, data) =>
  api.put(`/records/${id}`, data).then((r) => r.data);

export const deleteRecord = (id) =>
  api.delete(`/records/${id}`).then((r) => r.data);

export const archiveAll = () =>
  api.post('/records/archive').then((r) => r.data);

export const exportCSVUrl = () => '/api/records/export/csv';

// ── OCR ───────────────────────────────────────────────────────────────────────

/**
 * Send an image File object to the OCR endpoint.
 * Returns { engine, count, records[] }
 */
export const processOCR = (imageFile, onUploadProgress) => {
  const form = new FormData();
  form.append('image', imageFile);
  return api
    .post('/ocr/process', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    })
    .then((r) => r.data);
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export const generateId = () =>
  `web_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
