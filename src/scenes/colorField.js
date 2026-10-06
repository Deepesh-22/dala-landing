/**
 * Reference color language from Dala hero:
 * - Yellow/gold outer cortex rim (strong)
 * - Multi-hue interior: purple, magenta, cyan, green, indigo
 * - Soft core — NO white blast
 * - Sparse white flecks only on rim/mid
 */

import * as THREE from 'three';

export const PALETTE = {
  white: new THREE.Color('#FFFFFF'),
  softWhite: new THREE.Color('#F0ECF5'),
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

export function colorFromField(x, y, z, seed) {
  const elev = y;
  const r2 = x * x + elev * elev * 1.05 + z * z * 0.95;
  const radius = Math.sqrt(r2);

  const rim = clamp01((radius - 0.48) / 0.55);
  const core = clamp01(1 - radius / 0.4);

  let pick;

  if (rim > 0.3) {
    // Outer cortex: predominantly yellow/gold (reference rim)
    if (seed > 0.9) pick = PALETTE.softWhite;
    else if (seed > 0.2) pick = PALETTE.yellow;
    else if (seed > 0.08) pick = PALETTE.gold;
    else pick = PALETTE.amber;
  } else if (core > 0.4) {
    // Core: purple family only — NO pure white
    if (seed > 0.65) pick = PALETTE.deepPurple;
    else if (seed > 0.35) pick = PALETTE.indigo;
    else if (seed > 0.15) pick = PALETTE.purple;
    else pick = PALETTE.violet;
  } else if (elev > 0.18) {
    // Upper mid
    if (seed > 0.7) pick = PALETTE.yellow;
    else if (seed > 0.5) pick = PALETTE.softWhite;
    else if (seed > 0.28) pick = PALETTE.purple;
    else if (seed > 0.12) pick = PALETTE.cyan;
    else pick = PALETTE.green;
  } else if (elev < -0.12) {
    // Lower / stem — yellow + purple mix like reference
    if (seed > 0.55) pick = PALETTE.yellow;
    else if (seed > 0.32) pick = PALETTE.gold;
    else if (seed > 0.15) pick = PALETTE.purple;
    else pick = PALETTE.magenta;
  } else {
    // Mid band — full multi-hue discrete
    if (seed > 0.92) pick = PALETTE.softWhite;
    else if (seed > 0.78) pick = PALETTE.yellow;
    else if (seed > 0.62) pick = PALETTE.purple;
    else if (seed > 0.48) pick = PALETTE.magenta;
    else if (seed > 0.34) pick = PALETTE.cyan;
    else if (seed > 0.2) pick = PALETTE.green;
    else if (seed > 0.1) pick = PALETTE.indigo;
    else pick = PALETTE.violet;
  }

  let brightness = 0.78 + seed * 0.18;
  if (rim > 0.35) brightness = 0.92 + seed * 0.08;
  if (core > 0.4) brightness = 0.5 + seed * 0.22; // dim core

  const r = Math.min(1, pick.r * brightness);
  const g = Math.min(1, pick.g * brightness);
  const b = Math.min(1, pick.b * brightness);

  const opacity = 0.88 + seed * 0.1;

  let glow = 0;
  if (rim > 0.55 && seed > 0.75) glow = 0.2 + seed * 0.12;

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
  if (y > 0.3) base = seed > 0.5 ? PALETTE.yellow : PALETTE.softWhite;
  else if (y < -0.3) base = seed > 0.5 ? PALETTE.purple : PALETTE.indigo;
  else if (seed > 0.7) base = PALETTE.cyan;
  else if (seed > 0.4) base = PALETTE.purple;
  else if (seed > 0.2) base = PALETTE.yellow;
  else base = PALETTE.magenta;

  const brightness = 0.25 + (1 - depth) * 0.4;
  return {
    r: base.r * brightness,
    g: base.g * brightness,
    b: base.b * brightness,
  };
}
