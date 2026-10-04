/**
 * CPU spring morph between two shape position buffers.
 * Settle at ends (high spring, low noise); fluid mid-morph.
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

    // Start on brain
    this.current.set(shapes.brain);
    this.target.set(shapes.brain);

    this.params = {
      morphProgress: 0,
      springStrength: 4.6,
      noiseStrength: 0.06,
      scatter: 0,
      turbulence: 0.07,
      damping: 0.86,
    };

    this._seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      this._seeds[i] = Math.sin(i * 12.9898) * 43758.5453 % 1;
      if (this._seeds[i] < 0) this._seeds[i] += 1;
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

    // Smoothstep for soft ease in/out of morph
    const e = p * p * (3 - 2 * p);

    // Stronger spring / weaker noise when settled (p near 0 or 1)
    const settle = 1 - Math.abs(p - 0.5) * 2; // 1 at ends, 0 at middle
    const spring = springStrength + settle * 2.4;
    const noise = noiseStrength * (1 - settle * 0.7);

    const from = this.shapes[this.fromName];
    const to = this.shapes[this.toName];
    if (!from || !to) return;

    const dtClamped = Math.min(dt, 0.05);
    const n = this.count;

    for (let i = 0; i < n; i++) {
      const i3 = i * 3;
      const seed = this._seeds[i];

      // Interpolated target
      let tx = from[i3] + (to[i3] - from[i3]) * e;
      let ty = from[i3 + 1] + (to[i3 + 1] - from[i3 + 1]) * e;
      let tz = from[i3 + 2] + (to[i3 + 2] - from[i3 + 2]) * e;

      // Scatter outward during mid-morph
      if (scatter > 0.001) {
        const sx = (seed - 0.5) * 2;
        const sy = ((seed * 1.7) % 1) - 0.5;
        const sz = ((seed * 2.3) % 1) - 0.5;
        const amp = scatter * (1 - settle);
        tx += sx * amp * 1.8;
        ty += sy * amp * 1.4;
        tz += sz * amp * 1.8;
      }

      // Noise / turbulence
      if (noise > 0.001) {
        const t = performance.now() * 0.001 * turbulence;
        tx += Math.sin(t + seed * 6.28) * noise * 0.4;
        ty += Math.cos(t * 1.3 + seed * 4.1) * noise * 0.35;
        tz += Math.sin(t * 0.7 + seed * 9.2) * noise * 0.4;
      }

      // Spring toward target
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
