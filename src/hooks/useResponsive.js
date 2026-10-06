import { useEffect, useState } from 'react';

/**
 * Phase F — responsive framing + particle budgets.
 * Desktop: object right-biased (offsetX 1.0–1.3), scale 1.4–1.6
 * Mobile: object centered/lower
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
      objectOffsetX: 1.2,
      objectScale: 1.5,
      objectOffsetY: 0.06,
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

  let triangleScale = 1.35;
  if (isMobile) triangleScale = 1.05;
  else if (isTablet) triangleScale = 1.2;

  const enableGlow = isDesktop && !reducedMotion && cores > 4;

  // Phase F framing
  let objectOffsetX = 1.2; // desktop right-bias 1.0–1.3
  let objectScale = 1.5; // desktop 1.4–1.6
  let objectOffsetY = 0.06;

  if (isMobile) {
    objectOffsetX = 0.05; // centered
    objectScale = 1.12;
    objectOffsetY = -0.2; // lower so type stacks above
  } else if (isTablet) {
    objectOffsetX = 0.85;
    objectScale = 1.35;
    objectOffsetY = 0.02;
  } else if (width < 1280) {
    objectOffsetX = 1.05;
    objectScale = 1.42;
  } else if (width >= 1600) {
    objectOffsetX = 1.25;
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
