/**
 * Procedural volumetric shapes — Dala-matched silhouettes.
 * Phase 3 brain: dual hemispheres · deep fissure · gyri · cerebellum · stem
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
 * Phase 3 hero brain — clear silhouette:
 * cortex folds, longitudinal fissure, L/R hemispheres,
 * cerebellum dual lobes, brainstem taper.
 */
export function createBrain(count) {
  const positions = new Float32Array(count * 3);
  const scaleX = 1.32;
  const scaleY = 0.9;
  const scaleZ = 1.52;

  const nCortex = Math.floor(count * 0.72);
  const nInterior = Math.floor(count * 0.18);
  const nCerebellum = Math.floor(count * 0.07);
  const nStem = count - nCortex - nInterior - nCerebellum;
  let idx = 0;

  // Cortex surface
  for (let i = 0; i < nCortex; i++) {
    let { x, y, z } = fibDirection(i, nCortex);

    const n1 = noise3(x * 2.5, y * 2.5, z * 2.5);
    const n2 = noise3(x * 6.5 + 1.2, y * 6.5, z * 6.5 - 0.8);
    const n3 = noise3(x * 13.0, y * 13.0 + 2.0, z * 13.0);
    const n4 = noise3(x * 24.0 + 4.1, y * 24.0, z * 24.0 - 1.5);
    const fold = 0.15 * n1 + 0.09 * n2 + 0.04 * n3 + 0.018 * n4;

    const fissure = -0.18 * Math.exp(-x * x * 22.0);
    const hemi = Math.sign(x || 0.001) * 0.14 * Math.min(1, Math.abs(x) * 1.4);
    const frontal = Math.max(0, -z) * 0.055;
    const occip = Math.max(0, z) * Math.max(0, y) * 0.04;
    const temporal = Math.max(0, Math.abs(x) - 0.3) * Math.max(0, -y + 0.2) * 0.05;

    const radius = 1.0 + fold + fissure + hemi + frontal + occip + temporal;

    x *= radius * scaleX;
    y *= radius * scaleY;
    z *= radius * scaleZ;
    y += 0.1;

    x += (hash(i * 0.137 + 19.7) - 0.5) * 0.018;
    y += (hash(i * 0.271 + 3.1) - 0.5) * 0.014;
    z += (hash(i * 0.419 + 7.9) - 0.5) * 0.018;

    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = z;
    idx++;
  }

  // Interior fill
  for (let j = 0; j < nInterior; j++) {
    let { x, y, z } = fibDirection(j * 5 + 3, nInterior * 2);
    const u = hash(j * 0.91 + 2.3);
    const r = 0.42 + Math.cbrt(u) * 0.42;
    const n1 = noise3(x * 3.2, y * 3.2, z * 3.2) * 0.05;
    const hemi = Math.sign(x || 0.001) * 0.06 * Math.abs(x);
    const fissure = -0.1 * Math.exp(-x * x * 16.0);
    x *= (r + n1 + hemi + fissure) * scaleX;
    y *= (r + n1) * scaleY;
    z *= (r + n1) * scaleZ;
    y += 0.08;
    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = z;
    idx++;
  }

  // Cerebellum dual lobes (rear-bottom)
  for (let j = 0; j < nCerebellum; j++) {
    const side = hash(j * 0.5) > 0.5 ? 1 : -1;
    const a = hash(j * 1.1) * Math.PI * 2;
    const elev = (hash(j * 2.3) - 0.5) * Math.PI * 0.55;
    const r = 0.22 + hash(j * 0.7) * 0.12;
    const fold = noise3(a, elev, j * 0.1) * 0.04;
    const cx = side * (0.22 + Math.cos(a) * (r + fold) * 0.7);
    const cy = -0.55 + Math.sin(elev) * (r + fold) * 0.6;
    const cz = 0.55 + Math.sin(a) * (r + fold) * 0.85;
    positions[idx * 3] = cx * scaleX;
    positions[idx * 3 + 1] = cy * scaleY + 0.06;
    positions[idx * 3 + 2] = cz * scaleZ;
    idx++;
  }

  // Brainstem
  for (let j = 0; j < nStem && idx < count; j++) {
    const t = j / Math.max(nStem - 1, 1);
    const a = hash(j * 3.1) * Math.PI * 2;
    const r = 0.14 * (1.0 - t * 0.55) + (hash(j) - 0.5) * 0.02;
    positions[idx * 3] = Math.cos(a) * r * scaleX;
    positions[idx * 3 + 1] = -0.35 - t * 0.45;
    positions[idx * 3 + 2] = Math.sin(a) * r * 0.7 * scaleZ + 0.08;
    idx++;
  }

  while (idx < count) {
    const { x, y, z } = fibDirection(idx, count);
    positions[idx * 3] = x * 0.5 * scaleX;
    positions[idx * 3 + 1] = y * 0.5 * scaleY + 0.08;
    positions[idx * 3 + 2] = z * 0.5 * scaleZ;
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
