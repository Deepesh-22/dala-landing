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
      particleBudget: 40000,
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const rawDpr = window.devicePixelRatio || 1;
  // Cap DPR: desktop ≤ 1.75, mobile ≤ 1.25
  const dpr = width < 768 ? Math.min(rawDpr, 1.25) : Math.min(rawDpr, 1.75);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let particleBudget = 50000;
  if (width < 640) particleBudget = 20000;
  else if (width < 1024) particleBudget = 35000;
  else if (width < 1440) particleBudget = 50000;
  else particleBudget = 70000;

  if (reducedMotion) particleBudget = Math.min(particleBudget, 15000);

  return {
    width,
    height,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    dpr,
    reducedMotion,
    particleBudget,
  };
}

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

export function getCappedDpr() {
  if (typeof window === 'undefined') return 1;
  const w = window.innerWidth;
  const raw = window.devicePixelRatio || 1;
  return w < 768 ? Math.min(raw, 1.25) : Math.min(raw, 1.75);
}

export function getParticleBudget() {
  return getSnapshot().particleBudget;
}
