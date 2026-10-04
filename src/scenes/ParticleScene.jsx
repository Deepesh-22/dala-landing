import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import CameraController from './CameraController.jsx';
import ParticleSystem from './ParticleSystem.jsx';

/**
 * Phase 4 composition:
 * Brain occupies the RIGHT ~55% of the viewport.
 * Left side stays relatively open for hero typography.
 */
export default function ParticleScene({ reducedMotion = false }) {
  const { camera, size } = useThree();
  const baseCam = useRef({ x: -0.15, y: 0.2, z: 4.4 });

  useFrame(({ clock }) => {
    if (reducedMotion) return;
    const t = clock.elapsedTime;
    camera.position.x = baseCam.current.x + Math.sin(t * 0.07) * 0.1;
    camera.position.y = baseCam.current.y + Math.cos(t * 0.09) * 0.05;
    // Look toward the right-side brain
    camera.lookAt(0.85, 0.05, 0);
  });

  // Slightly pull brain further right on wide screens
  const aspect = size.width / Math.max(size.height, 1);
  const brainX = aspect > 1.2 ? 1.35 : aspect > 0.9 ? 1.1 : 0.55;
  const brainScale = aspect < 0.9 ? 1.35 : 1.55;

  return (
    <>
      <color attach="background" args={['#000000']} />
      <CameraController />

      <group position={[brainX, 0.08, 0]} scale={brainScale}>
        <ParticleSystem shapeA="brain" reducedMotion={reducedMotion} />
      </group>
    </>
  );
}
