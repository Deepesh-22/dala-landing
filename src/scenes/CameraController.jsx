import { useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { sceneState } from '../lib/sceneState.js';

/**
 * Phase 12 — cinematic camera.
 *
 * Reads targets from sceneState.camera (master timeline).
 * Smooth damping via Vector3.lerp — never snaps.
 * Fully reversible when scrolling upward.
 *
 * Motion language: subtle drift through a large 3D volume.
 * No dramatic sweeps, no hard cuts.
 */
export default function CameraController({ reducedMotion = false }) {
  const { camera, size } = useThree();

  const pos = useRef(new THREE.Vector3(-0.12, 0.18, 4.55));
  const look = useRef(new THREE.Vector3(0.9, 0.06, 0));
  const targetPos = useRef(new THREE.Vector3(-0.12, 0.18, 4.55));
  const targetLook = useRef(new THREE.Vector3(0.9, 0.06, 0));
  const fovCurrent = useRef(43);
  const fovTarget = useRef(43);
  const initialized = useRef(false);

  // Responsive Z / FOV scale (mobile needs slightly wider view)
  const aspect = size.width / Math.max(size.height, 1);
  const zScale = aspect < 0.9 ? 1.12 : 1;
  const fovBoost = aspect < 0.9 ? 4 : 0;

  useLayoutEffect(() => {
    const cam = sceneState.camera;
    pos.current.set(cam.x, cam.y, cam.z * zScale);
    look.current.set(cam.lookX, cam.lookY, cam.lookZ ?? 0);
    targetPos.current.copy(pos.current);
    targetLook.current.copy(look.current);
    fovCurrent.current = cam.fov + fovBoost;
    fovTarget.current = fovCurrent.current;

    camera.position.copy(pos.current);
    camera.lookAt(look.current);
    camera.fov = fovCurrent.current;
    camera.near = 0.1;
    camera.far = 100;
    camera.updateProjectionMatrix();
    initialized.current = true;
  }, [camera, zScale, fovBoost]);

  useFrame(({ clock }, delta) => {
    if (!initialized.current) return;

    const cam = sceneState.camera;
    const t = clock.elapsedTime;

    // Target from timeline (deterministic, reversible)
    targetPos.current.set(cam.x, cam.y, cam.z * zScale);
    targetLook.current.set(cam.lookX, cam.lookY, cam.lookZ ?? 0);
    fovTarget.current = cam.fov + fovBoost;

    // Tiny idle drift — only when not reduced-motion
    if (!reducedMotion) {
      targetPos.current.x += Math.sin(t * 0.06) * 0.045;
      targetPos.current.y += Math.cos(t * 0.08) * 0.025;
    }

    // Frame-rate independent damping (subtle)
    // Higher damping = slower, more cinematic settle
    const damping = reducedMotion ? 1 : 0.045;
    const k = reducedMotion
      ? 1
      : 1 - Math.exp(-damping * 60 * Math.min(delta, 0.05));

    pos.current.lerp(targetPos.current, k);
    look.current.lerp(targetLook.current, k);
    fovCurrent.current += (fovTarget.current - fovCurrent.current) * k;

    camera.position.copy(pos.current);
    camera.lookAt(look.current);

    if (Math.abs(camera.fov - fovCurrent.current) > 0.01) {
      camera.fov = fovCurrent.current;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
