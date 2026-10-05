import { useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { sceneState } from '../lib/sceneState.js';

/**
 * Phase 12 + 14 — cinematic camera with responsive framing.
 */
export default function CameraController({
  reducedMotion = false,
  isMobile = false,
  isTablet = false,
}) {
  const { camera, size } = useThree();

  const pos = useRef(new THREE.Vector3(-0.12, 0.18, 4.55));
  const look = useRef(new THREE.Vector3(0.9, 0.06, 0));
  const targetPos = useRef(new THREE.Vector3(-0.12, 0.18, 4.55));
  const targetLook = useRef(new THREE.Vector3(0.9, 0.06, 0));
  const fovCurrent = useRef(43);
  const fovTarget = useRef(43);
  const initialized = useRef(false);

  const aspect = size.width / Math.max(size.height, 1);

  // Mobile: pull back + center look so stacked type + object both read
  let zScale = 1;
  let fovBoost = 0;
  let lookBiasX = 0;
  if (isMobile) {
    zScale = 1.22;
    fovBoost = 6;
    lookBiasX = -0.35; // look more toward center
  } else if (isTablet || aspect < 0.95) {
    zScale = 1.1;
    fovBoost = 3;
    lookBiasX = -0.15;
  }

  useLayoutEffect(() => {
    const cam = sceneState.camera;
    pos.current.set(cam.x, cam.y, cam.z * zScale);
    look.current.set(cam.lookX + lookBiasX, cam.lookY, cam.lookZ ?? 0);
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
  }, [camera, zScale, fovBoost, lookBiasX]);

  useFrame(({ clock }, delta) => {
    if (!initialized.current) return;

    const cam = sceneState.camera;
    const t = clock.elapsedTime;

    targetPos.current.set(cam.x, cam.y, cam.z * zScale);
    targetLook.current.set(
      cam.lookX + lookBiasX,
      cam.lookY,
      cam.lookZ ?? 0
    );
    fovTarget.current = cam.fov + fovBoost;

    if (!reducedMotion) {
      const drift = isMobile ? 0.02 : 0.045;
      targetPos.current.x += Math.sin(t * 0.06) * drift;
      targetPos.current.y += Math.cos(t * 0.08) * (drift * 0.55);
    }

    const damping = reducedMotion ? 1 : isMobile ? 0.06 : 0.045;
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
