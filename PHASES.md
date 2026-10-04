# Dala Landing — Phase gates

Control progress with `BUILD_PHASE` in `src/experience/Experience.js`.

| Phase | What you should see |
|-------|---------------------|
| **1** | Pure black canvas, loader fades, white text "Black canvas only". No particles. |
| **2** | Multicolored filled triangles floating / forming a cloud |
| **3** | Clear brain silhouette on hero |
| **4** | Smooth spring morph when shapes change |
| **5** | Full sequence + ambient background triangles |
| **6** | Full scroll page, all sections, camera moves |

## How to test

```bash
npm install
npm run dev
```

1. Open http://localhost:5173
2. Confirm the current phase checklist below
3. Reply **"Phase N pass"** so the next phase can be enabled

---

## Phase 1 checklist (current)

- [ ] Page background is pure black (`#000`) — not purple, not gray
- [ ] Full-viewport canvas (no white margins)
- [ ] Loader shows "Phase 1 · Loading" then fades out
- [ ] Hero text: "Black canvas only"
- [ ] Console log: `[Dala] BUILD_PHASE = 1`
- [ ] No WebGL errors in console
- [ ] Resize window → canvas still fills screen

**When all checked → reply: `Phase 1 pass`**
