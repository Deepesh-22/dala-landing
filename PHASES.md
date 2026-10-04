# Dala Landing — Phase gates

`BUILD_PHASE` in `src/experience/Experience.js` controls what is active.

| Phase | Preview |
|-------|---------|
| **1** | Pure black canvas |
| **2** ← **current** | Multicolored filled triangles, slow rotate |
| **3** | Brain silhouette |
| **4** | Morph physics |
| **5** | Ambient + all shapes |
| **6** | Full scroll page |

## Phase 2 checklist

```bash
git pull
npm install
npm run dev
```

Open http://localhost:5173

- [ ] Pure black background (no purple)
- [ ] Many small **filled triangles** visible (not squares, not points)
- [ ] Multiple colors: yellow, purple, teal, green, white, coral, blue
- [ ] Cloud of particles slowly rotating
- [ ] Loader shows "Phase 2 · Loading" then fades
- [ ] Console: `[Dala] BUILD_PHASE = 2`
- [ ] No errors in console
- [ ] Feels smooth (~60fps)

**When all pass → reply: `Phase 2 pass`**
