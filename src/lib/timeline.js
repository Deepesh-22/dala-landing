/**
 * Cleaner holds + smoother transitions between shapes.
 * Path: brain → distorted → abstract → bulb → globe → structure
 */

export const TIMELINE = {
  heroEnd: 0.18,
  rotateEnd: 0.28,
  dissolveEnd: 0.4,
  abstractEnd: 0.5,
  manifestoEnd: 0.6,
  morphToBulbEnd: 0.72,
  bulbEnd: 0.84,
  globeEnd: 0.93,
};

export const SHAPE = {
  BRAIN: 0,
  DISTORTED: 1,
  ABSTRACT: 2,
  BULB: 3,
  GLOBE: 4,
  STRUCTURE: 5,
};

export const CAMERA_KEYS = [
  { p: 0.0, x: -0.22, y: 0.14, z: 4.15, lx: 1.1, ly: 0.06, lz: 0, fov: 40 },
  { p: 0.18, x: -0.14, y: 0.12, z: 3.85, lx: 1.05, ly: 0.05, lz: 0, fov: 38 },
  { p: 0.28, x: -0.05, y: 0.1, z: 3.55, lx: 0.95, ly: 0.04, lz: 0, fov: 36 },
  { p: 0.4, x: -0.16, y: 0.18, z: 4.15, lx: 0.55, ly: 0.05, lz: 0, fov: 41 },
  { p: 0.5, x: -0.28, y: 0.24, z: 4.8, lx: 0.3, ly: 0.03, lz: 0, fov: 44 },
  { p: 0.6, x: -0.22, y: 0.2, z: 5.05, lx: 0.2, ly: 0.02, lz: 0, fov: 45 },
  { p: 0.72, x: 0.1, y: 0.16, z: 4.05, lx: 0.48, ly: 0.08, lz: 0, fov: 39 },
  { p: 0.84, x: 0.18, y: 0.14, z: 3.65, lx: 0.45, ly: 0.1, lz: 0, fov: 36 },
  { p: 0.93, x: 0.04, y: 0.18, z: 4.35, lx: 0.28, ly: 0.04, lz: 0, fov: 40 },
  { p: 1.0, x: -0.06, y: 0.26, z: 5.3, lx: 0.15, ly: 0.0, lz: 0, fov: 46 },
];

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}

function seg(p, a, b) {
  return clamp01((p - a) / Math.max(1e-6, b - a));
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

/** Smoother ease for morph segments */
function smootherstep(t) {
  const x = clamp01(t);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

export function sampleCamera(progress) {
  const p = clamp01(progress);
  const keys = CAMERA_KEYS;

  if (p <= keys[0].p) {
    const k = keys[0];
    return {
      x: k.x,
      y: k.y,
      z: k.z,
      lookX: k.lx,
      lookY: k.ly,
      lookZ: k.lz,
      fov: k.fov,
    };
  }

  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (p <= b.p) {
      const t = smoothstep(seg(p, a.p, b.p));
      return {
        x: lerp(a.x, b.x, t),
        y: lerp(a.y, b.y, t),
        z: lerp(a.z, b.z, t),
        lookX: lerp(a.lx, b.lx, t),
        lookY: lerp(a.ly, b.ly, t),
        lookZ: lerp(a.lz, b.lz, t),
        fov: lerp(a.fov, b.fov, t),
      };
    }
  }

  const k = keys[keys.length - 1];
  return {
    x: k.x,
    y: k.y,
    z: k.z,
    lookX: k.lx,
    lookY: k.ly,
    lookZ: k.lz,
    fov: k.fov,
  };
}

export function progressToMorph(p) {
  const x = clamp01(p);
  const T = TIMELINE;

  if (x < T.heroEnd) return SHAPE.BRAIN;
  if (x < T.rotateEnd) return SHAPE.BRAIN;

  if (x < T.dissolveEnd) {
    return lerp(
      SHAPE.BRAIN,
      SHAPE.DISTORTED,
      smootherstep(seg(x, T.rotateEnd, T.dissolveEnd))
    );
  }

  if (x < T.abstractEnd) {
    return lerp(
      SHAPE.DISTORTED,
      SHAPE.ABSTRACT,
      smootherstep(seg(x, T.dissolveEnd, T.abstractEnd))
    );
  }

  if (x < T.manifestoEnd) return SHAPE.ABSTRACT;

  if (x < T.morphToBulbEnd) {
    return lerp(
      SHAPE.ABSTRACT,
      SHAPE.BULB,
      smootherstep(seg(x, T.manifestoEnd, T.morphToBulbEnd))
    );
  }

  if (x < T.bulbEnd) return SHAPE.BULB;

  if (x < T.globeEnd) {
    return lerp(
      SHAPE.BULB,
      SHAPE.GLOBE,
      smootherstep(seg(x, T.bulbEnd, T.globeEnd))
    );
  }

  return lerp(
    SHAPE.GLOBE,
    SHAPE.STRUCTURE,
    smootherstep(seg(x, T.globeEnd, 1))
  );
}

export function evaluateScene(progress) {
  const p = clamp01(progress);
  const T = TIMELINE;
  const morph = progressToMorph(p);

  let rotation = 0.03;
  if (p >= T.heroEnd && p < T.rotateEnd) {
    rotation = lerp(0.03, 0.09, seg(p, T.heroEnd, T.rotateEnd));
  } else if (p >= T.rotateEnd) {
    rotation = 0.06 + morph * 0.03;
  }

  let distortion = 0;
  if (p >= T.rotateEnd && p < T.dissolveEnd) {
    distortion = seg(p, T.rotateEnd, T.dissolveEnd) * 0.5;
  } else if (p >= T.dissolveEnd && p < T.abstractEnd) {
    distortion = 0.3;
  } else {
    const local = morph - Math.floor(morph);
    distortion = (1 - Math.abs(local - 0.5) * 2) * 0.2;
  }

  const camera = sampleCamera(p);

  const camT = seg(p, 0, 1);
  const object = {
    x: lerp(1.2, 0.3, camT),
    y: lerp(0.06, 0.04, camT),
    scale: lerp(1.52, 1.32, camT),
  };

  return {
    progress: p,
    morph,
    shape: Math.floor(morph),
    camera,
    object,
    particleDensity: 1,
    particleSize: 1 + distortion * 0.04,
    colorIntensity: lerp(1, 0.9, seg(p, T.bulbEnd, 1)),
    rotation,
    distortion,
    fieldOpacity: lerp(1, 0.5, camT),
  };
}
