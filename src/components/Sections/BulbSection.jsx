import { useRef } from 'react';
import { useEditorialMotion } from '../../hooks/useEditorialMotion.js';
import { useResponsive } from '../../hooks/useResponsive.js';

/**
 * Phase 9 + 11 — lightbulb editorial section.
 * Line-staggered title, scroll-linked enter/exit.
 */
export default function BulbSection() {
  const sectionRef = useRef(null);
  const { reducedMotion } = useResponsive();

  useEditorialMotion(sectionRef, {
    targets: '.bulb-section__anim',
    mode: 'enter-exit',
    y: 40,
    stagger: 0.1,
    scale: true,
    reducedMotion,
  });

  return (
    <section
      id="feature-01"
      ref={sectionRef}
      className="bulb-section"
      data-section="feature-01"
    >
      <div className="bulb-section__copy">
        <p className="bulb-section__eyebrow bulb-section__anim">Insight</p>
        <h2 className="bulb-section__title">
          <span className="bulb-section__title-line bulb-section__anim">
            Spark lightbulb
          </span>
          <span className="bulb-section__title-line bulb-section__anim">
            moments
          </span>
        </h2>
        <p className="bulb-section__body bulb-section__anim">
          Ideas crystallize from the field — geometry gathers into a single,
          luminous form. Knowledge that was scattered becomes a spark the team
          can hold.
        </p>
      </div>

      <div className="bulb-section__visual" aria-hidden="true" />
    </section>
  );
}
