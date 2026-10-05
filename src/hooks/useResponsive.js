import { useEffect, useState } from 'react';

/**
 * Larger triangle scale so discrete filled faces read like the reference.
 * Density still high for silhouette.
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
      particleBudget: 55000,
      triangleScale: 1.35,
      enableGlow: true,
      objectOffsetX: 1.15,
      objectScale: 1.5,
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

  // Slightly fewer than max but larger triangles = clearer geometry
  let particleBudget;
  if (width < 480) particleBudget = 9000;
  else if (width < 640) particleBudget = 13000;
  else if (width < 768) particleBudget = 18000;
  else if (width < 900) particleBudget = 28000;
  else if (width < 1024) particleBudget = 38000;
  else if (width < 1440) particleBudget = 50000;
  else if (width < 1800) particleBudget = 60000;
  else particleBudget = 70000;

  const cores = navigator.hardwareConcurrency || 4;
  if (cores <= 2) particleBudget = Math.min(particleBudget, 12000);
  else if (cores <= 4 && isMobile) particleBudget = Math.min(particleBudget, 16000);
  if (reducedMotion) particleBudget = Math.min(particleBudget, 10000);

  // Larger triangles so each face reads as a triangle (reference look)
  let triangleScale = 1.35;
  if (isMobile) triangleScale = 1.05;
  else if (isTablet) triangleScale = 1.2;

  const enableGlow = isDesktop && !reducedMotion && cores > 4;

  let objectOffsetX = 1.15;
  let objectScale = 1.5;
  if (isMobile) {
    objectOffsetX = 0.1;
    objectScale = 1.15;
  } else if (isTablet) {
    objectOffsetX = 0.8;
    objectScale = 1.35;
  } else if (width < 1280) {
    objectOffsetX = 1.0;
    objectScale = 1.4;
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
