# Dala Landing

Exact Dala-style particle morph landing page.

## Features

- **Pure black background** (`#000`)
- **Filled triangular particles** (not boxes/points)
- **8-color Dala palette**: yellow, light purple, purple, teal, green, white, coral, blue
- **Morph sequence** (scroll-driven):
  1. Brain (hero)
  2. Scatter (manifesto)
  3. Lightbulb (insight)
  4. Globe with continents (scale)
  5. Abstract organic ribbon (flow / CTA)
- **Ambient floating layer** — sparse triangles always in the background
- **Spring + noise morph physics** with settle phases
- **Lenis smooth scroll** + GSAP ScrollTrigger

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173 and scroll.

## Stack

- React 18 + Vite
- Three.js (InstancedMesh triangles)
- GSAP + ScrollTrigger
- Lenis

## Reference

Visual target: [dala.craftedbygc.com](https://dala.craftedbygc.com)
