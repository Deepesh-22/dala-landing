import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { sceneState, updateSceneFromProgress } from '../lib/sceneState.js';
import { sampleScrollVelocity } from '../lib/interactionState.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * Phase 10 + 16 — master scroll timeline + velocity sampling.
 */
export function useMorphScroll({ reducedMotion = false } = {}) {
  useEffect(() => {
    if (reducedMotion) {
      updateSceneFromProgress(0);
      return undefined;
    }

    const main = ScrollTrigger.create({
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.85,
      onUpdate: (self) => {
        updateSceneFromProgress(self.progress);
        sampleScrollVelocity(self.progress, performance.now());
      },
    });

    updateSceneFromProgress(main.progress);

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener('resize', onResize, { passive: true });
    const t = setTimeout(() => ScrollTrigger.refresh(), 400);

    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', onResize);
      main.kill();
    };
  }, [reducedMotion]);

  return sceneState;
}
