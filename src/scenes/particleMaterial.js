import * as THREE from 'three';

/**
 * Phase 15 — custom shader for instanced triangles.
 * GPU idle micro-noise so CPU can skip matrix updates when not morphing.
 * Instance color + matrix from InstancedMesh; no per-frame allocations.
 */

const VERT = /* glsl */ `
attribute vec3 instanceColorAttr;

uniform float uTime;
uniform float uNoiseAmp;
uniform float uOpacity;

varying vec3 vColor;
varying float vAlpha;

// Cheap hash noise
float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

void main() {
  vColor = instanceColorAttr;
  vAlpha = uOpacity;

  // instanceMatrix is injected by Three.js for InstancedMesh
  vec3 transformed = position;

  // Extract instance translation for stable noise seed
  vec3 ip = vec3(instanceMatrix[3].xyz);
  float seed = hash(ip.x * 12.9898 + ip.y * 78.233 + ip.z * 37.719);

  // GPU idle drift — only when uNoiseAmp > 0
  if (uNoiseAmp > 0.0001) {
    float t = uTime;
    transformed.x += sin(t * 0.45 + seed * 6.28) * uNoiseAmp * (seed - 0.5);
    transformed.y += cos(t * 0.38 + seed * 4.0) * uNoiseAmp * 0.8;
  }

  vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(transformed, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const FRAG = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;

void main() {
  gl_FragColor = vec4(vColor, vAlpha);
}
`;

export function createParticleMaterial({ opacity = 0.88, additive = false } = {}) {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uNoiseAmp: { value: 0.006 },
      uOpacity: { value: opacity },
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
    wireframe: true,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  return mat;
}

/**
 * InstancedMesh needs instanceColor as attribute named for our shader.
 * Three's setColorAt writes to instanceColor — we alias in onBeforeCompile
 * or copy into custom attribute. Simpler: use onBeforeCompile with MeshBasicMaterial.
 *
 * Prefer MeshBasicMaterial + onBeforeCompile for instanceColor compatibility.
 */
export function createParticleBasicMaterial({ opacity = 0.88, additive = false } = {}) {
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });

  // Inject cheap GPU noise into vertex shader without losing instanceColor
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    shader.uniforms.uNoiseAmp = { value: 0.005 };
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
            transformed.x += sin(uTime * 0.45 + seed * 6.28) * uNoiseAmp * (seed - 0.5);
            transformed.y += cos(uTime * 0.38 + seed * 4.0) * uNoiseAmp * 0.8;
          }
        #endif
        `
      );
  };

  mat.customProgramCacheKey = () => 'dala-particle-noise-v1';
  return mat;
}

export function tickMaterialTime(mat, time, noiseAmp) {
  const shader = mat?.userData?.shader;
  if (!shader) return;
  shader.uniforms.uTime.value = time;
  if (noiseAmp !== undefined) shader.uniforms.uNoiseAmp.value = noiseAmp;
}
