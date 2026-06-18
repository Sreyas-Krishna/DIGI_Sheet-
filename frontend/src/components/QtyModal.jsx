import { useState } from 'react';
import { updateRecord } from '../api/recordsApi';

/**
 * QtyModal — web equivalent of Flutter's QuantityCounterSheet.
 * Opens as a bottom-sheet style overlay.
 * Props:
 *   record     — the full record object
 *   onClose    — called with updated record or null on cancel
 */
export default function QtyModal({ record, onClose }) {
  const orderQty = parseInt(
    (record.data?.['Order Qty'] || '0').replace(/[^0-9.]/g, ''),
    10
  ) || 0;

  const [count, setCount] = useState(
    record.receivedQty > 0 ? record.receivedQty : orderQty
  );
  const [saving, setSaving] = useState(false);
  const [shake, setShake] = useState(false);

  const clamp = (n) => {
    if (n < 0 || (orderQty > 0 && n > orderQty)) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    setCount(n);
  };

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const newStatus =
        count === 0 ? 'missing' : count !== orderQty ? 'caution' : 'saved';
      const updated = await updateRecord(record.id, {
        receivedQty: count,
        status: newStatus,
        isChecked: false,
      });
      onClose(updated);
    } finally {
      setSaving(false);
    }
  };

  return (
    /* Backdrop */
    <div
      id="qty-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in"
      onClick={(e) => e.target.id === 'qty-modal-backdrop' && onClose(null)}
    >
      {/* Sheet */}
      <div className="ds-card w-full max-w-sm p-6 rounded-3xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
        {/* Drag handle (mobile) */}
        <div className="w-10 h-1 rounded-full bg-ds-border mx-auto mb-6" />

        <h2 className="text-ds-cream font-black text-lg text-center mb-1 leading-snug">
          {record.data?.Description || 'Item'}
        </h2>
        <p className="text-ds-muted text-sm text-center mb-8">Received Quantity</p>

        {/* Counter */}
        <div className="flex items-center justify-center gap-10 mb-8">
          <button
            id="qty-decrement"
            onClick={() => clamp(count - 1)}
            className="w-14 h-14 rounded-2xl bg-ds-surface border border-ds-border text-ds-cream text-2xl font-bold flex items-center justify-center hover:border-ds-gold/50 hover:text-ds-gold transition-all active:scale-90"
          >
            −
          </button>

          <span
            className={`text-6xl font-black tabular-nums transition-all ${
              count >= orderQty && orderQty > 0 ? 'text-ds-gold' : 'text-ds-green'
            } ${shake ? 'animate-pulse-gold' : ''}`}
          >
            {count}
          </span>

          <button
            id="qty-increment"
            onClick={() => clamp(count + 1)}
            className="w-14 h-14 rounded-2xl bg-ds-surface border border-ds-border text-ds-cream text-2xl font-bold flex items-center justify-center hover:border-ds-gold/50 hover:text-ds-gold transition-all active:scale-90"
          >
            +
          </button>
        </div>

        {orderQty > 0 && (
          <p className="text-center text-ds-muted text-xs font-semibold mb-6">
            Order Qty: <span className="text-ds-cream">{orderQty}</span>
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            id="qty-cancel"
            onClick={() => onClose(null)}
            className="ds-btn-ghost flex-1 py-3"
          >
            Cancel
          </button>
          <button
            id="qty-confirm"
            onClick={handleConfirm}
            disabled={saving}
            className="ds-btn-primary flex-1 py-3"
          >
            {saving ? 'Saving…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
