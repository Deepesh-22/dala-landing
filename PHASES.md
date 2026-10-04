# Dala Landing — Phase gates

`BUILD_PHASE` in `src/experience/Experience.js` controls what is active.

| Phase | Preview |
|-------|---------|
| **1** | Pure black canvas |
| **2** | Multicolored filled triangles, slow rotate |
| **3** | Brain silhouette |
| **4** | Morph physics (auto cycle) |
| **5** ← **current** | Ambient + all shapes |
| **6** | Full scroll page |

## Phase 5 checklist

```bash
git pull
npm install
npm run dev
```

Open http://localhost:5173

- [ ] Console: `[Dala] BUILD_PHASE = 5`
- [ ] **Sparse ambient triangles** drift in the background (never morph)
- [ ] Main form still cycles: brain → scatter → bulb → globe → abstract
- [ ] Ambient stays soft / low-opacity so the hero shape reads clearly
- [ ] No console errors, smooth ~60fps

**When all pass → reply: `Phase 5 pass`**

## Repo

**Deepesh-22/dala-landing**
