/**
 * Phase E — Master timeline
 * Path: brain → distorted → abstract → bulb → globe → structure
 * Longer brain hold + clear bulb hold; fully reversible on scroll up.
 */

export const TIMELINE = {
  /** Hold brain longer so silhouette reads before motion */
  heroEnd: 0.2,
  rotateEnd: 0.32,
  dissolveEnd: 0.44,
  abstractEnd: 0.54,
  manifestoEnd: 0.64,
  morphToBulbEnd: 0.76,
  /** Clear bulb hold */
  bulbEnd: 0.88,
  globeEnd: 0.95,
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
  { p: 0.0, x: -0.2, y: 0.16, z: 4.2, lx: 1.05, ly: 0.08, lz: 0, fov: 40 },
  { p: 0.2, x: -0.12, y: 0.14, z: 3.9, lx: 1.0, ly: 0.06, lz: 0, fov: 38 },
  { p: 0.32, x: 0.0, y: 0.12, z: 3.55, lx: 0.9, ly: 0.05, lz: 0, fov: 36 },
  { p: 0.44, x: -0.18, y: 0.2, z: 4.2, lx: 0.55, ly: 0.06, lz: 0, fov: 41 },
  { p: 0.54, x: -0.32, y: 0.26, z: 4.85, lx: 0.32, ly: 0.04, lz: 0, fov: 44 },
  { p: 0.64, x: -0.25, y: 0.22, z: 5.1, lx: 0.22, ly: 0.02, lz: 0, fov: 45 },
  { p: 0.76, x: 0.12, y: 0.18, z: 4.1, lx: 0.5, ly: 0.08, lz: 0, fov: 39 },
  { p: 0.88, x: 0.2, y: 0.16, z: 3.7, lx: 0.48, ly: 0.1, lz: 0, fov: 36 },
  { p: 0.95, x: 0.05, y: 0.2, z: 4.4, lx: 0.3, ly: 0.05, lz: 0, fov: 40 },
  { p: 1.0, x: -0.08, y: 0.28, z: 5.35, lx: 0.18, ly: 0.0, lz: 0, fov: 46 },
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

/**
 * Continuous morph index 0→5. Fully reversible: same function of progress.
 */
export function progressToMorph(p) {
  const x = clamp01(p);
  const T = TIMELINE;

  // Brain hold (silhouette reads)
  if (x < T.heroEnd) return SHAPE.BRAIN;
  if (x < T.rotateEnd) return SHAPE.BRAIN;

  // Mild stretch
  if (x < T.dissolveEnd) {
    return lerp(SHAPE.BRAIN, SHAPE.DISTORTED, seg(x, T.rotateEnd, T.dissolveEnd));
  }

  // Controlled dissolve
  if (x < T.abstractEnd) {
    return lerp(
      SHAPE.DISTORTED,
      SHAPE.ABSTRACT,
      seg(x, T.dissolveEnd, T.abstractEnd)
    );
  }

  if (x < T.manifestoEnd) return SHAPE.ABSTRACT;

  // Gather into bulb
  if (x < T.morphToBulbEnd) {
    return lerp(
      SHAPE.ABSTRACT,
      SHAPE.BULB,
      seg(x, T.manifestoEnd, T.morphToBulbEnd)
    );
  }

  // Clear bulb hold
  if (x < T.bulbEnd) return SHAPE.BULB;

  // Globe
  if (x < T.globeEnd) {
    return lerp(SHAPE.BULB, SHAPE.GLOBE, seg(x, T.bulbEnd, T.globeEnd));
  }

  // Final organic structure
  return lerp(SHAPE.GLOBE, SHAPE.STRUCTURE, seg(x, T.globeEnd, 1));
}

export function evaluateScene(progress) {
  const p = clamp01(progress);
  const T = TIMELINE;
  const morph = progressToMorph(p);

  let rotation = 0.035;
  if (p >= T.heroEnd && p < T.rotateEnd) {
    rotation = lerp(0.035, 0.1, seg(p, T.heroEnd, T.rotateEnd));
  } else if (p >= T.rotateEnd) {
    rotation = 0.07 + morph * 0.035;
  }

  let distortion = 0;
  if (p >= T.rotateEnd && p < T.dissolveEnd) {
    distortion = seg(p, T.rotateEnd, T.dissolveEnd) * 0.7;
  } else if (p >= T.dissolveEnd && p < T.abstractEnd) {
    distortion = 0.4;
  } else {
    const local = morph - Math.floor(morph);
    distortion = (1 - Math.abs(local - 0.5) * 2) * 0.3;
  }

  const camera = sampleCamera(p);

  const camT = seg(p, 0, 1);
  const object = {
    x: lerp(1.45, 0.35, camT),
    y: 0.06,
    scale: lerp(1.72, 1.35, camT),
  };

  const particleDensity = 1;
  const particleSize = 1 + distortion * 0.05;
  const colorIntensity = lerp(1, 0.9, seg(p, T.bulbEnd, 1));
  const fieldOpacity = lerp(1, 0.5, camT);

  return {
    progress: p,
    morph,
    shape: Math.floor(morph),
    camera,
    object,
    particleDensity,
    particleSize,
    colorIntensity,
    rotation,
    distortion,
    fieldOpacity,
  };
}
