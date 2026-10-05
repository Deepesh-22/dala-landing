# Build phases

## Phase 1–9 ✅
Foundation through lightbulb form + editorial sections

## Phase 10 — Continuous experience ✅
- Single master timeline (`src/lib/timeline.js`) — configurable keyframes
- Central `sceneState`:
  progress, morph, shape, camera, object,
  particleDensity, particleSize, colorIntensity,
  rotation, distortion, fieldOpacity
- One ScrollTrigger updates sceneState; WebGL only reads it
- Black background + fixed canvas throughout — no hard cuts / cards / white sections

### Timeline (edit in timeline.js)
| Progress | Beat |
|----------|------|
| 0.00–0.15 | Hero brain |
| 0.15–0.28 | Brain rotation / camera |
| 0.28–0.40 | Brain dissolves |
| 0.40–0.52 | Abstract structure |
| 0.52–0.64 | Manifesto text focus |
| 0.64–0.78 | Morph toward bulb |
| 0.78–0.90 | Lightbulb hold |
| 0.90–1.00 | Structure / CTA |

## Phase 11 — Typographic motion ✅
- `useEditorialMotion` — slow premium GSAP (power2/power3, no bounce/elastic)
- Hero: line-stagger entrance + subtle scroll drift
- Manifesto / Bulb / Section: scroll-linked opacity, y, light scale
- Headings: `font-weight: 400`, tight leading, `clamp(4rem, 7vw, 8rem)` on hero
- Reduced-motion: all text visible, no transforms

## Phase 12 — Cinematic camera ✅
- `CAMERA_KEYS` in timeline.js — hero wide → closer → through field → bulb → pullback
- `CameraController.jsx` — position / lookAt / fov lerp with frame-rate-independent damping
- Fully reversible on scroll up (targets from progress only)
- Subtle idle micro-drift; mobile FOV/Z scale
- Object group also damped in ParticleScene
