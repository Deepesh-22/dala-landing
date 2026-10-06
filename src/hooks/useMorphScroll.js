import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { sceneState, updateSceneFromProgress } from '../lib/sceneState.js';
import { sampleScrollVelocity } from '../lib/interactionState.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * Phase H — master scroll → morph progress.
 * Pure function of progress → backward scroll restores morph correctly.
 * Mid-page refresh recovers via initial main.progress read.
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
      // Invalidate on refresh so mid-page load gets correct progress
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        // progress is 0→1 regardless of scroll direction → reversible
        updateSceneFromProgress(self.progress);
        sampleScrollVelocity(self.progress, performance.now());
      },
      onRefresh: (self) => {
        updateSceneFromProgress(self.progress);
      },
    });

    // Sync immediately (handles refresh mid-page)
    updateSceneFromProgress(main.progress);

    const onResize = () => {
      ScrollTrigger.refresh();
    };

    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onResize, { passive: true });

    const t = setTimeout(() => {
      ScrollTrigger.refresh();
      updateSceneFromProgress(main.progress);
    }, 400);

    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      main.kill();
    };
  }, [reducedMotion]);

  return sceneState;
}
