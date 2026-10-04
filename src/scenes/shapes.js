/**
 * Procedural particle positions.
 * Brain = dual cerebral hemispheres + longitudinal fissure + gyri/sulci.
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

/** Keep counts modest — high counts freeze the main thread */
export function getParticleCount() {
  if (typeof window === 'undefined') return 10000;
  const w = window.innerWidth;
  if (w < 640) return 6000;
  if (w < 1024) return 9000;
  return 12000;
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

export function createBrain(count) {
  const pos = new Float32Array(count * 3);
  const nCortex = Math.floor(count * 0.74);
  const nMedial = Math.floor(count * 0.05);
  const nCere = Math.floor(count * 0.12);
  const nStem = Math.floor(count * 0.06);
  const nFill = count - nCortex - nMedial - nCere - nStem;
  let idx = 0;

  const HEMI_X = 0.48;
  const RX = 0.68;
  const RY = 0.66;
  const RZ = 1.08;

  for (let i = 0; i < nCortex; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const hemiIndex = Math.floor(i / 2);
    const hemiCount = Math.ceil(nCortex / 2);
    const d = fibDir(hemiIndex, hemiCount);

    let lx = Math.abs(d.x) * 0.5 + 0.5;
    let ly = d.y;
    let lz = d.z;

    const asym = side < 0 ? 0.96 : 1.04;
    const asymY = side < 0 ? 1.02 : 0.98;

    let len = Math.sqrt(lx * lx + ly * ly + lz * lz) || 1;
    lx /= len;
    ly /= len;
    lz /= len;

    let rx = RX * asym;
    let ry = RY * asymY;
    let rz = RZ;

    if (lz > 0.25) {
      rz *= 1.08;
      ry *= 0.95;
      ly -= 0.05 * lz;
    }
    if (lz < -0.2) {
      rx *= 0.86;
      rz *= 0.9;
    }
    if (ly > 0.2) {
      rx *= 1.1;
      ry *= 1.06;
    }
    if (ly < -0.15) {
      ry *= 0.7;
      if (lz < 0) ly *= 0.82;
    }

    const g1 = noise3(lx * 6 + side, ly * 6, lz * 6);
    const g2 = noise3(lx * 14, ly * 14 + side * 2, lz * 14);
    const g3 = noise3(lx * 28, ly * 28, lz * 28 + side);
    const sulcus1 = Math.sin(lz * 9.0 + ly * 5.0) * 0.024;
    const sulcus2 = Math.sin(ly * 18.0 - lz * 7.0 + lx * 3.0) * 0.02;
    const fold = g1 * 0.052 + g2 * 0.034 + g3 * 0.02 + sulcus1 + sulcus2;

    const shell = 0.9 + hash(i * 1.3) * 0.1;
    const r = (1.0 + fold) * shell;
    const fissureGap = 0.1;

    pos[idx * 3] = side * (HEMI_X + fissureGap * (1.15 - lx)) + side * lx * r * rx;
    pos[idx * 3 + 1] = ly * r * ry + 0.15;
    pos[idx * 3 + 2] = lz * r * rz;
    idx++;
  }

  for (let j = 0; j < nMedial; j++) {
    const side = j % 2 === 0 ? -1 : 1;
    const elev = (hash(j * 1.9) - 0.45) * 1.15;
    const depth = (hash(j * 2.7) - 0.5) * 1.7;
    pos[idx * 3] = side * (0.1 + hash(j) * 0.04);
    pos[idx * 3 + 1] = elev * RY * 0.9 + 0.12;
    pos[idx * 3 + 2] = depth * RZ * 0.72;
    idx++;
  }

  for (let j = 0; j < nCere; j++) {
    const side = hash(j * 0.61) > 0.5 ? 1 : -1;
    const d = fibDir(j, nCere);
    const folio = Math.sin(d.y * 26 + d.z * 8) * 0.03;
    pos[idx * 3] = side * (0.3 + Math.abs(d.x) * (0.3 + folio));
    pos[idx * 3 + 1] = -0.52 + d.y * 0.24;
    pos[idx * 3 + 2] = -0.58 + d.z * 0.34;
    idx++;
  }

  for (let j = 0; j < nStem; j++) {
    const t = j / Math.max(nStem - 1, 1);
    const a = hash(j * 4.1) * Math.PI * 2;
    const r = 0.1 * (1 - t * 0.4);
    pos[idx * 3] = Math.cos(a) * r + (hash(j * 1.5) - 0.5) * 0.035;
    pos[idx * 3 + 1] = -0.28 - t * 0.65;
    pos[idx * 3 + 2] = -0.15 + Math.sin(a) * r * 0.5;
    idx++;
  }

  for (let j = 0; j < nFill && idx < count; j++) {
    const side = j % 2 === 0 ? -1 : 1;
    const d = fibDir(j + 31, nFill);
    const r = 0.2 + hash(j) * 0.45;
    pos[idx * 3] = side * (HEMI_X * 0.55 + Math.abs(d.x) * r * RX * 0.65);
    pos[idx * 3 + 1] = d.y * r * RY * 0.55 + 0.12;
    pos[idx * 3 + 2] = d.z * r * RZ * 0.65;
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
