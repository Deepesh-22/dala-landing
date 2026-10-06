import { useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { sceneState } from '../lib/sceneState.js';

/**
 * Phase F — cinematic camera:
 * - lookAt biased toward right-side brain (not dead center)
 * - subtle lerp damping on position / look / fov
 * - mobile: pull back + center look for stacked layout
 * - fully reversible (driven by sceneState from scroll progress)
 */
export default function CameraController({
  reducedMotion = false,
  isMobile = false,
  isTablet = false,
}) {
  const { camera, size } = useThree();

  const pos = useRef(new THREE.Vector3(-0.22, 0.14, 4.15));
  const look = useRef(new THREE.Vector3(1.1, 0.06, 0));
  const targetPos = useRef(new THREE.Vector3(-0.22, 0.14, 4.15));
  const targetLook = useRef(new THREE.Vector3(1.1, 0.06, 0));
  const fovCurrent = useRef(40);
  const fovTarget = useRef(40);
  const initialized = useRef(false);

  const aspect = size.width / Math.max(size.height, 1);

  // Responsive framing adjustments
  let zScale = 1;
  let fovBoost = 0;
  let lookBiasX = 0;
  if (isMobile) {
    zScale = 1.25;
    fovBoost = 7;
    lookBiasX = -0.55; // center look for stacked type + object
  } else if (isTablet || aspect < 0.95) {
    zScale = 1.12;
    fovBoost = 3;
    lookBiasX = -0.2;
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

    // Very subtle idle drift (desktop)
    if (!reducedMotion) {
      const drift = isMobile ? 0.015 : 0.035;
      targetPos.current.x += Math.sin(t * 0.055) * drift;
      targetPos.current.y += Math.cos(t * 0.07) * (drift * 0.5);
    }

    // Smooth exponential damping — reversible with scroll
    const damping = reducedMotion ? 1 : isMobile ? 0.07 : 0.05;
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
