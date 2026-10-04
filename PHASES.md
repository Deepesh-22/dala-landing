# Dala Landing — Phase gates

`BUILD_PHASE` in `src/experience/Experience.js` controls what is active.

| Phase | Preview |
|-------|---------|
| **1** | Pure black canvas |
| **2** | Multicolored filled triangles, slow rotate |
| **3** | Brain silhouette |
| **4** ← **current** | Morph physics (auto cycle) |
| **5** | Ambient + all shapes |
| **6** | Full scroll page |

## Phase 4 checklist

```bash
git pull
npm install
npm run dev
```

Open http://localhost:5173

- [ ] Console: `[Dala] BUILD_PHASE = 4`
- [ ] Starts as **brain**, holds briefly
- [ ] Morphs to **scatter** (particles expand / dissolve mid-way)
- [ ] Then **bulb** → **globe** → **abstract** → back to **brain**
- [ ] **No hard snap** — spring + damping, settles at each shape
- [ ] Mid-morph: visible scatter + turbulence
- [ ] Ends of morph: calm, shape readable
- [ ] Smooth ~60fps, no console errors

**When all pass → reply: `Phase 4 pass`**

## Repo

**Deepesh-22/dala-landing**
