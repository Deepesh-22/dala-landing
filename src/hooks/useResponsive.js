import { useEffect, useState } from 'react';

function getSnapshot() {
  if (typeof window === 'undefined') {
    return {
      width: 1280,
      height: 800,
      isMobile: false,
      isTablet: false,
      dpr: 1,
      reducedMotion: false,
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return {
    width,
    height,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    dpr,
    reducedMotion,
  };
}

/**
 * Viewport + capability snapshot for layout and WebGL budget.
 */
export function useResponsive() {
  const [state, setState] = useState(getSnapshot);

  useEffect(() => {
    const onResize = () => setState(getSnapshot());
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotion = () => setState(getSnapshot());

    window.addEventListener('resize', onResize, { passive: true });
    mq.addEventListener?.('change', onMotion);

    return () => {
      window.removeEventListener('resize', onResize);
      mq.removeEventListener?.('change', onMotion);
    };
  }, []);

  return state;
}

/** Safe DPR cap for renderer */
export function getCappedDpr() {
  if (typeof window === 'undefined') return 1;
  return Math.min(window.devicePixelRatio || 1, 1.75);
}

export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
