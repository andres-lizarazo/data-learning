import { create } from "zustand";
import { persist } from "zustand/middleware";
import { curriculum } from "../content/curriculum";

// Spaced repetition for flashcards (SM-2-lite). Card CONTENT lives in the lesson
// data; this store persists only per-card scheduling state, keyed by a stable id
// derived from (lessonId, front). Cards without state are "new" and due now.

export type Grade = "again" | "good" | "easy";

export interface CardState {
  /** ISO date (YYYY-MM-DD) the card becomes due again. */
  due: string;
  /** Current interval in days. */
  interval: number;
  /** Ease factor (SM-2 style), min 1.3. */
  ease: number;
  /** How many times the card was graded. */
  reps: number;
}

export interface DeckCard {
  id: string;
  moduleId: string;
  lessonId: string;
  lessonTitle: string;
  front: string;
  back: string;
}

export function cardId(lessonId: string, front: string): string {
  return `${lessonId}::${front}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date: string, days: number): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + Math.round(days));
  return d.toISOString().slice(0, 10);
}

/**
 * SM-2-lite transition. Pure so it's unit-testable:
 * - again → see it again today; ease drops.
 * - good  → first time: 1 day; then interval × ease.
 * - easy  → interval × ease × bonus; ease grows.
 */
export function schedule(
  prev: CardState | undefined,
  grade: Grade,
  now: string = today(),
): CardState {
  const state: CardState = prev ?? { due: now, interval: 0, ease: 2.5, reps: 0 };
  let { interval, ease } = state;

  if (grade === "again") {
    ease = Math.max(1.3, ease - 0.2);
    interval = 0;
  } else if (grade === "good") {
    interval = interval < 1 ? 1 : interval * ease;
  } else {
    ease = ease + 0.15;
    interval = Math.max(interval, 1) * ease * 1.3;
  }

  interval = Math.min(interval, 365);
  return {
    due: interval < 1 ? now : addDays(now, interval),
    interval,
    ease,
    reps: state.reps + 1,
  };
}

/** Every flashcard in the curriculum, flattened (content side of the join). */
export function allCards(): DeckCard[] {
  const cards: DeckCard[] = [];
  for (const mod of curriculum) {
    for (const lesson of mod.lessons) {
      for (const block of lesson.blocks) {
        if (block.kind !== "flashcards") continue;
        for (const card of block.cards) {
          cards.push({
            id: cardId(lesson.id, card.front),
            moduleId: mod.id,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            front: card.front,
            back: card.back,
          });
        }
      }
    }
  }
  return cards;
}

interface ReviewState {
  cards: Record<string, CardState>;
  grade: (id: string, grade: Grade) => void;
  isDue: (id: string) => boolean;
  reset: () => void;
}

export const useReviewStore = create<ReviewState>()(
  persist(
    (set, get) => ({
      cards: {},

      grade: (id, grade) =>
        set((s) => ({ cards: { ...s.cards, [id]: schedule(s.cards[id], grade) } })),

      // New cards (no state) are due immediately.
      isDue: (id) => {
        const state = get().cards[id];
        return !state || state.due <= today();
      },

      reset: () => set({ cards: {} }),
    }),
    { name: "pylearn-review" },
  ),
);

/** The current due queue: curriculum cards joined with scheduling state. */
export function dueCards(cards: Record<string, CardState>): DeckCard[] {
  const day = today();
  return allCards().filter((c) => {
    const state = cards[c.id];
    return !state || state.due <= day;
  });
}
