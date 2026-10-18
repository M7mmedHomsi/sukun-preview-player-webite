import { AURORA_FRAGMENT } from "./aurora";
import { LIQUID_GRADIENT_FRAGMENT, LIQUID_GRADIENT_VERTEX } from "./liquid-gradient";
import { ORBS_FRAGMENT } from "./orbs";
import { WAVES_FRAGMENT } from "./waves";

/**
 * The app player's animated gradient on the web. The four patterns are the
 * app's own fragment shaders (`shaders/*.frag` in the Sukun app repo),
 * ported to WebGL2 exactly as the dashboard's preview does (these files
 * are copied from sukun-dashboard/lib/shaders). Every pattern takes the
 * same uniforms, so one draw call feeds them all.
 */
export const PATTERNS = ["silk", "aurora", "orbs", "waves"] as const;
export type Pattern = (typeof PATTERNS)[number];

const FRAGMENTS: Record<Pattern, string> = {
  silk: LIQUID_GRADIENT_FRAGMENT,
  aurora: AURORA_FRAGMENT,
  orbs: ORBS_FRAGMENT,
  waves: WAVES_FRAGMENT,
};

/**
 * The player's motion. These MUST match `_Silk.scale` / `_Silk.speed` in
 * the app's lib/features/player/view/widgets/player_backdrop.dart.
 */
export const SILK_SCALE = 0.5;
export const SILK_SPEED = 0.2;

export function isPattern(value: unknown): value is Pattern {
  return typeof value === "string" && (PATTERNS as readonly string[]).includes(value);
}

function compile(gl: WebGL2RenderingContext, type: GLenum, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

/** The linked program for [pattern], or null when the browser can't build it. */
export function linkPattern(gl: WebGL2RenderingContext, pattern: Pattern): WebGLProgram | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, LIQUID_GRADIENT_VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENTS[pattern]);
  if (!vertex || !fragment) return null;
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
  gl.deleteProgram(program);
  return null;
}

/** `#RRGGBB` → RGB in 0..1, the shader's colour uniforms. */
export function hexToRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** Draws one frame. `program` must be in use. */
export function drawFrame(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  frame: {
    /** Drawing buffer, device px. */
    width: number;
    height: number;
    /** CSS px, as the app passes logical px. */
    logicalWidth: number;
    logicalHeight: number;
    time: number;
    seed: number;
    stops: readonly string[];
  },
) {
  const at = (name: string) => gl.getUniformLocation(program, name);
  gl.viewport(0, 0, frame.width, frame.height);
  gl.uniform2f(at("uResolution"), frame.width, frame.height);
  gl.uniform2f(at("uSize"), frame.logicalWidth, frame.logicalHeight);
  gl.uniform1f(at("uTime"), frame.time);
  gl.uniform1f(at("uSeed"), frame.seed);
  gl.uniform1f(at("uScale"), SILK_SCALE);
  ["uC0", "uC1", "uC2", "uC3"].forEach((name, i) => gl.uniform3fv(at(name), hexToRgb(frame.stops[i])));
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}
