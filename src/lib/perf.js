/**
 * Phase 15 — module-level performance state.
 * NO React setState. Mutated only from useFrame / rAF.
 * Adaptive density scales particle work when FPS drops.
 */

export const perf = {
  /** Rolling average FPS */
  fps: 60,
  /** 0.35–1.0 — multiplies active particle count */
  density: 1,
  /** Frames sampled */
  samples: 0,
  /** Last frame timestamp (ms) */
  lastMs: 0,
  /** EMA of frame delta */
  emaDelta: 16.67,
  /** Whether glow should stay on under load */
  allowGlow: true,
  /** Development monitor visible */
  showMonitor: typeof import.meta !== 'undefined' && !!import.meta.env?.DEV,
};

const TARGET_DESKTOP = 55;
const TARGET_MOBILE = 28;
const EMA = 0.08;

/**
 * Call once per rendered frame (from useFrame).
 * Adjusts perf.density toward a stable FPS target.
 */
export function sampleFrame(ms, isMobile = false) {
  if (!perf.lastMs) {
    perf.lastMs = ms;
    return;
  }

  const delta = Math.min(100, Math.max(4, ms - perf.lastMs));
  perf.lastMs = ms;
  perf.emaDelta += (delta - perf.emaDelta) * EMA;
  perf.fps = 1000 / perf.emaDelta;
  perf.samples += 1;

  // Only adapt after a short warm-up
  if (perf.samples < 30) return;

  const target = isMobile ? TARGET_MOBILE : TARGET_DESKTOP;
  const fps = perf.fps;

  // Step density slowly — never thrash
  if (fps < target * 0.85) {
    perf.density = Math.max(0.35, perf.density - 0.02);
  } else if (fps > target * 1.1 && perf.density < 1) {
    perf.density = Math.min(1, perf.density + 0.01);
  }

  // Kill glow early under stress
  perf.allowGlow = fps > target * 0.9 && perf.density > 0.7;
}

/** Active instance count from budget × density */
export function activeCount(budget) {
  return Math.max(800, Math.floor(budget * perf.density));
}
