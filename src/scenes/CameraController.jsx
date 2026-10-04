import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

/**
 * Elevated front-3/4 view so longitudinal fissure and lobes read clearly.
 */
export default function CameraController() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0.35, 0.45, 3.4);
    camera.lookAt(0, 0.05, 0.15);
    camera.updateProjectionMatrix();
  }, [camera]);

  return null;
}
