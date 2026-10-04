import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { generateShape, getParticleCount } from './shapes.js';

const PALETTE = [
  new THREE.Color('#ffffff'),
  new THREE.Color('#f5d76e'),
  new THREE.Color('#e8c56a'),
  new THREE.Color('#c39bd3'),
  new THREE.Color('#9b59b6'),
  new THREE.Color('#5dade2'),
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
 * Phase 3 — visible multicolor triangle particles forming a brain.
 * Uses R3F declarative geometry/material (avoids dispose bugs with useMemo args).
 */
export default function ParticleSystem({
  shapeA = 'brain',
  reducedMotion = false,
}) {
  const meshRef = useRef(null);
  const groupRef = useRef(null);

  const count = useMemo(() => {
    const n = getParticleCount();
    // Dense enough to read structure, low enough to stay smooth
    return Math.min(Math.max(n, 5000), 16000);
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorTmp = useMemo(() => new THREE.Color(), []);

  const { positions, scales, colors } = useMemo(() => {
    const pos = generateShape(shapeA, count);
    const sc = new Float32Array(count);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const seed = hash01(i);
      // Readable fragment size on a ~2-unit brain
      sc[i] = 0.04 + seed * 0.05;

      const x = pos[i * 3];
      const y = pos[i * 3 + 1];
      const z = pos[i * 3 + 2];
      const region =
        (Math.abs(x) * 1.15 + (y + 0.4) * 0.5 + (z + 0.4) * 0.4 + seed) * 0.6;
      const band = Math.floor(region * PALETTE.length) % PALETTE.length;
      const c = PALETTE[band];
      // Keep bright — structure must pop on black
      const dim = 0.85 + hash01(i + 17) * 0.2;
      col[i * 3] = Math.min(1, c.r * dim);
      col[i * 3 + 1] = Math.min(1, c.g * dim);
      col[i * 3 + 2] = Math.min(1, c.b * dim);
    }

    return { positions: pos, scales: sc, colors: col };
  }, [count, shapeA]);

  // Triangle vertex positions (unit size; scaled per instance)
  const triPositions = useMemo(
    () => new Float32Array([0, 1.2, 0, -1.05, -0.7, 0, 1.05, -0.7, 0]),
    []
  );

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // Allocate instance color buffer once
    if (!mesh.instanceColor) {
      mesh.instanceColor = new THREE.InstancedBufferAttribute(
        new Float32Array(count * 3),
        3
      );
    }

    for (let i = 0; i < count; i++) {
      dummy.position.set(
        positions[i * 3],
        positions[i * 3 + 1],
        positions[i * 3 + 2]
      );
      dummy.scale.setScalar(scales[i]);
      dummy.rotation.set(
        hash01(i + 1) * 0.8,
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
  }, [count, positions, scales, colors, dummy, colorTmp]);

  useFrame(({ clock }) => {
    if (reducedMotion || !groupRef.current) return;
    const t = clock.elapsedTime;
    groupRef.current.rotation.y = t * 0.06;
    groupRef.current.rotation.x = Math.sin(t * 0.13) * 0.045;
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[triPositions, 3]}
          />
        </bufferGeometry>
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.92}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
}
