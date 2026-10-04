/**
 * Procedural particle positions.
 * Brain = realistic lateral silhouette (cerebrum + cerebellum + brainstem).
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
  if (typeof window === 'undefined') return 45000;
  const w = window.innerWidth;
  const cores = navigator.hardwareConcurrency || 4;
  if (w < 640 || cores <= 2) return 25000;
  if (w < 1024 || cores <= 4) return 50000;
  return 80000;
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
  const R = 2.8;
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
 * Anatomical lateral brain (matches typical medical side view):
 *   +X = posterior (occipital / back)
 *   -X = anterior (frontal / front)
 *   +Y = superior (top)
 *   -Y = inferior
 *   Z  = thickness
 *
 * Parts: cerebrum (gyri), temporal bulge, cerebellum, brainstem.
 */
export function createBrain(count) {
  const pos = new Float32Array(count * 3);
  const nCortex = Math.floor(count * 0.68);
  const nTemporal = Math.floor(count * 0.08);
  const nCere = Math.floor(count * 0.14);
  const nStem = Math.floor(count * 0.07);
  const nInner = count - nCortex - nTemporal - nCere - nStem;
  let idx = 0;

  // ── Cerebrum — deformed ellipsoid with deep gyri ─────────────
  for (let i = 0; i < nCortex; i++) {
    const d = fibDir(i, nCortex);
    let ux = d.x;
    let uy = d.y;
    let uz = d.z;

    // Base radii: longer front-back, shorter height
    let rx = 1.2;
    let ry = 0.78;
    let rz = 0.72;

    // Frontal pole (−X): project forward, slightly lower
    if (ux < 0) {
      rx *= 1.08;
      uy -= 0.06 * Math.abs(ux);
    }

    // Occipital (+X): rounded back, slightly higher crown transition
    if (ux > 0.2) {
      rx *= 0.95;
      ry *= 1.02;
    }

    // Flatten underside of cerebrum (room for cerebellum)
    if (uy < -0.15) {
      ry *= 0.7;
      // Carve rear underside so cerebellum sits cleanly
      if (ux > 0.1) uy *= 0.75;
    }

    // Crown dome
    if (uy > 0.3) {
      ry *= 1.06;
    }

    // Deep gyri / sulci — stronger than before
    const g1 = noise3(ux * 5.5, uy * 5.5, uz * 5.5);
    const g2 = noise3(ux * 14, uy * 14, uz * 14);
    const g3 = noise3(ux * 32, uy * 32, uz * 32);
    // Parallel ridge bands (like sulci running roughly front-back)
    const ridges =
      Math.sin(uy * 16 + ux * 4) * 0.028 +
      Math.sin(uy * 28 - ux * 6) * 0.015 +
      Math.sin(ux * 12 + uy * 8) * 0.012;

    const fold = g1 * 0.06 + g2 * 0.035 + g3 * 0.018 + ridges;

    // Surface shell only
    const shell = 0.88 + hash(i * 0.9) * 0.12;
    const r = (1.0 + fold) * shell;

    pos[idx * 3] = ux * r * rx;
    pos[idx * 3 + 1] = uy * r * ry + 0.22;
    pos[idx * 3 + 2] = uz * r * rz;
    idx++;
  }

  // ── Temporal lobe — lower anterior bulge ─────────────────────
  for (let j = 0; j < nTemporal; j++) {
    const d = fibDir(j, nTemporal);
    const rx = 0.42;
    const ry = 0.32;
    const rz = 0.38;
    pos[idx * 3] = -0.55 + d.x * rx;
    pos[idx * 3 + 1] = -0.15 + d.y * ry;
    pos[idx * 3 + 2] = 0.35 + d.z * rz * 0.8; // slightly lateral
    idx++;
  }

  // ── Cerebellum — rear-inferior, striated folia ───────────────
  for (let j = 0; j < nCere; j++) {
    const d = fibDir(j, nCere);
    // Strong horizontal foliation
    const folio = Math.sin(d.y * 28 + d.x * 6) * 0.035;
    const rx = 0.36 + folio;
    const ry = 0.28;
    const rz = 0.4;

    pos[idx * 3] = 0.62 + d.x * rx * 0.85; // posterior
    pos[idx * 3 + 1] = -0.48 + d.y * ry;
    pos[idx * 3 + 2] = d.z * rz;
    idx++;
  }

  // ── Brainstem — drops from mid-rear under cerebellum ─────────
  for (let j = 0; j < nStem; j++) {
    const t = j / Math.max(nStem - 1, 1);
    const a = hash(j * 3.7) * Math.PI * 2;
    // Tapers slightly as it goes down
    const r = 0.1 * (1 - t * 0.35);
    const wobble = (hash(j * 1.2) - 0.5) * 0.04;

    pos[idx * 3] = 0.2 + wobble + Math.sin(a) * r * 0.4;
    pos[idx * 3 + 1] = -0.35 - t * 0.7;
    pos[idx * 3 + 2] = Math.cos(a) * r;
    idx++;
  }

  // ── Sparse inner volume ──────────────────────────────────────
  for (let j = 0; j < nInner && idx < count; j++) {
    const d = fibDir(j + 50, nInner);
    const r = 0.25 + hash(j) * 0.4;
    pos[idx * 3] = d.x * r * 0.85;
    pos[idx * 3 + 1] = d.y * r * 0.55 + 0.15;
    pos[idx * 3 + 2] = d.z * r * 0.5;
    idx++;
  }

  while (idx < count) {
    pos[idx * 3] = 0;
    pos[idx * 3 + 1] = 0;
    pos[idx * 3 + 2] = 0;
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
