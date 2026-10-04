import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

const COLORS = [
  new THREE.Color('#f5d76e'),
  new THREE.Color('#9b59b6'),
  new THREE.Color('#5dade2'),
  new THREE.Color('#e84393'),
  new THREE.Color('#1abc9c'),
  new THREE.Color('#ffffff'),
];

/**
 * Sparse background triangles — never morph, always drift.
 */
export default function AmbientParticles({ count = 600 }) {
  const meshRef = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const { bases, drifts, spins, scales, colors } = useMemo(() => {
    const bases = new Float32Array(count * 3);
    const drifts = new Float32Array(count * 3);
    const spins = new Float32Array(count);
    const scales = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const t = i / count;
      const incl = Math.acos(1 - 2 * t);
      const az = Math.PI * 2 * 1.618 * i;
      const R = 2.4 + (i % 9) * 0.35;
      bases[i * 3] = Math.sin(incl) * Math.cos(az) * R;
      bases[i * 3 + 1] = Math.cos(incl) * R * 0.7;
      bases[i * 3 + 2] = Math.sin(incl) * Math.sin(az) * R;

      drifts[i * 3] = (Math.sin(i * 0.4) * 0.5) * 0.08;
      drifts[i * 3 + 1] = (Math.cos(i * 0.55) * 0.5) * 0.06;
      drifts[i * 3 + 2] = (Math.sin(i * 0.7) * 0.5) * 0.08;
      spins[i] = (Math.sin(i) * 0.5) * 0.25;
      scales[i] = 0.012 + (i % 5) * 0.004;

      const c = COLORS[i % COLORS.length];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    return { bases, drifts, spins, scales, colors };
  }, [count]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const s = 1;
    geo.setAttribute(
      'position',
      new THREE.BufferAttribute(
        new Float32Array([
          0, s * 1.15, 0,
          -s, -s * 0.65, 0,
          s, -s * 0.65, 0,
        ]),
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
        opacity: 0.45,
        depthWrite: false,
        wireframe: true,
        side: THREE.DoubleSide,
      }),
    []
  );

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      let x = bases[i * 3] + drifts[i * 3] * t * 0.2;
      let y =
        bases[i * 3 + 1] +
        drifts[i * 3 + 1] * t * 0.2 +
        Math.sin(t * 0.2 + i) * 0.07;
      let z = bases[i * 3 + 2] + drifts[i * 3 + 2] * t * 0.2;

      x = ((x + 5) % 10) - 5;
      y = ((y + 3.5) % 7) - 3.5;
      z = ((z + 5) % 10) - 5;

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(scales[i]);
      dummy.rotation.z = t * spins[i] + i;
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      if (mesh.instanceColor) {
        mesh.setColorAt(
          i,
          new THREE.Color(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2])
        );
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
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
