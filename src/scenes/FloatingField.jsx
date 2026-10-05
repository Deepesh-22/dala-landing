import { useFrame } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { colorForFieldParticle } from './colorField.js';
import { getTriangleGeometry } from './sharedGeometry.js';
import { createParticleBasicMaterial, tickMaterialTime } from './particleMaterial.js';

function hash01(i) {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Fidelity: denser ambient field on desktop */
function fieldCount(isMobile, reducedMotion) {
  if (reducedMotion) return 120;
  if (isMobile) return 320;
  return 1100;
}

export default function FloatingField({
  reducedMotion = false,
  isMobile = false,
}) {
  const meshRef = useRef(null);
  const groupRef = useRef(null);
  const frame = useRef(0);

  const count = useMemo(
    () => fieldCount(isMobile, reducedMotion),
    [isMobile, reducedMotion]
  );

  const dummy = useRef(new THREE.Object3D()).current;
  const colorTmp = useRef(new THREE.Color()).current;

  const data = useMemo(() => {
    const base = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const speeds = new Float32Array(count * 3);
    const depths = new Float32Array(count);
    const seeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const seed = hash01(i);
      seeds[i] = seed;

      // Bias right + edges — leave left for type
      const sideBias = seed > 0.14 ? 1 : -1;
      const xSpread = sideBias > 0 ? 3.0 : 1.3;
      const x =
        sideBias * (0.35 + hash01(i + 3) * xSpread) +
        (hash01(i + 7) - 0.5) * 0.5;

      const y = (hash01(i + 11) - 0.5) * 3.4;
      const depth = hash01(i + 19);
      depths[i] = depth;
      const z = 1.4 - depth * 5.8;

      base[i * 3] = x;
      base[i * 3 + 1] = y;
      base[i * 3 + 2] = z;

      const nearBoost = 1 - depth;
      const isLarge = seed > 0.93;
      scales[i] = isLarge
        ? 0.07 + seed * 0.08
        : 0.01 + nearBoost * 0.03 + seed * 0.016;

      speeds[i * 3] = (seed - 0.5) * 0.35;
      speeds[i * 3 + 1] = (hash01(i + 29) - 0.5) * 0.28;
      speeds[i * 3 + 2] = (hash01(i + 41) - 0.5) * 0.14;
    }

    return { base, scales, speeds, depths, seeds };
  }, [count]);

  const geometry = useMemo(() => getTriangleGeometry(), []);
  const material = useMemo(
    () => createParticleBasicMaterial({ opacity: 0.32 }),
    []
  );

  useEffect(() => () => material.dispose(), [material]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const { base, scales, depths, seeds } = data;

    for (let i = 0; i < count; i++) {
      dummy.position.set(base[i * 3], base[i * 3 + 1], base[i * 3 + 2]);
      dummy.scale.setScalar(scales[i]);
      dummy.rotation.set(
        seeds[i] * Math.PI,
        hash01(i + 5) * Math.PI * 2,
        hash01(i + 9) * Math.PI * 2
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      const c = colorForFieldParticle(seeds[i], depths[i], base[i * 3 + 1]);
      colorTmp.setRGB(c.r, c.g, c.b);
      mesh.setColorAt(i, colorTmp);
    }

    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
  }, [count, data, dummy, colorTmp]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh || reducedMotion) return;

    const t = clock.elapsedTime;
    tickMaterialTime(material, t, 0.035);

    frame.current += 1;
    const skip = isMobile ? 3 : 2;
    if (frame.current % skip !== 0) {
      if (groupRef.current) {
        groupRef.current.position.x = Math.sin(t * 0.04) * 0.08;
        groupRef.current.position.y = Math.cos(t * 0.05) * 0.05;
      }
      return;
    }

    const { base, scales, speeds, seeds } = data;

    for (let i = 0; i < count; i++) {
      const seed = seeds[i];
      const sx = speeds[i * 3];
      const sy = speeds[i * 3 + 1];
      const sz = speeds[i * 3 + 2];

      const px =
        base[i * 3] +
        Math.sin(t * (0.15 + seed * 0.2) + seed * 6) * 0.12;
      const py =
        base[i * 3 + 1] +
        Math.cos(t * (0.12 + seed * 0.18) + seed * 4) * 0.1;
      const pz =
        base[i * 3 + 2] +
        Math.sin(t * (0.08 + seed * 0.12) + seed * 8) *
          0.35 *
          Math.sign(sz || 1);

      dummy.position.set(px, py, pz);
      dummy.scale.setScalar(scales[i]);
      dummy.rotation.set(
        t * sx + seed * 3,
        t * sy + seed * 5,
        t * 0.2 * sx + seed
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;

    if (groupRef.current) {
      groupRef.current.position.x = Math.sin(t * 0.04) * 0.08;
      groupRef.current.position.y = Math.cos(t * 0.05) * 0.05;
    }
  });

  return (
    <group ref={groupRef} renderOrder={-1}>
      <instancedMesh
        ref={meshRef}
        args={[geometry, material, count]}
        frustumCulled={false}
        renderOrder={-1}
      />
    </group>
  );
}
