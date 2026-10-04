/** Soft multicolor field when WebGL is unavailable */
export default function FallbackVisual() {
  return (
    <div className="webgl-fallback" aria-hidden="true">
      <div className="webgl-fallback__glow webgl-fallback__glow--a" />
      <div className="webgl-fallback__glow webgl-fallback__glow--b" />
      <div className="webgl-fallback__glow webgl-fallback__glow--c" />
      <div className="webgl-fallback__core" />
    </div>
  );
}
