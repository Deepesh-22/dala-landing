import { useEffect, useRef, useState } from 'react';
import Experience, { BUILD_PHASE } from './experience/Experience.js';

export default function App() {
  const canvasRef = useRef(null);
  const expRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const exp = new Experience({
      canvas: canvasRef.current,
      onProgress: (p) => {
        if (p >= 1) setReady(true);
      },
    });
    expRef.current = exp;

    return () => {
      exp.destroy();
      expRef.current = null;
    };
  }, []);

  const phaseCopy = {
    1: {
      title: 'Black canvas only',
      body: 'Pure black. No purple. Canvas fills the screen. Loader fades out.',
    },
    2: {
      title: 'Triangle particles',
      body: 'Filled multicolored triangles (Dala palette) slowly rotating. Sharp edges on pure black.',
    },
    3: {
      title: 'Brain shape',
      body: 'Particles form a clear brain silhouette.',
    },
  };

  const copy = phaseCopy[BUILD_PHASE] || phaseCopy[2];

  return (
    <>
      <div className={`dala-loader ${ready ? 'done' : ''}`}>
        <span>Phase {BUILD_PHASE} · Loading</span>
      </div>

      <canvas ref={canvasRef} className="dala-canvas" />

      <div className="dala-page">
        <section id="hero" className="dala-section">
          <div className="label">Phase {BUILD_PHASE} preview</div>
          <h1>{copy.title}</h1>
          <p>{copy.body}</p>
        </section>

        {BUILD_PHASE >= 6 && (
          <>
            <section id="manifesto" className="dala-section">
              <div className="label">Chaos</div>
              <h1>From fragments to form</h1>
              <p>Ideas start as noise. We gather them, shape them, and let meaning emerge.</p>
            </section>
            <section id="feature-01" className="dala-section">
              <div className="label">Insight</div>
              <h1>Illuminate what matters</h1>
              <p>A single spark of clarity can reorganize an entire network of thought.</p>
            </section>
            <section id="feature-02" className="dala-section">
              <div className="label">Scale</div>
              <h1>Think in worlds</h1>
              <p>Every mind is a continent. Together they form a living map of knowledge.</p>
            </section>
            <section id="feature-03" className="dala-section">
              <div className="label">Flow</div>
              <h1>Organic intelligence</h1>
              <p>Structures dissolve and reform — fluid, adaptive, always in motion.</p>
            </section>
            <section id="cta" className="dala-section">
              <div className="label">Begin</div>
              <h1>Join the collective</h1>
              <p>Build the next layer of shared understanding.</p>
              <button type="button" className="cta-btn">Get started</button>
            </section>
          </>
        )}

        <footer className="dala-footer">
          BUILD_PHASE = {BUILD_PHASE} · dala-landing
        </footer>
      </div>
    </>
  );
}
