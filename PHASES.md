# Build phases

## Phase 1–14 ✅
Foundation through responsive mobile/tablet

## Phase 15 — WebGL optimization ✅
- `src/lib/perf.js` — FPS EMA + adaptive density (no React setState)
- `mesh.count` scales down under load (35%–100%)
- Shared triangle `BufferGeometry`
- GPU idle noise via `onBeforeCompile` GLSL
- Colors updated only when morph changes
- Stride-2 particle updates when density &lt; 0.6
- Glow auto-disabled under FPS stress
- Materials disposed on unmount; geometry shared
- Dev-only `PerfMonitor` HUD (`import.meta.env.DEV`)
- Targets: ~60 FPS desktop, 30+ mobile
