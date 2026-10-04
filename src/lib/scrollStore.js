/**
 * Shared scroll / morph state — updated by ScrollTrigger, read by WebGL each frame.
 */
export const scrollStore = {
  progress: 0,
  morph: 0,
  section: 0,
};

/**
 * Piecewise morph timeline with holds.
 * 0 brain · 1 distorted · 2 abstract · 3 bulb · 4 scatter · 5 structure
 */
export function progressToMorph(p) {
  const x = Math.min(1, Math.max(0, p));

  // 0.00–0.14  hold brain
  if (x < 0.14) return 0;

  // 0.14–0.28  brain → distorted
  if (x < 0.28) return ((x - 0.14) / 0.14) * 1;

  // 0.28–0.40  distorted → abstract
  if (x < 0.40) return 1 + ((x - 0.28) / 0.12) * 1;

  // 0.40–0.52  abstract → bulb
  if (x < 0.52) return 2 + ((x - 0.40) / 0.12) * 1;

  // 0.52–0.66  HOLD bulb (clear lightbulb reading)
  if (x < 0.66) return 3;

  // 0.66–0.80  bulb → scatter
  if (x < 0.80) return 3 + ((x - 0.66) / 0.14) * 1;

  // 0.80–1.00  scatter → structure
  return 4 + ((x - 0.80) / 0.2) * 1;
}
