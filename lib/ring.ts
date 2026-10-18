/**
 * The app player's progress ring (`_ProgressRing` / `_RingPainter` in the
 * app's lib/features/player/view/player_screen.dart, Figma 458:9150), in
 * its 313 × 313 box: a 16pt band open 60° at the bottom. Progress starts at
 * the opening's end on the reading side (left in English, right in Arabic)
 * and sweeps over the top.
 */
export const RING_BOX = 313;
export const RING_STROKE = 16;
export const RING_RADIUS = (RING_BOX - RING_STROKE) / 2;
const CENTER = RING_BOX / 2;
const GAP = (60 * Math.PI) / 180;
export const SWEEP_TOTAL = 2 * Math.PI - GAP;

/** +1 clockwise (left to right), -1 counter-clockwise (right to left). */
export function turn(rtl: boolean): number {
  return rtl ? -1 : 1;
}

/** Angle (radians, screen coordinates, y down) where progress starts. */
export function startAngle(rtl: boolean): number {
  return Math.PI / 2 + turn(rtl) * (GAP / 2);
}

export function pointAt(angle: number): { x: number; y: number } {
  return { x: CENTER + RING_RADIUS * Math.cos(angle), y: CENTER + RING_RADIUS * Math.sin(angle) };
}

const round = (n: number) => Math.round(n * 1000) / 1000;

/** An SVG arc path from [from] sweeping [sweep] radians (sign = direction). */
export function arcPath(from: number, sweep: number): string {
  const a = pointAt(from);
  const b = pointAt(from + sweep);
  const large = Math.abs(sweep) > Math.PI ? 1 : 0;
  const clockwise = sweep > 0 ? 1 : 0;
  return `M ${round(a.x)} ${round(a.y)} A ${RING_RADIUS} ${RING_RADIUS} 0 ${large} ${clockwise} ${round(b.x)} ${round(b.y)}`;
}

/** The whole band, for the glass track behind the played part. */
export function trackPath(rtl: boolean): string {
  return arcPath(startAngle(rtl), turn(rtl) * SWEEP_TOTAL);
}

/** The played part, or null before anything has played. */
export function playedPath(progress: number, rtl: boolean): string | null {
  const played = Math.min(1, Math.max(0, progress));
  if (played <= 0) return null;
  // A full ring's end meets its start: stop a hair short so the arc draws.
  return arcPath(startAngle(rtl), turn(rtl) * SWEEP_TOTAL * Math.min(played, 0.99999));
}

/** The knob's centre, at the head of the played part. */
export function headAt(progress: number, rtl: boolean): { x: number; y: number } {
  const played = Math.min(1, Math.max(0, progress));
  return pointAt(startAngle(rtl) + turn(rtl) * SWEEP_TOTAL * played);
}

/** How far either side of the band a touch may start (the app's 28pt). */
export const TOUCH_BAND = 28;

/** Whether a point in the 313 box is on the band (for starting a seek). */
export function onRing(x: number, y: number): boolean {
  return Math.abs(Math.hypot(x - CENTER, y - CENTER) - RING_RADIUS) <= TOUCH_BAND;
}

/** The fraction along the ring under a point, or null in the opening. */
export function fractionAt(x: number, y: number, rtl: boolean): number | null {
  let angle = turn(rtl) * (Math.atan2(y - CENTER, x - CENTER) - startAngle(rtl));
  while (angle < 0) angle += 2 * Math.PI;
  while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;
  if (angle > SWEEP_TOTAL) return null;
  return Math.min(1, Math.max(0, angle / SWEEP_TOTAL));
}

/** "4:59", "60:00": the app's remaining-time label (`_mmss`), whole
 *  minutes then seconds. */
export function clock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
