import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchRecords,
  updateRecord,
  archiveAll,
  exportCSVUrl,
} from '../api/recordsApi';
import StatsBar from '../components/StatsBar';
import RecordCard from '../components/RecordCard';
import StatusBadge, { FieldBadge } from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';

// ── Icons ────────────────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-ds-muted">
    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
  </svg>
);
const ScanIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/><path d="M14 17h4v4"/><path d="M18 14h2"/>
  </svg>
);
const ArchiveIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
  </svg>
);
const ExportIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

// ── Component ────────────────────────────────────────────────────────────────

const TABS = ['Pending', 'Completed'];

export default function Dashboard() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');
  const [archiving, setArchiving] = useState(false);
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const [toast, setToast] = useState(null); // { msg, type }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadRecords = useCallback(async () => {
    try {
      const data = await fetchRecords();
      setRecords(data);
    } catch (err) {
      showToast('Failed to load records: ' + (err.response?.data?.error || err.message), 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Filter helpers
  const q = search.toLowerCase();
  const filterFn = (r) => {
    if (!q) return true;
    const desc = (r.data?.Description || r.data?.['Description'] || '').toLowerCase();
    const hsn = (r.data?.HSN || r.data?.['HSN'] || '').toLowerCase();
    const si = (r.data?.['SI No'] || '').toLowerCase();
    const label = (r.sessionLabel || '').toLowerCase();
    return desc.includes(q) || hsn.includes(q) || si.includes(q) || label.includes(q);
  };

  const pending = records.filter((r) => !r.isChecked).filter(filterFn);
  const completed = records.filter((r) => r.isChecked).filter(filterFn);
  const total = records.length;

  // Archive handler
  const handleArchive = async () => {
    setArchiving(true);
    try {
      const result = await archiveAll();
      showToast(`${result.modifiedCount} records archived`);
      setArchiveConfirm(false);
      loadRecords();
    } catch {
      showToast('Archive failed', 'error');
    } finally {
      setArchiving(false);
    }
  };

  // Move completed back to pending
  const handleUncheck = async (record) => {
    await updateRecord(record.id, { isChecked: false, status: 'saved' });
    loadRecords();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-ds-card animate-slide-up ${
            toast.type === 'error'
              ? 'bg-ds-red/90 text-white'
              : 'bg-ds-green/90 text-ds-bg'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-ds-cream font-black text-2xl leading-none">Dashboard</h1>
          <p className="text-ds-muted text-sm mt-1">
            {total} record{total !== 1 ? 's' : ''} in session
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Export CSV */}
          <a
            id="export-csv-btn"
            href={exportCSVUrl()}
            download
            className="ds-btn-ghost text-xs px-3 py-1.5"
          >
            <ExportIcon /> Export CSV
          </a>

          {/* Archive */}
          {archiveConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-ds-muted text-xs">Archive all?</span>
              <button
                id="archive-confirm-yes"
                onClick={handleArchive}
                disabled={archiving}
                className="ds-btn-danger text-xs px-3 py-1.5"
              >
                {archiving ? '…' : 'Yes'}
              </button>
              <button onClick={() => setArchiveConfirm(false)} className="text-ds-muted text-xs">Cancel</button>
            </div>
          ) : (
            <button
              id="archive-all-btn"
              onClick={() => setArchiveConfirm(true)}
              className="ds-btn-ghost text-xs px-3 py-1.5"
            >
              <ArchiveIcon /> Archive All
            </button>
          )}

          {/* Scan CTA */}
          <Link to="/scan" id="scan-new-btn" className="ds-btn-primary text-xs px-4 py-2">
            <ScanIcon /> Scan Sheet
          </Link>
        </div>
      </div>

      {/* Stats bar */}
      <StatsBar
        pending={records.filter((r) => !r.isChecked).length}
        completed={records.filter((r) => r.isChecked).length}
        total={total}
      />

      {/* Search */}
      <div className="ds-inset flex items-center gap-2 px-3 py-2">
        <SearchIcon />
        <input
          id="search-input"
          type="text"
          placeholder="Search by description, HSN, SI No…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-ds-cream placeholder-ds-muted text-sm font-medium focus:outline-none"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-ds-muted hover:text-ds-cream text-xs">✕</button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-ds-surface rounded-xl p-1 border border-ds-border">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            id={`tab-${tab.toLowerCase()}`}
            onClick={() => setActiveTab(i)}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === i
                ? 'bg-ds-bg text-ds-cream shadow-ds-card'
                : 'text-ds-muted hover:text-ds-cream'
            }`}
          >
            {tab}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-md ${
              activeTab === i ? 'bg-ds-gold/20 text-ds-gold' : 'bg-ds-border text-ds-muted'
            }`}>
              {i === 0 ? pending.length : completed.length}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3">
          <div className="w-5 h-5 border-2 border-ds-gold border-t-transparent rounded-full animate-spin" />
          <span className="text-ds-muted text-sm font-semibold">Loading records…</span>
        </div>
      ) : activeTab === 0 ? (
        /* ── PENDING TAB ── */
        <div className="space-y-3">
          {pending.length === 0 ? (
            <EmptyState
              title={search ? 'No matches found' : 'All done! 🎉'}
              subtitle={search ? 'Try a different search term' : 'Scan a new document to add items'}
            />
          ) : (
            pending.map((r) => (
              <RecordCard key={r.id} record={r} onToggle={loadRecords} />
            ))
          )}
        </div>
      ) : (
        /* ── COMPLETED TAB ── */
        <CompletedTab records={completed} onUncheck={handleUncheck} />
      )}
    </div>
  );
}

// ── Completed tab (grouped by status) ────────────────────────────────────────

function CompletedTab({ records, onUncheck }) {
  if (records.length === 0) {
    return (
      <EmptyState
        title="Nothing verified yet"
        subtitle="Mark items as done from the Pending tab"
      />
    );
  }

  const saved = records.filter((r) => r.status === 'saved');
  const caution = records.filter((r) => r.status === 'caution');
  const missing = records.filter((r) => r.status === 'missing');

  return (
    <div className="space-y-4">
      {/* Disclaimer */}
      <div className="ds-card px-4 py-3 flex gap-3 text-xs text-ds-muted">
        <span>ℹ️</span>
        <p>Verified items are listed below. Tap an item to move it back to Pending.</p>
      </div>

      <CompletedSection title="Verified" status="saved" items={saved} onUncheck={onUncheck} />
      <CompletedSection title="Caution" subtitle="Quantities differ from order" status="caution" items={caution} onUncheck={onUncheck} />
      <CompletedSection title="Missing" subtitle="Received qty is zero" status="missing" items={missing} onUncheck={onUncheck} />
    </div>
  );
}

function CompletedSection({ title, subtitle, status, items, onUncheck }) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="ds-card p-3 flex items-center gap-3">
        <StatusBadge status={status} />
        <div className="flex-1">
          <p className="text-ds-cream text-sm font-bold">
            {title} · {items.length} item{items.length !== 1 ? 's' : ''}
          </p>
          {subtitle && <p className="text-ds-muted text-xs mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {items.map((r) => (
        <button
          key={r.id}
          id={`completed-item-${r.id}`}
          onClick={() => onUncheck(r)}
          className="w-full text-left ds-card p-3 hover:border-ds-gold/30 transition-all group"
        >
          <div className="flex items-start gap-3">
            <StatusBadge status={r.status} showDot={false} />
            <div className="flex-1 min-w-0">
              <p className="text-ds-cream font-bold text-sm truncate group-hover:text-ds-gold transition-colors">
                {r.data?.Description || '—'}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {r.data?.['SI No'] && <FieldBadge label={`SI ${r.data['SI No']}`} color="gold" />}
                {r.data?.['Order Qty'] && <FieldBadge label={`Qty ${r.data['Order Qty']}`} color="green" />}
                {r.receivedQty > 0 && <FieldBadge label={`Rcvd ${r.receivedQty}`} color="gold" />}
              </div>
            </div>
            <span className="text-ds-muted text-xs opacity-0 group-hover:opacity-100 transition-opacity pt-0.5">↩</span>
          </div>
        </button>
      ))}
    </div>
  );
}
