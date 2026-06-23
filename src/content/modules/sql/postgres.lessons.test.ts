import { describe, it, expect, beforeAll } from "vitest";
import { postgres } from "./postgres";
import { sqlClient } from "../../../sql/sqlClient";
import { compareResultSets } from "../../../lib/sqlCompare";

// End-to-end verification that EVERY SQL block in the PostgreSQL module actually runs in
// the real engine (PGlite — the same Postgres/WASM the browser uses), via the same
// production client (`sqlClient`) the app calls. For each lesson:
//   • sql-runnable  → executes against a freshly seeded DB; must succeed (or, if the
//                     snippet is flagged `expectError`, must fail — those are teaching
//                     demos of constraint violations).
//   • sql-challenge → the reference `solution` must run and return a result set, and the
//                     grader must accept it against itself (sanity-check of the harness).

beforeAll(async () => {
  await sqlClient.init();
}, 60_000);

describe("PostgreSQL module — every lesson runs end-to-end in PGlite", () => {
  it("has 28 lessons", () => {
    expect(postgres.lessons.length).toBe(28);
  });

  for (const lesson of postgres.lessons) {
    describe(lesson.title, () => {
      lesson.blocks.forEach((block, i) => {
        if (block.kind === "sql-runnable") {
          it(`runnable #${i}: ${block.title ?? "(untitled)"}`, async () => {
            const res = await sqlClient.exec(block.sql, { reset: true });
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
            await sqlClient.reset();
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
