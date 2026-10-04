import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { buildMorphTargets } from './shapes.js';
import { getParticleBudget } from '../hooks/useResponsive.js';
import { scrollStore } from '../lib/scrollStore.js';

/** Balanced palette — region-based, not monochrome gold */
const C_WHITE = new THREE.Color('#ffffff');
const C_CREAM = new THREE.Color('#fff6d6');
const C_YELLOW = new THREE.Color('#f5d76e');
const C_GOLD = new THREE.Color('#ffb829');
const C_LILAC = new THREE.Color('#ecd6ff');
const C_VIOLET = new THREE.Color('#c39bd3');
const C_PURPLE = new THREE.Color('#9b59b6');
const C_INDIGO = new THREE.Color('#8052ff');
const C_CYAN = new THREE.Color('#5dade2');
const C_BLUE = new THREE.Color('#3498db');
const C_TEAL = new THREE.Color('#1abc9c');
const C_GREEN = new THREE.Color('#2ecc71');
const C_MAGENTA = new THREE.Color('#e84393');

function hash01(i) {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function smoothstep(e0, e1, x) {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/** Pick color from spatial region of the brain */
function colorForBrainPoint(x, y, z, seed) {
  const lateral = Math.abs(x);
  const frontal = z; // +z front
  const elev = y;

  // Core / inner — white + soft yellow
  if (lateral < 0.35 && Math.abs(elev) < 0.35 && frontal > -0.2) {
    return seed > 0.55 ? C_WHITE : seed > 0.25 ? C_CREAM : C_YELLOW;
  }

  // Frontal lobe — yellow / gold dominant
  if (frontal > 0.25) {
    if (seed > 0.7) return C_WHITE;
    if (seed > 0.35) return C_YELLOW;
    if (seed > 0.15) return C_GOLD;
    return C_LILAC;
  }

  // Lateral outer — purple / indigo / blue
  if (lateral > 0.45) {
    if (seed > 0.75) return C_CYAN;
    if (seed > 0.5) return C_INDIGO;
    if (seed > 0.28) return C_PURPLE;
    if (seed > 0.12) return C_VIOLET;
    return C_BLUE;
  }

  // Superior / top — mix yellow + lilac
  if (elev > 0.3) {
    if (seed > 0.6) return C_YELLOW;
    if (seed > 0.3) return C_LILAC;
    return C_VIOLET;
  }

  // Lower / stem area — cooler + accents
  if (elev < -0.25) {
    if (seed > 0.85) return C_MAGENTA;
    if (seed > 0.6) return C_TEAL;
    if (seed > 0.35) return C_BLUE;
    return C_PURPLE;
  }

  // Mid default — balanced mix
  if (seed > 0.82) return C_GREEN;
  if (seed > 0.68) return C_MAGENTA;
  if (seed > 0.5) return C_CYAN;
  if (seed > 0.35) return C_YELLOW;
  if (seed > 0.2) return C_PURPLE;
  if (seed > 0.1) return C_WHITE;
  return C_INDIGO;
}

export default function ParticleSystem({ reducedMotion = false }) {
  const meshRef = useRef(null);
  const groupRef = useRef(null);
  const lastMorph = useRef(-1);
  const frameSkip = useRef(0);

  const count = useMemo(() => {
    try {
      return Math.min(getParticleBudget(), 48000);
    } catch {
      return 36000;
    }
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorTmp = useMemo(() => new THREE.Color(), []);

  const { targets, scales, seeds, brainColors, morphColors } = useMemo(() => {
    const targets = buildMorphTargets(count);
    const scales = new Float32Array(count);
    const seeds = new Float32Array(count);
    const brainColors = new Float32Array(count * 3);
    const morphColors = new Float32Array(count * 3);
    const brain = targets[0];

    for (let i = 0; i < count; i++) {
      const seed = hash01(i);
      seeds[i] = seed;
      scales[i] = 0.018 + seed * 0.022;

      const bx = brain[i * 3] || 0;
      const by = brain[i * 3 + 1] || 0;
      const bz = brain[i * 3 + 2] || 0;

      const bc = colorForBrainPoint(bx, by, bz, seed);
      const dim = 0.72 + hash01(i + 91) * 0.32;
      brainColors[i * 3] = Math.min(1, bc.r * dim);
      brainColors[i * 3 + 1] = Math.min(1, bc.g * dim);
      brainColors[i * 3 + 2] = Math.min(1, bc.b * dim);

      // Later morphs lean cooler / more varied
      const morphPalette = [
        C_WHITE,
        C_LILAC,
        C_VIOLET,
        C_PURPLE,
        C_INDIGO,
        C_CYAN,
        C_BLUE,
        C_TEAL,
        C_GREEN,
        C_MAGENTA,
        C_YELLOW,
        C_GOLD,
      ];
      const mc = morphPalette[Math.floor(seed * morphPalette.length) % morphPalette.length];
      const md = 0.68 + hash01(i + 17) * 0.35;
      morphColors[i * 3] = Math.min(1, mc.r * md);
      morphColors[i * 3 + 1] = Math.min(1, mc.g * md);
      morphColors[i * 3 + 2] = Math.min(1, mc.b * md);
    }

    return { targets, scales, seeds, brainColors, morphColors };
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
        brainColors[i * 3],
        brainColors[i * 3 + 1],
        brainColors[i * 3 + 2]
      );
      mesh.setColorAt(i, colorTmp);
    }

    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
  }, [count, targets, scales, seeds, brainColors, dummy, colorTmp]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const t = clock.elapsedTime;
    const morph = reducedMotion ? 0 : scrollStore.morph;
    const morphDelta = Math.abs(morph - lastMorph.current);
    const isMorphing = morphDelta > 0.00015;
    lastMorph.current = morph;

    frameSkip.current += 1;
    if (!isMorphing && !reducedMotion && frameSkip.current % 2 === 0) {
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

    const mid = 1 - Math.abs(localT - 0.5) * 2;
    const scatter = mid * mid * (0.14 + localT * 0.18);

    // Stay on brain palette early; blend toward morph palette later
    const coolBlend = smoothstep(0.4, 2.2, morph);

    for (let i = 0; i < count; i++) {
      const seed = seeds[i];
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

      colorTmp.setRGB(
        brainColors[i * 3] * (1 - coolBlend) + morphColors[i * 3] * coolBlend,
        brainColors[i * 3 + 1] * (1 - coolBlend) +
          morphColors[i * 3 + 1] * coolBlend,
        brainColors[i * 3 + 2] * (1 - coolBlend) +
          morphColors[i * 3 + 2] * coolBlend
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
