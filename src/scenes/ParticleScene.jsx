import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import CameraController from './CameraController.jsx';
import FloatingField from './FloatingField.jsx';
import ParticleSystem from './ParticleSystem.jsx';
import { sceneState } from '../lib/sceneState.js';
import { getDeviceProfile } from '../hooks/useResponsive.js';

/**
 * Continuous WebGL scene.
 * Phase 14: responsive object placement — never hide WebGL on mobile.
 */
export default function ParticleScene({
  reducedMotion = false,
  isMobile = false,
}) {
  const groupRef = useRef(null);
  const profile = useMemo(() => getDeviceProfile(), []);

  const startX = profile.objectOffsetX ?? (isMobile ? 0.15 : 1.2);
  const startScale = profile.objectScale ?? (isMobile ? 1.15 : 1.55);

  // Mobile: lower the object slightly so it sits behind/under stacked type
  const startY = isMobile ? -0.15 : profile.isTablet ? 0.02 : 0.08;

  const groupPos = useRef(new THREE.Vector3(startX, startY, 0));
  const groupScale = useRef(startScale);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const s = sceneState;
    const damping = reducedMotion ? 1 : 0.06;
    const k = reducedMotion
      ? 1
      : 1 - Math.exp(-damping * 60 * Math.min(delta, 0.05));

    // Blend timeline object with device offset
    // Mobile keeps object more centered; desktop uses timeline x
    const targetX = isMobile
      ? startX + s.object.x * 0.15
      : profile.isTablet
        ? startX * 0.5 + s.object.x * 0.55
        : s.object.x;

    const targetY = isMobile ? startY + s.object.y * 0.3 : s.object.y;
    const targetScale = isMobile
      ? startScale * (0.92 + s.object.scale * 0.08)
      : s.object.scale;

    groupPos.current.x += (targetX - groupPos.current.x) * k;
    groupPos.current.y += (targetY - groupPos.current.y) * k;
    groupScale.current += (targetScale - groupScale.current) * k;

    groupRef.current.position.copy(groupPos.current);
    groupRef.current.scale.setScalar(groupScale.current);
  });

  return (
    <>
      <color attach="background" args={['#000000']} />
      <CameraController
        reducedMotion={reducedMotion}
        isMobile={isMobile}
        isTablet={!!profile.isTablet}
      />

      <FloatingField reducedMotion={reducedMotion} isMobile={isMobile} />

      <group ref={groupRef} position={[startX, startY, 0]} scale={startScale}>
        <ParticleSystem reducedMotion={reducedMotion} />
      </group>
    </>
  );
}
