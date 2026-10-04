# Dala Landing

Experimental creative WebGL site — black canvas, editorial type, scroll-driven particles.

## Phase 1 — Foundation

- Full-screen black (`#000`)
- Fixed WebGL canvas (R3F)
- Scrollable HTML above canvas
- Lenis smooth scroll
- DPR cap, reduced-motion, responsive hooks
- **No particle artwork yet**

## Run

```bash
npm install
npm run dev
```

http://localhost:5173

## Stack

- React 18 + Vite
- Three.js + @react-three/fiber + @react-three/drei
- GSAP + Lenis
- lucide-react (icons when needed)
