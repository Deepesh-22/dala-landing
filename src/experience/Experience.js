/**
 * Phase gate via BUILD_PHASE:
 * 1 = black canvas
 * 2 = + triangle particles + colors  ← current
 * 3 = + brain shape
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

export const BUILD_PHASE = 2;

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

    // ── Phase 2: triangle particles ──────────────────────────
    if (BUILD_PHASE >= 2) {
      this.particles = new Particles({ scene: this.scene });
      if (this.particles.mesh) {
        this.particles.mesh.position.set(0.3, 0.05, 0);
      }
      // Phase 2: hold scatter cloud, gentle spin (no morph yet)
      if (this.particles.morph) {
        this.particles.morph.setPair('scatter', 'scatter');
        this.particles.morph.setProgress(0);
        this.particles.morph.params.springStrength = 5.5;
        this.particles.morph.params.noiseStrength = 0.04;
        this.particles.morph.params.scatter = 0;
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

    // Phase 2: slow continuous Y rotation for preview
    if (BUILD_PHASE === 2 && this.particles) {
      this.particles._timelineRotY = elapsed * 0.12;
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
