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

export default function AmbientParticles({ count = 500 }) {
  const meshRef = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorTmp = useMemo(() => new THREE.Color(), []);

  const data = useMemo(() => {
    const bases = new Float32Array(count * 3);
    const drifts = new Float32Array(count * 3);
    const spins = new Float32Array(count);
    const scales = new Float32Array(count);
    const colorIdx = new Uint8Array(count);

    for (let i = 0; i < count; i++) {
      const t = i / count;
      const incl = Math.acos(1 - 2 * t);
      const az = Math.PI * 2 * 1.618 * i;
      const R = 2.5 + (i % 9) * 0.35;
      bases[i * 3] = Math.sin(incl) * Math.cos(az) * R;
      bases[i * 3 + 1] = Math.cos(incl) * R * 0.7;
      bases[i * 3 + 2] = Math.sin(incl) * Math.sin(az) * R;
      drifts[i * 3] = Math.sin(i * 0.4) * 0.04;
      drifts[i * 3 + 1] = Math.cos(i * 0.55) * 0.03;
      drifts[i * 3 + 2] = Math.sin(i * 0.7) * 0.04;
      spins[i] = Math.sin(i) * 0.12;
      scales[i] = 0.018 + (i % 5) * 0.006;
      colorIdx[i] = i % COLORS.length;
    }
    return { bases, drifts, spins, scales, colorIdx };
  }, [count]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const s = 1;
    geo.setAttribute(
      'position',
      new THREE.BufferAttribute(
        new Float32Array([0, s * 1.2, 0, -s, -s * 0.7, 0, s, -s * 0.7, 0]),
        3
      )
    );
    return geo;
  }, []);

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.5,
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
      dummy.rotation.z = i;
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
    const t = clock.elapsedTime;
    const { bases, drifts, spins, scales } = data;

    for (let i = 0; i < count; i++) {
      let x = bases[i * 3] + drifts[i * 3] * t;
      let y =
        bases[i * 3 + 1] + drifts[i * 3 + 1] * t + Math.sin(t * 0.2 + i) * 0.06;
      let z = bases[i * 3 + 2] + drifts[i * 3 + 2] * t;

      x = ((x + 5) % 10) - 5;
      y = ((y + 3.5) % 7) - 3.5;
      z = ((z + 5) % 10) - 5;

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(scales[i]);
      dummy.rotation.z = t * spins[i] + i;
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
