/**
 * Clean morph targets — perfect readable silhouettes.
 * brain → distorted → abstract → bulb → globe → structure
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
    const R = radius + hash(idx * 1.13) * 0.12;
    pos[idx * 3] = d.x * R;
    pos[idx * 3 + 1] = d.y * R * yScale;
    pos[idx * 3 + 2] = d.z * R;
    idx++;
  }
  return idx;
}

export function createSphere(count) {
  const pos = new Float32Array(count * 3);
  const R = 1.0;
  for (let i = 0; i < count; i++) {
    const d = fibDir(i, count);
    const n = noise3(d.x * 2, d.y * 2, d.z * 2) * 0.02;
    pos[i * 3] = d.x * (R + n);
    pos[i * 3 + 1] = d.y * (R + n);
    pos[i * 3 + 2] = d.z * (R + n);
  }
  return pos;
}

export function createScatter(count) {
  const pos = new Float32Array(count * 3);
  const R = 2.0;
  for (let i = 0; i < count; i++) {
    const d = fibDir(i, count);
    const u = hash(i * 0.73 + 1.1);
    const r = Math.cbrt(u) * R * (0.5 + hash(i * 1.1) * 0.5);
    pos[i * 3] = d.x * r;
    pos[i * 3 + 1] = d.y * r * 0.7;
    pos[i * 3 + 2] = d.z * r;
  }
  return pos;
}

/** Compact dual-hemisphere brain — clear lobes + stem */
export function createBrain(count) {
  const pos = new Float32Array(count * 3);
  const nSurface = Math.floor(count * 0.72);
  const nInternal = Math.floor(count * 0.05);
  const nCere = Math.floor(count * 0.1);
  const nStem = Math.floor(count * 0.08);
  const nAura = Math.floor(count * 0.02);
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

    let lx = Math.abs(d.x) * 0.62 + 0.38;
    let ly = d.y;
    let lz = d.z;

    const asymX = side < 0 ? 0.97 : 1.03;
    const asymY = side < 0 ? 1.02 : 0.98;
    const asymZ = side < 0 ? 0.99 : 1.01;

    let len = Math.sqrt(lx * lx + ly * ly + lz * lz) || 1;
    lx /= len;
    ly /= len;
    lz /= len;

    let rx = RX * asymX;
    let ry = RY * asymY;
    let rz = RZ * asymZ;

    if (lz > 0.3) {
      rz *= 1.06;
      rx *= 1.03;
    }
    if (lz < -0.3) {
      rx *= 0.86;
      rz *= 0.92;
    }
    if (ly > 0.3) {
      rx *= 1.05;
      ry *= 1.06;
    }
    if (ly < -0.12 && lx > 0.3) {
      ry *= 0.75;
      ly -= 0.08;
    }

    // Controlled sulcus — readable folds, not noise cloud
    const sulcus =
      Math.sin(lz * 14 + ly * 9) * 0.038 +
      Math.sin(ly * 26 - lz * 12) * 0.026 +
      Math.sin(lz * 38 + lx * 16) * 0.014;
    const g1 = noise3(lx * 8 + side * 2, ly * 8, lz * 8) * 0.07;
    const fold = g1 + sulcus;

    const shell = 0.94 + hash(i * 1.37) * 0.06;
    const deep = hash(i * 3.1) > 0.9 ? 0.82 : 1.0;
    const r = (1.0 + fold) * shell * deep;

    pos[idx * 3] = side * (HEMI_GAP + lx * r * rx);
    pos[idx * 3 + 1] = ly * r * ry + 0.05;
    pos[idx * 3 + 2] = lz * r * rz;
    idx++;
  }

  for (let j = 0; j < nInternal && idx < count; j++) {
    const side = j % 2 === 0 ? -1 : 1;
    const d = fibDir(j + 19, nInternal);
    const u = hash(j * 2.1);
    const r = 0.2 + u * 0.28;
    pos[idx * 3] = side * (HEMI_GAP * 0.65 + Math.abs(d.x) * r * RX * 0.45);
    pos[idx * 3 + 1] = d.y * r * RY * 0.45 + 0.04;
    pos[idx * 3 + 2] = d.z * r * RZ * 0.45;
    idx++;
  }

  // Cerebellum — clear rear mass
  for (let j = 0; j < nCere && idx < count; j++) {
    const side = hash(j * 0.61) > 0.5 ? 1 : -1;
    const d = fibDir(j, nCere);
    const folio = Math.sin(d.y * 32 + d.z * 14) * 0.03;
    pos[idx * 3] = side * (0.14 + Math.abs(d.x) * (0.24 + folio));
    pos[idx * 3 + 1] = -0.46 + d.y * 0.18;
    pos[idx * 3 + 2] = -0.5 + d.z * 0.26;
    idx++;
  }

  // Vertical brainstem — clear stem silhouette
  for (let j = 0; j < nStem && idx < count; j++) {
    const t = j / Math.max(nStem - 1, 1);
    const a = hash(j * 4.1) * Math.PI * 2;
    const r = 0.1 * (1 - t * 0.3);
    pos[idx * 3] = Math.cos(a) * r + (hash(j * 1.5) - 0.5) * 0.012;
    pos[idx * 3 + 1] = -0.3 - t * 0.52;
    pos[idx * 3 + 2] = -0.03 + Math.sin(a) * r * 0.3;
    idx++;
  }

  for (let j = 0; j < nAura && idx < count; j++) {
    const d = fibDir(j + 101, Math.max(nAura, 1));
    const R = 1.0 + hash(j * 0.4) * 0.1;
    pos[idx * 3] = d.x * R * 0.85;
    pos[idx * 3 + 1] = d.y * R * 0.5;
    pos[idx * 3 + 2] = d.z * R * 0.7;
    idx++;
  }

  fillRemainder(pos, idx, count, 0.9, 0.6);
  return pos;
}

/** Mild stretch — keeps brain readable */
export function createDistorted(count) {
  const base = createBrain(count);
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const x = base[i * 3];
    const y = base[i * 3 + 1];
    const z = base[i * 3 + 2];
    const n = noise3(x * 2.2, y * 2.2, z * 2.2);
    const stretch = 1.05 + n * 0.06;
    pos[i * 3] = x * stretch + Math.sin(y * 3) * 0.03;
    pos[i * 3 + 1] = y * (0.98 + n * 0.04);
    pos[i * 3 + 2] = z * stretch * 0.99 + Math.sin(x * 3) * 0.03;
  }
  return pos;
}

/** Controlled dissolve — ordered expand, not chaos */
export function createAbstract(count) {
  const base = createBrain(count);
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const bx = base[i * 3];
    const by = base[i * 3 + 1];
    const bz = base[i * 3 + 2];
    const seed = hash(i * 1.7);
    const d = fibDir(i, count);
    const expand = 1.25 + seed * 0.7;
    const drift = 0.12 + seed * 0.28;
    pos[i * 3] = bx * expand + d.x * drift;
    pos[i * 3 + 1] = by * expand * 0.88 + d.y * drift * 0.65;
    pos[i * 3 + 2] = bz * expand + d.z * drift;
  }
  return pos;
}

/** Clean lightbulb — glass head, neck, screw, base */
export function createBulb(count) {
  const pos = new Float32Array(count * 3);
  const nGlass = Math.floor(count * 0.5);
  const nInner = Math.floor(count * 0.07);
  const nNeck = Math.floor(count * 0.13);
  const nScrew = Math.floor(count * 0.18);
  const nBase = Math.floor(count * 0.05);
  const nShell = count - nGlass - nInner - nNeck - nScrew - nBase;
  let idx = 0;

  // Round glass head
  for (let i = 0; i < nGlass; i++) {
    const d = fibDir(i, nGlass);
    let ly = d.y;
    if (ly < -0.12) ly = -0.12 + (ly + 0.12) * 0.2;
    const n = noise3(d.x * 2, ly * 2, d.z * 2) * 0.02;
    pos[idx * 3] = d.x * (0.68 + n);
    pos[idx * 3 + 1] = ly * (0.76 + n) + 0.55;
    pos[idx * 3 + 2] = d.z * (0.68 + n);
    idx++;
  }

  for (let j = 0; j < nInner && idx < count; j++) {
    const d = fibDir(j + 7, nInner);
    const r = 0.16 + hash(j) * 0.14;
    pos[idx * 3] = d.x * r * 0.45;
    pos[idx * 3 + 1] = 0.55 + d.y * r * 0.55;
    pos[idx * 3 + 2] = d.z * r * 0.45;
    idx++;
  }

  // Neck taper — clean cylinder cone
  for (let i = 0; i < nNeck && idx < count; i++) {
    const t = i / Math.max(nNeck - 1, 1);
    const a = (i / nNeck) * Math.PI * 2 * 3 + hash(i) * 0.4;
    const radius = 0.28 * (1 - t * 0.5) + 0.08;
    const y = 0.1 - t * 0.4;
    pos[idx * 3] = Math.cos(a) * radius;
    pos[idx * 3 + 1] = y;
    pos[idx * 3 + 2] = Math.sin(a) * radius;
    idx++;
  }

  // Screw threads — clear helical base
  for (let i = 0; i < nScrew && idx < count; i++) {
    const t = i / Math.max(nScrew - 1, 1);
    const turns = 3.2;
    const a = t * Math.PI * 2 * turns;
    const radius = 0.24 + Math.sin(t * Math.PI * turns * 2) * 0.025;
    const y = -0.32 - t * 0.46;
    pos[idx * 3] = Math.cos(a) * radius;
    pos[idx * 3 + 1] = y;
    pos[idx * 3 + 2] = Math.sin(a) * radius;
    idx++;
  }

  for (let i = 0; i < nBase && idx < count; i++) {
    const a = (i / Math.max(nBase, 1)) * Math.PI * 2;
    const r = Math.sqrt(hash(i * 1.1)) * 0.14;
    pos[idx * 3] = Math.cos(a) * r;
    pos[idx * 3 + 1] = -0.9;
    pos[idx * 3 + 2] = Math.sin(a) * r;
    idx++;
  }

  for (let j = 0; j < nShell && idx < count; j++) {
    const d = fibDir(j + 31, Math.max(nShell, 1));
    let ly = d.y;
    if (ly < -0.12) ly = -0.12 + (ly + 0.12) * 0.2;
    const R = 0.9 + hash(j * 0.5) * 0.1;
    pos[idx * 3] = d.x * R * 0.75;
    pos[idx * 3 + 1] = ly * R * 0.8 + 0.52;
    pos[idx * 3 + 2] = d.z * R * 0.75;
    idx++;
  }

  fillRemainder(pos, idx, count, 0.8, 0.72);
  return pos;
}

/** Clean globe with continent ridges */
export function createGlobe(count) {
  const pos = new Float32Array(count * 3);
  const R = 1.0;
  for (let i = 0; i < count; i++) {
    const d = fibDir(i, count);
    const n = noise3(d.x * 5, d.y * 5, d.z * 5);
    const surface = n > -0.1 ? 1.0 : 0.88;
    const r = R * surface + hash(i) * 0.02;
    pos[i * 3] = d.x * r;
    pos[i * 3 + 1] = d.y * r;
    pos[i * 3 + 2] = d.z * r;
  }
  return pos;
}

/** Organic compact bean / logo form */
export function createStructure(count) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const d = fibDir(i, count);
    const n = noise3(d.x * 2.5, d.y * 2.5, d.z * 2.5);
    const r = 0.7 + n * 0.14 + hash(i) * 0.08;
    // Bean shape — wider mid, tapered poles
    const waist = 1 + Math.sin(d.y * Math.PI) * 0.22;
    pos[i * 3] = d.x * r * waist;
    pos[i * 3 + 1] = d.y * r * 1.15;
    pos[i * 3 + 2] = d.z * r * 0.85;
  }
  return pos;
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
  scatter: createScatter,
  structure: createStructure,
  globe: createGlobe,
  sphere: createSphere,
};

export function generateShape(name, count) {
  const fn = SHAPE_FNS[name] || createSphere;
  return fn(count);
}

export function buildMorphTargets(count) {
  return SHAPE_ORDER.map((name) => generateShape(name, count));
}
