import AmbientParticles from './AmbientParticles.jsx';
import CameraController from './CameraController.jsx';
import ParticleSystem from './ParticleSystem.jsx';

/**
 * Phase 3 scene — brain particle field centered and sized to read clearly.
 */
export default function ParticleScene({ reducedMotion = false }) {
  return (
    <>
      <color attach="background" args={['#000000']} />
      <CameraController />

      {/* Sparse ambient field */}
      <AmbientParticles count={120} />

      {/* Brain centered in view */}
      <group position={[0, 0.05, 0]} scale={1.35}>
        <ParticleSystem shapeA="brain" reducedMotion={reducedMotion} />
      </group>
    </>
  );
}
