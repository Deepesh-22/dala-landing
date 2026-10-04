/**
 * CPU spring morph between two shape position buffers.
 * Settle at ends (high spring, low noise); fluid + scatter mid-morph.
 */

export default class MorphSystem {
  constructor({ count, shapes }) {
    this.count = count;
    this.shapes = shapes;

    this.fromName = 'brain';
    this.toName = 'brain';

    this.current = new Float32Array(count * 3);
    this.velocity = new Float32Array(count * 3);
    this.target = new Float32Array(count * 3);

    this.current.set(shapes.brain);
    this.target.set(shapes.brain);

    this.params = {
      morphProgress: 0,
      springStrength: 5.2,
      noiseStrength: 0.05,
      scatter: 0,
      turbulence: 0.08,
      damping: 0.87,
    };

    this._seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      let s = (Math.sin(i * 12.9898) * 43758.5453) % 1;
      if (s < 0) s += 1;
      this._seeds[i] = s;
    }
  }

  setPair(from, to) {
    if (!this.shapes[from] || !this.shapes[to]) return;
    this.fromName = from;
    this.toName = to;
  }

  setProgress(t) {
    this.params.morphProgress = Math.max(0, Math.min(1, t));
  }

  update(dt) {
    const {
      morphProgress: p,
      springStrength,
      noiseStrength,
      scatter,
      turbulence,
      damping,
    } = this.params;

    // Smoothstep ease
    const e = p * p * (3 - 2 * p);

    // 1 at ends, 0 at middle
    const settle = 1 - Math.abs(p - 0.5) * 2;
    const spring = springStrength + settle * 2.8;
    const noise = noiseStrength * (1 - settle * 0.75);
    const scatterAmp = scatter * (1 - settle);

    const from = this.shapes[this.fromName];
    const to = this.shapes[this.toName];
    if (!from || !to) return;

    const dtClamped = Math.min(dt, 0.05);
    const n = this.count;
    const time = performance.now() * 0.001;

    for (let i = 0; i < n; i++) {
      const i3 = i * 3;
      const seed = this._seeds[i];

      let tx = from[i3] + (to[i3] - from[i3]) * e;
      let ty = from[i3 + 1] + (to[i3 + 1] - from[i3 + 1]) * e;
      let tz = from[i3 + 2] + (to[i3 + 2] - from[i3 + 2]) * e;

      // Outward scatter during mid-morph (feels like dissolve / reform)
      if (scatterAmp > 0.001) {
        const sx = seed - 0.5;
        const sy = ((seed * 1.73) % 1) - 0.5;
        const sz = ((seed * 2.41) % 1) - 0.5;
        // Peak scatter at mid-morph with slight radial bias
        const peak = Math.sin(p * Math.PI);
        tx += sx * scatterAmp * 2.2 * peak;
        ty += sy * scatterAmp * 1.6 * peak;
        tz += sz * scatterAmp * 2.2 * peak;
      }

      // Turbulent noise mid-morph
      if (noise > 0.001) {
        const t = time * turbulence;
        tx += Math.sin(t + seed * 6.28) * noise * 0.45;
        ty += Math.cos(t * 1.3 + seed * 4.1) * noise * 0.38;
        tz += Math.sin(t * 0.7 + seed * 9.2) * noise * 0.45;
      }

      const dx = tx - this.current[i3];
      const dy = ty - this.current[i3 + 1];
      const dz = tz - this.current[i3 + 2];

      this.velocity[i3] = (this.velocity[i3] + dx * spring * dtClamped) * damping;
      this.velocity[i3 + 1] =
        (this.velocity[i3 + 1] + dy * spring * dtClamped) * damping;
      this.velocity[i3 + 2] =
        (this.velocity[i3 + 2] + dz * spring * dtClamped) * damping;

      this.current[i3] += this.velocity[i3];
      this.current[i3 + 1] += this.velocity[i3 + 1];
      this.current[i3 + 2] += this.velocity[i3 + 2];
    }
  }
}
