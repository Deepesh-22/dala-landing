import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

export default function CameraController() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 0.3, 3.2);
    camera.lookAt(0.3, 0.05, 0);
    camera.fov = 40;
    camera.near = 0.1;
    camera.far = 100;
    camera.updateProjectionMatrix();
  }, [camera]);

  return null;
}
