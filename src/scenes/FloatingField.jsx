import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { colorForFieldParticle } from './colorField.js';
import { getTriangleGeometry } from './sharedGeometry.js';

function hash01(i) {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export default function FloatingField({ reducedMotion = false, isMobile = false }) {
  const meshRef = useRef(null);
  const frame = useRef(0);

  const count = reducedMotion ? 40 : isMobile ? 150 : 500;
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
      const side = seed > 0.12 ? 1 : -1;
      base[i * 3] = side * (0.7 + hash01(i + 3) * (side > 0 ? 2.8 : 0.8));
      base[i * 3 + 1] = (hash01(i + 11) - 0.5) * 3.2;
      const depth = hash01(i + 19);
      depths[i] = depth;
      base[i * 3 + 2] = 1.0 - depth * 4.5;
      scales[i] =
        seed > 0.85
          ? 0.06 + seed * 0.04
          : seed > 0.4
            ? 0.028 + seed * 0.02
            : 0.016 + seed * 0.012;
      speeds[i * 3] = (seed - 0.5) * 0.06;
      speeds[i * 3 + 1] = (hash01(i + 29) - 0.5) * 0.05;
      speeds[i * 3 + 2] = (hash01(i + 41) - 0.5) * 0.03;
    }
    return { base, scales, speeds, depths, seeds };
  }, [count]);

  const geometry = useMemo(() => getTriangleGeometry(), []);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        vertexColors: true,
        wireframe: false,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        depthTest: true,
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
      dummy.rotation.set(seeds[i] * Math.PI, hash01(i + 5) * 6, hash01(i + 9) * 6);
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
    frame.current += 1;
    if (frame.current % (isMobile ? 4 : 3) !== 0) return;
    const { base, scales, speeds, seeds } = data;
    for (let i = 0; i < count; i++) {
      const seed = seeds[i];
      dummy.position.set(
        base[i * 3] + Math.sin(t * 0.05 + seed * 6) * 0.05,
        base[i * 3 + 1] + Math.cos(t * 0.04 + seed * 4) * 0.035,
        base[i * 3 + 2] + Math.sin(t * 0.03 + seed * 8) * 0.08
      );
      dummy.scale.setScalar(scales[i]);
      dummy.rotation.set(
        t * speeds[i * 3] * 0.3 + seed * 3,
        t * speeds[i * 3 + 1] * 0.25 + seed * 5,
        seed
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
      renderOrder={-1}
    />
  );
}
