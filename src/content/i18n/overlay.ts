import type { Block, Lesson } from "../../types/lesson";

// Content-translation engine. A lesson's English data is the single source of truth for
// everything executable (code, tests, solutions, quiz `correct` flags). A translation
// *overlay* supplies ONLY the human-readable text, matched to the English lesson's blocks
// by index. Executable fields are always taken from the English block, so translations can
// never drift the logic — the worst case for a stale/partial overlay is English text.

/** Per-block text overrides. Every field is optional; anything omitted keeps the English. */
export interface BlockI18n {
  /** runnable / visualized / dsa-viz / flashcards / challenge / sql-* block title */
  title?: string;
  /** prose markdown */
  markdown?: string;
  /** dsa-viz caption */
  caption?: string;
  /** challenge / sql-challenge problem statement */
  prompt?: string;
  /** challenge / sql-challenge progressive hints (parallel to English) */
  hints?: string[];
  /** quiz question */
  question?: string;
  /** quiz option texts, parallel to the English options (correctness is untouched) */
  options?: string[];
  /** quiz explanation */
  explanation?: string;
  /** flashcard front/back overrides, parallel to the English cards */
  cards?: { front?: string; back?: string }[];
}

/** A lesson's translation overlay: localized title/summary + per-block text (indexed). */
export interface LessonI18n {
  title?: string;
  summary?: string;
  /** One entry per English block, in order. `null`/missing = keep that block's English. */
  blocks?: (BlockI18n | null)[];
}

function applyBlock(b: Block, o?: BlockI18n | null): Block {
  if (!o) return b;
  switch (b.kind) {
    case "prose":
      return { ...b, markdown: o.markdown ?? b.markdown };
    case "runnable":
    case "visualized":
    case "user-viz":
    case "sql-runnable":
      return { ...b, title: o.title ?? b.title };
    case "dsa-viz":
      return { ...b, title: o.title ?? b.title, caption: o.caption ?? b.caption };
    case "challenge":
    case "sql-challenge":
      return {
        ...b,
        title: o.title ?? b.title,
        prompt: o.prompt ?? b.prompt,
        hints: o.hints ?? b.hints,
      };
    case "quiz":
      return {
        ...b,
        question: o.question ?? b.question,
        explanation: o.explanation ?? b.explanation,
        options: o.options
          ? b.options.map((opt, i) => ({ ...opt, text: o.options![i] ?? opt.text }))
          : b.options,
      };
    case "flashcards":
      return {
        ...b,
        title: o.title ?? b.title,
        cards: o.cards
          ? b.cards.map((c, i) => ({
              front: o.cards![i]?.front ?? c.front,
              back: o.cards![i]?.back ?? c.back,
            }))
          : b.cards,
      };
    default:
      return b;
  }
}

/** Merge a translation overlay onto an English lesson. No overlay → the lesson unchanged. */
export function localizeLesson(lesson: Lesson, ov?: LessonI18n): Lesson {
  if (!ov) return lesson;
  return {
    ...lesson,
    title: ov.title ?? lesson.title,
    summary: ov.summary ?? lesson.summary,
    blocks: lesson.blocks.map((b, i) => applyBlock(b, ov.blocks?.[i])),
  };
}
