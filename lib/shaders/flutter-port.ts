/**
 * Turns one of the app's Flutter fragment shaders (`shaders/*.frag` in the
 * Sukun app repo) into a WebGL2 one, so each pattern file here holds the
 * app's source VERBATIM and the port is mechanical:
 *
 * - `#version 460 core` + `#include <flutter/runtime_effect.glsl>` become
 *   `#version 300 es`.
 * - `FlutterFragCoord()` is re-created from `gl_FragCoord`. It needs one
 *   extra uniform, `uResolution` (the drawing buffer in device px), and reads
 *   `uSize`, so it goes right after `out vec4 fragColor;`, below the
 *   shader's own uniforms.
 *
 * If the app's shader changes, paste its new source into the pattern file.
 * (lib/shaders/liquid-gradient.ts predates this helper and carries the same
 * shim by hand.)
 */

const FLUTTER_HEADER = /^\s*#version 460 core\s*\n\s*#include <flutter\/runtime_effect\.glsl>\s*\n/;

const OUTPUT = "out vec4 fragColor;";

const SHIM = `
uniform vec2 uResolution; // drawing buffer in device px (WebGL only)

// Flutter's FlutterFragCoord() is in logical px with a TOP-left origin;
// gl_FragCoord is in device px from the BOTTOM-left. Flip y and scale down,
// so main() reads exactly as it does in the app.
vec2 FlutterFragCoord() {
  return vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) * (uSize / uResolution);
}
`;

export function portFlutterShader(source: string): string {
  if (!FLUTTER_HEADER.test(source)) {
    throw new Error("Not a Flutter runtime effect: expected #version 460 core and the Flutter include.");
  }
  const at = source.indexOf(OUTPUT);
  if (at < 0) throw new Error(`The shader must declare \`${OUTPUT}\`.`);
  const body = `${source.slice(0, at + OUTPUT.length)}\n${SHIM}${source.slice(at + OUTPUT.length)}`;
  return body.replace(FLUTTER_HEADER, "#version 300 es\n");
}
