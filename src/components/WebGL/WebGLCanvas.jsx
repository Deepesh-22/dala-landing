import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import ParticleScene from '../../scenes/ParticleScene.jsx';
import { getCappedDpr } from '../../hooks/useResponsive.js';

export default function WebGLCanvas({ reducedMotion = false }) {
  const dpr = reducedMotion ? 1 : getCappedDpr();

  return (
    <div className="webgl-root" aria-hidden="true">
      <Canvas
        dpr={dpr}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false,
        }}
        camera={{ fov: 36, near: 0.1, far: 100, position: [0.2, 0.4, 3.2] }}
        style={{ background: '#000000' }}
        onCreated={({ gl }) => {
          gl.setClearColor('#000000', 1);
          gl.setPixelRatio(dpr);
        }}
      >
        <Suspense fallback={null}>
          <ParticleScene reducedMotion={reducedMotion} />
        </Suspense>
      </Canvas>
    </div>
  );
}
