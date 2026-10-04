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

      {/* Sparse floating triangles in the void */}
      <AmbientParticles count={reducedMotion ? 300 : 700} />

      {/* Side-profile brain — no extra Y-rotation (already lateral in shape data) */}
      <group position={[0.65, 0.05, 0]} scale={1.15}>
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
