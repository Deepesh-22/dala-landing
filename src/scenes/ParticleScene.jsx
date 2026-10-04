import { useState } from 'react';
import AmbientParticles from './AmbientParticles.jsx';
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

      <AmbientParticles count={reducedMotion ? 200 : 400} />

      <group position={[0.55, 0.05, 0]} scale={0.7} rotation={[0.12, 0.2, 0]}>
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
