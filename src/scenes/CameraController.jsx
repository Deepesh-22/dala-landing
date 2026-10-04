import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

/**
 * Phase 1: set a stable default camera.
 * Later: scroll-driven camera states.
 */
export default function CameraController() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 0.2, 4);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera]);

  return null;
}
