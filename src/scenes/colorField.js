/**
 * Color language matched to reference Dala:
 * - Yellow / gold rim on outer cortex
 * - Multi-hue interior (purple, magenta, cyan, green, indigo)
 * - Soft white highlights, NOT a blown-out white core
 * - Discrete per-particle picks (not blended mush)
 */

import * as THREE from 'three';

export const PALETTE = {
  white: new THREE.Color('#FFFFFF'),
  yellow: new THREE.Color('#F5C400'),
  gold: new THREE.Color('#E8B84A'),
  purple: new THREE.Color('#9B5DE5'),
  indigo: new THREE.Color('#6366F1'),
  cyan: new THREE.Color('#22D3EE'),
  green: new THREE.Color('#34D399'),
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
 * Reference-style: surface particles get strong yellow rim;
 * interior gets rainbow discrete colors; core is soft not blown.
 */
export function colorFromField(x, y, z, seed) {
  const elev = y;
  const r2 = x * x + elev * elev * 1.1 + z * z * 0.95;
  const radius = Math.sqrt(r2);

  // Surface rim (outer shell) — yellow dominant like reference
  const rim = clamp01((radius - 0.55) / 0.55);
  // Interior
  const interior = clamp01(1 - radius / 0.7);
  // Soft core (NOT pure white blast)
  const core = clamp01(1 - radius / 0.35);

  let pick;

  if (rim > 0.45) {
    // Outer cortex: mostly yellow/gold with occasional white
    if (seed > 0.82) pick = PALETTE.white;
    else if (seed > 0.35) pick = PALETTE.yellow;
    else pick = PALETTE.gold;
  } else if (core > 0.55) {
    // Core: soft white + lilac, not blown
    if (seed > 0.5) pick = PALETTE.white;
    else if (seed > 0.25) pick = PALETTE.violet;
    else pick = PALETTE.indigo;
  } else if (elev > 0.2) {
    // Upper mid: yellow, white, purple
    if (seed > 0.7) pick = PALETTE.yellow;
    else if (seed > 0.45) pick = PALETTE.white;
    else if (seed > 0.25) pick = PALETTE.purple;
    else pick = PALETTE.cyan;
  } else if (elev < -0.15) {
    // Lower / stem region: yellow, purple, indigo
    if (seed > 0.65) pick = PALETTE.yellow;
    else if (seed > 0.4) pick = PALETTE.purple;
    else if (seed > 0.2) pick = PALETTE.indigo;
    else pick = PALETTE.magenta;
  } else {
    // Mid band: full multi-hue like reference interior
    if (seed > 0.85) pick = PALETTE.white;
    else if (seed > 0.7) pick = PALETTE.yellow;
    else if (seed > 0.55) pick = PALETTE.purple;
    else if (seed > 0.4) pick = PALETTE.magenta;
    else if (seed > 0.28) pick = PALETTE.cyan;
    else if (seed > 0.15) pick = PALETTE.green;
    else if (seed > 0.07) pick = PALETTE.indigo;
    else pick = PALETTE.violet;
  }

  // Brightness — rim bright, core moderated (no white hole)
  let brightness = 0.72 + seed * 0.28;
  if (rim > 0.5) brightness = 0.85 + seed * 0.15;
  if (core > 0.6) brightness = 0.7 + seed * 0.2; // was 0.85–1.0 → blowout

  const r = Math.min(1, pick.r * brightness);
  const g = Math.min(1, pick.g * brightness);
  const b = Math.min(1, pick.b * brightness);

  const opacity = 0.75 + seed * 0.2;

  // Glow only sparse highlights — not the whole core
  let glow = 0;
  if (rim > 0.55 && seed > 0.7) glow = 0.35 + seed * 0.2;
  else if (seed > 0.94) glow = 0.2;

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

export function colorForFieldParticle(seed, depth, y) {
  let base;
  if (y > 0.3) base = seed > 0.5 ? PALETTE.yellow : PALETTE.white;
  else if (y < -0.3) base = seed > 0.5 ? PALETTE.purple : PALETTE.indigo;
  else if (seed > 0.7) base = PALETTE.cyan;
  else if (seed > 0.4) base = PALETTE.purple;
  else base = PALETTE.yellow;

  const brightness = 0.25 + (1 - depth) * 0.5;
  return {
    r: base.r * brightness,
    g: base.g * brightness,
    b: base.b * brightness,
  };
}
