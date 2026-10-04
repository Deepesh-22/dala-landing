# Dala Landing — Phases

## Phase 1 ← current — Project foundation

Architecture only. **No final particle visual yet.**

```bash
git pull
npm install
npm run dev
```

Open http://localhost:5173

### Checklist

- [ ] Pure black full-viewport background
- [ ] Fixed WebGL canvas (`position: fixed`, does not scroll away)
- [ ] HTML sections scroll above the canvas
- [ ] Minimal nav (Home / Manifesto / Contact)
- [ ] Editorial Inter typography (light weight titles)
- [ ] Lenis smooth scroll (off if `prefers-reduced-motion`)
- [ ] DPR capped ≤ 1.75
- [ ] No console errors after `npm install && npm run dev`

**When all pass → reply: `Phase 1 pass`**

### Structure

```
src/
  components/ Navigation, Hero, WebGL, Sections, UI
  scenes/     ParticleScene, ParticleSystem, ShapeController, CameraController
  data/       sections.js
  hooks/      useScrollProgress, useResponsive
  styles/     globals.css
```

### Stack

React · Vite · Three · R3F · Drei · GSAP · Lenis · lucide-react

### Legacy

Previous vanilla `src/experience/` kept in repo for reference; App no longer mounts it.
