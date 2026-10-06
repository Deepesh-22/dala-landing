import * as THREE from 'three';

/**
 * Simple solid triangle material — matches dala.craftedbygc.com look.
 * No custom shader hacks (those broke rendering).
 * vertexColors + instanceColor = multi-hue mosaic.
 */
export function createParticleBasicMaterial({
  opacity = 0.95,
  additive = false,
} = {}) {
  return new THREE.MeshBasicMaterial({
    color: 0xffffff,
    vertexColors: true,
    wireframe: false,
    transparent: true,
    opacity,
    depthWrite: !additive,
    depthTest: true,
    side: THREE.DoubleSide,
    toneMapped: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
}

export function createParticleMaterial(opts = {}) {
  return createParticleBasicMaterial({ ...opts, additive: true, opacity: 0.08 });
}

export function tickMaterialTime() {
  // no-op — no custom uniforms
}
