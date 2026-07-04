import { describe, it, expect } from "vitest";
import { schedule, cardId, allCards, type CardState } from "./reviewStore";

const NOW = "2026-07-03";

describe("spaced-repetition scheduler (SM-2-lite)", () => {
  it("a new card graded good is due tomorrow", () => {
    const s = schedule(undefined, "good", NOW);
    expect(s.interval).toBe(1);
    expect(s.due).toBe("2026-07-04");
    expect(s.reps).toBe(1);
  });

  it("good grades grow the interval by the ease factor", () => {
    let s = schedule(undefined, "good", NOW); // 1 day
    s = schedule(s, "good", NOW); // 1 * 2.5
    expect(s.interval).toBe(2.5);
    expect(s.due).toBe("2026-07-06"); // rounded to 3 days out? 2.5 rounds to 3 → 07-06
    s = schedule(s, "good", NOW);
    expect(s.interval).toBe(6.25);
  });

  it("again resets the interval to today and drops ease", () => {
    let s = schedule(undefined, "good", NOW);
    s = schedule(s, "good", NOW);
    const before = s.ease;
    s = schedule(s, "again", NOW);
    expect(s.interval).toBe(0);
    expect(s.due).toBe(NOW);
    expect(s.ease).toBeLessThan(before);
  });

  it("ease never falls below 1.3", () => {
    let s: CardState | undefined;
    for (let i = 0; i < 20; i++) s = schedule(s, "again", NOW);
    expect(s!.ease).toBeGreaterThanOrEqual(1.3);
  });

  it("easy grows faster than good and raises ease", () => {
    const good = schedule(undefined, "good", NOW);
    const easy = schedule(undefined, "easy", NOW);
    expect(easy.interval).toBeGreaterThan(good.interval);
    expect(easy.ease).toBeGreaterThan(good.ease);
  });

  it("intervals are capped at a year", () => {
    let s: CardState | undefined;
    for (let i = 0; i < 30; i++) s = schedule(s, "easy", NOW);
    expect(s!.interval).toBeLessThanOrEqual(365);
  });
});

describe("curriculum flashcards", () => {
  it("card ids are unique across the curriculum", () => {
    const ids = allCards().map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("cardId is stable", () => {
    expect(cardId("lesson-a", "What is X?")).toBe("lesson-a::What is X?");
  });

  it("the curriculum ships flashcard decks", () => {
    expect(allCards().length).toBeGreaterThan(20);
  });
});
