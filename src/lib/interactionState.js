/**
 * Phase 16 — micro-interaction state (module-level, no React setState).
 * Pointer + scroll velocity only. All values stay subtle.
 */

export const interaction = {
  /** Normalized pointer −1…1 */
  pointerX: 0,
  pointerY: 0,
  /** Smoothed pointer for rendering */
  smoothX: 0,
  smoothY: 0,
  /** 0…1 how fast the user is scrolling */
  scrollVelocity: 0,
  /** Last progress sample for velocity */
  _lastProgress: 0,
  _lastTime: 0,
  /** Pointer active (not touch-only idle) */
  pointerActive: false,
};

/** Call from pointermove — normalized client coords */
export function setPointer(nx, ny) {
  interaction.pointerX = nx;
  interaction.pointerY = ny;
  interaction.pointerActive = true;
}

export function clearPointer() {
  interaction.pointerActive = false;
}

/**
 * Call when page progress updates.
 * progress 0→1, timeMs performance.now()
 */
export function sampleScrollVelocity(progress, timeMs) {
  if (!interaction._lastTime) {
    interaction._lastProgress = progress;
    interaction._lastTime = timeMs;
    return;
  }
  const dt = Math.max(0.008, (timeMs - interaction._lastTime) / 1000);
  const dp = Math.abs(progress - interaction._lastProgress);
  const raw = Math.min(1, (dp / dt) * 2.5); // scale into 0…1
  // EMA settle
  interaction.scrollVelocity += (raw - interaction.scrollVelocity) * 0.18;
  interaction._lastProgress = progress;
  interaction._lastTime = timeMs;

  // Natural decay when progress stalls
  if (raw < 0.02) {
    interaction.scrollVelocity *= 0.92;
  }
}

/** Frame tick: smooth pointer toward target */
export function tickInteraction(delta = 0.016) {
  const k = 1 - Math.exp(-3.2 * Math.min(delta, 0.05));
  interaction.smoothX += (interaction.pointerX - interaction.smoothX) * k;
  interaction.smoothY += (interaction.pointerY - interaction.smoothY) * k;

  // Decay velocity if no new samples
  interaction.scrollVelocity *= 0.985;
}
