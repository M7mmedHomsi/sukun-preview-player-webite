import { portFlutterShader } from "./flutter-port";

/**
 * The voiceover player's `aurora` pattern: soft vertical curtains of light drifting sideways over a deep sky.
 * The app's `shaders/aurora.frag`, VERBATIM, so the preview draws what the
 * phone draws; portFlutterShader() swaps the Flutter plumbing for WebGL2's.
 * If the app's shader changes, paste its new source here.
 */
export const AURORA_FRAGMENT = portFlutterShader(`#version 460 core
#include <flutter/runtime_effect.glsl>

// Aurora: soft curtains of light hanging over a deep sky and drifting
// sideways. Each curtain is a ribbon whose lower edge glows brightest and
// whose light streams upward in faint vertical rays, fading as it rises.
// Three curtains, back to front, sway and slide at their own pace. Same
// uniforms as liquid_gradient.frag, so any player palette plays in it:
// stop 0 is the sky, stops 1..3 the light, brightest at the edge.

precision highp float;

uniform vec2 uSize;   // canvas size in logical px
uniform float uTime;  // seconds (the player runs it at 0.2x)
uniform float uSeed;  // per item, so two voiceovers never share curtains
uniform float uScale; // how many curtains across the width; lower is calmer
uniform vec3 uC0;     // palette stops, deep -> bright
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;

out vec4 fragColor;

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

// One curtain at this pixel: .x its light, .y how near its glowing edge
// (1 at the edge, 0 high up), for the colour. x is aspect-corrected,
// y runs 0 (top) -> 1 (bottom). k picks the curtain, dir its drift.
vec2 curtain(float x, float y, float k, float dir, float t) {
  float s = uSeed + k * 17.3;
  // The folds lean and sway a little with height.
  float sway = 0.06 * snoise(vec2(y * 1.4 + k * 3.7, t * 0.10 + s));
  // Across the width: about three folds at the player's scale.
  float q = (x + sway) * 12.0 * uScale + dir * t * 0.22 + s;

  // Where along the width this curtain shines at all.
  float body = smoothstep(-0.35, 0.50, snoise(vec2(q * 0.45, k * 7.1 + t * 0.05)));

  // Its lower edge: a slow, gentle ripple.
  float edge = 0.42 + 0.13 * k + 0.08 * snoise(vec2(q * 0.30 + 4.0, s + t * 0.06));
  float d = edge - y; // > 0 above the edge
  // Crisp below the edge, a long glow streaming up from it.
  float below = smoothstep(-0.035, 0.0, d);
  float rise = exp(-max(d, 0.0) * (2.3 - 0.3 * k));

  // Vertical rays: noise along x only, stretched tall.
  float rays = snoise(vec2(q * 3.2, k * 3.3 + t * 0.07)) * 0.5 + 0.5;
  rays = 0.45 + 0.55 * rays * rays;

  float light = body * below * rise * rays;
  return vec2(light, exp(-max(d, 0.0) * 6.0));
}

void main() {
  vec2 uv = FlutterFragCoord().xy / uSize;
  float x = uv.x * uSize.x / uSize.y;
  float t = uTime;

  // The sky: the first stop, deepened overhead, lifting toward the horizon.
  vec3 top = uC0 * 0.42;
  vec3 horizon = mix(uC0, uC1, 0.45) * 0.72;
  vec3 col = mix(top, horizon, smoothstep(0.05, 1.0, uv.y));

  // Back to front: dim and high, then lower and brighter.
  vec2 c0 = curtain(x, uv.y, 0.0, 1.0, t);
  vec2 c1 = curtain(x, uv.y, 1.0, -0.7, t);
  vec2 c2 = curtain(x, uv.y, 2.0, 0.5, t);

  // Brightest colour at each glowing edge, cooler as the light rises.
  vec3 l0 = mix(uC1, uC2, c0.y);
  vec3 l1 = mix(uC2, uC3, c1.y * 0.7);
  vec3 l2 = mix(uC1, uC3, c2.y * 0.6);

  // Light adds through a screen blend, so it never clips to white.
  col = 1.0 - (1.0 - col) * (1.0 - l0 * min(c0.x * 1.00, 1.0));
  col = 1.0 - (1.0 - col) * (1.0 - l1 * min(c1.x * 0.95, 1.0));
  col = 1.0 - (1.0 - col) * (1.0 - l2 * min(c2.x * 0.85, 1.0));

  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
