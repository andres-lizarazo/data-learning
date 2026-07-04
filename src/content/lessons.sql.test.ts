import { describe, it, expect, beforeAll } from "vitest";
import { curriculum } from "./curriculum";
import { sqlClient } from "../sql/sqlClient";
import { compareResultSets } from "../lib/sqlCompare";

// End-to-end verification that EVERY SQL block in the WHOLE curriculum actually runs in
// the real engine (PGlite — the same Postgres/WASM the browser uses), against its
// declared seed, via the same production client (`sqlClient`) the app calls.
//
// Blocks run SEQUENTIALLY within each lesson, exactly like a learner working top to
// bottom: the seed is reloaded once at the start of the lesson, then each block only
// resets when it declares `resetBefore` (some lessons build helper tables in an early
// block that later blocks query — a full reset per block would break them).
//   • sql-runnable  → must succeed (or, if flagged `expectError`, must fail — those
//                     are teaching demos of constraint violations).
//   • sql-challenge → the reference `solution` must run and return a result set, and the
//                     grader must accept it against itself (sanity-check of the harness).

beforeAll(async () => {
  await sqlClient.init();
}, 60_000);

for (const module of curriculum) {
  const sqlLessons = module.lessons.filter((l) =>
    l.blocks.some((b) => b.kind === "sql-runnable" || b.kind === "sql-challenge"),
  );
  if (sqlLessons.length === 0) continue;

  describe(`${module.title} — every SQL block runs end-to-end in PGlite`, () => {
    for (const lesson of sqlLessons) {
      describe.sequential(lesson.title, () => {
        const firstSql = lesson.blocks.find(
          (b) => b.kind === "sql-runnable" || b.kind === "sql-challenge",
        );

        lesson.blocks.forEach((block, i) => {
          if (block.kind === "sql-runnable") {
            it(`runnable #${i}: ${block.title ?? "(untitled)"}`, async () => {
              const res = await sqlClient.exec(block.sql, {
                // Fresh seed at the start of the lesson, then only when declared —
                // mirrors a learner running the blocks top to bottom.
                reset: block === firstSql || block.resetBefore,
                seedId: block.seedId,
              });
              if (block.expectError) {
                expect(res.ok, "snippet was flagged expectError but it succeeded").toBe(
                  false,
                );
              } else {
                expect(res.ok, res.error ?? "unknown error").toBe(true);
              }
            });
          }

          if (block.kind === "sql-challenge") {
            it(`challenge #${i}: ${block.title}`, async () => {
              // The app's grader always resets before comparing — mirror it exactly, so
              // a challenge that (wrongly) depends on in-lesson helper tables fails here
              // the same way it would fail for a learner.
              await sqlClient.reset(block.seedId);
              const sol = await sqlClient.queryRows(block.solution);
              expect(sol.ok, sol.error ?? "solution failed to run").toBe(true);
              expect(sol.columns.length).toBeGreaterThan(0);
              // The grader must accept a correct answer (the solution itself).
              expect(compareResultSets(sol, sol, block.ordered).pass).toBe(true);
            });
          }
        });
      });
    }
  });
}

describe("seed switching", () => {
  it("swaps cleanly between ecommerce and warehouse", async () => {
    const wh = await sqlClient.exec("SELECT COUNT(*)::int AS n FROM fact_sales", {
      seedId: "warehouse",
    });
    expect(wh.ok, wh.error ?? "").toBe(true);
    expect(wh.rows[0][0]).toBe(17);

    // Warehouse tables must be gone after switching back.
    const ec = await sqlClient.exec("SELECT COUNT(*)::int AS n FROM users", {
      seedId: "ecommerce",
    });
    expect(ec.ok, ec.error ?? "").toBe(true);
    expect(ec.rows[0][0]).toBe(5);
    const gone = await sqlClient.exec("SELECT * FROM fact_sales");
    expect(gone.ok).toBe(false);

    // And staging must not leak into the ecommerce seed either.
    const staging = await sqlClient.exec("SELECT * FROM staging.raw_orders");
    expect(staging.ok).toBe(false);
  });
});
