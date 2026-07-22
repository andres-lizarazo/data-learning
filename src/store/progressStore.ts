import { create } from "zustand";
import { persist } from "zustand/middleware";

// Tracks learner progress + light gamification (XP, streak), persisted to
// localStorage so it survives reloads. CodeSignal-style motivation loop.

interface ProgressState {
  completedLessons: Record<string, true>;
  solvedChallenges: Record<string, true>;
  bookmarks: Record<string, true>;
  /** Personal per-lesson markdown notes, keyed by lesson id. */
  notes: Record<string, string>;
  xp: number;
  streakDays: number;
  lastActiveDay: string | null; // YYYY-MM-DD
  lastModuleId: string | null;
  lastLessonId: string | null;

  isLessonComplete: (id: string) => boolean;
  isChallengeSolved: (id: string) => boolean;
  isBookmarked: (id: string) => boolean;
  toggleBookmark: (id: string) => void;
  setNote: (id: string, text: string) => void;
  completeLesson: (id: string, xp?: number) => void;
  solveChallenge: (id: string, xp?: number) => void;
  addXp: (amount: number) => void;
  setLastLesson: (moduleId: string, lessonId: string) => void;
  reset: () => void;
}

/** Local calendar day as YYYY-MM-DD, so a streak rolls over at the learner's midnight
 *  (not UTC's, which would flip at an odd local hour). */
function localDay(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function touchStreak(state: {
  streakDays: number;
  lastActiveDay: string | null;
}): { streakDays: number; lastActiveDay: string } {
  const day = localDay();
  if (state.lastActiveDay === day) {
    return { streakDays: state.streakDays || 1, lastActiveDay: day };
  }
  const yesterday = localDay(new Date(Date.now() - 86400000));
  const streakDays =
    state.lastActiveDay === yesterday ? state.streakDays + 1 : 1;
  return { streakDays, lastActiveDay: day };
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      completedLessons: {},
      solvedChallenges: {},
      bookmarks: {},
      notes: {},
      xp: 0,
      streakDays: 0,
      lastActiveDay: null,
      lastModuleId: null,
      lastLessonId: null,

      isLessonComplete: (id) => !!get().completedLessons[id],
      isChallengeSolved: (id) => !!get().solvedChallenges[id],
      isBookmarked: (id) => !!get().bookmarks[id],

      toggleBookmark: (id) =>
        set((s) => {
          const next = { ...s.bookmarks };
          if (next[id]) delete next[id];
          else next[id] = true;
          return { bookmarks: next };
        }),

      setNote: (id, text) =>
        set((s) => {
          const next = { ...s.notes };
          if (text.trim()) next[id] = text;
          else delete next[id];
          return { notes: next };
        }),

      completeLesson: (id, xp = 20) =>
        set((s) => {
          if (s.completedLessons[id]) return s;
          return {
            completedLessons: { ...s.completedLessons, [id]: true },
            xp: s.xp + xp,
            ...touchStreak(s),
          };
        }),

      solveChallenge: (id, xp = 50) =>
        set((s) => {
          if (s.solvedChallenges[id]) return s;
          return {
            solvedChallenges: { ...s.solvedChallenges, [id]: true },
            xp: s.xp + xp,
            ...touchStreak(s),
          };
        }),

      addXp: (amount) => set((s) => ({ xp: s.xp + amount, ...touchStreak(s) })),

      setLastLesson: (moduleId, lessonId) =>
        set({ lastModuleId: moduleId, lastLessonId: lessonId }),

      reset: () =>
        set({
          completedLessons: {},
          solvedChallenges: {},
          bookmarks: {},
          notes: {},
          xp: 0,
          streakDays: 0,
          lastActiveDay: null,
          lastModuleId: null,
          lastLessonId: null,
        }),
    }),
    {
      name: "pylearn-progress",
      version: 1,
      // Heals localStorage written before a field existed (or by an older shape): fills any
      // missing key with its default so a returning learner never hydrates a broken store.
      // Only data fields are returned; persist re-attaches the actions from the initializer.
      migrate: (persisted) => {
        const s = (persisted ?? {}) as Partial<ProgressState>;
        return {
          completedLessons: s.completedLessons ?? {},
          solvedChallenges: s.solvedChallenges ?? {},
          bookmarks: s.bookmarks ?? {},
          notes: s.notes ?? {},
          xp: s.xp ?? 0,
          streakDays: s.streakDays ?? 0,
          lastActiveDay: s.lastActiveDay ?? null,
          lastModuleId: s.lastModuleId ?? null,
          lastLessonId: s.lastLessonId ?? null,
        } as ProgressState;
      },
    },
  ),
);
