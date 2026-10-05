/**
 * Phase 10–12 — master scroll timeline + cinematic camera keyframes.
 * Values are 0→1 page progress. Edit here to retune the whole experience.
 */

export const TIMELINE = {
  /** 0.00–0.15  Hero brain */
  heroEnd: 0.15,

  /** 0.15–0.28  Brain rotation / camera closer */
  rotateEnd: 0.28,

  /** 0.28–0.40  Brain dissolves */
  dissolveEnd: 0.4,

  /** 0.40–0.52  Abstract structure */
  abstractEnd: 0.52,

  /** 0.52–0.64  Editorial manifesto (text focus) */
  manifestoEnd: 0.64,

  /** 0.64–0.78  Morph toward bulb */
  morphToBulbEnd: 0.78,

  /** 0.78–0.90  Lightbulb form */
  bulbEnd: 0.9,

  /** 0.90–1.00  Final structure / CTA */
};

/** Shape state indices (must match SHAPE_ORDER in shapes.js) */
export const SHAPE = {
  BRAIN: 0,
  DISTORTED: 1,
  ABSTRACT: 2,
  BULB: 3,
  SCATTER: 4,
  STRUCTURE: 5,
};

/**
 * Phase 12 — cinematic camera keyframes.
 * Subtle: viewer drifts through a large 3D scene, never dramatic.
 * All values are world units / degrees (fov).
 */
export const CAMERA_KEYS = [
  // progress, x, y, z, lookX, lookY, lookZ, fov
  { p: 0.0, x: -0.12, y: 0.18, z: 4.55, lx: 0.9, ly: 0.06, lz: 0, fov: 43 }, // hero wide
  { p: 0.15, x: -0.08, y: 0.16, z: 4.15, lx: 0.95, ly: 0.05, lz: 0, fov: 41 }, // edge of hero
  { p: 0.28, x: 0.05, y: 0.14, z: 3.75, lx: 0.85, ly: 0.04, lz: 0, fov: 38 }, // closer on brain
  { p: 0.4, x: -0.2, y: 0.22, z: 4.35, lx: 0.55, ly: 0.06, lz: 0, fov: 42 }, // dissolve orbit
  { p: 0.52, x: -0.35, y: 0.28, z: 4.9, lx: 0.35, ly: 0.04, lz: 0, fov: 44 }, // abstract / through field
  { p: 0.64, x: -0.28, y: 0.24, z: 5.15, lx: 0.25, ly: 0.02, lz: 0, fov: 45 }, // manifesto pull
  { p: 0.78, x: 0.15, y: 0.2, z: 4.2, lx: 0.55, ly: 0.08, lz: 0, fov: 40 }, // approach bulb
  { p: 0.9, x: 0.22, y: 0.18, z: 3.85, lx: 0.5, ly: 0.1, lz: 0, fov: 37 }, // lightbulb hold
  { p: 1.0, x: -0.1, y: 0.3, z: 5.4, lx: 0.2, ly: 0.0, lz: 0, fov: 46 }, // final pullback
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

/**
 * Sample camera keyframes with smoothstep between neighbors.
 * Fully reversible when progress decreases.
 */
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
 * Map page progress → continuous morph index 0…5
 */
export function progressToMorph(p) {
  const x = clamp01(p);
  const T = TIMELINE;

  if (x < T.heroEnd) return SHAPE.BRAIN;
  if (x < T.rotateEnd) return SHAPE.BRAIN;

  if (x < T.dissolveEnd) {
    return lerp(SHAPE.BRAIN, SHAPE.DISTORTED, seg(x, T.rotateEnd, T.dissolveEnd));
  }

  if (x < T.abstractEnd) {
    return lerp(
      SHAPE.DISTORTED,
      SHAPE.ABSTRACT,
      seg(x, T.dissolveEnd, T.abstractEnd)
    );
  }

  if (x < T.manifestoEnd) return SHAPE.ABSTRACT;

  if (x < T.morphToBulbEnd) {
    return lerp(
      SHAPE.ABSTRACT,
      SHAPE.BULB,
      seg(x, T.manifestoEnd, T.morphToBulbEnd)
    );
  }

  if (x < T.bulbEnd) return SHAPE.BULB;

  const t = seg(x, T.bulbEnd, 1);
  if (t < 0.45) return lerp(SHAPE.BULB, SHAPE.SCATTER, t / 0.45);
  return lerp(SHAPE.SCATTER, SHAPE.STRUCTURE, (t - 0.45) / 0.55);
}

/**
 * Derive full scene parameters from progress.
 */
export function evaluateScene(progress) {
  const p = clamp01(progress);
  const T = TIMELINE;
  const morph = progressToMorph(p);

  let rotation = 0.04;
  if (p >= T.heroEnd && p < T.rotateEnd) {
    rotation = lerp(0.04, 0.12, seg(p, T.heroEnd, T.rotateEnd));
  } else if (p >= T.rotateEnd) {
    rotation = 0.08 + morph * 0.04;
  }

  let distortion = 0;
  if (p >= T.rotateEnd && p < T.dissolveEnd) {
    distortion = seg(p, T.rotateEnd, T.dissolveEnd) * 0.85;
  } else if (p >= T.dissolveEnd && p < T.abstractEnd) {
    distortion = 0.5;
  } else {
    const local = morph - Math.floor(morph);
    distortion = (1 - Math.abs(local - 0.5) * 2) * 0.4;
  }

  // Phase 12 — keyframed camera (replaces linear camT lerp)
  const camera = sampleCamera(p);

  // Object placement: right early, drifts center late
  const camT = seg(p, 0, 1);
  const object = {
    x: lerp(1.2, 0.35, camT),
    y: 0.08,
    scale: lerp(1.55, 1.35, camT),
  };

  const particleDensity = 1;
  const particleSize = 1 + distortion * 0.08;
  const colorIntensity = lerp(1, 0.9, seg(p, T.bulbEnd, 1));
  const fieldOpacity = lerp(1, 0.55, camT);

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
