import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import {
  particleFragmentShader,
  particleVertexShader,
} from './particleShaders.js';
import { generateShape, getParticleCount } from './shapes.js';

/** Reference-inspired palette */
const PALETTE = [
  new THREE.Color('#ffffff'),
  new THREE.Color('#f5d76e'), // yellow
  new THREE.Color('#c39bd3'), // light purple
  new THREE.Color('#9b59b6'), // purple
  new THREE.Color('#3498db'), // blue
  new THREE.Color('#1abc9c'), // cyan/teal
  new THREE.Color('#2ecc71'), // green
  new THREE.Color('#e84393'), // magenta
];

function hash01(i) {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Core particle engine — GPU instanced hollow triangles.
 * Morph between shapes via `morphProgress` + `shapeA` / `shapeB` props (later phases).
 */
export default function ParticleSystem({
  shapeA = 'brain',
  shapeB = 'brain',
  morphProgress = 0,
  reducedMotion = false,
}) {
  const meshRef = useRef(null);
  const materialRef = useRef(null);
  const count = useMemo(() => getParticleCount(), []);

  // Tiny triangle geometry (local space; scaled per instance in shader)
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    // Equilateral-ish triangle — wireframe stroke via material.wireframe
    const s = 1;
    geo.setAttribute(
      'position',
      new THREE.BufferAttribute(
        new Float32Array([
          0.0, s * 1.15, 0.0,
          -s, -s * 0.65, 0.0,
          s, -s * 0.65, 0.0,
        ]),
        3
      )
    );
    return geo;
  }, []);

  const material = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      wireframe: true,
      uniforms: {
        uTime: { value: 0 },
        uMorph: { value: 0 },
        uFloatAmp: { value: reducedMotion ? 0 : 0.028 },
      },
    });
    return mat;
  }, [reducedMotion]);

  materialRef.current = material;

  // Build shape buffers + per-particle attributes once
  const { attrs, dummy } = useMemo(() => {
    const posA = generateShape(shapeA, count);
    const posB = generateShape(shapeB, count);

    const aPosA = new Float32Array(count * 3);
    const aPosB = new Float32Array(count * 3);
    const aSeed = new Float32Array(count);
    const aScale = new Float32Array(count);
    const aColor = new Float32Array(count * 3);
    const aOffset = new Float32Array(count);

    aPosA.set(posA);
    aPosB.set(posB);

    for (let i = 0; i < count; i++) {
      const seed = hash01(i);
      aSeed[i] = seed;
      aOffset[i] = hash01(i + 17) * Math.PI * 2;

      // Size variation — mostly tiny
      aScale[i] = 0.006 + seed * 0.01;

      // Color regions by seed bands (not uniform brightness)
      const band = Math.floor(seed * PALETTE.length) % PALETTE.length;
      const col = PALETTE[band].clone();
      // Density: some particles dimmer
      const dim = 0.45 + hash01(i + 99) * 0.55;
      col.multiplyScalar(dim);
      aColor[i * 3] = col.r;
      aColor[i * 3 + 1] = col.g;
      aColor[i * 3 + 2] = col.b;
    }

    return {
      attrs: { aPosA, aPosB, aSeed, aScale, aColor, aOffset },
      dummy: new THREE.Object3D(),
    };
  }, [count, shapeA, shapeB]);

  // Attach instanced attributes after mesh mounts
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const geo = mesh.geometry;
    geo.setAttribute(
      'aPosA',
      new THREE.InstancedBufferAttribute(attrs.aPosA, 3)
    );
    geo.setAttribute(
      'aPosB',
      new THREE.InstancedBufferAttribute(attrs.aPosB, 3)
    );
    geo.setAttribute(
      'aSeed',
      new THREE.InstancedBufferAttribute(attrs.aSeed, 1)
    );
    geo.setAttribute(
      'aScale',
      new THREE.InstancedBufferAttribute(attrs.aScale, 1)
    );
    geo.setAttribute(
      'aColor',
      new THREE.InstancedBufferAttribute(attrs.aColor, 3)
    );
    geo.setAttribute(
      'aOffset',
      new THREE.InstancedBufferAttribute(attrs.aOffset, 1)
    );

    // Identity instance matrices (positions live in attributes)
    for (let i = 0; i < count; i++) {
      dummy.position.set(0, 0, 0);
      dummy.rotation.set(0, 0, hash01(i + 3) * Math.PI * 2);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;
  }, [attrs, count, dummy]);

  // GPU time + morph only — no per-particle JS loop
  useFrame(({ clock }) => {
    const mat = materialRef.current;
    if (!mat) return;
    mat.uniforms.uTime.value = clock.elapsedTime;
    mat.uniforms.uMorph.value = morphProgress;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
    />
  );
}
