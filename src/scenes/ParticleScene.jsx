import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import CameraController from './CameraController.jsx';
import ParticleSystem from './ParticleSystem.jsx';

/**
 * Hero composition: brain on the RIGHT half of the viewport,
 * left side kept open for typography.
 * Very slight camera perspective drift.
 */
export default function ParticleScene({ reducedMotion = false }) {
  const groupRef = useRef(null);
  const { camera } = useThree();
  const baseCam = useRef({ x: 0, y: 0.25, z: 4.5 });

  useFrame(({ clock }) => {
    if (reducedMotion) return;
    const t = clock.elapsedTime;
    // Very slight perspective movement
    camera.position.x = baseCam.current.x + Math.sin(t * 0.08) * 0.12;
    camera.position.y = baseCam.current.y + Math.cos(t * 0.1) * 0.06;
    camera.lookAt(0.55, 0.05, 0);
  });

  return (
    <>
      <color attach="background" args={['#000000']} />
      <CameraController />

      {/* Right-half composition — leaves left side for type */}
      <group ref={groupRef} position={[0.95, 0.05, 0]} scale={1.7}>
        <ParticleSystem shapeA="brain" reducedMotion={reducedMotion} />
      </group>
    </>
  );
}
