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

  // Always dismiss loader — never leave the page stuck on black
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 400);
    // Safety: force ready even if something hangs
    const hard = setTimeout(() => setReady(true), 2000);
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
        duration: 1.1,
        smoothWheel: true,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });

      const raf = (time) => {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);
    } catch (err) {
      console.warn('[Lenis] disabled', err);
    }

    return () => {
      cancelAnimationFrame(rafId);
      lenis?.destroy?.();
    };
  }, [reducedMotion]);

  return (
    <>
      <Loader ready={ready} />

      <WebGLCanvas reducedMotion={reducedMotion} isMobile={isMobile} />

      <Navigation />

      <main className="page-root">
        <Sections />
      </main>
    </>
  );
}
