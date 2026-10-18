import { portFlutterShader } from "./flutter-port";

/**
 * The voiceover player's `waves` pattern: layered horizontal soft waves rising and falling, far to near.
 * The app's `shaders/waves.frag`, VERBATIM, so the preview draws what the
 * phone draws; portFlutterShader() swaps the Flutter plumbing for WebGL2's.
 * If the app's shader changes, paste its new source here.
 */
export const WAVES_FRAGMENT = portFlutterShader(`#version 460 core
#include <flutter/runtime_effect.glsl>

// Waves: layered horizontal soft waves, far to near, rising and falling
// slowly like a calm sea seen from the shore. Far layers are hazy and
// light, near ones deep; each is lightest at its crest and deepens below
// it, so the layers stand apart. Same uniforms as liquid_gradient.frag:
// stops 2..3 are the haze and the far water, stops 1..0 the near water.

precision highp float;

uniform vec2 uSize;   // canvas size in logical px
uniform float uTime;  // seconds (the player runs it at 0.2x)
uniform float uSeed;  // per item, so no two voiceovers share a swell
uniform float uScale; // how many swells across the width; lower is calmer
uniform vec3 uC0;     // palette stops, deep -> bright
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;

out vec4 fragColor;

const int LAYERS = 5;

// Pale palettes would put a near-white glow right behind the title; cap
// how light the haze and the far water can get, keeping their hue.
vec3 dimTo(vec3 c, float maxLuma) {
  float luma = dot(c, vec3(0.299, 0.587, 0.114));
  return c * min(1.0, maxLuma / max(luma, 0.001));
}

// Far (0) to near (4).
vec3 layerColour(int i) {
  if (i == 0) return dimTo(mix(uC2, uC3, 0.40) * 0.92, 0.66);
  if (i == 1) return mix(uC1, uC2, 0.70);
  if (i == 2) return mix(uC1, uC2, 0.25);
  if (i == 3) return mix(uC0, uC1, 0.55);
  return uC0 * 0.80;
}

// Where layer i's surface sits at x, in uv y (0 top -> 1 bottom).
float surface(int i, float x, float t) {
  float fi = float(i);
  float k = uScale * 2.0; // 1 at the player's scale
  float s = fract(uSeed * 0.0731) * 60.0 + fi * 13.7;
  // Roughly one swell across the width far away, two up close.
  float f = (9.0 + 3.5 * fi) * k;
  float dir = (i == 1 || i == 3) ? -1.0 : 1.0;
  float amp = 0.024 + 0.006 * fi;
  float y = 0.36 + 0.125 * fi;
  // Two swells drifting against each other, so the crest never repeats.
  y += amp * sin(x * f + dir * t * 0.35 + s);
  y += amp * 0.55 * sin(x * f * 1.83 - dir * t * 0.23 + s * 1.9);
  // The whole layer rises and falls, each at its own slow breath.
  y += 0.014 * sin(t * (0.80 + 0.15 * fi) + s * 0.7);
  return y;
}

void main() {
  vec2 uv = FlutterFragCoord().xy / uSize;
  float x = uv.x * uSize.x / uSize.y;
  float t = uTime;

  // Sky: deep overhead, easing to a hazy glow at the horizon.
  vec3 zenith = mix(uC0, uC1, 0.30) * 0.55;
  vec3 haze = dimTo(mix(uC2, uC3, 0.50) * 0.80, 0.58);
  vec3 col = mix(zenith, haze, smoothstep(0.02, 0.40, uv.y));

  for (int i = 0; i < LAYERS; i++) {
    float fi = float(i);
    float y = surface(i, x, t);
    // Softer edges far away, crisper up close.
    float soft = 0.022 - 0.003 * fi;
    float cover = smoothstep(y - soft, y + soft, uv.y);
    // Lightest at the crest, deepening below it.
    float below = smoothstep(y, y + 0.16, uv.y);
    vec3 water = layerColour(i) * (1.06 - 0.30 * below);
    col = mix(col, water, cover);
    // A faint sheen along the crest.
    col += 0.06 * exp(-abs(uv.y - y - 0.010) * 90.0) * cover;
  }

  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
