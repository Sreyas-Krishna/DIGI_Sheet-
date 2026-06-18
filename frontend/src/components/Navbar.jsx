import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

const ScanIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><path d="M3 17h4v4H3z"/>
  </svg>
);

const GridIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
);

const LogoIcon = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="#C8A84B" fillOpacity="0.15"/>
    <path d="M7 8h18M7 12h14M7 16h18M7 20h10" stroke="#C8A84B" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="24" cy="22" r="5" fill="#4CAF79" fillOpacity="0.2" stroke="#4CAF79" strokeWidth="2"/>
    <path d="M22 22l1.5 1.5 2.5-2.5" stroke="#4CAF79" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function Navbar() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-ds-bg/80 backdrop-blur-md border-b border-ds-border">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <LogoIcon />
          <span className="text-ds-cream font-extrabold text-lg tracking-tight leading-none">
            Digi<span className="text-ds-gold">Sheet</span>
          </span>
          <span className="text-ds-muted text-xs font-medium hidden sm:inline">
            ☕ by STAR
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1">
          <NavLink to="/" active={pathname === '/'} icon={<GridIcon />} label="Dashboard" />
          <NavLink to="/scan" active={pathname === '/scan'} icon={<ScanIcon />} label="Scan Sheet" isAccent />
        </nav>

        {/* Mobile hamburger */}
        <button
          id="mobile-menu-btn"
          className="sm:hidden p-2 rounded-lg text-ds-muted hover:text-ds-cream transition-colors"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            {menuOpen
              ? <><path d="M18 6L6 18"/><path d="M6 6l12 12"/></>
              : <><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/></>}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="sm:hidden border-t border-ds-border bg-ds-surface px-4 py-3 flex flex-col gap-2 animate-slide-up">
          <NavLink to="/" active={pathname === '/'} icon={<GridIcon />} label="Dashboard" onClick={() => setMenuOpen(false)} mobile />
          <NavLink to="/scan" active={pathname === '/scan'} icon={<ScanIcon />} label="Scan Sheet" isAccent onClick={() => setMenuOpen(false)} mobile />
        </div>
      )}
    </header>
  );
}

function NavLink({ to, active, icon, label, isAccent, onClick, mobile }) {
  const base = mobile
    ? 'flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all'
    : 'flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-semibold text-sm transition-all';

  const cls = isAccent
    ? active
      ? `${base} bg-ds-green/20 text-ds-green`
      : `${base} bg-ds-gold text-ds-bg hover:brightness-110`
    : active
      ? `${base} bg-ds-surface text-ds-cream`
      : `${base} text-ds-muted hover:text-ds-cream hover:bg-ds-surface/60`;

  return (
    <Link to={to} className={cls} onClick={onClick}>
      {icon}
      {label}
    </Link>
  );
}
