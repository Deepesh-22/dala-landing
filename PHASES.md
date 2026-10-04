# Dala Landing — Phases

## Phase 3 ← current — Particle engine

```bash
git pull
npm install
npm run dev
```

Open http://localhost:5173

### Checklist

- [ ] Thousands of **tiny hollow triangles** (wireframe), not circles
- [ ] Multicolor palette: white / yellow / purple / blue / cyan / green / magenta
- [ ] Uneven brightness (density field)
- [ ] Default form: **brain-like** silhouette
- [ ] Alive float (subtle motion when idle)
- [ ] Black background, fixed canvas
- [ ] Nav still works above WebGL
- [ ] ~20k–70k particles by device, smooth FPS
- [ ] No console errors

**When all pass → reply: `Phase 3 pass`**

---

## Phase 2 — Navigation ✅
## Phase 1 — Foundation ✅

### Engine files

- `src/scenes/ParticleSystem.jsx` — InstancedMesh + GPU shaders
- `src/scenes/shapes.js` — sphere / brain / bulb / scatter / abstract
- `src/scenes/particleShaders.js` — morph + float on GPU
