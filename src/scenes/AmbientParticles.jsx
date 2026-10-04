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

/** Sparse ambient field — cheap group rotation only. */
export default function AmbientParticles({ count = 120 }) {
  const meshRef = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const data = useMemo(() => {
    const bases = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const colorIdx = new Uint8Array(count);

    for (let i = 0; i < count; i++) {
      const t = i / count;
      const incl = Math.acos(1 - 2 * t);
      const az = Math.PI * 2 * 1.618 * i;
      const R = 3.2 + (i % 7) * 0.35;
      bases[i * 3] = Math.sin(incl) * Math.cos(az) * R;
      bases[i * 3 + 1] = Math.cos(incl) * R * 0.55;
      bases[i * 3 + 2] = Math.sin(incl) * Math.sin(az) * R;
      scales[i] = 0.03 + (i % 4) * 0.012;
      colorIdx[i] = i % COLORS.length;
    }
    return { bases, scales, colorIdx };
  }, [count]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute([0, 1.1, 0, -1, -0.65, 0, 1, -0.65, 0], 3)
    );
    return geo;
  }, []);

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
        wireframe: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    []
  );

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const { bases, scales, colorIdx } = data;

    if (!mesh.instanceColor) {
      mesh.instanceColor = new THREE.InstancedBufferAttribute(
        new Float32Array(count * 3),
        3
      );
    }

    for (let i = 0; i < count; i++) {
      dummy.position.set(bases[i * 3], bases[i * 3 + 1], bases[i * 3 + 2]);
      dummy.scale.setScalar(scales[i]);
      dummy.rotation.z = i * 0.7;
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, COLORS[colorIdx[i]]);
    }
    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
  }, [count, data, dummy]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.rotation.y = clock.elapsedTime * 0.025;
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
