import { useState } from 'react';
import { updateRecord, deleteRecord } from '../api/recordsApi';
import { FieldBadge } from './StatusBadge';
import QtyModal from './QtyModal';

/**
 * RecordCard — web equivalent of Flutter's RecordCard widget.
 * Displays one GRN row item with swipe-inspired action buttons.
 */
export default function RecordCard({ record: initialRecord, onToggle }) {
  const [record, setRecord] = useState(initialRecord);
  const [showQtyModal, setShowQtyModal] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const orderQty = parseInt(
    (record.data?.['Order Qty'] || '0').replace(/[^0-9.]/g, ''),
    10
  ) || 0;

  const handleMarkDone = async (forceZero = false) => {
    let finalQty = forceZero ? 0 : (record.receivedQty > 0 ? record.receivedQty : orderQty);
    const finalStatus =
      finalQty === 0 ? 'missing' : finalQty !== orderQty ? 'caution' : 'saved';

    setLeaving(true);
    try {
      await updateRecord(record.id, {
        isChecked: true,
        receivedQty: finalQty,
        status: finalStatus,
      });
      onToggle();
    } catch {
      setLeaving(false);
    }
  };

  const handleQtyClose = (updated) => {
    setShowQtyModal(false);
    if (updated) {
      setRecord(updated);
      onToggle();
    }
  };

  const handleDelete = async () => {
    setLeaving(true);
    await deleteRecord(record.id);
    onToggle();
  };

  return (
    <>
      <div
        className={`ds-card p-4 transition-all duration-300 ${
          leaving ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100 animate-slide-up'
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox area */}
          <button
            id={`check-${record.id}`}
            onClick={() => handleMarkDone()}
            title="Mark as done"
            className="mt-0.5 w-7 h-7 rounded-lg border-2 border-ds-border flex items-center justify-center flex-shrink-0 hover:border-ds-green transition-colors group"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-ds-border group-hover:text-ds-green transition-colors">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-ds-cream font-extrabold text-sm leading-snug truncate">
              {record.data?.Description || '—'}
            </p>

            <div className="flex flex-wrap gap-1.5 mt-2">
              {record.data?.['SI No'] && (
                <FieldBadge label={`SI ${record.data['SI No']}`} color="gold" />
              )}
              {record.data?.['Order Qty'] && (
                <FieldBadge label={`Qty ${record.data['Order Qty']}`} color="green" />
              )}
              {record.data?.Unit && (
                <FieldBadge label={record.data.Unit} color="muted" />
              )}
              {record.receivedQty > 0 && (
                <FieldBadge label={`Rcvd ${record.receivedQty}`} color="gold" />
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              id={`edit-qty-${record.id}`}
              onClick={() => setShowQtyModal(true)}
              title="Edit quantity"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-ds-muted hover:text-ds-gold hover:bg-ds-gold/10 transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>

            {confirmDelete ? (
              <div className="flex items-center gap-1">
                <button onClick={handleDelete} className="text-ds-red text-xs font-bold px-2 py-1 rounded hover:bg-ds-red/10 transition-colors">Del</button>
                <button onClick={() => setConfirmDelete(false)} className="text-ds-muted text-xs px-1 py-1 rounded">✕</button>
              </div>
            ) : (
              <button
                id={`delete-${record.id}`}
                onClick={() => setConfirmDelete(true)}
                title="Delete"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-ds-muted hover:text-ds-red hover:bg-ds-red/10 transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Mark done footer hint */}
        <div className="mt-3 pt-3 border-t border-ds-border/60 flex items-center justify-between">
          <span className="text-ds-muted text-xs">
            {record.data?.HSN && `HSN: ${record.data.HSN}`}
          </span>
          <button
            onClick={() => handleMarkDone()}
            className="text-ds-green text-xs font-bold flex items-center gap-1 hover:opacity-75 transition-opacity"
          >
            Mark Done
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>

      {showQtyModal && (
        <QtyModal record={record} onClose={handleQtyClose} />
      )}
    </>
  );
}
