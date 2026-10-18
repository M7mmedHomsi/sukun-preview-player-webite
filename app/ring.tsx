"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  clock,
  fractionAt,
  headAt,
  onRing,
  playedPath,
  RING_BOX,
  RING_STROKE,
  trackPath,
} from "@/lib/ring";

/** The band's shape as a mask, so the glass blur shows only on the ring. */
function bandMask(rtl: boolean): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${RING_BOX} ${RING_BOX}"><path d="${trackPath(rtl)}" fill="none" stroke="white" stroke-width="${RING_STROKE}" stroke-linecap="round"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/**
 * The app's progress ring (458:9150): the scene blurred through a
 * ring-shaped glass band (white 20%), the played part in solid white, the
 * knob at its head (51 hairline, 35 white, 19 purple hairline), the time
 * left in the opening, and the title in the hollow. Drag or tap on the
 * ring to seek; arrow keys step ten seconds.
 */
export function Ring({
  progress,
  remaining,
  rtl,
  label,
  onSeek,
  onStep,
  children,
}: {
  progress: number;
  remaining: number;
  rtl: boolean;
  label: string;
  onSeek?: (fraction: number) => void;
  onStep: (seconds: number) => void;
  children?: ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<number | null>(null);
  const shown = drag ?? progress;
  const played = playedPath(shown, rtl);
  const head = headAt(shown, rtl);

  const local = (e: React.PointerEvent) => {
    const rect = box.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * RING_BOX) / rect.width,
      y: ((e.clientY - rect.top) * RING_BOX) / rect.height,
    };
  };

  const preview = (e: React.PointerEvent, starting: boolean) => {
    if (!onSeek) return;
    const { x, y } = local(e);
    // A gesture has to start on the ring; once it has, it may wander.
    if (starting && !onRing(x, y)) return;
    if (!starting && drag === null) return;
    const fraction = fractionAt(x, y, rtl);
    if (fraction === null) return;
    if (starting) box.current?.setPointerCapture(e.pointerId);
    setDrag(fraction);
  };

  const commit = () => {
    if (drag !== null) onSeek?.(drag);
    setDrag(null);
  };

  return (
    <div
      ref={box}
      className="ring"
      role="slider"
      tabIndex={onSeek ? 0 : -1}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(shown * 100)}
      aria-valuetext={clock(remaining)}
      onPointerDown={(e) => preview(e, true)}
      onPointerMove={(e) => preview(e, false)}
      onPointerUp={commit}
      onPointerCancel={() => setDrag(null)}
      onKeyDown={(e) => {
        if (!onSeek) return;
        if (e.key === "ArrowRight" || e.key === "ArrowUp") onStep(10);
        else if (e.key === "ArrowLeft" || e.key === "ArrowDown") onStep(-10);
        else return;
        e.preventDefault();
      }}
    >
      <div className="ring-glass" style={{ maskImage: bandMask(rtl), WebkitMaskImage: bandMask(rtl) }} />
      <svg className="ring-svg" viewBox={`0 0 ${RING_BOX} ${RING_BOX}`} aria-hidden="true">
        {played ? (
          <path d={played} fill="none" stroke="#fff" strokeWidth={RING_STROKE} strokeLinecap="round" />
        ) : null}
        <circle cx={head.x} cy={head.y} r={25} fill="none" stroke="#fff" strokeWidth={1} />
        <circle cx={head.x} cy={head.y} r={17.5} fill="#fff" />
        <circle cx={head.x} cy={head.y} r={9} fill="none" stroke="#9968EE" strokeWidth={1} />
      </svg>
      <span className="ring-time">{clock(remaining)}</span>
      {children ? <div className="ring-hollow">{children}</div> : null}
    </div>
  );
}
