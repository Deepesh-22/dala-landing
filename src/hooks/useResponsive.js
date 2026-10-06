import { useEffect, useState } from 'react';

/**
 * Particle budgets sized for reference look:
 * dense enough for solid brain, triangles still readable.
 */
function getSnapshot() {
  if (typeof window === 'undefined') {
    return {
      width: 1280,
      height: 800,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      dpr: 1,
      reducedMotion: false,
      particleBudget: 42000,
      triangleScale: 1.4,
      enableGlow: true,
      objectOffsetX: 1.15,
      objectScale: 1.55,
      objectOffsetY: 0.05,
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const rawDpr = window.devicePixelRatio || 1;

  let dpr = Math.min(rawDpr, 2);
  if (width < 640) dpr = Math.min(dpr, 1.25);
  else if (width < 1024) dpr = Math.min(dpr, 1.5);
  else dpr = Math.min(dpr, 1.75);

  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  let particleBudget;
  if (width < 480) particleBudget = 8000;
  else if (width < 640) particleBudget = 11000;
  else if (width < 768) particleBudget = 14000;
  else if (width < 900) particleBudget = 24000;
  else if (width < 1024) particleBudget = 32000;
  else if (width < 1440) particleBudget = 40000;
  else if (width < 1800) particleBudget = 45000;
  else particleBudget = 50000;

  const cores = navigator.hardwareConcurrency || 4;
  if (cores <= 2) particleBudget = Math.min(particleBudget, 10000);
  else if (cores <= 4 && isMobile) particleBudget = Math.min(particleBudget, 12000);
  if (reducedMotion) particleBudget = Math.min(particleBudget, 8000);

  // Scale so individual triangles read like reference
  let triangleScale = 1.4;
  if (isMobile) triangleScale = 1.15;
  else if (isTablet) triangleScale = 1.25;

  const enableGlow = isDesktop && !reducedMotion && cores > 4;

  let objectOffsetX = 1.15;
  let objectScale = 1.55;
  let objectOffsetY = 0.05;

  if (isMobile) {
    objectOffsetX = 0.05;
    objectScale = 1.15;
    objectOffsetY = -0.18;
  } else if (isTablet) {
    objectOffsetX = 0.8;
    objectScale = 1.35;
    objectOffsetY = 0.02;
  } else if (width < 1280) {
    objectOffsetX = 1.0;
    objectScale = 1.45;
  } else if (width >= 1600) {
    objectOffsetX = 1.25;
    objectScale = 1.6;
  }

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    dpr,
    reducedMotion,
    particleBudget,
    triangleScale,
    enableGlow,
    objectOffsetX,
    objectScale,
    objectOffsetY,
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
  return getSnapshot().dpr;
}

export function getParticleBudget() {
  return getSnapshot().particleBudget;
}

export function getDeviceProfile() {
  return getSnapshot();
}
