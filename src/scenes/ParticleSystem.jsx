import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { sceneState } from '../lib/sceneState.js';

/**
 * Minimal solid-triangle particle system.
 * Goal: ALWAYS paint a visible multi-color brain-shaped form.
 * No heavy morph build on first paint — shapes generated simply.
 */
function hash01(i) {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function makeBrainPositions(count) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const side = i % 2 === 0 ? -1 : 1;
    const phi = Math.acos(1 - 2 * ((i >> 1) / Math.max(1, count / 2)));
    const theta = Math.PI * (1 + Math.sqrt(5)) * (i >> 1);
    let x = Math.sin(phi) * Math.cos(theta);
    let y = Math.cos(phi);
    let z = Math.sin(phi) * Math.sin(theta);
    // hemisphere bias
    x = side * (0.22 + Math.abs(x) * 0.75);
    y = y * 0.65 + 0.05;
    z = z * 0.72;
    // sulcus noise
    const n =
      Math.sin(z * 14 + y * 9) * 0.04 +
      Math.sin(y * 22 - z * 11) * 0.025;
    const r = 1 + n;
    pos[i * 3] = x * r;
    pos[i * 3 + 1] = y * r;
    pos[i * 3 + 2] = z * r;
  }
  // stem
  const stemStart = Math.floor(count * 0.9);
  for (let i = stemStart; i < count; i++) {
    const t = (i - stemStart) / Math.max(1, count - stemStart);
    const a = hash01(i) * Math.PI * 2;
    const rr = 0.1 * (1 - t * 0.3);
    pos[i * 3] = Math.cos(a) * rr;
    pos[i * 3 + 1] = -0.35 - t * 0.5;
    pos[i * 3 + 2] = Math.sin(a) * rr * 0.3;
  }
  return pos;
}

function makeBulbPositions(count) {
  const pos = new Float32Array(count * 3);
  const glass = Math.floor(count * 0.55);
  for (let i = 0; i < glass; i++) {
    const t = i / glass;
    const phi = Math.acos(1 - 2 * t);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    let y = Math.cos(phi);
    if (y < -0.1) y = -0.1 + (y + 0.1) * 0.15;
    pos[i * 3] = Math.sin(phi) * Math.cos(theta) * 0.65;
    pos[i * 3 + 1] = y * 0.75 + 0.55;
    pos[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * 0.65;
  }
  for (let i = glass; i < count; i++) {
    const t = (i - glass) / Math.max(1, count - glass);
    const a = t * Math.PI * 2 * 4;
    const radius = 0.24 * (1 - t * 0.5) + 0.08;
    pos[i * 3] = Math.cos(a) * radius;
    pos[i * 3 + 1] = 0.1 - t * 0.85;
    pos[i * 3 + 2] = Math.sin(a) * radius;
  }
  return pos;
}

function colorFor(x, y, z, seed) {
  const r = Math.sqrt(x * x + y * y + z * z);
  // yellow rim, multi-hue interior
  if (r > 0.85) {
    return seed > 0.85
      ? [0.95, 0.95, 0.9]
      : seed > 0.2
        ? [0.96, 0.77, 0.0]
        : [0.91, 0.66, 0.13];
  }
  if (r < 0.35) {
    return seed > 0.5 ? [0.36, 0.13, 0.71] : [0.39, 0.4, 0.95];
  }
  if (seed > 0.82) return [0.95, 0.94, 1.0];
  if (seed > 0.68) return [0.96, 0.77, 0.0];
  if (seed > 0.52) return [0.55, 0.36, 0.96];
  if (seed > 0.38) return [0.93, 0.28, 0.6];
  if (seed > 0.24) return [0.02, 0.71, 0.83];
  if (seed > 0.12) return [0.13, 0.77, 0.37];
  return [0.65, 0.55, 0.98];
}

export default function ParticleSystem({ reducedMotion = false }) {
  const meshRef = useRef(null);
  const groupRef = useRef(null);
  const ready = useRef(false);
  const prev = useRef(null);
  const lastMorph = useRef(0);

  const COUNT = 12000;

  const { brain, bulb, scales, seeds } = useMemo(() => {
    const brain = makeBrainPositions(COUNT);
    const bulb = makeBulbPositions(COUNT);
    const scales = new Float32Array(COUNT);
    const seeds = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      seeds[i] = hash01(i);
      scales[i] = 0.04 + seeds[i] * 0.035; // clearly visible faces
    }
    return { brain, bulb, scales, seeds };
  }, []);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        [0, 0.9, 0, -0.78, -0.45, 0, 0.78, -0.45, 0],
        3
      )
    );
    g.setIndex([0, 1, 2]);
    g.computeVertexNormals();
    return g;
  }, []);

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        vertexColors: true,
        wireframe: false,
        transparent: true,
        opacity: 0.95,
        depthWrite: true,
        depthTest: true,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    []
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorTmp = useMemo(() => new THREE.Color(), []);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    prev.current = new Float32Array(brain);

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      dummy.position.set(brain[i3], brain[i3 + 1], brain[i3 + 2]);
      dummy.scale.setScalar(scales[i]);
      dummy.rotation.set(
        seeds[i] * 6.28,
        hash01(i + 2) * 6.28,
        hash01(i + 3) * 6.28
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      const [r, g, b] = colorFor(
        brain[i3],
        brain[i3 + 1],
        brain[i3 + 2],
        seeds[i]
      );
      colorTmp.setRGB(r, g, b);
      mesh.setColorAt(i, colorTmp);
    }

    mesh.count = COUNT;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
    ready.current = true;
  }, [brain, scales, seeds, dummy, colorTmp, geometry, material]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh || !ready.current || !prev.current) return;

    const t = clock.elapsedTime;
    const morph = reducedMotion ? 0 : Math.min(1, Math.max(0, sceneState.morph ?? 0));
    // Map morph 0..5 → 0..1 blend brain→bulb for simplicity
    const blend = Math.min(1, Math.max(0, morph / 3));

    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.04;
      groupRef.current.rotation.x = Math.sin(t * 0.05) * 0.02;
    }

    const morphing = Math.abs(blend - lastMorph.current) > 0.001;
    lastMorph.current = blend;

    // Always update a bit so GPU stays warm and visible
    const step = morphing ? 1 : 2;
    for (let i = 0; i < COUNT; i += step) {
      const i3 = i * 3;
      const seed = seeds[i];
      const tx = brain[i3] + (bulb[i3] - brain[i3]) * blend;
      const ty = brain[i3 + 1] + (bulb[i3 + 1] - brain[i3 + 1]) * blend;
      const tz = brain[i3 + 2] + (bulb[i3 + 2] - brain[i3 + 2]) * blend;

      const x = prev.current[i3] + (tx - prev.current[i3]) * 0.15;
      const y = prev.current[i3 + 1] + (ty - prev.current[i3 + 1]) * 0.15;
      const z = prev.current[i3 + 2] + (tz - prev.current[i3 + 2]) * 0.15;
      prev.current[i3] = x;
      prev.current[i3 + 1] = y;
      prev.current[i3 + 2] = z;

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(scales[i]);
      dummy.rotation.set(seed * 2, seed * 3 + t * 0.02, seed * 6.28);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      <instancedMesh
        ref={meshRef}
        args={[geometry, material, COUNT]}
        frustumCulled={false}
      />
    </group>
  );
}
