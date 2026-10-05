import { useRef } from 'react';
import { useEditorialMotion } from '../../hooks/useEditorialMotion.js';
import { useResponsive } from '../../hooks/useResponsive.js';

/**
 * Phase 8 + 11 — full-screen editorial manifesto.
 * Centered poster type. Scroll-linked opacity + vertical drift.
 */
export default function Manifesto() {
  const sectionRef = useRef(null);
  const { reducedMotion } = useResponsive();

  useEditorialMotion(sectionRef, {
    targets: '.manifesto__statement',
    mode: 'enter-exit',
    y: 48,
    stagger: 0.14,
    scale: true,
    reducedMotion,
  });

  return (
    <section
      id="manifesto"
      ref={sectionRef}
      className="manifesto"
      data-section="manifesto"
    >
      <div className="manifesto__inner">
        <p className="manifesto__statement">
          Existing solutions are cumbersome and quickly become outdated.
          <br />
          Yet another decaying system that requires continuous maintenance.
        </p>

        <p className="manifesto__statement manifesto__statement--secondary">
          Information should live with the teams who create it —
          not locked inside tools that age faster than the work itself.
        </p>
      </div>
    </section>
  );
}
