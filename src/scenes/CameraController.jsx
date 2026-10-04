import { useThree } from '@react-three/fiber';
import { useLayoutEffect } from 'react';

export default function CameraController() {
  const { camera, size } = useThree();

  useLayoutEffect(() => {
    const aspect = size.width / Math.max(size.height, 1);
    const z = aspect < 0.9 ? 5.2 : 4.5;

    camera.position.set(0, 0.25, z);
    camera.lookAt(0.08, 0.05, 0);
    camera.fov = aspect < 0.9 ? 50 : 45;
    camera.near = 0.1;
    camera.far = 100;
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);

  return null;
}
