import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import CameraController from './CameraController.jsx';
import FloatingField from './FloatingField.jsx';
import ParticleSystem from './ParticleSystem.jsx';
import { sceneState } from '../lib/sceneState.js';

/**
 * Continuous WebGL scene — black bg, fixed canvas.
 * Camera + object placement driven only by sceneState (master timeline).
 */
export default function ParticleScene({
  reducedMotion = false,
  isMobile = false,
}) {
  const { camera, size } = useThree();
  const groupRef = useRef(null);
  const baseZ = useRef(4.4);

  // Keep base Z responsive
  const aspect = size.width / Math.max(size.height, 1);
  baseZ.current = aspect < 0.9 ? 5.2 : 4.4;

  useFrame(({ clock }) => {
    if (reducedMotion) return;
    const t = clock.elapsedTime;
    const s = sceneState;
    const cam = s.camera;

    // Idle micro-drift on top of timeline camera
    camera.position.x = cam.x + Math.sin(t * 0.07) * 0.08;
    camera.position.y = cam.y + Math.cos(t * 0.09) * 0.04;
    camera.position.z = cam.z * (baseZ.current / 4.4);
    camera.lookAt(cam.lookX, cam.lookY, 0);

    if (groupRef.current) {
      groupRef.current.position.set(s.object.x, s.object.y, 0);
      groupRef.current.scale.setScalar(s.object.scale);
    }
  });

  const startX = aspect > 1.2 ? 1.35 : aspect > 0.9 ? 1.1 : 0.55;
  const startScale = aspect < 0.9 ? 1.35 : 1.55;

  return (
    <>
      <color attach="background" args={['#000000']} />
      <CameraController />

      <FloatingField
        reducedMotion={reducedMotion}
        isMobile={isMobile}
      />

      <group ref={groupRef} position={[startX, 0.08, 0]} scale={startScale}>
        <ParticleSystem reducedMotion={reducedMotion} />
      </group>
    </>
  );
}
