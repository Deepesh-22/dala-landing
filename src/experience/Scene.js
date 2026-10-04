import * as THREE from 'three';

export default class Scene {
  constructor() {
    this.instance = new THREE.Scene();
    this.instance.background = new THREE.Color(0x000000);
    this.instance.fog = new THREE.Fog(0x000000, 14, 32);
  }

  add(object) {
    this.instance.add(object);
  }

  update() {}
}
