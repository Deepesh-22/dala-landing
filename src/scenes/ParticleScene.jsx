import { useState } from 'react';
import CameraController from './CameraController.jsx';
import ParticleSystem from './ParticleSystem.jsx';

export default function ParticleScene({ reducedMotion = false }) {
  const [morph] = useState({
    shapeA: 'brain',
    shapeB: 'brain',
    morphProgress: 0,
  });

  return (
    <>
      <color attach="background" args={['#000000']} />
      <CameraController />
      <group
        position={[0.5, -0.05, 0]}
        scale={1.05}
        rotation={[0.1, -0.4, 0.02]}
      >
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
