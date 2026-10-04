import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import ParticleScene from '../../scenes/ParticleScene.jsx';
import { getCappedDpr } from '../../hooks/useResponsive.js';

/**
 * Fixed full-viewport WebGL layer.
 */
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
        }}
        camera={{ fov: 38, near: 0.1, far: 80, position: [0.2, 0.15, 3.6] }}
        style={{ background: '#000000' }}
        onCreated={({ gl }) => {
          gl.setClearColor('#000000', 1);
        }}
      >
        <Suspense fallback={null}>
          <ParticleScene reducedMotion={reducedMotion} />
        </Suspense>
      </Canvas>
    </div>
  );
}
