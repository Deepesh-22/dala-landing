# Dala Landing — Phase gates

`BUILD_PHASE` in `src/experience/Experience.js` controls what is active.

| Phase | Preview |
|-------|---------|
| **1** | Pure black canvas |
| **2** | Multicolored filled triangles, slow rotate |
| **3** | Brain silhouette |
| **4** | Morph physics (auto cycle) |
| **5** | Ambient + all shapes |
| **6** ← **current** | Full scroll page |

## Phase 6 checklist

```bash
git pull
npm install
npm run dev
```

Open http://localhost:5173 and **scroll slowly**.

- [ ] Console: `[Dala] BUILD_PHASE = 6`
- [ ] Smooth scroll (Lenis)
- [ ] **Hero** → brain silhouette + “Your mind is the map”
- [ ] **Manifesto** → particles scatter
- [ ] **Feature 01** → light bulb
- [ ] **Feature 02** → globe
- [ ] **Feature 03** → abstract ribbon
- [ ] **CTA** → particles gather / tighten
- [ ] Camera shifts per section
- [ ] Ambient drift still visible in background
- [ ] No hard snaps; spring morph throughout
- [ ] Smooth ~60fps, no console errors

**When all pass → reply: `Phase 6 pass`**

## Scroll story

```
HERO        brain
MANIFESTO   brain → scatter
FEATURE 01  scatter → bulb
FEATURE 02  bulb → globe
FEATURE 03  globe → abstract
CTA         gather
```

## Repo

**Deepesh-22/dala-landing**
