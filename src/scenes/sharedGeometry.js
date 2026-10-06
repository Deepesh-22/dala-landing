import * as THREE from 'three';

/**
 * Hollow pyramid (tetrahedron) — edge-only wireframe silhouette.
 * 6 edges as thin box segments so InstancedMesh can still use Mesh material,
 * OR classic tetrahedron with wireframe:true in material.
 *
 * We use a proper tetrahedron mesh; material sets wireframe for hollow look.
 */
let _pyramid = null;
let _pyramidEdges = null;

export function getTriangleGeometry() {
  return getPyramidGeometry();
}

/** Solid tetrahedron mesh — use with wireframe:true for hollow */
export function getPyramidGeometry() {
  if (_pyramid) return _pyramid;

  // Regular tetrahedron, centered
  const s = 1.0;
  const v0 = [0, s * 0.8, 0];
  const v1 = [s * 0.75, -s * 0.35, s * 0.45];
  const v2 = [-s * 0.75, -s * 0.35, s * 0.45];
  const v3 = [0, -s * 0.35, -s * 0.85];

  const positions = new Float32Array([
    ...v0, ...v1, ...v2,
    ...v0, ...v2, ...v3,
    ...v0, ...v3, ...v1,
    ...v1, ...v3, ...v2,
  ]);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  _pyramid = geo;
  return _pyramid;
}

/**
 * True hollow pyramid: only the 6 edges as thin rectangular tubes.
 * Reads as outlined pyramid, not filled faces.
 */
export function getHollowPyramidGeometry() {
  if (_pyramidEdges) return _pyramidEdges;

  const s = 1.0;
  const verts = [
    [0, s * 0.8, 0],
    [s * 0.75, -s * 0.35, s * 0.45],
    [-s * 0.75, -s * 0.35, s * 0.45],
    [0, -s * 0.35, -s * 0.85],
  ];

  // 6 edges of tetrahedron
  const edges = [
    [0, 1], [0, 2], [0, 3],
    [1, 2], [1, 3], [2, 3],
  ];

  // Build thin quad for each edge (2 triangles)
  const half = 0.04; // edge thickness
  const positions = [];

  for (const [ia, ib] of edges) {
    const a = verts[ia];
    const b = verts[ib];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const dz = b[2] - a[2];
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
    // Perpendicular for thickness
    let px = -dy / len;
    let py = dx / len;
    let pz = 0;
    const plen = Math.sqrt(px * px + py * py + pz * pz) || 1;
    px = (px / plen) * half;
    py = (py / plen) * half;
    pz = (pz / plen) * half;

    // Quad corners
    const c0 = [a[0] + px, a[1] + py, a[2] + pz];
    const c1 = [a[0] - px, a[1] - py, a[2] - pz];
    const c2 = [b[0] - px, b[1] - py, b[2] - pz];
    const c3 = [b[0] + px, b[1] + py, b[2] + pz];

    // 2 triangles
    positions.push(...c0, ...c1, ...c2);
    positions.push(...c0, ...c2, ...c3);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  _pyramidEdges = geo;
  return _pyramidEdges;
}

export function disposeSharedGeometry() {
  if (_pyramid) {
    _pyramid.dispose();
    _pyramid = null;
  }
  if (_pyramidEdges) {
    _pyramidEdges.dispose();
    _pyramidEdges = null;
  }
}
