import { useEffect, useState } from 'react';

/**
 * Device capability — denser particles for visual fidelity on desktop.
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
      particleBudget: 70000,
      triangleScale: 0.82,
      enableGlow: true,
      objectOffsetX: 1.45,
      objectScale: 1.72,
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

  // Higher density = more silhouette fidelity
  let particleBudget;
  if (width < 480) particleBudget = 10000;
  else if (width < 640) particleBudget = 14000;
  else if (width < 768) particleBudget = 20000;
  else if (width < 900) particleBudget = 32000;
  else if (width < 1024) particleBudget = 45000;
  else if (width < 1440) particleBudget = 65000;
  else if (width < 1800) particleBudget = 80000;
  else particleBudget = 95000;

  const cores = navigator.hardwareConcurrency || 4;
  if (cores <= 2) particleBudget = Math.min(particleBudget, 14000);
  else if (cores <= 4 && isMobile) particleBudget = Math.min(particleBudget, 18000);

  if (reducedMotion) particleBudget = Math.min(particleBudget, 10000);

  // Smaller triangles → denser, more premium field (not chunky)
  let triangleScale = 0.82;
  if (isMobile) triangleScale = 0.65;
  else if (isTablet) triangleScale = 0.75;

  const enableGlow = isDesktop && !reducedMotion && cores > 4;

  let objectOffsetX = 1.45;
  let objectScale = 1.72;
  if (isMobile) {
    objectOffsetX = 0.12;
    objectScale = 1.2;
  } else if (isTablet) {
    objectOffsetX = 0.85;
    objectScale = 1.4;
  } else if (width < 1280) {
    objectOffsetX = 1.2;
    objectScale = 1.55;
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
