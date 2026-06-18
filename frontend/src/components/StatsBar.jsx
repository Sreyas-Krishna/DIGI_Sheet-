/**
 * StatsBar — mirrors Star Scan's progress summary panel
 * Shows Pending / Completed / Total counts + progress bar
 */
export default function StatsBar({ pending, completed, total }) {
  const pct = total === 0 ? 0 : completed / total;
  const pctLabel = total === 0 ? 'No records yet' : `${Math.round(pct * 100)}% verified`;

  return (
    <div className="ds-card p-4 animate-fade-in">
      {/* Stat chips */}
      <div className="flex items-center gap-4 mb-4">
        <StatChip label="Pending" value={pending} color="text-ds-gold" />
        <div className="w-px h-8 bg-ds-border" />
        <StatChip label="Done" value={completed} color="text-ds-green" />
        <div className="w-px h-8 bg-ds-border" />
        <StatChip label="Total" value={total} color="text-ds-muted" />
      </div>

      {/* Progress bar */}
      <div className="relative h-2 rounded-full bg-ds-gold/15 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-ds-green rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <p className="text-ds-muted text-xs font-semibold mt-2">{pctLabel}</p>
    </div>
  );
}

function StatChip({ label, value, color }) {
  return (
    <div className="flex flex-col">
      <span className={`text-2xl font-black leading-none ${color}`}>{value}</span>
      <span className="text-ds-muted text-xs font-semibold mt-0.5">{label}</span>
    </div>
  );
}
