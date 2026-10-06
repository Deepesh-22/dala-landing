/** Visible soft field when WebGL is unavailable */
export default function FallbackVisual() {
  return (
    <div className="webgl-fallback" aria-hidden="true">
      <div className="webgl-fallback__glow webgl-fallback__glow--a" />
      <div className="webgl-fallback__glow webgl-fallback__glow--b" />
      <div className="webgl-fallback__glow webgl-fallback__glow--c" />
      <div className="webgl-fallback__core" />
      <div
        style={{
          position: 'absolute',
          top: '32%',
          left: '62%',
          transform: 'translate(-50%, -50%)',
          width: 'min(40vw, 360px)',
          height: 'min(34vw, 300px)',
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at 40% 40%, rgba(245,196,0,0.35), rgba(139,92,246,0.25) 45%, transparent 70%)',
          filter: 'blur(28px)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
