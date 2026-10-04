/**
 * Shared scroll / morph state — updated by ScrollTrigger, read by WebGL each frame.
 * Avoids React re-renders on every scroll tick.
 */
export const scrollStore = {
  /** Normalized page scroll 0 → 1 */
  progress: 0,
  /** Continuous morph position across shape states 0 → 5 */
  morph: 0,
  /** Current section index (0-based) */
  section: 0,
};

/** Map global progress → continuous morph value (0…5) */
export function progressToMorph(p) {
  // Hold at brain briefly, then move through states
  const clamped = Math.min(1, Math.max(0, p));
  // 0–0.08 stay near 0, then spread across remaining range
  if (clamped < 0.06) return 0;
  const t = (clamped - 0.06) / 0.94;
  return t * 5;
}
