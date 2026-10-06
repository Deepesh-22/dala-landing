import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import CameraController from './CameraController.jsx';
import FloatingField from './FloatingField.jsx';
import ParticleSystem from './ParticleSystem.jsx';
import { sceneState } from '../lib/sceneState.js';
import { getDeviceProfile } from '../hooks/useResponsive.js';
import { interaction, tickInteraction } from '../lib/interactionState.js';

export default function ParticleScene({
  reducedMotion = false,
  isMobile = false,
}) {
  const groupRef = useRef(null);
  const profile = useMemo(() => getDeviceProfile(), []);

  const startX = isMobile ? 0.1 : 1.2;
  const startY = isMobile ? -0.15 : 0.05;
  const startScale = isMobile ? 1.2 : 1.55;

  const groupPos = useRef(new THREE.Vector3(startX, startY, 0));
  const groupScale = useRef(startScale);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    tickInteraction(delta);

    const s = sceneState;
    const damping = reducedMotion ? 1 : 0.08;
    const k = reducedMotion
      ? 1
      : 1 - Math.exp(-damping * 60 * Math.min(delta, 0.05));

    const targetX = isMobile ? startX : (s.object?.x ?? startX);
    const targetY = isMobile ? startY : (s.object?.y ?? startY);
    const targetScale = isMobile ? startScale : (s.object?.scale ?? startScale);

    const px = reducedMotion || isMobile ? 0 : (interaction.smoothX ?? 0) * 0.08;
    const py = reducedMotion || isMobile ? 0 : (interaction.smoothY ?? 0) * 0.05;

    groupPos.current.x += (targetX + px - groupPos.current.x) * k;
    groupPos.current.y += (targetY + py - groupPos.current.y) * k;
    groupScale.current += (targetScale - groupScale.current) * k;

    groupRef.current.position.copy(groupPos.current);
    groupRef.current.scale.setScalar(groupScale.current);
  });

  return (
    <>
      <color attach="background" args={['#000000']} />
      {/* Ambient so MeshBasic still fine; no lights required */}
      <CameraController
        reducedMotion={reducedMotion}
        isMobile={isMobile}
        isTablet={!!profile.isTablet}
      />
      {!isMobile && (
        <FloatingField reducedMotion={reducedMotion} isMobile={isMobile} />
      )}
      <group ref={groupRef} position={[startX, startY, 0]} scale={startScale}>
        <ParticleSystem reducedMotion={reducedMotion} />
      </group>
    </>
  );
}
