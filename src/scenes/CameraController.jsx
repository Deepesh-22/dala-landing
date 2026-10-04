import { useThree } from '@react-three/fiber';
import { useLayoutEffect } from 'react';

export default function CameraController() {
  const { camera, size } = useThree();

  useLayoutEffect(() => {
    const aspect = size.width / Math.max(size.height, 1);
    const z = aspect < 0.85 ? 5.0 : 3.8;

    camera.position.set(0, 0.25, z);
    camera.lookAt(0.1, 0.05, 0);
    camera.fov = aspect < 0.85 ? 48 : 40;
    camera.near = 0.05;
    camera.far = 100;
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);

  return null;
}
