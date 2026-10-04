# Dala Landing — Phase gates

`BUILD_PHASE` in `src/experience/Experience.js` controls what is active.

| Phase | Preview |
|-------|---------|
| **1** | Pure black canvas |
| **2** | Multicolored filled triangles, slow rotate |
| **3** ← **current** | Brain silhouette |
| **4** | Morph physics |
| **5** | Ambient + all shapes |
| **6** | Full scroll page |

## Phase 3 checklist

```bash
git pull
npm install
npm run dev
```

Open http://localhost:5173

- [ ] Pure black background
- [ ] **Clear brain silhouette** (not a round blob)
- [ ] Visible left / right hemispheres + center fissure
- [ ] Cortical folds / surface detail
- [ ] Multicolored filled triangles still
- [ ] Slow continuous rotation
- [ ] Console: `[Dala] BUILD_PHASE = 3`
- [ ] No console errors
- [ ] Smooth ~60fps

**When all pass → reply: `Phase 3 pass`**

## Repo

Working repo: **Deepesh-22/dala-landing** (not Vansh eduroute).
