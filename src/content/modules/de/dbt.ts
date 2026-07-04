import type { Module } from "../../../types/lesson";

// dbt — the analytics-engineering workhorse. dbt models are just SELECTs, so the
// core mechanics are practiced FOR REAL in PGlite: ref() dependencies become
// chained CREATE VIEWs, incremental materialization is the high-water-mark you
// already know, and dbt tests are literally queries returning violating rows.
export const dbt: Module = {
  id: "dbt",
  title: "dbt",
  blurb: "Models, ref() DAGs, materializations, tests, snapshots, Jinja — hands-on.",
  track: "Data Engineering",
  level: "Intermediate",
  icon: "🔶",
  status: "deep",
  lessons: [
    {
      id: "dbt-workflow",
      title: "What dbt Is & the Analytics Engineering Workflow",
      summary: "SQL transformations as version-controlled, tested, documented software.",
      minutes: 10,
      blocks: [
        {
          kind: "prose",
          markdown: `# dbt: the T in ELT

dbt (data build tool) takes the transform layer — the SQL between raw data and
served marts — and treats it like **software**:

- **Models** — each transformation is one \`SELECT\` in one \`.sql\` file.
- **DAG** — models reference each other with \`ref()\`; dbt derives the build
  order (and full lineage) automatically.
- **Tests** — assertions on the data (\`unique\`, \`not_null\`, custom SQL) run
  on every build.
- **Docs** — descriptions in YAML compile into a browsable, lineage-aware site.
- **Version control** — it's all text files: branches, PRs, code review, CI.

\`\`\`
models/
  staging/     stg_orders.sql, stg_customers.sql     (1:1 with sources, cleaning)
  intermediate/ int_orders_enriched.sql              (reusable joins/logic)
  marts/       fct_orders.sql, dim_customers.sql     (facts & dims — your star!)
\`\`\`

The workflow: branch → edit models → \`dbt run\` (build) + \`dbt test\` → PR →
CI runs it all → merge → production job runs on schedule.

dbt doesn't process data itself — it **compiles SQL and submits it to your
warehouse** (Postgres, Snowflake, BigQuery, Databricks). Which is why everything
it does can be practiced right here.`,
        },
        {
          kind: "quiz",
          question: "What does dbt actually execute the transformations with?",
          options: [
            {
              text: "Your warehouse — dbt compiles models to SQL and runs them there; it has no processing engine of its own",
              correct: true,
            },
            { text: "An embedded Spark cluster" },
            { text: "A Python dataframe engine on the dbt server" },
            { text: "The BI tool's query layer" },
          ],
          explanation:
            "dbt is a compiler + orchestrator of SQL, not an engine. That's its portability trick: the same project runs on any supported warehouse, and all the compute pricing/tuning knowledge you have still applies.",
        },
        {
          kind: "quiz",
          question: "Before dbt, the transform layer was often scheduled SQL scripts. What's the single biggest thing dbt adds over that?",
          options: [
            {
              text: "The engineering loop: dependencies derived from code, tests on every change, review via PRs — SQL stops being untested snowflake scripts",
              correct: true,
            },
            { text: "Faster SQL execution" },
            { text: "A visual drag-and-drop transform designer" },
            { text: "Built-in data ingestion from APIs" },
          ],
          explanation:
            "The SQL is the same SQL. What changes is everything around it: lineage instead of tribal knowledge, tests instead of hope, code review instead of prod edits. 'Analytics engineering' is that discipline, named.",
        },
      ],
    },
    {
      id: "models-ref",
      title: "Models & ref(): Building the DAG",
      summary: "Chain models with ref() — and build the equivalent view DAG live.",
      minutes: 14,
      blocks: [
        {
          kind: "prose",
          markdown: `# Models and ref()

A model is a SELECT. Other models reference it with \`ref()\`:

\`\`\`sql
-- models/staging/stg_orders.sql
SELECT order_id, customer_id, qty * unit_price AS amount, order_date
FROM {{ source('shop', 'raw_orders') }}

-- models/marts/fct_daily_revenue.sql
SELECT order_date, SUM(amount) AS revenue
FROM {{ ref('stg_orders') }}          -- ← the dependency
GROUP BY order_date
\`\`\`

\`ref()\` does two jobs at once:

1. compiles to the actual table/view name (per environment — dev builds into
   your dev schema, prod into prod), and
2. **declares the edge in the DAG** — dbt now knows \`stg_orders\` must build
   first (same inference-from-references as DLT).

Under the hood, \`dbt run\` executes \`CREATE VIEW/TABLE ... AS <your select>\`
in dependency order. So let's do literally that, by hand, in Postgres.`,
        },
        {
          kind: "dsa-viz",
          viz: "graph",
          traversal: "bfs",
          title: "A dbt DAG builds in dependency waves (BFS order)",
          data: {
            adjacency: {
              raw: ["stg"],
              stg: ["dim", "fct"],
              dim: ["mart"],
              fct: ["mart"],
              mart: [],
            },
            start: "raw",
          },
          caption:
            "raw → staging → dims/facts → marts: each wave can build in parallel once its parents exist — exactly how `dbt run` schedules models.",
        },
        {
          kind: "sql-runnable",
          title: "dbt run, by hand: the view DAG",
          seedId: "warehouse",
          resetBefore: true,
          sql: `-- "model" 1 — staging: clean + derive (what {{ source(...) }} points at)
CREATE VIEW stg_orders AS
SELECT order_id, customer_id, product_id,
       qty * unit_price AS amount, order_date
FROM staging.raw_orders;

-- "model" 2 — depends on stg_orders (this is the ref()!)
CREATE VIEW fct_daily_revenue AS
SELECT order_date, COUNT(DISTINCT order_id) AS orders, SUM(amount) AS revenue
FROM stg_orders
GROUP BY order_date;

-- "model" 3 — also depends on stg_orders
CREATE VIEW customer_ltv AS
SELECT customer_id, SUM(amount) AS lifetime_value
FROM stg_orders
GROUP BY customer_id;

SELECT * FROM fct_daily_revenue ORDER BY order_date;`,
        },
        {
          kind: "sql-challenge",
          title: "Write the downstream model",
          seedId: "warehouse",
          prompt:
            "You're adding `top_customers.sql` downstream of staging. Since grading resets the DB, inline the staging logic as a CTE (exactly what dbt compiles ephemeral models into!): with `stg AS (SELECT customer_id, qty * unit_price AS amount FROM staging.raw_orders)`, return `customer_id` and `lifetime_value` (`SUM(amount)`) for customers with lifetime value **over 500**, ordered by `lifetime_value` descending.",
          starterSql:
            "WITH stg AS (\n  SELECT customer_id, qty * unit_price AS amount\n  FROM staging.raw_orders\n)\nSELECT customer_id\nFROM stg\nGROUP BY customer_id;",
          solution:
            "WITH stg AS (SELECT customer_id, qty * unit_price AS amount FROM staging.raw_orders) SELECT customer_id, SUM(amount) AS lifetime_value FROM stg GROUP BY customer_id HAVING SUM(amount) > 500 ORDER BY lifetime_value DESC;",
          ordered: true,
          hints: [
            "GROUP BY customer_id, filter groups with HAVING SUM(amount) > 500.",
            "HAVING (not WHERE) because the filter is on the aggregate.",
          ],
          xp: 70,
        },
        {
          kind: "quiz",
          question: "Why must models use `ref('stg_orders')` instead of hardcoding the schema-qualified table name?",
          options: [
            {
              text: "ref() resolves per environment (dev/prod schemas) AND registers the DAG edge — hardcoding breaks both the environment isolation and the lineage/build order",
              correct: true,
            },
            { text: "Hardcoded names are slower to query" },
            { text: "ref() caches the referenced table" },
            { text: "SQL doesn't allow schema-qualified names in views" },
          ],
          explanation:
            "A hardcoded `analytics.stg_orders` would make your dev run read/write prod, and dbt would see no dependency — possibly building your model before its parent. ref()/source() are the two doors everything must go through.",
        },
      ],
    },
    {
      id: "materializations",
      title: "Materializations",
      summary: "view vs table vs incremental — the same SELECT, three build strategies.",
      minutes: 13,
      blocks: [
        {
          kind: "prose",
          markdown: `# Materializations

One config line decides HOW a model's SELECT becomes a database object
(the Strategy pattern, as you spotted in Design Patterns):

| Materialization | Compiles to | Use for |
|---|---|---|
| **view** (default) | \`CREATE VIEW ... AS\` | cheap staging; always-fresh; compute at query time |
| **table** | \`CREATE TABLE ... AS\` (full rebuild) | heavy logic queried often; small/medium data |
| **incremental** | first run: table; later runs: **insert/merge only new rows** | big fact tables where full rebuilds are too slow |
| **ephemeral** | inlined as a CTE into downstream models | tiny helper logic; no DB object at all |

## Incremental — the one with sharp edges

\`\`\`sql
{{ config(materialized='incremental', unique_key='order_id') }}

SELECT order_id, customer_id, qty * unit_price AS amount, order_date
FROM {{ source('shop', 'raw_orders') }}
{% if is_incremental() %}
WHERE order_date > (SELECT MAX(order_date) FROM {{ this }})   -- high-water mark!
{% endif %}
\`\`\`

That \`WHERE\` is your high-water mark from the warehouse module; with
\`unique_key\` set, dbt MERGEs (your Delta lesson) instead of blind-inserting.
\`dbt run --full-refresh\` rebuilds from scratch when logic changes.`,
        },
        {
          kind: "sql-runnable",
          title: "What incremental compiles to (run both stages)",
          seedId: "warehouse",
          resetBefore: true,
          sql: `-- FIRST run (table doesn't exist): dbt does CREATE TABLE AS.
CREATE TABLE fct_orders AS
SELECT order_id, customer_id, qty * unit_price AS amount, order_date
FROM staging.raw_orders
WHERE order_date <= '2026-04-30';        -- pretend only April data existed then

SELECT COUNT(*) AS after_first_run FROM fct_orders;

-- LATER run: is_incremental() is true → only rows past the high-water mark.
INSERT INTO fct_orders
SELECT order_id, customer_id, qty * unit_price AS amount, order_date
FROM staging.raw_orders
WHERE order_date > (SELECT MAX(order_date) FROM fct_orders);

SELECT COUNT(*) AS after_incremental_run, MAX(order_date) AS new_mark FROM fct_orders;`,
        },
        {
          kind: "sql-challenge",
          title: "Write the incremental filter",
          seedId: "warehouse",
          prompt:
            "An incremental model has already loaded everything up to `2026-05-02` (that's `MAX(order_date)` in the existing table). Write the SELECT for the next run: all columns `order_id`, `customer_id`, `order_date` from `staging.raw_orders` **strictly after** that date, ordered by `order_date`. (Use the literal date — in dbt it would be the `{{ this }}` subquery.)",
          starterSql:
            "SELECT order_id, customer_id, order_date\nFROM staging.raw_orders\nWHERE -- past the high-water mark\n;",
          solution:
            "SELECT order_id, customer_id, order_date FROM staging.raw_orders WHERE order_date > '2026-05-02' ORDER BY order_date;",
          ordered: true,
          hints: [
            "Strictly greater than the mark: `order_date > '2026-05-02'`.",
            "Two rows should come back (orders 118 and 119).",
          ],
          xp: 60,
        },
        {
          kind: "quiz",
          question:
            "An incremental model filters on `updated_at`, but late-arriving rows carry OLD `updated_at` values. What happens, and what's the standard mitigation?",
          options: [
            {
              text: "Late rows fall below the high-water mark and are silently skipped; teams use a lookback window (e.g. mark minus 3 days) plus a unique_key MERGE to reprocess the overlap safely",
              correct: true,
            },
            { text: "dbt detects late data automatically and backfills" },
            { text: "The run fails with a freshness error" },
            { text: "Nothing — incremental models can't miss data" },
          ],
          explanation:
            "The watermark blind spot from the warehouse module, in dbt clothing. Overlap + idempotent MERGE is the standard fix: reprocessing a few days is cheap; the unique_key stops duplicates.",
        },
      ],
    },
    {
      id: "dbt-tests",
      title: "Tests & Documentation",
      summary: "unique, not_null, relationships — tests are just queries for bad rows.",
      minutes: 13,
      blocks: [
        {
          kind: "prose",
          markdown: `# dbt tests

Declared in YAML next to the model:

\`\`\`yaml
models:
  - name: dim_customer
    columns:
      - name: customer_key
        tests: [unique, not_null]
      - name: segment
        tests:
          - accepted_values: {values: [enterprise, scaleup, startup, smb]}
  - name: fct_sales
    columns:
      - name: customer_key
        tests:
          - relationships: {to: ref('dim_customer'), field: customer_key}
\`\`\`

**The mechanism is beautifully simple:** every test compiles to a query that
returns the VIOLATING rows. Zero rows = pass; any rows = fail (and the query
shows you exactly which rows broke it).

| Test | The compiled query returns |
|---|---|
| \`not_null\` | rows where the column IS NULL |
| \`unique\` | values appearing more than once |
| \`accepted_values\` | rows with a value outside the list |
| \`relationships\` | child rows whose key has no parent (orphans) |

Custom tests are the same idea: any SELECT you write — fail if it returns rows.
So writing dbt tests IS writing SQL, which you can do right now.`,
        },
        {
          kind: "sql-runnable",
          title: "How `unique` compiles",
          seedId: "warehouse",
          sql: `-- dbt's unique test on dim_customer.customer_key, compiled:
SELECT customer_key, COUNT(*) AS n
FROM dim_customer
GROUP BY customer_key
HAVING COUNT(*) > 1;
-- zero rows = the test passes ✔`,
        },
        {
          kind: "sql-challenge",
          title: "Write the `relationships` test",
          seedId: "warehouse",
          prompt:
            "Write the compiled form of a `relationships` test: return the `customer_id` and `name` of every row in `staging.customer_updates` whose `customer_id` has **no matching current row** in `dim_customer` (natural key `customer_id`, `is_current = true`). Order by `customer_id`. *(There is exactly one orphan in the seed — find it.)*",
          starterSql:
            "SELECT u.customer_id, u.name\nFROM staging.customer_updates u\nWHERE -- no matching current dim_customer row\n;",
          solution:
            "SELECT u.customer_id, u.name FROM staging.customer_updates u WHERE NOT EXISTS (SELECT 1 FROM dim_customer c WHERE c.customer_id = u.customer_id AND c.is_current) ORDER BY u.customer_id;",
          ordered: true,
          hints: [
            "Anti-join with NOT EXISTS, matching on customer_id AND is_current.",
            "The orphan is Nakatomi (customer_id 5) — a new customer the dimension hasn't seen yet. In a real project this failing test says: run the snapshot/SCD load first.",
          ],
          xp: 80,
        },
        {
          kind: "sql-challenge",
          title: "Write an accepted_values test",
          seedId: "warehouse",
          prompt:
            "Compile an `accepted_values` test for `dim_customer.segment` with allowed values `('enterprise', 'startup', 'smb')` — return the `customer_key`, `name`, and `segment` of every row whose segment is NOT in that list, ordered by `customer_key`. *(This one should catch a row — a value that's valid in reality but missing from the test's list. That's a lesson in itself: tests encode assumptions.)*",
          starterSql:
            "SELECT customer_key, name, segment\nFROM dim_customer\nWHERE -- segment outside the accepted list\n;",
          solution:
            "SELECT customer_key, name, segment FROM dim_customer WHERE segment NOT IN ('enterprise', 'startup', 'smb') ORDER BY customer_key;",
          ordered: true,
          hints: [
            "`segment NOT IN (...)` is the whole test.",
            "It returns Globex's 'scaleup' row — the accepted list was stale. Failing tests sometimes mean the TEST needs updating, not the data.",
          ],
          xp: 70,
        },
        {
          kind: "quiz",
          question: "A `unique` test on `fct_orders.order_id` started failing after the incremental MERGE was replaced by a plain INSERT. What is the test protecting you from?",
          options: [
            {
              text: "Silent fan-out: duplicated keys double revenue in every downstream join/aggregate — the test catches the bad load before consumers do",
              correct: true,
            },
            { text: "Slow queries on the orders table" },
            { text: "Schema changes in the source" },
            { text: "Nothing — uniqueness is cosmetic" },
          ],
          explanation:
            "Key uniqueness is the assumption every join in the mart layer silently relies on. This exact regression (idempotent write → blind append) is among the most common real dbt test catches — usually at 6am, before the CFO's dashboard refreshes.",
        },
      ],
    },
    {
      id: "sources-snapshots",
      title: "Sources, Seeds & Snapshots",
      summary: "Declaring raw inputs, tiny lookup data — and snapshots = SCD2 automated.",
      minutes: 12,
      blocks: [
        {
          kind: "prose",
          markdown: `# The other dbt objects

## Sources

Raw tables (loaded by ingestion, NOT built by dbt) get declared so they're in the
DAG and testable:

\`\`\`yaml
sources:
  - name: shop
    schema: staging
    tables:
      - name: raw_orders
        freshness:
          error_after: {count: 24, period: hour}   # stale source = failed run
\`\`\`

Models read them with \`{{ source('shop', 'raw_orders') }}\` — completing the
lineage from raw to mart.

## Seeds

Small CSVs in the repo (\`dbt seed\` loads them as tables): country codes,
category mappings — data small enough to version-control.

## Snapshots — SCD2 without writing the SCD2

\`\`\`sql
{% snapshot customers_snapshot %}
{{ config(unique_key='customer_id', strategy='check',
          check_cols=['name', 'segment', 'city']) }}
SELECT * FROM {{ source('crm', 'customers') }}
{% endsnapshot %}
\`\`\`

Each \`dbt snapshot\` run compares the source to the snapshot table and performs
**exactly the close-and-insert you built by hand** in the Data Modeling module —
adding \`dbt_valid_from\` / \`dbt_valid_to\` columns. Your manual SCD2 skills are
what let you *debug* snapshots when they misbehave.`,
        },
        {
          kind: "sql-runnable",
          title: "What a snapshot run does (the diff step)",
          seedId: "warehouse",
          sql: `-- dbt snapshot's core move: detect rows whose checked columns changed
-- vs the current snapshot version (here: dim_customer plays the snapshot).
SELECT u.customer_id, u.name,
       c.segment AS old_segment, u.segment AS new_segment,
       CASE WHEN c.customer_id IS NULL THEN 'new — insert'
            ELSE 'changed — close & insert' END AS snapshot_action
FROM staging.customer_updates u
LEFT JOIN dim_customer c
  ON c.customer_id = u.customer_id AND c.is_current
WHERE c.customer_id IS NULL
   OR (u.name, u.segment, u.city) IS DISTINCT FROM (c.name, c.segment, c.city)
ORDER BY u.customer_id;`,
        },
        {
          kind: "quiz",
          question: "Why do snapshots exist as a separate command (`dbt snapshot`) instead of being ordinary models?",
          options: [
            {
              text: "Models are rebuildable from sources at any time; snapshots capture state that's GONE once the source overwrites it — they must run on schedule and are not idempotently re-derivable",
              correct: true,
            },
            { text: "Snapshots need a faster engine than models" },
            { text: "Models can't contain SELECT * statements" },
            { text: "It's only a naming convention" },
          ],
          explanation:
            "A snapshot is a historical *recording device*: miss a week of runs and that week's intermediate versions are unrecoverable. Models are pure functions of sources; snapshots are the one stateful, time-sensitive object in a dbt project.",
        },
        {
          kind: "quiz",
          question: "Source freshness checks (`error_after: 24 hours`) protect against which failure mode?",
          options: [
            {
              text: "The silent one: ingestion broke days ago, every dbt run 'succeeds' on stale data, and dashboards quietly show old numbers",
              correct: true,
            },
            { text: "The warehouse running out of storage" },
            { text: "Models building in the wrong order" },
            { text: "Slow queries during business hours" },
          ],
          explanation:
            "A green pipeline over dead inputs is worse than a red pipeline — nobody investigates green. Freshness turns 'the loader silently stopped' into a loud failure at the transform layer. (The Data Quality module generalizes this into observability.)",
        },
      ],
    },
    {
      id: "jinja-macros",
      title: "Jinja, Macros & Project Structure",
      summary: "Templating that writes your SQL — simulate it, then the layout conventions.",
      minutes: 12,
      blocks: [
        {
          kind: "prose",
          markdown: `# Jinja: SQL that writes SQL

Everything in \`{{ }}\` / \`{% %}\` is **Jinja templating**, rendered to plain SQL
at compile time. \`ref()\`, \`source()\`, \`config()\` are macros; you can write
your own:

\`\`\`sql
{% macro money(col) %} round({{ col }}::numeric, 2) {% endmacro %}

-- usage in a model:
SELECT {{ money('qty * unit_price') }} AS amount FROM ...
\`\`\`

Loops kill copy-paste (e.g. one CASE branch per payment method):

\`\`\`sql
SELECT order_id,
{% for method in ['card', 'paypal', 'wire'] %}
  SUM(CASE WHEN method = '{{ method }}' THEN amount END) AS {{ method }}_amount
  {{- "," if not loop.last }}
{% endfor %}
FROM payments GROUP BY order_id
\`\`\`

The mental model: **a template + values → generated SQL text.** Python's
\`string.Template\`/f-strings work the same way — so you can feel the mechanism
right here.`,
        },
        {
          kind: "runnable",
          title: "Simulate Jinja compilation in Python",
          code: `# A mini "dbt compiler": templates + context -> SQL text.
def render(template, **context):
    out = template
    for key, value in context.items():
        out = out.replace("{{ " + key + " }}", str(value))
    return out

model = """SELECT order_id, {{ amount_expr }} AS amount
FROM {{ source_table }}
WHERE order_date > '{{ start_date }}'"""

compiled = render(
    model,
    amount_expr="round((qty * unit_price)::numeric, 2)",
    source_table="staging.raw_orders",
    start_date="2026-05-01",
)
print(compiled)

# And the loop trick — generating a pivot's CASE branches:
methods = ["card", "paypal", "wire"]
branches = ",\\n  ".join(
    f"SUM(CASE WHEN method = '{m}' THEN amount END) AS {m}_amount" for m in methods
)
print(f"\\nSELECT order_id,\\n  {branches}\\nFROM payments GROUP BY order_id")`,
        },
        {
          kind: "prose",
          markdown: `# Project structure conventions

The community-standard layout (worth following — every dbt dev can navigate it):

\`\`\`
models/
  staging/        one folder per source system
    shop/
      _shop__sources.yml        source declarations + freshness
      stg_shop__orders.sql      1:1 with raw tables: rename, cast, light cleaning
  intermediate/   int_*.sql     reusable business logic, not exposed to BI
  marts/          fct_*.sql, dim_*.sql   the star schema consumers query
tests/            custom SQL tests
macros/           your Jinja macros
snapshots/        SCD2 recorders
seeds/            small CSVs
\`\`\`

Naming rules that carry real weight: \`stg_\` models only clean (no joins across
sources); \`fct_\`/\`dim_\` names promise dimensional-modeling semantics (you know
exactly what those mean now); marts are the ONLY layer BI reads — the same layer
contract as staging → core → marts and bronze → silver → gold.`,
        },
        {
          kind: "quiz",
          question: "A teammate writes a mart model that reads `{{ source('shop', 'raw_orders') }}` directly. Why will this get flagged in review?",
          options: [
            {
              text: "It skips staging: raw quirks (types, names, dupes) leak into the mart, the cleaning logic gets duplicated across marts, and lineage loses its layer structure",
              correct: true,
            },
            { text: "source() can't be used more than once per project" },
            { text: "Marts are not allowed to contain SELECT statements" },
            { text: "It would create a circular dependency" },
          ],
          explanation:
            "The staging layer is the single place raw data gets civilized — every consumer downstream inherits the same cleaning. Bypassing it reintroduces exactly the copy-paste drift dbt exists to kill. Layer discipline IS the architecture.",
        },
        {
          kind: "quiz",
          question: "When should logic move from a model into a macro?",
          options: [
            {
              text: "When the same SQL pattern (a currency rounding, a standard date spine, a surrogate-key hash) is repeated across models — macros are dbt's function extraction",
              correct: true,
            },
            { text: "Whenever a model exceeds 50 lines" },
            { text: "When the SQL needs to run faster" },
            { text: "Never — macros are only for dbt internals" },
          ],
          explanation:
            "Same judgment as extracting a Python function (SRP!): repeated intent → one named, tested place. The classic first macro is `cents_to_dollars()` or a `generate_surrogate_key()` wrapper — small, boring, everywhere.",
        },
      ],
    },
  ],
};
