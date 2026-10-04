import CameraController from './CameraController.jsx';
import ParticleSystem from './ParticleSystem.jsx';
import ShapeController from './ShapeController.jsx';

/**
 * Phase 1: empty black scene only.
 * Particle systems and morphs are wired in later phases.
 */
export default function ParticleScene() {
  return (
    <>
      <color attach="background" args={['#000000']} />
      <CameraController />
      <ShapeController />
      <ParticleSystem />
    </>
  );
}
