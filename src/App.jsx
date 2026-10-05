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

  // Lenis + ScrollTrigger must stay in sync or scrub stutters
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

      lenis.on('scroll', ScrollTrigger.update);

      // Tell ScrollTrigger to use Lenis' virtual scroll position
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
      });

      const raf = (time) => {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);

      const onResize = () => {
        lenis.resize();
        ScrollTrigger.refresh();
      };
      window.addEventListener('resize', onResize, { passive: true });

      ScrollTrigger.refresh();

      return () => {
        window.removeEventListener('resize', onResize);
        cancelAnimationFrame(rafId);
        lenis.off('scroll', ScrollTrigger.update);
        lenis.destroy();
        ScrollTrigger.scrollerProxy(document.body, {});
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
