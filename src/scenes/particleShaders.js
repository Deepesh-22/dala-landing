/**
 * Instanced hollow-triangle shaders.
 * Morph + float + spin all on GPU — no per-particle JS loop.
 */

export const particleVertexShader = /* glsl */ `
attribute vec3 aPosA;
attribute vec3 aPosB;
attribute float aSeed;
attribute float aScale;
attribute vec3 aColor;
attribute float aOffset;

uniform float uTime;
uniform float uMorph;
uniform float uFloatAmp;

varying vec3 vColor;
varying float vAlpha;

void main() {
  float m = clamp(uMorph, 0.0, 1.0);
  float e = m * m * (3.0 - 2.0 * m);
  vec3 base = mix(aPosA, aPosB, e);

  float t = uTime * 0.35 + aOffset;
  vec3 drift = vec3(
    sin(t + aSeed * 6.2831) * uFloatAmp,
    cos(t * 1.3 + aSeed * 4.1) * uFloatAmp * 0.85,
    sin(t * 0.7 + aSeed * 9.2) * uFloatAmp
  );

  float mid = sin(m * 3.14159);
  vec3 scatterDir = vec3(aSeed, fract(aSeed * 1.7), fract(aSeed * 2.3)) - 0.5;
  vec3 scatter = scatterDir * mid * 0.35;

  // Spin local triangle in XY
  float ang = aSeed * 6.2831 + uTime * 0.12;
  float c = cos(ang);
  float s = sin(ang);
  vec2 lp = position.xy * aScale;
  vec2 rotated = vec2(c * lp.x - s * lp.y, s * lp.x + c * lp.y);

  vec3 world = base + drift + scatter + vec3(rotated, position.z * aScale);

  vec4 mvPos = modelViewMatrix * vec4(world, 1.0);
  gl_Position = projectionMatrix * mvPos;

  vColor = aColor;
  float lum = dot(aColor, vec3(0.299, 0.587, 0.114));
  vAlpha = 0.28 + lum * 0.55;
}
`;

export const particleFragmentShader = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;

void main() {
  gl_FragColor = vec4(vColor, vAlpha);
}
`;
