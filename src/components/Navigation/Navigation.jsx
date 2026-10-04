import { useState } from 'react';

const LINKS = [
  { href: '#manifesto', label: 'Manifesto' },
  { href: '#feature-02', label: 'Team' },
  { href: '#feature-03', label: 'Blog' },
];

export default function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="nav" role="banner">
      <a href="#hero" className="nav__logo" aria-label="Home">
        <span className="nav__logo-mark" aria-hidden="true" />
        <span className="nav__logo-text">Dala</span>
      </a>

      {/* Desktop */}
      <nav className="nav__desktop" aria-label="Primary">
        {LINKS.map((link) => (
          <a key={link.href} href={link.href} className="nav__link">
            {link.label}
          </a>
        ))}
        <a href="#cta" className="nav__cta">
          Request access
        </a>
      </nav>

      {/* Mobile — menu button only, no drawer yet */}
      <button
        type="button"
        className={`nav__menu-btn ${menuOpen ? 'is-open' : ''}`}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((v) => !v)}
      >
        <span className="nav__menu-line" />
        <span className="nav__menu-line" />
      </button>
    </header>
  );
}
