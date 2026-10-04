import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Phase 9 — lightbulb editorial section.
 * Left: large type integrated with WebGL composition.
 * Right: particle bulb (morph state 3) lives in the fixed canvas.
 */
export default function BulbSection() {
  const sectionRef = useRef(null);
  const copyRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const copy = copyRef.current;
    if (!section || !copy) return undefined;

    const ctx = gsap.context(() => {
      gsap.set(copy, { opacity: 0, y: 40 });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            end: 'center center',
            scrub: 0.65,
          },
        })
        .to(copy, { opacity: 1, y: 0, ease: 'none', duration: 1 });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: 'center 40%',
            end: 'bottom top',
            scrub: 0.65,
          },
        })
        .to(copy, { opacity: 0, y: -32, ease: 'none', duration: 1 });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="feature-01"
      ref={sectionRef}
      className="bulb-section"
      data-section="feature-01"
    >
      <div ref={copyRef} className="bulb-section__copy">
        <p className="bulb-section__eyebrow">Insight</p>
        <h2 className="bulb-section__title">
          <span className="bulb-section__title-line">Spark lightbulb</span>
          <span className="bulb-section__title-line">moments</span>
        </h2>
        <p className="bulb-section__body">
          Ideas crystallize from the field — geometry gathers into a single,
          luminous form. Knowledge that was scattered becomes a spark the team
          can hold.
        </p>
      </div>

      {/* Right side left empty in HTML — bulb is WebGL */}
      <div className="bulb-section__visual" aria-hidden="true" />
    </section>
  );
}
