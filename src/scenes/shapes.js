/**
 * Procedural particle positions.
 * Brain = dual cerebral hemispheres + fissure + cerebellum + stem + sparse aura.
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
  const R = 1.2;
  for (let i = 0; i < count; i++) {
    const d = fibDir(i, count);
    const n = noise3(d.x * 2, d.y * 2, d.z * 2) * 0.05;
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
    const n = noise3(d.x * 2, d.y * 2, d.z * 2) * 0.12;
    pos[i * 3] = d.x * (r + n);
    pos[i * 3 + 1] = d.y * (r + n) * 0.85;
    pos[i * 3 + 2] = d.z * (r + n);
  }
  return pos;
}

/**
 * Human-brain silhouette from triangular particles.
 * Layers: surface cortex, internal volume, medial fissure, cerebellum, stem, sparse aura.
 */
export function createBrain(count) {
  const pos = new Float32Array(count * 3);

  // Density layers
  const nSurface = Math.floor(count * 0.58);
  const nInternal = Math.floor(count * 0.16);
  const nMedial = Math.floor(count * 0.05);
  const nCere = Math.floor(count * 0.1);
  const nStem = Math.floor(count * 0.05);
  const nAura = count - nSurface - nInternal - nMedial - nCere - nStem;

  let idx = 0;

  // Hemisphere centers slightly separated (central fissure)
  const HEMI_GAP = 0.22;
  // Ellipsoid radii — wider front-back (Z), slightly flatter Y
  const RX = 0.78;
  const RY = 0.62;
  const RZ = 1.05;

  // --- Surface cortex: two lobes with gyri/sulci ---
  for (let i = 0; i < nSurface; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const hemiIndex = Math.floor(i / 2);
    const hemiCount = Math.ceil(nSurface / 2);
    const d = fibDir(hemiIndex, hemiCount);

    // Bias points outward from fissure (not a perfect sphere)
    let lx = Math.abs(d.x) * 0.65 + 0.35;
    let ly = d.y;
    let lz = d.z;

    // Slight left/right asymmetry
    const asymX = side < 0 ? 0.94 : 1.06;
    const asymY = side < 0 ? 1.03 : 0.97;
    const asymZ = side < 0 ? 0.98 : 1.02;

    let len = Math.sqrt(lx * lx + ly * ly + lz * lz) || 1;
    lx /= len;
    ly /= len;
    lz /= len;

    // Regional shaping
    let rx = RX * asymX;
    let ry = RY * asymY;
    let rz = RZ * asymZ;

    // Frontal lobe bulk
    if (lz > 0.15) {
      rz *= 1.12;
      ry *= 0.95;
      rx *= 1.05;
    }
    // Occipital taper
    if (lz < -0.25) {
      rx *= 0.82;
      rz *= 0.88;
      ry *= 0.9;
    }
    // Superior bulge
    if (ly > 0.25) {
      rx *= 1.08;
      ry *= 1.1;
    }
    // Temporal downward curve
    if (ly < -0.1 && Math.abs(lx) > 0.3) {
      ry *= 0.72;
      ly -= 0.08;
    }

    // Gyri / sulci folds
    const g1 = noise3(lx * 7 + side * 2, ly * 7, lz * 7);
    const g2 = noise3(lx * 15, ly * 15 + side, lz * 15);
    const g3 = noise3(lx * 28 + side, ly * 28, lz * 28);
    const sulcus =
      Math.sin(lz * 10.0 + ly * 6.0) * 0.028 +
      Math.sin(ly * 20.0 - lz * 8.0 + lx * 4.0) * 0.022 +
      Math.sin(lz * 28.0) * 0.012;
    const fold = g1 * 0.06 + g2 * 0.038 + g3 * 0.022 + sulcus;

    const shell = 0.92 + hash(i * 1.37) * 0.08;
    const r = (1.0 + fold) * shell;

    pos[idx * 3] =
      side * (HEMI_GAP + lx * r * rx);
    pos[idx * 3 + 1] = ly * r * ry + 0.12;
    pos[idx * 3 + 2] = lz * r * rz;
    idx++;
  }

  // --- Internal volume (darker regions via density) ---
  for (let j = 0; j < nInternal && idx < count; j++) {
    const side = j % 2 === 0 ? -1 : 1;
    const d = fibDir(j + 17, nInternal);
    const u = hash(j * 2.1);
    const r = 0.25 + u * 0.45;
    pos[idx * 3] = side * (HEMI_GAP * 0.6 + Math.abs(d.x) * r * RX * 0.7);
    pos[idx * 3 + 1] = d.y * r * RY * 0.65 + 0.12;
    pos[idx * 3 + 2] = d.z * r * RZ * 0.7;
    idx++;
  }

  // --- Medial / fissure wall ---
  for (let j = 0; j < nMedial && idx < count; j++) {
    const side = j % 2 === 0 ? -1 : 1;
    const elev = (hash(j * 1.9) - 0.4) * 1.0;
    const depth = (hash(j * 2.7) - 0.5) * 1.6;
    pos[idx * 3] = side * (0.06 + hash(j) * 0.05);
    pos[idx * 3 + 1] = elev * RY * 0.95 + 0.12;
    pos[idx * 3 + 2] = depth * RZ * 0.7;
    idx++;
  }

  // --- Cerebellum (rear lower lobes) ---
  for (let j = 0; j < nCere && idx < count; j++) {
    const side = hash(j * 0.61) > 0.5 ? 1 : -1;
    const d = fibDir(j, nCere);
    const folio = Math.sin(d.y * 28 + d.z * 10) * 0.028;
    pos[idx * 3] = side * (0.26 + Math.abs(d.x) * (0.28 + folio));
    pos[idx * 3 + 1] = -0.5 + d.y * 0.2;
    pos[idx * 3 + 2] = -0.62 + d.z * 0.3;
    idx++;
  }

  // --- Brain stem ---
  for (let j = 0; j < nStem && idx < count; j++) {
    const t = j / Math.max(nStem - 1, 1);
    const a = hash(j * 4.1) * Math.PI * 2;
    const r = 0.1 * (1 - t * 0.4);
    pos[idx * 3] = Math.cos(a) * r + (hash(j * 1.5) - 0.5) * 0.03;
    pos[idx * 3 + 1] = -0.28 - t * 0.62;
    pos[idx * 3 + 2] = -0.18 + Math.sin(a) * r * 0.5;
    idx++;
  }

  // --- Sparse surrounding aura ---
  for (let j = 0; j < nAura && idx < count; j++) {
    const d = fibDir(j + 101, nAura);
    const R = 1.55 + hash(j * 0.4) * 0.55;
    pos[idx * 3] = d.x * R * 0.9;
    pos[idx * 3 + 1] = d.y * R * 0.55;
    pos[idx * 3 + 2] = d.z * R * 0.85;
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
    const r = 0.9 + noise3(d.x * 3, d.y * 3, d.z * 3) * 0.05;
    pos[idx * 3] = d.x * r;
    pos[idx * 3 + 1] = d.y * r * 0.95 + 0.5;
    pos[idx * 3 + 2] = d.z * r;
    idx++;
  }
  for (let i = 0; i < nNeck; i++) {
    const t = i / Math.max(nNeck - 1, 1);
    const a = hash(i * 0.7) * Math.PI * 2;
    const radius = 0.28 * (1 - t * 0.55);
    pos[idx * 3] = Math.cos(a) * radius;
    pos[idx * 3 + 1] = 0.45 - t * 0.7;
    pos[idx * 3 + 2] = Math.sin(a) * radius;
    idx++;
  }
  for (let i = 0; i < nBase && idx < count; i++) {
    const a = (i / nBase) * Math.PI * 2;
    const r = Math.sqrt(hash(i * 0.9)) * 0.38;
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
