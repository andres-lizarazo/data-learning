# Data Learning — Implementation Plan

## Overview

Data Learning (formerly "PyLearn") is an interactive, visual platform for learning
**Python and SQL** — from Python basics through data structures, data
wrangling/visualization, and DSA, plus a dedicated **SQL track** whose PostgreSQL
subsection teaches Postgres against a seeded e-commerce database. It is a
CodeSignal-style experience that runs **entirely in the browser**: a full CPython
interpreter (Pyodide/WebAssembly) executes Python client-side with step-by-step
execution visualization and animated DSA components, and a full PostgreSQL engine
(PGlite/WebAssembly) executes SQL client-side with a result grid and graded query
exercises. Local-first; deployment later.

## Architecture

- **Frontend:** React + Vite + TypeScript + Tailwind. Monaco editor. React Router.
- **Python runtime:** Pyodide in a **Web Worker** (`src/pyodide/worker.ts`), accessed
  through a typed promise client (`src/pyodide/pyodideClient.ts`). Capabilities:
  `run` (stdout/stderr + matplotlib PNGs), `trace` (sys.settrace step recorder in
  `tracer.py`), `install` (loadPackage/micropip).
- **State:** Zustand. `pyodideStore` (boot/ready/status), `progressStore`
  (completed lessons, XP, streak — persisted to localStorage).
- **Content:** typed `Module`/`Lesson` data in `src/content/modules/*.ts`, indexed by
  `src/content/curriculum.ts`. Lessons are ordered **blocks** rendered by
  `LessonRenderer`: `prose | runnable | visualized | dsa-viz | challenge | quiz`.
- **Visualizers:** `ExecutionVisualizer` (line highlight + animated variable table +
  play/step/scrub) and `components/visualizer/dsa/*` (array, sorting, linked-list,
  stack/queue, tree/BST, graph BFS/DFS, recursion call stack).

## Implementation Checklist

### Platform
- [x] Vite + React + TS + Tailwind scaffold and build config
- [x] Pyodide Web Worker + typed client (run / trace / install / plots)
- [x] `sys.settrace` step recorder (`tracer.py`)
- [x] UI shell: Layout, Sidebar (curriculum tree + progress), TopBar (XP/streak/status)
- [x] Routing: Home, Module page, Lesson page, Playground
- [x] Monaco CodeEditor (with reactive current-line highlight), OutputConsole, PlotPanel
- [x] LessonRenderer + block components (prose, runnable, visualized, dsa-viz, quiz)
- [x] ChallengeRunner (isolated test harness, pass/fail, runtime, solution reveal)
- [x] ExecutionVisualizer (flagship "see loops flow")
- [x] DSA visualizers: Array, Sorting (bubble/insertion/selection/merge/quick),
      LinkedList, Stack/Queue, Tree (in/pre/post/level traversals), Graph (BFS/DFS),
      Recursion call stack
- [x] Progress store: XP, streak, lesson completion, challenge solves (localStorage)
- [x] Markdown styling, dark theme, mobile sidebar drawer

### Content — deep modules
- [x] Python Basics (8 lessons): types, operators, strings, conditionals,
      **loops (visualized)**, functions, comprehensions, errors — each with challenges
- [x] Data Structures (5 lessons): lists, tuples, dicts, sets, stacks/queues + visuals
- [x] DSA (10 lessons): two pointers, hashing, recursion, sorting, binary search,
      linked lists, trees, graphs, intro DP — each pairing a visualizer + challenge

### Content — deepened modules (now "deep")
- [x] Core Libraries: collections/itertools, datetime/random/json, math/statistics,
      functools — with challenges
- [x] NumPy: arrays & vectorization, indexing/reshaping, aggregations/broadcasting —
      with challenges
- [x] Pandas: DataFrames, selecting/filtering, cleaning, group-by/agg, merge/join —
      with challenges
- [x] Data Visualization: matplotlib, customizing plots, pandas plotting, seaborn
      (distribution + categorical/heatmaps)

### Content — starter (conceptual)
- [x] PySpark (conceptual): Spark model + quiz; pandas↔PySpark cheat sheet

### SQL track — PostgreSQL (deep) — merged from the sql-learning repo
- [x] In-browser Postgres engine: **PGlite** (real Postgres/WASM) wrapped in `src/sql/`
      (`sqlClient.ts` exec/reset/queryRows + status stream; `seeds.ts` e-commerce
      schema/data ported from sql-learning `concepts.md` §26; `sqlStore.ts` boot store)
- [x] New block kinds `sql-runnable` (editable SQL → result grid) and `sql-challenge`
      (graded by comparing the result set to a reference solution — `lib/sqlCompare.ts`,
      order-insensitive by default); wired into `LessonRenderer`
- [x] SQL UI: `SqlResultTable` (grid/affected-rows/error), `SchemaExplorer` (sample-DB
      tables/columns, shown in SQL lessons + Playground), `CodeEditor` SQL language mode
- [x] **Advanced Query Workshop** lesson (interview live-coding prep): chained CTEs combining
      UNNEST (array-of-composite sessionization — the user's example, verified Postgres-compatible),
      ROW_NUMBER/PARTITION, COUNT(DISTINCT), window frames + `SUM() OVER ()`, FILTER pivots +
      ROLLUP, and gaps-and-islands streaks — with step-by-step explanations and 4 graded exercises
- [x] **Analytics Patterns (Interview Pack)** lesson (grounded in 2026 SQL-interview research —
      the recurring "7 patterns" + analytics extensions): period-over-period MoM growth (LAG +
      NULLIF), 7-day rolling average (ROWS frame), **gap-based sessionization** (30-min rule via
      cumulative SUM of session-start flags), dedupe-keep-latest (ROW_NUMBER DESC), NTILE
      segmentation, and cohort retention (first-activity cohort + month-offset pivot) — all
      verified in PGlite, with 3 graded exercises
- [x] **Funnel Conversion** lesson: loose per-step funnel (distinct users + conversion via
      FIRST_VALUE/LAG) and the **strict ordered** funnel (per-user MIN(ts) FILTER pivot + monotonic
      timestamp checks), with the overcount gotcha demoed; graded seed funnel (registered→ordered→paid)
- [x] **Recursive CTEs — Manager Chains & Trees** lesson: walk hierarchies DOWN (org tree + path/depth)
      and UP (management chain / root ancestor), cycle-safety notes; 2 graded exercises on the seed
      `categories` hierarchy (depth, descendants-of-a-node)
- [x] **Pivot & Unpivot** lesson: portable FILTER/CASE pivot (+ crosstab/tablefunc caveat — not
      bundled in PGlite), unpivot via `CROSS JOIN LATERAL (VALUES …)`; graded pivot exercise
- [x] **Statistics, Percentiles & Histograms** lesson: median two ways (PERCENTILE_CONT vs the
      ROW_NUMBER/COUNT trick — the requested "no percentile" drill), `percent_rank`/`cume_dist`,
      `mode()`, `width_bucket` histograms; graded median-without-percentile exercise
- [x] **Data-Modifying CTEs & MERGE** lesson: writable CTEs (`WITH … (INSERT/UPDATE/DELETE … RETURNING)`)
      for atomic multi-step writes (insert parent+child; move rows), `MERGE` upsert (PG15+) with the
      MERGE-vs-ON CONFLICT trade-off; graded writable-CTE exercise
- [x] **Pagination & Performance** lesson: keyset/seek pagination via row-value comparison vs slow
      OFFSET, EXISTS/semi-join vs IN, anti-joins, EXPLAIN to confirm index use; graded keyset exercise
- [x] **"🧭 When to use what" decision callouts** added to 12 decision-heavy lessons (subquery vs
      CTE vs JOIN; IN vs EXISTS; which join; WHERE vs HAVING / GROUP BY vs window; ROW_NUMBER vs RANK
      vs DENSE_RANK; UNION vs UNION ALL; DELETE/TRUNCATE/ON CONFLICT/MERGE; index-type choice; array
      vs join-table vs JSONB; JSONB vs JSON vs columns; view vs matview vs CTE; NOT IN vs NOT EXISTS
      vs LEFT JOIN IS NULL) — each with concrete cues, the *why*, and a one-line rule of thumb
- [x] **Data Engineering & ETL Patterns** lesson (covers the DE/ETL gaps from "advanced SQL
      patterns" cheat-sheets, which are usually T-SQL): a **T-SQL→PostgreSQL translation table** +
      a coverage map of the 20 common patterns; **incremental load** (high-water-mark), **SCD Type 2**
      (close current + insert new version via writable CTE), **calendar/date dimension**
      (generate_series + EXTRACT), and **dynamic pivot** (generate pivot SQL with string_agg/format,
      run via EXECUTE; crosstab caveat); 2 graded exercises. All verified in PGlite
- [x] **PostgreSQL module** (28 lessons covering all 26 `concepts.md` sections): SELECT/
      WHERE, JOINs (+LATERAL), GROUP BY/HAVING/FILTER/percentiles, CASE, subqueries/EXISTS,
      CTEs (+recursive), window functions, set ops, INSERT/UPDATE/DELETE/UPSERT,
      transactions, DDL/constraints, indexes/EXPLAIN, arrays, JSONB, views/matviews,
      functions/procedures/triggers (PL/pgSQL), string/date/math/NULL functions,
      full-text search, interview patterns — each runnable against the seed DB, most with
      a graded exercise or quiz; "vs MySQL" notes preserved from the source
- [x] Navigation: `Module.track` ("Python" | "SQL"); Sidebar + Home grouped into sections;
      SQL challenges flow into the Practice bank + XP; **SQL Playground** page + route +
      TopBar/CommandPalette links
- [x] Build/PWA: `@electric-sql/pglite` dep, `optimizeDeps.exclude`, workbox
      `maximumFileSizeToCacheInBytes` bumped so the Postgres WASM/data precache for offline
- [x] Tests: `lib/sqlCompare.test.ts` (8 unit tests) + Playwright e2e that boots PGlite and
      runs SQL in the browser
- [x] **Full lesson verification** (`content/modules/sql/postgres.lessons.test.ts`, 97 checks):
      runs **every** `sql-runnable` and every `sql-challenge` `solution` across all 28 lessons through
      the production `sqlClient` + PGlite, asserting each succeeds (or fails, for an `expectError`
      teaching demo) and that the grader accepts each reference solution. Added `expectError` flag to
      `SqlRunnableBlock` (UI shows an "expected to error" pill). **Caught & fixed a real bug**: a
      challenge solution used `UPDATE … RETURNING … ORDER BY` (invalid in Postgres)

> The original `sql-learning` repo is left untouched (its own submodule). Its `concepts.md`
> remains the source-of-truth reference that this interactive module was ported from.

### Design polish (round 4) — refine Aurora Glass
- [x] Surface harmonization: glass control primitives (`.panel`/`.well`/`.select`/`.callout`)
      + global `:focus-visible` ring; ExecutionVisualizer panels/controls and all DSA
      visualizer chart areas/dropdowns moved off the old `ink` styling
- [x] Premium viz fills: gradient sorting bars, array/stack/linked-list tiles, and
      SVG gradient + glow for tree/graph nodes
- [x] Dark, theme-matched plots: matplotlib dark `rcParams` + `transparent` savefig in the
      worker, seaborn lessons switched to a dark theme, PlotPanel on a dark glass panel
- [x] Motion: route page transitions (AnimatePresence on location) + sliding sidebar active
      indicator (`layoutId`)
- [x] **Level-Up** moment: watcher in Layout fires `LevelUpToast` + big confetti on level gain
- [x] **Profile / Achievements** page (`/profile`): level ring, stats, per-module progress,
      badges grid (`lib/badges.ts`), reset progress; linked from the TopBar
- [x] Loading/branding: Monaco skeleton, SVG favicon + theme-color, hero glow + tech chips

### Frontend / UI-UX overhaul (round 3) — "Aurora Glass"
- [x] Design system: deep base + animated **aurora** background + grain; **glassmorphism**
      surfaces; violet→cyan→lime accent spectrum; display/sans/mono font trio
      (Space Grotesk / Inter / JetBrains Mono); glow shadows; reduced-motion support
      (`tailwind.config.js`, `src/index.css`, `index.html`)
- [x] Deps: `framer-motion`, `lucide-react`, `canvas-confetti`
- [x] Reusable UI primitives: `ui/{Aurora,Logo,XPBar,StreakFlame,AnimatedCounter,Reveal}`
- [x] Gamification: XP→level math (`lib/level.ts`), level bar, animated streak flame,
      animated XP counter, **confetti** on challenge solve / lesson complete / module finish
      (`lib/confetti.ts`), module-complete badges; per-module accent identity (`lib/moduleTheme.ts`)
- [x] Redesigned Layout (aurora + animated drawer), TopBar (glass + level/streak/XP),
      Sidebar (glass + per-module dots + animated active bar)
- [x] Home hero (gradient display headline, floating code card, stat chips, staggered
      module grid with hover lift/glow), Module & Lesson pages, Playground
- [x] Component polish: Monaco glass "window" frame + matched theme, terminal-style console,
      glass plot panel, lucide transport icons on visualizers, restyled challenge runner & quiz

### Review pass (round 2)
- [x] Fix: SortingViz bars rendered at 0-height → px-based bar heights with labels
- [x] Fix: editable code persisted across lessons → `key={lesson.id}` remount in LessonPage
- [x] Auto-render matplotlib/seaborn figures after every run (worker always calls
      `__pylearn_render_plots`, which also closes figures); removed Playground checkbox
- [x] Challenges support `packages` (numpy/pandas challenges install deps before running)
- [x] Surface live install/boot status while a run/trace is in progress
- [x] Reuse Pyodide helper proxies in the worker (no per-call PyProxy leak)
- [x] Verified all new numpy/pandas/libraries challenges pass against real numpy/pandas

### Docs
- [x] README.md (overview, curriculum, architecture, quickstart, authoring)
- [x] CLAUDE.md (project rules, commands, gotchas)
- [x] implementation_plan.md (this file)

## Known Issues / Bugs
- First Pyodide boot downloads ~6–10 MB; `seaborn` (with scipy) can take ~15–30s to
  install on first use. Expected, not a bug — surfaced via status text.
- The Execution Visualizer caps steps (`MAX_STEPS` in `tracer.py`); very long loops are
  truncated with a warning.
- `tracer.py` records data-like locals only (skips functions/modules) to keep the table
  focused; this is intentional.
- Main JS bundle is ~625 KB (≈197 KB gzip) after adding Framer Motion + lucide; Vite warns
  about the 500 KB chunk threshold. Not a runtime problem, but Phase A code-splitting should
  bring it down.

## Roadmap — what's next 🗺️

Prioritized, phase by phase. Each phase is independently shippable.

> **Current execution scope (local-only):** building all in-app, client-side features.
> Infra items (deploy/hosting, accounts & cross-device sync, leaderboard, real Spark
> backend) are **deferred** — they need external services and can't be done while keeping
> everything local. Marked 🚧 below.

### Phase A — Polish & hardening (DONE except where noted)
- [x] Performance: route-level code-splitting (`React.lazy` + `Suspense`) — initial JS bundle
      dropped 625 KB → **395 KB** (130 KB gzip); pages load on demand
- [x] Persist editor edits per lesson via `lib/useCodeDraft.ts` (localStorage), wired into
      runnable/visualized/challenge blocks + Playground; "Continue where you left off" on Home
      (`progressStore.lastLesson`)
- [x] Tests: Vitest unit tests for `lib/level.ts`, `lib/badges.ts`, and `lib/harness.ts`
      (extracted from ChallengeRunner) — 12 tests green; `npm test`
- [x] Playwright e2e smoke (`tests/e2e/smoke.spec.ts`, `npm run test:e2e`): home renders,
      **boots Pyodide and runs Python in the browser**, and the challenge runner executes
      tests — 3 tests green against the production preview
- [x] PWA + offline: `vite-plugin-pwa` (autoUpdate) precaches the app and runtime-caches the
      Pyodide CDN + Google Fonts (CacheFirst) → offline-capable reloads
- [x] Accessibility: skip-to-content link + focus moved to `<main>` on route change; ARIA
      labels on visualizer sliders/selects, `role="img"` + label on the tree/graph SVGs,
      `aria-live` step/note/output regions, and contrast bumps

### Phase B — Deeper learning experience (mostly DONE)
- [x] Command palette (⌘K / Ctrl+K) + search over all lessons/modules/pages
      (`components/ui/CommandPalette.tsx`); TopBar search affordance
- [x] Hints per challenge (progressive reveal via `ChallengeBlock.hints`) + "explain my
      error" friendly tips (`lib/explainError.ts`) shown on failed tests
- [x] **Practice** / challenge bank page (`/practice`): all challenges with module + solved/
      unsolved filters (covers the "review" need); links back to each lesson
- [x] Lesson bookmarks (`progressStore.bookmarks`), toggle on the lesson header, surfaced on
      the Profile page
- [x] Per-lesson notes: collapsible markdown panel on every lesson
      (`components/lesson/LessonNotes.tsx`), persisted in `progressStore.notes`
- [ ] Full spaced-repetition scheduling (flashcards block + SM-2 review queue) — planned
      as Phase 6 of the 2026-07 curriculum expansion (see below)

### Phase C — Richer visualizers (DONE)
- [x] Execution Visualizer: **call-stack panel** (tracer captures the active call stack per
      step) + **watch/pin variables** (filter the variable table to named vars)
- [x] New visualizers: **hash table** (chaining), **heap / priority queue** (tree + array,
      sift-up), **sliding window**, **backtracking** (subsets decision tree) — each wired
      into a lesson
- [x] **Object/heap reference diagram** in the Execution Visualizer (Table ⟷ Objects toggle):
      the tracer serializes structured values + object ids (with caps), so shared references
      / aliasing are visible; demoed in the Lists lesson
- [x] **Drive a visualizer from the learner's own code**: a `record(arr, active, note)` helper
      captures frames that animate as bars (`user-viz` block); demoed in the Sorting lesson
- [x] Weighted graphs + **Dijkstra** visualizer + lesson

> Phase C is now complete. Only Phase E (infra) remains on the roadmap.

### Phase D — More content (DONE)
- [x] DSA: **Sliding Window**, **Heaps & Priority Queues**, **Backtracking**, **Tries**,
      **DP — Coin Change** lessons (each with a visualizer/visualized code + challenge + hints)
- [x] Pandas: **Time Series** (datetime, period group-by, rolling) and **Reshape & Method
      Chaining** (pivot_table/melt) lessons with challenges
- [x] New module **Intro to ML (scikit-learn)**: train/test split, fit/evaluate, decision-tree
      classifier — 2 lessons + challenges, runs sklearn in Pyodide
- [x] Knowledge-check quiz added to the pandas-plotting viz lesson
- [x] All new pandas/sklearn/DSA challenge solutions verified against real libraries (uv venv)

## 2026-07 Curriculum Expansion — Data/Analytics Engineer path

> Goal: grow the platform into a full Data Engineer / Analytics Engineer curriculum.
> Four tracks in learning order: **Python → SQL → Software Design → Data Engineering**.
> New concept modules stay interactive: SOLID/patterns run as real Python in Pyodide;
> data modeling / warehousing / dbt labs run as real SQL in PGlite (star-schema seed);
> Spark/Databricks pair concept quizzes with pandas-simulated DataFrame exercises.

### Phase 1 — Structure + quick UX wins (DONE)
- [x] `Track` union extended: "Python" | "SQL" | "Software Design" | "Data Engineering"
- [x] **Learning-path roadmap page** (`/roadmap`): numbered stages by track, per-module
      progress bars, "you are here" marker, continue CTA; linked from TopBar + ⌘K
- [x] **Keyboard shortcuts**: Cmd/Ctrl+Enter runs/submits the focused editor (all runnable/
      challenge blocks + both playgrounds), `[` / `]` prev/next lesson, `?` shortcuts overlay
- [x] **Per-lesson notes** (see Phase B above)
- [x] **Settings dialog** (TopBar gear): export/import a JSON backup of all progress, notes
      & drafts (the local-first cross-device path from the Phase E decision), full reset
- [x] New module **Python OOP** (`python-oop`, 6 lessons, deep): classes & objects, dunder
      methods, inheritance & super(), composition over inheritance, dataclasses, properties/
      classmethods — prerequisite for the Software Design track; all challenge solutions
      verified in real Python
### Phase 2 — Warehouse foundation (DONE)
- [x] **Named SQL seeds**: `seeds.ts` now exports `SEEDS` (`ecommerce` + new `warehouse`
      star schema: `dim_date` via generate_series, `dim_customer` with real SCD2 history,
      `dim_product`, `fact_sales`, plus `staging.raw_orders` / `staging.customer_updates`);
      seeds start with `DROP SCHEMA ... CASCADE` so switches can't leak tables
- [x] **Seed plumbing**: `sqlClient.ensureSeed()` + `seedId` on `exec/reset/queryRows`;
      `SqlRunnableBlock.seedId` / `SqlChallengeBlock.seedId`; SchemaExplorer is seed-aware;
      LessonPage derives the panel's seed from the lesson's SQL blocks; SqlPlayground got a
      dataset picker
- [x] **Curriculum-wide SQL test** (`src/content/lessons.sql.test.ts`, replaces the
      postgres-only one): every sql-runnable/sql-challenge in EVERY module runs in real
      PGlite against its declared seed, sequentially per lesson like a learner would; plus
      a seed-switching isolation test
- [x] New module **Data Fundamentals** (5 lessons): landscape & roles, OLTP vs OLAP with
      real EXPLAIN plans, file formats with a row-vs-columnar Python simulation, batch vs
      streaming, the data lifecycle
- [x] New module **Data Modeling** (9 lessons): normalization, grain, star schemas,
      fact types & additivity, surrogate keys, date dimension, **SCD 0–3 with a live
      close-and-insert walkthrough**, as-was vs as-is analytics, OBT/Data Vault
- [x] New module **Warehouse, Lake & Lakehouse** (7 lessons): staging→core→marts with real
      PG schemas, ETL vs ELT, data lakes, Delta/Iceberg with a **Python transaction-log
      simulation + time-travel challenge**, medallion bronze/silver/gold lab, incremental
      loads & CDC, partitioning & pruning with EXPLAIN
- [x] PostgreSQL module +3 lessons (now 31): Bulk Loading & Data Generation, Table
      Partitioning (LIST/RANGE, drop-partition maintenance), Roles & Permissions (concepts)
- [x] Spike results: PGlite (Postgres 18.3) supports declarative partitioning + EXPLAIN
      pruning and MERGE; `COPY FROM STDIN` hangs (no client stream) → taught conceptually
      with set-based alternatives
### Phase 3 — Software Design track (DONE)
- [x] New module **SOLID Principles** (7 lessons): coupling/cohesion, then one lesson per
      principle — each with a *runnable violation* and a refactor-to-pass-the-tests
      challenge (god-function split, pluggable discounts, bird-hierarchy LSP fix,
      capability-split ISP, constructor-injection DIP) + a capstone messy-pipeline refactor
- [x] New module **Design Patterns** (6 lessons): Factory & Builder, Singleton/Borg (+ why
      to be careful), Strategy & Template Method, Adapter/Facade/Decorator (incl. writing
      `@memoize`), Observer/pub-sub (build an EventBus), and "Patterns in Data Tools"
      (mapping Airflow/dbt/Spark onto the patterns)
- [x] New module **Architecture Patterns** (5 lessons): layered → hexagonal/ports &
      adapters (runnable mini-app), DI + composition root (cached UserService challenge),
      functional composition (implement `compose`), idempotency & retries (implement
      `retry`), choosing an architecture (script → modular → orchestrated)
- [x] **`scripts/verify-python-challenges.mjs`**: extracts every Python challenge from the
      curriculum (esbuild-bundled) and runs each reference solution against its tests in
      real python3 — 61 challenges verified, all pass (2 sklearn ones skip without the lib)
### Phase 4 — Spark / Databricks / dbt (DONE)
- [x] **`pyspark` reworked → "Spark & PySpark"** (2 → 9 lessons, starter → deep, moved to
      the Data Engineering track; id kept so saved progress survives): architecture with a
      runnable hash-partitioning simulation, DataFrame API with **pandas-graded "translate
      the PySpark" challenges**, joins & shuffles, Spark SQL as ANSI labs in PGlite (with
      dialect table), window functions (SQL + pandas), performance (partitions/caching/AQE
      + a runnable **skew & salting simulation**), reading/writing (save modes, partitioned
      writes)
- [x] New module **Databricks** (7 lessons): platform (clusters/jobs/DBR/Photon), **Delta
      Lake with a real Postgres-15 MERGE lab** + predict-the-MERGE challenge, medallion +
      Auto Loader, Unity Catalog & lineage, Jobs/Workflows/DLT, Databricks SQL (portable
      window-function drills), rapid-fire cert-prep quiz set
- [x] New module **dbt** (6 lessons): the analytics-engineering workflow, **models & ref()
      built live as chained CREATE VIEWs** (+ DAG shown via the graph visualizer in BFS
      waves), materializations (incremental = high-water mark, run both stages),
      **tests compiled by hand** (unique/relationships/accepted_values as SQL returning
      violating rows), sources/seeds/snapshots (= the SCD2 you built), Jinja/macros (Python
      simulation of template compilation) + project-structure conventions
### Phase 5 — Pipeline operations (DONE)
- [x] New module **Orchestration (Airflow)** (5 lessons): DAGs (graph-viz execution
      waves), Airflow core (TaskFlow, operators, XCom), scheduling/logical dates/backfills
      + an idempotent-partition-load challenge, **capstone: build a mini orchestrator**
      (Kahn's topological sort + cycle detection + runner, 130xp), sensors & ecosystem
- [x] New module **Data Quality** (5 lessons): DQ dimensions, constraints as defense
      (expected-error labs), **reconciliation audits with a real planted discrepancy in
      the warehouse seed** (staging order 116 re-delivered with a different qty),
      Great-Expectations-style validation in Python, observability & incident response
- [x] New module **Streaming & Kafka** (4 lessons, starter): event vs processing time &
      watermarks, Kafka topics/partitions/offsets/consumer groups (runnable simulation),
      windowing + delivery semantics (implement tumbling_counts), Structured Streaming +
      lambda/kappa
- [x] New module **Python Engineering** (7 lessons): type hints (TypedDict/Protocol),
      errors done right (custom exceptions + raise-from config parser), generators
      (visualized laziness + chunked()), context managers (transactional-dict challenge),
      files & pathlib (real round-trip file I/O), pytest concepts (build a mini test
      runner), pydantic-style schema validation
### Phase 6 — Flashcards & spaced repetition (DONE — closes the old Phase B item)
- [x] New **`flashcards` block kind** (`FlashcardsBlock`: title + front/back cards) rendered
      by `components/lesson/blocks/Flashcards.tsx` via a shared
      `components/review/FlashcardStudy.tsx` (tap-to-flip, Again/Good/Easy)
- [x] **`store/reviewStore.ts`**: SM-2-lite scheduler as a pure, unit-tested `schedule()`
      (ease 2.5 default, floor 1.3; again → today; good → ×ease; easy → ×ease×1.3 with
      ease growth; 365-day cap); state persisted to localStorage (`pylearn-review`),
      keyed `lessonId::front`; card CONTENT stays in lesson data (no duplication)
- [x] **`/review` page**: due queue across the whole curriculum (new cards due
      immediately), with lesson attribution; TopBar "Review" link with live due-count
      badge; ⌘K entry
- [x] **6 decks / 40 cards** authored into concept-heavy lessons: SCD types
      (data-modeling), Databricks/Delta vocabulary (cert-prep), pattern intents
      (design-patterns), Kafka vocabulary (streaming), data-landscape essentials
      (data-fundamentals), storage-architecture vocabulary (warehouse-lakehouse)
- [x] Unit tests: scheduler transitions, ease floor, interval cap, curriculum-wide card-id
      uniqueness (`store/reviewStore.test.ts` — 9 tests)

## 2026-07 Foundations & Cloud tracks — Git/GitHub, Linux, AWS

> Goal: cover the engineering fundamentals a data engineer needs beyond code — the
> **environment** (Linux + Git) and the **cloud** (AWS core data services) — following
> the existing conceptual-module pattern (prose + quiz + flashcards + Python
> simulations + verified challenges). Two new tracks reframe the learning path:
> **Foundations & Tooling opens** it (before Python), **Cloud closes** it (after DE).

- [x] `Track` union extended: added `"Foundations & Tooling"` and `"Cloud"`
      (`src/types/lesson.ts`). Sidebar/Home/Roadmap already iterate `tracks()` /
      `modulesByTrack()` dynamically, so the two new sections appear at the right spot
      with no UI wiring; added `TRACK_BLURBS` entries in `Roadmap.tsx` and accent colors
      in `lib/moduleTheme.ts` (`linux`, `git-github`, `aws`)
- [x] New module **Linux & the Command Line** (`platform/linux.ts`, 8 lessons, deep):
      shell & filesystem, files/directories + **globbing** (implement shell globbing),
      viewing & searching text (grep/head/tail/wc), **pipes & the Unix philosophy**
      (rebuild `grep|sort|uniq -c`; implement a word-count pipeline), CLI data wrangling
      (cut/sort/awk streaming group-by), permissions (rwx, why secrets are `600`),
      processes & exit codes, environment & **cron** (implement a cron matcher) — with
      runnable Python simulations, 3 challenges, quizzes, and flashcard decks
- [x] New module **Git & GitHub** (`platform/git.ts`, 8 lessons, deep): the **commit
      DAG** (build & walk it in Python), core add/commit/diff loop, branching & merging
      (compute a merge-base), rebase vs merge + golden rule, remotes/GitHub & the **PR
      workflow**, undoing safely (reset/revert/reflog — compute a branch tip after ops),
      **Git for data teams** (never commit data/secrets, LFS/DVC), **CI/CD with GitHub
      Actions** (pytest/dbt tests on PRs) — runnable DAG sims, 2 challenges, quizzes,
      flashcards
- [x] New module **AWS for Data** (`cloud/aws.ts`, 8 lessons, deep): AWS mental model
      (regions/AZs, shared responsibility, IaC), **IAM** least privilege (implement
      policy allow/deny evaluation), **S3 data lakes** (keys-as-prefixes, partition
      pruning as a prefix filter — implement it, storage classes/lifecycle), compute
      (EC2/Spot vs Lambda vs Fargate), databases (RDS/DynamoDB/Redshift = OLTP/NoSQL/
      OLAP), the **AWS data stack** (Glue/Athena/EMR/Kinesis/Step Functions mapped to
      Spark/warehouse/Kafka/Airflow, with an Athena scan-cost simulation), building &
      operating a lakehouse (cost + CloudWatch/CloudTrail) — 2 challenges, quizzes,
      flashcards
- [x] Registered in `curriculum.ts`: `linux` + `gitGithub` first (before `basics`),
      `aws` last (after `streaming`); README curriculum tables + track list updated
- [x] Verified: all 7 new Python challenge solutions pass under real python3
      (`scripts/verify-python-challenges.mjs`); flashcard card-id uniqueness test still
      green; typecheck + build clean

### Phase E — Platform & accounts
- [x] Deploy the static app to **GitHub Pages** via Actions (`.github/workflows/deploy.yml`,
      `DEPLOY_BASE` subpath + router basename + `404.html` fallback). Local dev unchanged at
      `localhost:5173/`. Live: https://andres-lizarazo.github.io/data-learning/

> **Decision (2026-06-18): keep it personal-study / local-only for now.** Progress (XP, streak,
> completion, bookmarks, editor drafts) lives in each visitor's browser `localStorage` — it is
> **per-browser and private**: every visitor has their own independent progress, nothing is
> shared across people, and nothing syncs across a user's devices. This is intentional for a
> no-friction personal study tool. **To revisit later** (each needs work):
> - **Export/Import profile** (no backend): a code/URL to carry your own progress between your
>   devices manually. Fully local-doable.
> - **Accounts + cloud sync + leaderboard** (needs a backend, e.g. Supabase/Firebase): real
>   multi-user, cross-device progress and a shared leaderboard. Deferred until we choose to.
- [ ] 🚧 Optional accounts + cross-device sync (e.g. Supabase) for progress/XP
- [ ] 🚧 Leaderboard, daily goals, shareable profile/achievement cards
- [ ] 🚧 Optional **FastAPI + Spark (Docker)** backend so PySpark lessons run for real
- [ ] 🚧 i18n: ES/EN content + UI toggle

## 2026-07 Quality, robustness & UX hardening (DONE)

A four-phase pass after an audit found the platform feature-complete and clean but with
gaps in enforcement, robustness, content hints, and theming. All shipped to `main` with a
green CI gate + Playwright e2e.

### Phase 1 — Safety net
- [x] **Gated CI** (`.github/workflows/ci.yml`): typecheck + lint + unit tests + `verify:py`
      on every push/PR. CI installs the scientific stack so package-backed challenges are
      verified, not skipped. (The suite already existed but nothing enforced it.)
- [x] **Runner error handling**: the four runners (Python/SQL challenge, execution &
      user-driven visualizers) now `catch` engine-level failures and surface them.
- [x] **ErrorBoundary** around the router outlet (recoverable panel, no white-screen).
- [x] **ESLint (flat config) + Prettier**; `lint`/`verify:py`/`format` scripts.
- [x] Dev-time warning on unknown block/viz kinds; `sqlCompare` row-key regression test.

### Phase 2 — Hygiene / logic
- [x] `version` + `migrate` on both persisted zustand stores (heal old localStorage).
- [x] Streak rolls over at the learner's **local** midnight (was UTC).
- [x] Pyodide **inactivity watchdog + restart** (infinite loops no longer hang forever).

### Phase 3 — Content depth
- [x] Progressive **hints** on every previously hint-less hard challenge (DSA, basics,
      numpy, libraries, pandas); explicit **XP** on every Python & SQL challenge.
- [x] **Flashcard decks** for the Python core + PostgreSQL (feed the `/review` queue).
- [x] Quizzes for DSA/numpy/libraries; first **viz** challenges; first **PySpark** &
      **Databricks** hands-on challenges.
- [x] New **Decorators** lesson (Python Engineering).
- [x] New **SQL-from-Python & API ingestion** lesson (SQLAlchemy Core + in-memory SQLite;
      verified it micropip-installs and runs in Pyodide).

### Phase 4 — UX
- [x] **Light/dark theme** toggle: CSS-variable palette via `html.light`, persisted,
      OS-aware on first visit; shared primitives + common utilities remap in one place.
- [x] **Full-text ⌘K search** over lesson content (prose/prompts/quizzes/flashcards).
- [x] **Reference page** (`/reference`) surfacing the PostgreSQL study guide + a Python
      cheatsheet (sticky TOC).
- [x] **Visualize** button on pure-Python runnable blocks (opens the step-through
      visualizer on the same code); first-run **onboarding** modal.
- [x] **Difficulty** badges + filter on `/practice` (derived from XP).
- [x] A11y: reusable **focus-trap** on the command palette + onboarding; **keyboard
      grading** for flashcards (Space to flip, 1/2/3 to grade).

## 2026-07 Content deepening pass (DONE)

Filled the remaining depth gaps within existing modules — no new tooling or block kinds,
authored as typed TS and verified end-to-end (`npm run build`, Python solutions run against
`python3`, SQL run against a real Postgres 16 in Docker).

### Python
- [x] **Intro to ML** promoted `starter → deep`: added **Regression & metrics** (LinearRegression,
      MAE/RMSE/R²), **Preprocessing & Pipelines** (StandardScaler, leakage, `Pipeline`),
      **Cross-Validation & over/underfitting**, and **Classification Metrics**
      (confusion matrix, precision/recall/F1, ROC) — each prose + runnable + quiz + challenge,
      plus a closing flashcard deck. Blurb updated.
- [x] **Core Libraries** — new **Regular Expressions (`re`)** lesson (search/match/findall/sub,
      named groups, `~`), closing the platform's total absence of regex.
- [x] **DSA** — DP expanded from 2 → 5 lessons: **0/1 Knapsack**, **Longest Increasing
      Subsequence**, **Edit Distance**, plus a dedicated **Big-O Complexity** lesson. Added 6
      quizzes across them (DSA was previously quiz-light).
- [x] **Python OOP** — new **ABCs, Protocols & Enums** lesson (nominal vs structural typing,
      `enum.Enum`).
- [x] **NumPy** — new **Linear Algebra & Random** lesson (`@` vs `*`, `np.linalg.solve`,
      `default_rng`).
- [x] **Pandas** — added quizzes (groupby result shape, inner-join semantics); module had none.
- [x] **Data Visualization** — added graded challenges (pandas `value_counts` bars, seaborn
      boxplot) and a **"🧭 which chart for which question"** guide + quizzes (module was
      challenge-light and lacked chart-selection guidance).

### SQL (PostgreSQL)
- [x] **PL/pgSQL control flow** made interactive: `IF/LOOP/WHILE/FOR`, `FOR … IN SELECT`,
      `CONTINUE`, and `EXCEPTION WHEN … SQLERRM` runnables + a factorial `sql-challenge`
      (ported from `sql-reference/concepts.md` §20).
- [x] **Stored procedures** — runnable `CREATE PROCEDURE` / `CALL` example (§18).
- [x] **`EXPLAIN ANALYZE`** — runnable showing real timings + index use on a generated table (§13).
- [x] **String functions / regex** — `initcap`, `lpad`, `translate`, `regexp_replace`,
      `regexp_matches`, `format`, `~` runnable (§21).
- [x] **Self-join** runnable (categories → parent) in the JOINs lesson (§2).
- [x] **Cheat-sheet** deck extended with DISTINCT ON, COALESCE/NULLIF, string_agg, FILTER,
      keyset pagination, EXPLAIN vs EXPLAIN ANALYZE (§0).

## Decisions Log
- **Light theme via CSS variables + `.light` utility remaps (not a full `dark:` rewrite):**
  the app was authored dark-only with no `dark:` prefixes, so inverting every className was
  infeasible. Instead the shared primitives (glass/btn/prose) consume CSS variables switched
  by an `html.light` class, and the handful of pervasive inline utilities (`text-slate-*`,
  `bg-white/*`, `border-white/*`) are remapped once under `.light`. Code blocks deliberately
  stay dark for contrast. Delivers a coherent theme with a contained, low-risk change.
- **SQL-from-Python taught with SQLAlchemy + in-memory SQLite (not psycopg/requests):**
  Pyodide has no sockets, so real DB drivers and `requests` can't run in-browser. SQLAlchemy
  Core micropip-installs and runs against `sqlite:///:memory:`, so the *pattern* (engine,
  parametrized queries, bulk load) is taught with real, runnable code; JSON parsing stands in
  for the API call. Verified end-to-end in Pyodide before shipping.
- **XP as the difficulty signal (no separate `difficulty` field):** challenges were already
  authored with XP scaling by effort, so the Practice difficulty filter/badges derive
  Easy/Medium/Hard from XP thresholds — zero content churn, no new field to keep in sync.
- **Two new tracks framing the path (Foundations & Tooling first, Cloud last):** Git
  and Linux are environment prerequisites every engineer needs before writing code, so
  they open the curriculum; AWS core data services are the capstone that ties the
  earlier concepts to real cloud infra (S3=lake, Redshift=warehouse, Glue=ETL,
  Kinesis=streaming), so it closes it. A single "Platform & Tools" track couldn't sit
  both first and last (a track renders as one contiguous section, positioned at its
  first module), which is why it's split into two tracks. Git/Linux/AWS can't run
  natively in Pyodide/PGlite, so they follow the `de/streaming.ts` conceptual pattern:
  prose + quiz + flashcards + **Python simulations** of the mechanics (commit DAG,
  shell pipeline, IAM evaluation, S3 prefix pruning, Athena scan cost) + verified
  challenges — no new block kinds or infra.
- **PGlite for SQL (not SQLite/sql.js):** the sql-learning content is heavily
  Postgres-specific (JSONB `@>`/`?`, arrays, window functions, recursive CTEs, `FILTER`,
  `generate_series`, `DISTINCT ON`, `PERCENTILE_CONT`, PL/pgSQL, full-text search). Only
  PGlite (real Postgres compiled to WASM) runs all of it faithfully; SQLite would fail most
  sections. Mirrors the Pyodide model (a WASM engine behind a typed client).
- **PGlite on the main thread (not a worker):** queries hit tiny seeded tables, so blocking
  is negligible, and it avoids the fragility of bundling PGlite's WASM/data into a nested
  Vite module worker. The client keeps the same status-stream API as the Pyodide worker.
- **SQL challenges graded by result-set comparison:** run the learner's query and a
  reference `solution` against a freshly seeded DB and compare rows by value/position
  (order-insensitive unless `ordered`). Robust to column aliasing and avoids hand-encoding
  expected outputs.
- **Pyodide over a backend kernel:** zero-install, local-first, trivially deployable as
  static files; keeps everything client-side. Trade-off: no JVM → PySpark stays conceptual.
- **Web Worker for Pyodide:** the interpreter is blocking; a worker keeps the UI responsive.
- **Lessons as typed TS data (not MDX):** type-safe authoring, no markdown/MDX build
  pipeline, and interactive blocks are just structured data.
- **`sys.settrace` recorder over embedding Python Tutor:** full control over the UI and
  no external iframe/runtime dependency.
- **Custom DSA frame generators in TS:** deterministic, controllable animations decoupled
  from Python execution (fast and offline-friendly).
