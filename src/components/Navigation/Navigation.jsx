import { NAV_LINKS } from '../../data/sections.js';

export default function Navigation() {
  return (
    <header className="nav" role="banner">
      <a href="#hero" className="nav__brand">
        Dala
      </a>
      <nav className="nav__links" aria-label="Primary">
        {NAV_LINKS.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
