/**
 * Procedural volumetric shapes.
 * Brain uses dual offset ellipsoids (true L/R hemispheres) +
 * surface-shell gyri — not a single noise-warped sphere.
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

function fibDirection(i, count) {
  const t = i / Math.max(count, 1);
  const inclination = Math.acos(1 - 2 * Math.min(1, Math.max(0, t)));
  const azimuth = Math.PI * (1 + Math.sqrt(5)) * i;
  return {
    x: Math.sin(inclination) * Math.cos(azimuth),
    y: Math.cos(inclination),
    z: Math.sin(inclination) * Math.sin(azimuth),
  };
}

/**
 * Sample a unit direction, map through an ellipsoid, apply cortex wrinkles.
 * @param {number} side -1 left / +1 right
 */
function cortexPoint(dir, side, seed) {
  // Real-ish proportions: wider than tall, longer front-back
  const ex = 0.72; // lateral radius of one hemisphere
  const ey = 0.62; // height
  const ez = 0.95; // anterior-posterior

  // Offset each hemisphere outward from midline (creates fissure gap)
  const hemiOffsetX = side * 0.22;

  let x = dir.x * ex;
  let y = dir.y * ey;
  let z = dir.z * ez;

  // Prefer outer side of each hemisphere (avoid filling the midline)
  // Push samples that face inward slightly outward
  if (side * x < 0.05) {
    x = side * (0.08 + Math.abs(x) * 0.5);
  }

  // Normalize to ellipsoid surface then add radial folds
  const nx = x / ex;
  const ny = y / ey;
  const nz = z / ez;
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
  let ux = nx / len;
  let uy = ny / len;
  let uz = nz / len;

  // —— Gyri / sulci (surface displacement along normal) ——
  // Large primary folds
  const g1 = noise3(ux * 3.2, uy * 3.2, uz * 3.2);
  // Medium cortical folds
  const g2 = noise3(ux * 7.5 + 1.1, uy * 7.5, uz * 7.5 - 0.6);
  // Fine wrinkles
  const g3 = noise3(ux * 16.0, uy * 16.0 + 2.0, uz * 16.0);
  const g4 = noise3(ux * 28.0 + seed, uy * 26.0, uz * 30.0);

  // Directional sulcus bands (run roughly along cortex)
  const band =
    Math.sin(uy * 10.0 + uz * 4.0) * 0.5 +
    Math.sin(uz * 12.0 - uy * 5.0 + side) * 0.35 +
    Math.sin((uy + uz) * 8.0 + ux * 3.0) * 0.25;

  // Radial thickness of cortex folds
  const fold = 0.07 * g1 + 0.05 * g2 + 0.028 * g3 + 0.014 * g4 + 0.03 * band;

  // Lobe sculpting (still on surface)
  // Frontal (anterior = -z in our frame after view)
  const frontal = Math.max(0, -uz) * 0.06;
  // Occipital rear-top
  const occip = Math.max(0, uz) * Math.max(0, uy) * 0.05;
  // Temporal lower lateral
  const temporal = Math.max(0, Math.abs(ux) - 0.2) * Math.max(0, -uy) * 0.055;
  // Flatten inferior surface slightly
  const inferior = uy < -0.25 ? -0.04 * (-uy - 0.25) : 0;

  const r = 1.0 + fold + frontal + occip + temporal + inferior;

  x = ux * r * ex + hemiOffsetX;
  y = uy * r * ey + 0.08;
  z = uz * r * ez;

  // Micro jitter
  x += (hash(seed * 1.1) - 0.5) * 0.01;
  y += (hash(seed * 2.3) - 0.5) * 0.008;
  z += (hash(seed * 3.7) - 0.5) * 0.01;

  return { x, y, z };
}

export function createScatter(count) {
  const positions = new Float32Array(count * 3);
  const R = 2.4;
  for (let i = 0; i < count; i++) {
    let { x, y, z } = fibDirection(i, count);
    const u = hash(i * 0.73 + 1.1);
    const r = Math.cbrt(u) * R;
    const n = noise3(x * 2.1, y * 2.1, z * 2.1) * 0.12;
    positions[i * 3] = x * (r + n);
    positions[i * 3 + 1] = y * (r + n) * 0.85;
    positions[i * 3 + 2] = z * (r + n);
  }
  return positions;
}

/**
 * Realistic brain particle cloud.
 * Strategy:
 *  1. Two separate hemisphere shells (offset ellipsoids) → clear fissure
 *  2. Surface-biased sampling (thin shell, not solid ball)
 *  3. Multi-scale gyri noise + directional sulcus bands
 *  4. Dedicated cerebellum dual lobes with foliation
 *  5. Brainstem taper with pons
 */
export function createBrain(count) {
  const positions = new Float32Array(count * 3);

  // Budget: mostly cortex surface on both hemispheres
  const nHemi = Math.floor(count * 0.72);
  const nHemiLeft = Math.floor(nHemi * 0.5);
  const nHemiRight = nHemi - nHemiLeft;
  const nNearSurface = Math.floor(count * 0.1);
  const nCerebellum = Math.floor(count * 0.12);
  const nStem = count - nHemi - nNearSurface - nCerebellum;
  let idx = 0;

  // ── Left hemisphere cortex ─────────────────────────────────
  for (let i = 0; i < nHemiLeft; i++) {
    // Bias fib samples toward outer (+/-x) by mirroring inward faces
    let dir = fibDirection(i * 2 + 1, nHemiLeft * 2);
    // Prefer points with x <= 0 for left, flip if needed
    if (dir.x > 0.15) dir = { x: -dir.x, y: dir.y, z: dir.z };
    const p = cortexPoint(dir, -1, i + 0.17);
    positions[idx * 3] = p.x;
    positions[idx * 3 + 1] = p.y;
    positions[idx * 3 + 2] = p.z;
    idx++;
  }

  // ── Right hemisphere cortex ────────────────────────────────
  for (let i = 0; i < nHemiRight; i++) {
    let dir = fibDirection(i * 2 + 3, nHemiRight * 2);
    if (dir.x < -0.15) dir = { x: -dir.x, y: dir.y, z: dir.z };
    const p = cortexPoint(dir, 1, i + 0.91);
    positions[idx * 3] = p.x;
    positions[idx * 3 + 1] = p.y;
    positions[idx * 3 + 2] = p.z;
    idx++;
  }

  // ── Thin near-surface shell (adds density without filling core) ─
  for (let j = 0; j < nNearSurface; j++) {
    const side = hash(j * 0.63) > 0.5 ? 1 : -1;
    let dir = fibDirection(j * 3 + 11, nNearSurface * 3);
    if (side < 0 && dir.x > 0) dir = { x: -Math.abs(dir.x), y: dir.y, z: dir.z };
    if (side > 0 && dir.x < 0) dir = { x: Math.abs(dir.x), y: dir.y, z: dir.z };
    const p = cortexPoint(dir, side, j + 4.2);
    // Pull slightly inward (0.92–0.98 of surface)
    const s = 0.92 + hash(j * 1.3) * 0.06;
    positions[idx * 3] = p.x * s + side * 0.02;
    positions[idx * 3 + 1] = p.y * s;
    positions[idx * 3 + 2] = p.z * s;
    idx++;
  }

  // ── Cerebellum: two small ellipsoids, rear-inferior ─────────
  for (let j = 0; j < nCerebellum; j++) {
    const side = hash(j * 0.41) > 0.5 ? 1 : -1;
    const a = hash(j * 1.17) * Math.PI * 2;
    const elev = (hash(j * 2.41) - 0.5) * Math.PI; // full sphere sample
    // Foliation stripes (horizontal-ish layers typical of cerebellum)
    const folio = Math.sin(elev * 14.0 + a * 2.0) * 0.04;
    const noise = noise3(a, elev, j * 0.2) * 0.025;

    const rx = 0.28 + folio + noise;
    const ry = 0.22 + noise;
    const rz = 0.32 + folio * 0.5;

    const cx = side * (0.28 + Math.cos(a) * Math.cos(elev) * rx);
    const cy = -0.52 + Math.sin(elev) * ry;
    const cz = 0.55 + Math.sin(a) * Math.cos(elev) * rz;

    positions[idx * 3] = cx;
    positions[idx * 3 + 1] = cy;
    positions[idx * 3 + 2] = cz;
    idx++;
  }

  // ── Brainstem + pons ───────────────────────────────────────
  for (let j = 0; j < nStem && idx < count; j++) {
    const t = j / Math.max(nStem - 1, 1);
    const a = hash(j * 3.3) * Math.PI * 2;
    // Pons bulge near top of stem
    const pons = Math.exp(-Math.pow((t - 0.2) * 5.0, 2)) * 0.05;
    const r = 0.11 * (1.0 - t * 0.55) + pons + (hash(j) - 0.5) * 0.015;
    positions[idx * 3] = Math.cos(a) * r;
    positions[idx * 3 + 1] = -0.28 - t * 0.55;
    positions[idx * 3 + 2] = Math.sin(a) * r * 0.7 + 0.12;
    idx++;
  }

  // Pad remaining
  while (idx < count) {
    const side = idx % 2 === 0 ? -1 : 1;
    const dir = fibDirection(idx, count);
    const p = cortexPoint(dir, side, idx * 0.37);
    positions[idx * 3] = p.x;
    positions[idx * 3 + 1] = p.y;
    positions[idx * 3 + 2] = p.z;
    idx++;
  }

  return positions;
}

export function createBulb(count) {
  const positions = new Float32Array(count * 3);
  const nGlobe = Math.floor(count * 0.55);
  const nInterior = Math.floor(count * 0.15);
  const nNeck = Math.floor(count * 0.18);
  const nBase = count - nGlobe - nInterior - nNeck;
  let idx = 0;

  for (let i = 0; i < nGlobe; i++) {
    let { x, y, z } = fibDirection(i, nGlobe);
    const r = 0.88 + noise3(x * 3, y * 3, z * 3) * 0.06;
    x *= r;
    y = y * r * 0.95 + 0.55;
    z *= r;
    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = z;
    idx++;
  }

  for (let i = 0; i < nInterior; i++) {
    let { x, y, z } = fibDirection(i + 11, nInterior);
    const r = Math.cbrt(hash(i * 0.7)) * 0.55;
    x *= r;
    y = y * r + 0.55;
    z *= r;
    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = z;
    idx++;
  }

  for (let i = 0; i < nNeck; i++) {
    const t = i / Math.max(nNeck - 1, 1);
    const angle = hash(i * 0.7) * Math.PI * 2;
    const radius = 0.28 * (1.0 - t * 0.55) + (hash(i * 1.1) - 0.5) * 0.04;
    const y = 0.55 - t * 0.75;
    positions[idx * 3] = Math.cos(angle) * radius;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = Math.sin(angle) * radius;
    idx++;
  }

  for (let i = 0; i < nBase; i++) {
    const angle = (i / nBase) * Math.PI * 2 + hash(i) * 0.5;
    const r = Math.sqrt(hash(i * 0.9)) * 0.42;
    const y = -0.22 + (hash(i * 1.3) - 0.5) * 0.04;
    positions[idx * 3] = Math.cos(angle) * r;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = Math.sin(angle) * r;
    idx++;
  }

  return positions;
}

export function createGlobe(count) {
  const positions = new Float32Array(count * 3);
  const nSurface = Math.floor(count * 0.78);
  const nVolume = count - nSurface;
  const R = 1.12;

  function continentHeight(lon, lat) {
    let h = 0;
    {
      const dlon = lon - 0.35;
      const dlat = lat - 0.08;
      h += Math.exp(-(dlon * dlon * 2.6 + dlat * dlat * 3.2)) * 0.1;
      h += Math.exp(-((lon - 0.75) ** 2 * 8 + (lat - 0.15) ** 2 * 10)) * 0.06;
    }
    {
      const dlon = lon - 1.35;
      const dlat = lat - 0.72;
      h += Math.exp(-(dlon * dlon * 0.75 + dlat * dlat * 4.0)) * 0.075;
      h += Math.exp(-((lon - 1.35) ** 2 * 6 + (lat - 0.28) ** 2 * 8)) * 0.04;
    }
    {
      const dlon = lon + 1.75;
      const dlat = lat - 0.7;
      const taper = 1.0 - Math.max(0, lat + 0.2) * 0.5;
      h += Math.exp(-(dlon * dlon * 2.0 + dlat * dlat * 2.8)) * 0.08 * taper;
    }
    {
      const dlon = lon + 1.05;
      const dlat = lat + 0.25;
      const taper = 1.0 - Math.max(0, -lat - 0.1) * 0.4;
      h += Math.exp(-(dlon * dlon * 3.5 + dlat * dlat * 2.0)) * 0.085 * taper;
    }
    {
      const dlon = lon - 2.35;
      const dlat = lat + 0.45;
      h += Math.exp(-(dlon * dlon * 5.0 + dlat * dlat * 5.5)) * 0.07;
    }
    if (lat < -1.0) h += 0.045 * Math.max(0, -lat - 1.0);
    const ocean = -0.04 * (1.0 - Math.min(1, h * 10));
    const coast = noise3(lon * 4.0, lat * 4.0, 0.5) * 0.015;
    return h + ocean + coast;
  }

  for (let i = 0; i < nSurface; i++) {
    let { x, y, z } = fibDirection(i, nSurface);
    const lat = Math.asin(Math.max(-1, Math.min(1, y)));
    const lon = Math.atan2(z, x);
    const land = continentHeight(lon, lat);
    const band = Math.sin(lat * 5.0) * 0.012;
    const ridge =
      land > 0.02
        ? noise3(x * 5.5, y * 5.5, z * 5.5) * 0.02
        : noise3(x * 3.0, y * 3.0, z * 3.0) * 0.008;
    const radius = R + land + band + ridge;
    positions[i * 3] = x * radius;
    positions[i * 3 + 1] = y * radius;
    positions[i * 3 + 2] = z * radius;
  }

  for (let j = 0; j < nVolume; j++) {
    const i = nSurface + j;
    let { x, y, z } = fibDirection(j + 5, nVolume);
    const r = Math.cbrt(hash(j * 1.1)) * 0.78;
    positions[i * 3] = x * r;
    positions[i * 3 + 1] = y * r;
    positions[i * 3 + 2] = z * r;
  }

  return positions;
}

export function createAbstract(count) {
  const positions = new Float32Array(count * 3);
  const nSurface = Math.floor(count * 0.72);
  const nVolume = count - nSurface;

  for (let i = 0; i < nSurface; i++) {
    const t = i / Math.max(nSurface - 1, 1);
    const angle = t * Math.PI * 5.5;
    const twist = t * Math.PI * 3.2;
    const radius =
      0.5 + 0.4 * Math.sin(t * Math.PI * 2.5) + 0.1 * Math.sin(t * Math.PI * 7);
    const elev = (t - 0.5) * 2.3;

    const cx = Math.cos(angle) * radius;
    const cy = elev + Math.sin(twist) * 0.22;
    const cz = Math.sin(angle) * radius * 0.85;

    const tubeR = 0.24 + noise3(cx * 2, cy * 2, cz * 2) * 0.07;
    const { x: dx, y: dy, z: dz } = fibDirection(i * 3 + 11, nSurface * 2);

    positions[i * 3] = cx + dx * tubeR * 0.5;
    positions[i * 3 + 1] = cy + dy * tubeR * 1.2;
    positions[i * 3 + 2] = cz + dz * tubeR * 0.5;
  }

  for (let j = 0; j < nVolume; j++) {
    const i = nSurface + j;
    const t = hash(j * 0.61);
    const angle = t * Math.PI * 5.5;
    const radius = 0.5 + 0.4 * Math.sin(t * Math.PI * 2.5);
    const elev = (t - 0.5) * 2.3;
    const r = Math.cbrt(hash(j * 1.3)) * 0.38;
    const { x, y, z } = fibDirection(j + 19, nVolume);
    positions[i * 3] = Math.cos(angle) * radius + x * r;
    positions[i * 3 + 1] = elev + y * r * 0.8;
    positions[i * 3 + 2] = Math.sin(angle) * radius * 0.85 + z * r;
  }

  return positions;
}

export function generateAllShapes(count) {
  return {
    scatter: createScatter(count),
    brain: createBrain(count),
    bulb: createBulb(count),
    globe: createGlobe(count),
    abstract: createAbstract(count),
  };
}
