/**
 * Instanced hollow-triangle shaders.
 * Morph + float + spin on GPU.
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

  float t = uTime * 0.32 + aOffset;
  vec3 drift = vec3(
    sin(t + aSeed * 6.2831) * uFloatAmp,
    cos(t * 1.25 + aSeed * 4.1) * uFloatAmp * 0.9,
    sin(t * 0.75 + aSeed * 9.2) * uFloatAmp
  );

  float mid = sin(m * 3.14159);
  vec3 scatterDir = vec3(aSeed, fract(aSeed * 1.7), fract(aSeed * 2.3)) - 0.5;
  vec3 scatter = scatterDir * mid * 0.32;

  float ang = aSeed * 6.2831 + uTime * 0.08;
  float c = cos(ang);
  float s = sin(ang);
  vec2 lp = position.xy * aScale;
  vec2 rotated = vec2(c * lp.x - s * lp.y, s * lp.x + c * lp.y);

  vec3 world = base + drift + scatter + vec3(rotated, position.z * aScale);

  vec4 mvPos = modelViewMatrix * vec4(world, 1.0);
  gl_Position = projectionMatrix * mvPos;

  vColor = aColor;
  // Keep alpha modest so stacked triangles don't bleach to pure white
  float lum = dot(aColor, vec3(0.299, 0.587, 0.114));
  vAlpha = 0.35 + lum * 0.25;
}
`;

export const particleFragmentShader = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;

void main() {
  gl_FragColor = vec4(vColor, vAlpha);
}
`;
