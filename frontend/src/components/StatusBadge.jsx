/**
 * StatusBadge — coloured pill badge matching Star Scan's status system
 * status: "saved" | "caution" | "missing"
 */
const configs = {
  saved: {
    bg: 'bg-ds-green/15',
    text: 'text-ds-green',
    dot: 'bg-ds-green',
    label: 'Verified',
  },
  caution: {
    bg: 'bg-ds-caution/15',
    text: 'text-ds-caution',
    dot: 'bg-ds-caution',
    label: 'Caution',
  },
  missing: {
    bg: 'bg-ds-red/15',
    text: 'text-ds-red',
    dot: 'bg-ds-red',
    label: 'Missing',
  },
};

export default function StatusBadge({ status = 'saved', showDot = true }) {
  const cfg = configs[status] ?? configs.saved;

  return (
    <span className={`ds-badge ${cfg.bg} ${cfg.text}`}>
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} inline-block`} />
      )}
      {cfg.label}
    </span>
  );
}

export function FieldBadge({ label, color = 'gold' }) {
  const colorMap = {
    gold: 'bg-ds-gold/15 text-ds-gold',
    green: 'bg-ds-green/12 text-ds-green',
    muted: 'bg-ds-border text-ds-muted',
    red: 'bg-ds-red/12 text-ds-red',
  };

  return (
    <span className={`ds-badge ${colorMap[color] ?? colorMap.muted}`}>
      {label}
    </span>
  );
}
