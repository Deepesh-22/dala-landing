import * as THREE from 'three';

/** Shared triangle BufferGeometry — one allocation, reused everywhere */
let _triangle = null;

export function getTriangleGeometry() {
  if (_triangle) return _triangle;

  const geo = new THREE.BufferGeometry();
  geo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute([0, 1.15, 0, -1, -0.65, 0, 1, -0.65, 0], 3)
  );
  geo.setIndex([0, 1, 2]);
  geo.computeBoundingSphere();
  _triangle = geo;
  return _triangle;
}

/** Optional explicit dispose (usually keep for app lifetime) */
export function disposeSharedGeometry() {
  if (_triangle) {
    _triangle.dispose();
    _triangle = null;
  }
}
