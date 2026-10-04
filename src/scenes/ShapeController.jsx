/**
 * Placeholder for scroll-driven morph (Phase 6+).
 * Exposes shape name for ParticleSystem.
 */
export default function ShapeController({ shape = 'brain', children }) {
  return children?.(shape) ?? null;
}
