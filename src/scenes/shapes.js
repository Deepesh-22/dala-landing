/**
 * Procedural particle positions.
 * Brain = lateral (side) silhouette like the Dala reference — NOT front dual hemispheres.
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
 * Side-view brain (sagittal / lateral) matching the Dala reference:
 * - Long horizontal cerebrum (front = left/nose, back = occipital)
 * - Domed top with gyri folds
 * - Cerebellum under rear as rounded lobe
 * - Brainstem dropping down from center-rear
 * - Slight thickness in Z for 3D depth
 *
 * Coordinate convention:
 *   X = anterior ↔ posterior (front ↔ back)
 *   Y = superior ↔ inferior (up ↔ down)
 *   Z = left ↔ right thickness
 */
export function createBrain(count) {
  const pos = new Float32Array(count * 3);
  const nCortex = Math.floor(count * 0.72);
  const nCere = Math.floor(count * 0.16);
  const nStem = Math.floor(count * 0.08);
  const nInner = count - nCortex - nCere - nStem;
  let idx = 0;

  // ── Cerebrum surface (main mass) ─────────────────────────────
  // Parametric outline of a side-profile brain, then add thickness in Z
  for (let i = 0; i < nCortex; i++) {
    const u = hash(i * 1.17); // 0–1 along perimeter-ish
    const v = hash(i * 2.31); // depth into surface shell

    // Angle around the cerebral outline (0 = front, π = back top, etc.)
    const theta = u * Math.PI * 2;

    // Base ellipse, then sculpt into brain profile
    let rx = 1.15;
    let ry = 0.78;

    // Frontal lobe (theta near π/2 from front) — bulge forward-down slightly
    // Using cos/sin: x = cos(theta), y = sin(theta)
    // theta=0 → +X (posterior), theta=π → -X (anterior) — flip so -X is front
    let cx = -Math.cos(theta); // -1 front, +1 back
    let cy = Math.sin(theta);

    // Stretch into brain proportions
    // Flatten underside (cy < 0), raise crown
    if (cy < 0) {
      cy *= 0.72;
      // Cut a notch where brainstem/cerebellum attach (rear underside)
      if (cx > 0.15) cy *= 0.85;
    } else {
      cy *= 1.05; // dome
    }

    // Frontal pole: push further forward and slightly down
    if (cx < -0.3) {
      cx *= 1.08;
      cy -= 0.04 * (1 + cx); // dip frontal
    }

    // Occipital: round back
    if (cx > 0.4) {
      cx *= 1.02;
    }

    // Gyri folds along surface
    const fold =
      noise3(cx * 5, cy * 5, i * 0.01) * 0.05 +
      noise3(cx * 12, cy * 12, i * 0.02) * 0.028 +
      noise3(cx * 28, cy * 28, i * 0.03) * 0.012 +
      Math.sin(cx * 14 + cy * 9) * 0.02;

    // Surface shell: v near 1 = outer, lower = slightly inward
    const shell = 0.82 + v * 0.18;
    const rFold = 1.0 + fold;

    const x = cx * rx * shell * rFold;
    const y = cy * ry * shell * rFold + 0.18;

    // Thickness in Z — thinner at edges of silhouette, fuller in middle
    const edge = Math.abs(cx) * 0.3 + Math.abs(cy) * 0.2;
    const zMax = 0.55 * (1.0 - edge * 0.5);
    const z = (hash(i * 4.4) - 0.5) * 2 * zMax;

    pos[idx * 3] = x;
    pos[idx * 3 + 1] = y;
    pos[idx * 3 + 2] = z;
    idx++;
  }

  // ── Cerebellum (rear, lower, rounded with foliation) ─────────
  for (let j = 0; j < nCere; j++) {
    const d = fibDir(j, nCere);
    // Foliation: striped folds
    const folio = Math.sin(d.y * 22 + d.x * 8) * 0.03;
    const rx = 0.38 + folio;
    const ry = 0.32;
    const rz = 0.42;

    pos[idx * 3] = 0.55 + d.x * rx; // rear
    pos[idx * 3 + 1] = -0.42 + d.y * ry; // below cerebrum
    pos[idx * 3 + 2] = d.z * rz * 0.9;
    idx++;
  }

  // ── Brainstem (downward column from center-rear) ─────────────
  for (let j = 0; j < nStem; j++) {
    const t = j / Math.max(nStem - 1, 1);
    const a = hash(j * 3.3) * Math.PI * 2;
    const r = 0.11 * (1 - t * 0.4);
    pos[idx * 3] = 0.12 + (hash(j) - 0.5) * 0.06;
    pos[idx * 3 + 1] = -0.15 - t * 0.85;
    pos[idx * 3 + 2] = Math.cos(a) * r;
    // Also add a bit of X spread as y drops
    pos[idx * 3] += Math.sin(a) * r * 0.5;
    idx++;
  }

  // ── Sparse inner fill (darker center, less dense) ────────────
  for (let j = 0; j < nInner && idx < count; j++) {
    const d = fibDir(j + 99, nInner);
    const r = 0.35 + hash(j) * 0.35;
    pos[idx * 3] = d.x * r * 0.9;
    pos[idx * 3 + 1] = d.y * r * 0.65 + 0.1;
    pos[idx * 3 + 2] = d.z * r * 0.45;
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
