import { useEffect, useState } from 'react';

/**
 * Phase 14 — device capability snapshot.
 *
 * Particle budgets (brief):
 *   mobile  8k–20k
 *   tablet  20k–50k
 *   desktop 50k–100k
 *
 * DPR: Math.min(devicePixelRatio, 2) with tighter mobile/tablet caps.
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
      particleBudget: 60000,
      triangleScale: 1,
      enableGlow: true,
      objectOffsetX: 1.2,
      objectScale: 1.55,
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const rawDpr = window.devicePixelRatio || 1;

  // Brief: Math.min(dpr, 2) — then tier-tighten for GPU cost
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

  // Particle budgets per brief ranges
  let particleBudget;
  if (width < 480) particleBudget = 8000;
  else if (width < 640) particleBudget = 12000;
  else if (width < 768) particleBudget = 18000;
  else if (width < 900) particleBudget = 28000;
  else if (width < 1024) particleBudget = 40000;
  else if (width < 1440) particleBudget = 55000;
  else if (width < 1800) particleBudget = 70000;
  else particleBudget = 90000;

  // Hardware concurrency soft limit
  const cores = navigator.hardwareConcurrency || 4;
  if (cores <= 2) particleBudget = Math.min(particleBudget, 12000);
  else if (cores <= 4 && isMobile) particleBudget = Math.min(particleBudget, 16000);

  if (reducedMotion) particleBudget = Math.min(particleBudget, 10000);

  // Triangle size multiplier (mobile smaller)
  let triangleScale = 1;
  if (isMobile) triangleScale = 0.72;
  else if (isTablet) triangleScale = 0.88;

  // Glow only on desktop-class (expensive additive pass)
  const enableGlow = isDesktop && !reducedMotion && cores > 4;

  // Object placement — mobile more centered / lower so type stacks on top
  let objectOffsetX = 1.2;
  let objectScale = 1.55;
  if (isMobile) {
    objectOffsetX = 0.15;
    objectScale = 1.15;
  } else if (isTablet) {
    objectOffsetX = 0.75;
    objectScale = 1.35;
  } else if (width < 1280) {
    objectOffsetX = 1.05;
    objectScale = 1.45;
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
