import { describe, it, expect } from "vitest";
import { streakOf, parseWords, blankOut, dayScore } from "../study";

describe("study rules", () => {
  it("counts consecutive days including today", () => {
    expect(streakOf(["2026-10-19", "2026-10-18", "2026-10-17"], new Date(2026, 9, 19))).toBe(3);
  });
  it("keeps streak alive if today not studied yet", () => {
    expect(streakOf(["2026-10-18", "2026-10-17"], new Date(2026, 9, 19))).toBe(2);
  });
  it("parses words by line or comma", () => {
    expect(parseWords("1. resilient\nthorough, breakthrough")).toEqual(["resilient", "thorough", "breakthrough"]);
  });
  it("blanks the target word in review", () => {
    expect(blankOut("She is resilient today.", "resilient")).toBe("She is _____ today.");
  });
  it("scores a day per sentence: got it = 1, more or less = 0.5, hell no = 0, max always 10", () => {
    const s = (rating?: "got" | "almost" | "no") => ({ context: "Geral", en: "x", pt: "y", ...(rating ? { rating } : {}) });
    const w = (ratings: ("got" | "almost" | "no" | undefined)[]) => ({ word: "w", meaning: "", sentences: ratings.map(s) });
    const full = w(["got", "got", "got"]);
    const mixed = w(["got", "almost", "almost"]);
    const spread = w(["got", "almost", "no"]);
    const partial = w(["got", undefined, undefined]);
    expect(dayScore([full])).toBe(10);
    // 10 words × 3 sentences = 30; 8 fully got (24 pts) + 2 words with 1 got + 2 almost (4 pts) = 28/30
    expect(dayScore([...Array(8).fill(full), mixed, mixed])).toBeCloseTo(9.3);
    expect(dayScore([spread])).toBe(5);
    expect(dayScore([partial])).toBeCloseTo(3.3);
  });
});
