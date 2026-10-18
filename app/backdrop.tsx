"use client";

import { useEffect, useRef } from "react";
import type { Look } from "@/lib/share";
import { drawFrame, linkPattern, SILK_SPEED } from "@/lib/shaders/patterns";

/**
 * What sits behind the player, as in the app (`PlayerBackdrop`): a
 * meditation's animated gradient in its own colours, pattern and seed, or
 * for Sleep Frequencies and White Sounds their cover, blurred and slowly
 * drifting. Both under the app's scrim, so the white type always reads.
 */
export function Backdrop({ look }: { look: Look }) {
  return (
    <div className="backdrop" aria-hidden="true">
      {look.kind === "photo" && look.photo ? <Photo url={look.photo} /> : <Silk look={look} />}
      <div className="scrim" />
    </div>
  );
}

/** The gradient's four stops as a still CSS fallback (no WebGL2). */
function fallback(colours: string[]): string {
  const [a, b, c, d] = colours;
  return `radial-gradient(120% 80% at 20% 10%, ${c} 0%, transparent 60%), radial-gradient(90% 70% at 90% 60%, ${d}55 0%, transparent 55%), linear-gradient(160deg, ${b} 0%, ${a} 55%, ${c} 100%)`;
}

/** Device pixels per CSS pixel for the shader: a soft gradient needs no
 *  more, and phones keep their battery. */
const MAX_DPR = 1.5;

function Silk({ look }: { look: Look }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const gl = el.getContext("webgl2", { alpha: false, antialias: false, depth: false });
    if (!gl) return;
    const program = linkPattern(gl, look.pattern);
    if (!program) return;
    gl.useProgram(program);
    el.dataset.ready = "true";

    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let last = performance.now();
    let time = 0;
    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const w = el.clientWidth;
      const h = el.clientHeight;
      const width = Math.max(1, Math.round(w * dpr));
      const height = Math.max(1, Math.round(h * dpr));
      if (el.width !== width || el.height !== height) {
        el.width = width;
        el.height = height;
      }
      drawFrame(gl, program, {
        width,
        height,
        logicalWidth: w,
        logicalHeight: h,
        time,
        seed: look.seed,
        stops: look.colours,
      });
    };
    const tick = (now: number) => {
      // The app's clock: seconds times the player's speed, paused while
      // the tab is hidden (requestAnimationFrame stops) without a jump.
      time += (Math.min(now - last, 100) / 1000) * SILK_SPEED;
      last = now;
      draw();
      frame = still.matches ? 0 : requestAnimationFrame(tick);
    };
    draw();
    if (!still.matches) frame = requestAnimationFrame(tick);
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      gl.deleteProgram(program);
    };
  }, [look]);

  return (
    <div className="silk" style={{ background: fallback(look.colours) }}>
      <canvas ref={canvas} className="silk-canvas" />
    </div>
  );
}

function Photo({ url }: { url: string }) {
  return (
    <div className="photo">
      <img src={url} alt="" />
      <div className="motes" />
    </div>
  );
}
