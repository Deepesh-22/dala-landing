/**
 * PHASE 1 — Foundation only
 * Pure black scene + camera + renderer + RAF loop.
 * Particles / morph / ambient / timeline added in later phases.
 */
import * as THREE from 'three';
import Scene from './Scene.js';
import Camera from './Camera.js';
import Renderer from './Renderer.js';
import { isWebGLAvailable } from './utils/device.js';

// Set to 1, 2, 3... to enable up to that phase
export const BUILD_PHASE = 1;

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
      console.warn('[Phase1] WebGL not available');
      this.onProgress(1);
      this._readyResolve?.();
      return;
    }

    this.onProgress(0.2);

    this.clock = new THREE.Clock();
    this.isVisible = true;
    this._prevTime = 0;
    this._running = false;
    this._frames = 0;

    // Phase 1 core
    this.scene = new Scene();
    this.camera = new Camera({ sizes: this.sizes });
    this.renderer = new Renderer({ canvas: this.canvas, sizes: this.sizes });
    this.onProgress(0.6);

    // Phase 2+ hooks (empty until enabled)
    this.particles = null;
    this.ambient = null;
    this.timeline = null;
    this.smoothScroll = null;

    if (BUILD_PHASE >= 2) {
      this._initPhase2();
    }
    if (BUILD_PHASE >= 4) {
      this._initPhase4();
    }
    if (BUILD_PHASE >= 5) {
      this._initPhase5();
    }
    if (BUILD_PHASE >= 6) {
      this._initPhase6();
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

  _initPhase2() {
    // Loaded dynamically in later commits when BUILD_PHASE >= 2
  }

  _initPhase4() {}
  _initPhase5() {}
  _initPhase6() {}

  onResize() {
    clearTimeout(this._resizeTimer);
    this._resizeTimer = setTimeout(() => {
      this.sizes.width = window.innerWidth;
      this.sizes.height = window.innerHeight;
      this.camera.resize();
      this.renderer.resize();
      this.smoothScroll?.resize?.();
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

    this.timeline?.update?.();
    this.camera.update(delta);
    this.particles?.update?.(elapsed, delta);
    this.ambient?.update?.(elapsed);

    this.renderer.update(this.scene.instance, this.camera.instance);

    this._frames += 1;
    if (this._frames === 4) {
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
