import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import ParticleScene from '../../scenes/ParticleScene.jsx';
import { getCappedDpr } from '../../hooks/useResponsive.js';
import { useResponsive } from '../../hooks/useResponsive.js';
import WebGLErrorBoundary from './WebGLErrorBoundary.jsx';
import FallbackVisual from './FallbackVisual.jsx';

export default function WebGLCanvas({ reducedMotion = false }) {
  const { isMobile } = useResponsive();
  const dpr = reducedMotion ? 1 : getCappedDpr();

  return (
    <div className="webgl-root" aria-hidden="true">
      <WebGLErrorBoundary fallback={<FallbackVisual />}>
        <Canvas
          dpr={[1, dpr]}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'default',
            failIfMajorPerformanceCaveat: false,
            stencil: false,
            depth: true,
          }}
          camera={{
            fov: 45,
            near: 0.1,
            far: 100,
            position: [-0.15, 0.2, 4.4],
          }}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            display: 'block',
            background: '#000',
          }}
          onCreated={({ gl, camera }) => {
            gl.setClearColor(0x000000, 1);
            camera.lookAt(0.85, 0.05, 0);
          }}
        >
          <Suspense fallback={null}>
            <ParticleScene reducedMotion={reducedMotion} isMobile={isMobile} />
          </Suspense>
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
}
