import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import ParticleScene from '../../scenes/ParticleScene.jsx';
import { getCappedDpr } from '../../hooks/useResponsive.js';

/**
 * Full-viewport fixed WebGL layer.
 * Must stay behind HTML (z-index 0) and fill the screen.
 */
export default function WebGLCanvas({ reducedMotion = false }) {
  const dpr = reducedMotion ? 1 : getCappedDpr();

  return (
    <div className="webgl-root" aria-hidden="true">
      <Canvas
        dpr={[1, dpr]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false,
          preserveDrawingBuffer: false,
        }}
        camera={{
          fov: 42,
          near: 0.1,
          far: 80,
          position: [0, 0.15, 4.2],
        }}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          background: '#000000',
        }}
        onCreated={({ gl, camera }) => {
          gl.setClearColor('#000000', 1);
          gl.domElement.style.display = 'block';
          camera.lookAt(0, 0.1, 0);
          camera.updateProjectionMatrix();
        }}
      >
        <Suspense fallback={null}>
          <ParticleScene reducedMotion={reducedMotion} />
        </Suspense>
      </Canvas>
    </div>
  );
}
