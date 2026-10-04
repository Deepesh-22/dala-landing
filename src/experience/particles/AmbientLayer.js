import * as THREE from 'three';
import { getParticleCount } from '../utils/device.js';

const DALA_COLORS = [
  new THREE.Color(0xf5d76e),
  new THREE.Color(0xc39bd3),
  new THREE.Color(0x9b59b6),
  new THREE.Color(0x1abc9c),
  new THREE.Color(0x2ecc71),
  new THREE.Color(0xffffff),
  new THREE.Color(0xe74c3c),
  new THREE.Color(0x3498db),
];

/**
 * Always-on sparse floating triangles in the black void.
 * Never morphs — pure ambient field (Dala-style depth).
 */
export default class AmbientLayer {
  constructor({ scene }) {
    this.scene = scene;
    // ~12% of main count, capped — stays sparse so main shape reads
    this.count = Math.min(1200, Math.floor(getParticleCount() * 0.12));
    this._create();
  }

  _create() {
    const s = 0.007;
    const tri = new THREE.BufferGeometry();
    tri.setAttribute(
      'position',
      new THREE.BufferAttribute(
        new Float32Array([
          0.0, s * 1.25, 0.0,
          -s, -s * 0.7, 0.0,
          s, -s * 0.7, 0.0,
        ]),
        3
      )
    );

    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.InstancedMesh(tri, mat, this.count);
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    // Render behind main particle system slightly via render order
    this.mesh.renderOrder = -1;

    const colors = new Float32Array(this.count * 3);
    this._bases = new Float32Array(this.count * 3);
    this._drifts = new Float32Array(this.count * 3);
    this._spins = new Float32Array(this.count);
    this._scales = new Float32Array(this.count);

    for (let i = 0; i < this.count; i++) {
      const col = DALA_COLORS[i % DALA_COLORS.length];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      // Fib scatter in a large volume around the hero
      const t = i / Math.max(this.count, 1);
      const incl = Math.acos(1 - 2 * t);
      const az = Math.PI * 2 * 1.6180339887 * i;
      const radius = 2.8 + (i % 7) * 0.35;
      this._bases[i * 3] = Math.sin(incl) * Math.cos(az) * radius;
      this._bases[i * 3 + 1] = Math.cos(incl) * (radius * 0.7);
      this._bases[i * 3 + 2] = Math.sin(incl) * Math.sin(az) * radius;

      this._drifts[i * 3] = (Math.sin(i * 0.37) * 0.5) * 0.1;
      this._drifts[i * 3 + 1] = (Math.cos(i * 0.51) * 0.5) * 0.07;
      this._drifts[i * 3 + 2] = (Math.sin(i * 0.73) * 0.5) * 0.1;
      this._spins[i] = (Math.sin(i * 1.1) * 0.5) * 0.3;
      this._scales[i] = 0.4 + (i % 6) * 0.1;
    }
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);

    this._dummy = new THREE.Object3D();
    this.scene.add(this.mesh);
  }

  update(elapsed) {
    if (!this.mesh) return;

    for (let i = 0; i < this.count; i++) {
      let x = this._bases[i * 3] + this._drifts[i * 3] * elapsed * 0.2;
      let y =
        this._bases[i * 3 + 1] +
        this._drifts[i * 3 + 1] * elapsed * 0.2 +
        Math.sin(elapsed * 0.18 + i * 0.4) * 0.08;
      let z = this._bases[i * 3 + 2] + this._drifts[i * 3 + 2] * elapsed * 0.2;

      // Soft toroidal wrap so field never empties
      x = ((x + 5) % 10) - 5;
      y = ((y + 3.5) % 7) - 3.5;
      z = ((z + 5) % 10) - 5;

      this._dummy.position.set(x, y, z);
      this._dummy.scale.setScalar(this._scales[i]);
      this._dummy.rotation.z = elapsed * this._spins[i] + i * 0.5;
      this._dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this._dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  dispose() {
    if (this.mesh) {
      this.mesh.parent?.remove(this.mesh);
      this.mesh.geometry?.dispose();
      this.mesh.material?.dispose();
      this.mesh = null;
    }
  }
}
