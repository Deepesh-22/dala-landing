/**
 * Morph targets — lighter compute so WebGL doesn't hang/crash on init.
 */

function hash(n) {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

function noise3(x, y, z) {
  return (
    Math.sin(x * 1.7 + y * 2.3 + z * 1.1) * 0.5 +
    Math.sin(x * 3.1 - y * 1.9 + z * 2.7) * 0.25 +
    Math.sin(x * 5.3 + y * 4.1 - z * 3.2) * 0.125
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

function fillRemainder(pos, idx, count, radius = 0.95, yScale = 0.7) {
  while (idx < count) {
    const d = fibDir(idx + 997, count);
    const R = radius + hash(idx * 1.13) * 0.1;
    pos[idx * 3] = d.x * R;
    pos[idx * 3 + 1] = d.y * R * yScale;
    pos[idx * 3 + 2] = d.z * R;
    idx++;
  }
  return idx;
}

export function createSphere(count) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const d = fibDir(i, count);
    pos[i * 3] = d.x;
    pos[i * 3 + 1] = d.y;
    pos[i * 3 + 2] = d.z;
  }
  return pos;
}

export function createBrain(count) {
  const pos = new Float32Array(count * 3);
  const nSurface = Math.floor(count * 0.72);
  const nCere = Math.floor(count * 0.1);
  const nStem = Math.floor(count * 0.08);
  let idx = 0;

  const HEMI_GAP = 0.22;
  const RX = 0.8;
  const RY = 0.68;
  const RZ = 0.74;

  for (let i = 0; i < nSurface; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const hemiIndex = Math.floor(i / 2);
    const hemiCount = Math.ceil(nSurface / 2);
    const d = fibDir(hemiIndex, hemiCount);

    let lx = Math.abs(d.x) * 0.6 + 0.4;
    let ly = d.y;
    let lz = d.z;
    let len = Math.sqrt(lx * lx + ly * ly + lz * lz) || 1;
    lx /= len;
    ly /= len;
    lz /= len;

    let rx = RX * (side < 0 ? 0.97 : 1.03);
    let ry = RY;
    let rz = RZ;

    if (lz > 0.3) {
      rz *= 1.08;
      rx *= 1.04;
    }
    if (lz < -0.3) {
      rx *= 0.85;
      rz *= 0.9;
    }
    if (ly < -0.1 && lx > 0.28) {
      ry *= 0.72;
      ly -= 0.1;
    }

    const sulcus =
      Math.sin(lz * 14 + ly * 9) * 0.038 +
      Math.sin(ly * 26 - lz * 12) * 0.025 +
      Math.sin(lz * 38 + lx * 16) * 0.014;
    const fold = noise3(lx * 9 + side * 2, ly * 9, lz * 9) * 0.07 + sulcus;
    const r = (1.0 + fold) * (0.94 + hash(i * 1.37) * 0.06);

    pos[idx * 3] = side * (HEMI_GAP + lx * r * rx);
    pos[idx * 3 + 1] = ly * r * ry + 0.05;
    pos[idx * 3 + 2] = lz * r * rz;
    idx++;
  }

  for (let j = 0; j < nCere && idx < count; j++) {
    const side = hash(j * 0.61) > 0.5 ? 1 : -1;
    const d = fibDir(j, nCere);
    pos[idx * 3] = side * (0.14 + Math.abs(d.x) * 0.26);
    pos[idx * 3 + 1] = -0.46 + d.y * 0.2;
    pos[idx * 3 + 2] = -0.52 + d.z * 0.28;
    idx++;
  }

  for (let j = 0; j < nStem && idx < count; j++) {
    const t = j / Math.max(nStem - 1, 1);
    const a = hash(j * 4.1) * Math.PI * 2;
    const r = 0.1 * (1 - t * 0.3);
    pos[idx * 3] = Math.cos(a) * r;
    pos[idx * 3 + 1] = -0.3 - t * 0.52;
    pos[idx * 3 + 2] = -0.03 + Math.sin(a) * r * 0.3;
    idx++;
  }

  fillRemainder(pos, idx, count, 0.9, 0.6);
  return pos;
}

export function createDistorted(count) {
  const base = createBrain(count);
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const x = base[i * 3];
    const y = base[i * 3 + 1];
    const z = base[i * 3 + 2];
    const n = noise3(x * 2, y * 2, z * 2);
    pos[i * 3] = x * (1.05 + n * 0.05);
    pos[i * 3 + 1] = y * (0.98 + n * 0.03);
    pos[i * 3 + 2] = z * (1.04 + n * 0.04);
  }
  return pos;
}

export function createAbstract(count) {
  const base = createBrain(count);
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const seed = hash(i * 1.7);
    const d = fibDir(i, count);
    const expand = 1.2 + seed * 0.6;
    pos[i * 3] = base[i * 3] * expand + d.x * 0.2;
    pos[i * 3 + 1] = base[i * 3 + 1] * expand * 0.9 + d.y * 0.15;
    pos[i * 3 + 2] = base[i * 3 + 2] * expand + d.z * 0.2;
  }
  return pos;
}

export function createBulb(count) {
  const pos = new Float32Array(count * 3);
  const nGlass = Math.floor(count * 0.5);
  const nNeck = Math.floor(count * 0.15);
  const nScrew = Math.floor(count * 0.2);
  let idx = 0;

  for (let i = 0; i < nGlass; i++) {
    const d = fibDir(i, nGlass);
    let ly = d.y;
    if (ly < -0.1) ly = -0.1 + (ly + 0.1) * 0.15;
    pos[idx * 3] = d.x * 0.66;
    pos[idx * 3 + 1] = ly * 0.76 + 0.55;
    pos[idx * 3 + 2] = d.z * 0.66;
    idx++;
  }

  for (let i = 0; i < nNeck && idx < count; i++) {
    const t = i / Math.max(nNeck - 1, 1);
    const a = (i / nNeck) * Math.PI * 2 * 4;
    const radius = 0.26 * (1 - t * 0.5) + 0.08;
    pos[idx * 3] = Math.cos(a) * radius;
    pos[idx * 3 + 1] = 0.1 - t * 0.4;
    pos[idx * 3 + 2] = Math.sin(a) * radius;
    idx++;
  }

  for (let i = 0; i < nScrew && idx < count; i++) {
    const t = i / Math.max(nScrew - 1, 1);
    const a = t * Math.PI * 2 * 3.5;
    const radius = 0.23 + Math.sin(t * Math.PI * 7) * 0.025;
    pos[idx * 3] = Math.cos(a) * radius;
    pos[idx * 3 + 1] = -0.3 - t * 0.48;
    pos[idx * 3 + 2] = Math.sin(a) * radius;
    idx++;
  }

  fillRemainder(pos, idx, count, 0.8, 0.7);
  return pos;
}

export function createGlobe(count) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const d = fibDir(i, count);
    const n = noise3(d.x * 4, d.y * 4, d.z * 4);
    const surface = n > -0.1 ? 1.0 : 0.9;
    const r = surface + hash(i) * 0.02;
    pos[i * 3] = d.x * r;
    pos[i * 3 + 1] = d.y * r;
    pos[i * 3 + 2] = d.z * r;
  }
  return pos;
}

export function createStructure(count) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const d = fibDir(i, count);
    const n = noise3(d.x * 2.2, d.y * 2.2, d.z * 2.2);
    const r = 0.72 + n * 0.1;
    const waist = 1 + Math.sin(d.y * Math.PI) * 0.25;
    pos[i * 3] = d.x * r * waist;
    pos[i * 3 + 1] = d.y * r * 1.15;
    pos[i * 3 + 2] = d.z * r * 0.85;
  }
  return pos;
}

export function createScatter(count) {
  return createAbstract(count);
}

export const SHAPE_ORDER = [
  'brain',
  'distorted',
  'abstract',
  'bulb',
  'globe',
  'structure',
];

export const SHAPE_FNS = {
  brain: createBrain,
  distorted: createDistorted,
  abstract: createAbstract,
  bulb: createBulb,
  globe: createGlobe,
  structure: createStructure,
  scatter: createScatter,
  sphere: createSphere,
};

export function generateShape(name, count) {
  const fn = SHAPE_FNS[name] || createSphere;
  return fn(count);
}

export function buildMorphTargets(count) {
  return SHAPE_ORDER.map((name) => generateShape(name, count));
}
