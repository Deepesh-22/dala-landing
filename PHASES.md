# Build phases

## Phase 1–15 ✅
Foundation through WebGL optimization

## Phase 16 — Micro interactions ✅
- Pointer parallax on particle group (desktop, damped, max ~0.12u)
- Soft tilt toward cursor
- Per-particle proximity nudge (seed-weighted, very small)
- Scroll velocity → stronger noise/scatter; settles when scroll stops
- CTA: scale 1.045 + brightness + soft purple glow
- Nav links: opacity + underline scaleX indicator
- Touch devices: pointer parallax disabled (`pointer: fine` only)
- Reduced-motion: all interaction off
