import * as THREE from 'three';

/**
 * Reference fidelity: FILLED triangles (not wireframe).
 * Wireframe produced continuous scribble lines; the real Dala site
 * reads as discrete solid/outline triangles with color variation.
 */

export function createParticleBasicMaterial({
  opacity = 0.92,
  additive = false,
  wireframe = false,
} = {}) {
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe,
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    shader.uniforms.uNoiseAmp = { value: 0.003 };
    mat.userData.shader = shader;

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        /* glsl */ `
        #include <common>
        uniform float uTime;
        uniform float uNoiseAmp;
        float hashNoise(float n) { return fract(sin(n) * 43758.5453123); }
        `
      )
      .replace(
        '#include <begin_vertex>',
        /* glsl */ `
        #include <begin_vertex>
        #ifdef USE_INSTANCING
          vec3 ip = vec3(instanceMatrix[3].xyz);
          float seed = hashNoise(ip.x * 12.9898 + ip.y * 78.233 + ip.z * 37.719);
          if (uNoiseAmp > 0.0001) {
            transformed.x += sin(uTime * 0.4 + seed * 6.28) * uNoiseAmp * (seed - 0.5);
            transformed.y += cos(uTime * 0.32 + seed * 4.0) * uNoiseAmp * 0.7;
          }
        #endif
        `
      );
  };

  mat.customProgramCacheKey = () => `dala-particle-v2-${wireframe ? 'w' : 'f'}`;
  return mat;
}

/** Soft additive layer for sparse highlight particles only */
export function createParticleMaterial(opts = {}) {
  return createParticleBasicMaterial({ ...opts, additive: true, opacity: 0.18 });
}

export function tickMaterialTime(mat, time, noiseAmp) {
  const shader = mat?.userData?.shader;
  if (!shader) return;
  shader.uniforms.uTime.value = time;
  if (noiseAmp !== undefined) shader.uniforms.uNoiseAmp.value = noiseAmp;
}
