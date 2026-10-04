import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { generateShape } from './shapes.js';
import { getParticleBudget } from '../hooks/useResponsive.js';

const PALETTE = [
  new THREE.Color('#ffffff'),
  new THREE.Color('#f5d76e'),
  new THREE.Color('#ecd6ff'),
  new THREE.Color('#c39bd3'),
  new THREE.Color('#9b59b6'),
  new THREE.Color('#8052ff'),
  new THREE.Color('#5dade2'),
  new THREE.Color('#3498db'),
  new THREE.Color('#1abc9c'),
  new THREE.Color('#2ecc71'),
  new THREE.Color('#e84393'),
  new THREE.Color('#ffb829'),
];

function hash01(i) {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Phase 3 particle engine
 * - InstancedMesh (one draw call)
 * - Hollow triangular wireframes (wireframe: true)
 * - Multicolor density field
 * - Idle rotation on parent group only (no per-particle JS physics loop)
 */
export default function ParticleSystem({
  shapeA = 'brain',
  reducedMotion = false,
}) {
  const meshRef = useRef(null);
  const groupRef = useRef(null);

  const count = useMemo(() => {
    try {
      return getParticleBudget();
    } catch {
      return 40000;
    }
  }, []);

  // MUST be declared before any effect that references it
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorTmp = useMemo(() => new THREE.Color(), []);

  const data = useMemo(() => {
    const pos = generateShape(shapeA, count);
    const scales = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const seed = hash01(i);
      scales[i] = 0.055 + seed * 0.06;

      const x = pos[i * 3] || 0;
      const y = pos[i * 3 + 1] || 0;
      const z = pos[i * 3 + 2] || 0;

      const region =
        (Math.abs(x) * 1.2 + (y + 0.5) * 0.55 + (z + 0.5) * 0.4 + seed) * 0.55;
      let band = Math.floor(region * PALETTE.length) % PALETTE.length;
      if (!Number.isFinite(band) || band < 0) band = 0;
      const c = PALETTE[band] || PALETTE[0];

      const dim = 0.85 + hash01(i + 91) * 0.2;
      colors[i * 3] = Math.min(1, c.r * dim);
      colors[i * 3 + 1] = Math.min(1, c.g * dim);
      colors[i * 3 + 2] = Math.min(1, c.b * dim);
    }

    return { pos, scales, colors };
  }, [count, shapeA]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const s = 1;
    geo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        [0, s * 1.15, 0, -s, -s * 0.65, 0, s, -s * 0.65, 0],
        3
      )
    );
    geo.setIndex([0, 1, 2]);
    return geo;
  }, []);

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    []
  );

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const { pos, scales, colors } = data;

    for (let i = 0; i < count; i++) {
      const px = pos[i * 3] ?? 0;
      const py = pos[i * 3 + 1] ?? 0;
      const pz = pos[i * 3 + 2] ?? 0;

      dummy.position.set(px, py, pz);
      dummy.scale.setScalar(scales[i] ?? 0.06);
      dummy.rotation.set(
        hash01(i + 1) * 0.9,
        hash01(i + 2) * Math.PI * 2,
        hash01(i + 3) * Math.PI * 2
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      colorTmp.setRGB(
        colors[i * 3] ?? 1,
        colors[i * 3 + 1] ?? 1,
        colors[i * 3 + 2] ?? 1
      );
      mesh.setColorAt(i, colorTmp);
    }

    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
    mesh.visible = true;
  }, [count, data, dummy, colorTmp]);

  useFrame(({ clock }) => {
    if (reducedMotion || !groupRef.current) return;
    const t = clock.elapsedTime;
    groupRef.current.rotation.y = t * 0.055;
    groupRef.current.rotation.x = Math.sin(t * 0.13) * 0.045;
  });

  return (
    <group ref={groupRef}>
      <instancedMesh
        ref={meshRef}
        args={[geometry, material, count]}
        frustumCulled={false}
      />
    </group>
  );
}
