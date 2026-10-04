import { useState } from 'react';
import AmbientParticles from './AmbientParticles.jsx';
import CameraController from './CameraController.jsx';
import ParticleSystem from './ParticleSystem.jsx';

export default function ParticleScene({ reducedMotion = false }) {
  const [morph] = useState({ shapeA: 'brain' });

  return (
    <>
      <color attach="background" args={['#000000']} />
      <CameraController />

      <AmbientParticles count={180} />

      <group position={[0.5, 0.05, 0]} scale={0.85}>
        <ParticleSystem shapeA={morph.shapeA} reducedMotion={reducedMotion} />
      </group>
    </>
  );
}
