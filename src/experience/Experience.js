/**
 * Phase gate via BUILD_PHASE:
 * 1 = black canvas
 * 2 = + triangle particles + colors
 * 3 = + brain shape
 * 4 = + morph physics
 * 5 = + ambient + all shapes  ← current
 * 6 = + full scroll page
 */
import * as THREE from 'three';
import Scene from './Scene.js';
import Camera from './Camera.js';
import Renderer from './Renderer.js';
import Particles from './particles/Particles.js';
import AmbientLayer from './particles/AmbientLayer.js';
import { isWebGLAvailable } from './utils/device.js';

export const BUILD_PHASE = 5;

/** Full shape morph sequence (Phase 4/5 demo, no scroll yet) */
const MORPH_SEQUENCE = [
  { from: 'brain', to: 'scatter', hold: 2.2, morph: 2.4 },
  { from: 'scatter', to: 'bulb', hold: 1.8, morph: 2.2 },
  { from: 'bulb', to: 'globe', hold: 1.8, morph: 2.2 },
  { from: 'globe', to: 'abstract', hold: 1.8, morph: 2.4 },
  { from: 'abstract', to: 'brain', hold: 2.0, morph: 2.6 },
];

export default class Experience {
  constructor({ canvas, onProgress } = {}) {
    if (!canvas) return;

    this.canvas = canvas;
    this.onProgress = typeof onProgress === 'function' ? onProgress : () => {};
    this.webglOk = isWebGLAvailable();
    this.sizes = { width: window.innerWidth, height: window.innerHeight };

    this._readyResolve = null;
    this.ready = new Promise((r) => {
      this._readyResolve = r;
    });

    if (!this.webglOk) {
      console.warn('[Phase] WebGL not available');
      this.onProgress(1);
      this._readyResolve?.();
      return;
    }

    this.onProgress(0.15);

    this.clock = new THREE.Clock();
    this.isVisible = true;
    this._prevTime = 0;
    this._running = false;
    this._frames = 0;

    this._morphStep = 0;
    this._morphStepTime = 0;
    this._morphPhase = 'hold';

    this.scene = new Scene();
    this.camera = new Camera({ sizes: this.sizes });
    this.renderer = new Renderer({ canvas: this.canvas, sizes: this.sizes });
    this.onProgress(0.4);

    this.particles = null;
    this.ambient = null;
    this.timeline = null;
    this.smoothScroll = null;

    if (BUILD_PHASE >= 2) {
      this.particles = new Particles({ scene: this.scene });
      if (this.particles.mesh) {
        this.particles.mesh.position.set(0, 0.06, 0);
        this.particles.mesh.scale.setScalar(BUILD_PHASE >= 3 ? 1.22 : 1);
      }

      if (this.particles.morph) {
        if (BUILD_PHASE >= 4) {
          const first = MORPH_SEQUENCE[0];
          this.particles.morph.setPair(first.from, first.to);
          this.particles.morph.setProgress(0);
          this.particles.morph.current.set(this.particles.shapes[first.from]);
          this._applyMorphParams(0);
        } else if (BUILD_PHASE >= 3) {
          this.particles.morph.setPair('brain', 'brain');
          this.particles.morph.setProgress(0);
          this.particles.morph.current.set(this.particles.shapes.brain);
          this.particles.morph.params.springStrength = 7.2;
          this.particles.morph.params.noiseStrength = 0.012;
          this.particles.morph.params.scatter = 0;
          this.particles.morph.params.turbulence = 0.025;
          this.particles.morph.params.damping = 0.88;
        } else {
          this.particles.morph.setPair('scatter', 'scatter');
          this.particles.morph.setProgress(0);
          this.particles.morph.params.springStrength = 5.5;
          this.particles.morph.params.noiseStrength = 0.04;
          this.particles.morph.params.scatter = 0;
        }
      }
      this.particles._timelineRotY = 0;
      this.onProgress(0.65);
    }

    // Phase 5: ambient field — never morphs, always drifts in the void
    if (BUILD_PHASE >= 5) {
      this.ambient = new AmbientLayer({ scene: this.scene });
      this.onProgress(0.85);
    }

    this.onProgress(0.95);

    this.onResize = this.onResize.bind(this);
    this.onVisibility = this.onVisibility.bind(this);
    window.addEventListener('resize', this.onResize, { passive: true });
    document.addEventListener('visibilitychange', this.onVisibility);

    this._running = true;
    this.tick = this.tick.bind(this);
    this.tick();

    console.log(`[Dala] BUILD_PHASE = ${BUILD_PHASE}`);
  }

  _applyMorphParams(progress) {
    if (!this.particles?.morph) return;
    const p = this.particles.morph.params;
    const settle = 1 - Math.abs(progress - 0.5) * 2;
    p.springStrength = 4.2 + settle * 3.2;
    p.noiseStrength = 0.02 + (1 - settle) * 0.1;
    p.scatter = (1 - settle) * 0.55;
    p.turbulence = 0.04 + (1 - settle) * 0.12;
    p.damping = 0.84 + settle * 0.05;
  }

  _updateMorphSequence(delta) {
    if (!this.particles?.morph || BUILD_PHASE < 4) return;

    const step = MORPH_SEQUENCE[this._morphStep];
    this._morphStepTime += delta;

    if (this._morphPhase === 'hold') {
      this.particles.morph.setProgress(0);
      this._applyMorphParams(0);

      if (this._morphStepTime >= step.hold) {
        this._morphPhase = 'morph';
        this._morphStepTime = 0;
        this.particles.morph.setPair(step.from, step.to);
        this.particles.morph.params.scatter = 0.15;
      }
    } else {
      const t = Math.min(1, this._morphStepTime / step.morph);
      this.particles.morph.setProgress(t);
      this._applyMorphParams(t);

      if (t >= 1) {
        this._morphStep = (this._morphStep + 1) % MORPH_SEQUENCE.length;
        this._morphPhase = 'hold';
        this._morphStepTime = 0;
        const next = MORPH_SEQUENCE[this._morphStep];
        this.particles.morph.setPair(next.from, next.to);
        this.particles.morph.setProgress(0);
        const done = this.particles.shapes[step.to];
        if (done) this.particles.morph.current.set(done);
        this._applyMorphParams(0);
      }
    }

    const elapsed = this.clock.getElapsedTime();
    this.particles._timelineRotY = elapsed * 0.07;
    this.particles._timelineRotX = Math.sin(elapsed * 0.12) * 0.05;
  }

  onResize() {
    clearTimeout(this._resizeTimer);
    this._resizeTimer = setTimeout(() => {
      this.sizes.width = window.innerWidth;
      this.sizes.height = window.innerHeight;
      this.camera.resize();
      this.renderer.resize();
    }, 100);
  }

  onVisibility() {
    this.isVisible = document.visibilityState === 'visible';
    if (this.isVisible) {
      this.clock.start();
      this._prevTime = this.clock.getElapsedTime();
      if (!this._running) {
        this._running = true;
        this.tick();
      }
    } else {
      this._running = false;
      if (this.animationId) cancelAnimationFrame(this.animationId);
    }
  }

  tick() {
    if (!this.webglOk || !this.isVisible || !this._running) return;

    const elapsed = this.clock.getElapsedTime();
    const delta = Math.min(elapsed - this._prevTime, 0.05);
    this._prevTime = elapsed;

    if (BUILD_PHASE === 2 && this.particles) {
      this.particles._timelineRotY = elapsed * 0.12;
    }
    if (BUILD_PHASE === 3 && this.particles) {
      this.particles._timelineRotY = elapsed * 0.06;
      this.particles._timelineRotX = Math.sin(elapsed * 0.15) * 0.04;
    }
    if (BUILD_PHASE >= 4) {
      this._updateMorphSequence(delta);
    }

    this.timeline?.update?.();
    this.camera.update(delta);
    this.particles?.update?.(elapsed, delta);
    this.ambient?.update?.(elapsed);

    this.renderer.update(this.scene.instance, this.camera.instance);

    this._frames += 1;
    if (this._frames === 6) {
      this.onProgress(1);
      this._readyResolve?.();
    }

    this.animationId = requestAnimationFrame(this.tick);
  }

  destroy() {
    this._running = false;
    clearTimeout(this._resizeTimer);
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('visibilitychange', this.onVisibility);
    if (this.animationId) cancelAnimationFrame(this.animationId);

    this.smoothScroll?.destroy?.();
    this.timeline?.destroy?.();
    this.ambient?.dispose?.();
    this.particles?.dispose?.();
    this.renderer?.dispose?.();
  }
}
