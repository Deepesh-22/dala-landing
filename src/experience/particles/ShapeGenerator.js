/**
 * Procedural shapes — high-detail dual-hemisphere brain.
 * Anatomical cues: longitudinal fissure, Sylvian fissure,
 * central sulcus, gyri ridges, cerebellum foliation, brainstem.
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
    Math.sin(x * 17.0 + y * 13.0 + z * 11.0) * 0.03 +
    Math.sin(x * 31.0 + y * 27.0 + z * 23.0) * 0.015
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
 * Major anatomical grooves (negative radius = deeper sulcus).
 * Coordinates are on unit ellipsoid surface (ux,uy,uz).
 */
function anatomicalSulci(ux, uy, uz, side) {
  let d = 0;

  // Central sulcus — roughly coronal groove separating frontal / parietal
  // Runs near z≈0.05 from top toward lateral face
  {
    const along = uz - 0.05;
    const height = uy;
    const groove = Math.exp(-(along * along) * 55) * Math.max(0, height + 0.15);
    d -= 0.09 * groove;
  }

  // Sylvian (lateral) fissure — deep horizontal cleft on lateral face
  // Separates temporal lobe below from frontal/parietal above
  {
    const lat = Math.abs(ux);
    const height = uy + 0.05;
    const groove =
      Math.exp(-(height * height) * 40) *
      Math.max(0, lat - 0.15) *
      Math.max(0, 0.55 - Math.abs(uz));
    d -= 0.11 * groove;
  }

  // Precentral / postcentral companion grooves
  {
    const a = uz + 0.22;
    const b = uz - 0.28;
    d -= 0.045 * Math.exp(-(a * a) * 70) * Math.max(0, uy);
    d -= 0.04 * Math.exp(-(b * b) * 70) * Math.max(0, uy);
  }

  // Superior temporal sulcus (below Sylvian, lateral)
  {
    const h = uy + 0.28;
    d -=
      0.05 *
      Math.exp(-(h * h) * 50) *
      Math.max(0, Math.abs(ux) - 0.25) *
      Math.max(0, -uz + 0.2);
  }

  // Parieto-occipital hint (rear top)
  {
    const a = uz - 0.55;
    d -= 0.035 * Math.exp(-(a * a) * 40) * Math.max(0, uy - 0.1);
  }

  // Interhemispheric: slight extra cut on medial face
  if (side * ux < 0.2) {
    d -= 0.02 * Math.exp(-(ux * ux) * 8);
  }

  return d;
}

/** Dense gyral ridges between sulci */
function gyriTexture(ux, uy, uz, side) {
  const g1 = noise3(ux * 3.5, uy * 3.5, uz * 3.5);
  const g2 = noise3(ux * 8.0 + side, uy * 8.0, uz * 8.0 - 0.7);
  const g3 = noise3(ux * 18.0, uy * 18.0 + 2.0, uz * 18.0);
  const g4 = noise3(ux * 32.0 + 1.4, uy * 30.0, uz * 34.0);
  const g5 = noise3(ux * 48.0, uy * 44.0 + side * 2, uz * 50.0);

  // Curved cortical bands
  const band1 = Math.sin(uy * 11.0 + uz * 5.0 + side * 0.8);
  const band2 = Math.sin(uz * 14.0 - uy * 6.0);
  const band3 = Math.sin((uy * 0.7 + uz) * 9.0 + ux * 4.0);

  return (
    0.055 * g1 +
    0.04 * g2 +
    0.025 * g3 +
    0.014 * g4 +
    0.008 * g5 +
    0.022 * band1 +
    0.018 * band2 +
    0.012 * band3
  );
}

/**
 * One cortex sample on a hemisphere ellipsoid.
 * @param {number} side -1 left / +1 right
 * @param {'outer'|'medial'} face
 */
function cortexPoint(dir, side, seed, face = 'outer') {
  // Anatomical proportions (one hemisphere)
  const ex = 0.7;
  const ey = 0.58;
  const ez = 0.92;
  const hemiOffsetX = side * 0.26; // wider fissure gap

  let ux = dir.x;
  let uy = dir.y;
  let uz = dir.z;

  // Outer face: push medial-facing samples outward
  // Medial face: sample the fissure wall (inner surface)
  if (face === 'outer') {
    if (side * ux < 0.12) {
      ux = side * (0.12 + Math.abs(ux) * 0.55);
    }
  } else {
    // Medial wall — almost flat plane facing midline
    ux = side * (0.02 + Math.abs(ux) * 0.08);
  }

  const len = Math.sqrt(ux * ux + uy * uy + uz * uz) || 1;
  ux /= len;
  uy /= len;
  uz /= len;

  const sulci = face === 'outer' ? anatomicalSulci(ux, uy, uz, side) : -0.02;
  const gyri = face === 'outer' ? gyriTexture(ux, uy, uz, side) : noise3(ux * 8, uy * 8, uz * 8) * 0.02;

  // Lobe mass
  const frontal = Math.max(0, -uz) * (0.07 + 0.04 * Math.max(0, uy));
  const occip = Math.max(0, uz) * Math.max(0, uy + 0.05) * 0.06;
  const temporal =
    Math.max(0, Math.abs(ux) - 0.15) * Math.max(0, -uy + 0.05) * 0.07;
  const inferior = uy < -0.2 ? -0.05 * (-uy - 0.2) : 0;
  // Mild superior dome
  const superior = Math.max(0, uy) * 0.03;

  const r =
    1.0 + sulci + gyri + frontal + occip + temporal + inferior + superior;

  let x = ux * r * ex + hemiOffsetX;
  let y = uy * r * ey + 0.1;
  let z = uz * r * ez;

  // Extra temporal pole drop (lower front-side)
  if (uz < -0.3 && Math.abs(ux) > 0.25 && uy < 0) {
    y -= 0.04;
  }

  x += (hash(seed * 1.1) - 0.5) * 0.008;
  y += (hash(seed * 2.3) - 0.5) * 0.006;
  z += (hash(seed * 3.7) - 0.5) * 0.008;

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
 * High-detail realistic brain.
 * Budget ≈ 74% outer cortex · 8% medial walls · 6% subsurface ·
 * 8% cerebellum · 4% stem
 */
export function createBrain(count) {
  const positions = new Float32Array(count * 3);

  const nOuter = Math.floor(count * 0.74);
  const nOuterL = Math.floor(nOuter * 0.5);
  const nOuterR = nOuter - nOuterL;
  const nMedial = Math.floor(count * 0.08);
  const nSub = Math.floor(count * 0.06);
  const nCerebellum = Math.floor(count * 0.08);
  const nStem = count - nOuter - nMedial - nSub - nCerebellum;
  let idx = 0;

  // ── Outer cortex L/R ───────────────────────────────────────
  for (let i = 0; i < nOuterL; i++) {
    let dir = fibDirection(i * 2 + 1, nOuterL * 2);
    if (dir.x > 0.1) dir = { x: -Math.abs(dir.x), y: dir.y, z: dir.z };
    const p = cortexPoint(dir, -1, i + 0.17, 'outer');
    positions[idx * 3] = p.x;
    positions[idx * 3 + 1] = p.y;
    positions[idx * 3 + 2] = p.z;
    idx++;
  }
  for (let i = 0; i < nOuterR; i++) {
    let dir = fibDirection(i * 2 + 3, nOuterR * 2);
    if (dir.x < -0.1) dir = { x: Math.abs(dir.x), y: dir.y, z: dir.z };
    const p = cortexPoint(dir, 1, i + 0.91, 'outer');
    positions[idx * 3] = p.x;
    positions[idx * 3 + 1] = p.y;
    positions[idx * 3 + 2] = p.z;
    idx++;
  }

  // ── Medial walls (fissure faces) — adds depth to the split ─
  for (let j = 0; j < nMedial; j++) {
    const side = j % 2 === 0 ? -1 : 1;
    // Sample upper medial plane (skip inferior where stem is)
    const t = j / Math.max(nMedial - 1, 1);
    const uy = (hash(j * 0.7) - 0.15) * 1.1;
    const uz = (hash(j * 1.3) - 0.5) * 1.6;
    const dir = { x: side * 0.05, y: uy, z: uz };
    const p = cortexPoint(dir, side, j + 7.1, 'medial');
    // Slight vertical stretch along fissure
    positions[idx * 3] = p.x;
    positions[idx * 3 + 1] = p.y * (0.9 + 0.1 * t);
    positions[idx * 3 + 2] = p.z;
    idx++;
  }

  // ── Thin subsurface (keeps body solid without blurring) ────
  for (let j = 0; j < nSub; j++) {
    const side = hash(j * 0.63) > 0.5 ? 1 : -1;
    let dir = fibDirection(j * 3 + 11, nSub * 3);
    if (side < 0) dir = { x: -Math.abs(dir.x), y: dir.y, z: dir.z };
    else dir = { x: Math.abs(dir.x), y: dir.y, z: dir.z };
    const p = cortexPoint(dir, side, j + 4.2, 'outer');
    const s = 0.9 + hash(j * 1.3) * 0.07;
    positions[idx * 3] = p.x * s;
    positions[idx * 3 + 1] = p.y * s;
    positions[idx * 3 + 2] = p.z * s;
    idx++;
  }

  // ── Cerebellum dual lobes + foliation ──────────────────────
  for (let j = 0; j < nCerebellum; j++) {
    const side = hash(j * 0.41) > 0.5 ? 1 : -1;
    const a = hash(j * 1.17) * Math.PI * 2;
    const elev = (hash(j * 2.41) - 0.5) * Math.PI;

    // Dense horizontal folia
    const folio = Math.sin(elev * 18.0 + a * 1.5) * 0.045;
    const folio2 = Math.sin(elev * 28.0) * 0.02;
    const n = noise3(a * 2, elev * 2, j * 0.15) * 0.02;

    const rx = 0.26 + folio + n;
    const ry = 0.2 + folio2 + n;
    const rz = 0.3 + folio * 0.4;

    const cx = side * (0.3 + Math.cos(a) * Math.cos(elev) * rx);
    const cy = -0.55 + Math.sin(elev) * ry;
    const cz = 0.58 + Math.sin(a) * Math.cos(elev) * rz;

    positions[idx * 3] = cx;
    positions[idx * 3 + 1] = cy;
    positions[idx * 3 + 2] = cz;
    idx++;
  }

  // ── Brainstem + pons ───────────────────────────────────────
  for (let j = 0; j < nStem && idx < count; j++) {
    const t = j / Math.max(nStem - 1, 1);
    const a = hash(j * 3.3) * Math.PI * 2;
    const pons = Math.exp(-Math.pow((t - 0.18) * 5.5, 2)) * 0.055;
    const r = 0.1 * (1.0 - t * 0.55) + pons + (hash(j) - 0.5) * 0.012;
    positions[idx * 3] = Math.cos(a) * r;
    positions[idx * 3 + 1] = -0.26 - t * 0.52;
    positions[idx * 3 + 2] = Math.sin(a) * r * 0.65 + 0.1;
    idx++;
  }

  while (idx < count) {
    const side = idx % 2 === 0 ? -1 : 1;
    const dir = fibDirection(idx, count);
    const p = cortexPoint(dir, side, idx * 0.37, 'outer');
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
