/**
 * Instanced hollow-triangle shaders.
 * Position morph + organic float run on the GPU.
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
  // smoothstep morph
  float e = m * m * (3.0 - 2.0 * m);
  vec3 base = mix(aPosA, aPosB, e);

  // Organic float — unique per particle via seed
  float t = uTime * 0.35 + aOffset;
  vec3 drift = vec3(
    sin(t + aSeed * 6.2831) * uFloatAmp,
    cos(t * 1.3 + aSeed * 4.1) * uFloatAmp * 0.85,
    sin(t * 0.7 + aSeed * 9.2) * uFloatAmp
  );

  // Mid-morph scatter pulse
  float mid = sin(m * 3.14159);
  vec3 scatter = (vec3(aSeed, fract(aSeed * 1.7), fract(aSeed * 2.3)) - 0.5) * mid * 0.35;

  vec3 world = base + drift + scatter;

  // Billboard-ish: keep triangle facing camera roughly via modelView on local verts
  vec4 mvPos = modelViewMatrix * vec4(world, 1.0);
  // Local triangle scaled in view space so size is stable
  mvPos.xyz += position * aScale;

  gl_Position = projectionMatrix * mvPos;

  vColor = aColor;
  // Density falloff: dimmer particles slightly more transparent
  float lum = dot(aColor, vec3(0.299, 0.587, 0.114));
  vAlpha = 0.25 + lum * 0.55;
}
`;

export const particleFragmentShader = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;

void main() {
  gl_FragColor = vec4(vColor, vAlpha);
}
`;
