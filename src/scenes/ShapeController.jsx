import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';

/**
 * Phase 3: hold on brain with idle float (GPU).
 * Later phases drive morphProgress from scroll.
 */
export default function ShapeController({ onState }) {
  const state = useRef({
    shapeA: 'brain',
    shapeB: 'brain',
    morphProgress: 0,
  });

  useFrame(() => {
    onState?.(state.current);
  });

  return null;
}
