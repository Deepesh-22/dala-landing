import { useEffect, useState } from 'react';

/** Phase G — Manifesto / Team / Blog + Request access */
const LINKS = [
  { href: '#manifesto', label: 'Manifesto' },
  { href: '#feature-02', label: 'Team' },
  { href: '#feature-03', label: 'Blog' },
];

export default function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const close = () => setMenuOpen(false);

  return (
    <header className="nav" role="banner">
      <a href="#hero" className="nav__logo" aria-label="Dala home" onClick={close}>
        <span className="nav__logo-mark" aria-hidden="true" />
        <span className="nav__logo-text">Dala</span>
      </a>

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

      <button
        type="button"
        className={`nav__menu-btn ${menuOpen ? 'is-open' : ''}`}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        aria-controls="mobile-nav"
        onClick={() => setMenuOpen((v) => !v)}
      >
        <span className="nav__menu-line" />
        <span className="nav__menu-line" />
      </button>

      <div
        id="mobile-nav"
        className={`nav__mobile ${menuOpen ? 'is-open' : ''}`}
        hidden={!menuOpen}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        <nav className="nav__mobile-inner" aria-label="Mobile">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="nav__mobile-link"
              onClick={close}
            >
              {link.label}
            </a>
          ))}
          <a href="#cta" className="nav__mobile-cta" onClick={close}>
            Request access
          </a>
        </nav>
      </div>
    </header>
  );
}
