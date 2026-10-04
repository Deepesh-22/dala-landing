/**
 * Phase gate via BUILD_PHASE:
 * 1 = black canvas
 * 2 = + triangle particles + colors
 * 3 = + brain shape  ← current
 * 4 = + morph
 * 5 = + ambient + all shapes
 * 6 = + full scroll page
 */
import * as THREE from 'three';
import Scene from './Scene.js';
import Camera from './Camera.js';
import Renderer from './Renderer.js';
import Particles from './particles/Particles.js';
import { isWebGLAvailable } from './utils/device.js';

export const BUILD_PHASE = 3;

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
        // Centered, slightly larger so lobe / fissure detail reads
        this.particles.mesh.position.set(0, 0.06, 0);
        this.particles.mesh.scale.setScalar(BUILD_PHASE >= 3 ? 1.28 : 1);
      }

      if (this.particles.morph) {
        if (BUILD_PHASE >= 3) {
          this.particles.morph.setPair('brain', 'brain');
          this.particles.morph.setProgress(0);
          this.particles.morph.current.set(this.particles.shapes.brain);
          // Strong spring + very low noise = sharp anatomical settle
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
      this.onProgress(0.7);
    }

    this.onProgress(0.9);

    this.onResize = this.onResize.bind(this);
    this.onVisibility = this.onVisibility.bind(this);
    window.addEventListener('resize', this.onResize, { passive: true });
    document.addEventListener('visibilitychange', this.onVisibility);

    this._running = true;
    this.tick = this.tick.bind(this);
    this.tick();

    console.log(`[Dala] BUILD_PHASE = ${BUILD_PHASE}`);
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

    // Slow spin so all sides of the brain reveal
    if (BUILD_PHASE >= 2 && BUILD_PHASE <= 3 && this.particles) {
      this.particles._timelineRotY = elapsed * (BUILD_PHASE === 3 ? 0.06 : 0.12);
      if (BUILD_PHASE === 3) {
        this.particles._timelineRotX = Math.sin(elapsed * 0.15) * 0.04;
      }
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
