import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { buildMorphTargets } from './shapes.js';
import { buildColorBuffers } from './colorField.js';
import { getParticleBudget } from '../hooks/useResponsive.js';
import { sceneState } from '../lib/sceneState.js';

function hash01(i) {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function smoothstep(e0, e1, x) {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/**
 * Particle system — spatial color fields + soft additive glow (Phase 13).
 */
export default function ParticleSystem({ reducedMotion = false }) {
  const meshRef = useRef(null);
  const glowRef = useRef(null);
  const groupRef = useRef(null);
  const lastMorph = useRef(-1);
  const frameSkip = useRef(0);
  const prevPos = useRef(null);

  const count = useMemo(() => {
    try {
      return Math.min(getParticleBudget(), 28000);
    } catch {
      return 22000;
    }
  }, []);

  // Glow layer: only brightest particles (~12%)
  const glowCount = useMemo(
    () => Math.min(Math.floor(count * 0.12), 3200),
    [count]
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorTmp = useMemo(() => new THREE.Color(), []);

  const { targets, scales, seeds, brainColors, morphColors, opacities, glows, glowIndices } =
    useMemo(() => {
      const targets = buildMorphTargets(count);
      const scales = new Float32Array(count);
      const seeds = new Float32Array(count);
      const brain = targets[0];

      const brainBuf = buildColorBuffers(brain, count);
      // Morph colors: spatial field sampled from abstract / mid shapes so transitions stay coherent
      const morphSrc = targets[2] || targets[1] || brain;
      const morphBuf = buildColorBuffers(morphSrc, count);

      for (let i = 0; i < count; i++) {
        seeds[i] = hash01(i);
        scales[i] = 0.016 + seeds[i] * 0.02;
      }

      // Indices of particles that glow, sorted by glow strength
      const ranked = [];
      for (let i = 0; i < count; i++) {
        if (brainBuf.glows[i] > 0.2) ranked.push(i);
      }
      ranked.sort((a, b) => brainBuf.glows[b] - brainBuf.glows[a]);
      const glowIndices = ranked.slice(0, glowCount);

      return {
        targets,
        scales,
        seeds,
        brainColors: brainBuf.colors,
        morphColors: morphBuf.colors,
        opacities: brainBuf.opacities,
        glows: brainBuf.glows,
        glowIndices,
      };
    }, [count, glowCount]);

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

  // Main triangles — wireframe, deep black stays pure (no scene bloom)
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

  // Soft additive glow — larger, low opacity, only bright cores
  const glowMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
        depthTest: true,
        side: THREE.DoubleSide,
        toneMapped: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const pos = targets[0];

    prevPos.current = new Float32Array(count * 3);
    prevPos.current.set(pos);

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

    // Glow layer
    const glowMesh = glowRef.current;
    if (glowMesh && glowIndices.length) {
      for (let g = 0; g < glowIndices.length; g++) {
        const i = glowIndices[g];
        dummy.position.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
        dummy.scale.setScalar(scales[i] * (2.2 + glows[i] * 1.4));
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
    count,
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

    const t = clock.elapsedTime;
    const s = sceneState;
    const morph = reducedMotion ? 0 : s.morph;
    const morphDelta = Math.abs(morph - lastMorph.current);
    const isMorphing = morphDelta > 0.00015;
    lastMorph.current = morph;

    frameSkip.current += 1;

    if (!isMorphing && !reducedMotion && frameSkip.current % 3 !== 0) {
      return;
    }

    const updateGlow = (getPos) => {
      const glowMesh = glowRef.current;
      if (!glowMesh || !glowIndices.length) return;
      for (let g = 0; g < glowIndices.length; g++) {
        const i = glowIndices[g];
        const [x, y, z] = getPos(i);
        dummy.position.set(x, y, z);
        dummy.scale.setScalar(
          scales[i] * (2.1 + glows[i] * 1.3) * s.particleSize
        );
        dummy.rotation.set(
          t * 0.04 + seeds[i],
          t * 0.03 + seeds[i] * 2,
          seeds[i] * Math.PI
        );
        dummy.updateMatrix();
        glowMesh.setMatrixAt(g, dummy.matrix);
      }
      glowMesh.instanceMatrix.needsUpdate = true;
    };

    if (!isMorphing && !reducedMotion) {
      if (groupRef.current) {
        groupRef.current.rotation.y = t * s.rotation;
        groupRef.current.rotation.x = Math.sin(t * 0.1) * 0.025;
        groupRef.current.scale.setScalar(1 + Math.sin(t * 0.35) * 0.006);
      }

      const prev = prevPos.current;
      if (!prev) return;

      // Material opacity responds to global intensity, stays restrained
      if (mesh.material) {
        mesh.material.opacity = 0.82 * s.colorIntensity;
      }

      for (let i = 0; i < count; i++) {
        const seed = seeds[i];
        const i3 = i * 3;
        let x = prev[i3];
        let y = prev[i3 + 1];
        let z = prev[i3 + 2];

        x += Math.sin(t * 0.45 + seed * 6) * 0.006 * (seed - 0.5);
        y += Math.cos(t * 0.38 + seed * 4) * 0.005;

        dummy.position.set(x, y, z);
        dummy.scale.setScalar(scales[i] * s.particleSize);
        dummy.rotation.set(
          t * 0.06 + seed * 2.1,
          t * 0.04 + seed * 3.4,
          seed * Math.PI * 2
        );
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;

      updateGlow((i) => {
        const i3 = i * 3;
        return [
          prev[i3] + Math.sin(t * 0.45 + seeds[i] * 6) * 0.004,
          prev[i3 + 1],
          prev[i3 + 2],
        ];
      });
      return;
    }

    if (reducedMotion && !isMorphing) return;

    // ── Morphing ───────────────────────────────────────────────
    const stateF = Math.min(4.999, Math.max(0, morph));
    const i0 = Math.floor(stateF);
    const i1 = Math.min(5, i0 + 1);
    const localT = stateF - i0;

    const posA = targets[i0];
    const posB = targets[i1];

    const mid = 1 - Math.abs(localT - 0.5) * 2;
    const scatter = s.distortion * 0.08 + mid * mid * 0.055;
    const coolBlend = smoothstep(0.4, 2.2, morph);
    const sizeMul = s.particleSize;
    const colorI = s.colorIntensity;

    const spring = 0.14;

    if (!prevPos.current) {
      prevPos.current = new Float32Array(count * 3);
      prevPos.current.set(posA);
    }
    const prev = prevPos.current;
    const lagWindow = 0.16;

    if (mesh.material) {
      mesh.material.opacity = (0.78 + mid * 0.08) * colorI;
    }

    for (let i = 0; i < count; i++) {
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

      if (!reducedMotion && scatter > 0.004) {
        const n1 = Math.sin(t * 0.7 + seed * 12.0 + ax * 2.5);
        const n2 = Math.cos(t * 0.55 + seed * 8.0 + ay * 3.0);
        const n3 = Math.sin(t * 0.4 + seed * 15.0 + az * 2.2);
        const amp = scatter * (0.55 + seed * 0.55);
        tx += n1 * amp;
        ty += n2 * amp * 0.8;
        tz += n3 * amp * 0.85;
      }

      const x = prev[i3] + (tx - prev[i3]) * spring;
      const y = prev[i3 + 1] + (ty - prev[i3 + 1]) * spring;
      const z = prev[i3 + 2] + (tz - prev[i3 + 2]) * spring;

      prev[i3] = x;
      prev[i3 + 1] = y;
      prev[i3 + 2] = z;

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(scales[i] * sizeMul * (1 + mid * 0.06 * seed));

      const rotAmp = 0.12 + mid * 0.28;
      dummy.rotation.set(
        t * 0.07 * rotAmp + seed * 2.1,
        t * 0.05 * rotAmp + seed * 3.4,
        seed * Math.PI * 2
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      // Spatial colors blend brain → morph field
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

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    updateGlow((i) => {
      const i3 = i * 3;
      return [prev[i3], prev[i3 + 1], prev[i3 + 2]];
    });

    if (groupRef.current && !reducedMotion) {
      groupRef.current.rotation.y = t * s.rotation + morph * 0.1;
      groupRef.current.rotation.x =
        Math.sin(t * 0.1) * 0.025 + morph * 0.02;
      const breath = 1 + Math.sin(t * 0.35) * 0.006 + mid * 0.02;
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
      {/* Soft emissive halo — additive, sparse, never neon */}
      <instancedMesh
        ref={glowRef}
        args={[geometry, glowMaterial, Math.max(glowCount, 1)]}
        frustumCulled={false}
        renderOrder={1}
      />
    </group>
  );
}
