/**
 * Phase B — Reference color language:
 * - Yellow / gold outer cortex rim (#F5C400)
 * - Multi-hue interior (purple, magenta, cyan, green, indigo, violet)
 * - Soft core — never a blown-out white hole
 * - Discrete per-particle picks (not blended mush)
 * - Glow only on sparse rim highlights
 */

import * as THREE from 'three';

export const PALETTE = {
  white: new THREE.Color('#FFFFFF'),
  yellow: new THREE.Color('#F5C400'),
  gold: new THREE.Color('#E8B84A'),
  purple: new THREE.Color('#8B5CF6'),
  indigo: new THREE.Color('#6366F1'),
  cyan: new THREE.Color('#06B6D4'),
  green: new THREE.Color('#22C55E'),
  magenta: new THREE.Color('#EC4899'),
  violet: new THREE.Color('#A78BFA'),
};

function hash01(i) {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}

/**
 * Spatial color field — outer shell yellow, interior multi-hue, soft core.
 */
export function colorFromField(x, y, z, seed) {
  const elev = y;
  const r2 = x * x + elev * elev * 1.1 + z * z * 0.95;
  const radius = Math.sqrt(r2);

  // Outer shell strength
  const rim = clamp01((radius - 0.5) / 0.6);
  // Soft core (inner volume)
  const core = clamp01(1 - radius / 0.32);

  let pick;

  if (rim > 0.4) {
    // Outer cortex: predominantly yellow/gold, occasional white fleck
    if (seed > 0.88) pick = PALETTE.white;
    else if (seed > 0.28) pick = PALETTE.yellow;
    else pick = PALETTE.gold;
  } else if (core > 0.5) {
    // Core: soft lilac / indigo / sparse white — NOT white blast
    // White limited to ~15% of core particles
    if (seed > 0.85) pick = PALETTE.white;
    else if (seed > 0.55) pick = PALETTE.violet;
    else if (seed > 0.3) pick = PALETTE.indigo;
    else pick = PALETTE.purple;
  } else if (elev > 0.22) {
    // Upper mid band
    if (seed > 0.72) pick = PALETTE.yellow;
    else if (seed > 0.5) pick = PALETTE.white;
    else if (seed > 0.28) pick = PALETTE.purple;
    else pick = PALETTE.cyan;
  } else if (elev < -0.18) {
    // Lower / stem region
    if (seed > 0.68) pick = PALETTE.yellow;
    else if (seed > 0.42) pick = PALETTE.purple;
    else if (seed > 0.22) pick = PALETTE.indigo;
    else pick = PALETTE.magenta;
  } else {
    // Mid band — full multi-hue discrete picks
    if (seed > 0.88) pick = PALETTE.white;
    else if (seed > 0.72) pick = PALETTE.yellow;
    else if (seed > 0.58) pick = PALETTE.purple;
    else if (seed > 0.44) pick = PALETTE.magenta;
    else if (seed > 0.3) pick = PALETTE.cyan;
    else if (seed > 0.18) pick = PALETTE.green;
    else if (seed > 0.08) pick = PALETTE.indigo;
    else pick = PALETTE.violet;
  }

  // Brightness: rim bright, core moderated (0.7–0.9 cap zone)
  let brightness = 0.74 + seed * 0.22;
  if (rim > 0.45) brightness = 0.88 + seed * 0.12;
  if (core > 0.5) brightness = 0.7 + seed * 0.18; // never full 1.0 white hole

  const r = Math.min(1, pick.r * brightness);
  const g = Math.min(1, pick.g * brightness);
  const b = Math.min(1, pick.b * brightness);

  const opacity = 0.78 + seed * 0.18;

  // Glow ONLY sparse rim highlights / rare seeds — not the whole core
  let glow = 0;
  if (rim > 0.55 && seed > 0.72) glow = 0.3 + seed * 0.18;
  else if (seed > 0.96) glow = 0.15;

  return { r, g, b, opacity: Math.min(1, opacity), glow: clamp01(glow) };
}

export function buildColorBuffers(positions, count) {
  const colors = new Float32Array(count * 3);
  const opacities = new Float32Array(count);
  const glows = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const seed = hash01(i);
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];
    const c = colorFromField(x, y, z, seed);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
    opacities[i] = c.opacity;
    glows[i] = c.glow;
  }

  return { colors, opacities, glows };
}

/** Floating-field particles — same palette, dimmer and quieter */
export function colorForFieldParticle(seed, depth, y) {
  let base;
  if (y > 0.3) base = seed > 0.55 ? PALETTE.yellow : PALETTE.white;
  else if (y < -0.3) base = seed > 0.55 ? PALETTE.purple : PALETTE.indigo;
  else if (seed > 0.75) base = PALETTE.cyan;
  else if (seed > 0.45) base = PALETTE.purple;
  else if (seed > 0.2) base = PALETTE.yellow;
  else base = PALETTE.magenta;

  // Dimmer than main object
  const brightness = 0.22 + (1 - depth) * 0.42;
  return {
    r: base.r * brightness,
    g: base.g * brightness,
    b: base.b * brightness,
  };
}
