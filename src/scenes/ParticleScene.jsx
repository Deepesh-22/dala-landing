import CameraController from './CameraController.jsx';
import ParticleSystem from './ParticleSystem.jsx';

export default function ParticleScene({ reducedMotion = false }) {
  return (
    <>
      <color attach="background" args={['#000000']} />
      <CameraController />

      {/* Brain-scale group — centered in view */}
      <group position={[0.12, 0.08, 0]} scale={1.65}>
        <ParticleSystem shapeA="brain" reducedMotion={reducedMotion} />
      </group>
    </>
  );
}
