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

  // Phase 1–5: single-section preview copy
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
    4: {
      title: 'Morph physics',
      body: 'Spring + damping morph through brain, scatter, bulb, globe, abstract.',
    },
    5: {
      title: 'Ambient + all shapes',
      body: 'Sparse background triangles drift forever while the main form morphs.',
    },
  };

  const copy = phaseCopy[BUILD_PHASE];

  return (
    <>
      <div className={`dala-loader ${ready ? 'done' : ''}`}>
        <span>Phase {BUILD_PHASE} · Loading</span>
      </div>

      <canvas ref={canvasRef} className="dala-canvas" />

      <div className="dala-page">
        {BUILD_PHASE < 6 && copy && (
          <section id="hero" className="dala-section">
            <div className="label">Phase {BUILD_PHASE} preview</div>
            <h1>{copy.title}</h1>
            <p>{copy.body}</p>
          </section>
        )}

        {BUILD_PHASE >= 6 && (
          <>
            <section id="hero" className="dala-section">
              <div className="label">Know yourself</div>
              <h1>Your mind is the map</h1>
              <p>
                Scroll to travel from self-understanding to direction, scale, and
                opportunity — one continuous form.
              </p>
              <p className="scroll-hint">Scroll ↓</p>
            </section>

            <section id="manifesto" className="dala-section dala-section--right">
              <div className="label">Chaos</div>
              <h1>From fragments to form</h1>
              <p>
                Ideas start as noise. We gather them, shape them, and let meaning
                emerge from the scatter.
              </p>
            </section>

            <section id="feature-01" className="dala-section">
              <div className="label">Insight</div>
              <h1>Illuminate what matters</h1>
              <p>
                A single spark of clarity can reorganize an entire network of
                thought — direction from the dark.
              </p>
            </section>

            <section id="feature-02" className="dala-section dala-section--right">
              <div className="label">Scale</div>
              <h1>Think in worlds</h1>
              <p>
                Every mind is a continent. Together they form a living map of
                knowledge and possibility.
              </p>
            </section>

            <section id="feature-03" className="dala-section">
              <div className="label">Flow</div>
              <h1>Organic intelligence</h1>
              <p>
                Structures dissolve and reform — fluid, adaptive, always in
                motion toward what comes next.
              </p>
            </section>

            <section id="cta" className="dala-section dala-section--center">
              <div className="label">Begin</div>
              <h1>Your route starts here</h1>
              <p>
                Build the next layer of shared understanding. Skills, paths, and
                futures — connected.
              </p>
              <button type="button" className="cta-btn">
                Get started
              </button>
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
