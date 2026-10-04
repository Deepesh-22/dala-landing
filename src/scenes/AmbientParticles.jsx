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

export default function AmbientParticles({ count = 80 }) {
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
      const R = 3.4 + (i % 7) * 0.4;
      bases[i * 3] = Math.sin(incl) * Math.cos(az) * R;
      bases[i * 3 + 1] = Math.cos(incl) * R * 0.5;
      bases[i * 3 + 2] = Math.sin(incl) * Math.sin(az) * R;
      scales[i] = 0.035 + (i % 5) * 0.012;
      colorIdx[i] = i % COLORS.length;
    }
    return { bases, scales, colorIdx };
  }, [count]);

  const tri = useMemo(
    () => new Float32Array([0, 1.1, 0, -1, -0.65, 0, 1, -0.65, 0]),
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
    if (!meshRef.current) return;
    meshRef.current.rotation.y = clock.elapsedTime * 0.02;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false} renderOrder={-1}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[tri, 3]} />
      </bufferGeometry>
      <meshBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.5}
        depthWrite={false}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
