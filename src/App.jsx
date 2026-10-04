import { useEffect, useState } from 'react';
import Lenis from 'lenis';
import Navigation from './components/Navigation/Navigation.jsx';
import WebGLCanvas from './components/WebGL/WebGLCanvas.jsx';
import Sections from './components/Sections/Sections.jsx';
import Loader from './components/UI/Loader.jsx';
import { useResponsive } from './hooks/useResponsive.js';

export default function App() {
  const { reducedMotion } = useResponsive();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 600);
    const hard = setTimeout(() => setReady(true), 2500);
    return () => {
      clearTimeout(t);
      clearTimeout(hard);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) return undefined;

    let lenis;
    let rafId = 0;
    try {
      lenis = new Lenis({
        duration: 1.15,
        smoothWheel: true,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
      const raf = (time) => {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);
    } catch (e) {
      console.warn('[Lenis]', e);
    }

    return () => {
      cancelAnimationFrame(rafId);
      lenis?.destroy?.();
    };
  }, [reducedMotion]);

  return (
    <>
      <Loader ready={ready} />
      <WebGLCanvas reducedMotion={reducedMotion} />
      <Navigation />
      <main className="page-root">
        <Sections />
      </main>
    </>
  );
}
