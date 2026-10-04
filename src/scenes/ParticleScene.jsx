import AmbientParticles from './AmbientParticles.jsx';
import CameraController from './CameraController.jsx';
import ParticleSystem from './ParticleSystem.jsx';

export default function ParticleScene({ reducedMotion = false }) {
  return (
    <>
      <color attach="background" args={['#000000']} />
      <CameraController />

      <AmbientParticles count={80} />

      {/* Centered, large enough to read as a brain silhouette */}
      <group position={[0.15, 0.05, 0]} scale={1.55}>
        <ParticleSystem shapeA="brain" reducedMotion={reducedMotion} />
      </group>
    </>
  );
}
