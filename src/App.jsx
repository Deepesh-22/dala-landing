import { useEffect, useState } from 'react';
import Lenis from 'lenis';
import Navigation from './components/Navigation/Navigation.jsx';
import WebGLCanvas from './components/WebGL/WebGLCanvas.jsx';
import Sections from './components/Sections/Sections.jsx';
import Loader from './components/UI/Loader.jsx';
import { useResponsive } from './hooks/useResponsive.js';

export default function App() {
  const { reducedMotion, isMobile } = useResponsive();
  const [ready, setReady] = useState(false);

  // Loader: brief settle so first paint is black, not flash
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 400);
    return () => clearTimeout(t);
  }, []);

  // Smooth scroll (disabled when reduced motion)
  useEffect(() => {
    if (reducedMotion) return undefined;

    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    let rafId = 0;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [reducedMotion]);

  return (
    <>
      <Loader ready={ready} />

      {/* Fixed WebGL — never scrolls away */}
      <WebGLCanvas reducedMotion={reducedMotion || isMobile} />

      <Navigation />

      {/* Scrollable editorial content above canvas */}
      <main className="page-root">
        <Sections />
      </main>
    </>
  );
}
