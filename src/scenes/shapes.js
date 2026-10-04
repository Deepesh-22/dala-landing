/**
 * Procedural particle positions.
 * Brain = clear dual hemispheres + fissure + cerebellum + stem + minimal aura.
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
  const R = 2.4;
  for (let i = 0; i < count; i++) {
    const d = fibDir(i, count);
    const u = hash(i * 0.73 + 1.1);
    const r = Math.cbrt(u) * R;
    const n = noise3(d.x * 2, d.y * 2, d.z * 2) * 0.1;
    pos[i * 3] = d.x * (r + n);
    pos[i * 3 + 1] = d.y * (r + n) * 0.85;
    pos[i * 3 + 2] = d.z * (r + n);
  }
  return pos;
}

/**
 * Recognizable human-brain silhouette.
 * Dense surface cortex, sparse interior, clear fissure, cerebellum, stem.
 * Minimal outer aura so the silhouette reads cleanly.
 */
export function createBrain(count) {
  const pos = new Float32Array(count * 3);

  // Tight layer budget — most particles on the cortex surface
  const nSurface = Math.floor(count * 0.68);
  const nInternal = Math.floor(count * 0.1);
  const nMedial = Math.floor(count * 0.06);
  const nCere = Math.floor(count * 0.1);
  const nStem = Math.floor(count * 0.04);
  const nAura = count - nSurface - nInternal - nMedial - nCere - nStem; // ~2%

  let idx = 0;

  // Clear separation between hemispheres
  const HEMI_GAP = 0.28;
  const RX = 0.72;
  const RY = 0.58;
  const RZ = 0.98;

  // --- Surface cortex: two distinct lobes ---
  for (let i = 0; i < nSurface; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const hemiIndex = Math.floor(i / 2);
    const hemiCount = Math.ceil(nSurface / 2);
    const d = fibDir(hemiIndex, hemiCount);

    // Push away from midline so fissure stays dark/empty
    let lx = Math.abs(d.x) * 0.72 + 0.28;
    let ly = d.y;
    let lz = d.z;

    const asymX = side < 0 ? 0.93 : 1.07;
    const asymY = side < 0 ? 1.04 : 0.96;
    const asymZ = side < 0 ? 0.97 : 1.03;

    let len = Math.sqrt(lx * lx + ly * ly + lz * lz) || 1;
    lx /= len;
    ly /= len;
    lz /= len;

    let rx = RX * asymX;
    let ry = RY * asymY;
    let rz = RZ * asymZ;

    // Frontal bulk
    if (lz > 0.2) {
      rz *= 1.14;
      ry *= 0.94;
      rx *= 1.06;
    }
    // Occipital taper
    if (lz < -0.28) {
      rx *= 0.78;
      rz *= 0.85;
      ry *= 0.88;
    }
    // Superior dome
    if (ly > 0.28) {
      rx *= 1.1;
      ry *= 1.12;
    }
    // Temporal lobe dip
    if (ly < -0.12 && lx > 0.35) {
      ry *= 0.68;
      ly -= 0.1;
    }

    // Gyri / sulci — stronger folds for readable surface
    const g1 = noise3(lx * 8 + side * 2.5, ly * 8, lz * 8);
    const g2 = noise3(lx * 16, ly * 16 + side, lz * 16);
    const g3 = noise3(lx * 30 + side, ly * 30, lz * 30);
    const sulcus =
      Math.sin(lz * 11 + ly * 7) * 0.032 +
      Math.sin(ly * 22 - lz * 9 + lx * 5) * 0.024 +
      Math.sin(lz * 32) * 0.014;
    const fold = g1 * 0.07 + g2 * 0.042 + g3 * 0.024 + sulcus;

    // Mostly surface shell — sparse holes for hollow look
    const shell = 0.94 + hash(i * 1.37) * 0.06;
    // Occasional deeper sulcus (skip some density)
    const deep = hash(i * 3.1) > 0.92 ? 0.82 : 1.0;
    const r = (1.0 + fold) * shell * deep;

    pos[idx * 3] = side * (HEMI_GAP + lx * r * rx);
    pos[idx * 3 + 1] = ly * r * ry + 0.1;
    pos[idx * 3 + 2] = lz * r * rz;
    idx++;
  }

  // --- Internal (sparse, stays inside lobes) ---
  for (let j = 0; j < nInternal && idx < count; j++) {
    const side = j % 2 === 0 ? -1 : 1;
    const d = fibDir(j + 19, nInternal);
    const u = hash(j * 2.1);
    const r = 0.2 + u * 0.38;
    pos[idx * 3] = side * (HEMI_GAP * 0.7 + Math.abs(d.x) * r * RX * 0.65);
    pos[idx * 3 + 1] = d.y * r * RY * 0.6 + 0.1;
    pos[idx * 3 + 2] = d.z * r * RZ * 0.65;
    idx++;
  }

  // --- Medial walls lining the fissure ---
  for (let j = 0; j < nMedial && idx < count; j++) {
    const side = j % 2 === 0 ? -1 : 1;
    const elev = (hash(j * 1.9) - 0.42) * 0.95;
    const depth = (hash(j * 2.7) - 0.5) * 1.5;
    pos[idx * 3] = side * (0.05 + hash(j) * 0.04);
    pos[idx * 3 + 1] = elev * RY * 0.9 + 0.1;
    pos[idx * 3 + 2] = depth * RZ * 0.68;
    idx++;
  }

  // --- Cerebellum (rear-lower, two small lobes) ---
  for (let j = 0; j < nCere && idx < count; j++) {
    const side = hash(j * 0.61) > 0.5 ? 1 : -1;
    const d = fibDir(j, nCere);
    const folio = Math.sin(d.y * 30 + d.z * 12) * 0.03;
    pos[idx * 3] = side * (0.22 + Math.abs(d.x) * (0.26 + folio));
    pos[idx * 3 + 1] = -0.48 + d.y * 0.18;
    pos[idx * 3 + 2] = -0.58 + d.z * 0.28;
    idx++;
  }

  // --- Brain stem ---
  for (let j = 0; j < nStem && idx < count; j++) {
    const t = j / Math.max(nStem - 1, 1);
    const a = hash(j * 4.1) * Math.PI * 2;
    const r = 0.085 * (1 - t * 0.35);
    pos[idx * 3] = Math.cos(a) * r + (hash(j * 1.5) - 0.5) * 0.025;
    pos[idx * 3 + 1] = -0.3 - t * 0.55;
    pos[idx * 3 + 2] = -0.15 + Math.sin(a) * r * 0.45;
    idx++;
  }

  // --- Minimal sparse aura (kept close, few particles) ---
  for (let j = 0; j < nAura && idx < count; j++) {
    const d = fibDir(j + 101, Math.max(nAura, 1));
    // Tight shell just outside cortex — not a full-screen cloud
    const R = 1.15 + hash(j * 0.4) * 0.25;
    pos[idx * 3] = d.x * R * 0.85;
    pos[idx * 3 + 1] = d.y * R * 0.5;
    pos[idx * 3 + 2] = d.z * R * 0.8;
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
    pos[idx * 3 + 1] = d.y * r * 0.95 + 0.5;
    pos[idx * 3 + 2] = d.z * r;
    idx++;
  }
  for (let i = 0; i < nNeck; i++) {
    const t = i / Math.max(nNeck - 1, 1);
    const a = hash(i * 0.7) * Math.PI * 2;
    const radius = 0.26 * (1 - t * 0.55);
    pos[idx * 3] = Math.cos(a) * radius;
    pos[idx * 3 + 1] = 0.45 - t * 0.7;
    pos[idx * 3 + 2] = Math.sin(a) * radius;
    idx++;
  }
  for (let i = 0; i < nBase && idx < count; i++) {
    const a = (i / nBase) * Math.PI * 2;
    const r = Math.sqrt(hash(i * 0.9)) * 0.36;
    pos[idx * 3] = Math.cos(a) * r;
    pos[idx * 3 + 1] = -0.2;
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
    const elev = (t - 0.5) * 2.2;
    const cx = Math.cos(angle) * radius;
    const cy = elev + Math.sin(twist) * 0.2;
    const cz = Math.sin(angle) * radius * 0.85;
    const d = fibDir(i * 3 + 11, count * 2);
    const tube = 0.2 + noise3(cx, cy, cz) * 0.05;
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
