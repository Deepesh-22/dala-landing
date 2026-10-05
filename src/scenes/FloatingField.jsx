import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { colorForFieldParticle } from './colorField.js';

function hash01(i) {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function fieldCount(isMobile, reducedMotion) {
  if (reducedMotion) return 180;
  if (isMobile) return 400;
  return 900;
}

/**
 * Floating triangle field — Phase 5 + 13 color language.
 * Quiet spatial colors, depth-dimmed, never overpower type.
 */
export default function FloatingField({
  reducedMotion = false,
  isMobile = false,
}) {
  const meshRef = useRef(null);
  const groupRef = useRef(null);

  const count = useMemo(
    () => fieldCount(isMobile, reducedMotion),
    [isMobile, reducedMotion]
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorTmp = useMemo(() => new THREE.Color(), []);

  const data = useMemo(() => {
    const base = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const speeds = new Float32Array(count * 3);
    const depths = new Float32Array(count);
    const seeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const seed = hash01(i);
      seeds[i] = seed;

      const sideBias = seed > 0.18 ? 1 : -1;
      const xSpread = sideBias > 0 ? 2.8 : 1.4;
      const x =
        sideBias * (0.4 + hash01(i + 3) * xSpread) +
        (hash01(i + 7) - 0.5) * 0.6;

      const y = (hash01(i + 11) - 0.5) * 3.2;
      const depth = hash01(i + 19);
      depths[i] = depth;
      const z = 1.2 - depth * 5.5;

      base[i * 3] = x;
      base[i * 3 + 1] = y;
      base[i * 3 + 2] = z;

      const nearBoost = 1 - depth;
      const isLarge = seed > 0.92;
      scales[i] = isLarge
        ? 0.08 + seed * 0.1
        : 0.012 + nearBoost * 0.035 + seed * 0.02;

      speeds[i * 3] = (seed - 0.5) * 0.4;
      speeds[i * 3 + 1] = (hash01(i + 29) - 0.5) * 0.3;
      speeds[i * 3 + 2] = (hash01(i + 41) - 0.5) * 0.15;
    }

    return { base, scales, speeds, depths, seeds };
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
        opacity: 0.28,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    []
  );

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

      const c = colorForFieldParticle(
        seeds[i],
        depths[i],
        base[i * 3 + 1]
      );
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
