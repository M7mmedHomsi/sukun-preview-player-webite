/**
 * WebGL2 port of the app's silk gradient, `shaders/liquid_gradient.frag` in
 * the Sukun app repo. The body is the app's source verbatim — same noise,
 * warp, octaves, ridge and palette mapping — so the dashboard preview folds
 * the way the phone does. Only the Flutter plumbing differs:
 *
 * - `#version 460 core` + `#include <flutter/runtime_effect.glsl>` become
 *   `#version 300 es`.
 * - `FlutterFragCoord()` is re-created from `gl_FragCoord`, which needs one
 *   extra uniform, `uResolution` (the drawing buffer in device px).
 *
 * If the app's shader changes, re-copy its body here and keep the shim.
 */

/** A full-screen triangle from `gl_VertexID`; no vertex buffers needed. */
export const LIQUID_GRADIENT_VERTEX = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;

export const LIQUID_GRADIENT_FRAGMENT = `#version 300 es

// Liquid "silk" gradient: domain-warped simplex noise mapped onto a
// four-stop palette (Quilez's warp: p -> fbm(p + fbm(p + fbm(p)))). The
// folds come from a ridged copy of the field that darkens the creases
// and lifts the crests. One shader, one palette per exercise.

precision highp float;

uniform vec2 uResolution; // drawing buffer in device px (WebGL only)
uniform vec2 uSize;   // canvas size in logical px
uniform float uTime;  // seconds
uniform float uSeed;  // shifts the noise field so palettes don't share folds
uniform float uScale; // how many "waves" across the width
uniform vec3 uC0;     // palette stops, low -> high
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;

out vec4 fragColor;

// Flutter's FlutterFragCoord() is in logical px with a TOP-left origin;
// gl_FragCoord is in device px from the BOTTOM-left. Flip y and scale down,
// so main() below reads exactly as it does in the app.
vec2 FlutterFragCoord() {
  return vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) * (uSize / uResolution);
}

// ---- 2D simplex noise (Ashima Arts / Stefan Gustavson, MIT) ----
vec3 mod289v3(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289v2(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289v3(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                      -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289v2(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// Three octaves only: the reference frames are smooth silk with two or
// three folds across the width, no fine grain.
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.55;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 3; i++) {
    v += a * snoise(p);
    p = rot * p * 1.9;
    a *= 0.45;
  }
  return v;
}

vec3 palette(float t) {
  t = clamp(t, 0.0, 1.0);
  vec3 c = mix(uC0, uC1, smoothstep(0.0, 0.34, t));
  c = mix(c, uC2, smoothstep(0.33, 0.67, t));
  c = mix(c, uC3, smoothstep(0.66, 1.0, t));
  return c;
}

void main() {
  vec2 uv = FlutterFragCoord().xy / uSize;
  // Aspect-correct so the folds are not stretched on tall phones.
  vec2 p = vec2(uv.x * uSize.x / uSize.y, uv.y) * uScale + uSeed;
  float t = uTime * 0.10;

  vec2 q = vec2(fbm(p + vec2(0.0, t)),
                fbm(p + vec2(5.2, 1.3) - t * 0.7));
  vec2 r = vec2(fbm(p + 1.5 * q + vec2(1.7, 9.2) + 0.35 * t),
                fbm(p + 1.5 * q + vec2(8.3, 2.8) - 0.30 * t));
  float f = fbm(p + 1.3 * r);

  // Soft field drives the colour; a folded copy makes the silk creases.
  float field = 0.5 + 0.7 * f + 0.3 * r.x;
  float ridge = 1.0 - abs(fbm(p * 0.8 + 1.1 * r + vec2(3.1, 7.7)));
  ridge = pow(clamp(ridge, 0.0, 1.0), 2.5);

  vec3 col = palette(field + 0.25 * ridge - 0.1);
  // Creases go darker, crests get a sheen.
  float shade = 0.84 + 0.28 * r.y;
  col *= clamp(shade, 0.6, 1.12);
  col += 0.08 * ridge * ridge;

  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;
