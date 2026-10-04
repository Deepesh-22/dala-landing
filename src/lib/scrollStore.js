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
 * Longer bulb hold aligned with Phase 9 editorial section.
 */
export function progressToMorph(p) {
  const x = Math.min(1, Math.max(0, p));

  // 0.00–0.12  hold brain
  if (x < 0.12) return 0;

  // 0.12–0.24  brain → distorted
  if (x < 0.24) return ((x - 0.12) / 0.12) * 1;

  // 0.24–0.36  distorted → abstract
  if (x < 0.36) return 1 + ((x - 0.24) / 0.12) * 1;

  // 0.36–0.48  abstract → bulb (reorganize into lightbulb)
  if (x < 0.48) return 2 + ((x - 0.36) / 0.12) * 1;

  // 0.48–0.68  HOLD bulb — clear silhouette + editorial text
  if (x < 0.68) return 3;

  // 0.68–0.82  bulb → scatter
  if (x < 0.82) return 3 + ((x - 0.68) / 0.14) * 1;

  // 0.82–1.00  scatter → structure
  return 4 + ((x - 0.82) / 0.18) * 1;
}
