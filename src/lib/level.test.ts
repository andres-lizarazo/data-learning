import { describe, expect, it } from "vitest";
import { levelFromXp, levelProgress } from "./level";

describe("levelFromXp", () => {
  it("returns level 1 at 0 XP", () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(99)).toBe(1);
  });

  it("crosses thresholds at 50·n·(n-1)", () => {
    expect(levelFromXp(100)).toBe(2); // L2 = 100
    expect(levelFromXp(299)).toBe(2);
    expect(levelFromXp(300)).toBe(3); // L3 = 300
    expect(levelFromXp(600)).toBe(4); // L4 = 600
    expect(levelFromXp(1000)).toBe(5); // L5 = 1000
  });
});

describe("levelProgress", () => {
  it("reports progress within the current level", () => {
    const p = levelProgress(150); // level 2 (100..300), 50 into a span of 200
    expect(p.level).toBe(2);
    expect(p.intoLevel).toBe(50);
    expect(p.span).toBe(200);
    expect(p.pct).toBe(25);
    expect(p.nextLevelXp).toBe(300);
  });

  it("is 0% right at a level boundary", () => {
    expect(levelProgress(100).pct).toBe(0);
    expect(levelProgress(300).pct).toBe(0);
  });
});
