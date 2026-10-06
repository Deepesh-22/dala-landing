import { useFrame } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { buildMorphTargets } from './shapes.js';
import { buildColorBuffers } from './colorField.js';
import { getTriangleGeometry } from './sharedGeometry.js';
import { createParticleBasicMaterial } from './particleMaterial.js';
import { getDeviceProfile, getParticleBudget } from '../hooks/useResponsive.js';
import { sceneState } from '../lib/sceneState.js';
import { activeCount, perf, sampleFrame } from '../lib/perf.js';
import { interaction } from '../lib/interactionState.js';

function hash01(i) {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function smoothstep(e0, e1, x) {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/**
 * Solid filled triangles matching dala.craftedbygc.com:
 * medium discrete faces, multi-hue, yellow rim, no white core.
 */
export default function ParticleSystem({ reducedMotion = false }) {
  const meshRef = useRef(null);
  const groupRef = useRef(null);
  const lastMorph = useRef(-1);
  const lastColorMorph = useRef(-1);
  const frameSkip = useRef(0);
  const prevPos = useRef(null);
  const liveCount = useRef(0);

  const dummy = useRef(new THREE.Object3D()).current;
  const colorTmp = useRef(new THREE.Color()).current;

  const profile = useMemo(() => getDeviceProfile(), []);
  const triangleScale = profile.triangleScale ?? 1.35;
  const isMobile = !!profile.isMobile;

  const maxCount = useMemo(() => {
    try {
      const budget = getParticleBudget();
      if (profile.isMobile) return Math.min(budget, 12000);
      if (profile.isTablet) return Math.min(budget, 28000);
      return Math.min(budget, 45000);
    } catch {
      return profile.isMobile ? 9000 : 38000;
    }
  }, [profile]);

  const idleSkip = isMobile ? 4 : 2;

  const { targets, scales, seeds, brainColors, morphColors } = useMemo(() => {
    const targets = buildMorphTargets(maxCount);
    const scales = new Float32Array(maxCount);
    const seeds = new Float32Array(maxCount);
    const brain = targets[0];
    const brainBuf = buildColorBuffers(brain, maxCount);
    const morphSrc = targets[3] || targets[2] || brain;
    const morphBuf = buildColorBuffers(morphSrc, maxCount);

    for (let i = 0; i < maxCount; i++) {
      seeds[i] = hash01(i);
      // Medium size — solid faces readable like reference (not micro-fibers, not giant shards)
      scales[i] = (0.026 + seeds[i] * 0.028) * triangleScale;
    }

    return {
      targets,
      scales,
      seeds,
      brainColors: brainBuf.colors,
      morphColors: morphBuf.colors,
    };
  }, [maxCount, triangleScale]);

  const geometry = useMemo(() => getTriangleGeometry(), []);
  const material = useMemo(
    () => createParticleBasicMaterial({ opacity: 0.95 }),
    []
  );

  useEffect(() => () => material.dispose(), [material]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const pos = targets[0];

    prevPos.current = new Float32Array(maxCount * 3);
    prevPos.current.set(pos);
    liveCount.current = maxCount;

    for (let i = 0; i < maxCount; i++) {
      dummy.position.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
      dummy.scale.setScalar(scales[i]);
      dummy.rotation.set(
        seeds[i] * Math.PI * 2,
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

    mesh.count = maxCount;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
  }, [maxCount, targets, scales, seeds, brainColors, dummy, colorTmp]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    sampleFrame(clock.elapsedTime * 1000, isMobile);

    const t = clock.elapsedTime;
    const s = sceneState;
    const morph = reducedMotion ? 0 : s.morph;
    const morphDelta = Math.abs(morph - lastMorph.current);
    const isMorphing = morphDelta > 0.00012;
    lastMorph.current = morph;

    const nextLive = Math.min(maxCount, activeCount(maxCount));
    if (nextLive !== liveCount.current) {
      liveCount.current = nextLive;
      mesh.count = nextLive;
    }
    const n = liveCount.current;

    if (mesh.material) mesh.material.opacity = 0.95 * s.colorIntensity;

    if (!isMorphing) {
      frameSkip.current += 1;
      if (!reducedMotion && groupRef.current) {
        groupRef.current.rotation.y = t * s.rotation;
        groupRef.current.rotation.x = Math.sin(t * 0.06) * 0.012;
      }

      if (frameSkip.current % (idleSkip * 8) === 0 && prevPos.current) {
        const prev = prevPos.current;
        const px = interaction.smoothX;
        const py = interaction.smoothY;
        const step = perf.density < 0.55 ? 2 : 1;
        for (let i = 0; i < n; i += step) {
          const i3 = i * 3;
          const seed = seeds[i];
          let x = prev[i3];
          let y = prev[i3 + 1];
          let z = prev[i3 + 2];
          if (!reducedMotion && !isMobile) {
            x += px * 0.006 * seed;
            y += py * 0.003 * seed;
          }
          dummy.position.set(x, y, z);
          dummy.scale.setScalar(scales[i] * s.particleSize);
          dummy.rotation.set(
            seeds[i] * 2.1,
            seeds[i] * 3.4 + t * 0.008 * seed,
            seeds[i] * Math.PI * 2
          );
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
      }
      return;
    }

    if (reducedMotion) return;

    const stateF = Math.min(4.999, Math.max(0, morph));
    const i0 = Math.floor(stateF);
    const i1 = Math.min(5, i0 + 1);
    const localT = stateF - i0;
    const posA = targets[i0];
    const posB = targets[i1];
    const mid = 1 - Math.abs(localT - 0.5) * 2;
    const scatter = s.distortion * 0.02 + mid * mid * 0.01;
    const coolBlend = smoothstep(0.5, 2.5, morph);
    const spring = 0.16;
    const lagWindow = 0.1;

    if (!prevPos.current) {
      prevPos.current = new Float32Array(maxCount * 3);
      prevPos.current.set(posA);
    }
    const prev = prevPos.current;
    const needColor = Math.abs(morph - lastColorMorph.current) > 0.01;
    if (needColor) lastColorMorph.current = morph;
    const stride = perf.density < 0.6 ? 2 : 1;

    for (let i = 0; i < n; i += stride) {
      const seed = seeds[i];
      const i3 = i * 3;
      const delayed = smoothstep(0, 1, (localT - seed * lagWindow) / (1 - lagWindow));

      let tx = posA[i3] + (posB[i3] - posA[i3]) * delayed;
      let ty = posA[i3 + 1] + (posB[i3 + 1] - posA[i3 + 1]) * delayed;
      let tz = posA[i3 + 2] + (posB[i3 + 2] - posA[i3 + 2]) * delayed;

      if (scatter > 0.002) {
        const amp = scatter * (0.3 + seed * 0.3);
        tx += Math.sin(t * 0.4 + seed * 10) * amp;
        ty += Math.cos(t * 0.3 + seed * 7) * amp * 0.55;
        tz += Math.sin(t * 0.25 + seed * 12) * amp * 0.6;
      }

      const x = prev[i3] + (tx - prev[i3]) * spring;
      const y = prev[i3 + 1] + (ty - prev[i3 + 1]) * spring;
      const z = prev[i3 + 2] + (tz - prev[i3 + 2]) * spring;
      prev[i3] = x;
      prev[i3 + 1] = y;
      prev[i3 + 2] = z;

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(scales[i] * s.particleSize);
      dummy.rotation.set(
        t * 0.015 * mid + seed * 2.1,
        t * 0.012 * mid + seed * 3.4,
        seed * Math.PI * 2
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      if (needColor) {
        colorTmp.setRGB(
          (brainColors[i3] * (1 - coolBlend) + morphColors[i3] * coolBlend) *
            s.colorIntensity,
          (brainColors[i3 + 1] * (1 - coolBlend) +
            morphColors[i3 + 1] * coolBlend) *
            s.colorIntensity,
          (brainColors[i3 + 2] * (1 - coolBlend) +
            morphColors[i3 + 2] * coolBlend) *
            s.colorIntensity
        );
        mesh.setColorAt(i, colorTmp);
      }
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (needColor && mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    if (groupRef.current) {
      groupRef.current.rotation.y = t * s.rotation + morph * 0.04;
      groupRef.current.rotation.x = Math.sin(t * 0.06) * 0.012;
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh
        ref={meshRef}
        args={[geometry, material, maxCount]}
        frustumCulled={false}
      />
    </group>
  );
}
