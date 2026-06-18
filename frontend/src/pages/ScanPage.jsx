import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { processOCR, createRecord, generateId } from '../api/recordsApi';

// ── Icons ─────────────────────────────────────────────────────────────────────
const UploadIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-ds-muted">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);
const CameraIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>
  </svg>
);

// ── Main Component ────────────────────────────────────────────────────────────

export default function ScanPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);       // blob URL for image preview
  const [selectedFile, setSelectedFile] = useState(null);
  const [ocrState, setOcrState] = useState('idle');   // idle | uploading | extracting | done | error
  const [ocrError, setOcrError] = useState('');
  const [ocrEngine, setOcrEngine] = useState('');
  const [rows, setRows] = useState([]);               // extracted rows (editable)
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  // Session metadata
  const [sessionLabel, setSessionLabel] = useState('');
  const [managerName, setManagerName] = useState('');
  const [location, setLocation] = useState('');

  const ALLOWED_TYPES = [
    'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
    'application/pdf',
  ];

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setOcrError('Unsupported file type. Please select a JPG, PNG, WebP or PDF file.');
      return;
    }
    setSelectedFile(file);
    // PDFs can't be rendered as <img>, show a blob URL only for images
    if (file.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null); // handled separately in the upload zone
    }
    setRows([]);
    setOcrState('idle');
    setOcrError('');
    setSavedCount(0);
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleExtract = async () => {
    if (!selectedFile) return;
    setOcrState('uploading');
    setOcrError('');

    try {
      setOcrState('extracting');
      const result = await processOCR(selectedFile, (progressEvent) => {
        // Upload progress available but Gemini latency dominates
        if (progressEvent.progress < 1) setOcrState('uploading');
        else setOcrState('extracting');
      });

      setOcrEngine(result.engine);
      setRows(result.records.map((r) => ({ ...r, _selected: true })));
      setOcrState('done');
    } catch (err) {
      setOcrError(err.response?.data?.error || err.message || 'OCR failed');
      setOcrState('error');
    }
  };

  const handleSave = async () => {
    const toSave = rows.filter((r) => r._selected);
    if (toSave.length === 0) return;

    setSaving(true);
    let saved = 0;
    for (const row of toSave) {
      try {
        const { _selected, ...record } = row;
        await createRecord({
          ...record,
          id: record.id || generateId(),
          sessionLabel,
          managerName,
          location,
        });
        saved++;
      } catch (err) {
        console.error('Failed to save row:', err.message);
      }
    }
    setSavedCount(saved);
    setSaving(false);

    // Navigate to dashboard after short delay
    setTimeout(() => navigate('/'), 1200);
  };

  const toggleRow = (idx) => {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, _selected: !r._selected } : r))
    );
  };

  const updateRowField = (idx, field, value) => {
    setRows((prev) =>
      prev.map((r, i) =>
        i === idx ? { ...r, data: { ...r.data, [field]: value } } : r
      )
    );
  };

  const removeRow = (idx) => {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-ds-cream font-black text-2xl leading-none">Scan New Sheet</h1>
        <p className="text-ds-muted text-sm mt-1">Upload a GRN document image to extract items via OCR</p>
      </div>

      {/* Session metadata */}
      <div className="ds-card p-4 space-y-3">
        <p className="text-ds-cream text-xs font-bold uppercase tracking-widest text-ds-gold mb-1">Session Info (Optional)</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="session-label" className="text-ds-muted text-xs font-semibold block mb-1">Session / Store</label>
            <input
              id="session-label"
              type="text"
              placeholder="e.g. Koramangala Branch"
              value={sessionLabel}
              onChange={(e) => setSessionLabel(e.target.value)}
              className="ds-input"
            />
          </div>
          <div>
            <label htmlFor="manager-name" className="text-ds-muted text-xs font-semibold block mb-1">Manager</label>
            <input
              id="manager-name"
              type="text"
              placeholder="Manager name"
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              className="ds-input"
            />
          </div>
          <div>
            <label htmlFor="location-field" className="text-ds-muted text-xs font-semibold block mb-1">Location</label>
            <input
              id="location-field"
              type="text"
              placeholder="Warehouse / location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="ds-input"
            />
          </div>
        </div>
      </div>

      {/* Upload zone */}
      <div
        id="upload-zone"
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`ds-card flex flex-col items-center justify-center gap-4 p-10 cursor-pointer transition-all duration-200 border-2 border-dashed ${
          dragOver
            ? 'border-ds-gold bg-ds-gold/5 scale-[1.01]'
            : 'border-ds-border hover:border-ds-muted'
        }`}
      >
        {/* PDF selected — show document icon */}
        {selectedFile && selectedFile.type === 'application/pdf' ? (
          <div className="flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-20 bg-ds-red/10 border border-ds-red/30 rounded-xl flex flex-col items-center justify-center gap-1">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-ds-red">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              <span className="text-ds-red text-xs font-bold">PDF</span>
            </div>
            <div className="text-center">
              <p className="text-ds-cream font-bold text-sm truncate max-w-[200px]">{selectedFile.name}</p>
              <p className="text-ds-muted text-xs mt-0.5">{(selectedFile.size / 1024).toFixed(0)} KB · Click to change</p>
            </div>
          </div>
        ) : preview ? (
          /* Image selected — show thumbnail */
          <img
            src={preview}
            alt="Document preview"
            className="max-h-48 rounded-xl object-contain border border-ds-border shadow-ds-card"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          /* Nothing selected */
          <>
            <UploadIcon />
            <div className="text-center">
              <p className="text-ds-cream font-bold text-sm">Drop file here or click to browse</p>
              <p className="text-ds-muted text-xs mt-1">JPG · PNG · WebP · <span className="text-ds-red font-semibold">PDF</span> · Max 50 MB</p>
            </div>
          </>
        )}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
        className="hidden"
        id="file-input"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        id="camera-input"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {/* Action buttons */}
      {selectedFile && ocrState === 'idle' && (
        <div className="flex gap-3 flex-wrap">
          <button
            id="extract-btn"
            onClick={handleExtract}
            className="ds-btn-primary flex-1 py-3 text-sm"
          >
            ✦ Extract Data with OCR
          </button>
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="ds-btn-ghost px-4 py-3 text-sm"
          >
            <CameraIcon /> Retake
          </button>
        </div>
      )}

      {/* Camera capture button (when no file selected) */}
      {!selectedFile && (
        <button
          id="camera-capture-btn"
          onClick={() => cameraInputRef.current?.click()}
          className="ds-btn-ghost w-full py-3 text-sm justify-center sm:hidden"
        >
          <CameraIcon /> Capture with Camera
        </button>
      )}

      {/* Processing state */}
      {(ocrState === 'uploading' || ocrState === 'extracting') && (
        <div className="ds-card p-6 flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-10 h-10 border-2 border-ds-gold border-t-transparent rounded-full animate-spin" />
          <div className="text-center">
            <p className="text-ds-cream font-bold text-sm animate-pulse-gold">
              {ocrState === 'uploading' ? 'Uploading document…' : 'Extracting data with Gemini Vision…'}
            </p>
            <p className="text-ds-muted text-xs mt-1">
              {selectedFile?.type === 'application/pdf'
                ? 'Processing all pages of PDF…'
                : 'This may take a few seconds'}
            </p>
          </div>
        </div>
      )}

      {/* OCR error */}
      {ocrState === 'error' && (
        <div className="ds-card border border-ds-red/30 p-4 flex items-start gap-3 animate-fade-in">
          <span className="text-ds-red text-lg">⚠</span>
          <div>
            <p className="text-ds-red font-bold text-sm">OCR Failed</p>
            <p className="text-ds-muted text-xs mt-1">{ocrError}</p>
          </div>
          <button onClick={() => { setOcrState('idle'); setOcrError(''); }} className="ml-auto text-ds-muted hover:text-ds-cream text-xs">Retry</button>
        </div>
      )}

      {/* Saved confirmation */}
      {savedCount > 0 && (
        <div className="ds-card border border-ds-green/30 p-4 flex items-center gap-3 animate-slide-up">
          <span className="text-ds-green text-lg">✓</span>
          <p className="text-ds-green font-bold text-sm">
            {savedCount} item{savedCount !== 1 ? 's' : ''} saved — redirecting to dashboard…
          </p>
        </div>
      )}

      {/* Extracted rows preview + edit table */}
      {ocrState === 'done' && rows.length > 0 && savedCount === 0 && (
        <div className="space-y-3 animate-slide-up">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-ds-cream font-black text-base">
                {rows.length} Item{rows.length !== 1 ? 's' : ''} Extracted
              </h2>
              <p className="text-ds-muted text-xs">
                via <span className="text-ds-gold font-semibold">{ocrEngine === 'gemini' ? 'Gemini Vision ✦' : 'Tesseract OCR'}</span> · Select rows to save
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setRows((p) => p.map((r) => ({ ...r, _selected: true })))}
                className="text-ds-green text-xs font-bold hover:opacity-75 transition-opacity"
              >
                All
              </button>
              <span className="text-ds-muted text-xs">/</span>
              <button
                onClick={() => setRows((p) => p.map((r) => ({ ...r, _selected: false })))}
                className="text-ds-muted text-xs hover:text-ds-cream transition-colors"
              >
                None
              </button>
            </div>
          </div>

          {/* Scrollable table */}
          <div className="ds-card overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-ds-border">
                  <th className="py-2.5 px-3 text-ds-muted font-semibold w-8">✓</th>
                  {['SI No', 'Description', 'HSN', 'Order Qty', 'Unit'].map((h) => (
                    <th key={h} className="py-2.5 px-3 text-ds-muted font-semibold whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                  <th className="py-2.5 px-3 w-8" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`border-b border-ds-border/50 transition-colors ${
                      row._selected ? 'bg-ds-green/5' : 'opacity-40'
                    }`}
                  >
                    <td className="py-2 px-3">
                      <button
                        id={`row-toggle-${idx}`}
                        onClick={() => toggleRow(idx)}
                        className={`w-5 h-5 rounded flex items-center justify-center border ${
                          row._selected
                            ? 'bg-ds-green border-ds-green text-ds-bg'
                            : 'border-ds-border'
                        }`}
                      >
                        {row._selected && <CheckIcon />}
                      </button>
                    </td>
                    {['SI No', 'Description', 'HSN', 'Order Qty', 'Unit'].map((field) => (
                      <td key={field} className="py-2 px-3">
                        <input
                          type="text"
                          value={row.data?.[field] || ''}
                          onChange={(e) => updateRowField(idx, field, e.target.value)}
                          className="bg-transparent text-ds-cream font-medium focus:outline-none focus:bg-ds-surface rounded px-1 py-0.5 w-full min-w-[60px]"
                          placeholder="—"
                        />
                      </td>
                    ))}
                    <td className="py-2 px-3">
                      <button
                        id={`remove-row-${idx}`}
                        onClick={() => removeRow(idx)}
                        className="text-ds-muted hover:text-ds-red transition-colors"
                      >
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Save button */}
          <button
            id="save-records-btn"
            onClick={handleSave}
            disabled={saving || rows.filter((r) => r._selected).length === 0}
            className="ds-btn-primary w-full py-3"
          >
            {saving
              ? 'Saving…'
              : `Save ${rows.filter((r) => r._selected).length} Record${rows.filter((r) => r._selected).length !== 1 ? 's' : ''} to Dashboard`}
          </button>
        </div>
      )}

      {/* Empty extraction */}
      {ocrState === 'done' && rows.length === 0 && (
        <div className="ds-card p-6 text-center animate-fade-in">
          <p className="text-ds-cream font-bold text-sm">No items detected</p>
          <p className="text-ds-muted text-xs mt-1">
            {selectedFile?.type === 'application/pdf'
              ? 'The PDF may not contain a readable GRN table. Try a clearer scan.'
              : 'The image may be blurry or not a GRN document. Try a clearer photo.'}
          </p>
          <button
            onClick={() => { setOcrState('idle'); setSelectedFile(null); setPreview(null); }}
            className="ds-btn-ghost mt-4 text-sm"
          >
            Try another file
          </button>
        </div>
      )}
    </div>
  );
}
