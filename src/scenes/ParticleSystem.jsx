import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { buildMorphTargets } from './shapes.js';
import { getParticleBudget } from '../hooks/useResponsive.js';
import { scrollStore } from '../lib/scrollStore.js';

const PALETTE = [
  new THREE.Color('#ffffff'),
  new THREE.Color('#ffffff'),
  new THREE.Color('#f8f1d4'),
  new THREE.Color('#f5d76e'),
  new THREE.Color('#ffb829'),
  new THREE.Color('#ecd6ff'),
  new THREE.Color('#c39bd3'),
  new THREE.Color('#9b59b6'),
  new THREE.Color('#8052ff'),
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

function smoothstep(e0, e1, x) {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/**
 * Phase 7 — scroll-driven morphing particle system.
 * 6 shape targets · lagged mix · noise spread · color shift
 */
export default function ParticleSystem({ reducedMotion = false }) {
  const meshRef = useRef(null);
  const groupRef = useRef(null);
  const lastMorph = useRef(-1);

  const count = useMemo(() => {
    try {
      return getParticleBudget();
    } catch {
      return 40000;
    }
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorTmp = useMemo(() => new THREE.Color(), []);

  const { targets, scales, seeds, baseColors } = useMemo(() => {
    const targets = buildMorphTargets(count);
    const scales = new Float32Array(count);
    const seeds = new Float32Array(count);
    const baseColors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const seed = hash01(i);
      seeds[i] = seed;
      scales[i] = 0.018 + seed * 0.022;

      const band = Math.floor(seed * PALETTE.length) % PALETTE.length;
      const c = PALETTE[band] || PALETTE[0];
      const dim = 0.7 + hash01(i + 91) * 0.35;
      baseColors[i * 3] = Math.min(1, c.r * dim);
      baseColors[i * 3 + 1] = Math.min(1, c.g * dim);
      baseColors[i * 3 + 2] = Math.min(1, c.b * dim);
    }

    return { targets, scales, seeds, baseColors };
  }, [count]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        [0, 1.15, 0, -1, -0.65, 0, 1, -0.65, 0],
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
        opacity: 0.88,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    []
  );

  // Initial placement at brain
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const pos = targets[0];

    for (let i = 0; i < count; i++) {
      dummy.position.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
      dummy.scale.setScalar(scales[i]);
      dummy.rotation.set(
        seeds[i] * 1.1,
        hash01(i + 2) * Math.PI * 2,
        hash01(i + 3) * Math.PI * 2
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      colorTmp.setRGB(
        baseColors[i * 3],
        baseColors[i * 3 + 1],
        baseColors[i * 3 + 2]
      );
      mesh.setColorAt(i, colorTmp);
    }

    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
  }, [count, targets, scales, seeds, baseColors, dummy, colorTmp]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const t = clock.elapsedTime;
    const morph = reducedMotion ? 0 : scrollStore.morph;

    // Shape pair indices + local blend 0→1
    const stateF = Math.min(4.999, Math.max(0, morph));
    const i0 = Math.floor(stateF);
    const i1 = Math.min(5, i0 + 1);
    const localT = stateF - i0;

    const posA = targets[i0];
    const posB = targets[i1];

    // Scatter peaks mid-transition
    const mid = 1 - Math.abs(localT - 0.5) * 2;
    const scatter = mid * (0.08 + localT * 0.12);

    // Always update during active morph or gentle idle drift
    const morphDelta = Math.abs(morph - lastMorph.current);
    lastMorph.current = morph;

    for (let i = 0; i < count; i++) {
      const seed = seeds[i];

      // Per-particle lag — some lag behind, some lead
      const delayed = smoothstep(0, 1, (localT - seed * 0.22) / 0.78);

      const ax = posA[i * 3];
      const ay = posA[i * 3 + 1];
      const az = posA[i * 3 + 2];
      const bx = posB[i * 3];
      const by = posB[i * 3 + 1];
      const bz = posB[i * 3 + 2];

      let x = ax + (bx - ax) * delayed;
      let y = ay + (by - ay) * delayed;
      let z = az + (bz - az) * delayed;

      // Procedural noise — organic disintegration / rebuild
      if (!reducedMotion && scatter > 0.01) {
        const n1 = Math.sin(t * 0.7 + seed * 12.0 + x * 3.0);
        const n2 = Math.cos(t * 0.55 + seed * 8.0 + y * 4.0);
        const n3 = Math.sin(t * 0.4 + seed * 15.0 + z * 2.5);
        x += n1 * scatter * (0.6 + seed);
        y += n2 * scatter * (0.5 + seed * 0.8);
        z += n3 * scatter * (0.7 + seed * 0.5);
      }

      // Subtle idle breath when nearly static
      if (!reducedMotion && morphDelta < 0.0005) {
        const breath = Math.sin(t * 0.5 + seed * 6) * 0.012;
        x += breath * (seed - 0.5);
        y += Math.cos(t * 0.4 + seed * 4) * 0.01;
      }

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(scales[i] * (1 + mid * 0.08 * seed));
      dummy.rotation.set(
        t * (0.15 + seed * 0.2) * (0.3 + mid) + seed * 3,
        t * (0.1 + seed * 0.15) * (0.3 + mid) + seed * 5,
        seed * Math.PI * 2
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      // Color shift toward cooler tones as morph advances
      const cool = morph / 5;
      colorTmp.setRGB(
        baseColors[i * 3] * (1 - cool * 0.15),
        baseColors[i * 3 + 1] * (1 - cool * 0.05),
        Math.min(1, baseColors[i * 3 + 2] + cool * 0.12)
      );
      mesh.setColorAt(i, colorTmp);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    // Group rotation + scale tied to morph
    if (groupRef.current && !reducedMotion) {
      groupRef.current.rotation.y = t * 0.04 + morph * 0.35;
      groupRef.current.rotation.x = Math.sin(t * 0.1) * 0.03 + morph * 0.04;
      const breath = 1 + Math.sin(t * 0.5) * 0.015 + mid * 0.04;
      groupRef.current.scale.setScalar(breath);
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
