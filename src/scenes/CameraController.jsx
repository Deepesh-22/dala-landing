import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

/**
 * Lateral view — brain profile faces the viewer (like Dala reference).
 */
export default function CameraController() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0.15, 0.2, 3.5);
    camera.lookAt(0.05, 0.0, 0);
    camera.fov = 36;
    camera.updateProjectionMatrix();
  }, [camera]);

  return null;
}
