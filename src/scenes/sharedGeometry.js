import * as THREE from 'three';

/**
 * Flat filled triangle — matches reference Dala particles.
 * Discrete solid faces, not wireframe pyramids.
 */
let _triangle = null;

export function getTriangleGeometry() {
  if (_triangle) return _triangle;

  // Equilateral-ish triangle centered at origin
  const geo = new THREE.BufferGeometry();
  geo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      [
        0, 1.0, 0,
        -0.866, -0.5, 0,
        0.866, -0.5, 0,
      ],
      3
    )
  );
  geo.setIndex([0, 1, 2]);
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  _triangle = geo;
  return _triangle;
}

export function getPyramidGeometry() {
  return getTriangleGeometry();
}

export function getHollowPyramidGeometry() {
  return getTriangleGeometry();
}

export function disposeSharedGeometry() {
  if (_triangle) {
    _triangle.dispose();
    _triangle = null;
  }
}
