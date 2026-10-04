import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Scroll-driven morph story:
 * Hero brain → Manifesto scatter → Bulb → Globe → Abstract → CTA gather
 */
export default class TimelineController {
  constructor({ experience }) {
    this.experience = experience;
    this.particles = experience.particles;
    this.camera = experience.camera;
    this.morph = experience.particles?.morph;

    this.state = {
      rotY: 0,
      scale: 1,
      opacity: 1,
      morphProgress: 0,
      scatter: 0,
      turbulence: 0.07,
      springStrength: 4.6,
      noiseStrength: 0.06,
      gather: 0,
    };

    this._camFrom = 'HERO';
    this._camTo = 'HERO';
    this._camT = 0;
    this._pair = 'brain-brain';
    this.triggers = [];

    this._setup();
  }

  _setPair(from, to) {
    const key = `${from}-${to}`;
    if (this._pair === key) return;
    this._pair = key;
    this.morph?.setPair(from, to);
  }

  _sync() {
    if (!this.morph) return;
    const p = this.morph.params;
    const s = this.state;
    p.morphProgress = s.morphProgress;
    p.scatter = s.scatter;
    p.turbulence = s.turbulence;
    p.springStrength = s.springStrength;
    p.noiseStrength = s.noiseStrength;
  }

  _cam(from, to, t = 0) {
    this._camFrom = from;
    this._camTo = to;
    this._camT = t;
  }

  _setup() {
    const s = this.state;
    const scrub = 1.5;

    this._setPair('brain', 'brain');
    this.morph?.setProgress(0);
    this.camera?.setState('HERO');

    // HERO — solid brain
    const heroTl = gsap.timeline({
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        scrub,
        onEnterBack: () => {
          this._setPair('brain', 'brain');
          s.morphProgress = 0;
          this.morph?.setProgress(0);
        },
        onUpdate: (self) => {
          this._cam('HERO', 'MANIFESTO', self.progress * 0.55);
          this._sync();
        },
      },
    });
    heroTl.fromTo(
      s,
      { rotY: 0, noiseStrength: 0.04, springStrength: 5.5, scatter: 0, scale: 1 },
      {
        rotY: 0.15,
        noiseStrength: 0.06,
        springStrength: 5.0,
        scatter: 0.01,
        scale: 1.02,
        ease: 'none',
        duration: 1,
      },
      0
    );
    this.triggers.push(heroTl.scrollTrigger);

    // MANIFESTO — brain → scatter
    const manTl = gsap.timeline({
      scrollTrigger: {
        trigger: '#manifesto',
        start: 'top 80%',
        end: 'bottom 20%',
        scrub,
        onEnter: () => {
          this._setPair('brain', 'scatter');
          s.morphProgress = 0;
          this.morph?.setProgress(0);
        },
        onEnterBack: () => this._setPair('brain', 'scatter'),
        onLeaveBack: () => {
          this._setPair('brain', 'brain');
          s.morphProgress = 0;
          this.morph?.setProgress(0);
        },
        onUpdate: (self) => {
          this._cam('MANIFESTO', 'FEATURE_01', self.progress * 0.45);
          this._sync();
        },
      },
    });
    manTl
      .fromTo(
        s,
        { morphProgress: 0, scatter: 0.01, springStrength: 5.0, rotY: 0.15 },
        {
          scatter: 0.2,
          springStrength: 2.5,
          noiseStrength: 0.12,
          rotY: 0.35,
          duration: 0.22,
          ease: 'none',
        },
        0
      )
      .to(s, { morphProgress: 1, duration: 0.5, ease: 'none' }, 0.22)
      .to(
        s,
        {
          scatter: 0.1,
          springStrength: 3.4,
          noiseStrength: 0.08,
          rotY: 0.45,
          duration: 0.28,
          ease: 'none',
        },
        0.72
      );
    this.triggers.push(manTl.scrollTrigger);

    // FEATURE 01 — scatter → bulb
    const f1Tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#feature-01',
        start: 'top 80%',
        end: 'bottom top',
        scrub,
        onEnter: () => {
          this._setPair('scatter', 'bulb');
          s.morphProgress = 0;
          this.morph?.setProgress(0);
        },
        onEnterBack: () => this._setPair('scatter', 'bulb'),
        onLeaveBack: () => {
          this._setPair('brain', 'scatter');
          s.morphProgress = 1;
          this.morph?.setProgress(1);
        },
        onUpdate: (self) => {
          this._cam('FEATURE_01', 'FEATURE_02', self.progress * 0.5);
          this._sync();
        },
      },
    });
    f1Tl
      .fromTo(
        s,
        { morphProgress: 0, scatter: 0.1, springStrength: 3.4, rotY: 0.45 },
        {
          scatter: 0.22,
          springStrength: 2.3,
          rotY: 0.6,
          duration: 0.2,
          ease: 'none',
        },
        0
      )
      .to(s, { morphProgress: 1, duration: 0.52, ease: 'none' }, 0.2)
      .to(
        s,
        {
          scatter: 0.02,
          springStrength: 5.2,
          noiseStrength: 0.035,
          rotY: 0.75,
          duration: 0.28,
          ease: 'none',
        },
        0.72
      );
    this.triggers.push(f1Tl.scrollTrigger);

    // FEATURE 02 — bulb → globe
    const f2Tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#feature-02',
        start: 'top 80%',
        end: 'bottom top',
        scrub,
        onEnter: () => {
          this._setPair('bulb', 'globe');
          s.morphProgress = 0;
          this.morph?.setProgress(0);
        },
        onEnterBack: () => this._setPair('bulb', 'globe'),
        onLeaveBack: () => {
          this._setPair('scatter', 'bulb');
          s.morphProgress = 1;
          this.morph?.setProgress(1);
        },
        onUpdate: (self) => {
          this._cam('FEATURE_02', 'FEATURE_03', self.progress * 0.5);
          this._sync();
        },
      },
    });
    f2Tl
      .fromTo(
        s,
        { morphProgress: 0, scatter: 0.02, springStrength: 5.2, rotY: 0.75 },
        {
          scatter: 0.14,
          springStrength: 2.4,
          rotY: 1.0,
          duration: 0.2,
          ease: 'none',
        },
        0
      )
      .to(s, { morphProgress: 1, duration: 0.52, ease: 'none' }, 0.2)
      .to(
        s,
        {
          scatter: 0.015,
          springStrength: 5.0,
          noiseStrength: 0.04,
          rotY: 1.15,
          duration: 0.28,
          ease: 'none',
        },
        0.72
      );
    this.triggers.push(f2Tl.scrollTrigger);

    // FEATURE 03 — globe → abstract
    const f3Tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#feature-03',
        start: 'top 80%',
        end: 'bottom top',
        scrub,
        onEnter: () => {
          this._setPair('globe', 'abstract');
          s.morphProgress = 0;
          this.morph?.setProgress(0);
        },
        onEnterBack: () => this._setPair('globe', 'abstract'),
        onLeaveBack: () => {
          this._setPair('bulb', 'globe');
          s.morphProgress = 1;
          this.morph?.setProgress(1);
        },
        onUpdate: (self) => {
          this._cam('FEATURE_03', 'CTA', self.progress * 0.45);
          this._sync();
        },
      },
    });
    f3Tl
      .fromTo(
        s,
        { morphProgress: 0, scatter: 0.015, springStrength: 5.0, rotY: 1.15 },
        {
          scatter: 0.16,
          springStrength: 2.3,
          rotY: 1.4,
          duration: 0.2,
          ease: 'none',
        },
        0
      )
      .to(s, { morphProgress: 1, duration: 0.52, ease: 'none' }, 0.2)
      .to(
        s,
        {
          scatter: 0.01,
          springStrength: 5.6,
          noiseStrength: 0.03,
          rotY: 1.6,
          duration: 0.28,
          ease: 'none',
        },
        0.72
      );
    this.triggers.push(f3Tl.scrollTrigger);

    // CTA — gather + tighten
    const ctaTl = gsap.timeline({
      scrollTrigger: {
        trigger: '#cta',
        start: 'top 75%',
        end: 'bottom 25%',
        scrub,
        onUpdate: () => {
          this._cam('CTA', 'CTA', 0);
          this._sync();
        },
      },
    });
    ctaTl.fromTo(
      s,
      { gather: 0, scale: 1, springStrength: 5.6, scatter: 0.01 },
      {
        gather: 1,
        scale: 0.86,
        springStrength: 7.2,
        scatter: 0,
        noiseStrength: 0.012,
        ease: 'none',
        duration: 1,
      },
      0
    );
    this.triggers.push(ctaTl.scrollTrigger);

    // Ensure layout + triggers are measured after DOM paint
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });
    setTimeout(() => ScrollTrigger.refresh(), 200);
  }

  update() {
    if (this.camera) {
      if (this._camFrom === this._camTo || this._camT < 0.001) {
        this.camera.setState(this._camFrom);
      } else {
        this.camera.lerpStates(this._camFrom, this._camTo, this._camT);
      }
    }

    const s = this.state;
    if (this.particles) {
      if (this.particles.mesh) {
        this.particles.mesh.scale.setScalar(1.12 * s.scale);
      }
      this.particles._timelineRotY = s.rotY;
      this.particles._timelineOpacity = s.opacity;
      this.particles._timelineGather = s.gather;
    }
    this._sync();
  }

  destroy() {
    this.triggers.forEach((t) => t?.kill());
    this.triggers = [];
    ScrollTrigger.getAll().forEach((t) => t.kill());
  }
}
