import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { sceneState } from '../../lib/sceneState.js';
import { interaction, tickInteraction } from '../../lib/interactionState.js';
import FallbackVisual from './FallbackVisual.jsx';

/**
 * Imperative Three.js WebGL canvas — no R3F.
 * Guarantees a visible multi-color solid-triangle brain.
 */

function hash01(i) {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function makeBrain(count) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const idx = i >> 1;
    const n = Math.max(1, count / 2);
    const phi = Math.acos(1 - 2 * (idx / n));
    const theta = Math.PI * (1 + Math.sqrt(5)) * idx;
    let x = Math.sin(phi) * Math.cos(theta);
    let y = Math.cos(phi);
    let z = Math.sin(phi) * Math.sin(theta);
    x = side * (0.22 + Math.abs(x) * 0.78);
    y = y * 0.66 + 0.06;
    z = z * 0.74;
    const fold =
      Math.sin(z * 14 + y * 9) * 0.04 +
      Math.sin(y * 22 - z * 11) * 0.025 +
      Math.sin(x * 18 + z * 12) * 0.015;
    const r = 1 + fold;
    pos[i * 3] = x * r;
    pos[i * 3 + 1] = y * r;
    pos[i * 3 + 2] = z * r;
  }
  const stem0 = Math.floor(count * 0.88);
  for (let i = stem0; i < count; i++) {
    const t = (i - stem0) / Math.max(1, count - stem0);
    const a = hash01(i) * Math.PI * 2;
    const rr = 0.11 * (1 - t * 0.35);
    pos[i * 3] = Math.cos(a) * rr;
    pos[i * 3 + 1] = -0.32 - t * 0.55;
    pos[i * 3 + 2] = Math.sin(a) * rr * 0.28 - 0.02;
  }
  return pos;
}

function makeBulb(count) {
  const pos = new Float32Array(count * 3);
  const glass = Math.floor(count * 0.55);
  for (let i = 0; i < glass; i++) {
    const t = i / glass;
    const phi = Math.acos(1 - 2 * t);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    let y = Math.cos(phi);
    if (y < -0.1) y = -0.1 + (y + 0.1) * 0.15;
    pos[i * 3] = Math.sin(phi) * Math.cos(theta) * 0.66;
    pos[i * 3 + 1] = y * 0.76 + 0.55;
    pos[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * 0.66;
  }
  for (let i = glass; i < count; i++) {
    const t = (i - glass) / Math.max(1, count - glass);
    const a = t * Math.PI * 2 * 4;
    const radius = 0.24 * (1 - t * 0.5) + 0.08;
    pos[i * 3] = Math.cos(a) * radius;
    pos[i * 3 + 1] = 0.08 - t * 0.9;
    pos[i * 3 + 2] = Math.sin(a) * radius;
  }
  return pos;
}

function colorFor(x, y, z, seed) {
  const r = Math.sqrt(x * x + y * y * 1.05 + z * z);
  if (r > 0.88) {
    if (seed > 0.88) return [0.96, 0.95, 0.92];
    if (seed > 0.18) return [0.96, 0.77, 0.0];
    return [0.9, 0.65, 0.12];
  }
  if (r < 0.32) {
    if (seed > 0.5) return [0.35, 0.12, 0.7];
    return [0.4, 0.38, 0.95];
  }
  if (seed > 0.84) return [0.95, 0.94, 1.0];
  if (seed > 0.7) return [0.96, 0.77, 0.0];
  if (seed > 0.55) return [0.55, 0.36, 0.96];
  if (seed > 0.4) return [0.93, 0.28, 0.6];
  if (seed > 0.26) return [0.02, 0.71, 0.83];
  if (seed > 0.12) return [0.13, 0.77, 0.37];
  return [0.66, 0.54, 0.98];
}

function makeTriangleGeo() {
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
}

export default function WebGLCanvas({ reducedMotion = false }) {
  const mountRef = useRef(null);
  const failedRef = useRef(false);
  const [, bump] = useStateSafe();

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: false,
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: false,
        stencil: false,
        depth: true,
      });
    } catch (e) {
      console.warn('[Dala] WebGLRenderer failed', e);
      failedRef.current = true;
      bump();
      return undefined;
    }

    if (!renderer.getContext()) {
      failedRef.current = true;
      bump();
      renderer.dispose();
      return undefined;
    }

    const isMobile = window.innerWidth < 768;
    const COUNT = isMobile ? 5000 : 14000;
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.5);

    renderer.setPixelRatio(dpr);
    renderer.setSize(mount.clientWidth, mount.clientHeight, false);
    renderer.setClearColor(0x000000, 1);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(
      isMobile ? 50 : 42,
      mount.clientWidth / Math.max(1, mount.clientHeight),
      0.1,
      80
    );
    camera.position.set(isMobile ? 0 : -0.25, 0.18, isMobile ? 5.4 : 4.35);
    camera.lookAt(isMobile ? 0.15 : 1.05, 0.05, 0);

    // --- particles ---
    const brain = makeBrain(COUNT);
    const bulb = makeBulb(COUNT);
    const prev = new Float32Array(brain);
    const scales = new Float32Array(COUNT);
    const seeds = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      seeds[i] = hash01(i);
      scales[i] = (0.038 + seeds[i] * 0.032) * (isMobile ? 1.05 : 1.35);
    }

    const geo = makeTriangleGeo();
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      vertexColors: true,
      wireframe: false,
      transparent: true,
      opacity: 0.94,
      depthWrite: true,
      depthTest: true,
      side: THREE.DoubleSide,
      toneMapped: false,
    });

    const mesh = new THREE.InstancedMesh(geo, mat, COUNT);
    mesh.frustumCulled = false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      dummy.position.set(brain[i3], brain[i3 + 1], brain[i3 + 2]);
      dummy.scale.setScalar(scales[i]);
      dummy.rotation.set(seeds[i] * 6.28, hash01(i + 2) * 6.28, hash01(i + 3) * 6.28);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      const [r, g, b] = colorFor(brain[i3], brain[i3 + 1], brain[i3 + 2], seeds[i]);
      color.setRGB(r, g, b);
      mesh.setColorAt(i, color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    const group = new THREE.Group();
    group.position.set(isMobile ? 0.1 : 1.2, isMobile ? -0.12 : 0.05, 0);
    group.scale.setScalar(isMobile ? 1.2 : 1.55);
    group.add(mesh);
    scene.add(group);

    // sparse floaters
    const FCOUNT = isMobile ? 80 : 280;
    const fGeo = makeTriangleGeo();
    const fMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      vertexColors: true,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const field = new THREE.InstancedMesh(fGeo, fMat, FCOUNT);
    field.frustumCulled = false;
    const fBase = new Float32Array(FCOUNT * 3);
    const fScale = new Float32Array(FCOUNT);
    for (let i = 0; i < FCOUNT; i++) {
      const seed = hash01(i + 900);
      const side = seed > 0.15 ? 1 : -1;
      fBase[i * 3] = side * (0.8 + hash01(i + 3) * 2.6);
      fBase[i * 3 + 1] = (hash01(i + 11) - 0.5) * 3.0;
      fBase[i * 3 + 2] = 1.0 - hash01(i + 19) * 4.0;
      fScale[i] = 0.02 + seed * 0.05;
      dummy.position.set(fBase[i * 3], fBase[i * 3 + 1], fBase[i * 3 + 2]);
      dummy.scale.setScalar(fScale[i]);
      dummy.rotation.set(seed * 3, seed * 5, seed);
      dummy.updateMatrix();
      field.setMatrixAt(i, dummy.matrix);
      const [r, g, b] = colorFor(0.5, fBase[i * 3 + 1], 0.5, seed);
      color.setRGB(r * 0.5, g * 0.5, b * 0.5);
      field.setColorAt(i, color);
    }
    field.instanceMatrix.needsUpdate = true;
    if (field.instanceColor) field.instanceColor.needsUpdate = true;
    scene.add(field);

    let raf = 0;
    let last = performance.now();
    const clock = { t: 0 };

    const onResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (w < 1 || h < 1) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    window.addEventListener('resize', onResize, { passive: true });

    const animate = (now) => {
      raf = requestAnimationFrame(animate);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      clock.t += dt;
      tickInteraction(dt);

      const morph = reducedMotion
        ? 0
        : Math.min(5, Math.max(0, sceneState.morph ?? 0));
      // 0 = brain, ~3 = bulb
      const blend = Math.min(1, Math.max(0, morph / 3));

      group.rotation.y = clock.t * 0.04 + morph * 0.02;
      group.rotation.x = Math.sin(clock.t * 0.05) * 0.015;

      // gentle pointer bias
      if (!isMobile && !reducedMotion) {
        group.position.x = (isMobile ? 0.1 : 1.2) + (interaction.smoothX || 0) * 0.08;
        group.position.y = (isMobile ? -0.12 : 0.05) + (interaction.smoothY || 0) * 0.05;
      }

      const spring = 0.16;
      for (let i = 0; i < COUNT; i++) {
        const i3 = i * 3;
        const seed = seeds[i];
        const tx = brain[i3] + (bulb[i3] - brain[i3]) * blend;
        const ty = brain[i3 + 1] + (bulb[i3 + 1] - brain[i3 + 1]) * blend;
        const tz = brain[i3 + 2] + (bulb[i3 + 2] - brain[i3 + 2]) * blend;
        prev[i3] += (tx - prev[i3]) * spring;
        prev[i3 + 1] += (ty - prev[i3 + 1]) * spring;
        prev[i3 + 2] += (tz - prev[i3 + 2]) * spring;
        dummy.position.set(prev[i3], prev[i3 + 1], prev[i3 + 2]);
        dummy.scale.setScalar(scales[i]);
        dummy.rotation.set(
          seed * 2.1,
          seed * 3.4 + clock.t * 0.015 * seed,
          seed * 6.28
        );
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;

      // floaters drift
      if (!reducedMotion) {
        for (let i = 0; i < FCOUNT; i++) {
          const seed = hash01(i + 900);
          dummy.position.set(
            fBase[i * 3] + Math.sin(clock.t * 0.05 + seed * 6) * 0.05,
            fBase[i * 3 + 1] + Math.cos(clock.t * 0.04 + seed * 4) * 0.03,
            fBase[i * 3 + 2]
          );
          dummy.scale.setScalar(fScale[i]);
          dummy.rotation.set(clock.t * 0.02 + seed, seed * 4, seed);
          dummy.updateMatrix();
          field.setMatrixAt(i, dummy.matrix);
        }
        field.instanceMatrix.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(animate);

    console.info('[Dala] vanilla WebGL running', COUNT, 'particles');

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      try {
        mount.removeChild(renderer.domElement);
      } catch {
        /* already removed */
      }
      geo.dispose();
      mat.dispose();
      fGeo.dispose();
      fMat.dispose();
      mesh.dispose();
      field.dispose();
      renderer.dispose();
    };
  }, [reducedMotion, bump]);

  if (failedRef.current) {
    return (
      <div className="webgl-root" aria-hidden="true">
        <FallbackVisual />
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      className="webgl-root"
      aria-hidden="true"
    />
  );
}

/** tiny state helper so we can re-render on WebGL fail without importing useState at top awkwardly */
function useStateSafe() {
  const { useState } = require('react');
  return useState(0);
}
