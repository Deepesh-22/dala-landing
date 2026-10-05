/**
 * Phase 13 — controlled particle color language.
 *
 * Primary palette (from brief):
 *   #FFFFFF  #F5C400  #8B5CF6  #6366F1  #06B6D4  #22C55E  #EC4899
 *
 * NOT equal-probability random.
 * Spatial fields:
 *   top     → yellow / white
 *   middle  → white / purple / cyan
 *   lower   → yellow / purple / blue
 *   core    → almost entirely white
 *
 * Sophisticated, not flashy. Deep black background stays pure.
 */

import * as THREE from 'three';

export const PALETTE = {
  white: new THREE.Color('#FFFFFF'),
  yellow: new THREE.Color('#F5C400'),
  purple: new THREE.Color('#8B5CF6'),
  indigo: new THREE.Color('#6366F1'),
  cyan: new THREE.Color('#06B6D4'),
  green: new THREE.Color('#22C55E'),
  magenta: new THREE.Color('#EC4899'),
};

// Soft tints for blending (slightly desaturated so nothing neon-pops)
const SOFT = {
  cream: new THREE.Color('#FFF6D6'),
  lilac: new THREE.Color('#E9D5FF'),
  mist: new THREE.Color('#E0E7FF'),
};

function hash01(i) {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}

/**
 * Spatial color for a particle at (x, y, z) in local object space.
 * Returns { color: THREE.Color, opacity: number, glow: number }
 * glow 0–1: how much this particle contributes to the soft additive layer.
 */
export function colorFromField(x, y, z, seed) {
  const elev = y; // up
  const lateral = Math.abs(x);
  const depth = z;

  // Normalized elevation bands (brain-ish scale ~ -0.9 … 0.9)
  const top = clamp01((elev - 0.25) / 0.55);
  const mid = 1 - Math.abs(elev) / 0.55;
  const low = clamp01((-elev - 0.15) / 0.55);

  // Core: near center → almost pure white
  const core =
    clamp01(1 - Math.sqrt(x * x * 1.4 + elev * elev * 1.2 + depth * depth * 0.9) / 0.55);

  // Pick region weights
  let r = 0;
  let g = 0;
  let b = 0;

  // --- Core (dominates when high) — white / cream ---
  if (core > 0.35) {
    const c = seed > 0.55 ? PALETTE.white : SOFT.cream;
    const w = core * core;
    r += c.r * w;
    g += c.g * w;
    b += c.b * w;
  }

  // --- Top band: yellow / white ---
  if (top > 0.05) {
    const pick =
      seed > 0.62
        ? PALETTE.white
        : seed > 0.28
          ? PALETTE.yellow
          : SOFT.cream;
    const w = top * (1 - core * 0.7);
    r += pick.r * w;
    g += pick.g * w;
    b += pick.b * w;
  }

  // --- Middle: white / purple / cyan / indigo ---
  if (mid > 0.15) {
    let pick;
    if (seed > 0.72) pick = PALETTE.white;
    else if (seed > 0.52) pick = PALETTE.purple;
    else if (seed > 0.34) pick = PALETTE.cyan;
    else if (seed > 0.18) pick = PALETTE.indigo;
    else pick = SOFT.mist;
    const w = mid * 0.85 * (1 - core * 0.5);
    r += pick.r * w;
    g += pick.g * w;
    b += pick.b * w;
  }

  // --- Lower: yellow / purple / blue (indigo) ---
  if (low > 0.05) {
    let pick;
    if (seed > 0.7) pick = PALETTE.yellow;
    else if (seed > 0.4) pick = PALETTE.purple;
    else if (seed > 0.18) pick = PALETTE.indigo;
    else pick = PALETTE.cyan;
    const w = low * (1 - core * 0.4);
    r += pick.r * w;
    g += pick.g * w;
    b += pick.b * w;
  }

  // --- Sparse accents (never dominant) ---
  // Magenta: rare, lower-lateral only
  if (low > 0.3 && lateral > 0.35 && seed > 0.93) {
    const w = 0.35;
    r += PALETTE.magenta.r * w;
    g += PALETTE.magenta.g * w;
    b += PALETTE.magenta.b * w;
  }
  // Green: rare mid-lateral
  if (mid > 0.4 && lateral > 0.4 && seed > 0.96 && seed < 0.985) {
    const w = 0.28;
    r += PALETTE.green.r * w;
    g += PALETTE.green.g * w;
    b += PALETTE.green.b * w;
  }

  // Normalize if we accumulated weight
  const maxC = Math.max(r, g, b, 1e-6);
  // Keep relative ratios but allow soft brightness
  const norm = maxC > 1 ? 1 / maxC : 1;
  r = Math.min(1, r * norm);
  g = Math.min(1, g * norm);
  b = Math.min(1, b * norm);

  // Brightness variation — some regions almost pure white, others dimmer
  let brightness = 0.55 + seed * 0.35;
  if (core > 0.5) brightness = 0.85 + seed * 0.15;
  else if (top > 0.5) brightness = 0.7 + seed * 0.25;
  else if (low > 0.5) brightness = 0.5 + seed * 0.3;

  r = Math.min(1, r * brightness);
  g = Math.min(1, g * brightness);
  b = Math.min(1, b * brightness);

  // Opacity: core brighter, outer softer
  const opacity = 0.55 + core * 0.35 + top * 0.1 + seed * 0.12;

  // Glow contribution: whites + yellows + high core
  const isWarm =
    r > 0.75 && g > 0.65 && b < 0.55; // yellow-ish
  const isWhite = r > 0.85 && g > 0.85 && b > 0.85;
  let glow = 0;
  if (isWhite || core > 0.55) glow = 0.55 + seed * 0.35;
  else if (isWarm && top > 0.3) glow = 0.25 + seed * 0.25;
  else if (seed > 0.9) glow = 0.12;

  return {
    r,
    g,
    b,
    opacity: Math.min(1, opacity),
    glow: clamp01(glow),
  };
}

/**
 * Build color + opacity + glow buffers for a position target array.
 */
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

/** Floating-field colors: same palette, much quieter, depth-dimmed */
export function colorForFieldParticle(seed, depth, y) {
  const elev = y; // -1.6 … 1.6 roughly
  let base;
  if (elev > 0.4) {
    base = seed > 0.55 ? PALETTE.white : PALETTE.yellow;
  } else if (elev < -0.35) {
    base = seed > 0.5 ? PALETTE.purple : PALETTE.indigo;
  } else {
    base =
      seed > 0.65
        ? PALETTE.white
        : seed > 0.4
          ? PALETTE.cyan
          : PALETTE.purple;
  }

  // Far = dimmer; keep overall quiet so type stays readable
  const brightness = 0.2 + (1 - depth) * 0.45;
  return {
    r: base.r * brightness,
    g: base.g * brightness,
    b: base.b * brightness,
  };
}
