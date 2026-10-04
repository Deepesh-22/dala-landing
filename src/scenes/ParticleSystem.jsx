import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import {
  particleFragmentShader,
  particleVertexShader,
} from './particleShaders.js';
import { generateShape, getParticleCount } from './shapes.js';

/** Outer rim golds → mid magentas/purples → cool core */
const RIM = [
  new THREE.Color('#f5d76e'),
  new THREE.Color('#f0c75e'),
  new THREE.Color('#e8b84a'),
  new THREE.Color('#ffeaa7'),
];
const MID = [
  new THREE.Color('#e84393'),
  new THREE.Color('#c39bd3'),
  new THREE.Color('#9b59b6'),
  new THREE.Color('#a55eea'),
  new THREE.Color('#fd79a8'),
];
const CORE = [
  new THREE.Color('#6c5ce7'),
  new THREE.Color('#5dade2'),
  new THREE.Color('#1abc9c'),
  new THREE.Color('#74b9ff'),
  new THREE.Color('#a29bfe'),
];

function hash01(i) {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function pick(arr, t) {
  return arr[Math.floor(t * arr.length) % arr.length];
}

export default function ParticleSystem({
  shapeA = 'brain',
  shapeB = 'brain',
  morphProgress = 0,
  reducedMotion = false,
}) {
  const meshRef = useRef(null);
  const materialRef = useRef(null);
  const count = useMemo(() => getParticleCount(), []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
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
    return new THREE.ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.NormalBlending,
      wireframe: true,
      uniforms: {
        uTime: { value: 0 },
        uMorph: { value: 0 },
        uFloatAmp: { value: reducedMotion ? 0 : 0.018 },
      },
    });
  }, [reducedMotion]);

  materialRef.current = material;

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

    // Approximate radial extent for rim/core mapping
    let maxR = 0.001;
    for (let i = 0; i < count; i++) {
      const x = posA[i * 3];
      const y = posA[i * 3 + 1];
      const z = posA[i * 3 + 2];
      maxR = Math.max(maxR, Math.sqrt(x * x + y * y + z * z));
    }

    for (let i = 0; i < count; i++) {
      const seed = hash01(i);
      aSeed[i] = seed;
      aOffset[i] = hash01(i + 17) * Math.PI * 2;

      // Reference: small but visible hollow triangles
      aScale[i] = 0.0055 + seed * 0.008;

      const x = posA[i * 3];
      const y = posA[i * 3 + 1];
      const z = posA[i * 3 + 2];
      const r = Math.sqrt(x * x + y * y + z * z) / maxR;

      // Rim = gold, mid = magenta/purple, core = cool blue/violet
      let col;
      if (r > 0.72) {
        col = pick(RIM, seed).clone();
      } else if (r > 0.4) {
        col = pick(MID, seed).clone();
      } else {
        col = pick(CORE, seed).clone();
      }

      // Slight dimming variance
      const dim = 0.65 + hash01(i + 99) * 0.35;
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

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const geo = mesh.geometry;
    geo.setAttribute('aPosA', new THREE.InstancedBufferAttribute(attrs.aPosA, 3));
    geo.setAttribute('aPosB', new THREE.InstancedBufferAttribute(attrs.aPosB, 3));
    geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(attrs.aSeed, 1));
    geo.setAttribute('aScale', new THREE.InstancedBufferAttribute(attrs.aScale, 1));
    geo.setAttribute('aColor', new THREE.InstancedBufferAttribute(attrs.aColor, 3));
    geo.setAttribute(
      'aOffset',
      new THREE.InstancedBufferAttribute(attrs.aOffset, 1)
    );

    for (let i = 0; i < count; i++) {
      dummy.position.set(0, 0, 0);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;
  }, [attrs, count, dummy]);

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
