# Build phases

## Phase 1–9 ✅
Foundation through lightbulb form + editorial sections

## Phase 10 — Continuous experience ✅
- Single master timeline (`src/lib/timeline.js`) — configurable keyframes
- Central `sceneState`
- One ScrollTrigger updates sceneState; WebGL only reads it

## Phase 11 — Typographic motion ✅
- `useEditorialMotion` — slow premium GSAP
- Hero line-stagger + scroll drift
- Headings: weight 400, `clamp(4rem, 7vw, 8rem)`

## Phase 12 — Cinematic camera ✅
- `CAMERA_KEYS` + damped `CameraController`
- Reversible scroll-driven path

## Phase 13 — Particle color language ✅
- `src/scenes/colorField.js` — spatial fields (not random equal-prob)
- Palette: #FFF #F5C400 #8B5CF6 #6366F1 #06B6D4 #22C55E #EC4899
- Top: yellow/white · Mid: white/purple/cyan · Lower: yellow/purple/blue · Core: near-white
- Sparse magenta/green accents only
- Soft additive glow layer (~12% brightest particles) — no full-scene bloom
- Floating field uses same quiet language; black background stays pure
