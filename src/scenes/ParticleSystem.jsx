import { useFrame } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { buildMorphTargets } from './shapes.js';
import { buildColorBuffers } from './colorField.js';
import { getTriangleGeometry } from './sharedGeometry.js';
import {
  createParticleBasicMaterial,
  tickMaterialTime,
} from './particleMaterial.js';
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
 * Reference-matched particle system:
 * - Multi-hue discrete solid triangles
 * - Yellow rim only, colorful interior
 * - Readable mosaic size (not giant yellow shards)
 */
export default function ParticleSystem({ reducedMotion = false }) {
  const meshRef = useRef(null);
  const glowRef = useRef(null);
  const groupRef = useRef(null);
  const lastMorph = useRef(-1);
  const lastColorMorph = useRef(-1);
  const frameSkip = useRef(0);
  const prevPos = useRef(null);
  const liveCount = useRef(0);

  const dummy = useRef(new THREE.Object3D()).current;
  const colorTmp = useRef(new THREE.Color()).current;

  const profile = useMemo(() => getDeviceProfile(), []);
  const triangleScale = profile.triangleScale ?? 1.25;
  const enableGlowBase = profile.enableGlow && !reducedMotion;
  const isMobile = !!profile.isMobile;

  const maxCount = useMemo(() => {
    try {
      const budget = getParticleBudget();
      if (profile.isMobile) return Math.min(budget, 12000);
      if (profile.isTablet) return Math.min(budget, 26000);
      return Math.min(budget, 42000);
    } catch {
      return profile.isMobile ? 9000 : 36000;
    }
  }, [profile]);

  const glowMax = useMemo(() => {
    if (!enableGlowBase) return 0;
    return Math.min(Math.floor(maxCount * 0.018), 550);
  }, [maxCount, enableGlowBase]);

  const idleSkip = isMobile ? 4 : 2;

  const { targets, scales, seeds, brainColors, morphColors, glows, glowIndices } =
    useMemo(() => {
      const targets = buildMorphTargets(maxCount);
      const scales = new Float32Array(maxCount);
      const seeds = new Float32Array(maxCount);
      const brain = targets[0];

      const brainBuf = buildColorBuffers(brain, maxCount);
      const morphSrc = targets[3] || targets[2] || brain;
      const morphBuf = buildColorBuffers(morphSrc, maxCount);

      for (let i = 0; i < maxCount; i++) {
        seeds[i] = hash01(i);
        // Smaller discrete faces — mosaic like reference, not giant shards
        scales[i] = (0.014 + seeds[i] * 0.016) * triangleScale;
      }

      const ranked = [];
      for (let i = 0; i < maxCount; i++) {
        if (brainBuf.glows[i] > 0.15) ranked.push(i);
      }
      ranked.sort((a, b) => brainBuf.glows[b] - brainBuf.glows[a]);
      const glowIndices = enableGlowBase ? ranked.slice(0, glowMax) : [];

      return {
        targets,
        scales,
        seeds,
        brainColors: brainBuf.colors,
        morphColors: morphBuf.colors,
        glows: brainBuf.glows,
        glowIndices,
      };
    }, [maxCount, triangleScale, enableGlowBase, glowMax]);

  const geometry = useMemo(() => getTriangleGeometry(), []);
  const material = useMemo(
    () => createParticleBasicMaterial({ opacity: 0.9 }),
    []
  );
  const glowMaterial = useMemo(
    () =>
      enableGlowBase
        ? createParticleBasicMaterial({ opacity: 0.08, additive: true })
        : null,
    [enableGlowBase]
  );

  useEffect(() => {
    return () => {
      material.dispose();
      glowMaterial?.dispose();
    };
  }, [material, glowMaterial]);

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

    const glowMesh = glowRef.current;
    if (glowMesh && glowIndices.length) {
      for (let g = 0; g < glowIndices.length; g++) {
        const i = glowIndices[g];
        dummy.position.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
        dummy.scale.setScalar(scales[i] * (1.5 + glows[i] * 0.4));
        dummy.rotation.set(seeds[i], hash01(i + 5), hash01(i + 7));
        dummy.updateMatrix();
        glowMesh.setMatrixAt(g, dummy.matrix);
        colorTmp.setRGB(
          brainColors[i * 3],
          brainColors[i * 3 + 1],
          brainColors[i * 3 + 2]
        );
        glowMesh.setColorAt(g, colorTmp);
      }
      glowMesh.count = glowIndices.length;
      glowMesh.instanceMatrix.needsUpdate = true;
      if (glowMesh.instanceColor) glowMesh.instanceColor.needsUpdate = true;
      glowMesh.frustumCulled = false;
    }
  }, [
    maxCount,
    targets,
    scales,
    seeds,
    brainColors,
    glows,
    glowIndices,
    dummy,
    colorTmp,
  ]);

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

    const vel = reducedMotion ? 0 : interaction.scrollVelocity;
    const noiseAmp = isMorphing || reducedMotion ? 0 : 0.0008 + vel * 0.003;
    tickMaterialTime(material, t, noiseAmp);
    if (glowMaterial) tickMaterialTime(glowMaterial, t, noiseAmp * 0.3);

    if (mesh.material) {
      mesh.material.opacity = 0.9 * s.colorIntensity;
    }

    if (!isMorphing) {
      frameSkip.current += 1;
      if (!reducedMotion && groupRef.current) {
        groupRef.current.rotation.y = t * s.rotation * (1 + vel * 0.12);
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
            const prox = 0.006 * seed;
            x += px * prox;
            y += py * prox * 0.5;
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

      const glowMesh = glowRef.current;
      if (glowMesh) glowMesh.visible = enableGlowBase && perf.allowGlow;
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
    const scatter = s.distortion * 0.025 + mid * mid * 0.012 + vel * 0.01;
    const coolBlend = smoothstep(0.5, 2.5, morph);
    const sizeMul = s.particleSize;
    const colorI = s.colorIntensity;
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

      const delayed = smoothstep(
        0,
        1,
        (localT - seed * lagWindow) / (1 - lagWindow)
      );

      const ax = posA[i3];
      const ay = posA[i3 + 1];
      const az = posA[i3 + 2];
      const bx = posB[i3];
      const by = posB[i3 + 1];
      const bz = posB[i3 + 2];

      let tx = ax + (bx - ax) * delayed;
      let ty = ay + (by - ay) * delayed;
      let tz = az + (bz - az) * delayed;

      if (scatter > 0.002) {
        const n1 = Math.sin(t * 0.4 + seed * 10 + ax * 2);
        const n2 = Math.cos(t * 0.32 + seed * 7 + ay * 2.5);
        const n3 = Math.sin(t * 0.25 + seed * 12 + az * 2);
        const amp = scatter * (0.3 + seed * 0.3);
        tx += n1 * amp;
        ty += n2 * amp * 0.55;
        tz += n3 * amp * 0.6;
      }

      const x = prev[i3] + (tx - prev[i3]) * spring;
      const y = prev[i3 + 1] + (ty - prev[i3 + 1]) * spring;
      const z = prev[i3 + 2] + (tz - prev[i3 + 2]) * spring;

      prev[i3] = x;
      prev[i3 + 1] = y;
      prev[i3 + 2] = z;

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(scales[i] * sizeMul * (1 + mid * 0.015 * seed));

      const rotAmp = 0.03 + mid * 0.08;
      dummy.rotation.set(
        t * 0.02 * rotAmp + seed * 2.1,
        t * 0.015 * rotAmp + seed * 3.4,
        seed * Math.PI * 2
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      if (needColor) {
        colorTmp.setRGB(
          (brainColors[i3] * (1 - coolBlend) + morphColors[i3] * coolBlend) *
            colorI,
          (brainColors[i3 + 1] * (1 - coolBlend) +
            morphColors[i3 + 1] * coolBlend) *
            colorI,
          (brainColors[i3 + 2] * (1 - coolBlend) +
            morphColors[i3 + 2] * coolBlend) *
            colorI
        );
        mesh.setColorAt(i, colorTmp);
      }
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (needColor && mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    const glowMesh = glowRef.current;
    const doGlow =
      enableGlowBase && perf.allowGlow && glowMesh && glowIndices.length;
    if (doGlow) {
      const gCount = Math.min(
        glowIndices.length,
        Math.floor(glowIndices.length * perf.density)
      );
      glowMesh.count = gCount;
      for (let g = 0; g < gCount; g++) {
        const i = glowIndices[g];
        if (i >= n) continue;
        const i3 = i * 3;
        dummy.position.set(prev[i3], prev[i3 + 1], prev[i3 + 2]);
        dummy.scale.setScalar(scales[i] * (1.4 + glows[i] * 0.3) * sizeMul);
        dummy.rotation.set(t * 0.012 + seeds[i], t * 0.008, seeds[i]);
        dummy.updateMatrix();
        glowMesh.setMatrixAt(g, dummy.matrix);
      }
      glowMesh.instanceMatrix.needsUpdate = true;
      glowMesh.visible = true;
    } else if (glowMesh) {
      glowMesh.visible = false;
    }

    if (groupRef.current) {
      groupRef.current.rotation.y = t * s.rotation + morph * 0.04;
      groupRef.current.rotation.x = Math.sin(t * 0.06) * 0.012 + morph * 0.008;
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh
        ref={meshRef}
        args={[geometry, material, maxCount]}
        frustumCulled={false}
      />
      {enableGlowBase && glowMaterial ? (
        <instancedMesh
          ref={glowRef}
          args={[geometry, glowMaterial, Math.max(glowMax, 1)]}
          frustumCulled={false}
          renderOrder={1}
        />
      ) : null}
    </group>
  );
}
