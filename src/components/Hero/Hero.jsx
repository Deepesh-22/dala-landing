import { useRef } from 'react';
import { useEditorialMotion } from '../../hooks/useEditorialMotion.js';
import { useResponsive } from '../../hooks/useResponsive.js';

/**
 * Phase G — editorial hero type + brand chrome.
 * Title: weight ~400, tight line-height, clamp() sizes.
 * Copy keeps product line breaks: Unlock / Collective / Wisdom.
 */
export default function Hero() {
  const copyRef = useRef(null);
  const { reducedMotion } = useResponsive();

  useEditorialMotion(copyRef, {
    targets: '.hero__anim',
    mode: 'hero',
    y: 42,
    stagger: 0.11,
    scale: true,
    reducedMotion,
  });

  return (
    <section id="hero" className="hero" data-section="hero">
      <div className="hero__copy" ref={copyRef}>
        <p className="hero__eyebrow hero__anim">
          <span className="hero__eyebrow-line" aria-hidden="true" />
          Stop managing knowledge. Start using it.
        </p>

        <h1 className="hero__title">
          <span className="hero__title-line hero__anim">Unlock</span>
          <span className="hero__title-line hero__anim">Collective</span>
          <span className="hero__title-line hero__anim">Wisdom.</span>
        </h1>

        <p className="hero__body hero__anim">
          A living field of knowledge — particles of insight that form structure,
          scatter, and reform as teams think together.
        </p>

        <a href="#cta" className="hero__cta hero__anim">
          Request access
        </a>
      </div>

      <div className="hero__visual" aria-hidden="true" />
    </section>
  );
}
