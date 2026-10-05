import { useRef } from 'react';
import { useEditorialMotion } from '../../hooks/useEditorialMotion.js';
import { useResponsive } from '../../hooks/useResponsive.js';

/**
 * Generic editorial section — Phase 11 scroll-linked type motion.
 */
export default function Section({ id, label, title, body }) {
  const sectionRef = useRef(null);
  const { reducedMotion } = useResponsive();

  useEditorialMotion(sectionRef, {
    targets: '.section__anim',
    mode: 'enter-exit',
    y: 36,
    stagger: 0.09,
    scale: true,
    reducedMotion,
  });

  return (
    <section id={id} ref={sectionRef} className="section" data-section={id}>
      {label ? <p className="section__label section__anim">{label}</p> : null}
      {title ? <h2 className="section__title section__anim">{title}</h2> : null}
      {body ? <p className="section__body section__anim">{body}</p> : null}
    </section>
  );
}
