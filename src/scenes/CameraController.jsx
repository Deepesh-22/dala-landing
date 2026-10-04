import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

/** Side view matching medical brain profile. */
export default function CameraController() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0.2, 0.15, 3.2);
    camera.lookAt(0.1, 0.0, 0);
    camera.fov = 35;
    camera.updateProjectionMatrix();
  }, [camera]);

  return null;
}
