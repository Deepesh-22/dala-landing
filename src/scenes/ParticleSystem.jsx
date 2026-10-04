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
 * Phase 3 particle field — visible filled triangles forming a brain.
 * Matrices set once; group rotates for idle motion (no per-frame matrix storm).
 */
export default function ParticleSystem({
  shapeA = 'brain',
  reducedMotion = false,
}) {
  const meshRef = useRef(null);
  const groupRef = useRef(null);

  const count = useMemo(() => {
    const n = getParticleCount();
    return Math.min(Math.max(n, 4000), 14000);
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorTmp = useMemo(() => new THREE.Color(), []);

  const data = useMemo(() => {
    const pos = generateShape(shapeA, count);
    const scales = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const seed = hash01(i);
      // Larger fragments so structure reads on screen
      scales[i] = 0.028 + seed * 0.032;

      const x = pos[i * 3];
      const y = pos[i * 3 + 1];
      const z = pos[i * 3 + 2];
      const region =
        (Math.abs(x) * 1.2 + (y + 0.5) * 0.55 + (z + 0.5) * 0.45 + seed) * 0.55;
      const band = Math.floor(region * PALETTE.length) % PALETTE.length;
      const col = PALETTE[band];
      const dim = 0.75 + hash01(i + 99) * 0.35;
      colors[i * 3] = Math.min(1, col.r * dim);
      colors[i * 3 + 1] = Math.min(1, col.g * dim);
      colors[i * 3 + 2] = Math.min(1, col.b * dim);
    }

    return { pos, scales, colors };
  }, [count, shapeA]);

  // Unit triangle — scaled per-instance
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
    geo.computeVertexNormals();
    return geo;
  }, []);

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        // Filled triangles read better than pure wireframe on black
        wireframe: false,
        transparent: true,
        opacity: 0.88,
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

    // Ensure instanceColor buffer exists
    if (!mesh.instanceColor) {
      mesh.instanceColor = new THREE.InstancedBufferAttribute(
        new Float32Array(count * 3),
        3
      );
    }

    for (let i = 0; i < count; i++) {
      const px = pos[i * 3];
      const py = pos[i * 3 + 1];
      const pz = pos[i * 3 + 2];

      dummy.position.set(px, py, pz);
      dummy.scale.setScalar(scales[i]);
      dummy.rotation.set(
        hash01(i + 1) * 0.6,
        hash01(i + 2) * Math.PI * 2,
        hash01(i) * Math.PI * 2
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      colorTmp.setRGB(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2]);
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
    groupRef.current.rotation.y = t * 0.07;
    groupRef.current.rotation.x = Math.sin(t * 0.14) * 0.05;
  });

  return (
    <group ref={groupRef}>
      <instancedMesh
        ref={meshRef}
        args={[geometry, material, count]}
        frustumCulled={false}
        castShadow={false}
        receiveShadow={false}
      />
    </group>
  );
}
