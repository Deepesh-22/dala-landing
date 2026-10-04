import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { sceneState, updateSceneFromProgress } from '../lib/sceneState.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * Phase 10 — single ScrollTrigger drives the entire continuous scene.
 * No per-section morph logic; all values come from the master timeline.
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
