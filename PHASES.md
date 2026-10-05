# Build phases

## Phase 1–16 ✅
Foundation through micro interactions

## Phase 18 — Final QA ✅
### Fixed
- Lenis ↔ ScrollTrigger (`scrollerProxy` + `lenis.on('scroll', ScrollTrigger.update)`)
- Mobile nav panel (button worked, panel was never rendered)
- Body scroll lock + Escape while menu open
- Orientationchange → resize for WebGL
- `gl.setPixelRatio` capped on create
- Meta description + viewport-fit
- Code-split three / gsap chunks

### Verified
- `npm run build` succeeds
- No StrictMode double WebGL mount
- overflow-x hidden on html/body
- Reduced motion path intact
- Scroll reverse uses same timeline (deterministic progress)
- Architecture unchanged — bugfixes only
