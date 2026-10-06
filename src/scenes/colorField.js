/**
 * Colors matching https://dala.craftedbygc.com reference hero:
 * Yellow/gold cortex rim, multi-hue interior, soft core (no white blast).
 */
import * as THREE from 'three';

const YELLOW = new THREE.Color('#F5C400');
const GOLD = new THREE.Color('#E8A820');
const WHITE = new THREE.Color('#F5F0FF');
const PURPLE = new THREE.Color('#8B5CF6');
const INDIGO = new THREE.Color('#6366F1');
const CYAN = new THREE.Color('#06B6D4');
const GREEN = new THREE.Color('#22C55E');
const MAGENTA = new THREE.Color('#EC4899');
const VIOLET = new THREE.Color('#A78BFA');
const DEEP = new THREE.Color('#5B21B6');

function h(i) {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function colorFromField(x, y, z, seed) {
  const r = Math.sqrt(x * x + y * y * 1.1 + z * z * 0.95);

  let c;
  if (r > 0.9) {
    // Outer rim — mostly yellow (reference cortex)
    c = seed > 0.88 ? WHITE : seed > 0.15 ? YELLOW : GOLD;
  } else if (r > 0.7) {
    // Near rim — yellow + color mix
    if (seed > 0.7) c = YELLOW;
    else if (seed > 0.55) c = WHITE;
    else if (seed > 0.4) c = PURPLE;
    else if (seed > 0.25) c = MAGENTA;
    else if (seed > 0.12) c = CYAN;
    else c = VIOLET;
  } else if (r < 0.32) {
    // Soft core — purple only
    c = seed > 0.5 ? DEEP : seed > 0.25 ? INDIGO : PURPLE;
  } else if (y > 0.2) {
    if (seed > 0.8) c = WHITE;
    else if (seed > 0.65) c = YELLOW;
    else if (seed > 0.45) c = PURPLE;
    else if (seed > 0.3) c = CYAN;
    else if (seed > 0.15) c = GREEN;
    else c = MAGENTA;
  } else if (y < -0.15) {
    if (seed > 0.65) c = YELLOW;
    else if (seed > 0.4) c = GOLD;
    else if (seed > 0.2) c = PURPLE;
    else c = MAGENTA;
  } else {
    // Mid — full mosaic
    if (seed > 0.88) c = WHITE;
    else if (seed > 0.74) c = YELLOW;
    else if (seed > 0.58) c = PURPLE;
    else if (seed > 0.44) c = MAGENTA;
    else if (seed > 0.3) c = CYAN;
    else if (seed > 0.16) c = GREEN;
    else if (seed > 0.08) c = INDIGO;
    else c = VIOLET;
  }

  const bright = r > 0.9 ? 0.95 : r < 0.32 ? 0.55 + seed * 0.25 : 0.8 + seed * 0.18;
  return {
    r: Math.min(1, c.r * bright),
    g: Math.min(1, c.g * bright),
    b: Math.min(1, c.b * bright),
    opacity: 0.92,
    glow: r > 0.92 && seed > 0.8 ? 0.2 : 0,
  };
}

export function buildColorBuffers(positions, count) {
  const colors = new Float32Array(count * 3);
  const opacities = new Float32Array(count);
  const glows = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const c = colorFromField(
      positions[i * 3],
      positions[i * 3 + 1],
      positions[i * 3 + 2],
      h(i)
    );
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
    opacities[i] = c.opacity;
    glows[i] = c.glow;
  }
  return { colors, opacities, glows };
}

export function colorForFieldParticle(seed, depth, y) {
  let c;
  if (y > 0.3) c = seed > 0.5 ? YELLOW : WHITE;
  else if (y < -0.3) c = seed > 0.5 ? PURPLE : INDIGO;
  else if (seed > 0.65) c = CYAN;
  else if (seed > 0.4) c = PURPLE;
  else if (seed > 0.2) c = YELLOW;
  else c = MAGENTA;
  const b = 0.3 + (1 - depth) * 0.4;
  return { r: c.r * b, g: c.g * b, b: c.b * b };
}
