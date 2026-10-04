import { Canvas } from '@react-three/fiber';
import { Suspense, useState } from 'react';
import ParticleScene from '../../scenes/ParticleScene.jsx';
import { getCappedDpr } from '../../hooks/useResponsive.js';
import WebGLErrorBoundary from './WebGLErrorBoundary.jsx';
import FallbackVisual from './FallbackVisual.jsx';

/**
 * Always attempt WebGL first. Fallback only if Canvas/Three actually fails.
 */
export default function WebGLCanvas({ reducedMotion = false }) {
  const [failed, setFailed] = useState(false);
  const dpr = reducedMotion ? 1 : Math.min(getCappedDpr(), 1.5);

  if (failed) {
    return (
      <div className="webgl-root" aria-hidden="true">
        <FallbackVisual />
      </div>
    );
  }

  return (
    <div className="webgl-root" aria-hidden="true">
      <WebGLErrorBoundary fallback={<FallbackVisual onMount={() => setFailed(true)} />}>
        <Canvas
          dpr={[1, dpr]}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'default',
            failIfMajorPerformanceCaveat: false,
            preserveDrawingBuffer: false,
            stencil: false,
            depth: true,
          }}
          camera={{
            fov: 40,
            near: 0.05,
            far: 100,
            position: [0, 0.2, 3.8],
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
            gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, dpr));
            camera.lookAt(0, 0.05, 0);
            camera.updateProjectionMatrix();
          }}
        >
          <Suspense fallback={null}>
            <ParticleScene reducedMotion={reducedMotion} />
          </Suspense>
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
}
