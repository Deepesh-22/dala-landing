import { useEffect, useState } from 'react';

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
      triangleScale: 1.35,
      enableGlow: false,
      objectOffsetX: 1.15,
      objectScale: 1.55,
      objectOffsetY: 0.05,
    };
  }

  const width = window.innerWidth;
  const rawDpr = window.devicePixelRatio || 1;
  let dpr = Math.min(rawDpr, 2);
  if (width < 640) dpr = Math.min(dpr, 1.25);
  else if (width < 1024) dpr = Math.min(dpr, 1.5);
  else dpr = Math.min(dpr, 1.75);

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  let particleBudget;
  if (width < 480) particleBudget = 8000;
  else if (width < 640) particleBudget = 11000;
  else if (width < 768) particleBudget = 14000;
  else if (width < 1024) particleBudget = 28000;
  else if (width < 1440) particleBudget = 40000;
  else particleBudget = 45000;

  const cores = navigator.hardwareConcurrency || 4;
  if (cores <= 2) particleBudget = Math.min(particleBudget, 10000);
  if (reducedMotion) particleBudget = Math.min(particleBudget, 8000);

  let triangleScale = 1.35;
  if (isMobile) triangleScale = 1.1;
  else if (isTablet) triangleScale = 1.2;

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
  }

  return {
    width,
    height: window.innerHeight,
    isMobile,
    isTablet,
    isDesktop,
    dpr,
    reducedMotion,
    particleBudget,
    triangleScale,
    enableGlow: false,
    objectOffsetX,
    objectScale,
    objectOffsetY,
  };
}

export function useResponsive() {
  const [state, setState] = useState(getSnapshot);
  useEffect(() => {
    const onResize = () => setState(getSnapshot());
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
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
