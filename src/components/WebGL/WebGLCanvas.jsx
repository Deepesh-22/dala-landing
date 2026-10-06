import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useState } from 'react';
import ParticleScene from '../../scenes/ParticleScene.jsx';
import { getCappedDpr, useResponsive } from '../../hooks/useResponsive.js';
import WebGLErrorBoundary from './WebGLErrorBoundary.jsx';
import FallbackVisual from './FallbackVisual.jsx';

function canCreateWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export default function WebGLCanvas({ reducedMotion = false }) {
  const { isMobile, isTablet } = useResponsive();
  const [supported] = useState(() => canCreateWebGL());
  const dpr = reducedMotion ? 1 : getCappedDpr();

  useEffect(() => {
    const onOrient = () => window.dispatchEvent(new Event('resize'));
    window.addEventListener('orientationchange', onOrient);
    return () => window.removeEventListener('orientationchange', onOrient);
  }, []);

  const glConfig = useMemo(
    () => ({
      antialias: !isMobile,
      alpha: false,
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: false,
      stencil: false,
      depth: true,
      preserveDrawingBuffer: false,
    }),
    [isMobile]
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
          dpr={[1, dpr]}
          gl={glConfig}
          frameloop="always"
          camera={{
            fov: isMobile ? 48 : 42,
            near: 0.1,
            far: 80,
            position: isMobile ? [0, 0.15, 5.2] : [-0.2, 0.15, 4.2],
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
            gl.setClearColor('#000000', 1);
            gl.setPixelRatio(reducedMotion ? 1 : getCappedDpr());
            camera.lookAt(isMobile ? 0.2 : 1.0, 0.05, 0);
            camera.updateProjectionMatrix();
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
