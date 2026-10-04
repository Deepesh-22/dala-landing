/**
 * GPU vertex animation for instanced wireframe triangles.
 * Breathing / float happens on the GPU — no per-particle JS in the frame loop.
 */
export const particleVertexShader = /* glsl */ `
  attribute vec3 instanceColorAttr;
  attribute float aSeed;
  attribute float aScale;

  varying vec3 vColor;
  varying float vAlpha;

  uniform float uTime;
  uniform float uBreath;
  uniform float uReduced;

  // Cheap hash in shader
  float hash(float n) {
    return fract(sin(n) * 43758.5453);
  }

  void main() {
    vColor = instanceColorAttr;

    float seed = aSeed;
    float t = uTime * (0.35 + seed * 0.4);

    // Organic float — disabled when reduced motion
    float breath =
      (1.0 - uReduced) * uBreath * (
        sin(t + seed * 6.28) * 0.018 +
        sin(t * 1.7 + seed * 12.0) * 0.01
      );

    vec3 transformed = position * aScale;

    // Instance matrix already applied by Three.js for InstancedMesh
    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(transformed, 1.0);

    // Soft radial drift in view space for life
    mvPosition.xyz += vec3(
      sin(t * 0.9 + seed * 4.0),
      cos(t * 1.1 + seed * 3.0),
      sin(t * 0.7 + seed * 5.0)
    ) * breath * 8.0;

    vAlpha = 0.55 + seed * 0.4;

    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const particleFragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    gl_FragColor = vec4(vColor, vAlpha);
  }
`;
