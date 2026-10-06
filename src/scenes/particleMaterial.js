import * as THREE from 'three';

/**
 * Hollow pyramid particles — wireframe outline of tetrahedron edges.
 * Transparent, depth-aware, no white overdraw blast.
 */

export function createParticleBasicMaterial({
  opacity = 0.9,
  additive = false,
  wireframe = true, // HOLLOW by default
} = {}) {
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: !!wireframe,
    transparent: true,
    opacity,
    depthWrite: !additive && !wireframe,
    depthTest: true,
    side: THREE.DoubleSide,
    toneMapped: false,
    alphaTest: additive ? 0.02 : wireframe ? 0.05 : 0.08,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    shader.uniforms.uNoiseAmp = { value: 0.0015 };
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
            transformed.x += sin(uTime * 0.3 + seed * 6.28) * uNoiseAmp * (seed - 0.5);
            transformed.y += cos(uTime * 0.25 + seed * 4.0) * uNoiseAmp * 0.5;
          }
        #endif
        `
      );
  };

  mat.customProgramCacheKey = () =>
    `dala-hollow-pyr-v1-${wireframe ? 'w' : 'f'}-${additive ? 'a' : 'n'}`;
  return mat;
}

export function createParticleMaterial(opts = {}) {
  return createParticleBasicMaterial({
    ...opts,
    additive: true,
    opacity: 0.1,
    wireframe: true,
  });
}

export function tickMaterialTime(mat, time, noiseAmp) {
  const shader = mat?.userData?.shader;
  if (!shader) return;
  shader.uniforms.uTime.value = time;
  if (noiseAmp !== undefined) shader.uniforms.uNoiseAmp.value = noiseAmp;
}
