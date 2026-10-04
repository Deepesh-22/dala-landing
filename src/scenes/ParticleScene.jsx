import { useState } from 'react';
import CameraController from './CameraController.jsx';
import ParticleSystem from './ParticleSystem.jsx';

/**
 * Phase 3: core particle field (brain default).
 * Scroll morphs wired in later phases.
 */
export default function ParticleScene({ reducedMotion = false }) {
  const [morph] = useState({
    shapeA: 'brain',
    shapeB: 'brain',
    morphProgress: 0,
  });

  return (
    <>
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={0.4} />
      <CameraController />
      <group position={[0.1, 0.05, 0]} scale={1.15}>
        <ParticleSystem
          shapeA={morph.shapeA}
          shapeB={morph.shapeB}
          morphProgress={morph.morphProgress}
          reducedMotion={reducedMotion}
        />
      </group>
    </>
  );
}
