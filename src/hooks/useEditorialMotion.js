import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Phase 11 — editorial typographic motion.
 * Slow, premium, cinematic. No bounce / elastic / springy FX.
 *
 * @param {React.RefObject} scopeRef - section root
 * @param {object} options
 * @param {string|string[]} options.targets - selectors inside scope
 * @param {'enter'|'enter-exit'|'hero'} [options.mode='enter-exit']
 * @param {number} [options.y=36] - vertical travel (px)
 * @param {number} [options.stagger=0.08] - line/item stagger (s)
 * @param {boolean} [options.scale] - slight scale on major headings
 * @param {boolean} [options.reducedMotion]
 */
export function useEditorialMotion(
  scopeRef,
  {
    targets = '.ed-line',
    mode = 'enter-exit',
    y = 36,
    stagger = 0.08,
    scale = false,
    reducedMotion = false,
  } = {}
) {
  useEffect(() => {
    const scope = scopeRef?.current;
    if (!scope) return undefined;

    if (reducedMotion) {
      const els = scope.querySelectorAll(
        typeof targets === 'string' ? targets : targets.join(',')
      );
      gsap.set(els, { opacity: 1, y: 0, scale: 1, clearProps: 'all' });
      return undefined;
    }

    const ctx = gsap.context(() => {
      const els = gsap.utils.toArray(
        typeof targets === 'string' ? targets : targets.join(',')
      );
      if (!els.length) return;

      const fromVars = {
        opacity: 0,
        y,
        ...(scale ? { scale: 0.97 } : {}),
      };

      const toVars = {
        opacity: 1,
        y: 0,
        ...(scale ? { scale: 1 } : {}),
        ease: 'power2.out',
        duration: 1.15,
        stagger,
      };

      // ── Hero: one-shot elegant entrance (not scrubbed) ───────
      if (mode === 'hero') {
        gsap.set(els, fromVars);
        gsap.to(els, {
          ...toVars,
          delay: 0.35,
          stagger: stagger + 0.04,
          duration: 1.35,
          ease: 'power3.out',
        });

        // Subtle continuous scroll drift (very light)
        gsap.to(els, {
          y: -18,
          ease: 'none',
          scrollTrigger: {
            trigger: scope,
            start: 'top top',
            end: 'bottom top',
            scrub: 1.1,
          },
        });
        return;
      }

      // ── Enter only ───────────────────────────────────────────
      if (mode === 'enter') {
        gsap.set(els, fromVars);
        gsap.to(els, {
          ...toVars,
          scrollTrigger: {
            trigger: scope,
            start: 'top 78%',
            end: 'top 35%',
            scrub: 0.9,
          },
        });
        return;
      }

      // ── Enter → hold → exit (default) ────────────────────────
      gsap.set(els, fromVars);

      gsap
        .timeline({
          scrollTrigger: {
            trigger: scope,
            start: 'top 78%',
            end: 'center 42%',
            scrub: 0.85,
          },
        })
        .to(els, {
          opacity: 1,
          y: 0,
          ...(scale ? { scale: 1 } : {}),
          ease: 'none',
          duration: 1,
          stagger,
        });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: scope,
            start: 'center 38%',
            end: 'bottom 12%',
            scrub: 0.85,
          },
        })
        .to(els, {
          opacity: 0,
          y: -y * 0.7,
          ...(scale ? { scale: 0.985 } : {}),
          ease: 'none',
          duration: 1,
          stagger: stagger * 0.5,
        });
    }, scope);

    return () => ctx.revert();
  }, [scopeRef, targets, mode, y, stagger, scale, reducedMotion]);
}
