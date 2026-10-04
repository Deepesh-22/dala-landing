/**
 * Procedural volumetric shapes — Dala-matched silhouettes.
 * High-detail brain: lobes, sulci, fissure, cerebellum, stem.
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
  const inclination = Math.acos(1 - 2 * t);
  const azimuth = Math.PI * (1 + Math.sqrt(5)) * i;
  return {
    x: Math.sin(inclination) * Math.cos(azimuth),
    y: Math.cos(inclination),
    z: Math.sin(inclination) * Math.sin(azimuth),
  };
}

/** Directed cortical ridges (sulci / gyri bands). */
function sulcusRidge(x, y, z) {
  // Primary bands wrap the cortex
  const band1 = Math.sin(y * 9.0 + z * 3.5) * Math.cos(x * 2.0);
  const band2 = Math.sin(z * 11.0 - y * 4.0) * Math.cos(x * 1.5 + 1.2);
  const band3 = Math.sin((y + z) * 7.5 + x * 2.5);
  // Fine secondary wrinkles
  const fine = Math.sin(x * 18 + y * 22 + z * 14) * 0.35;
  return 0.035 * band1 + 0.028 * band2 + 0.022 * band3 + 0.012 * fine;
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
 * High-detail brain silhouette.
 * Allocation: cortex 62% · interior 14% · sulcus ridges 8% ·
 * cerebellum 10% · brainstem 6%
 */
export function createBrain(count) {
  const positions = new Float32Array(count * 3);
  const scaleX = 1.38;
  const scaleY = 0.88;
  const scaleZ = 1.55;

  const nCortex = Math.floor(count * 0.62);
  const nInterior = Math.floor(count * 0.14);
  const nRidges = Math.floor(count * 0.08);
  const nCerebellum = Math.floor(count * 0.1);
  const nStem = count - nCortex - nInterior - nRidges - nCerebellum;
  let idx = 0;

  // ── Cortex surface (main silhouette) ───────────────────────
  for (let i = 0; i < nCortex; i++) {
    let { x, y, z } = fibDirection(i, nCortex);

    // Skip / thin the mid-sagittal plane for a readable fissure gap
    const absX = Math.abs(x);
    if (absX < 0.04 && hash(i * 0.51) > 0.35) {
      // push sample toward a hemisphere instead of filling the gap
      x = Math.sign(x || 1) * (0.08 + absX);
    }

    // Multi-octave organic folds
    const n1 = noise3(x * 2.6, y * 2.6, z * 2.6);
    const n2 = noise3(x * 6.8 + 1.2, y * 6.8, z * 6.8 - 0.8);
    const n3 = noise3(x * 14.0, y * 14.0 + 2.0, z * 14.0);
    const n4 = noise3(x * 26.0 + 4.1, y * 26.0, z * 26.0 - 1.5);
    const n5 = noise3(x * 40.0, y * 38.0 + 1.1, z * 42.0);
    const fold = 0.14 * n1 + 0.09 * n2 + 0.045 * n3 + 0.022 * n4 + 0.01 * n5;

    // Deep longitudinal fissure
    const fissure = -0.22 * Math.exp(-x * x * 28.0);

    // Hemisphere separation + slight upward dome per side
    const hemi =
      Math.sign(x || 0.001) * 0.16 * Math.min(1, absX * 1.5);
    const hemiDome = 0.04 * Math.max(0, absX - 0.15) * Math.max(0, y);

    // Lobe emphasis
    const frontal = Math.max(0, -z) * (0.07 + 0.03 * Math.max(0, y)); // front
    const parietal = Math.max(0, y) * Math.max(0, Math.abs(z) * 0.3) * 0.04;
    const occip = Math.max(0, z) * Math.max(0, y + 0.1) * 0.055; // rear top
    const temporal =
      Math.max(0, absX - 0.25) * Math.max(0, -y + 0.15) * 0.07; // lower sides

    // Directed sulcus ridges
    const ridge = sulcusRidge(x, y, z);

    let radius =
      1.0 +
      fold +
      fissure +
      hemi +
      hemiDome +
      frontal +
      parietal +
      occip +
      temporal +
      ridge;

    // Flatten underside slightly (more brain-like base)
    if (y < -0.2) {
      radius *= 0.92 + 0.08 * Math.max(0, y + 0.55);
    }

    x *= radius * scaleX;
    y *= radius * scaleY;
    z *= radius * scaleZ;
    y += 0.12;

    // Micro jitter (keeps surface alive without blurring silhouette)
    x += (hash(i * 0.137 + 19.7) - 0.5) * 0.014;
    y += (hash(i * 0.271 + 3.1) - 0.5) * 0.012;
    z += (hash(i * 0.419 + 7.9) - 0.5) * 0.014;

    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = z;
    idx++;
  }

  // ── Explicit sulcus ridge particles (surface accent lines) ─
  for (let j = 0; j < nRidges; j++) {
    const side = hash(j * 0.31) > 0.5 ? 1 : -1;
    const t = j / Math.max(nRidges - 1, 1);
    // Trace curved paths along each hemisphere
    const path = t * Math.PI * 1.6 - 0.3;
    const lat = (hash(j * 1.7) - 0.4) * 1.1;
    let x = side * (0.35 + 0.45 * Math.cos(path * 0.9));
    let y = Math.sin(lat) * 0.55 + 0.15 * Math.sin(path * 2);
    let z = Math.sin(path) * 0.7 + 0.1 * Math.cos(lat * 3);

    // Project outward onto cortex-ish radius
    const len = Math.sqrt(x * x + y * y + z * z) || 1;
    const r =
      1.05 +
      sulcusRidge(x / len, y / len, z / len) +
      noise3(x, y, z) * 0.04;
    x = (x / len) * r * scaleX;
    y = (y / len) * r * scaleY + 0.12;
    z = (z / len) * r * scaleZ;

    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = z;
    idx++;
  }

  // ── Interior volume (near cortex, keeps body solid) ────────
  for (let j = 0; j < nInterior; j++) {
    let { x, y, z } = fibDirection(j * 5 + 3, nInterior * 2);
    const u = hash(j * 0.91 + 2.3);
    const r = 0.4 + Math.cbrt(u) * 0.45;
    const n1 = noise3(x * 3.4, y * 3.4, z * 3.4) * 0.05;
    const hemi = Math.sign(x || 0.001) * 0.07 * Math.abs(x);
    const fissure = -0.12 * Math.exp(-x * x * 18.0);
    x *= (r + n1 + hemi + fissure) * scaleX;
    y *= (r + n1) * scaleY;
    z *= (r + n1) * scaleZ;
    y += 0.1;
    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = z;
    idx++;
  }

  // ── Cerebellum — dual lobes with foliation stripes ─────────
  for (let j = 0; j < nCerebellum; j++) {
    const side = hash(j * 0.5) > 0.5 ? 1 : -1;
    const a = hash(j * 1.1) * Math.PI * 2;
    const elev = (hash(j * 2.3) - 0.55) * Math.PI * 0.65;
    const r = 0.2 + hash(j * 0.7) * 0.14;

    // Foliation: striped displacement on cerebellum surface
    const folio = Math.sin(a * 8.0 + elev * 6.0) * 0.035;
    const fold = noise3(a * 2, elev * 2, j * 0.1) * 0.03 + folio;

    const cx = side * (0.26 + Math.cos(a) * (r + fold) * 0.75);
    const cy = -0.58 + Math.sin(elev) * (r + fold) * 0.55;
    const cz = 0.58 + Math.sin(a) * (r + fold) * 0.9;

    positions[idx * 3] = cx * scaleX;
    positions[idx * 3 + 1] = cy * scaleY + 0.08;
    positions[idx * 3 + 2] = cz * scaleZ;
    idx++;
  }

  // ── Brainstem + slight pons bulge ──────────────────────────
  for (let j = 0; j < nStem && idx < count; j++) {
    const t = j / Math.max(nStem - 1, 1);
    const a = hash(j * 3.1) * Math.PI * 2;
    // Wider near brain, taper down; mild pons bulge mid-way
    const pons = Math.exp(-Math.pow((t - 0.25) * 4.0, 2)) * 0.04;
    const r = 0.13 * (1.0 - t * 0.6) + pons + (hash(j) - 0.5) * 0.018;
    positions[idx * 3] = Math.cos(a) * r * scaleX;
    positions[idx * 3 + 1] = -0.32 - t * 0.5;
    positions[idx * 3 + 2] = Math.sin(a) * r * 0.65 * scaleZ + 0.06;
    idx++;
  }

  while (idx < count) {
    const { x, y, z } = fibDirection(idx, count);
    positions[idx * 3] = x * 0.45 * scaleX;
    positions[idx * 3 + 1] = y * 0.45 * scaleY + 0.1;
    positions[idx * 3 + 2] = z * 0.45 * scaleZ;
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
