import { describe, expect, it } from "vitest";
import { computeBadges, type ProgressSnapshot } from "./badges";
import { curriculum } from "../content/curriculum";

const empty: ProgressSnapshot = {
  completedLessons: {},
  solvedChallenges: {},
  xp: 0,
  streakDays: 0,
};

function find(badges: ReturnType<typeof computeBadges>, id: string) {
  return badges.find((b) => b.id === id)!;
}

describe("computeBadges", () => {
  it("locks everything for a fresh profile", () => {
    const badges = computeBadges(empty);
    expect(badges.every((b) => !b.unlocked)).toBe(true);
  });

  it("unlocks first-solve and getting-started milestones", () => {
    const badges = computeBadges({
      ...empty,
      solvedChallenges: { "a::0": true },
      completedLessons: { "variables-and-types": true },
    });
    expect(find(badges, "first-solve").unlocked).toBe(true);
    expect(find(badges, "first-lesson").unlocked).toBe(true);
    expect(find(badges, "solver-10").unlocked).toBe(false);
  });

  it("unlocks streak and level milestones at thresholds", () => {
    expect(find(computeBadges({ ...empty, streakDays: 5 }), "streak-5").unlocked).toBe(true);
    expect(find(computeBadges({ ...empty, xp: 1000 }), "level-5").unlocked).toBe(true);
  });

  it("unlocks a module badge only when every lesson in it is complete", () => {
    const mod = curriculum[0];
    const completedLessons = Object.fromEntries(
      mod.lessons.map((l) => [l.id, true as const]),
    );
    const badges = computeBadges({ ...empty, completedLessons });
    expect(find(badges, `module-${mod.id}`).unlocked).toBe(true);
    expect(find(badges, "completionist").unlocked).toBe(false);
  });
});
