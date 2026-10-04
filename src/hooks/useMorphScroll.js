import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { progressToMorph, scrollStore } from '../lib/scrollStore.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * Phase 7 — deterministic scroll → morph mapping.
 * Scrubbed, reversible. Uses section markers when available.
 */
export function useMorphScroll({ reducedMotion = false } = {}) {
  useEffect(() => {
    if (reducedMotion) {
      scrollStore.progress = 0;
      scrollStore.morph = 0;
      return undefined;
    }

    const triggers = [];

    // Global page progress
    const main = ScrollTrigger.create({
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.6,
      onUpdate: (self) => {
        scrollStore.progress = self.progress;
        scrollStore.morph = progressToMorph(self.progress);
      },
    });
    triggers.push(main);

    // Section indices for optional later use
    const sections = document.querySelectorAll('[data-section]');
    sections.forEach((el, i) => {
      const st = ScrollTrigger.create({
        trigger: el,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => {
          scrollStore.section = i;
        },
        onEnterBack: () => {
          scrollStore.section = i;
        },
      });
      triggers.push(st);
    });

    // Initial values
    scrollStore.progress = main.progress;
    scrollStore.morph = progressToMorph(main.progress);

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener('resize', onResize, { passive: true });

    // Lenis may delay layout — refresh after a beat
    const t = setTimeout(() => ScrollTrigger.refresh(), 400);

    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', onResize);
      triggers.forEach((tr) => tr.kill());
    };
  }, [reducedMotion]);
}
