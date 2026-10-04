import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useState } from 'react';
import ParticleScene from '../../scenes/ParticleScene.jsx';
import { getCappedDpr } from '../../hooks/useResponsive.js';
import WebGLErrorBoundary from './WebGLErrorBoundary.jsx';
import FallbackVisual from './FallbackVisual.jsx';

function detectWebGL() {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext('webgl', { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext('experimental-webgl');
    return Boolean(gl);
  } catch {
    return false;
  }
}

/**
 * Fixed WebGL layer with hard fallback.
 * Never lets a WebGL crash blank the entire React tree.
 */
export default function WebGLCanvas({ reducedMotion = false }) {
  const [supported, setSupported] = useState(true);
  const [failed, setFailed] = useState(false);
  const dpr = reducedMotion ? 1 : Math.min(getCappedDpr(), 1.5);

  useEffect(() => {
    setSupported(detectWebGL());
  }, []);

  if (!supported || failed) {
    return (
      <div className="webgl-root" aria-hidden="true">
        <FallbackVisual />
      </div>
    );
  }

  return (
    <div className="webgl-root" aria-hidden="true">
      <WebGLErrorBoundary
        fallback={
          <FallbackVisual />
        }
      >
        <Canvas
          dpr={[1, dpr]}
          gl={{
            antialias: true,
            alpha: false,
            // "default" is more compatible than high-performance on many laptops
            powerPreference: 'default',
            failIfMajorPerformanceCaveat: false,
            preserveDrawingBuffer: false,
            stencil: false,
            depth: true,
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
            try {
              gl.setClearColor('#000000', 1);
              gl.domElement.style.display = 'block';
              camera.lookAt(0, 0.1, 0);
              camera.updateProjectionMatrix();
            } catch (err) {
              console.warn('[WebGL] onCreated failed', err);
              setFailed(true);
            }
          }}
          fallback={<FallbackVisual />}
        >
          <Suspense fallback={null}>
            <ParticleScene reducedMotion={reducedMotion} />
          </Suspense>
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
}
