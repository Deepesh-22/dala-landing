import * as THREE from 'three';

/** Fresh equilateral triangle geometry (not a shared singleton). */
export function getTriangleGeometry() {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      [0, 0.866, 0, -0.75, -0.433, 0, 0.75, -0.433, 0],
      3
    )
  );
  geo.setIndex([0, 1, 2]);
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

export function getPyramidGeometry() {
  return getTriangleGeometry();
}

export function disposeSharedGeometry() {
  // no shared singleton anymore
}
