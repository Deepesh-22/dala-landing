import { useEffect } from 'react';

/** CSS fallback when WebGL is unavailable. */
export default function FallbackVisual({ onMount }) {
  useEffect(() => {
    onMount?.();
  }, [onMount]);

  return (
    <div className="webgl-fallback" aria-hidden="true">
      <div className="webgl-fallback__glow webgl-fallback__glow--a" />
      <div className="webgl-fallback__glow webgl-fallback__glow--b" />
      <div className="webgl-fallback__glow webgl-fallback__glow--c" />
      <div className="webgl-fallback__core" />
    </div>
  );
}
