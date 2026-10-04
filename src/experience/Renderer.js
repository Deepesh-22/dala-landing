import * as THREE from 'three';

export default class Renderer {
  constructor({ canvas, sizes }) {
    this.instance = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.instance.setClearColor(0x000000, 1);
    this.instance.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.instance.setSize(sizes.width, sizes.height);
    this.instance.outputColorSpace = THREE.SRGBColorSpace;
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.instance.setSize(w, h);
    this.instance.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  update(scene, camera) {
    this.instance.render(scene, camera);
  }

  dispose() {
    this.instance.dispose();
  }
}
