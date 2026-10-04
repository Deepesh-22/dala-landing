import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { generateShape, getParticleCount } from './shapes.js';

const PALETTE = [
  new THREE.Color('#ffffff'),
  new THREE.Color('#f5d76e'),
  new THREE.Color('#c39bd3'),
  new THREE.Color('#9b59b6'),
  new THREE.Color('#3498db'),
  new THREE.Color('#1abc9c'),
  new THREE.Color('#2ecc71'),
  new THREE.Color('#e84393'),
];

function hash01(i) {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Reliable particle engine — MeshBasicMaterial + instance matrices.
 * Avoids custom-shader compile failures that caused a black canvas.
 */
export default function ParticleSystem({
  shapeA = 'brain',
  shapeB = 'brain',
  morphProgress = 0,
  reducedMotion = false,
}) {
  const meshRef = useRef(null);
  const count = useMemo(() => Math.min(getParticleCount(), 60000), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorTmp = useMemo(() => new THREE.Color(), []);

  // Precompute shape + per-particle data once
  const data = useMemo(() => {
    const posA = generateShape(shapeA, count);
    const posB = generateShape(shapeB, count);
    const seeds = new Float32Array(count);
    const scales = new Float32Array(count);
    const offsets = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const seed = hash01(i);
      seeds[i] = seed;
      offsets[i] = hash01(i + 17) * Math.PI * 2;
      scales[i] = 0.012 + seed * 0.014; // larger so triangles are visible

      const x = posA[i * 3];
      const y = posA[i * 3 + 1];
      const z = posA[i * 3 + 2];
      const region =
        (Math.abs(x) * 1.2 + (y + 0.5) * 0.55 + (z + 0.5) * 0.45 + seed) * 0.55;
      const band = Math.floor(region * PALETTE.length) % PALETTE.length;
      const col = PALETTE[band];
      const dim = 0.6 + hash01(i + 99) * 0.4;
      colors[i * 3] = col.r * dim;
      colors[i * 3 + 1] = col.g * dim;
      colors[i * 3 + 2] = col.b * dim;
    }

    return { posA, posB, seeds, scales, offsets, colors };
  }, [count, shapeA, shapeB]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const s = 1;
    geo.setAttribute(
      'position',
      new THREE.BufferAttribute(
        new Float32Array([
          0.0, s * 1.2, 0.0,
          -s, -s * 0.7, 0.0,
          s, -s * 0.7, 0.0,
        ]),
        3
      )
    );
    return geo;
  }, []);

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    []
  );

  // Init instance matrices + colors
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const { posA, scales, colors } = data;
    const m = Math.min(morphProgress, 1);

    for (let i = 0; i < count; i++) {
      const x = posA[i * 3];
      const y = posA[i * 3 + 1];
      const z = posA[i * 3 + 2];
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(scales[i]);
      dummy.rotation.set(0, 0, hash01(i + 3) * Math.PI * 2);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      colorTmp.setRGB(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2]);
      mesh.setColorAt(i, colorTmp);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
  }, [count, data, dummy, colorTmp, morphProgress]);

  // Organic float — GPU-light: update matrices each frame
  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh || reducedMotion) return;

    const t = clock.elapsedTime;
    const { posA, posB, seeds, scales, offsets } = data;
    const m = Math.max(0, Math.min(1, morphProgress));
    const e = m * m * (3 - 2 * m);

    // Update every Nth particle per frame for perf, or all if count modest
    const step = count > 40000 ? 2 : 1;
    for (let i = 0; i < count; i += step) {
      const seed = seeds[i];
      const off = offsets[i];
      const ax = posA[i * 3];
      const ay = posA[i * 3 + 1];
      const az = posA[i * 3 + 2];
      const bx = posB[i * 3];
      const by = posB[i * 3 + 1];
      const bz = posB[i * 3 + 2];

      let x = ax + (bx - ax) * e;
      let y = ay + (by - ay) * e;
      let z = az + (bz - az) * e;

      const ft = t * 0.3 + off;
      x += Math.sin(ft + seed * 6.28) * 0.02;
      y += Math.cos(ft * 1.2 + seed * 4.1) * 0.018;
      z += Math.sin(ft * 0.7 + seed * 9.2) * 0.02;

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(scales[i]);
      dummy.rotation.z = off + t * 0.1 * (seed - 0.5);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
    />
  );
}
