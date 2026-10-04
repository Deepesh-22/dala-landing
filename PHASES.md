# Dala Landing — Build Phases

Build and verify in order. Each phase must look correct before moving on.

## Phase 1 — Foundation
- [x] Vite + React shell
- [x] Full-viewport black canvas (`#000`)
- [x] Three.js Scene / Camera / Renderer
- [x] Fixed canvas behind scroll content
- [x] Loader overlay

**Check:** Black screen, no purple wash, canvas fills viewport.

## Phase 2 — Triangle particles + color
- [x] Filled triangle InstancedMesh (not boxes/points)
- [x] 8-color Dala palette per particle
- [x] Adaptive count (4.5k–10k by device)
- [x] Particles readable against pure black

**Check:** Multicolored sharp triangles visible; no lag.

## Phase 3 — Brain shape (hero)
- [x] Procedural brain (hemispheres, fissure, folds, cerebellum)
- [x] Hero opens on solid brain
- [x] Soft idle rotation

**Check:** Clear brain silhouette at top of page.

## Phase 4 — Morph system
- [x] Spring + damping toward target positions
- [x] Noise / scatter during mid-morph
- [x] Settle (high spring, low noise) at shape ends

**Check:** Smooth fluid morph, no snap or jitter.

## Phase 5 — Full shape sequence + ambient
- [x] Scatter, bulb, globe (continents), abstract ribbon
- [x] Ambient floating triangle layer (never morphs)
- [x] Scroll pairs: brain→scatter→bulb→globe→abstract

**Check:** Each section shows the right form; background particles drift.

## Phase 6 — Scroll page + polish
- [x] Lenis smooth scroll + GSAP ScrollTrigger
- [x] Section copy + CTA
- [x] Camera states per section
- [ ] Optional: mouse parallax, text reveal, post-FX

**Check:** Full scroll story matches Dala manifesto feel.

---

Run: `npm install && npm run dev`
