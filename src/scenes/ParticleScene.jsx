import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import CameraController from './CameraController.jsx';
import FloatingField from './FloatingField.jsx';
import ParticleSystem from './ParticleSystem.jsx';
import PerfMonitor from './PerfMonitor.jsx';
import { sceneState } from '../lib/sceneState.js';
import { getDeviceProfile } from '../hooks/useResponsive.js';
import { perf } from '../lib/perf.js';
import {
  interaction,
  tickInteraction,
} from '../lib/interactionState.js';

/**
 * Phase 16 — subtle pointer parallax on the particle group.
 */
export default function ParticleScene({
  reducedMotion = false,
  isMobile = false,
}) {
  const groupRef = useRef(null);
  const profile = useMemo(() => getDeviceProfile(), []);

  const startX = profile.objectOffsetX ?? (isMobile ? 0.15 : 1.2);
  const startScale = profile.objectScale ?? (isMobile ? 1.15 : 1.55);
  const startY = isMobile ? -0.15 : profile.isTablet ? 0.02 : 0.08;

  const groupPos = useRef(new THREE.Vector3(startX, startY, 0));
  const groupScale = useRef(startScale);
  // Extra rotation from pointer — very small
  const paraRot = useRef({ x: 0, y: 0 });

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    tickInteraction(delta);

    const s = sceneState;
    const damping = reducedMotion ? 1 : 0.06;
    const k = reducedMotion
      ? 1
      : 1 - Math.exp(-damping * 60 * Math.min(delta, 0.05));

    const targetX = isMobile
      ? startX + s.object.x * 0.15
      : profile.isTablet
        ? startX * 0.5 + s.object.x * 0.55
        : s.object.x;

    const targetY = isMobile ? startY + s.object.y * 0.3 : s.object.y;
    const targetScale = isMobile
      ? startScale * (0.92 + s.object.scale * 0.08)
      : s.object.scale;

    // Subtle mouse parallax (desktop only) — max ~0.12 units
    const px = reducedMotion || isMobile ? 0 : interaction.smoothX * 0.12;
    const py = reducedMotion || isMobile ? 0 : interaction.smoothY * 0.08;

    groupPos.current.x += (targetX + px - groupPos.current.x) * k;
    groupPos.current.y += (targetY + py - groupPos.current.y) * k;
    groupScale.current += (targetScale - groupScale.current) * k;

    groupRef.current.position.copy(groupPos.current);
    groupRef.current.scale.setScalar(groupScale.current);

    // Soft tilt toward cursor
    if (!reducedMotion && !isMobile) {
      const rk = 1 - Math.exp(-2.5 * Math.min(delta, 0.05));
      paraRot.current.y += (interaction.smoothX * 0.06 - paraRot.current.y) * rk;
      paraRot.current.x += (-interaction.smoothY * 0.04 - paraRot.current.x) * rk;
      // Applied on top of ParticleSystem's own rotation via group parent offset
      groupRef.current.rotation.x = paraRot.current.x;
      groupRef.current.rotation.y = paraRot.current.y;
    }
  });

  return (
    <>
      <color attach="background" args={['#000000']} />
      <CameraController
        reducedMotion={reducedMotion}
        isMobile={isMobile}
        isTablet={!!profile.isTablet}
      />

      {perf.showMonitor ? <PerfMonitor isMobile={isMobile} /> : null}

      <FloatingField reducedMotion={reducedMotion} isMobile={isMobile} />

      <group ref={groupRef} position={[startX, startY, 0]} scale={startScale}>
        <ParticleSystem reducedMotion={reducedMotion} />
      </group>
    </>
  );
}
