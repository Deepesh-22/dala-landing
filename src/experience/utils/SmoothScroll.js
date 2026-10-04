import Lenis from 'lenis';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default class SmoothScroll {
  constructor() {
    this.lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    this.lenis.on('scroll', ScrollTrigger.update);

    this._raf = (time) => {
      this.lenis.raf(time);
      this._id = requestAnimationFrame(this._raf);
    };
    this._id = requestAnimationFrame(this._raf);
  }

  resize() {
    this.lenis?.resize();
  }

  destroy() {
    cancelAnimationFrame(this._id);
    this.lenis?.destroy();
    this.lenis = null;
  }
}
