import * as THREE from 'three';
import { getParticleCount } from '../utils/device.js';
import { generateAllShapes } from './ShapeGenerator.js';
import MorphSystem from './MorphSystem.js';

/** Dala 8-hue palette — exact visual reference */
const DALA_COLORS = [
  new THREE.Color(0xf5d76e), // yellow
  new THREE.Color(0xc39bd3), // light purple
  new THREE.Color(0x9b59b6), // purple
  new THREE.Color(0x1abc9c), // teal
  new THREE.Color(0x2ecc71), // green
  new THREE.Color(0xffffff), // white
  new THREE.Color(0xe74c3c), // coral
  new THREE.Color(0x3498db), // blue
];

function hash01(i) {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export default class Particles {
  constructor({ scene }) {
    this.scene = scene;
    this.count = getParticleCount();
    this.shapes = generateAllShapes(this.count);
    this.morph = new MorphSystem({ count: this.count, shapes: this.shapes });

    this._timelineRotY = 0;
    this._timelineRotX = 0;
    this._timelineOpacity = 1;
    this._timelineGather = 0;

    this._createMesh();
  }

  _createMesh() {
    // Phase 2: filled triangle — larger so particles read clearly on black
    const s = 0.016;
    const tri = new THREE.BufferGeometry();
    tri.setAttribute(
      'position',
      new THREE.BufferAttribute(
        new Float32Array([
          0.0, s * 1.3, 0.0,
          -s, -s * 0.72, 0.0,
          s, -s * 0.72, 0.0,
        ]),
        3
      )
    );

    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.InstancedMesh(tri, mat, this.count);
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    // Stable per-particle color from palette
    const colors = new Float32Array(this.count * 3);
    for (let i = 0; i < this.count; i++) {
      const col = DALA_COLORS[Math.floor(hash01(i) * DALA_COLORS.length)];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);

    this._dummy = new THREE.Object3D();
    this._scales = new Float32Array(this.count);
    for (let i = 0; i < this.count; i++) {
      this._scales[i] = 0.75 + hash01(i + 99) * 0.55;
    }

    const pos = this.morph.current;
    for (let i = 0; i < this.count; i++) {
      this._dummy.position.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
      this._dummy.scale.setScalar(this._scales[i]);
      this._dummy.rotation.z = hash01(i + 3) * Math.PI * 2;
      this._dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this._dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;

    this.scene.add(this.mesh);
  }

  update(elapsed, delta) {
    this.morph.update(delta);

    const pos = this.morph.current;
    const gather = this._timelineGather || 0;

    if (this.mesh) {
      this.mesh.rotation.y = this._timelineRotY || 0;
      this.mesh.rotation.x = this._timelineRotX || 0;
      if (this.mesh.material) {
        this.mesh.material.opacity = 0.95 * (this._timelineOpacity ?? 1);
      }
    }

    for (let i = 0; i < this.count; i++) {
      let x = pos[i * 3];
      let y = pos[i * 3 + 1];
      let z = pos[i * 3 + 2];

      if (gather > 0.01) {
        const g = 1 - gather * 0.38;
        x *= g;
        y *= g;
        z *= g;
      }

      this._dummy.position.set(x, y, z);
      this._dummy.scale.setScalar(this._scales[i]);
      this._dummy.rotation.z = elapsed * 0.12 + i * 0.37;
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
