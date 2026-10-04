import { useEffect, useRef, useState } from 'react';
import Experience from './experience/Experience.js';

const SECTIONS = [
  {
    id: 'hero',
    label: 'Manifesto',
    title: 'Unlock collective wisdom',
    body: 'Dala turns scattered knowledge into shared intelligence — one particle at a time.',
  },
  {
    id: 'manifesto',
    label: 'Chaos',
    title: 'From fragments to form',
    body: 'Ideas start as noise. We gather them, shape them, and let meaning emerge.',
  },
  {
    id: 'feature-01',
    label: 'Insight',
    title: 'Illuminate what matters',
    body: 'A single spark of clarity can reorganize an entire network of thought.',
  },
  {
    id: 'feature-02',
    label: 'Scale',
    title: 'Think in worlds',
    body: 'Every mind is a continent. Together they form a living map of knowledge.',
  },
  {
    id: 'feature-03',
    label: 'Flow',
    title: 'Organic intelligence',
    body: 'Structures dissolve and reform — fluid, adaptive, always in motion.',
  },
  {
    id: 'cta',
    label: 'Begin',
    title: 'Join the collective',
    body: 'Build the next layer of shared understanding.',
  },
];

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

  return (
    <>
      <div className={`dala-loader ${ready ? 'done' : ''}`}>
        <span>Loading</span>
      </div>

      <canvas ref={canvasRef} className="dala-canvas" />

      <div className="dala-page">
        {SECTIONS.map((s) => (
          <section key={s.id} id={s.id} className="dala-section">
            <div className="label">{s.label}</div>
            <h1>{s.title}</h1>
            <p>{s.body}</p>
            {s.id === 'cta' && (
              <button type="button" className="cta-btn">
                Get started
              </button>
            )}
          </section>
        ))}

        <footer className="dala-footer">
          Dala-style particle experience · scroll to morph
        </footer>
      </div>
    </>
  );
}
