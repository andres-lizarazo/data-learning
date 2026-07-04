import type { Module } from "../../../types/lesson";

// Data quality — from constraints (the database's own defenses, demoed live with
// expected-error blocks) through reconciliation audits (there's a real planted
// discrepancy in the warehouse seed to catch) to Great-Expectations-style
// validation written in pure Python.
export const dataQuality: Module = {
  id: "data-quality",
  title: "Data Quality",
  blurb: "DQ dimensions, constraints, reconciliation audits, validation code, observability.",
  track: "Data Engineering",
  level: "Intermediate",
  icon: "✅",
  status: "deep",
  lessons: [
    {
      id: "dq-dimensions",
      title: "The Dimensions of Data Quality",
      summary: "A shared vocabulary for 'the data is wrong'.",
      minutes: 10,
      blocks: [
        {
          kind: "prose",
          markdown: `# What "quality" decomposes into

"The data is wrong" is not actionable. These dimensions are:

| Dimension | The question | Example failure |
|---|---|---|
| **Completeness** | Is everything here? | 3 of 50 stores missing from yesterday's load |
| **Uniqueness** | No unintended duplicates? | retried job double-inserted orders |
| **Validity** | Values within allowed ranges/formats? | \`qty = -4\`, \`email = "n/a"\` |
| **Consistency** | Do related facts agree? | order total ≠ sum of its line items |
| **Accuracy** | Does it match reality? | price loaded in cents, reported as dollars |
| **Freshness / Timeliness** | Is it recent enough? | "daily" table last updated 4 days ago |

Two hard-won operating principles:

1. **Check at the boundaries.** Validate on ingest (cheap to reject early),
   test after transform (dbt tests), monitor at serving (freshness/volume).
   The later a bad record is caught, the more it costs.
2. **Every check needs an owner and an action.** An alert nobody acts on
   trains everyone to ignore alerts. Fewer, meaningful checks beat hundreds of
   noisy ones.`,
        },
        {
          kind: "quiz",
          question: "Order #4412's total is $128 but its line items sum to $97. Which quality dimension is violated?",
          options: [
            { text: "Consistency — two related pieces of data disagree with each other", correct: true },
            { text: "Completeness — data is missing" },
            { text: "Freshness — the data is stale" },
            { text: "Uniqueness — something is duplicated" },
          ],
          explanation:
            "Both values exist, are fresh, and are individually plausible — they just contradict each other. Consistency violations are found by *reconciliation* queries comparing the two sides (lesson 3).",
        },
        {
          kind: "quiz",
          question: "Which failure is the most dangerous, and why?",
          options: [
            {
              text: "The silent one that passes all checks — e.g. a unit change (cents→dollars) producing valid-looking, wrong numbers that decisions get made on",
              correct: true,
            },
            { text: "A pipeline crash — data stops flowing entirely" },
            { text: "A failed dbt test blocking a deploy" },
            { text: "A slow query on the dashboard" },
          ],
          explanation:
            "Loud failures get fixed; silent corruption gets *believed*. That's why accuracy checks compare against independent references (reconciliation, finance's numbers, source-system counts) — internal validity checks can't catch a consistent lie.",
        },
      ],
    },
    {
      id: "constraints",
      title: "Constraints: the First Line of Defense",
      summary: "Let the database refuse bad data — watch it happen.",
      minutes: 12,
      blocks: [
        {
          kind: "prose",
          markdown: `# Constraints reject bad rows at the door

Everything you declared in the DDL lessons is a data-quality control that can
**never be skipped, forgotten, or raced past**:

- \`NOT NULL\` — completeness, per column
- \`UNIQUE\` / \`PRIMARY KEY\` — uniqueness
- \`CHECK (qty > 0)\` — validity
- \`REFERENCES\` (foreign keys) — referential consistency

The blocks below are *supposed to fail* — that's the point. The database
refusing a bad row at write time is the cheapest quality check you will ever
deploy.

(Real-world nuance: most analytics warehouses — Snowflake, BigQuery, Delta —
**don't enforce** PK/FK constraints! They accept the DDL for documentation but
trust the pipeline. That's exactly why dbt tests exist: they're the enforcement
layer warehouses dropped.)`,
        },
        {
          kind: "sql-runnable",
          title: "CHECK rejects invalid values",
          seedId: "ecommerce",
          resetBefore: true,
          expectError: true,
          sql: `ALTER TABLE order_items ADD CONSTRAINT positive_qty CHECK (qty > 0);

-- A buggy load tries to write a negative quantity:
INSERT INTO order_items (order_id, product_id, qty, unit_price)
VALUES (1, 2, -3, 849.00);`,
        },
        {
          kind: "sql-runnable",
          title: "Foreign keys reject orphans",
          seedId: "ecommerce",
          resetBefore: true,
          expectError: true,
          sql: `-- Order 999 doesn't exist — the FK refuses the orphan line item:
INSERT INTO order_items (order_id, product_id, qty, unit_price)
VALUES (999, 1, 1, 999.00);`,
        },
        {
          kind: "sql-runnable",
          title: "UNIQUE rejects the double-load",
          seedId: "ecommerce",
          resetBefore: true,
          expectError: true,
          sql: `-- The retried job inserts the same (order, product) line again:
INSERT INTO order_items (order_id, product_id, qty, unit_price)
VALUES (1, 1, 2, 999.00);
-- (order_id, product_id) is the PRIMARY KEY — duplicates bounce.`,
        },
        {
          kind: "quiz",
          question: "Snowflake accepts `PRIMARY KEY` in DDL but doesn't enforce it. What follows for your pipelines there?",
          options: [
            {
              text: "Uniqueness is now YOUR job: idempotent MERGE writes + a scheduled uniqueness test (dbt-style) replace the enforcement the database gave up",
              correct: true,
            },
            { text: "Primary keys are pointless in warehouses — omit them" },
            { text: "Snowflake silently dedupes on load" },
            { text: "Only streaming loads can create duplicates" },
          ],
          explanation:
            "Warehouses trade enforcement for load speed. Declared-but-unenforced keys still document intent and help optimizers — but the guarantee moved into your write patterns and tests. Knowing WHERE enforcement lives per platform is a real DE interview question.",
        },
      ],
    },
    {
      id: "reconciliation",
      title: "Reconciliation & Data Tests",
      summary: "Compare the two sides — there's a real discrepancy in the seed to catch.",
      minutes: 13,
      blocks: [
        {
          kind: "prose",
          markdown: `# Reconciliation: trust, but verify against the other side

Constraints check rows in isolation. **Reconciliation** checks that two
datasets that *should* agree actually do:

- source row-count vs loaded row-count (completeness)
- staged values vs warehouse values for the same keys (consistency)
- fact totals vs an independent system (accuracy — e.g. finance's ledger)

The shape is always the same: **join the two sides on the key, compare, return
disagreements.** Zero rows = reconciled.

Your warehouse seed contains a genuine discrepancy: one order line was
**re-delivered to staging with different values** than what fact_sales loaded
earlier. The audits below hunt it down.`,
        },
        {
          kind: "sql-runnable",
          title: "Audit 1 — completeness: is everything staged also loaded?",
          seedId: "warehouse",
          resetBefore: true,
          sql: `SELECT
  (SELECT COUNT(DISTINCT order_id) FROM staging.raw_orders)  AS staged_orders,
  (SELECT COUNT(DISTINCT r.order_id)
     FROM staging.raw_orders r
     JOIN fact_sales f ON f.order_id = r.order_id)           AS also_in_fact;
-- 5 staged, 2 loaded → 3 pending (fine if the incremental hasn't run;
-- an incident if it "ran successfully" an hour ago!)`,
        },
        {
          kind: "sql-challenge",
          title: "Audit 2 — consistency: find the mismatched re-delivery",
          seedId: "warehouse",
          prompt:
            "For order lines present in **both** `staging.raw_orders` and `fact_sales` (join on `order_id`), return `order_id`, the staged quantity as `staged_qty`, and the loaded quantity as `fact_qty` — **only where the quantities disagree**. Order by `order_id`. Exactly one row should come back.",
          starterSql:
            "SELECT r.order_id, r.qty AS staged_qty, f.qty AS fact_qty\nFROM staging.raw_orders r\nJOIN fact_sales f ON f.order_id = r.order_id\nWHERE -- they disagree\n;",
          solution:
            "SELECT r.order_id, r.qty AS staged_qty, f.qty AS fact_qty FROM staging.raw_orders r JOIN fact_sales f ON f.order_id = r.order_id WHERE r.qty <> f.qty ORDER BY r.order_id;",
          ordered: true,
          hints: [
            "Inner join on order_id keeps only lines on both sides; `r.qty <> f.qty` finds the disagreement.",
            "Order 116 was re-delivered with qty 2 but the fact table loaded qty 1 — which side is right is a question for the SOURCE, not the pipeline.",
          ],
          xp: 90,
        },
        {
          kind: "sql-challenge",
          title: "Audit 3 — internal consistency of the fact table",
          seedId: "warehouse",
          prompt:
            "An invariant of `fact_sales` is `amount = qty * unit_price`. Write the audit that returns `sale_id`, `amount`, and the recomputed value as `expected` for every row violating it, ordered by `sale_id`. (A healthy table returns zero rows — and that's a pass.)",
          starterSql:
            "SELECT sale_id, amount, qty * unit_price AS expected\nFROM fact_sales\nWHERE -- invariant violated\n;",
          solution:
            "SELECT sale_id, amount, qty * unit_price AS expected FROM fact_sales WHERE amount <> qty * unit_price ORDER BY sale_id;",
          ordered: true,
          hints: [
            "`WHERE amount <> qty * unit_price` — the whole test.",
            "Zero rows back means the invariant holds; the grader accepts the empty (but correctly-shaped) result.",
          ],
          xp: 60,
        },
        {
          kind: "quiz",
          question: "Audit 2 found staging says qty=2 and the fact table says qty=1 for order 116. What's the correct next move?",
          options: [
            {
              text: "Check the SOURCE system for order 116's true quantity — the audit found a disagreement, not which side is wrong; then fix via the idempotent load path (MERGE)",
              correct: true,
            },
            { text: "Always trust the newer value and update the fact table" },
            { text: "Delete the row from both sides" },
            { text: "Average the two quantities" },
          ],
          explanation:
            "Reconciliation detects; it doesn't adjudicate. Maybe the customer upped the order (staging is right), maybe the re-delivery is corrupt (fact is right). Ground truth lives upstream — and the correction should flow through the normal idempotent pipeline, not a hand-edit.",
        },
      ],
    },
    {
      id: "python-validation",
      title: "Validation in Python",
      summary: "Great-Expectations-style checks, built by hand.",
      minutes: 13,
      blocks: [
        {
          kind: "prose",
          markdown: `# Expectations as code

Frameworks like **Great Expectations**, **Soda**, and **pandera** all share one
model — an expectation is a function over data returning a structured verdict:

\`\`\`python
result = expect_column_values_between(rows, "qty", 1, 100)
# {"success": False, "failures": [17, 42]}   ← which rows broke it
\`\`\`

Key design points (visible in every serious tool):

- **Return verdicts, don't raise** — a validation run reports ALL failures,
  not just the first (compare: your SQL audits returning all violating rows).
- **Structured results** — success flag + failing values/indices + a count, so
  pipelines can branch (quarantine, alert, block) and humans can debug.
- **Suites** — expectations grouped per dataset, run at the boundary (that
  Auto Loader / ingest edge again).

The whole pattern is ~15 lines of Python per expectation. Build two, then trust
yourself to read any DQ framework's source.`,
        },
        {
          kind: "runnable",
          title: "An expectation suite in miniature",
          code: `orders = [
    {"id": 1, "qty": 2,  "status": "paid"},
    {"id": 2, "qty": 0,  "status": "paid"},      # qty out of range!
    {"id": 3, "qty": 5,  "status": "unknown"},   # bad status!
    {"id": 4, "qty": 1,  "status": "pending"},
]

def expect_values_in_set(rows, col, allowed):
    failures = [r["id"] for r in rows if r[col] not in allowed]
    return {"success": not failures, "column": col, "failures": failures}

def expect_values_between(rows, col, lo, hi):
    failures = [r["id"] for r in rows if not (lo <= r[col] <= hi)]
    return {"success": not failures, "column": col, "failures": failures}

suite = [
    expect_values_between(orders, "qty", 1, 100),
    expect_values_in_set(orders, "status", {"paid", "pending", "refunded"}),
]

for result in suite:
    icon = "✔" if result["success"] else "✘"
    print(icon, result["column"], "failures:", result["failures"])

print("suite passed:", all(r["success"] for r in suite))`,
        },
        {
          kind: "challenge",
          title: "Write two expectations",
          prompt: `Implement (both take \`rows\`, a list of dicts, and a column name \`col\`):

- \`expect_not_null(rows, col)\` — fails for rows where \`col\` is missing from
  the dict **or** is \`None\`.
- \`expect_unique(rows, col)\` — fails for values that appear more than once.

Both return \`{"success": <bool>, "failures": [...]}\`:
- for \`expect_not_null\`, failures = the list of **row indices** (0-based) that
  failed, in order;
- for \`expect_unique\`, failures = the **sorted list of duplicated values**
  (each listed once).`,
          starterCode: `def expect_not_null(rows, col):
    pass

def expect_unique(rows, col):
    pass`,
          tests: [
            {
              name: "not_null finds missing and None",
              assertion: `rows = [{"a": 1}, {"a": None}, {"b": 2}, {"a": 4}]
assert expect_not_null(rows, "a") == {"success": False, "failures": [1, 2]}`,
            },
            {
              name: "not_null passes clean data",
              assertion: `assert expect_not_null([{"a": 1}, {"a": 2}], "a") == {"success": True, "failures": []}`,
            },
            {
              name: "unique finds duplicated values",
              assertion: `rows = [{"id": 3}, {"id": 1}, {"id": 3}, {"id": 2}, {"id": 1}]
assert expect_unique(rows, "id") == {"success": False, "failures": [1, 3]}`,
            },
            {
              name: "unique passes distinct data",
              assertion: `assert expect_unique([{"id": 1}, {"id": 2}], "id") == {"success": True, "failures": []}`,
              hidden: true,
            },
          ],
          hints: [
            "not_null: `enumerate(rows)`; fail when `r.get(col) is None` (covers both missing and None).",
            "unique: count values (dict or collections.Counter), then `sorted(v for v, n in counts.items() if n > 1)`.",
          ],
          solution: `def expect_not_null(rows, col):
    failures = [i for i, r in enumerate(rows) if r.get(col) is None]
    return {"success": not failures, "failures": failures}

def expect_unique(rows, col):
    counts = {}
    for r in rows:
        v = r.get(col)
        counts[v] = counts.get(v, 0) + 1
    failures = sorted(v for v, n in counts.items() if n > 1)
    return {"success": not failures, "failures": failures}`,
          xp: 90,
        },
        {
          kind: "quiz",
          question: "Why do validation frameworks RETURN failure reports instead of raising on the first bad row?",
          options: [
            {
              text: "One run should surface ALL problems (for debugging and quarantining), and the pipeline — not the check — decides whether to block, alert, or continue",
              correct: true,
            },
            { text: "Exceptions are too slow for large datasets" },
            { text: "Raising would roll back the database transaction" },
            { text: "Python can't raise inside list comprehensions" },
          ],
          explanation:
            "Fail-fast is right for code bugs; data issues come in batches and need triage. Separating detection (the expectation) from policy (block vs warn vs quarantine) is the same detection-vs-adjudication split as the reconciliation lesson.",
        },
      ],
    },
    {
      id: "observability",
      title: "Data Observability & Incident Response",
      summary: "Freshness, volume, schema drift — monitoring the pipelines you can't test.",
      minutes: 11,
      blocks: [
        {
          kind: "prose",
          markdown: `# Observability: quality over time

Tests check what you *anticipated*. Observability watches for what you didn't —
the standard monitor families (Monte Carlo, Elementary, and co. all converge
here):

- **Freshness** — when did this table last update? (your dbt source-freshness
  lesson, generalized to every table)
- **Volume** — row counts vs the usual pattern: today's load is 4% of normal →
  something upstream broke, even though the pipeline "succeeded".
- **Schema drift** — columns added/removed/retyped in sources: catch it before
  the 3am failure, or before \`_rescued_data\` quietly fills up.
- **Distribution** — null-rate doubled, a category vanished, amounts shifted
  10× (that cents/dollars accident): anomaly detection on column stats.

## When the alert fires — incident response

1. **Assess blast radius** — lineage: what's downstream? (Unity Catalog lesson)
2. **Communicate first** — mark dashboards / message consumers *before* fixing.
   Wrong-but-trusted numbers do more damage per hour than missing ones.
3. **Contain** — pause downstream jobs; quarantine bad partitions.
4. **Fix through the pipeline** — idempotent re-loads/backfills, never manual
   UPDATEs in prod (they're invisible to lineage and unreproducible).
5. **Prevent** — add the test/monitor that would have caught it. Every incident
   should permanently upgrade your suite.

Notice the arc of this module: constraints → tests → reconciliation →
validation → monitoring. Each layer catches what the previous one structurally
cannot. That stack IS "data quality" as a practice.`,
        },
        {
          kind: "quiz",
          question: "All dbt tests pass, yet the volume monitor flags today's orders table at 5% of normal row count. What happened?",
          options: [
            {
              text: "An upstream partial failure: tests validate the rows that ARRIVED (unique, not-null…), but can't know 95% of rows never showed up — that's exactly what volume monitoring exists for",
              correct: true,
            },
            { text: "Impossible — passing tests mean the data is complete" },
            { text: "The monitor is miscalibrated; trust the tests" },
            { text: "dbt skipped the tests" },
          ],
          explanation:
            "Tests are per-row/per-table assertions; completeness against an expectation of 'how much data usually exists' needs a time-series baseline. Green tests + missing data is THE classic silent failure — treat volume anomalies as seriously as failures.",
        },
        {
          kind: "quiz",
          question: "During an incident, why is 'communicate before fixing' the rule?",
          options: [
            {
              text: "Every minute the numbers stay silently wrong, consumers make decisions on them — flagging bad dashboards stops the damage immediately, while the fix may take hours",
              correct: true,
            },
            { text: "It shifts blame away from the data team" },
            { text: "Fixes can't start until stakeholders approve" },
            { text: "It's required by GDPR" },
          ],
          explanation:
            "Data incidents damage through *belief*. A banner saying 'revenue figures under investigation' costs seconds and prevents bad decisions; a quiet three-hour fix lets a morning of them happen. Trust, once burned, is the expensive thing to rebuild.",
        },
      ],
    },
  ],
};
