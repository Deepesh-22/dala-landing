import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import CameraController from './CameraController.jsx';
import FloatingField from './FloatingField.jsx';
import ParticleSystem from './ParticleSystem.jsx';
import { scrollStore } from '../lib/scrollStore.js';

/**
 * Phase 4–7:
 * Brain / morphing object on the right
 * Floating field behind
 * Camera responds subtly to scroll morph
 */
export default function ParticleScene({
  reducedMotion = false,
  isMobile = false,
}) {
  const { camera, size } = useThree();
  const baseCam = useRef({ x: -0.15, y: 0.2, z: 4.4 });

  useFrame(({ clock }) => {
    if (reducedMotion) return;
    const t = clock.elapsedTime;
    const morph = scrollStore.morph;

    // Subtle camera response to morph progress
    const pullBack = morph * 0.35;
    const shiftX = morph * 0.15;

    camera.position.x =
      baseCam.current.x +
      Math.sin(t * 0.07) * 0.1 -
      shiftX;
    camera.position.y =
      baseCam.current.y + Math.cos(t * 0.09) * 0.05 + morph * 0.05;
    camera.position.z = baseCam.current.z + pullBack;

    const lookX = 0.85 - morph * 0.2;
    camera.lookAt(lookX, 0.05 - morph * 0.05, 0);
  });

  const aspect = size.width / Math.max(size.height, 1);
  const brainX = aspect > 1.2 ? 1.35 : aspect > 0.9 ? 1.1 : 0.55;
  const brainScale = aspect < 0.9 ? 1.35 : 1.55;

  return (
    <>
      <color attach="background" args={['#000000']} />
      <CameraController />

      <FloatingField reducedMotion={reducedMotion} isMobile={isMobile} />

      <group position={[brainX, 0.08, 0]} scale={brainScale}>
        <ParticleSystem reducedMotion={reducedMotion} />
      </group>
    </>
  );
}
