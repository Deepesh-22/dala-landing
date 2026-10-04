/**
 * Phase 6 — first viewport composition.
 * LEFT: large editorial heading + eyebrow + body + CTA
 * RIGHT: particle brain (WebGL layer behind)
 * Not a centered SaaS container — left-aligned, sparse black space.
 */
export default function Hero() {
  return (
    <section id="hero" className="hero" data-section="hero">
      <div className="hero__copy">
        <p className="hero__eyebrow">
          Stop managing knowledge. Start using it.
        </p>

        <h1 className="hero__title">
          <span className="hero__title-line">Unlock</span>
          <span className="hero__title-line">Collective</span>
          <span className="hero__title-line">Wisdom.</span>
        </h1>

        <p className="hero__body">
          A living field of knowledge — particles of insight that form structure,
          scatter, and reform as teams think together.
        </p>

        <a href="#cta" className="hero__cta">
          Request access
        </a>
      </div>

      {/* Right half intentionally empty in HTML — brain lives in WebGL */}
      <div className="hero__visual" aria-hidden="true" />
    </section>
  );
}
