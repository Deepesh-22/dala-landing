import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { buildMorphTargets } from './shapes.js';
import { getParticleBudget } from '../hooks/useResponsive.js';
import { scrollStore } from '../lib/scrollStore.js';

// Yellow/white dominant for brain · cooler accents later
const PALETTE_WARM = [
  new THREE.Color('#ffffff'),
  new THREE.Color('#ffffff'),
  new THREE.Color('#fff6d6'),
  new THREE.Color('#f5d76e'),
  new THREE.Color('#ffb829'),
  new THREE.Color('#f0c14a'),
  new THREE.Color('#c39bd3'),
  new THREE.Color('#9b59b6'),
  new THREE.Color('#8052ff'),
  new THREE.Color('#5dade2'),
];

const PALETTE_COOL = [
  new THREE.Color('#ffffff'),
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
 * Morphing particle system — polished lag, noise, color, performance.
 */
export default function ParticleSystem({ reducedMotion = false }) {
  const meshRef = useRef(null);
  const groupRef = useRef(null);
  const lastMorph = useRef(-1);
  const frameSkip = useRef(0);

  const count = useMemo(() => {
    try {
      // Slightly lighter budget for smoother morph updates
      return Math.min(getParticleBudget(), 48000);
    } catch {
      return 36000;
    }
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorTmp = useMemo(() => new THREE.Color(), []);

  const { targets, scales, seeds, warmColors, coolColors } = useMemo(() => {
    const targets = buildMorphTargets(count);
    const scales = new Float32Array(count);
    const seeds = new Float32Array(count);
    const warmColors = new Float32Array(count * 3);
    const coolColors = new Float32Array(count * 3);
    const brain = targets[0];

    for (let i = 0; i < count; i++) {
      const seed = hash01(i);
      seeds[i] = seed;
      scales[i] = 0.018 + seed * 0.022;

      // Position-based warm coloring for brain core (yellow/white frontal)
      const bx = brain[i * 3] || 0;
      const by = brain[i * 3 + 1] || 0;
      const bz = brain[i * 3 + 2] || 0;
      const frontal = Math.max(0, bz + 0.2);
      const region = (frontal * 0.5 + Math.abs(bx) * 0.25 + seed * 0.4) * 0.6;
      let wi = Math.floor(region * PALETTE_WARM.length) % PALETTE_WARM.length;
      if (!Number.isFinite(wi) || wi < 0) wi = 0;
      const w = PALETTE_WARM[wi] || PALETTE_WARM[0];
      // Boost yellow/white brightness on brain
      const wDim = 0.85 + hash01(i + 91) * 0.2;
      warmColors[i * 3] = Math.min(1, w.r * wDim);
      warmColors[i * 3 + 1] = Math.min(1, w.g * wDim);
      warmColors[i * 3 + 2] = Math.min(1, w.b * wDim * 0.92);

      let ci = Math.floor(seed * PALETTE_COOL.length) % PALETTE_COOL.length;
      const c = PALETTE_COOL[ci] || PALETTE_COOL[0];
      const cDim = 0.7 + hash01(i + 17) * 0.3;
      coolColors[i * 3] = Math.min(1, c.r * cDim);
      coolColors[i * 3 + 1] = Math.min(1, c.g * cDim);
      coolColors[i * 3 + 2] = Math.min(1, c.b * cDim);
    }

    return { targets, scales, seeds, warmColors, coolColors };
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
        opacity: 0.9,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    []
  );

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
        warmColors[i * 3],
        warmColors[i * 3 + 1],
        warmColors[i * 3 + 2]
      );
      mesh.setColorAt(i, colorTmp);
    }

    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
  }, [count, targets, scales, seeds, warmColors, dummy, colorTmp]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const t = clock.elapsedTime;
    const morph = reducedMotion ? 0 : scrollStore.morph;
    const morphDelta = Math.abs(morph - lastMorph.current);
    const isMorphing = morphDelta > 0.00015;
    lastMorph.current = morph;

    // Performance: when static, update only every 2nd frame for idle breath
    frameSkip.current += 1;
    if (!isMorphing && !reducedMotion && frameSkip.current % 2 === 0) {
      // still rotate group lightly
      if (groupRef.current) {
        groupRef.current.rotation.y = t * 0.035 + morph * 0.3;
        groupRef.current.rotation.x = Math.sin(t * 0.1) * 0.03;
        groupRef.current.scale.setScalar(1 + Math.sin(t * 0.45) * 0.012);
      }
      return;
    }
    if (reducedMotion && !isMorphing) return;

    const stateF = Math.min(4.999, Math.max(0, morph));
    const i0 = Math.floor(stateF);
    const i1 = Math.min(5, i0 + 1);
    const localT = stateF - i0;

    const posA = targets[i0];
    const posB = targets[i1];

    // Stronger mid-transition disintegration
    const mid = 1 - Math.abs(localT - 0.5) * 2;
    const scatter = mid * mid * (0.14 + localT * 0.18);

    for (let i = 0; i < count; i++) {
      const seed = seeds[i];

      // Stronger per-particle lag — physical rebuild feel
      const lagWindow = 0.38;
      const delayed = smoothstep(
        0,
        1,
        (localT - seed * lagWindow) / (1 - lagWindow)
      );

      const ax = posA[i * 3];
      const ay = posA[i * 3 + 1];
      const az = posA[i * 3 + 2];
      const bx = posB[i * 3];
      const by = posB[i * 3 + 1];
      const bz = posB[i * 3 + 2];

      let x = ax + (bx - ax) * delayed;
      let y = ay + (by - ay) * delayed;
      let z = az + (bz - az) * delayed;

      // Richer noise during transition
      if (!reducedMotion && scatter > 0.008) {
        const n1 = Math.sin(t * 0.85 + seed * 14.0 + x * 3.5);
        const n2 = Math.cos(t * 0.65 + seed * 9.0 + y * 4.2);
        const n3 = Math.sin(t * 0.5 + seed * 17.0 + z * 2.8);
        const n4 = Math.sin(t * 1.2 + seed * 6.0);
        const amp = scatter * (0.7 + seed * 0.9);
        x += (n1 + n4 * 0.4) * amp;
        y += n2 * amp * 0.85;
        z += n3 * amp * 0.9;
      }

      // Idle micro-motion when settled
      if (!reducedMotion && !isMorphing) {
        x += Math.sin(t * 0.5 + seed * 6) * 0.01 * (seed - 0.5);
        y += Math.cos(t * 0.4 + seed * 4) * 0.008;
      }

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(scales[i] * (1 + mid * 0.12 * seed));
      dummy.rotation.set(
        t * (0.12 + seed * 0.25) * (0.25 + mid * 1.2) + seed * 3,
        t * (0.08 + seed * 0.18) * (0.25 + mid * 1.1) + seed * 5,
        seed * Math.PI * 2 + mid * seed
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      // Warm brain → cooler later shapes
      const coolBlend = smoothstep(0.15, 0.85, morph / 5);
      colorTmp.setRGB(
        warmColors[i * 3] * (1 - coolBlend) + coolColors[i * 3] * coolBlend,
        warmColors[i * 3 + 1] * (1 - coolBlend) +
          coolColors[i * 3 + 1] * coolBlend,
        warmColors[i * 3 + 2] * (1 - coolBlend) +
          coolColors[i * 3 + 2] * coolBlend
      );
      mesh.setColorAt(i, colorTmp);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    if (groupRef.current && !reducedMotion) {
      groupRef.current.rotation.y = t * 0.035 + morph * 0.3;
      groupRef.current.rotation.x =
        Math.sin(t * 0.1) * 0.03 + morph * 0.035;
      const breath = 1 + Math.sin(t * 0.45) * 0.012 + mid * 0.05;
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
