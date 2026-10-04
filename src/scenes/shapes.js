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
    Math.sin(x * 9.1 + y * 7.3 + z * 6.2) * 0.06
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

/** Adaptive count by device */
export function getParticleCount() {
  if (typeof window === 'undefined') return 40000;
  const w = window.innerWidth;
  const cores = navigator.hardwareConcurrency || 4;
  if (w < 640 || cores <= 2) return 20000;
  if (w < 1024 || cores <= 4) return 40000;
  return 70000;
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

/** Dual-hemisphere brain-like shell */
export function createBrain(count) {
  const pos = new Float32Array(count * 3);
  const nOuter = Math.floor(count * 0.82);
  const nCere = Math.floor(count * 0.12);
  const nStem = count - nOuter - nCere;
  let idx = 0;

  for (let i = 0; i < nOuter; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    let d = fibDir(i, nOuter);
    if (side < 0) d = { x: -Math.abs(d.x), y: d.y, z: d.z };
    else d = { x: Math.abs(d.x), y: d.y, z: d.z };

    const ex = 0.7;
    const ey = 0.58;
    const ez = 0.92;
    let ux = d.x;
    let uy = d.y;
    let uz = d.z;
    const len = Math.sqrt(ux * ux + uy * uy + uz * uz) || 1;
    ux /= len;
    uy /= len;
    uz /= len;

    const fold =
      noise3(ux * 3.5, uy * 3.5, uz * 3.5) * 0.07 +
      noise3(ux * 9, uy * 9, uz * 9) * 0.035 +
      noise3(ux * 20, uy * 20, uz * 20) * 0.015;
    const fissure = -0.08 * Math.exp(-(ux * ux) * 20);
    const r = 1.0 + fold + fissure;

    pos[idx * 3] = ux * r * ex + side * 0.24;
    pos[idx * 3 + 1] = uy * r * ey + 0.08;
    pos[idx * 3 + 2] = uz * r * ez;
    idx++;
  }

  for (let j = 0; j < nCere; j++) {
    const side = hash(j) > 0.5 ? 1 : -1;
    const a = hash(j * 1.1) * Math.PI * 2;
    const elev = (hash(j * 2.3) - 0.5) * Math.PI;
    const folio = Math.sin(elev * 16) * 0.03;
    const rx = 0.26 + folio;
    const ry = 0.2;
    const rz = 0.3;
    pos[idx * 3] = side * (0.28 + Math.cos(a) * Math.cos(elev) * rx);
    pos[idx * 3 + 1] = -0.52 + Math.sin(elev) * ry;
    pos[idx * 3 + 2] = 0.55 + Math.sin(a) * Math.cos(elev) * rz;
    idx++;
  }

  for (let j = 0; j < nStem && idx < count; j++) {
    const t = j / Math.max(nStem - 1, 1);
    const a = hash(j * 3.1) * Math.PI * 2;
    const r = 0.1 * (1 - t * 0.5);
    pos[idx * 3] = Math.cos(a) * r;
    pos[idx * 3 + 1] = -0.28 - t * 0.5;
    pos[idx * 3 + 2] = Math.sin(a) * r * 0.7 + 0.1;
    idx++;
  }

  while (idx < count) {
    const d = fibDir(idx, count);
    pos[idx * 3] = d.x * 0.5;
    pos[idx * 3 + 1] = d.y * 0.5;
    pos[idx * 3 + 2] = d.z * 0.5;
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
