/**
 * Procedural target positions for the particle field.
 * Returns Float32Array length count * 3.
 */

function hash(n) {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

function noise3(x, y, z) {
  return (
    Math.sin(x * 1.7 + y * 2.3 + z * 1.1) * 0.5 +
    Math.sin(x * 3.1 - y * 1.9 + z * 2.7) * 0.25 +
    Math.sin(x * 5.3 + y * 4.1 - z * 3.2) * 0.125 +
    Math.sin(x * 9.1 + y * 7.3 + z * 6.2) * 0.06 +
    Math.sin(x * 17.0 + y * 13.0 + z * 11.0) * 0.03
  );
}

function fibDir(i, count) {
  const t = i / Math.max(count, 1);
  const inclination = Math.acos(1 - 2 * Math.min(1, Math.max(0, t)));
  const azimuth = Math.PI * (1 + Math.sqrt(5)) * i;
  return {
    x: Math.sin(inclination) * Math.cos(azimuth),
    y: Math.cos(inclination),
    z: Math.sin(inclination) * Math.sin(azimuth),
  };
}

export function getParticleCount() {
  if (typeof window === 'undefined') return 40000;
  const w = window.innerWidth;
  const cores = navigator.hardwareConcurrency || 4;
  if (w < 640 || cores <= 2) return 22000;
  if (w < 1024 || cores <= 4) return 45000;
  return 75000;
}

export function createSphere(count) {
  const pos = new Float32Array(count * 3);
  const R = 1.15;
  for (let i = 0; i < count; i++) {
    const d = fibDir(i, count);
    const n = noise3(d.x * 2, d.y * 2, d.z * 2) * 0.04;
    pos[i * 3] = d.x * (R + n);
    pos[i * 3 + 1] = d.y * (R + n);
    pos[i * 3 + 2] = d.z * (R + n);
  }
  return pos;
}

export function createScatter(count) {
  const pos = new Float32Array(count * 3);
  const R = 2.6;
  for (let i = 0; i < count; i++) {
    const d = fibDir(i, count);
    const u = hash(i * 0.73 + 1.1);
    const r = Math.cbrt(u) * R;
    const n = noise3(d.x * 2.1, d.y * 2.1, d.z * 2.1) * 0.15;
    pos[i * 3] = d.x * (r + n);
    pos[i * 3 + 1] = d.y * (r + n) * 0.85;
    pos[i * 3 + 2] = d.z * (r + n);
  }
  return pos;
}

/**
 * Anatomical brain from a slightly elevated front-3/4 view.
 * - Wider than tall (cerebral proportions)
 * - Deep longitudinal fissure (clear left/right split)
 * - Gyri ridges + sulci grooves via multi-octave noise
 * - Cerebellum as lower-rear paired lobes
 * - Thin brainstem taper
 * Surface shell only (not volume fill) so silhouette reads
 */
export function createBrain(count) {
  const pos = new Float32Array(count * 3);
  const nCortex = Math.floor(count * 0.78);
  const nMedial = Math.floor(count * 0.06);
  const nCere = Math.floor(count * 0.12);
  const nStem = count - nCortex - nMedial - nCere;
  let idx = 0;

  // Ellipsoid radii — brain is wider (X) and longer front-back (Z) than tall (Y)
  const RX = 1.05;
  const RY = 0.72;
  const RZ = 1.2;
  const HEMI_GAP = 0.32; // center-to-center offset per hemisphere

  // ── Cortex: two offset ellipsoids, surface shell ──────────────
  for (let i = 0; i < nCortex; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    // Fibonacci on hemisphere (force X toward outer side)
    let d = fibDir(Math.floor(i / 2), Math.ceil(nCortex / 2));
    // Prefer outer surface; avoid filling medial gap
    let ux = Math.abs(d.x) * side;
    let uy = d.y;
    let uz = d.z;

    // Bias samples toward lateral surface so fissure stays open
    const lat = 0.55 + 0.45 * Math.abs(ux);
    ux *= lat;

    const len = Math.sqrt(ux * ux + uy * uy + uz * uz) || 1;
    ux /= len;
    uy /= len;
    uz /= len;

    // Multi-octave gyri / sulci
    const g1 = noise3(ux * 4.2, uy * 4.2, uz * 4.2);
    const g2 = noise3(ux * 11, uy * 11, uz * 11);
    const g3 = noise3(ux * 24, uy * 24, uz * 24);
    // Directional ridges (central sulcus-ish bands)
    const ridge =
      Math.sin(uy * 9.0 + uz * 3.5) * 0.025 +
      Math.sin(uz * 7.0 - uy * 2.0) * 0.018;

    const fold = g1 * 0.055 + g2 * 0.03 + g3 * 0.015 + ridge;

    // Longitudinal fissure: push away from midline
    const fissurePush = 0.04 * Math.exp(-ux * ux * 8);

    // Flatten underside slightly (brain sits on tentorium)
    let yScale = RY;
    if (uy < -0.2) yScale *= 0.88;

    // Frontal pole slightly taller, occipital flatter
    const frontBias = 1.0 + uz * 0.06;

    const r = (1.0 + fold) * frontBias;

    pos[idx * 3] = ux * r * RX + side * HEMI_GAP + side * fissurePush;
    pos[idx * 3 + 1] = uy * r * yScale + 0.12;
    pos[idx * 3 + 2] = uz * r * RZ;
    idx++;
  }

  // ── Medial walls lining the fissure ──────────────────────────
  for (let j = 0; j < nMedial; j++) {
    const side = j % 2 === 0 ? -1 : 1;
    const t = j / Math.max(nMedial - 1, 1);
    const elev = (hash(j * 1.7) - 0.5) * 1.1;
    const depth = (hash(j * 2.9) - 0.5) * 1.6;
    const wallX = side * (HEMI_GAP * 0.55 + hash(j) * 0.04);
    pos[idx * 3] = wallX;
    pos[idx * 3 + 1] = elev * RY * 0.85 + 0.12;
    pos[idx * 3 + 2] = depth * RZ * 0.75;
    idx++;
  }

  // ── Cerebellum: two small lobes under-rear ───────────────────
  for (let j = 0; j < nCere; j++) {
    const side = hash(j * 0.5) > 0.5 ? 1 : -1;
    const a = hash(j * 1.1) * Math.PI * 2;
    const elev = (hash(j * 2.3) - 0.55) * Math.PI * 0.85;
    // Foliation stripes
    const folio = Math.sin(elev * 18 + a * 2) * 0.022;
    const rx = 0.28 + folio;
    const ry = 0.18;
    const rz = 0.32;
    pos[idx * 3] =
      side * (0.22 + Math.cos(a) * Math.cos(elev) * rx);
    pos[idx * 3 + 1] = -0.48 + Math.sin(elev) * ry;
    pos[idx * 3 + 2] = 0.72 + Math.sin(a) * Math.cos(elev) * rz;
    idx++;
  }

  // ── Brainstem ────────────────────────────────────────────────
  for (let j = 0; j < nStem && idx < count; j++) {
    const t = j / Math.max(nStem - 1, 1);
    const a = hash(j * 3.1) * Math.PI * 2;
    const r = 0.09 * (1 - t * 0.55);
    pos[idx * 3] = Math.cos(a) * r;
    pos[idx * 3 + 1] = -0.22 - t * 0.55;
    pos[idx * 3 + 2] = 0.15 + Math.sin(a) * r * 0.6;
    idx++;
  }

  while (idx < count) {
    const d = fibDir(idx, count);
    pos[idx * 3] = d.x * 0.4;
    pos[idx * 3 + 1] = d.y * 0.3;
    pos[idx * 3 + 2] = d.z * 0.4;
    idx++;
  }

  return pos;
}

export function createBulb(count) {
  const pos = new Float32Array(count * 3);
  const nGlobe = Math.floor(count * 0.55);
  const nNeck = Math.floor(count * 0.25);
  const nBase = count - nGlobe - nNeck;
  let idx = 0;

  for (let i = 0; i < nGlobe; i++) {
    const d = fibDir(i, nGlobe);
    const r = 0.88 + noise3(d.x * 3, d.y * 3, d.z * 3) * 0.05;
    pos[idx * 3] = d.x * r;
    pos[idx * 3 + 1] = d.y * r * 0.95 + 0.55;
    pos[idx * 3 + 2] = d.z * r;
    idx++;
  }
  for (let i = 0; i < nNeck; i++) {
    const t = i / Math.max(nNeck - 1, 1);
    const a = hash(i * 0.7) * Math.PI * 2;
    const radius = 0.26 * (1 - t * 0.55);
    pos[idx * 3] = Math.cos(a) * radius;
    pos[idx * 3 + 1] = 0.5 - t * 0.75;
    pos[idx * 3 + 2] = Math.sin(a) * radius;
    idx++;
  }
  for (let i = 0; i < nBase && idx < count; i++) {
    const a = (i / nBase) * Math.PI * 2;
    const r = Math.sqrt(hash(i * 0.9)) * 0.4;
    pos[idx * 3] = Math.cos(a) * r;
    pos[idx * 3 + 1] = -0.22;
    pos[idx * 3 + 2] = Math.sin(a) * r;
    idx++;
  }
  return pos;
}

export function createAbstract(count) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const t = i / Math.max(count - 1, 1);
    const angle = t * Math.PI * 5.5;
    const twist = t * Math.PI * 3.2;
    const radius =
      0.5 + 0.4 * Math.sin(t * Math.PI * 2.5) + 0.1 * Math.sin(t * Math.PI * 7);
    const elev = (t - 0.5) * 2.3;
    const cx = Math.cos(angle) * radius;
    const cy = elev + Math.sin(twist) * 0.22;
    const cz = Math.sin(angle) * radius * 0.85;
    const d = fibDir(i * 3 + 11, count * 2);
    const tube = 0.22 + noise3(cx, cy, cz) * 0.06;
    pos[i * 3] = cx + d.x * tube * 0.5;
    pos[i * 3 + 1] = cy + d.y * tube;
    pos[i * 3 + 2] = cz + d.z * tube * 0.5;
  }
  return pos;
}

export const SHAPE_FNS = {
  sphere: createSphere,
  brain: createBrain,
  bulb: createBulb,
  scatter: createScatter,
  abstract: createAbstract,
};

export function generateShape(name, count) {
  const fn = SHAPE_FNS[name] || createSphere;
  return fn(count);
}
