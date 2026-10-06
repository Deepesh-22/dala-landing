/**
 * Kill white core blowout. Yellow rim. Multi-hue interior.
 * Core: purple/indigo only — almost ZERO pure white.
 */

import * as THREE from 'three';

export const PALETTE = {
  white: new THREE.Color('#FFFFFF'),
  softWhite: new THREE.Color('#E8E4F0'),
  yellow: new THREE.Color('#F5C400'),
  gold: new THREE.Color('#E8B84A'),
  purple: new THREE.Color('#8B5CF6'),
  indigo: new THREE.Color('#6366F1'),
  cyan: new THREE.Color('#06B6D4'),
  green: new THREE.Color('#22C55E'),
  magenta: new THREE.Color('#EC4899'),
  violet: new THREE.Color('#A78BFA'),
  deepPurple: new THREE.Color('#5B21B6'),
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
  const r2 = x * x + elev * elev * 1.1 + z * z * 0.95;
  const radius = Math.sqrt(r2);

  const rim = clamp01((radius - 0.55) / 0.55);
  const core = clamp01(1 - radius / 0.38);

  let pick;

  if (rim > 0.35) {
    // Outer cortex: yellow/gold dominant — this is the reference rim
    if (seed > 0.92) pick = PALETTE.softWhite;
    else if (seed > 0.25) pick = PALETTE.yellow;
    else pick = PALETTE.gold;
  } else if (core > 0.35) {
    // CORE — NO pure white. Deep purple / indigo / violet only.
    // This kills the white hole.
    if (seed > 0.7) pick = PALETTE.deepPurple;
    else if (seed > 0.4) pick = PALETTE.indigo;
    else if (seed > 0.2) pick = PALETTE.purple;
    else pick = PALETTE.violet;
  } else if (elev > 0.2) {
    if (seed > 0.75) pick = PALETTE.yellow;
    else if (seed > 0.55) pick = PALETTE.softWhite;
    else if (seed > 0.3) pick = PALETTE.purple;
    else pick = PALETTE.cyan;
  } else if (elev < -0.15) {
    if (seed > 0.7) pick = PALETTE.yellow;
    else if (seed > 0.45) pick = PALETTE.purple;
    else if (seed > 0.25) pick = PALETTE.indigo;
    else pick = PALETTE.magenta;
  } else {
    // Mid multi-hue — sparse soft white only
    if (seed > 0.93) pick = PALETTE.softWhite;
    else if (seed > 0.78) pick = PALETTE.yellow;
    else if (seed > 0.62) pick = PALETTE.purple;
    else if (seed > 0.48) pick = PALETTE.magenta;
    else if (seed > 0.34) pick = PALETTE.cyan;
    else if (seed > 0.2) pick = PALETTE.green;
    else if (seed > 0.1) pick = PALETTE.indigo;
    else pick = PALETTE.violet;
  }

  // Brightness: rim bright, core DIMMED hard
  let brightness = 0.72 + seed * 0.2;
  if (rim > 0.4) brightness = 0.9 + seed * 0.1;
  if (core > 0.35) brightness = 0.45 + seed * 0.2; // dark core — no white hole

  const r = Math.min(0.95, pick.r * brightness);
  const g = Math.min(0.95, pick.g * brightness);
  const b = Math.min(0.95, pick.b * brightness);

  const opacity = 0.85 + seed * 0.12;

  // Glow ONLY sparse outer rim — never core
  let glow = 0;
  if (rim > 0.6 && seed > 0.8) glow = 0.22 + seed * 0.12;

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
  if (y > 0.3) base = seed > 0.55 ? PALETTE.yellow : PALETTE.softWhite;
  else if (y < -0.3) base = seed > 0.55 ? PALETTE.purple : PALETTE.indigo;
  else if (seed > 0.75) base = PALETTE.cyan;
  else if (seed > 0.45) base = PALETTE.purple;
  else if (seed > 0.2) base = PALETTE.yellow;
  else base = PALETTE.magenta;

  const brightness = 0.2 + (1 - depth) * 0.38;
  return {
    r: base.r * brightness,
    g: base.g * brightness,
    b: base.b * brightness,
  };
}
