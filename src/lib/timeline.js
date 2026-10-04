/**
 * Phase 10 — configurable master scroll timeline.
 * Values are 0→1 page progress. Edit here to retune the whole experience.
 */
export const TIMELINE = {
  /** 0.00–0.15  Hero brain */
  heroEnd: 0.15,

  /** 0.15–0.28  Brain rotation / camera */
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
  // end: 1.0 implied
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

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}

function seg(p, a, b) {
  return clamp01((p - a) / Math.max(1e-6, b - a));
}

/**
 * Map page progress → continuous morph index 0…5
 * Driven purely by TIMELINE keyframes.
 */
export function progressToMorph(p) {
  const x = clamp01(p);
  const T = TIMELINE;

  // Hero: hold brain
  if (x < T.heroEnd) return SHAPE.BRAIN;

  // Rotate phase: still brain (morph stays 0)
  if (x < T.rotateEnd) return SHAPE.BRAIN;

  // Dissolve: brain → distorted
  if (x < T.dissolveEnd) {
    return lerp(SHAPE.BRAIN, SHAPE.DISTORTED, seg(x, T.rotateEnd, T.dissolveEnd));
  }

  // Abstract
  if (x < T.abstractEnd) {
    return lerp(
      SHAPE.DISTORTED,
      SHAPE.ABSTRACT,
      seg(x, T.dissolveEnd, T.abstractEnd)
    );
  }

  // Manifesto hold on abstract (text focus)
  if (x < T.manifestoEnd) return SHAPE.ABSTRACT;

  // Morph to bulb
  if (x < T.morphToBulbEnd) {
    return lerp(
      SHAPE.ABSTRACT,
      SHAPE.BULB,
      seg(x, T.manifestoEnd, T.morphToBulbEnd)
    );
  }

  // Hold bulb
  if (x < T.bulbEnd) return SHAPE.BULB;

  // Bulb → scatter → structure over final stretch
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

  // Rotation intensity: ramps during rotate phase, stays elevated
  let rotation = 0.04;
  if (p >= T.heroEnd && p < T.rotateEnd) {
    rotation = lerp(0.04, 0.12, seg(p, T.heroEnd, T.rotateEnd));
  } else if (p >= T.rotateEnd) {
    rotation = 0.08 + morph * 0.04;
  }

  // Distortion / scatter peak during dissolve & mid-morphs
  let distortion = 0;
  if (p >= T.rotateEnd && p < T.dissolveEnd) {
    distortion = seg(p, T.rotateEnd, T.dissolveEnd) * 0.85;
  } else if (p >= T.dissolveEnd && p < T.abstractEnd) {
    distortion = 0.5;
  } else {
    const local = morph - Math.floor(morph);
    distortion = (1 - Math.abs(local - 0.5) * 2) * 0.4;
  }

  // Camera: pull back gradually, slight right bias early
  const camT = seg(p, 0, 1);
  const camera = {
    x: lerp(-0.15, -0.45, camT),
    y: lerp(0.2, 0.35, camT),
    z: lerp(4.4, 5.6, camT),
    lookX: lerp(0.85, 0.35, camT),
    lookY: lerp(0.05, 0, camT),
    fov: lerp(44, 48, camT),
  };

  // Object placement: stays right early, drifts center late
  const object = {
    x: lerp(1.2, 0.35, camT),
    y: 0.08,
    scale: lerp(1.55, 1.35, camT),
  };

  // Density / size / color intensity
  const particleDensity = 1; // reserved for future GPU density
  const particleSize = 1 + distortion * 0.08;
  const colorIntensity = lerp(1, 0.9, seg(p, T.bulbEnd, 1));

  // Field visibility (ambient triangles)
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
