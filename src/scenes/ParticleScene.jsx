import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import CameraController from './CameraController.jsx';
import FloatingField from './FloatingField.jsx';
import ParticleSystem from './ParticleSystem.jsx';
import { sceneState } from '../lib/sceneState.js';

/**
 * Continuous WebGL scene — black bg, fixed canvas.
 * Camera: CameraController (Phase 12) owns all camera motion.
 * Object placement still driven by sceneState.
 */
export default function ParticleScene({
  reducedMotion = false,
  isMobile = false,
}) {
  const groupRef = useRef(null);
  const groupPos = useRef(new THREE.Vector3(1.2, 0.08, 0));
  const groupScale = useRef(1.55);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const s = sceneState;
    const damping = reducedMotion ? 1 : 0.06;
    const k = reducedMotion
      ? 1
      : 1 - Math.exp(-damping * 60 * Math.min(delta, 0.05));

    groupPos.current.x += (s.object.x - groupPos.current.x) * k;
    groupPos.current.y += (s.object.y - groupPos.current.y) * k;
    groupScale.current += (s.object.scale - groupScale.current) * k;

    groupRef.current.position.copy(groupPos.current);
    groupRef.current.scale.setScalar(groupScale.current);
  });

  return (
    <>
      <color attach="background" args={['#000000']} />
      <CameraController reducedMotion={reducedMotion} />

      <FloatingField reducedMotion={reducedMotion} isMobile={isMobile} />

      <group ref={groupRef} position={[1.2, 0.08, 0]} scale={1.55}>
        <ParticleSystem reducedMotion={reducedMotion} />
      </group>
    </>
  );
}
