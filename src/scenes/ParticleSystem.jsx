import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { buildMorphTargets } from './shapes.js';
import { buildColorBuffers } from './colorField.js';
import { getTriangleGeometry } from './sharedGeometry.js';
import { getDeviceProfile } from '../hooks/useResponsive.js';
import { sceneState } from '../lib/sceneState.js';
import { activeCount, sampleFrame } from '../lib/perf.js';
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
 * Solid filled multi-hue triangles — must always paint something visible.
 */
export default function ParticleSystem({ reducedMotion = false }) {
  const meshRef = useRef(null);
  const groupRef = useRef(null);
  const lastMorph = useRef(-1);
  const lastColorMorph = useRef(-1);
  const frameSkip = useRef(0);
  const prevPos = useRef(null);
  const liveCount = useRef(0);
  const ready = useRef(false);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorTmp = useMemo(() => new THREE.Color(), []);

  const profile = useMemo(() => getDeviceProfile(), []);
  const triangleScale = profile.triangleScale ?? 1.35;
  const isMobile = !!profile.isMobile;

  const maxCount = useMemo(() => {
    if (profile.isMobile) return 6000;
    if (profile.isTablet) return 14000;
    return 22000;
  }, [profile]);

  const { targets, scales, seeds, brainColors, morphColors } = useMemo(() => {
    const targets = buildMorphTargets(maxCount);
    const scales = new Float32Array(maxCount);
    const seeds = new Float32Array(maxCount);
    const brain = targets[0];
    const brainBuf = buildColorBuffers(brain, maxCount);
    const morphSrc = targets[3] || targets[0];
    const morphBuf = buildColorBuffers(morphSrc, maxCount);

    for (let i = 0; i < maxCount; i++) {
      seeds[i] = hash01(i);
      // Readable solid faces
      scales[i] = (0.032 + seeds[i] * 0.028) * triangleScale;
    }

    return {
      targets,
      scales,
      seeds,
      brainColors: brainBuf.colors,
      morphColors: morphBuf.colors,
    };
  }, [maxCount, triangleScale]);

  const count = maxCount;
  const geometry = useMemo(() => getTriangleGeometry(), []);

  // Material via R3F props — more reliable than external MeshBasicMaterial
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        vertexColors: true,
        wireframe: false,
        transparent: true,
        opacity: 0.92,
        depthWrite: true,
        depthTest: true,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    []
  );

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || !targets?.[0]) return;

    const pos = targets[0];
    prevPos.current = new Float32Array(count * 3);
    prevPos.current.set(pos);
    liveCount.current = count;

    for (let i = 0; i < count; i++) {
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

    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
    ready.current = true;
  }, [count, targets, scales, seeds, brainColors, dummy, colorTmp]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh || !ready.current) return;

    sampleFrame(clock.elapsedTime * 1000, isMobile);

    const t = clock.elapsedTime;
    const s = sceneState;
    const morph = reducedMotion ? 0 : s.morph ?? 0;
    const morphDelta = Math.abs(morph - lastMorph.current);
    const isMorphing = morphDelta > 0.0002;
    lastMorph.current = morph;

    const nextLive = Math.min(count, activeCount(count));
    if (nextLive !== liveCount.current) {
      liveCount.current = nextLive;
      mesh.count = nextLive;
    }
    const n = liveCount.current;

    if (mesh.material) {
      mesh.material.opacity = 0.92 * (s.colorIntensity ?? 1);
    }

    // Idle spin + light matrix refresh
    if (!isMorphing) {
      frameSkip.current += 1;
      if (!reducedMotion && groupRef.current) {
        groupRef.current.rotation.y = t * (s.rotation ?? 0.03);
        groupRef.current.rotation.x = Math.sin(t * 0.06) * 0.012;
      }

      if (frameSkip.current % (isMobile ? 4 : 2) === 0 && prevPos.current) {
        const prev = prevPos.current;
        const px = interaction.smoothX ?? 0;
        const py = interaction.smoothY ?? 0;
        for (let i = 0; i < n; i++) {
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
          dummy.scale.setScalar(scales[i] * (s.particleSize ?? 1));
          dummy.rotation.set(
            seeds[i] * 2.1,
            seeds[i] * 3.4 + t * 0.01 * seed,
            seeds[i] * Math.PI * 2
          );
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
      }
      return;
    }

    if (reducedMotion || targets.length < 2) return;

    const stateF = Math.min(targets.length - 1.001, Math.max(0, morph));
    const i0 = Math.floor(stateF);
    const i1 = Math.min(targets.length - 1, i0 + 1);
    const localT = stateF - i0;
    const posA = targets[i0];
    const posB = targets[i1];
    if (!posA || !posB) return;

    const mid = 1 - Math.abs(localT - 0.5) * 2;
    const scatter = (s.distortion ?? 0) * 0.02 + mid * mid * 0.01;
    const coolBlend = smoothstep(0.5, 2.5, morph);
    const spring = 0.18;
    const lagWindow = 0.1;

    if (!prevPos.current) {
      prevPos.current = new Float32Array(count * 3);
      prevPos.current.set(posA);
    }
    const prev = prevPos.current;
    const needColor = Math.abs(morph - lastColorMorph.current) > 0.012;
    if (needColor) lastColorMorph.current = morph;
    const colorI = s.colorIntensity ?? 1;

    for (let i = 0; i < n; i++) {
      const seed = seeds[i];
      const i3 = i * 3;
      const delayed = smoothstep(
        0,
        1,
        (localT - seed * lagWindow) / (1 - lagWindow)
      );

      let tx = posA[i3] + (posB[i3] - posA[i3]) * delayed;
      let ty = posA[i3 + 1] + (posB[i3 + 1] - posA[i3 + 1]) * delayed;
      let tz = posA[i3 + 2] + (posB[i3 + 2] - posA[i3 + 2]) * delayed;

      if (scatter > 0.002) {
        const amp = scatter * (0.25 + seed * 0.25);
        tx += Math.sin(t * 0.4 + seed * 10) * amp;
        ty += Math.cos(t * 0.3 + seed * 7) * amp * 0.5;
        tz += Math.sin(t * 0.25 + seed * 12) * amp * 0.55;
      }

      const x = prev[i3] + (tx - prev[i3]) * spring;
      const y = prev[i3 + 1] + (ty - prev[i3 + 1]) * spring;
      const z = prev[i3 + 2] + (tz - prev[i3 + 2]) * spring;
      prev[i3] = x;
      prev[i3 + 1] = y;
      prev[i3 + 2] = z;

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(scales[i] * (s.particleSize ?? 1));
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

    if (groupRef.current) {
      groupRef.current.rotation.y = t * (s.rotation ?? 0.03) + morph * 0.04;
      groupRef.current.rotation.x = Math.sin(t * 0.06) * 0.012;
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
