/**
 * Procedural particle targets — fidelity-tuned brain silhouette.
 * States: brain, distorted, abstract, bulb, scatter, structure
 *
 * Brain: dual hemisphere, deep medial fissure, cortical folds,
 * cerebellum, brainstem — readable at hero scale.
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

function fillRemainder(pos, idx, count, radius = 0.95, yScale = 0.7) {
  while (idx < count) {
    const d = fibDir(idx + 997, count);
    const R = radius + hash(idx * 1.13) * 0.28;
    pos[idx * 3] = d.x * R;
    pos[idx * 3 + 1] = d.y * R * yScale;
    pos[idx * 3 + 2] = d.z * R;
    idx++;
  }
  return idx;
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
    const r = Math.cbrt(u) * R * (0.55 + hash(i * 1.1) * 0.45);
    const n = noise3(d.x * 2, d.y * 2, d.z * 2) * 0.15;
    pos[i * 3] = d.x * (r + n);
    pos[i * 3 + 1] = d.y * (r + n) * 0.75;
    pos[i * 3 + 2] = d.z * (r + n);
  }
  return pos;
}

/**
 * Fidelity-tuned brain — readable dual-hemisphere silhouette.
 * More surface mass, deeper fissure, stronger cortical relief.
 */
export function createBrain(count) {
  const pos = new Float32Array(count * 3);
  // Bias toward surface for silhouette readability
  const nSurface = Math.floor(count * 0.74);
  const nInternal = Math.floor(count * 0.08);
  const nMedial = Math.floor(count * 0.05);
  const nCere = Math.floor(count * 0.09);
  const nStem = Math.floor(count * 0.03);
  const nAura = count - nSurface - nInternal - nMedial - nCere - nStem;
  let idx = 0;

  // Wider interhemispheric gap → clearer two-lobe read
  const HEMI_GAP = 0.34;
  const RX = 0.78;
  const RY = 0.62;
  const RZ = 1.05;

  for (let i = 0; i < nSurface; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const hemiIndex = Math.floor(i / 2);
    const hemiCount = Math.ceil(nSurface / 2);
    const d = fibDir(hemiIndex, hemiCount);

    // Push points off the midplane so the fissure is empty
    let lx = Math.abs(d.x) * 0.78 + 0.32;
    let ly = d.y;
    let lz = d.z;

    // Mild left/right asymmetry (organic, not mirrored clone)
    const asymX = side < 0 ? 0.94 : 1.06;
    const asymY = side < 0 ? 1.03 : 0.97;
    const asymZ = side < 0 ? 0.98 : 1.02;

    let len = Math.sqrt(lx * lx + ly * ly + lz * lz) || 1;
    lx /= len;
    ly /= len;
    lz /= len;

    let rx = RX * asymX;
    let ry = RY * asymY;
    let rz = RZ * asymZ;

    // Frontal expansion
    if (lz > 0.22) {
      rz *= 1.18;
      ry *= 0.93;
      rx *= 1.08;
    }
    // Occipital taper
    if (lz < -0.3) {
      rx *= 0.76;
      rz *= 0.82;
      ry *= 0.86;
    }
    // Superior parietal
    if (ly > 0.3) {
      rx *= 1.12;
      ry *= 1.14;
    }
    // Temporal lobe dip
    if (ly < -0.1 && lx > 0.32) {
      ry *= 0.64;
      ly -= 0.12;
    }

    // Multi-scale cortical folds (sulci readable at hero distance)
    const g1 = noise3(lx * 9 + side * 2.8, ly * 9, lz * 9);
    const g2 = noise3(lx * 18, ly * 18 + side, lz * 18);
    const g3 = noise3(lx * 34 + side, ly * 34, lz * 34);
    const sulcus =
      Math.sin(lz * 13 + ly * 8) * 0.04 +
      Math.sin(ly * 26 - lz * 11 + lx * 6) * 0.03 +
      Math.sin(lz * 38 + lx * 14) * 0.018 +
      Math.sin(ly * 42) * 0.012;
    const fold = g1 * 0.085 + g2 * 0.05 + g3 * 0.028 + sulcus;

    const shell = 0.93 + hash(i * 1.37) * 0.07;
    // Occasional deep sulcus pocket
    const deep = hash(i * 3.1) > 0.88 ? 0.78 : 1.0;
    const r = (1.0 + fold) * shell * deep;

    pos[idx * 3] = side * (HEMI_GAP + lx * r * rx);
    pos[idx * 3 + 1] = ly * r * ry + 0.12;
    pos[idx * 3 + 2] = lz * r * rz;
    idx++;
  }

  // Soft internal mass (not origin clump)
  for (let j = 0; j < nInternal && idx < count; j++) {
    const side = j % 2 === 0 ? -1 : 1;
    const d = fibDir(j + 19, nInternal);
    const u = hash(j * 2.1);
    const r = 0.22 + u * 0.36;
    pos[idx * 3] = side * (HEMI_GAP * 0.65 + Math.abs(d.x) * r * RX * 0.6);
    pos[idx * 3 + 1] = d.y * r * RY * 0.55 + 0.12;
    pos[idx * 3 + 2] = d.z * r * RZ * 0.6;
    idx++;
  }

  // Thin medial wall particles (fissure edge)
  for (let j = 0; j < nMedial && idx < count; j++) {
    const side = j % 2 === 0 ? -1 : 1;
    pos[idx * 3] = side * (0.08 + hash(j) * 0.05);
    pos[idx * 3 + 1] = (hash(j * 1.9) - 0.4) * RY * 0.95 + 0.12;
    pos[idx * 3 + 2] = (hash(j * 2.7) - 0.5) * RZ * 0.7;
    idx++;
  }

  // Cerebellum — distinct rear-lower mass with fine folia
  for (let j = 0; j < nCere && idx < count; j++) {
    const side = hash(j * 0.61) > 0.5 ? 1 : -1;
    const d = fibDir(j, nCere);
    const folio = Math.sin(d.y * 36 + d.z * 14) * 0.035;
    pos[idx * 3] = side * (0.2 + Math.abs(d.x) * (0.28 + folio));
    pos[idx * 3 + 1] = -0.52 + d.y * 0.2;
    pos[idx * 3 + 2] = -0.62 + d.z * 0.3;
    idx++;
  }

  // Brainstem
  for (let j = 0; j < nStem && idx < count; j++) {
    const t = j / Math.max(nStem - 1, 1);
    const a = hash(j * 4.1) * Math.PI * 2;
    const r = 0.09 * (1 - t * 0.4);
    pos[idx * 3] = Math.cos(a) * r + (hash(j * 1.5) - 0.5) * 0.02;
    pos[idx * 3 + 1] = -0.32 - t * 0.58;
    pos[idx * 3 + 2] = -0.12 + Math.sin(a) * r * 0.45;
    idx++;
  }

  // Tight outer aura (not sparse scatter)
  for (let j = 0; j < nAura && idx < count; j++) {
    const d = fibDir(j + 101, Math.max(nAura, 1));
    const R = 1.08 + hash(j * 0.4) * 0.18;
    pos[idx * 3] = d.x * R * 0.88;
    pos[idx * 3 + 1] = d.y * R * 0.52;
    pos[idx * 3 + 2] = d.z * R * 0.82;
    idx++;
  }

  fillRemainder(pos, idx, count, 1.02, 0.55);
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
    const stretch = 1.1 + n * 0.16;
    const twist = n * 0.2;
    pos[i * 3] = x * stretch + Math.sin(y * 4) * 0.07 + twist * 0.12;
    pos[i * 3 + 1] = y * (0.92 + n * 0.14) + Math.cos(x * 3) * 0.055;
    pos[i * 3 + 2] = z * stretch * 0.96 + Math.sin(x * 5 + y * 2) * 0.09;
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
      0.5 + 0.45 * Math.sin(t * Math.PI * 2.5) + 0.12 * Math.sin(t * Math.PI * 7);
    const elev = (t - 0.5) * 2.2;
    const cx = Math.cos(angle) * radius;
    const cy = elev + Math.sin(twist) * 0.25;
    const cz = Math.sin(angle) * radius * 0.85;
    const d = fibDir(i * 3 + 11, count * 2);
    const tube = 0.22 + noise3(cx, cy, cz) * 0.06;
    pos[i * 3] = cx + d.x * tube * 0.55;
    pos[i * 3 + 1] = cy + d.y * tube;
    pos[i * 3 + 2] = cz + d.z * tube * 0.55;
  }
  return pos;
}

export function createBulb(count) {
  const pos = new Float32Array(count * 3);

  const nGlass = Math.floor(count * 0.52);
  const nInner = Math.floor(count * 0.1);
  const nNeck = Math.floor(count * 0.14);
  const nScrew = Math.floor(count * 0.14);
  const nBase = Math.floor(count * 0.05);
  const nGlow = count - nGlass - nInner - nNeck - nScrew - nBase;

  let idx = 0;

  for (let i = 0; i < nGlass; i++) {
    const d = fibDir(i, nGlass);
    let ly = d.y;
    if (ly < -0.15) ly = -0.15 + (ly + 0.15) * 0.35;

    const n = noise3(d.x * 4, ly * 4, d.z * 4) * 0.04;
    const rx = 0.78 + n;
    const ry = 0.88 + n;
    const rz = 0.78 + n;

    pos[idx * 3] = d.x * rx;
    pos[idx * 3 + 1] = ly * ry + 0.55;
    pos[idx * 3 + 2] = d.z * rz;
    idx++;
  }

  for (let j = 0; j < nInner && idx < count; j++) {
    const d = fibDir(j + 7, nInner);
    const r = 0.22 + hash(j) * 0.2;
    pos[idx * 3] = d.x * r * 0.55;
    pos[idx * 3 + 1] = 0.55 + d.y * r * 0.7;
    pos[idx * 3 + 2] = d.z * r * 0.55;
    idx++;
  }

  for (let i = 0; i < nNeck && idx < count; i++) {
    const t = i / Math.max(nNeck - 1, 1);
    const a = hash(i * 0.73) * Math.PI * 2;
    const radius = 0.32 * (1 - t * 0.55) + 0.08;
    const y = 0.12 - t * 0.55;
    const wobble = noise3(Math.cos(a), y, Math.sin(a)) * 0.02;
    pos[idx * 3] = Math.cos(a) * (radius + wobble);
    pos[idx * 3 + 1] = y;
    pos[idx * 3 + 2] = Math.sin(a) * (radius + wobble);
    idx++;
  }

  for (let i = 0; i < nScrew && idx < count; i++) {
    const t = i / Math.max(nScrew - 1, 1);
    const turns = 3.2;
    const a = t * Math.PI * 2 * turns + hash(i) * 0.4;
    const radius = 0.28 + Math.sin(t * Math.PI * turns * 2) * 0.035;
    const y = -0.42 - t * 0.55;
    pos[idx * 3] = Math.cos(a) * radius;
    pos[idx * 3 + 1] = y;
    pos[idx * 3 + 2] = Math.sin(a) * radius;
    idx++;
  }

  for (let i = 0; i < nBase && idx < count; i++) {
    const a = (i / Math.max(nBase, 1)) * Math.PI * 2;
    const r = Math.sqrt(hash(i * 1.1)) * 0.18;
    pos[idx * 3] = Math.cos(a) * r;
    pos[idx * 3 + 1] = -1.05;
    pos[idx * 3 + 2] = Math.sin(a) * r;
    idx++;
  }

  for (let j = 0; j < nGlow && idx < count; j++) {
    const d = fibDir(j + 31, Math.max(nGlow, 1));
    let ly = d.y;
    if (ly < -0.2) ly = -0.2 + (ly + 0.2) * 0.3;
    const R = 1.05 + hash(j * 0.5) * 0.2;
    pos[idx * 3] = d.x * R * 0.85;
    pos[idx * 3 + 1] = ly * R * 0.9 + 0.5;
    pos[idx * 3 + 2] = d.z * R * 0.85;
    idx++;
  }

  fillRemainder(pos, idx, count, 0.95, 0.85);
  return pos;
}

export function createStructure(count) {
  const pos = new Float32Array(count * 3);
  const nodes = 9;
  const nodePos = [];
  for (let n = 0; n < nodes; n++) {
    const d = fibDir(n * 7 + 3, nodes * 2);
    nodePos.push({
      x: d.x * 1.1,
      y: d.y * 0.9,
      z: d.z * 1.0,
    });
  }

  const perNode = Math.floor((count * 0.35) / nodes);
  const nLinks = Math.floor(count * 0.45);
  const nCore = count - perNode * nodes - nLinks;
  let idx = 0;

  for (let n = 0; n < nodes; n++) {
    const np = nodePos[n];
    for (let j = 0; j < perNode && idx < count; j++) {
      const d = fibDir(j + n * 13, perNode);
      const r = 0.12 + hash(j + n) * 0.1;
      pos[idx * 3] = np.x + d.x * r;
      pos[idx * 3 + 1] = np.y + d.y * r;
      pos[idx * 3 + 2] = np.z + d.z * r;
      idx++;
    }
  }

  for (let j = 0; j < nLinks && idx < count; j++) {
    const a = nodePos[j % nodes];
    const b = nodePos[(j + 1 + (j % 3)) % nodes];
    const t = hash(j * 1.7);
    const wobble = noise3(t * 5, j * 0.1, a.x) * 0.08;
    pos[idx * 3] = a.x + (b.x - a.x) * t + wobble;
    pos[idx * 3 + 1] = a.y + (b.y - a.y) * t + wobble * 0.5;
    pos[idx * 3 + 2] = a.z + (b.z - a.z) * t - wobble;
    idx++;
  }

  for (let j = 0; j < nCore && idx < count; j++) {
    const d = fibDir(j + 50, nCore);
    const r = 0.15 + hash(j) * 0.25;
    pos[idx * 3] = d.x * r;
    pos[idx * 3 + 1] = d.y * r * 0.8;
    pos[idx * 3 + 2] = d.z * r;
    idx++;
  }

  fillRemainder(pos, idx, count, 0.9, 0.75);
  return pos;
}

export const SHAPE_ORDER = [
  'brain',
  'distorted',
  'abstract',
  'bulb',
  'scatter',
  'structure',
];

export const SHAPE_FNS = {
  brain: createBrain,
  distorted: createDistorted,
  abstract: createAbstract,
  bulb: createBulb,
  scatter: createScatter,
  structure: createStructure,
  sphere: createSphere,
};

export function generateShape(name, count) {
  const fn = SHAPE_FNS[name] || createSphere;
  return fn(count);
}

export function buildMorphTargets(count) {
  return SHAPE_ORDER.map((name) => generateShape(name, count));
}
