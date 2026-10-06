import * as THREE from 'three';

/** Flat solid triangle — same as reference particle shape */
let _geo = null;

export function getTriangleGeometry() {
  if (_geo) return _geo;
  const geo = new THREE.BufferGeometry();
  // Equilateral triangle centered
  geo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      [0, 0.9, 0, -0.78, -0.45, 0, 0.78, -0.45, 0],
      3
    )
  );
  geo.setIndex([0, 1, 2]);
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  _geo = geo;
  return _geo;
}

export function getPyramidGeometry() {
  return getTriangleGeometry();
}

export function disposeSharedGeometry() {
  if (_geo) {
    _geo.dispose();
    _geo = null;
  }
}
