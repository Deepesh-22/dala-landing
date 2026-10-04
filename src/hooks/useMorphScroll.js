import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { progressToMorph, scrollStore } from '../lib/scrollStore.js';

gsap.registerPlugin(ScrollTrigger);

export function useMorphScroll({ reducedMotion = false } = {}) {
  useEffect(() => {
    if (reducedMotion) {
      scrollStore.progress = 0;
      scrollStore.morph = 0;
      return undefined;
    }

    const triggers = [];

    // Slightly smoother scrub for physical feel
    const main = ScrollTrigger.create({
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.85,
      onUpdate: (self) => {
        scrollStore.progress = self.progress;
        scrollStore.morph = progressToMorph(self.progress);
      },
    });
    triggers.push(main);

    document.querySelectorAll('[data-section]').forEach((el, i) => {
      triggers.push(
        ScrollTrigger.create({
          trigger: el,
          start: 'top center',
          end: 'bottom center',
          onEnter: () => {
            scrollStore.section = i;
          },
          onEnterBack: () => {
            scrollStore.section = i;
          },
        })
      );
    });

    scrollStore.progress = main.progress;
    scrollStore.morph = progressToMorph(main.progress);

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener('resize', onResize, { passive: true });
    const t = setTimeout(() => ScrollTrigger.refresh(), 400);

    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', onResize);
      triggers.forEach((tr) => tr.kill());
    };
  }, [reducedMotion]);
}
