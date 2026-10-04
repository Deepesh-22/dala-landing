export function isWebGLAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Adaptive particle count — higher on desktop for brain fold detail */
export function getParticleCount() {
  if (typeof window === 'undefined') return 12000;
  const w = window.innerWidth;
  const cores = navigator.hardwareConcurrency || 4;
  if (w < 640 || cores <= 2) return 5000;
  if (w < 1024 || cores <= 4) return 9000;
  return 14000;
}
