import { useEffect } from 'react';
import { setPointer, clearPointer } from '../lib/interactionState.js';

/**
 * Phase 16 — track pointer as normalized −1…1.
 * Disabled under reduced motion / coarse pointers (touch-first).
 */
export function usePointerInteraction({ reducedMotion = false } = {}) {
  useEffect(() => {
    if (reducedMotion) return undefined;

    // Skip fine pointer tracking on pure touch devices
    const fine = window.matchMedia('(pointer: fine)').matches;
    if (!fine) return undefined;

    const onMove = (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -((e.clientY / window.innerHeight) * 2 - 1);
      setPointer(nx, ny);
    };

    const onLeave = () => {
      clearPointer();
      setPointer(0, 0);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', onLeave, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
      clearPointer();
    };
  }, [reducedMotion]);
}
