import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import ParticleScene from '../../scenes/ParticleScene.jsx';
import { getCappedDpr, useResponsive } from '../../hooks/useResponsive.js';
import WebGLErrorBoundary from './WebGLErrorBoundary.jsx';
import FallbackVisual from './FallbackVisual.jsx';

/**
 * Phase 14 — DPR capped, WebGL always present (never hidden on mobile).
 */
export default function WebGLCanvas({ reducedMotion = false }) {
  const { isMobile, isTablet } = useResponsive();
  const dpr = reducedMotion ? 1 : getCappedDpr();

  return (
    <div className="webgl-root" aria-hidden="true">
      <WebGLErrorBoundary fallback={<FallbackVisual />}>
        <Canvas
          dpr={[1, dpr]}
          gl={{
            antialias: !isMobile,
            alpha: false,
            powerPreference: isMobile ? 'low-power' : 'default',
            failIfMajorPerformanceCaveat: false,
            stencil: false,
            depth: true,
          }}
          camera={{
            fov: isMobile ? 50 : 45,
            near: 0.1,
            far: 100,
            position: [-0.15, 0.2, isMobile ? 5.2 : 4.4],
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
            camera.lookAt(isMobile ? 0.3 : 0.85, 0.05, 0);
          }}
        >
          <Suspense fallback={null}>
            <ParticleScene
              reducedMotion={reducedMotion}
              isMobile={isMobile}
              isTablet={isTablet}
            />
          </Suspense>
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
}
