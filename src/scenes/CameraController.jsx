import { useThree } from '@react-three/fiber';
import { useLayoutEffect } from 'react';

/** Frame the brain so both hemispheres + fissure read clearly. */
export default function CameraController() {
  const { camera, size } = useThree();

  useLayoutEffect(() => {
    const aspect = size.width / Math.max(size.height, 1);
    // Slightly closer on mobile so structure fills the frame
    const z = aspect < 1 ? 5.2 : 4.2;

    camera.position.set(0, 0.2, z);
    camera.lookAt(0, 0.08, 0);
    camera.fov = aspect < 1 ? 48 : 42;
    camera.near = 0.1;
    camera.far = 80;
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);

  return null;
}
