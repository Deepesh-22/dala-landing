import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

/**
 * Elevated front-oblique — both hemispheres + longitudinal fissure readable.
 */
export default function CameraController() {
  const { camera } = useThree();

  useEffect(() => {
    // Slightly above and in front so frontal poles + fissure are clear
    camera.position.set(0.15, 0.55, 2.9);
    camera.lookAt(0, 0.05, 0.05);
    camera.fov = 34;
    camera.updateProjectionMatrix();
  }, [camera]);

  return null;
}
