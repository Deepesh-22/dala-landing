import * as THREE from 'three';
import { getParticleCount } from '../utils/device.js';
import { generateAllShapes } from './ShapeGenerator.js';
import MorphSystem from './MorphSystem.js';

/** Dala 8-hue palette */
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
    // Filled triangle geometry (Dala pyramid/particle shape)
    const s = 0.014;
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
      opacity: 0.92,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.InstancedMesh(tri, mat, this.count);
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    // Per-instance colors
    const colors = new Float32Array(this.count * 3);
    for (let i = 0; i < this.count; i++) {
      const c = DALA_COLORS[i % DALA_COLORS.length];
      // slight variation via hash
      const h = Math.sin(i * 12.9898) * 43758.5453;
      const idx = Math.abs(Math.floor(h)) % DALA_COLORS.length;
      const col = DALA_COLORS[idx];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);

    this._dummy = new THREE.Object3D();
    this._color = new THREE.Color();

    // Init matrices from brain
    const pos = this.morph.current;
    for (let i = 0; i < this.count; i++) {
      this._dummy.position.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
      this._dummy.scale.setScalar(0.85 + (i % 5) * 0.06);
      this._dummy.rotation.z = (i % 7) * 0.3;
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
    const rotY = this._timelineRotY || 0;

    // Apply global Y rotation to the mesh group
    if (this.mesh) {
      this.mesh.rotation.y = rotY;
      this.mesh.rotation.x = this._timelineRotX || 0;
      if (this.mesh.material) {
        this.mesh.material.opacity = 0.92 * (this._timelineOpacity ?? 1);
      }
    }

    for (let i = 0; i < this.count; i++) {
      let x = pos[i * 3];
      let y = pos[i * 3 + 1];
      let z = pos[i * 3 + 2];

      // Gather toward origin on CTA
      if (gather > 0.01) {
        x *= 1 - gather * 0.35;
        y *= 1 - gather * 0.35;
        z *= 1 - gather * 0.35;
      }

      this._dummy.position.set(x, y, z);
      const scale = 0.8 + ((i * 7) % 11) * 0.04;
      this._dummy.scale.setScalar(scale);
      // Gentle individual spin
      this._dummy.rotation.z = elapsed * 0.15 + i * 0.4;
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
