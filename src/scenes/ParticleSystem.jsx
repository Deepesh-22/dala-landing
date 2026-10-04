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
 * Lightweight particle field.
 * - Caps count so main thread never freezes
 * - Sets instance matrices ONCE (no per-frame loop)
 * - Whole group rotates slowly for “alive” feel
 */
export default function ParticleSystem({
  shapeA = 'brain',
  reducedMotion = false,
}) {
  const meshRef = useRef(null);
  const groupRef = useRef(null);

  // Hard cap — previous 60k×frame updates froze the tab (black screen)
  const count = useMemo(() => {
    const n = getParticleCount();
    return Math.min(n, 12000);
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorTmp = useMemo(() => new THREE.Color(), []);

  const data = useMemo(() => {
    const pos = generateShape(shapeA, count);
    const scales = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const seed = hash01(i);
      scales[i] = 0.018 + seed * 0.02;

      const x = pos[i * 3];
      const y = pos[i * 3 + 1];
      const z = pos[i * 3 + 2];
      const region =
        (Math.abs(x) * 1.2 + (y + 0.5) * 0.55 + (z + 0.5) * 0.45 + seed) * 0.55;
      const band = Math.floor(region * PALETTE.length) % PALETTE.length;
      const col = PALETTE[band];
      const dim = 0.65 + hash01(i + 99) * 0.35;
      colors[i * 3] = col.r * dim;
      colors[i * 3 + 1] = col.g * dim;
      colors[i * 3 + 2] = col.b * dim;
    }

    return { pos, scales, colors };
  }, [count, shapeA]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const s = 1;
    geo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        [0, s * 1.2, 0, -s, -s * 0.7, 0, s, -s * 0.7, 0],
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
        opacity: 0.9,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    []
  );

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const { pos, scales, colors } = data;

    for (let i = 0; i < count; i++) {
      dummy.position.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
      dummy.scale.setScalar(scales[i]);
      dummy.rotation.set(0, 0, hash01(i) * Math.PI * 2);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      colorTmp.setRGB(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2]);
      mesh.setColorAt(i, colorTmp);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.count = count;
    mesh.frustumCulled = false;
  }, [count, data, dummy, colorTmp]);

  // Only rotate the group — zero per-particle work
  useFrame(({ clock }) => {
    if (reducedMotion || !groupRef.current) return;
    const t = clock.elapsedTime;
    groupRef.current.rotation.y = t * 0.08;
    groupRef.current.rotation.x = Math.sin(t * 0.15) * 0.04;
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
