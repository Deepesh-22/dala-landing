import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { perf, sampleFrame } from '../lib/perf.js';

/**
 * Dev-only FPS sampler + optional HUD.
 * Zero React setState — DOM textContent only.
 * Tree-shaken path: parent should not mount in production.
 */
export default function PerfMonitor({ isMobile = false }) {
  const elRef = useRef(null);

  useEffect(() => {
    if (!perf.showMonitor) return undefined;

    const el = document.createElement('div');
    el.setAttribute('data-perf-monitor', '');
    el.style.cssText =
      'position:fixed;bottom:10px;left:10px;z-index:9999;font:11px/1.4 ui-monospace,monospace;color:rgba(255,255,255,0.55);background:rgba(0,0,0,0.55);padding:6px 8px;border-radius:4px;pointer-events:none;';
    el.textContent = 'FPS —';
    document.body.appendChild(el);
    elRef.current = el;

    return () => {
      el.remove();
      elRef.current = null;
    };
  }, []);

  useFrame(({ clock }) => {
    sampleFrame(clock.elapsedTime * 1000, isMobile);

    if (elRef.current && perf.samples % 10 === 0) {
      elRef.current.textContent = `FPS ${perf.fps.toFixed(0)}  ·  dens ${(perf.density * 100).toFixed(0)}%`;
    }
  });

  return null;
}
