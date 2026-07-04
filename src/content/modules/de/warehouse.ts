import type { Module } from "../../../types/lesson";

// Warehouses, lakes, and the lakehouse — architecture concepts made runnable:
// layered schemas and the medallion pattern are built live in PGlite (warehouse
// seed), the Delta-style transaction log is simulated in Python, and partition
// pruning shows up in real EXPLAIN plans.
export const warehouseLakehouse: Module = {
  id: "warehouse-lakehouse",
  title: "Warehouse, Lake & Lakehouse",
  blurb: "Layered warehouses, ELT, data lakes, Delta/Iceberg, medallion, incremental loads.",
  track: "Data Engineering",
  level: "Intermediate",
  icon: "🏔️",
  status: "deep",
  lessons: [
    {
      id: "warehouse-architecture",
      title: "Warehouse Architecture: Staging → Core → Marts",
      summary: "Build the classic three-layer warehouse live, with real Postgres schemas.",
      minutes: 13,
      blocks: [
        {
          kind: "prose",
          markdown: `# The layered warehouse

Every serious warehouse separates concerns into layers (names vary; the roles
don't):

\`\`\`
STAGING            CORE                     MARTS
raw, as-delivered  integrated, modeled      purpose-built for consumers
append-only        (the star schema!)       aggregates, wide tables
1:1 with sources   cleaned, conformed, SCD  one per team/use case
\`\`\`

- **Staging** — land data exactly as received. No transformations, no opinions.
  Rebuildable-from-source is the only requirement.
- **Core** — the modeled truth: your star schema lives here. One consistent
  version of "customer", "order", "revenue" for the whole company.
- **Marts** — what each consumer actually queries: pre-joined, pre-aggregated,
  named in their language.

Postgres **schemas** (namespaces) model this perfectly — and that's exactly how
real warehouses (Snowflake, BigQuery datasets, Databricks schemas) organize it.
The seed already has \`staging.raw_orders\`; let's add the other layers.`,
        },
        {
          kind: "sql-runnable",
          title: "Create the layers and populate a mart",
          seedId: "warehouse",
          resetBefore: true,
          sql: `CREATE SCHEMA IF NOT EXISTS marts;

-- A mart table for the sales team: revenue per product category per month,
-- built FROM the core star schema (fact_sales + dims are our "core" layer).
CREATE TABLE marts.category_monthly AS
SELECT d.year, d.month, p.category,
       SUM(f.qty)    AS units,
       SUM(f.amount) AS revenue
FROM fact_sales f
JOIN dim_date    d USING (date_key)
JOIN dim_product p USING (product_key)
GROUP BY d.year, d.month, p.category;

SELECT * FROM marts.category_monthly
ORDER BY year, month, revenue DESC
LIMIT 8;`,
        },
        {
          kind: "sql-runnable",
          title: "Each layer answers to a different audience",
          seedId: "warehouse",
          sql: `-- staging: raw, ugly, faithful — engineers only.
SELECT * FROM staging.raw_orders LIMIT 3;`,
        },
        {
          kind: "sql-challenge",
          title: "Build a customer mart query",
          seedId: "warehouse",
          prompt:
            "The CRM team wants a per-customer summary from the core layer: `name` (current version only — `is_current`), `orders` (count of **distinct** `order_id`), and `revenue` (`SUM(amount)`). Order by `revenue` descending.\n\n*Note: join on the natural key `customer_id` so all versions' facts roll up to the current name.*",
          starterSql:
            "SELECT cur.name\nFROM fact_sales f\nJOIN dim_customer hist USING (customer_key)\nJOIN dim_customer cur\n  ON cur.customer_id = hist.customer_id AND cur.is_current\nGROUP BY cur.name;",
          solution:
            "SELECT cur.name, COUNT(DISTINCT f.order_id) AS orders, SUM(f.amount) AS revenue FROM fact_sales f JOIN dim_customer hist USING (customer_key) JOIN dim_customer cur ON cur.customer_id = hist.customer_id AND cur.is_current GROUP BY cur.name ORDER BY revenue DESC;",
          ordered: true,
          hints: [
            "This is the as-is pattern from Data Modeling: hop hist → natural key → current row.",
            "COUNT(DISTINCT order_id) because the fact grain is order LINES.",
          ],
          xp: 70,
        },
        {
          kind: "quiz",
          question: "Why must the staging layer stay free of transformations — even 'obvious' fixes?",
          options: [
            {
              text: "It's the rebuild point: if any downstream logic turns out wrong, untouched staging data lets you replay; 'fixed' staging destroys the evidence",
              correct: true,
            },
            { text: "Transformations in staging are slower than in core" },
            { text: "Staging tables don't support UPDATE statements" },
            { text: "So analysts can query raw data directly" },
          ],
          explanation:
            "Staging = faithful copy of the source at load time. Every fix belongs one layer up where it's versioned, tested, and re-runnable. (Same principle as bronze in the medallion architecture — coming two lessons.)",
        },
      ],
    },
    {
      id: "etl-vs-elt",
      title: "ETL vs ELT",
      summary: "Where the T happens, and why modern stacks flipped it.",
      minutes: 9,
      blocks: [
        {
          kind: "prose",
          markdown: `# ETL vs ELT

Same three letters, different order, different era:

| | **ETL** (classic) | **ELT** (modern) |
|---|---|---|
| Transform happens | *before* loading, on a separate engine (Informatica, SSIS, custom Spark) | *inside* the warehouse, in SQL, after loading raw |
| Warehouse receives | clean, final tables | raw data (staging), transformed in place |
| Driven by | expensive warehouse compute — load only what's needed | cheap elastic warehouse compute (Snowflake/BigQuery/Databricks) |
| Transform tooling | ETL tool GUIs, Java/Python jobs | **SQL + dbt** |
| Raw data kept? | usually not | yes — reload/replay anytime |

Why ELT won:

1. **Warehouse compute got cheap and elastic** — transforming inside it beats
   maintaining a second engine.
2. **Raw-in-warehouse = replayability** — bug in the transform? Fix the SQL and
   rebuild; the raw layer is still there.
3. **SQL is the shared language** — analytics engineers own transforms without a
   Java/ETL-tool priesthood.

ETL still earns its place when data must be cleaned *before* it may be stored
(PII redaction, regulatory), or when the source volume must be reduced in flight.`,
        },
        {
          kind: "flashcards",
          title: "Storage-architecture vocabulary",
          cards: [
            { front: "ETL vs ELT", back: "ETL: transform BEFORE loading, on a separate engine. ELT: load raw into the warehouse, transform there in SQL (dbt). ELT won because warehouse compute got cheap and raw-in-warehouse means replayability." },
            { front: "Warehouse vs lake vs lakehouse", back: "Warehouse: managed tables, schema-on-write, ACID. Lake: cheap files, schema-on-read, anything goes. Lakehouse: lake storage + table formats = warehouse guarantees on open files." },
            { front: "Medallion layers", back: "Bronze: raw, append-only, replay point. Silver: cleaned, typed, deduped, conformed. Gold: business aggregates & marts. Consumers read the layer whose promises they need." },
            { front: "The transaction-log trick (Delta/Iceberg)", back: "A table = data files + an ordered log of commits (add/remove files). Replay the log → current table; replay part of it → time travel; one atomic commit → ACID." },
            { front: "High-water mark", back: "Remember the max id/timestamp already loaded; next run takes only rows above it. Simple incremental loading — but misses in-place updates (use MERGE or CDC for those)." },
            { front: "Partition pruning", back: "Split big tables by a filter column (almost always date) so queries scan only matching pieces. Defeated by wrapping the partition column in functions." },
          ],
        },
        {
          kind: "quiz",
          question:
            "A bug is found in revenue logic from 3 months ago. Why does the ELT team have a much better day than the classic-ETL team?",
          options: [
            {
              text: "The raw data is still in the warehouse — fix the SQL transform and rebuild; the ETL team must re-extract from sources that may no longer have the history",
              correct: true,
            },
            { text: "ELT transforms are written in Python, which has fewer bugs" },
            { text: "ELT pipelines never have logic bugs because SQL is declarative" },
            { text: "The ETL team's warehouse is too small to reprocess" },
          ],
          explanation:
            "Keeping raw data resident is ELT's superpower: transforms become disposable, versioned code (dbt models) over durable raw data. Classic ETL threw the raw away after transforming.",
        },
        {
          kind: "quiz",
          question: "Which requirement genuinely argues for transforming BEFORE load (ETL-style)?",
          options: [
            { text: "PII must be masked before it is ever persisted in the analytics platform", correct: true },
            { text: "The transforms are written in SQL" },
            { text: "The team wants to keep raw data for replay" },
            { text: "The warehouse bills per query" },
          ],
          explanation:
            "Compliance constraints on what may be *stored* force the T ahead of the L. Most other considerations — cost, tooling, replayability — favor ELT on modern platforms.",
        },
      ],
    },
    {
      id: "data-lakes",
      title: "Data Lakes",
      summary: "Cheap object storage, schema-on-read, and how lakes turn into swamps.",
      minutes: 10,
      blocks: [
        {
          kind: "prose",
          markdown: `# Data lakes

A **data lake** is files in cheap object storage — S3, ADLS, GCS — organized by
convention:

\`\`\`
s3://company-lake/
  raw/salesforce/accounts/ingest_date=2026-07-01/part-0001.parquet
  raw/app-events/date=2026-07-01/hour=13/events-*.json
  curated/sales/fact_sales/year=2026/month=06/*.parquet
\`\`\`

## Warehouse vs lake — the classic split

| | Warehouse | Lake |
|---|---|---|
| Stores | tables (engine-managed) | files (you manage) |
| Schema | **on write** — enforced at load | **on read** — applied when queried |
| Data kinds | structured | anything: logs, images, JSON, Parquet |
| Cost | compute+storage coupled (classically) | dirt-cheap storage, bring-your-own engine |
| ACID / updates | yes | **no** — files don't do transactions |

**Schema-on-read** is the double-edged sword: you can land *anything* now and
decide its structure later — but nothing stops half your files from disagreeing
about that structure.

## The swamp

A lake with no ownership, no schema discipline, no partition conventions, and no
catalog is a **data swamp**: petabytes nobody can query or trust. The cures are
exactly what the next lesson adds: **table formats** (bring schema + ACID to
files) and **catalogs** (know what exists).`,
        },
        {
          kind: "quiz",
          question:
            "Why did companies run a lake AND a warehouse side by side for years (the 'two-tier' architecture)?",
          options: [
            {
              text: "The lake held everything cheaply (incl. unstructured data for ML), but lacked ACID/schema/performance — so curated subsets were copied into a warehouse for BI",
              correct: true,
            },
            { text: "Regulations require storing every dataset twice" },
            { text: "Warehouses cannot read Parquet files at all" },
            { text: "Lakes are faster for BI dashboards than warehouses" },
          ],
          explanation:
            "Each tier covered the other's weakness, at the price of duplicate storage, drift between copies, and two security models. The lakehouse exists to collapse this back to one tier.",
        },
        {
          kind: "quiz",
          question: "In lake layouts like `.../events/date=2026-07-01/hour=13/`, what is the folder convention doing?",
          options: [
            {
              text: "Hive-style partitioning: engines prune whole folders when a query filters on date/hour, skipping most of the data",
              correct: true,
            },
            { text: "Making the files easier for humans to browse — no query impact" },
            { text: "Encrypting the data per day" },
            { text: "Guaranteeing exactly-once writes" },
          ],
          explanation:
            "Partition folders are the lake's coarse index: `WHERE date = '2026-07-01'` reads one folder instead of the whole dataset. You'll see the same idea as table partitioning in the last lesson of this module.",
        },
      ],
    },
    {
      id: "lakehouse-formats",
      title: "Lakehouse & Table Formats (Delta, Iceberg, Hudi)",
      summary: "How a transaction log turns files into ACID tables — build one to see it.",
      minutes: 14,
      blocks: [
        {
          kind: "prose",
          markdown: `# The lakehouse

**Lakehouse = lake storage + warehouse guarantees.** One copy of the data, in open
file formats, with ACID transactions, schema enforcement, and time travel. The
trick is an **open table format** layered over Parquet files:

- **Delta Lake** (Databricks ecosystem), **Apache Iceberg** (broadest engine
  support), **Apache Hudi** (streaming-upsert roots). Same core idea.

## The core idea: a transaction log

The table isn't the files — it's the files **plus a log of commits**:

\`\`\`
_delta_log/00000.json   {"add": ["part-001.parquet", "part-002.parquet"]}
_delta_log/00001.json   {"add": ["part-003.parquet"]}
_delta_log/00002.json   {"remove": ["part-001.parquet"], "add": ["part-004.parquet"]}
\`\`\`

Readers replay the log to learn *which files are currently the table*. That one
design buys everything:

- **ACID**: a commit is one atomic log entry — readers see all of it or none.
- **Time travel**: replay the log only up to version N ⇒ the table as of N.
- **Updates/deletes on immutable files**: rewrite affected files, log
  remove+add; old files stay for history until vacuumed.

Let's build a miniature one.`,
        },
        {
          kind: "runnable",
          title: "A tiny Delta-style transaction log",
          code: `import json

log = []  # the _delta_log: an ordered list of JSON commits

def commit(add=None, remove=None):
    log.append(json.dumps({"add": add or [], "remove": remove or []}))

def table_files(as_of=None):
    """Replay the log (optionally only to version as_of) → current file set."""
    files = set()
    entries = log if as_of is None else log[: as_of + 1]
    for entry in entries:
        c = json.loads(entry)
        files -= set(c["remove"])
        files |= set(c["add"])
    return sorted(files)

# v0: initial load writes two files
commit(add=["part-001.parquet", "part-002.parquet"])
# v1: an append adds one more
commit(add=["part-003.parquet"])
# v2: an UPDATE rewrites part-001 into part-004 (files are immutable!)
commit(remove=["part-001.parquet"], add=["part-004.parquet"])

print("current table:", table_files())
print("time travel to v0:", table_files(as_of=0))
print("time travel to v1:", table_files(as_of=1))`,
        },
        {
          kind: "challenge",
          title: "Implement time travel",
          prompt: `You're given a list of commits, each a dict like
\`{"add": [...], "remove": [...]}\`. Write \`files_at(commits, version)\` that
replays commits \`0..version\` (inclusive) and returns the **sorted list** of files
that make up the table at that version.`,
          starterCode: `def files_at(commits, version):
    pass`,
          tests: [
            {
              name: "append only",
              assertion: `commits = [{"add": ["a"], "remove": []}, {"add": ["b"], "remove": []}]
assert files_at(commits, 1) == ["a", "b"]
assert files_at(commits, 0) == ["a"]`,
            },
            {
              name: "rewrite",
              assertion: `commits = [
    {"add": ["a", "b"], "remove": []},
    {"add": ["c"], "remove": ["a"]},
]
assert files_at(commits, 1) == ["b", "c"]`,
            },
            {
              name: "remove then re-add",
              assertion: `commits = [
    {"add": ["a"], "remove": []},
    {"add": [], "remove": ["a"]},
    {"add": ["a"], "remove": []},
]
assert files_at(commits, 1) == []
assert files_at(commits, 2) == ["a"]`,
              hidden: true,
            },
          ],
          hints: [
            "Keep a set; for each commit up to `version`: subtract removes, add adds.",
            "Return `sorted(files)` at the end.",
          ],
          solution: `def files_at(commits, version):
    files = set()
    for c in commits[: version + 1]:
        files -= set(c["remove"])
        files |= set(c["add"])
    return sorted(files)`,
          xp: 80,
        },
        {
          kind: "quiz",
          question:
            "Delta's OPTIMIZE (compaction) merges many small files into few big ones, and VACUUM deletes unreferenced files. Why does time travel stop working past the VACUUM horizon?",
          options: [
            {
              text: "Old versions are reconstructed from old files — once VACUUM physically deletes files no current version references, those historical versions have nothing to replay onto",
              correct: true,
            },
            { text: "VACUUM deletes the transaction log itself" },
            { text: "OPTIMIZE rewrites history to the new files" },
            { text: "Time travel never worked after any write" },
          ],
          explanation:
            "The log can still describe version N, but the parquet files that version pointed at are gone. Hence retention windows: VACUUM only removes files older than the configured time-travel horizon.",
        },
      ],
    },
    {
      id: "medallion",
      title: "Medallion Architecture: Bronze / Silver / Gold",
      summary: "The lakehouse's layered pattern — build all three layers in SQL.",
      minutes: 14,
      blocks: [
        {
          kind: "prose",
          markdown: `# Medallion architecture

The lakehouse version of staging → core → marts, popularized by Databricks:

| Layer | Contents | Rule |
|---|---|---|
| **Bronze** | raw, as-ingested, append-only (+ audit columns like \`loaded_at\`) | never edit; the replay point |
| **Silver** | cleaned, typed, deduplicated, conformed entities | one row = one true thing |
| **Gold** | business-level aggregates & marts | shaped for consumers |

Data only flows **forward**; each layer is rebuildable from the previous one.
Our \`staging.raw_orders\` (with its \`loaded_at\` audit column) plays bronze.
Let's build silver and gold on top of it.`,
        },
        {
          kind: "sql-runnable",
          title: "Bronze → Silver: clean, type, enrich",
          seedId: "warehouse",
          resetBefore: true,
          sql: `CREATE SCHEMA IF NOT EXISTS silver;

-- Silver: deduplicated (latest load wins per order line), enriched with dim keys.
CREATE TABLE silver.orders AS
SELECT DISTINCT ON (r.order_id, r.product_id)
       r.order_id,
       c.customer_key,             -- resolve natural → surrogate key
       p.product_key,
       r.qty,
       r.unit_price,
       r.qty * r.unit_price AS amount,
       r.order_date
FROM staging.raw_orders r
JOIN dim_customer c ON c.customer_id = r.customer_id AND c.is_current
JOIN dim_product  p ON p.product_id  = r.product_id
ORDER BY r.order_id, r.product_id, r.loaded_at DESC;

SELECT * FROM silver.orders ORDER BY order_id;`,
        },
        {
          kind: "sql-runnable",
          title: "Silver → Gold: business aggregates",
          seedId: "warehouse",
          sql: `CREATE SCHEMA IF NOT EXISTS gold;

CREATE TABLE gold.monthly_revenue AS
SELECT date_trunc('month', order_date)::date AS month,
       COUNT(DISTINCT order_id) AS orders,
       SUM(amount)              AS revenue
FROM silver.orders
GROUP BY 1;

SELECT * FROM gold.monthly_revenue ORDER BY month;`,
        },
        {
          kind: "sql-challenge",
          title: "A gold-layer query from bronze",
          seedId: "warehouse",
          prompt:
            "Grading resets the DB, so query bronze directly (`staging.raw_orders`): produce the gold-style daily revenue — `order_date` and `revenue` (`SUM(qty * unit_price)`) per day, ordered by `order_date`.",
          starterSql: "SELECT order_date\nFROM staging.raw_orders\nGROUP BY order_date;",
          solution:
            "SELECT order_date, SUM(qty * unit_price) AS revenue FROM staging.raw_orders GROUP BY order_date ORDER BY order_date;",
          ordered: true,
          hints: [
            "Revenue per row is qty * unit_price; SUM it per order_date.",
          ],
          xp: 60,
        },
        {
          kind: "quiz",
          question: "Dashboards must never read bronze directly. What's the actual reason?",
          options: [
            {
              text: "Bronze is raw and append-only: duplicates, bad types, and unconformed values are all *expected* there — trust guarantees only start at silver",
              correct: true,
            },
            { text: "Bronze tables are stored in a slower format" },
            { text: "Object storage can't serve queries" },
            { text: "Bronze is encrypted and dashboards lack the key" },
          ],
          explanation:
            "Each layer makes promises: bronze promises completeness/replayability only; silver adds correctness (typed, deduped, conformed); gold adds business meaning. Consumers read the layer whose promises they need.",
        },
      ],
    },
    {
      id: "incremental-cdc",
      title: "Incremental Loads & CDC",
      summary: "High-water marks, anti-join loads, and where CDC fits.",
      minutes: 13,
      blocks: [
        {
          kind: "prose",
          markdown: `# Incremental loads

Full reloads don't scale. Incremental loads move **only what's new**, using one of:

- **High-water mark**: remember the max \`loaded_at\` / \`id\` processed; next run
  takes rows above it. Simple; misses *updates* to old rows.
- **Anti-join / MERGE by key**: load rows whose key isn't in the target (or MERGE
  to also update changed ones). Idempotent — safe to re-run.
- **CDC (Change Data Capture)**: read the source database's replication log —
  every INSERT/UPDATE/DELETE as an event (Debezium → Kafka is the classic stack).
  Complete and low-latency, at the cost of infrastructure.

Our seed stages five order lines (\`staging.raw_orders\`), of which **two are
already in \`fact_sales\`** — exactly the re-delivery mess incremental logic must
survive. Watch both patterns handle it.`,
        },
        {
          kind: "sql-runnable",
          title: "High-water mark: what's above the line?",
          seedId: "warehouse",
          resetBefore: true,
          sql: `-- The mark: the highest order_id already in the fact table.
SELECT MAX(order_id) AS high_water_mark FROM fact_sales;

-- Everything staged above it is new.
SELECT r.*
FROM staging.raw_orders r
WHERE r.order_id > (SELECT MAX(order_id) FROM fact_sales)
ORDER BY r.order_id;`,
        },
        {
          kind: "sql-runnable",
          title: "The idempotent incremental load (anti-join insert)",
          seedId: "warehouse",
          sql: `INSERT INTO fact_sales (date_key, customer_key, product_key, order_id, qty, unit_price, amount)
SELECT to_char(r.order_date, 'YYYYMMDD')::int,
       c.customer_key,
       p.product_key,
       r.order_id, r.qty, r.unit_price, r.qty * r.unit_price
FROM staging.raw_orders r
JOIN dim_customer c ON c.customer_id = r.customer_id AND c.is_current
JOIN dim_product  p ON p.product_id  = r.product_id
WHERE NOT EXISTS (SELECT 1 FROM fact_sales f WHERE f.order_id = r.order_id);

-- Re-running this INSERT now adds 0 rows — that's idempotency.
SELECT COUNT(*) AS fact_rows, MAX(order_id) AS new_high_water FROM fact_sales;`,
        },
        {
          kind: "sql-challenge",
          title: "Find the new rows",
          seedId: "warehouse",
          prompt:
            "Using the **anti-join** pattern, return the staged order lines not yet in `fact_sales` (match on `order_id`): `order_id`, `customer_id`, and `order_date`, ordered by `order_id`.",
          starterSql:
            "SELECT r.order_id, r.customer_id, r.order_date\nFROM staging.raw_orders r\nWHERE -- not already in fact_sales\n;",
          solution:
            "SELECT r.order_id, r.customer_id, r.order_date FROM staging.raw_orders r WHERE NOT EXISTS (SELECT 1 FROM fact_sales f WHERE f.order_id = r.order_id) ORDER BY r.order_id;",
          ordered: true,
          hints: [
            "`WHERE NOT EXISTS (SELECT 1 FROM fact_sales f WHERE f.order_id = r.order_id)`.",
            "Orders 115 and 116 must be excluded — they already loaded.",
          ],
          xp: 70,
        },
        {
          kind: "quiz",
          question:
            "A source row was UPDATED after it was first loaded. Which incremental strategy silently misses this, and which handles it?",
          options: [
            {
              text: "A high-water mark on an increasing id misses it (the id didn't grow); MERGE by key or CDC catches it",
              correct: true,
            },
            { text: "All three strategies miss updates" },
            { text: "CDC misses it; the high-water mark catches it" },
            { text: "Anti-join INSERT catches it by inserting a duplicate" },
          ],
          explanation:
            "Watermarks only see *new* values above the mark — an in-place update to an old row never crosses it (unless the mark is a trustworthy `updated_at`). MERGE compares by key and updates; CDC streams the update event itself.",
        },
      ],
    },
    {
      id: "partitioning",
      title: "Partitioning & Clustering",
      summary: "Prune, don't scan: the warehouse's most important performance lever.",
      minutes: 13,
      blocks: [
        {
          kind: "prose",
          markdown: `# Partitioning

Big fact tables are physically split by a column — almost always **date** — so
queries that filter on it read only the matching pieces (**partition pruning**).

The same idea wears different names per platform:

| Platform | Mechanism |
|---|---|
| Postgres | declarative \`PARTITION BY RANGE/LIST/HASH\` — child tables |
| BigQuery | partition column (+ **clustering** for sort within partitions) |
| Snowflake | automatic micro-partitions + optional clustering keys |
| Databricks/Delta | partition folders + Z-ORDER / liquid clustering |

Postgres partitioning is real and observable in PGlite — let's watch the planner
prune.`,
        },
        {
          kind: "sql-runnable",
          title: "A partitioned events table",
          seedId: "warehouse",
          resetBefore: true,
          sql: `CREATE TABLE events (id int, created date, amount numeric)
PARTITION BY RANGE (created);

CREATE TABLE events_2025 PARTITION OF events
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE events_2026 PARTITION OF events
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

INSERT INTO events
SELECT g, DATE '2025-01-01' + (g % 540), (g % 100)::numeric
FROM generate_series(1, 10000) g;

-- Rows landed in the right children automatically:
SELECT tableoid::regclass AS partition, COUNT(*) AS rows
FROM events GROUP BY 1 ORDER BY 1;`,
        },
        {
          kind: "sql-runnable",
          title: "Watch the planner prune",
          seedId: "warehouse",
          sql: `-- Filter on the partition key: the plan scans ONLY events_2026.
EXPLAIN SELECT SUM(amount) FROM events WHERE created >= '2026-01-01';`,
        },
        {
          kind: "sql-runnable",
          title: "…and watch pruning NOT happen",
          seedId: "warehouse",
          sql: `-- Wrap the partition key in a function and the planner can't prune:
-- both partitions are scanned. (Same trap as un-sargable WHERE clauses.)
EXPLAIN SELECT SUM(amount) FROM events WHERE date_trunc('year', created) = '2026-01-01';`,
        },
        {
          kind: "quiz",
          question: "Which column should partition a 10-billion-row clickstream fact table, and why?",
          options: [
            {
              text: "Event date — nearly every query filters by a time range, so pruning skips most partitions; per-user or per-page partitions would explode into millions of tiny pieces",
              correct: true,
            },
            { text: "user_id — it has the most distinct values" },
            { text: "A random hash, to keep partitions equal-sized" },
            { text: "page_url — it's the most-queried dimension" },
          ],
          explanation:
            "Partition by what queries FILTER on (time, overwhelmingly), keep cardinality modest (days/months, not users), and let clustering/sort keys handle secondary columns within partitions.",
        },
        {
          kind: "quiz",
          question:
            "A query filters `WHERE date_trunc('month', created) = '2026-03-01'` and scans everything. What's the pruning-friendly rewrite?",
          options: [
            {
              text: "A range on the raw column: `created >= '2026-03-01' AND created < '2026-04-01'`",
              correct: true,
            },
            { text: "Add an index on date_trunc('month', created)" },
            { text: "Move the filter into a HAVING clause" },
            { text: "Partition by month_name instead" },
          ],
          explanation:
            "Pruning (and B-tree indexes) need the bare partition column compared to constants. Function-wrapped columns defeat both — the #1 partitioned-table performance bug on every platform.",
        },
      ],
    },
  ],
};
