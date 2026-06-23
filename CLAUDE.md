# Data Learning — CLAUDE.md

Project-specific context and rules. Inherits the root `projects/CLAUDE.md`.

## Repo structure note

This project is a **git submodule** of `andres-lizarazo/projects`, living in the
`data-learning/` folder. Its remote is still
`https://github.com/andres-lizarazo/python-learning.git` until the GitHub repo is renamed
to `data-learning` (GitHub redirects the old URL, so pushes keep working in the meantime;
after renaming, update the remote URL, `DEPLOY_BASE` in `.github/workflows/deploy.yml`, and
the live-URL references). Commit/push from inside this folder; then update the pointer in
the parent. The former standalone `sql-learning` repo has been **merged in** — its
reference docs now live in `sql-reference/` and its content was ported into the interactive
PostgreSQL module.

## What this is

An interactive, visual platform to learn **Python and SQL** (CodeSignal-style), running
entirely in the browser. Python runs via **Pyodide**; SQL (PostgreSQL) runs via **PGlite**
(real Postgres compiled to WASM). React + Vite + TypeScript + Tailwind. Local-first.

Content is organized into **tracks** (`Module.track`: "Python" | "SQL"). SQL lessons live
in `src/content/modules/sql/postgres.ts` and run against a seeded e-commerce DB
(`src/sql/seeds.ts`); the SQL engine wrapper is `src/sql/sqlClient.ts`. The original SQL
study notes are kept in `sql-reference/` (source of truth the module was ported from).

## Commands

```bash
npm install          # install deps
npm run dev          # dev server (http://localhost:5173)
npm run build        # typecheck (tsc -b) + production build
npm run preview      # serve the production build
npm run typecheck    # types only
```

There is **no backend** and **no Docker**. Everything is static + the Pyodide CDN.

## Architecture notes / gotchas

- **Pyodide runs in a Web Worker** (`src/pyodide/worker.ts`). The main thread talks to
  it via `src/pyodide/pyodideClient.ts` (promise-based postMessage). One shared
  interpreter instance for the whole app.
- Pyodide itself is loaded from jsDelivr at a **pinned version** (`PYODIDE_VERSION` in
  `worker.ts`). The worker dynamically imports `pyodide.mjs` from the CDN.
- **The Execution Visualizer** depends on `src/pyodide/tracer.py` (a `sys.settrace`
  recorder). User code is compiled under the filename `<exec>`; the tracer only records
  frames from that file. Steps and per-variable reprs are capped (constants in
  `tracer.py`) to keep things responsive.
- **Challenges**: `ChallengeRunner` builds a Python harness that runs each test in
  isolation and prints a JSON line prefixed with `__PL_RESULTS__`, which the client
  parses. Test `assertion` strings are appended after the user's code.
- **Plots**: matplotlib uses the AGG backend; figures are captured as base64 PNGs by
  `__pylearn_render_plots()` (defined in the worker bootstrap). Lessons set
  `expectPlot: true` on a runnable block to show them. Don't call `plt.show()`.
- **Packages**: `numpy/pandas/matplotlib/scipy` load via `loadPackage`; everything else
  (e.g. `seaborn`) installs via `micropip`. First install is slow; it's cached after.
- **Content** lives in `src/content/modules/*.ts` as typed `Module`/`Lesson` data.
  `curriculum.ts` is the index that the sidebar, router, and progress use.
- **Progress/XP/streak** persist to `localStorage` under key `pylearn-progress`.

## Conventions

- Keep lessons as typed data; reuse the existing block kinds before inventing new ones.
- Add a new module by exporting a `Module` and registering it in `curriculum.ts`.
- Mark fully-built modules `status: "deep"`, seeded ones `status: "starter"`.
- Per root rules: commits/pushes only as `andres-lizarazo`, **no AI co-author trailer**,
  and never push without asking. No secrets committed (there are none here).
- Keep `README.md` and `implementation_plan.md` current as features land.
