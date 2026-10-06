/**
 * Morph targets — Phase C compact anatomical brain.
 * Order: brain → distorted → abstract → bulb → globe → structure
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

/** Redistribute remainder onto surface — never leave particles at origin */
function fillRemainder(pos, idx, count, radius = 0.95, yScale = 0.7) {
  while (idx < count) {
    const d = fibDir(idx + 997, count);
    const R = radius + hash(idx * 1.13) * 0.18;
    pos[idx * 3] = d.x * R;
    pos[idx * 3 + 1] = d.y * R * yScale;
    pos[idx * 3 + 2] = d.z * R;
    idx++;
  }
  return idx;
}

export function createSphere(count) {
  const pos = new Float32Array(count * 3);
  const R = 1.05;
  for (let i = 0; i < count; i++) {
    const d = fibDir(i, count);
    const n = noise3(d.x * 2, d.y * 2, d.z * 2) * 0.03;
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
    const r = Math.cbrt(u) * R * (0.5 + hash(i * 1.1) * 0.5);
    pos[i * 3] = d.x * r;
    pos[i * 3 + 1] = d.y * r * 0.7;
    pos[i * 3 + 2] = d.z * r;
  }
  return pos;
}

/**
 * Phase C — Compact dual-hemisphere brain.
 * RZ 0.75–0.85, gap ~0.24, surface ≥70%, clear stem + cerebellum.
 */
export function createBrain(count) {
  const pos = new Float32Array(count * 3);

  // Mass budget: surface dominant for silhouette readability
  const nSurface = Math.floor(count * 0.74);
  const nInternal = Math.floor(count * 0.06);
  const nCere = Math.floor(count * 0.09);
  const nStem = Math.floor(count * 0.06);
  const nAura = Math.floor(count * 0.03);
  let idx = 0;

  // Compact proportions — not elongated
  const HEMI_GAP = 0.24;
  const RX = 0.82;
  const RY = 0.7;
  const RZ = 0.76; // 0.75–0.85 range, not >1.0

  // --- Cortical surface (dual hemispheres) ---
  for (let i = 0; i < nSurface; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const hemiIndex = Math.floor(i / 2);
    const hemiCount = Math.ceil(nSurface / 2);
    const d = fibDir(hemiIndex, hemiCount);

    // Keep points away from midplane so fissure reads
    let lx = Math.abs(d.x) * 0.65 + 0.35;
    let ly = d.y;
    let lz = d.z;

    // Mild hemisphere asymmetry (natural brain)
    const asymX = side < 0 ? 0.96 : 1.04;
    const asymY = side < 0 ? 1.02 : 0.98;
    const asymZ = side < 0 ? 0.98 : 1.02;

    let len = Math.sqrt(lx * lx + ly * ly + lz * lz) || 1;
    lx /= len;
    ly /= len;
    lz /= len;

    let rx = RX * asymX;
    let ry = RY * asymY;
    let rz = RZ * asymZ;

    // Regional shaping
    if (lz > 0.28) {
      // Frontal poles — slightly fuller
      rz *= 1.08;
      rx *= 1.04;
      ry *= 0.96;
    }
    if (lz < -0.28) {
      // Occipital — narrower
      rx *= 0.84;
      rz *= 0.9;
      ry *= 0.92;
    }
    if (ly > 0.32) {
      // Superior parietal
      rx *= 1.06;
      ry *= 1.08;
    }
    if (ly < -0.1 && lx > 0.28) {
      // Temporal lobe drop
      ry *= 0.72;
      ly -= 0.1;
    }

    // Multi-scale sulcus / gyri noise — readable at hero distance
    const g1 = noise3(lx * 9 + side * 2.5, ly * 9, lz * 9);
    const g2 = noise3(lx * 18, ly * 18 + side, lz * 18);
    const g3 = noise3(lx * 32 + side, ly * 28, lz * 30);
    const sulcus =
      Math.sin(lz * 15 + ly * 10) * 0.042 +
      Math.sin(ly * 30 - lz * 13) * 0.03 +
      Math.sin(lz * 42 + lx * 18) * 0.018 +
      Math.sin(lx * 22 + ly * 16) * 0.012;
    const fold = g1 * 0.09 + g2 * 0.05 + g3 * 0.028 + sulcus;

    const shell = 0.93 + hash(i * 1.37) * 0.07;
    // Occasional deep sulcus inset
    const deep = hash(i * 3.1) > 0.88 ? 0.78 : 1.0;
    const r = (1.0 + fold) * shell * deep;

    const px = side * (HEMI_GAP + lx * r * rx);
    const py = ly * r * ry + 0.06;
    const pz = lz * r * rz;

    pos[idx * 3] = px;
    pos[idx * 3 + 1] = py;
    pos[idx * 3 + 2] = pz;
    idx++;
  }

  // --- Sparse internal volume (not origin clump) ---
  for (let j = 0; j < nInternal && idx < count; j++) {
    const side = j % 2 === 0 ? -1 : 1;
    const d = fibDir(j + 19, nInternal);
    const u = hash(j * 2.1);
    const r = 0.22 + u * 0.32;
    pos[idx * 3] = side * (HEMI_GAP * 0.7 + Math.abs(d.x) * r * RX * 0.5);
    pos[idx * 3 + 1] = d.y * r * RY * 0.48 + 0.05;
    pos[idx * 3 + 2] = d.z * r * RZ * 0.5;
    idx++;
  }

  // --- Cerebellum (rear-lower mass) ---
  for (let j = 0; j < nCere && idx < count; j++) {
    const side = hash(j * 0.61) > 0.5 ? 1 : -1;
    const d = fibDir(j, nCere);
    const folio = Math.sin(d.y * 38 + d.z * 16) * 0.035;
    pos[idx * 3] = side * (0.16 + Math.abs(d.x) * (0.26 + folio));
    pos[idx * 3 + 1] = -0.48 + d.y * 0.2;
    pos[idx * 3 + 2] = -0.52 + d.z * 0.28;
    idx++;
  }

  // --- Vertical brainstem under center (clear stem) ---
  for (let j = 0; j < nStem && idx < count; j++) {
    const t = j / Math.max(nStem - 1, 1);
    const a = hash(j * 4.1) * Math.PI * 2;
    // Slight taper downward
    const r = 0.11 * (1 - t * 0.35);
    pos[idx * 3] = Math.cos(a) * r + (hash(j * 1.5) - 0.5) * 0.018;
    pos[idx * 3 + 1] = -0.32 - t * 0.55;
    pos[idx * 3 + 2] = -0.04 + Math.sin(a) * r * 0.35;
    idx++;
  }

  // --- Minimal aura (avoid fuzzy cloud look) ---
  for (let j = 0; j < nAura && idx < count; j++) {
    const d = fibDir(j + 101, Math.max(nAura, 1));
    const R = 1.02 + hash(j * 0.4) * 0.12;
    pos[idx * 3] = d.x * R * 0.88;
    pos[idx * 3 + 1] = d.y * R * 0.52;
    pos[idx * 3 + 2] = d.z * R * 0.72;
    idx++;
  }

  // Remainder always onto surface — never origin
  fillRemainder(pos, idx, count, 0.92, 0.62);
  return pos;
}

export function createDistorted(count) {
  const base = createBrain(count);
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const x = base[i * 3];
    const y = base[i * 3 + 1];
    const z = base[i * 3 + 2];
    const n = noise3(x * 3, y * 3, z * 3);
    const stretch = 1.08 + n * 0.12;
    pos[i * 3] = x * stretch + Math.sin(y * 4) * 0.05;
    pos[i * 3 + 1] = y * (0.95 + n * 0.1);
    pos[i * 3 + 2] = z * stretch * 0.98 + Math.sin(x * 4) * 0.06;
  }
  return pos;
}

export function createAbstract(count) {
  return createScatter(count);
}

/** Lightbulb — round glass head, neck, screw base */
export function createBulb(count) {
  const pos = new Float32Array(count * 3);
  const nGlass = Math.floor(count * 0.55);
  const nInner = Math.floor(count * 0.08);
  const nNeck = Math.floor(count * 0.12);
  const nScrew = Math.floor(count * 0.15);
  const nBase = Math.floor(count * 0.05);
  const nGlow = count - nGlass - nInner - nNeck - nScrew - nBase;
  let idx = 0;

  for (let i = 0; i < nGlass; i++) {
    const d = fibDir(i, nGlass);
    let ly = d.y;
    if (ly < -0.2) ly = -0.2 + (ly + 0.2) * 0.3;
    const n = noise3(d.x * 3, ly * 3, d.z * 3) * 0.03;
    pos[idx * 3] = d.x * (0.72 + n);
    pos[idx * 3 + 1] = ly * (0.82 + n) + 0.5;
    pos[idx * 3 + 2] = d.z * (0.72 + n);
    idx++;
  }

  for (let j = 0; j < nInner && idx < count; j++) {
    const d = fibDir(j + 7, nInner);
    const r = 0.2 + hash(j) * 0.18;
    pos[idx * 3] = d.x * r * 0.5;
    pos[idx * 3 + 1] = 0.5 + d.y * r * 0.65;
    pos[idx * 3 + 2] = d.z * r * 0.5;
    idx++;
  }

  for (let i = 0; i < nNeck && idx < count; i++) {
    const t = i / Math.max(nNeck - 1, 1);
    const a = hash(i * 0.73) * Math.PI * 2;
    const radius = 0.28 * (1 - t * 0.5) + 0.08;
    const y = 0.05 - t * 0.45;
    pos[idx * 3] = Math.cos(a) * radius;
    pos[idx * 3 + 1] = y;
    pos[idx * 3 + 2] = Math.sin(a) * radius;
    idx++;
  }

  for (let i = 0; i < nScrew && idx < count; i++) {
    const t = i / Math.max(nScrew - 1, 1);
    const turns = 3.5;
    const a = t * Math.PI * 2 * turns + hash(i) * 0.3;
    const radius = 0.26 + Math.sin(t * Math.PI * turns * 2) * 0.03;
    const y = -0.38 - t * 0.5;
    pos[idx * 3] = Math.cos(a) * radius;
    pos[idx * 3 + 1] = y;
    pos[idx * 3 + 2] = Math.sin(a) * radius;
    idx++;
  }

  for (let i = 0; i < nBase && idx < count; i++) {
    const a = (i / Math.max(nBase, 1)) * Math.PI * 2;
    const r = Math.sqrt(hash(i * 1.1)) * 0.16;
    pos[idx * 3] = Math.cos(a) * r;
    pos[idx * 3 + 1] = -0.95;
    pos[idx * 3 + 2] = Math.sin(a) * r;
    idx++;
  }

  for (let j = 0; j < nGlow && idx < count; j++) {
    const d = fibDir(j + 31, Math.max(nGlow, 1));
    let ly = d.y;
    if (ly < -0.2) ly = -0.2 + (ly + 0.2) * 0.3;
    const R = 0.95 + hash(j * 0.5) * 0.15;
    pos[idx * 3] = d.x * R * 0.8;
    pos[idx * 3 + 1] = ly * R * 0.85 + 0.45;
    pos[idx * 3 + 2] = d.z * R * 0.8;
    idx++;
  }

  fillRemainder(pos, idx, count, 0.85, 0.8);
  return pos;
}

/** Globe / earth-like sphere with continent density bias */
export function createGlobe(count) {
  const pos = new Float32Array(count * 3);
  const R = 1.05;
  for (let i = 0; i < count; i++) {
    const d = fibDir(i, count);
    const n = noise3(d.x * 4, d.y * 4, d.z * 4);
    const surface = n > -0.15 ? 1.0 : 0.92;
    const r = R * surface + hash(i) * 0.02;
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
    const n = noise3(d.x * 3, d.y * 3, d.z * 3);
    const r = 0.7 + n * 0.25 + hash(i) * 0.15;
    const squash = 1 + Math.sin(d.y * Math.PI) * 0.2;
    pos[i * 3] = d.x * r * squash;
    pos[i * 3 + 1] = d.y * r * 1.15;
    pos[i * 3 + 2] = d.z * r * 0.85;
  }
  return pos;
}

/** Reference path: brain → distorted → abstract → bulb → globe → structure */
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

/** Equal particle counts across all morph targets */
export function buildMorphTargets(count) {
  return SHAPE_ORDER.map((name) => generateShape(name, count));
}
