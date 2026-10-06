import { useEffect, useState } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navigation from './components/Navigation/Navigation.jsx';
import WebGLCanvas from './components/WebGL/WebGLCanvas.jsx';
import Sections from './components/Sections/Sections.jsx';
import Loader from './components/UI/Loader.jsx';
import { useResponsive } from './hooks/useResponsive.js';
import { useMorphScroll } from './hooks/useMorphScroll.js';
import { usePointerInteraction } from './hooks/usePointerInteraction.js';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const { reducedMotion } = useResponsive();
  const [ready, setReady] = useState(false);

  useMorphScroll({ reducedMotion });
  usePointerInteraction({ reducedMotion });

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 600);
    const hard = setTimeout(() => setReady(true), 2500);
    return () => {
      clearTimeout(t);
      clearTimeout(hard);
    };
  }, []);

  /**
   * Phase H — Lenis + ScrollTrigger integration
   * 1. lenis.on('scroll', ScrollTrigger.update)
   * 2. scrollerProxy so scrub uses Lenis position
   * 3. resize + orientationchange → lenis.resize + ScrollTrigger.refresh
   */
  useEffect(() => {
    if (reducedMotion) return undefined;

    let lenis;
    let rafId = 0;
    try {
      lenis = new Lenis({
        duration: 1.15,
        smoothWheel: true,
        touchMultiplier: 1.4,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });

      // (1) Keep ScrollTrigger in sync with Lenis
      lenis.on('scroll', ScrollTrigger.update);

      // (2) scrollerProxy — ScrollTrigger reads Lenis virtual scroll
      ScrollTrigger.scrollerProxy(document.body, {
        scrollTop(value) {
          if (arguments.length) {
            lenis.scrollTo(value, { immediate: true });
          }
          return lenis.scroll;
        },
        getBoundingClientRect() {
          return {
            top: 0,
            left: 0,
            width: window.innerWidth,
            height: window.innerHeight,
          };
        },
        // Helps pin/scrub on mobile with transform scroll
        pinType: document.body.style.transform ? 'transform' : 'fixed',
      });

      ScrollTrigger.defaults({ scroller: document.body });

      const raf = (time) => {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);

      // (3) resize + orientationchange
      const onResize = () => {
        lenis.resize();
        ScrollTrigger.refresh();
        window.dispatchEvent(new Event('webgl-resize'));
      };

      window.addEventListener('resize', onResize, { passive: true });
      window.addEventListener('orientationchange', onResize, { passive: true });

      // Initial + delayed refresh (fonts / layout settle)
      ScrollTrigger.refresh();
      const t1 = setTimeout(() => ScrollTrigger.refresh(), 200);
      const t2 = setTimeout(() => ScrollTrigger.refresh(), 800);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        window.removeEventListener('resize', onResize);
        window.removeEventListener('orientationchange', onResize);
        cancelAnimationFrame(rafId);
        lenis.off('scroll', ScrollTrigger.update);
        lenis.destroy();
        ScrollTrigger.scrollerProxy(document.body, {});
        ScrollTrigger.defaults({ scroller: window });
      };
    } catch (e) {
      console.warn('[Lenis]', e);
      return undefined;
    }
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
