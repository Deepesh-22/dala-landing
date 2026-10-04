import * as THREE from 'three';

export const CAMERA_STATES = {
  HERO: { position: [0.4, 0.12, 4.0], lookAt: [0.6, 0.05, 0], fov: 40, damping: 0.055 },
  MANIFESTO: { position: [-0.15, 0.3, 5.4], lookAt: [0.5, 0.08, 0], fov: 38, damping: 0.045 },
  FEATURE_01: { position: [1.2, 0.45, 5.1], lookAt: [0.5, 0.05, 0], fov: 42, damping: 0.04 },
  FEATURE_02: { position: [-0.5, 0.28, 5.3], lookAt: [0.6, 0.06, 0], fov: 43, damping: 0.038 },
  FEATURE_03: { position: [0.5, 0.55, 6.5], lookAt: [0.55, 0, 0], fov: 44, damping: 0.035 },
  CTA: { position: [0.7, 0.1, 3.7], lookAt: [0.55, 0.04, 0], fov: 38, damping: 0.045 },
};

export default class Camera {
  constructor({ sizes }) {
    this.sizes = sizes;
    this.instance = new THREE.PerspectiveCamera(
      CAMERA_STATES.HERO.fov,
      sizes.width / sizes.height,
      0.1,
      60
    );

    const h = CAMERA_STATES.HERO;
    this.instance.position.set(...h.position);
    this.instance.lookAt(...h.lookAt);

    this._pos = new THREE.Vector3(...h.position);
    this._look = new THREE.Vector3(...h.lookAt);
    this._fov = h.fov;
    this._targetPos = this._pos.clone();
    this._targetLook = this._look.clone();
    this._targetFov = h.fov;
    this._damping = h.damping;
  }

  setState(name) {
    const s = CAMERA_STATES[name];
    if (!s) return;
    this._targetPos.set(...s.position);
    this._targetLook.set(...s.lookAt);
    this._targetFov = s.fov;
    this._damping = s.damping;
  }

  lerpStates(aName, bName, t) {
    const a = CAMERA_STATES[aName];
    const b = CAMERA_STATES[bName];
    if (!a || !b) return;
    const e = t * t * (3 - 2 * t);
    this._targetPos.set(
      THREE.MathUtils.lerp(a.position[0], b.position[0], e),
      THREE.MathUtils.lerp(a.position[1], b.position[1], e),
      THREE.MathUtils.lerp(a.position[2], b.position[2], e)
    );
    this._targetLook.set(
      THREE.MathUtils.lerp(a.lookAt[0], b.lookAt[0], e),
      THREE.MathUtils.lerp(a.lookAt[1], b.lookAt[1], e),
      THREE.MathUtils.lerp(a.lookAt[2], b.lookAt[2], e)
    );
    this._targetFov = THREE.MathUtils.lerp(a.fov, b.fov, e);
    this._damping = THREE.MathUtils.lerp(a.damping, b.damping, e);
  }

  resize() {
    this.sizes.width = window.innerWidth;
    this.sizes.height = window.innerHeight;
    this.instance.aspect = this.sizes.width / this.sizes.height;
    this.instance.updateProjectionMatrix();
  }

  update(delta = 0.016) {
    const k = 1 - Math.exp(-this._damping * 60 * Math.min(delta, 0.05));
    this._pos.lerp(this._targetPos, k);
    this._look.lerp(this._targetLook, k);
    this._fov += (this._targetFov - this._fov) * k;
    this.instance.position.copy(this._pos);
    this.instance.lookAt(this._look);
    if (Math.abs(this.instance.fov - this._fov) > 0.01) {
      this.instance.fov = this._fov;
      this.instance.updateProjectionMatrix();
    }
  }
}
