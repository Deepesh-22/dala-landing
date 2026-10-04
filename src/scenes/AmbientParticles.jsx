import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

const COLORS = [
  new THREE.Color('#f5d76e'),
  new THREE.Color('#9b59b6'),
  new THREE.Color('#5dade2'),
  new THREE.Color('#e84393'),
  new THREE.Color('#1abc9c'),
  new THREE.Color('#ffffff'),
];

export default function AmbientParticles({ count = 200 }) {
  const meshRef = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const data = useMemo(() => {
    const bases = new Float32Array(count * 3);
    const spins = new Float32Array(count);
    const scales = new Float32Array(count);
    const colorIdx = new Uint8Array(count);

    for (let i = 0; i < count; i++) {
      const t = i / count;
      const incl = Math.acos(1 - 2 * t);
      const az = Math.PI * 2 * 1.618 * i;
      const R = 2.6 + (i % 7) * 0.4;
      bases[i * 3] = Math.sin(incl) * Math.cos(az) * R;
      bases[i * 3 + 1] = Math.cos(incl) * R * 0.65;
      bases[i * 3 + 2] = Math.sin(incl) * Math.sin(az) * R;
      spins[i] = (Math.sin(i) * 0.5) * 0.15;
      scales[i] = 0.02 + (i % 4) * 0.008;
      colorIdx[i] = i % COLORS.length;
    }
    return { bases, spins, scales, colorIdx };
  }, [count]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute([0, 1.2, 0, -1, -0.7, 0, 1, -0.7, 0], 3)
    );
    return geo;
  }, []);

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        wireframe: true,
        side: THREE.DoubleSide,
      }),
    []
  );

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const { bases, scales, colorIdx } = data;

    for (let i = 0; i < count; i++) {
      dummy.position.set(bases[i * 3], bases[i * 3 + 1], bases[i * 3 + 2]);
      dummy.scale.setScalar(scales[i]);
      dummy.rotation.z = i * 0.7;
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, COLORS[colorIdx[i]]);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
  }, [count, data, dummy]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    // Slow spin of ambient field only — cheap
    mesh.rotation.y = clock.elapsedTime * 0.03;
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
