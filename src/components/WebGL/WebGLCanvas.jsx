import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useState } from 'react';
import ParticleScene from '../../scenes/ParticleScene.jsx';
import { getCappedDpr, useResponsive } from '../../hooks/useResponsive.js';
import WebGLErrorBoundary from './WebGLErrorBoundary.jsx';
import FallbackVisual from './FallbackVisual.jsx';

function canCreateWebGL() {
  try {
    const c = document.createElement('canvas');
    const gl =
      c.getContext('webgl2', { failIfMajorPerformanceCaveat: false }) ||
      c.getContext('webgl', { failIfMajorPerformanceCaveat: false }) ||
      c.getContext('experimental-webgl');
    return !!gl;
  } catch {
    return false;
  }
}

export default function WebGLCanvas({ reducedMotion = false }) {
  const { isMobile, isTablet } = useResponsive();
  const [supported] = useState(() =>
    typeof window !== 'undefined' ? canCreateWebGL() : true
  );
  const dprCap = reducedMotion ? 1 : Math.min(getCappedDpr(), 1.5);

  useEffect(() => {
    const onOrient = () => window.dispatchEvent(new Event('resize'));
    window.addEventListener('orientationchange', onOrient);
    return () => window.removeEventListener('orientationchange', onOrient);
  }, []);

  const glConfig = useMemo(
    () => ({
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: false,
      stencil: false,
      depth: true,
    }),
    []
  );

  if (!supported) {
    return (
      <div className="webgl-root" aria-hidden="true">
        <FallbackVisual />
      </div>
    );
  }

  return (
    <div className="webgl-root" aria-hidden="true">
      <WebGLErrorBoundary fallback={<FallbackVisual />}>
        <Canvas
          dpr={dprCap}
          gl={glConfig}
          frameloop="always"
          flat
          camera={{
            fov: isMobile ? 50 : 42,
            near: 0.1,
            far: 80,
            position: isMobile ? [0, 0.2, 5.5] : [-0.25, 0.2, 4.4],
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
            gl.setClearColor(0x000000, 1);
            gl.setPixelRatio(dprCap);
            camera.lookAt(isMobile ? 0.15 : 1.05, 0.05, 0);
            camera.updateProjectionMatrix();
            console.info('[Dala] WebGL ready', gl.getParameter(gl.VERSION));
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
