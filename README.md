# Data Learning 🐍🐘

An interactive, **visual** platform to learn **Python and SQL** — CodeSignal-style, but
everything runs **100% in your browser**. Write code, press Run, and *watch loops and
algorithms animate step by step* — or query a **real PostgreSQL database**. No backend,
no installs: a full CPython interpreter runs client-side via
[Pyodide](https://pyodide.org), and a full Postgres engine via
[PGlite](https://pglite.dev) — both WebAssembly.

The platform is organized into six **tracks**, in recommended learning order (see the
in-app **/roadmap** page for the full numbered path):

- **Foundations & Tooling** — **Linux & the command line** (shell, pipes & CLI data
  wrangling, permissions, processes, cron) and **Git & GitHub** (the commit DAG,
  branching, rebase, PRs, and CI for data) — the environment every data job runs in.
- **Python** — basics → data structures → **OOP** → DSA → libraries → NumPy/Pandas → viz → ML.
- **SQL** — a **PostgreSQL** subsection where every example runs against a seeded
  e-commerce database and most lessons end with a checked query exercise.
- **Software Design** — SOLID principles, classic design patterns, and architecture
  patterns (hexagonal, DI, reliability) — all as runnable Python with
  refactor-to-pass-the-tests challenges.
- **Data Engineering** — data fundamentals, dimensional modeling (star schemas, SCD2),
  warehouse/lakehouse/medallion, Spark & Databricks, dbt, orchestration, data quality,
  and streaming.
- **Cloud** — **AWS for Data**: IAM & least privilege, S3 data lakes, compute
  (EC2/Lambda/Fargate), databases (RDS/DynamoDB/Redshift), and the managed data stack
  (Glue, Athena, EMR, Kinesis, Step Functions) — mapped to everything you already built.

## What you can do

- **Learn by doing** — every concept comes with an editable, runnable code block.
- **See loops flow** — the **Execution Visualizer** steps through your code line by
  line, highlighting the current line and animating the variable table on each
  iteration (inspired by pythontutor.com).
- **Visualize DSA** — animated views of arrays, sorting, linked lists, stacks/queues,
  binary trees (BST traversals), graphs (BFS/DFS), and the recursion call stack.
- **Solve challenges** — CodeSignal-style problems with visible + hidden test cases,
  instant pass/fail, and XP rewards.
- **Real data libraries** — `numpy`, `pandas`, `matplotlib`, and `seaborn` run in the
  browser; plots render inline.
- **Query real SQL** — a full **PostgreSQL** engine (PGlite/WASM) runs in the browser.
  SQL lessons render results as a grid, ship a **schema explorer** for the sample DB, and
  grade exercises by comparing your result set to a reference solution. There's also a
  free-form **SQL Playground**.
- **Track progress** — XP, daily streak, and per-lesson completion, saved locally; a
  **learning-path roadmap** (`/roadmap`) shows where you are and what's next.
- **Remember it** — flashcard decks in concept lessons feed a **spaced-repetition
  review queue** (`/review`, SM-2-style scheduling, due-count badge in the top bar).
- **Take notes** — a personal notes panel on every lesson, saved with your progress.
- **Look things up** — a standalone **Reference** page (`/reference`) with the full
  PostgreSQL study guide (sticky table of contents) and a Python cheatsheet, plus
  **full-text ⌘K search** that searches lesson *content*, not just titles.
- **Learn your way** — a **light / dark theme** toggle (persisted; follows your OS
  preference on first visit) and a first-run tour of the visualizer, shortcuts, and
  local-execution model.
- **Back up & restore** — export/import all progress, notes, and code drafts as JSON
  from the settings dialog (move between devices without any account).
- **Keyboard shortcuts** — `⌘/Ctrl+Enter` runs the focused editor, `[` / `]` jump
  between lessons, `⌘K` searches lessons by title *and* content, `?` shows the cheat
  sheet; in the review queue, Space flips a card and `1`/`2`/`3` grade it.

## Curriculum

### Foundations & Tooling track

| Module | Status | Highlights |
|---|---|---|
| 🐧 Linux & the Command Line | **deep** | the shell & filesystem, files/globbing (implement shell globbing), viewing & searching text (grep/head/tail/wc), **pipes & the Unix philosophy** (rebuild a `grep\|sort\|uniq -c` pipeline + a word-count challenge), CLI data wrangling (cut/sort/awk streaming group-by), permissions (why secrets are `600`), processes & exit codes, environment & **cron** (implement a cron matcher) |
| 🌿 Git & GitHub | **deep** | snapshots & the **commit DAG** (build & walk it in Python), the core add/commit/diff loop, branching & merging (compute a merge-base), rebase vs merge & the golden rule, remotes/GitHub & the **PR workflow**, undoing safely (reset/revert/reflog — compute a branch tip after ops), **Git for data teams** (never commit data/secrets, LFS/DVC), and **CI/CD with GitHub Actions** (pytest/dbt tests on every PR) |

### Python track

| Module | Status | Highlights |
|---|---|---|
| 🐍 Python Basics | **deep** | types, operators, strings, conditionals, **loops (visualized)**, functions, comprehensions, errors |
| 🧱 Data Structures | **deep** | lists, tuples, dicts, sets, stacks/queues (with visualizers) |
| 🏗️ Python OOP | **deep** | classes & objects, dunder methods, inheritance & super(), composition over inheritance, dataclasses, properties/classmethods, **ABCs/Protocols/Enums** — the bridge into the Software Design track |
| 🛠️ Python Engineering | **deep** | type hints (TypedDict/Protocol), custom exceptions & `raise from`, generators & lazy pipelines, context managers (build a transactional dict), **decorators** (write `@count_calls` with `functools.wraps`), files & pathlib (real I/O), pytest concepts (build a mini test runner), pydantic-style validation |
| 🧠 DSA — Algorithms | **deep** | two pointers, hashing (hash-table viz), sliding window, recursion, backtracking, sorting, binary search, linked lists, trees, heaps, graphs (BFS/DFS), tries, DP (coin change, **0/1 knapsack, LIS, edit distance**), **Big-O complexity** — with a call-stack panel + watch variables in the visualizer |
| 🤖 Intro to ML | **deep** | scikit-learn in the browser: workflow & train/test split, fitting classifiers, **regression + metrics (MAE/RMSE/R²)**, **preprocessing & Pipelines**, **cross-validation & over/underfitting**, **classification metrics (precision/recall/F1/ROC)** |
| 📦 Core Libraries | **deep** | collections/itertools, datetime/random/json, math/statistics, functools, **regular expressions (`re`)** (+ challenges) |
| 🔢 NumPy | **deep** | arrays & vectorization, indexing/reshaping, aggregations/broadcasting, **linear algebra & random** (+ challenges) |
| 🐼 Pandas | **deep** | DataFrames, selecting/filtering, cleaning, group-by/agg, merge/join (+ challenges) |
| 📈 Data Visualization | **deep** | matplotlib, customizing plots, plotting from pandas, seaborn (distribution & categorical) |

### SQL track

| Module | Status | Highlights |
|---|---|---|
| 🐘 PostgreSQL | **deep** | 31 lessons: SELECT/WHERE (+ self-join), JOINs (+LATERAL), GROUP BY/HAVING/FILTER, CASE, subqueries/EXISTS, CTEs (+recursive), window functions, set ops, INSERT/UPDATE/DELETE/UPSERT, transactions, DDL/constraints, indexes/EXPLAIN (+ **EXPLAIN ANALYZE**), arrays, JSONB, views/matviews, functions/**procedures**/triggers (**PL/pgSQL with interactive loops, `FOR … IN SELECT` & exception handling**), string/date/math/NULL functions (+ **regex**), full-text search, interview patterns, an **Advanced Query Workshop** (multi-CTE pipelines: UNNEST + window + FILTER + ROLLUP + gaps-and-islands), an **Analytics Patterns (Interview Pack)** (period-over-period/LAG, rolling averages, gap-based sessionization, dedupe-keep-latest, NTILE segmentation, cohort retention), a **Funnel Conversion** lesson (loose vs. strict ordered funnels), a **Recursive CTEs — Manager Chains & Trees** lesson (walk hierarchies up/down), **Pivot & Unpivot** (FILTER pivot + VALUES/LATERAL unpivot), **Statistics, Percentiles & Histograms** (median with/without `PERCENTILE_CONT`, `percent_rank`/`cume_dist`, `width_bucket`), **Data-Modifying CTEs & MERGE** (writable CTEs + `MERGE` upserts), **Pagination & Performance** (keyset/seek pagination, EXISTS vs IN, anti-joins), and a **Data Engineering & ETL Patterns** lesson (incremental load/watermark, SCD Type 2, calendar/date dimension, dynamic pivot, plus a T-SQL→PostgreSQL translation map) — each runnable against a seeded e-commerce DB, most with a graded exercise. Many lessons open with a **"🧭 When to use what"** decision guide. Includes "vs MySQL" notes throughout. |

### Software Design track

| Module | Status | Highlights |
|---|---|---|
| 📐 SOLID Principles | **deep** | coupling & cohesion, then S-O-L-I-D one by one — every principle shown as a runnable violation, fixed via a refactor-to-pass-the-tests challenge, closing with a messy-pipeline capstone |
| 🧩 Design Patterns | **deep** | Factory & Builder, Singleton/Borg, Strategy & Template Method, Adapter/Facade/Decorator (write your own `@memoize`), Observer (build an EventBus), and how Airflow/dbt/Spark are made of these patterns |
| 🏛️ Architecture Patterns | **deep** | layered → hexagonal (ports & adapters mini-app), dependency injection & composition roots, functional pipeline composition (implement `compose`), idempotency & retries (implement `retry`), choosing architectures by stage |

### Data Engineering track

| Module | Status | Highlights |
|---|---|---|
| 🧭 Data Fundamentals | **deep** | data-team roles & the modern stack, OLTP vs OLAP (real `EXPLAIN` plans on a 20k-row table), file formats (CSV/JSON/Avro/Parquet with a row-vs-columnar Python simulation), batch vs streaming, the data lifecycle, **SQL from Python & API ingestion** (SQLAlchemy Core against in-memory SQLite — parametrized queries, bulk load, JSON-as-API) |
| 💠 Data Modeling | **deep** | normalization → grain → **star schemas** (Kimball), fact-table types & additivity, surrogate keys, the date dimension, **SCD Type 2 hands-on** (close-and-insert on a real dimension with history), as-was vs as-is analytics, One Big Table & Data Vault — every lab runs on a seeded **warehouse star schema** in PGlite |
| 🏔️ Warehouse, Lake & Lakehouse | **deep** | staging→core→marts built with real Postgres schemas, ETL vs ELT, data lakes & the swamp problem, **Delta/Iceberg table formats** (build a mini transaction log + time travel in Python), **medallion bronze/silver/gold lab**, incremental loads & CDC (high-water mark, idempotent anti-join), partitioning & pruning with `EXPLAIN` |
| ⚡ Spark & PySpark | **deep** | driver/executors/partitions (hash-partitioning simulation), DataFrame API with **pandas-graded translation challenges**, joins & shuffles (broadcast vs sort-merge), Spark SQL as runnable ANSI labs, window functions, performance (**skew & salting simulation**, caching, AQE), reading/writing (save modes, partitioned writes) |
| 🧱 Databricks | **deep** | workspace/clusters/Photon, **Delta Lake MERGE run for real** (PG15) + time travel & VACUUM, medallion + Auto Loader, Unity Catalog & lineage, Jobs/Workflows/DLT, Databricks SQL drills, rapid-fire cert-prep quizzes |
| 🔶 dbt | **deep** | models & `ref()` DAGs built live as chained views, materializations (incremental = high-water mark), **dbt tests written by hand as SQL**, sources/seeds/snapshots (=SCD2), Jinja & macros, project-structure conventions |
| 🗓️ Orchestration (Airflow) | **deep** | DAGs & execution waves, TaskFlow/operators/XCom, logical dates & backfills, idempotent loads — capstone: **build a mini orchestrator** (topological sort + cycle detection) |
| ✅ Data Quality | **deep** | DQ dimensions, constraints (watch the DB reject bad rows), **reconciliation audits that catch a real planted discrepancy in the seed**, expectations-style validation in Python, observability & incident response |
| 🌊 Streaming & Kafka | starter | event time vs processing time & watermarks, Kafka partitions/offsets/consumer groups (simulated), tumbling windows (implement one), delivery semantics, Structured Streaming, lambda vs kappa |

### Cloud track

| Module | Status | Highlights |
|---|---|---|
| ☁️ AWS for Data | **deep** | the AWS mental model (regions/AZs, shared responsibility, IaC), **IAM** (least privilege — implement policy allow/deny evaluation), **S3 data lakes** (keys as prefixes, partition pruning as a prefix filter — implement it, storage classes/lifecycle), compute (EC2/Spot vs Lambda vs Fargate), databases (RDS/DynamoDB/Redshift = OLTP/NoSQL/OLAP), the **AWS data stack** (Glue, Athena, EMR, Kinesis, Step Functions — mapped to Spark/warehouse/Kafka/Airflow, with an Athena scan-cost simulation), and building/operating a lakehouse (cost & CloudWatch/CloudTrail) |

> SQL lessons declare which seeded dataset they use: the OLTP **e-commerce** schema or the
> dimensional **warehouse** star schema (`seedId` on SQL blocks). The SQL Playground has a
> dataset picker for both.

> Plots render **automatically** whenever your code draws a matplotlib/seaborn figure —
> no `plt.show()` needed.

> **Why PySpark is conceptual:** Spark needs a JVM and a cluster, which cannot run in
> the browser. This module teaches the model and API (with a pandas↔Spark mapping) so
> the code is familiar when you run it on a real cluster.

## Design

**"Aurora Glass"** — a dark, premium aesthetic: an animated aurora gradient-mesh
background, **glassmorphism** panels (translucent + blur + hairline borders), a
violet→cyan→lime accent spectrum, and a Space Grotesk / Inter / JetBrains Mono type
trio. Motion via Framer Motion (entrance/hover springs, animated counters), icons via
lucide-react, and gamification with XP **levels**, an animated streak flame, and
**confetti** on solves/completions. Respects `prefers-reduced-motion`.

## Architecture

```
React + Vite + TypeScript + Tailwind
   │
   ├─ Monaco editor ........... code editing (Python + SQL)
   ├─ Pyodide (Web Worker) .... runs Python off the main thread
   │     ├─ run  → stdout/stderr (+ matplotlib PNGs)
   │     ├─ trace → sys.settrace step recorder (ExecutionVisualizer)
   │     └─ install → micropip / loadPackage
   ├─ PGlite (WASM) ........... real PostgreSQL in the browser
   │     ├─ exec  → result grid / affected rows / errors
   │     └─ reset → reload the seeded e-commerce DB
   ├─ Zustand ................. progress + XP (persisted to localStorage)
   └─ Content as typed TS ..... src/content/modules/**/*.ts
```

Key directories:

- `src/pyodide/` — `worker.ts` (interpreter host), `pyodideClient.ts` (typed promise
  API), `tracer.py` (the step recorder behind the visualizer).
- `src/sql/` — `sqlClient.ts` (PGlite wrapper: `exec`/`reset`/`queryRows` + status) and
  `seeds.ts` (the e-commerce schema/data + schema description).
- `src/components/visualizer/` — `ExecutionVisualizer.tsx` and `dsa/*` animations.
- `src/components/challenge/` — `ChallengeRunner.tsx` (Python tests) and
  `SqlChallengeRunner.tsx` (compares your result set to a reference solution).
- `src/components/sql/` — `SqlResultTable.tsx`, `SchemaExplorer.tsx`.
- `src/content/` — `curriculum.ts` (the index, grouped by `track`) + `modules/**/*.ts`
  (lessons; SQL lives in `modules/sql/postgres.ts`).

## Quickstart

```bash
npm install
npm run dev      # open the printed localhost URL (http://localhost:5173)
```

The first time you run Python, Pyodide downloads (~6–10 MB) and boots; NumPy/pandas/etc.
install on first use. The first time you run SQL, PGlite's Postgres WASM (~10 MB) downloads
and boots, then seeds the sample database. Both are cached by the service worker for
offline use after the first visit.

Build for production: `npm run build` then `npm run preview`.

## Quality & testing

Every push and PR runs a CI gate (`.github/workflows/ci.yml`) that must pass before the
Pages deploy:

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint (flat config) + Prettier available via npm run format
npm test            # Vitest — incl. running EVERY SQL block end-to-end in real PGlite
npm run verify:py   # runs every Python challenge's reference solution against its tests
npm run test:e2e    # Playwright smoke tests (boot Pyodide + PGlite in a real browser)
```

`verify:py` uses the system `python3` (CI installs numpy/pandas/matplotlib/scikit-learn/
scipy/sqlalchemy so package-backed challenges are verified, not skipped). This means a
broken lesson solution or a regression in the engines fails CI rather than shipping.

## Adding a lesson

Lessons are plain typed data — no markdown files to wire up. Edit the relevant module
in `src/content/modules/`, appending a `Lesson` whose `blocks` array mixes:

`prose` · `runnable` · `visualized` · `dsa-viz` · `challenge` · `quiz` ·
`flashcards` · `sql-runnable` · `sql-challenge`

A module's `track` field (`"Foundations & Tooling"` | `"Python"` | `"SQL"` |
`"Software Design"` | `"Data Engineering"` | `"Cloud"`, default `"Python"`) controls
which section it appears under in the sidebar/home and where it slots into the
`/roadmap` learning path (tracks render dynamically in curriculum order). SQL blocks run against the seeded DB in
`src/sql/seeds.ts`; a `sql-challenge` is graded by comparing your result set to its
`solution` query (order-insensitive unless `ordered: true`). See `src/types/lesson.ts`
for the full shape, `modules/basics.ts` for Python examples, and
`modules/sql/postgres.ts` for SQL.

## Deployment

The app is a static SPA, deployed to **GitHub Pages** via GitHub Actions
(`.github/workflows/deploy.yml`) on every push to `main`:

- Live URL: **https://andres-lizarazo.github.io/data-learning/**
- The production build sets `DEPLOY_BASE=/data-learning/` (Vite `base`) so assets/routes
  resolve under the project subpath; the router uses `import.meta.env.BASE_URL` as its
  `basename`. A `404.html` (copy of `index.html`) handles deep-link refreshes.
- **Local dev is unaffected** — `npm run dev` still serves at `http://localhost:5173/` (base `/`).

Pyodide and fonts load from their CDNs at runtime and are cached by the service worker, so
the deployed app works offline after the first visit.

## Roadmap

See [`implementation_plan.md`](./implementation_plan.md) for what's built and what's next.
