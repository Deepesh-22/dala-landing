import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { generateShape } from './shapes.js';
import { getParticleBudget } from '../hooks/useResponsive.js';
import {
  particleVertexShader,
  particleFragmentShader,
} from './particleShaders.js';

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
 * Phase 3 — GPU instanced wireframe triangles.
 * Hollow triangular outlines with per-instance color + seed.
 * Animation runs in the vertex shader (no JS particle loop).
 */
export default function ParticleSystem({
  shapeA = 'brain',
  reducedMotion = false,
}) {
  const meshRef = useRef(null);
  const groupRef = useRef(null);
  const materialRef = useRef(null);

  const count = useMemo(() => getParticleBudget(), []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Tiny line-loop triangle (3 vertices → wireframe edges)
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    // Equilateral-ish triangle in local space
    const s = 1;
    geo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        [0, s * 1.15, 0, -s, -s * 0.65, 0, s, -s * 0.65, 0],
        3
      )
    );
    // Close the loop for wireframe edges
    geo.setIndex([0, 1, 2]);
    return geo;
  }, []);

  const material = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      wireframe: true,
      uniforms: {
        uTime: { value: 0 },
        uBreath: { value: 1 },
        uReduced: { value: reducedMotion ? 1 : 0 },
      },
    });
    materialRef.current = mat;
    return mat;
  }, [reducedMotion]);

  const data = useMemo(() => {
    const pos = generateShape(shapeA, count);
    const seeds = new Float32Array(count);
    const scales = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const seed = hash01(i);
      seeds[i] = seed;
      // Very small wire triangles
      scales[i] = 0.018 + seed * 0.022;

      const x = pos[i * 3];
      const y = pos[i * 3 + 1];
      const z = pos[i * 3 + 2];
      const region =
        (Math.abs(x) * 1.2 + (y + 0.5) * 0.55 + (z + 0.5) * 0.4 + seed) * 0.55;
      const band = Math.floor(region * PALETTE.length) % PALETTE.length;
      const c = PALETTE[band];
      const dim = 0.55 + hash01(i + 91) * 0.45;
      colors[i * 3] = Math.min(1, c.r * dim);
      colors[i * 3 + 1] = Math.min(1, c.g * dim);
      colors[i * 3 + 2] = Math.min(1, c.b * dim);
    }

    return { pos, seeds, scales, colors };
  }, [count, shapeA]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const { pos, seeds, scales, colors } = data;

    // Per-instance attributes for the custom shader
    const seedAttr = new THREE.InstancedBufferAttribute(seeds, 1);
    const scaleAttr = new THREE.InstancedBufferAttribute(scales, 1);
    const colorAttr = new THREE.InstancedBufferAttribute(colors, 3);

    mesh.geometry.setAttribute('aSeed', seedAttr);
    mesh.geometry.setAttribute('aScale', scaleAttr);
    mesh.geometry.setAttribute('instanceColorAttr', colorAttr);

    for (let i = 0; i < count; i++) {
      dummy.position.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
      // Scale applied in shader via aScale — keep matrix scale at 1
      dummy.scale.set(1, 1, 1);
      dummy.rotation.set(
        hash01(i + 1) * Math.PI,
        hash01(i + 2) * Math.PI * 2,
        hash01(i + 3) * Math.PI * 2
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;
    mesh.visible = true;
  }, [count, data, dummy]);

  // Only update uniforms + slow group rotation — no particle JS loop
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = t;
      materialRef.current.uniforms.uReduced.value = reducedMotion ? 1 : 0;
    }
    if (!reducedMotion && groupRef.current) {
      groupRef.current.rotation.y = t * 0.05;
      groupRef.current.rotation.x = Math.sin(t * 0.12) * 0.04;
    }
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
