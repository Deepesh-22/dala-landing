import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Phase 8 — full-screen editorial manifesto.
 * Centered poster typography. WebGL stays fixed behind.
 * Continuous scroll: text fades in/out while particles morph.
 */
export default function Manifesto() {
  const sectionRef = useRef(null);
  const blockARef = useRef(null);
  const blockBRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const a = blockARef.current;
    const b = blockBRef.current;
    if (!section || !a || !b) return undefined;

    const ctx = gsap.context(() => {
      gsap.set([a, b], { opacity: 0, y: 48 });

      // Block A: enter as section arrives, hold, then exit upward
      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top 75%',
            end: 'center center',
            scrub: 0.7,
          },
        })
        .to(a, { opacity: 1, y: 0, ease: 'none', duration: 1 });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: 'center center',
            end: 'bottom 35%',
            scrub: 0.7,
          },
        })
        .to(a, { opacity: 0, y: -36, ease: 'none', duration: 1 });

      // Block B: staggered after A, same continuous feel
      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top 40%',
            end: 'center 30%',
            scrub: 0.7,
          },
        })
        .to(b, { opacity: 1, y: 0, ease: 'none', duration: 1 });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: 'center 30%',
            end: 'bottom top',
            scrub: 0.7,
          },
        })
        .to(b, { opacity: 0, y: -48, ease: 'none', duration: 1 });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="manifesto"
      ref={sectionRef}
      className="manifesto"
      data-section="manifesto"
    >
      <div className="manifesto__inner">
        <p ref={blockARef} className="manifesto__statement">
          Existing solutions are cumbersome and quickly become outdated.
          <br />
          Yet another decaying system that requires continuous maintenance.
        </p>

        <p ref={blockBRef} className="manifesto__statement manifesto__statement--secondary">
          Information should live with the teams who create it —
          not locked inside tools that age faster than the work itself.
        </p>
      </div>
    </section>
  );
}
