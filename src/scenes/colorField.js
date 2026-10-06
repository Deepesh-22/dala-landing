/**
 * Reference Dala color language:
 * Yellow ONLY on outermost cortex rim (~15–20%)
 * Interior: purple, magenta, cyan, green, indigo, white flecks
 * Soft core — never solid white or solid yellow
 */

import * as THREE from 'three';

export const PALETTE = {
  white: new THREE.Color('#FFFFFF'),
  softWhite: new THREE.Color('#EDE9F5'),
  yellow: new THREE.Color('#F5C400'),
  gold: new THREE.Color('#E8A820'),
  amber: new THREE.Color('#FFB829'),
  purple: new THREE.Color('#8B5CF6'),
  indigo: new THREE.Color('#6366F1'),
  cyan: new THREE.Color('#06B6D4'),
  green: new THREE.Color('#22C55E'),
  magenta: new THREE.Color('#EC4899'),
  violet: new THREE.Color('#A78BFA'),
  deepPurple: new THREE.Color('#6D28D9'),
};

function hash01(i) {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}

/**
 * Spatial color field matching the reference hero screenshot.
 * Yellow is restricted to the outer shell only.
 */
export function colorFromField(x, y, z, seed) {
  const elev = y;
  const r2 = x * x + elev * elev * 1.1 + z * z * 0.95;
  const radius = Math.sqrt(r2);

  // Outer shell only (true cortex rim)
  const outerRim = radius > 0.88;
  const nearRim = radius > 0.72 && radius <= 0.88;
  const mid = radius > 0.35 && radius <= 0.72;
  const core = radius <= 0.35;

  let pick;

  if (outerRim) {
    // ~15% of surface — strong yellow/gold like reference
    if (seed > 0.85) pick = PALETTE.softWhite;
    else if (seed > 0.12) pick = PALETTE.yellow;
    else pick = PALETTE.gold;
  } else if (nearRim) {
    // Transition band — mix yellow + multi-hue
    if (seed > 0.72) pick = PALETTE.yellow;
    else if (seed > 0.55) pick = PALETTE.softWhite;
    else if (seed > 0.38) pick = PALETTE.purple;
    else if (seed > 0.22) pick = PALETTE.magenta;
    else if (seed > 0.1) pick = PALETTE.cyan;
    else pick = PALETTE.violet;
  } else if (core) {
    // Soft purple core — no white blast
    if (seed > 0.6) pick = PALETTE.deepPurple;
    else if (seed > 0.3) pick = PALETTE.indigo;
    else if (seed > 0.12) pick = PALETTE.purple;
    else pick = PALETTE.violet;
  } else if (elev > 0.25) {
    // Upper interior
    if (seed > 0.82) pick = PALETTE.softWhite;
    else if (seed > 0.68) pick = PALETTE.yellow;
    else if (seed > 0.5) pick = PALETTE.purple;
    else if (seed > 0.32) pick = PALETTE.cyan;
    else if (seed > 0.16) pick = PALETTE.green;
    else pick = PALETTE.magenta;
  } else if (elev < -0.15) {
    // Lower / stem region
    if (seed > 0.7) pick = PALETTE.yellow;
    else if (seed > 0.5) pick = PALETTE.gold;
    else if (seed > 0.3) pick = PALETTE.purple;
    else if (seed > 0.15) pick = PALETTE.magenta;
    else pick = PALETTE.indigo;
  } else {
    // Mid interior — full multi-hue mosaic (reference look)
    if (seed > 0.88) pick = PALETTE.softWhite;
    else if (seed > 0.75) pick = PALETTE.yellow;
    else if (seed > 0.6) pick = PALETTE.purple;
    else if (seed > 0.46) pick = PALETTE.magenta;
    else if (seed > 0.32) pick = PALETTE.cyan;
    else if (seed > 0.18) pick = PALETTE.green;
    else if (seed > 0.08) pick = PALETTE.indigo;
    else pick = PALETTE.violet;
  }

  let brightness = 0.82 + seed * 0.16;
  if (outerRim) brightness = 0.95 + seed * 0.05;
  if (core) brightness = 0.55 + seed * 0.25;

  return {
    r: Math.min(1, pick.r * brightness),
    g: Math.min(1, pick.g * brightness),
    b: Math.min(1, pick.b * brightness),
    opacity: 0.9 + seed * 0.08,
    glow: outerRim && seed > 0.7 ? 0.25 + seed * 0.15 : 0,
  };
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
  if (y > 0.3) base = seed > 0.55 ? PALETTE.yellow : PALETTE.softWhite;
  else if (y < -0.3) base = seed > 0.5 ? PALETTE.purple : PALETTE.indigo;
  else if (seed > 0.7) base = PALETTE.cyan;
  else if (seed > 0.45) base = PALETTE.purple;
  else if (seed > 0.25) base = PALETTE.yellow;
  else base = PALETTE.magenta;

  const brightness = 0.28 + (1 - depth) * 0.4;
  return {
    r: base.r * brightness,
    g: base.g * brightness,
    b: base.b * brightness,
  };
}
