import * as THREE from 'three';

/**
 * Shared solid pyramid (tetrahedron) geometry.
 * 4 triangular faces — reads as 3D volume, not flat scribble lines.
 */
let _pyramid = null;

export function getTriangleGeometry() {
  // Keep name for compatibility; returns pyramid
  return getPyramidGeometry();
}

export function getPyramidGeometry() {
  if (_pyramid) return _pyramid;

  // Regular tetrahedron centered at origin, unit-ish size
  // Vertices of a regular tetrahedron
  const s = 1.0;
  const h = Math.sqrt(6) / 3; // ~0.816
  const r = Math.sqrt(2) / 2; // ~0.707 base radius factor

  // Apex up, triangular base below
  const v0 = [0, s * 0.75, 0]; // apex
  const v1 = [s * r, -s * 0.35, s * 0.5]; // base
  const v2 = [-s * r, -s * 0.35, s * 0.5];
  const v3 = [0, -s * 0.35, -s * r * 1.15];

  // 4 faces × 3 verts
  const positions = new Float32Array([
    // face 0: apex-v1-v2
    ...v0, ...v1, ...v2,
    // face 1: apex-v2-v3
    ...v0, ...v2, ...v3,
    // face 2: apex-v3-v1
    ...v0, ...v3, ...v1,
    // face 3: base v1-v3-v2
    ...v1, ...v3, ...v2,
  ]);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  geo.computeBoundingSphere();

  _pyramid = geo;
  return _pyramid;
}

export function disposeSharedGeometry() {
  if (_pyramid) {
    _pyramid.dispose();
    _pyramid = null;
  }
}
