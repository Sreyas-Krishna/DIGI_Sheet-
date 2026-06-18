export default function EmptyState({
  title = 'No records yet',
  subtitle = 'Scan a document to get started',
  icon,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-ds-surface flex items-center justify-center mb-4 shadow-ds-card">
        {icon ?? (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ds-muted">
            <rect x="3" y="3" width="18" height="18" rx="3"/>
            <path d="M9 9h6M9 12h4"/>
          </svg>
        )}
      </div>
      <h3 className="text-ds-cream font-bold text-base mb-1">{title}</h3>
      <p className="text-ds-muted text-sm">{subtitle}</p>
    </div>
  );
}
