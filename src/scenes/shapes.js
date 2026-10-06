/**
 * Detailed morph targets:
 * brain (anatomical) → distorted → abstract → bulb (detailed) → earth → structure
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
    const n = noise3(d.x * 2, d.y * 2, d.z * 2) * 0.015;
    pos[i * 3] = d.x * (1.0 + n);
    pos[i * 3 + 1] = d.y * (1.0 + n);
    pos[i * 3 + 2] = d.z * (1.0 + n);
  }
  return pos;
}

export function createScatter(count) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const d = fibDir(i, count);
    const u = hash(i * 0.73 + 1.1);
    const r = Math.cbrt(u) * 2.0 * (0.5 + hash(i * 1.1) * 0.5);
    pos[i * 3] = d.x * r;
    pos[i * 3 + 1] = d.y * r * 0.7;
    pos[i * 3 + 2] = d.z * r;
  }
  return pos;
}

/**
 * DETAILED anatomical brain
 * - Dual hemispheres with clear interhemispheric fissure
 * - Frontal / parietal / temporal / occipital shaping
 * - Multi-scale gyri & sulci
 * - Cerebellum with folia
 * - Clear vertical brainstem
 */
export function createBrain(count) {
  const pos = new Float32Array(count * 3);
  const nSurface = Math.floor(count * 0.7);
  const nInternal = Math.floor(count * 0.04);
  const nCere = Math.floor(count * 0.12);
  const nStem = Math.floor(count * 0.09);
  const nAura = Math.floor(count * 0.02);
  let idx = 0;

  const HEMI_GAP = 0.2;
  const RX = 0.78;
  const RY = 0.66;
  const RZ = 0.72;

  for (let i = 0; i < nSurface; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const hemiIndex = Math.floor(i / 2);
    const hemiCount = Math.ceil(nSurface / 2);
    const d = fibDir(hemiIndex, hemiCount);

    let lx = Math.abs(d.x) * 0.58 + 0.42;
    let ly = d.y;
    let lz = d.z;

    // Hemisphere asymmetry
    const asymX = side < 0 ? 0.96 : 1.04;
    const asymY = side < 0 ? 1.03 : 0.97;
    const asymZ = side < 0 ? 0.98 : 1.02;

    let len = Math.sqrt(lx * lx + ly * ly + lz * lz) || 1;
    lx /= len;
    ly /= len;
    lz /= len;

    let rx = RX * asymX;
    let ry = RY * asymY;
    let rz = RZ * asymZ;

    // Regional anatomy
    if (lz > 0.32) {
      // Frontal poles — fuller, slightly taller
      rz *= 1.1;
      rx *= 1.05;
      ry *= 0.95;
    }
    if (lz < -0.32) {
      // Occipital — narrower, flatter
      rx *= 0.82;
      rz *= 0.88;
      ry *= 0.9;
    }
    if (ly > 0.28) {
      // Superior parietal
      rx *= 1.08;
      ry *= 1.1;
    }
    if (ly < -0.08 && lx > 0.25) {
      // Temporal lobe drop
      ry *= 0.7;
      ly -= 0.12;
      rx *= 1.05;
    }

    // Multi-scale cortical folds (gyri / sulci)
    const g1 = noise3(lx * 10 + side * 3, ly * 10, lz * 10);
    const g2 = noise3(lx * 22, ly * 20 + side, lz * 22);
    const g3 = noise3(lx * 40 + side, ly * 36, lz * 38);
    const sulcus =
      Math.sin(lz * 16 + ly * 11) * 0.04 +
      Math.sin(ly * 28 - lz * 14) * 0.028 +
      Math.sin(lz * 44 + lx * 20) * 0.016 +
      Math.sin(lx * 24 + ly * 18) * 0.01 +
      Math.sin(lz * 60 + ly * 40) * 0.006;
    const fold = g1 * 0.085 + g2 * 0.045 + g3 * 0.022 + sulcus;

    const shell = 0.94 + hash(i * 1.37) * 0.06;
    // Occasional deep sulcus
    const deep = hash(i * 3.1) > 0.9 ? 0.8 : 1.0;
    const r = (1.0 + fold) * shell * deep;

    pos[idx * 3] = side * (HEMI_GAP + lx * r * rx);
    pos[idx * 3 + 1] = ly * r * ry + 0.05;
    pos[idx * 3 + 2] = lz * r * rz;
    idx++;
  }

  // Sparse internal mass (not origin clump)
  for (let j = 0; j < nInternal && idx < count; j++) {
    const side = j % 2 === 0 ? -1 : 1;
    const d = fibDir(j + 19, nInternal);
    const u = hash(j * 2.1);
    const r = 0.18 + u * 0.28;
    pos[idx * 3] = side * (HEMI_GAP * 0.6 + Math.abs(d.x) * r * RX * 0.4);
    pos[idx * 3 + 1] = d.y * r * RY * 0.42 + 0.04;
    pos[idx * 3 + 2] = d.z * r * RZ * 0.42;
    idx++;
  }

  // Cerebellum — bilobed, lower-rear, with folia ridges
  for (let j = 0; j < nCere && idx < count; j++) {
    const side = hash(j * 0.61) > 0.5 ? 1 : -1;
    const d = fibDir(j, nCere);
    const folio =
      Math.sin(d.y * 42 + d.z * 18) * 0.04 +
      Math.sin(d.x * 30 + d.y * 25) * 0.02;
    pos[idx * 3] = side * (0.12 + Math.abs(d.x) * (0.28 + folio));
    pos[idx * 3 + 1] = -0.48 + d.y * 0.22 + folio * 0.3;
    pos[idx * 3 + 2] = -0.55 + d.z * 0.3;
    idx++;
  }

  // Brainstem — vertical column under center, slight taper
  for (let j = 0; j < nStem && idx < count; j++) {
    const t = j / Math.max(nStem - 1, 1);
    const a = hash(j * 4.1) * Math.PI * 2;
    const ring = Math.floor(j / 8);
    const r = 0.095 * (1 - t * 0.32) + (ring % 3 === 0 ? 0.015 : 0);
    pos[idx * 3] = Math.cos(a) * r + (hash(j * 1.5) - 0.5) * 0.01;
    pos[idx * 3 + 1] = -0.28 - t * 0.58;
    pos[idx * 3 + 2] = -0.02 + Math.sin(a) * r * 0.28;
    idx++;
  }

  for (let j = 0; j < nAura && idx < count; j++) {
    const d = fibDir(j + 101, Math.max(nAura, 1));
    const R = 0.98 + hash(j * 0.4) * 0.08;
    pos[idx * 3] = d.x * R * 0.82;
    pos[idx * 3 + 1] = d.y * R * 0.48;
    pos[idx * 3 + 2] = d.z * R * 0.68;
    idx++;
  }

  fillRemainder(pos, idx, count, 0.88, 0.58);
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
    const stretch = 1.04 + n * 0.05;
    pos[i * 3] = x * stretch + Math.sin(y * 2.8) * 0.025;
    pos[i * 3 + 1] = y * (0.98 + n * 0.035);
    pos[i * 3 + 2] = z * stretch * 0.99 + Math.sin(x * 2.8) * 0.025;
  }
  return pos;
}

export function createAbstract(count) {
  const base = createBrain(count);
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const bx = base[i * 3];
    const by = base[i * 3 + 1];
    const bz = base[i * 3 + 2];
    const seed = hash(i * 1.7);
    const d = fibDir(i, count);
    const expand = 1.2 + seed * 0.65;
    const drift = 0.1 + seed * 0.25;
    pos[i * 3] = bx * expand + d.x * drift;
    pos[i * 3 + 1] = by * expand * 0.9 + d.y * drift * 0.6;
    pos[i * 3 + 2] = bz * expand + d.z * drift;
  }
  return pos;
}

/**
 * DETAILED lightbulb
 * - Spherical glass envelope (flattened bottom)
 * - Inner filament cloud
 * - Tapered neck
 * - Helical screw base (Edison-style threads)
 * - Flat contact tip
 */
export function createBulb(count) {
  const pos = new Float32Array(count * 3);
  const nGlass = Math.floor(count * 0.48);
  const nInner = Math.floor(count * 0.08);
  const nNeck = Math.floor(count * 0.12);
  const nScrew = Math.floor(count * 0.2);
  const nBase = Math.floor(count * 0.05);
  const nShell = count - nGlass - nInner - nNeck - nScrew - nBase;
  let idx = 0;

  // Glass globe — smooth sphere, bottom clipped to neck
  for (let i = 0; i < nGlass; i++) {
    const d = fibDir(i, nGlass);
    let ly = d.y;
    if (ly < -0.1) ly = -0.1 + (ly + 0.1) * 0.15;
    // Slight vertical stretch for classic bulb profile
    const n = noise3(d.x * 1.5, ly * 1.5, d.z * 1.5) * 0.015;
    pos[idx * 3] = d.x * (0.66 + n);
    pos[idx * 3 + 1] = ly * (0.78 + n) + 0.58;
    pos[idx * 3 + 2] = d.z * (0.66 + n);
    idx++;
  }

  // Filament / inner glow volume
  for (let j = 0; j < nInner && idx < count; j++) {
    const d = fibDir(j + 7, nInner);
    const r = 0.12 + hash(j) * 0.12;
    pos[idx * 3] = d.x * r * 0.4;
    pos[idx * 3 + 1] = 0.58 + d.y * r * 0.5;
    pos[idx * 3 + 2] = d.z * r * 0.4;
    idx++;
  }

  // Neck — smooth taper from glass to screw
  for (let i = 0; i < nNeck && idx < count; i++) {
    const t = i / Math.max(nNeck - 1, 1);
    const a = (i / nNeck) * Math.PI * 2 * 4 + hash(i) * 0.3;
    const radius = 0.26 * (1 - t * 0.48) + 0.09;
    const y = 0.12 - t * 0.38;
    pos[idx * 3] = Math.cos(a) * radius;
    pos[idx * 3 + 1] = y;
    pos[idx * 3 + 2] = Math.sin(a) * radius;
    idx++;
  }

  // Edison screw — clear helical ridges
  for (let i = 0; i < nScrew && idx < count; i++) {
    const t = i / Math.max(nScrew - 1, 1);
    const turns = 4.0;
    const a = t * Math.PI * 2 * turns;
    // Thread ridge
    const ridge = Math.sin(t * Math.PI * turns * 2) * 0.03;
    const radius = 0.23 + ridge;
    const y = -0.28 - t * 0.5;
    pos[idx * 3] = Math.cos(a) * radius;
    pos[idx * 3 + 1] = y;
    pos[idx * 3 + 2] = Math.sin(a) * radius;
    idx++;
  }

  // Contact tip
  for (let i = 0; i < nBase && idx < count; i++) {
    const a = (i / Math.max(nBase, 1)) * Math.PI * 2;
    const r = Math.sqrt(hash(i * 1.1)) * 0.12;
    pos[idx * 3] = Math.cos(a) * r;
    pos[idx * 3 + 1] = -0.88;
    pos[idx * 3 + 2] = Math.sin(a) * r;
    idx++;
  }

  // Outer glass shell halo
  for (let j = 0; j < nShell && idx < count; j++) {
    const d = fibDir(j + 31, Math.max(nShell, 1));
    let ly = d.y;
    if (ly < -0.1) ly = -0.1 + (ly + 0.1) * 0.15;
    const R = 0.88 + hash(j * 0.5) * 0.08;
    pos[idx * 3] = d.x * R * 0.72;
    pos[idx * 3 + 1] = ly * R * 0.8 + 0.55;
    pos[idx * 3 + 2] = d.z * R * 0.72;
    idx++;
  }

  fillRemainder(pos, idx, count, 0.78, 0.7);
  return pos;
}

/**
 * DETAILED Earth / globe
 * - Spherical base
 * - Continent ridges (elevated land masses via noise)
 * - Ocean basins (slightly inset)
 * - Polar flattening mild
 * - Longitude/latitude-ish banding via noise axes
 */
export function createGlobe(count) {
  const pos = new Float32Array(count * 3);
  const R = 1.0;

  for (let i = 0; i < count; i++) {
    const d = fibDir(i, count);

    // Continent-scale noise (large features)
    const n1 = noise3(d.x * 3.5, d.y * 3.5, d.z * 3.5);
    // Regional detail
    const n2 = noise3(d.x * 8, d.y * 8, d.z * 8);
    // Fine coastal detail
    const n3 = noise3(d.x * 18, d.y * 18, d.z * 18);

    // Land vs ocean: land raised, ocean inset
    const landMask = n1 * 0.6 + n2 * 0.3 + n3 * 0.1;
    let surface;
    if (landMask > 0.05) {
      // Continent / highland
      surface = 1.0 + landMask * 0.06;
    } else if (landMask > -0.15) {
      // Coast / shelf
      surface = 0.97 + landMask * 0.04;
    } else {
      // Deep ocean
      surface = 0.92;
    }

    // Mild polar flattening
    const polar = 1 - Math.abs(d.y) * 0.04;

    // Latitude bands subtle
    const latBand = Math.sin(d.y * Math.PI * 4) * 0.008;

    const r = R * surface * polar + latBand + hash(i) * 0.012;
    pos[i * 3] = d.x * r;
    pos[i * 3 + 1] = d.y * r;
    pos[i * 3 + 2] = d.z * r;
  }
  return pos;
}

/**
 * FINAL structure — perfect organic emblem
 * - Smooth bean / infinity-inspired solid
 * - Clear silhouette from all angles
 * - Soft surface variation, not noise cloud
 */
export function createStructure(count) {
  const pos = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const d = fibDir(i, count);
    const n = noise3(d.x * 2.2, d.y * 2.2, d.z * 2.2);

    // Core radius
    let r = 0.72 + n * 0.1 + hash(i) * 0.06;

    // Bean / vesica profile: wider at equator, tapered poles
    const waist = 1.0 + Math.sin(d.y * Math.PI) * 0.28;
    // Slight figure-8 / infinity suggestion on X
    const twist = 1.0 + Math.sin(d.y * Math.PI * 2) * 0.08 * Math.sign(d.x || 1);

    pos[i * 3] = d.x * r * waist * twist;
    pos[i * 3 + 1] = d.y * r * 1.18;
    pos[i * 3 + 2] = d.z * r * 0.82 * (1 + Math.abs(d.y) * 0.1);
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
