import { describe, expect, it } from "vitest";
import { clock, fractionAt, headAt, onRing, playedPath, RING_BOX, RING_RADIUS, startAngle } from "../lib/ring";

const C = RING_BOX / 2;

describe("the app's progress ring", () => {
  it("starts at the opening's left end in English, its right end in Arabic", () => {
    // 30° either side of straight down: x left of centre in English.
    expect(headAt(0, false).x).toBeLessThan(C);
    expect(headAt(0, true).x).toBeGreaterThan(C);
    expect(headAt(0, false).y).toBeCloseTo(C + RING_RADIUS * Math.cos(Math.PI / 6), 5);
  });

  it("is at the top half way, from either side", () => {
    for (const rtl of [false, true]) {
      const top = headAt(0.5, rtl);
      expect(top.x).toBeCloseTo(C, 5);
      expect(top.y).toBeCloseTo(C - RING_RADIUS, 5);
    }
  });

  it("draws nothing played at the start, and a large arc past half", () => {
    expect(playedPath(0, false)).toBeNull();
    expect(playedPath(0.75, false)).toMatch(/ A [\d.]+ [\d.]+ 0 1 1 /);
    expect(playedPath(0.25, true)).toMatch(/ A [\d.]+ [\d.]+ 0 0 0 /);
  });

  it("reads a touch back as the fraction under it, none in the opening", () => {
    for (const rtl of [false, true]) {
      for (const f of [0.1, 0.5, 0.9]) {
        const p = headAt(f, rtl);
        expect(fractionAt(p.x, p.y, rtl)).toBeCloseTo(f, 5);
      }
      expect(fractionAt(C, C + RING_RADIUS, rtl)).toBeNull();
    }
    expect(startAngle(false)).toBeCloseTo((2 * Math.PI) / 3, 5);
  });

  it("starts a seek only on the band", () => {
    expect(onRing(C, C - RING_RADIUS)).toBe(true);
    expect(onRing(C, C)).toBe(false);
  });

  it("shows time as the app does: whole minutes, then seconds", () => {
    expect(clock(299.4)).toBe("4:59");
    expect(clock(3600)).toBe("60:00");
    expect(clock(Number.NaN)).toBe("0:00");
  });
});
