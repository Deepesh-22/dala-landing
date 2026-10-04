# Build phases

## Phase 1 — Foundation ✅
- Vite + React + Three + R3F + GSAP + Lenis
- Full-viewport black site
- Fixed WebGL canvas (z-index 0)
- HTML above canvas
- Smooth scroll, DPR cap, reduced-motion, resize

## Phase 2 — Navigation ✅
- Fixed minimal nav
- Logo left / links + purple CTA right
- Mobile menu button only

## Phase 3 — Particle engine ✅
- InstancedMesh wireframe triangles
- GPU vertex shader breath / float
- Brain shape (dual hemispheres)
- Shape generators: brain, sphere, bulb, scatter, abstract
- Counts: 20k mobile → 70k desktop
- No per-particle JS in rAF

## Next
- Phase 4: GPU simulation / morph between shapes
- Phase 5: mouse interaction
- Phase 6+: scroll choreography
