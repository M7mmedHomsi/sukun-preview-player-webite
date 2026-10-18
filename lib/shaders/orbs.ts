import { portFlutterShader } from "./flutter-port";

/**
 * The voiceover player's `orbs` pattern: large soft bokeh circles floating slowly over a deep wash.
 * The app's `shaders/orbs.frag`, VERBATIM, so the preview draws what the
 * phone draws; portFlutterShader() swaps the Flutter plumbing for WebGL2's.
 * If the app's shader changes, paste its new source here.
 */
export const ORBS_FRAGMENT = portFlutterShader(`#version 460 core
#include <flutter/runtime_effect.glsl>

// Orbs: large soft bokeh circles floating slowly over a deep wash, like
// lights seen out of focus. Near orbs are big and soft, far ones smaller
// and a little crisper; each wanders its own slow loop and breathes, and
// where they overlap they glow together. Same uniforms as
// liquid_gradient.frag: stops 0..1 are the wash, stops 1..3 the light.

precision highp float;

uniform vec2 uSize;   // canvas size in logical px
uniform float uTime;  // seconds (the player runs it at 0.2x)
uniform float uSeed;  // per item: where the orbs sit and how they drift
uniform float uScale; // orb density; lower is bigger, calmer orbs
uniform vec3 uC0;     // palette stops, deep -> bright
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;

out vec4 fragColor;

const int ORBS = 7;

// A sine-free hash (Dave Hoskins, MIT): only multiplies and fract on small
// numbers, so every GPU lands on the same value. fract(sin(x) * 43758) does
// not: sin of a large argument differs between GPUs, and the orbs on the
// phone would sit elsewhere than in the dashboard's preview.
float hash(float n) {
  float p = fract((n + fract(uSeed * 0.0137) * 97.0) * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

vec3 orbColour(float pick) {
  if (pick < 0.45) return uC1;
  if (pick < 0.80) return uC2;
  return uC3;
}

void main() {
  vec2 uv = FlutterFragCoord().xy / uSize;
  float aspect = uSize.x / uSize.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  float t = uTime;

  // The wash: the deep stop overhead, easing into the next toward the floor.
  vec3 col = mix(uC0 * 0.55, mix(uC0, uC1, 0.60) * 0.68, smoothstep(0.0, 1.0, uv.y));

  // Bigger orbs at the player's scale (0.5), smaller on busier screens.
  float size = 0.5 / max(uScale, 0.1);

  for (int i = 0; i < ORBS; i++) {
    float fi = float(i);
    // 0 far .. 1 near: near orbs are bigger, softer and fainter.
    float depth = hash(fi + 5.0);
    vec2 home = vec2(
      (0.08 + 0.84 * hash(fi)) * aspect,
      0.06 + 0.88 * hash(fi + 17.0)
    );
    float speed = 0.18 + 0.22 * hash(fi + 31.0);
    float phase = 6.2831 * hash(fi + 43.0);
    vec2 wander = vec2(
      0.07 * sin(t * speed + phase),
      0.09 * cos(t * speed * 0.71 + phase * 1.7)
    ) * (0.6 + 0.6 * depth);
    vec2 centre = home + wander;

    float r = mix(0.07, 0.19, depth) * size;
    r *= 1.0 + 0.05 * sin(t * 0.45 + phase);

    float d = length(p - centre);
    float blur = mix(0.10, 0.35, depth);
    // A soft-edged disc, a slightly brighter rim, and a faint halo.
    float disc = smoothstep(r, r * (1.0 - blur), d);
    float rim = smoothstep(r * (0.55 - blur * 0.5), r * 0.95, d) * disc;
    float halo = exp(-(d * d) / (r * r) * 2.2);
    float a = 0.42 * disc + 0.12 * rim + 0.12 * halo;
    a *= mix(1.0, 0.75, depth);

    vec3 light = orbColour(hash(fi + 71.0));
    // Mostly the orb's own colour, so it stays saturated; a little
    // screen on top, so overlapping orbs glow together without clipping.
    col = mix(col, light, a * 0.75);
    col = 1.0 - (1.0 - col) * (1.0 - light * a * 0.30);
  }

  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
