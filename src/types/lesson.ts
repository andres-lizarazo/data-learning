// Core content model for PyLearn.
//
// A curriculum is a list of Modules. Each Module has Lessons. Each Lesson is an
// ordered list of Blocks. Blocks are rendered by LessonRenderer -> a component per
// `kind`. Lessons are plain typed data (no markdown files to parse at build time),
// which keeps authoring simple and type-safe.

export type BlockKind =
  | "prose"
  | "runnable"
  | "visualized"
  | "dsa-viz"
  | "user-viz"
  | "challenge"
  | "quiz"
  | "flashcards"
  | "sql-runnable"
  | "sql-challenge";

/** Markdown prose. Supports GitHub-flavored markdown. */
export interface ProseBlock {
  kind: "prose";
  markdown: string;
}

/** An editable code snippet the learner can run; shows stdout/stderr (+ plots). */
export interface RunnableBlock {
  kind: "runnable";
  title?: string;
  code: string;
  /** Pyodide packages to ensure are installed before running (e.g. ["numpy"]). */
  packages?: string[];
  /** If true, a matplotlib figure is expected and rendered into the plot panel. */
  expectPlot?: boolean;
}

/** Code shown with the step-by-step ExecutionVisualizer ("see loops flow"). */
export interface VisualizedBlock {
  kind: "visualized";
  title?: string;
  code: string;
}

/** A canned DSA animation driven by a named visualizer + its config. */
export interface DsaVizBlock {
  kind: "dsa-viz";
  title?: string;
  viz:
    | "array"
    | "sorting"
    | "linked-list"
    | "stack-queue"
    | "tree"
    | "graph"
    | "recursion"
    | "hash-table"
    | "heap"
    | "sliding-window"
    | "backtracking"
    | "dijkstra";
  /** Initial data for the visualizer (interpretation depends on `viz`). */
  data?: unknown;
  /** Sorting algorithm to animate, when viz === "sorting". */
  algorithm?: "bubble" | "insertion" | "selection" | "merge" | "quick";
  /** Graph traversal to animate, when viz === "graph". */
  traversal?: "bfs" | "dfs";
  caption?: string;
}

/** One test case run against the learner's solution. */
export interface TestCase {
  /** Human label shown in the results list. */
  name: string;
  /**
   * Python expression/statements appended after the user's code. It must `assert`
   * the expected behavior. Keep visible cases readable.
   */
  assertion: string;
  /** Hidden cases are run but their assertion text is not shown to the learner. */
  hidden?: boolean;
}

/**
 * The learner writes an algorithm that calls `record(arr, active, note)` to emit
 * animation frames; PyLearn animates them as bars. "Visualize your own code."
 */
export interface UserVizBlock {
  kind: "user-viz";
  title?: string;
  starterCode: string;
  packages?: string[];
}

/** CodeSignal-style coding challenge. */
export interface ChallengeBlock {
  kind: "challenge";
  title: string;
  prompt: string; // markdown problem statement
  starterCode: string;
  tests: TestCase[];
  /** Pyodide packages to ensure are installed before running (e.g. ["numpy"]). */
  packages?: string[];
  /** Progressive hints, revealed one at a time. */
  hints?: string[];
  /** Optional reference solution revealed via "Show solution". */
  solution?: string;
  /** XP awarded the first time the learner passes all tests. */
  xp?: number;
}

export interface QuizOption {
  text: string;
  correct?: boolean;
}

/** Multiple-choice knowledge check. */
export interface QuizBlock {
  kind: "quiz";
  question: string;
  options: QuizOption[];
  explanation?: string;
}

export interface Flashcard {
  /** Question/term side. Must be unique within the lesson (it keys review state). */
  front: string;
  /** Answer side (supports markdown-lite line breaks via \n). */
  back: string;
}

/**
 * A deck of concept flashcards. Grading (Again/Good/Easy) feeds the
 * spaced-repetition review queue (/review) via the review store.
 */
export interface FlashcardsBlock {
  kind: "flashcards";
  title?: string;
  cards: Flashcard[];
}

/**
 * Which seed dataset a SQL block runs against. "ecommerce" (default) is the OLTP
 * shop schema; "warehouse" is the star schema + staging used by the DE track.
 */
export type SqlSeedId = "ecommerce" | "warehouse";

/** An editable SQL snippet the learner can run against the seeded Postgres DB. */
export interface SqlRunnableBlock {
  kind: "sql-runnable";
  title?: string;
  sql: string;
  /** Seed dataset to run against. Defaults to "ecommerce". */
  seedId?: SqlSeedId;
  /**
   * Reload the seed schema before running. Use for mutating examples (INSERT/UPDATE/
   * DELETE/DDL) so changes don't leak into later blocks. Default false.
   */
  resetBefore?: boolean;
  /**
   * This snippet is *meant* to raise an error (e.g. demonstrating a constraint
   * violation). The UI frames the error as expected, and tests treat it as a pass.
   */
  expectError?: boolean;
}

/** SQL coding challenge: the learner writes a query, checked against a reference solution. */
export interface SqlChallengeBlock {
  kind: "sql-challenge";
  title: string;
  prompt: string; // markdown problem statement
  /** Seed dataset to grade against. Defaults to "ecommerce". */
  seedId?: SqlSeedId;
  starterSql: string;
  /** Reference solution; the runner compares the learner's result set to this one. */
  solution: string;
  /** If true, row order must match exactly. Default false (order-insensitive). */
  ordered?: boolean;
  /** Progressive hints, revealed one at a time. */
  hints?: string[];
  /** XP awarded the first time the learner passes. */
  xp?: number;
}

export type Block =
  | ProseBlock
  | RunnableBlock
  | VisualizedBlock
  | DsaVizBlock
  | UserVizBlock
  | ChallengeBlock
  | QuizBlock
  | FlashcardsBlock
  | SqlRunnableBlock
  | SqlChallengeBlock;

export interface Lesson {
  id: string; // unique within the whole curriculum, kebab-case
  title: string;
  summary: string;
  /** Rough minutes to complete; shown as a hint. */
  minutes?: number;
  blocks: Block[];
}

export type ModuleLevel = "Beginner" | "Intermediate" | "Advanced";

/** Top-level grouping shown as a section heading (sidebar + home). */
export type Track =
  | "Foundations & Tooling"
  | "Python"
  | "SQL"
  | "Software Design"
  | "Data Engineering"
  | "Cloud";

export interface Module {
  id: string; // kebab-case, used in the URL
  title: string;
  /** One-line description for cards. */
  blurb: string;
  /** Section this module belongs to. Defaults to "Python" when omitted. */
  track?: Track;
  level: ModuleLevel;
  /** Emoji or short icon shown in the sidebar/cards. */
  icon: string;
  /** "deep" modules are fully built; "starter" are seeded and expandable. */
  status: "deep" | "starter";
  lessons: Lesson[];
}
