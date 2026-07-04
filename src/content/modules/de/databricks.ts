import type { Module } from "../../../types/lesson";

// Databricks — the platform layer over Spark + Delta Lake. Concepts (workspace,
// Unity Catalog, Jobs/DLT, SQL warehouses) via prose + quizzes; Delta's MERGE
// semantics practiced for real with Postgres 15 MERGE on the warehouse seed; a
// rapid-fire certification-prep lesson closes the module.
export const databricks: Module = {
  id: "databricks",
  title: "Databricks",
  blurb: "The lakehouse platform: workspace, Delta Lake, Unity Catalog, Jobs, DBSQL.",
  track: "Data Engineering",
  level: "Intermediate",
  icon: "🧱",
  status: "deep",
  lessons: [
    {
      id: "databricks-platform",
      title: "The Databricks Platform",
      summary: "Workspace, notebooks, clusters, Repos — the map of where work happens.",
      minutes: 11,
      blocks: [
        {
          kind: "prose",
          markdown: `# What Databricks actually is

Databricks = **managed Spark + Delta Lake + a collaborative workspace**, sold as
one platform on your cloud (the data itself stays in YOUR S3/ADLS/GCS account).

## The pieces you'll touch daily

- **Workspace** — the web UI: notebooks, folders, permissions.
- **Notebooks** — multi-language cells (\`%python\`, \`%sql\`, \`%scala\`, \`%md\`)
  attached to a cluster. The default dev surface.
- **Clusters (compute)**:
  - **All-purpose clusters** — interactive, shared, for development. Expensive
    to leave running.
  - **Job clusters** — spun up for a scheduled job, terminated after. Cheaper;
    what production should use.
  - **SQL warehouses** — serverless-ish compute for pure SQL/BI (lesson 6).
- **Repos / Git folders** — sync notebooks & code with GitHub for real code
  review (yes, you should PR your notebooks).
- **DBFS / Volumes** — file access layered over cloud storage.
- **Unity Catalog** — governance across all of it (lesson 4).

## The runtime

Clusters run the **Databricks Runtime (DBR)**: Spark + performance patches +
preinstalled libraries + **Photon** (a C++ vectorized engine that accelerates
SQL/DataFrame workloads transparently).

Your PySpark knowledge transfers 1:1 — \`spark\` is already defined in every
notebook; the platform's job is to remove the cluster-management yak-shaving.`,
        },
        {
          kind: "quiz",
          question: "A nightly production ETL runs on a shared all-purpose cluster someone leaves up 24/7. The cost-and-correctness fix is…",
          options: [
            {
              text: "Run it as a Job on a job cluster: compute spins up for the run, dies after, and the job gets isolated, reproducible resources",
              correct: true,
            },
            { text: "A bigger all-purpose cluster so it finishes faster" },
            { text: "Moving the ETL into a dashboard refresh" },
            { text: "Running it on the driver of the SQL warehouse" },
          ],
          explanation:
            "All-purpose clusters are for humans iterating; job clusters are for machines executing. Ephemeral job compute is both cheaper (no idle burn) and safer (no dependency drift from a long-lived shared cluster).",
        },
        {
          kind: "quiz",
          question: "Where does the data live when a company uses Databricks?",
          options: [
            {
              text: "In the company's own cloud object storage (S3/ADLS/GCS) — Databricks provides compute and control planes over it",
              correct: true,
            },
            { text: "Inside Databricks' proprietary database" },
            { text: "On the cluster's local disks permanently" },
            { text: "In the notebook files" },
          ],
          explanation:
            "This is the lakehouse pitch: open formats (Delta/Parquet) in your own buckets. Clusters are stateless compute; kill them and the data is untouched — and other engines can read the same files.",
        },
      ],
    },
    {
      id: "delta-lake",
      title: "Delta Lake in Practice",
      summary: "MERGE upserts (run it for real), time travel, OPTIMIZE & VACUUM.",
      minutes: 15,
      blocks: [
        {
          kind: "prose",
          markdown: `# Delta Lake, hands-on

You built a mini transaction log in the Lakehouse module — Delta is that idea
productionized. The daily-driver features:

## MERGE — the idempotent load

\`\`\`sql
MERGE INTO fact_sales AS t
USING staged_updates AS s
  ON t.order_id = s.order_id
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *
\`\`\`

One statement: update existing keys, insert new ones. Re-run it and nothing
duplicates — **the** write pattern for incremental loads and SCD upkeep.

## Time travel

\`\`\`sql
SELECT * FROM fact_sales VERSION AS OF 42;
SELECT * FROM fact_sales TIMESTAMP AS OF '2026-07-01';
RESTORE TABLE fact_sales TO VERSION AS OF 42;   -- oops-undo
\`\`\`

## Maintenance

- \`OPTIMIZE fact_sales\` — compact many small files into few big ones
  (+ \`ZORDER BY (customer_key)\` to co-locate hot columns).
- \`VACUUM fact_sales\` — physically delete files unreferenced for the retention
  window (default 7 days) — this is what bounds time travel.

**Postgres 15+ has real \`MERGE\`** with the same shape, so you can drill the
exact semantics right here on the warehouse seed.`,
        },
        {
          kind: "sql-runnable",
          title: "MERGE the staged orders into the fact table",
          seedId: "warehouse",
          resetBefore: true,
          sql: `-- staging.raw_orders holds 5 rows: 115 & 116 already exist in fact_sales,
-- 117–119 are new. One MERGE handles both cases — and re-running is harmless.
MERGE INTO fact_sales f
USING (
  SELECT r.order_id, r.qty, r.unit_price,
         to_char(r.order_date, 'YYYYMMDD')::int AS date_key,
         c.customer_key, p.product_key
  FROM staging.raw_orders r
  JOIN dim_customer c ON c.customer_id = r.customer_id AND c.is_current
  JOIN dim_product  p ON p.product_id  = r.product_id
) s
ON f.order_id = s.order_id
WHEN MATCHED THEN
  UPDATE SET qty = s.qty, unit_price = s.unit_price, amount = s.qty * s.unit_price
WHEN NOT MATCHED THEN
  INSERT (date_key, customer_key, product_key, order_id, qty, unit_price, amount)
  VALUES (s.date_key, s.customer_key, s.product_key, s.order_id, s.qty, s.unit_price, s.qty * s.unit_price);

SELECT COUNT(*) AS fact_rows, MAX(order_id) AS max_order FROM fact_sales;`,
        },
        {
          kind: "sql-challenge",
          title: "Predict the MERGE",
          seedId: "warehouse",
          prompt:
            "Before running a MERGE you should know what it will do. For every row in `staging.raw_orders`, return `order_id` and `action`: `'update'` if that `order_id` already exists in `fact_sales`, else `'insert'`. Order by `order_id`.",
          starterSql:
            "SELECT r.order_id,\n       CASE ... END AS action\nFROM staging.raw_orders r\nORDER BY r.order_id;",
          solution:
            "SELECT r.order_id, CASE WHEN EXISTS (SELECT 1 FROM fact_sales f WHERE f.order_id = r.order_id) THEN 'update' ELSE 'insert' END AS action FROM staging.raw_orders r ORDER BY r.order_id;",
          ordered: true,
          hints: [
            "EXISTS against fact_sales inside a CASE decides matched vs not-matched.",
            "Expected: 115/116 → update, 117/118/119 → insert.",
          ],
          xp: 80,
        },
        {
          kind: "quiz",
          question: "`VACUUM my_table RETAIN 0 HOURS` (forced) ran yesterday. Today `SELECT * FROM my_table VERSION AS OF 10` fails. Why?",
          options: [
            {
              text: "VACUUM physically deleted the old data files that version 10 referenced — the log survives but has nothing to replay onto",
              correct: true,
            },
            { text: "VACUUM truncates the transaction log itself" },
            { text: "Version numbers reset after every VACUUM" },
            { text: "Time travel requires OPTIMIZE first" },
          ],
          explanation:
            "Exactly the trade you simulated in the Lakehouse module: time travel lives on retained old files. Retention (default 7 days) is the dial between storage cost and how far back you can rewind.",
        },
      ],
    },
    {
      id: "medallion-autoloader",
      title: "Medallion on Databricks & Auto Loader",
      summary: "Bronze/silver/gold as Delta tables, fed by incremental file ingestion.",
      minutes: 11,
      blocks: [
        {
          kind: "prose",
          markdown: `# The medallion, Databricks-flavored

You built bronze → silver → gold in PGlite. On Databricks each layer is a
**Delta table** (often one schema per layer in Unity Catalog), and the flows
between them are Spark jobs or DLT pipelines:

\`\`\`
cloud files ─▶ BRONZE (raw Delta, append-only, + _metadata columns)
                 └─▶ SILVER (MERGE: dedup, types, conformance)
                        └─▶ GOLD (aggregates, business marts)
\`\`\`

## Auto Loader — the bronze feeder

The standing problem: files keep landing in a bucket; load each exactly once.

\`\`\`python
(spark.readStream
      .format("cloudFiles")                       # ← Auto Loader
      .option("cloudFiles.format", "json")
      .option("cloudFiles.schemaLocation", chk)   # schema tracking + evolution
      .load("s3://landing/events/")
      .writeStream
      .option("checkpointLocation", chk)
      .trigger(availableNow=True)                 # batch-style: process new files, stop
      .toTable("bronze.events"))
\`\`\`

- Tracks **which files were already ingested** (no reprocessing, no misses) —
  the file-level version of the high-water mark you implemented.
- **Schema inference + evolution**: new columns get picked up (or quarantined
  to \`_rescued_data\` instead of failing the pipeline).
- \`trigger(availableNow=True)\` makes it run like an incremental batch job —
  streaming machinery, batch cadence.`,
        },
        {
          kind: "quiz",
          question: "Without Auto Loader, a job re-lists the whole bucket and reloads everything nightly. What exactly does Auto Loader fix?",
          options: [
            {
              text: "It checkpoints which files were already processed, so each run ingests only NEW files — exactly-once, incremental, cheap",
              correct: true,
            },
            { text: "It compresses the files during upload" },
            { text: "It converts JSON to Parquet in the bucket" },
            { text: "It removes the need for a bronze layer" },
          ],
          explanation:
            "It's the high-water-mark pattern applied to files, managed for you (checkpoint + optional cloud notifications instead of full listings). Idempotent ingestion is the foundation the whole medallion sits on.",
        },
        {
          kind: "quiz",
          question: "A malformed field starts appearing in source JSON. With Auto Loader's `_rescued_data`, what happens?",
          options: [
            {
              text: "The unparseable data lands in the _rescued_data column instead of killing the pipeline — you can inspect and repair it downstream",
              correct: true,
            },
            { text: "The pipeline stops until the source is fixed" },
            { text: "The bad records are silently dropped" },
            { text: "The whole file is skipped" },
          ],
          explanation:
            "Bronze's job is to never lose data AND never block: capture everything, quarantine what doesn't fit, keep flowing. Silver decides what to do with the rescued values — a data-quality decision, not an ingestion failure.",
        },
      ],
    },
    {
      id: "unity-catalog",
      title: "Unity Catalog & Governance",
      summary: "catalog.schema.table, centralized permissions, lineage.",
      minutes: 11,
      blocks: [
        {
          kind: "prose",
          markdown: `# Unity Catalog

One governance layer over every workspace: **who can see what**, with lineage
and audit built in.

## The three-level namespace

\`\`\`sql
SELECT * FROM prod.gold.monthly_revenue;
--            └──┬─┘ └─┬─┘ └──────┬──────┘
--            catalog  schema     table
\`\`\`

A common layout: catalogs per environment (\`dev\`/\`staging\`/\`prod\`), schemas
per layer or domain (\`bronze\`/\`silver\`/\`gold\`, or \`finance\`/\`growth\`), tables
inside. (Postgres's \`schema.table\` is the same idea, one level shorter — you've
been using it since the warehouse lessons.)

## What it gives you

- **Permissions**: standard \`GRANT SELECT ON schema prod.gold TO analysts\` —
  the exact model from the Roles & Permissions lesson, warehouse-wide.
- **Lineage**: automatic column-level tracking of what reads/writes what —
  "which dashboards break if I change this column?" becomes a query.
- **Discovery**: searchable catalog with owners, tags, and documentation.
- **Cross-workspace**: one metastore governs many workspaces; shares data
  without copying (Delta Sharing).

Governance sounds bureaucratic until the incident: *lineage* is how you find
every consumer of a corrupted table in minutes instead of days.`,
        },
        {
          kind: "quiz",
          question: "A column in `prod.silver.customers` must be dropped. How does Unity Catalog de-risk this?",
          options: [
            {
              text: "Column-level lineage lists every downstream table, dashboard, and job that reads it — you know the blast radius before you act",
              correct: true,
            },
            { text: "It automatically rewrites downstream queries" },
            { text: "It prevents columns from ever being dropped" },
            { text: "It backs the column up to a separate catalog" },
          ],
          explanation:
            "Impact analysis is lineage's killer feature. Without it, 'who uses this?' is tribal knowledge and grep; with it, it's a lookup. (The change itself still deserves a deprecation window — governance tooling doesn't replace judgment.)",
        },
        {
          kind: "quiz",
          question: "Which permissions design matches the medallion layers in Unity Catalog?",
          options: [
            {
              text: "Pipelines/service principals write bronze & silver; analysts get SELECT on gold (and maybe silver); humans never write raw layers",
              correct: true,
            },
            { text: "All users get ALL PRIVILEGES on the prod catalog for velocity" },
            { text: "Analysts write to gold directly so reports stay fresh" },
            { text: "Every team gets its own copy of the data" },
          ],
          explanation:
            "Identical to the Postgres roles lesson, one level up: write access follows the automated pipeline path, read access follows the consumer layers. Service principals (not personal accounts) own production writes for auditability.",
        },
      ],
    },
    {
      id: "jobs-workflows",
      title: "Jobs, Workflows & DLT",
      summary: "Scheduling on-platform: task DAGs, and declarative pipelines.",
      minutes: 11,
      blocks: [
        {
          kind: "prose",
          markdown: `# Orchestration, Databricks-native

## Workflows (Jobs)

A **Job** is a DAG of **tasks** (notebook / script / SQL / dbt), with:

- dependencies between tasks (\`depends_on\`) — run silver after bronze;
- a schedule or file-arrival trigger;
- retries, timeouts, alerts;
- an ephemeral **job cluster** (remember lesson 1).

It's a real orchestrator for on-platform work — teams with everything in
Databricks often need nothing else; teams orchestrating *across* platforms put
Airflow (next module) on top, triggering Databricks jobs as tasks.

## Delta Live Tables (DLT)

A **declarative** pipeline framework: you write *what each table is*, DLT infers
the DAG, manages incremental processing, and enforces quality:

\`\`\`python
import dlt

@dlt.table
def silver_orders():
    return dlt.read_stream("bronze_orders").where("amount > 0")

@dlt.expect_or_drop("valid_qty", "qty > 0")     # data quality as code!
@dlt.table
def gold_daily():
    return dlt.read("silver_orders").groupBy("order_date").agg(...)
\`\`\`

Note the shape: tables defined as pure transformations of upstream tables, DAG
inferred from references — **the same model as dbt** (next after orchestration),
in Python. The \`expect_*\` decorators foreshadow the Data Quality module.`,
        },
        {
          kind: "quiz",
          question: "In DLT you never write 'run bronze, THEN silver, THEN gold'. How does it know the order?",
          options: [
            {
              text: "Each table declares what it reads (dlt.read / read_stream of other tables) — the dependency DAG is inferred from those references",
              correct: true,
            },
            { text: "Tables run in the order they appear in the file" },
            { text: "You number the tables with a priority option" },
            { text: "All tables run in parallel and retry until inputs exist" },
          ],
          explanation:
            "Declarative dependencies: say what depends on what (by referencing it), let the engine derive execution order. Hold that thought — dbt's ref() works exactly the same way, and it's why both tools can also build lineage for free.",
        },
        {
          kind: "quiz",
          question: "When does Airflow-on-top-of-Databricks beat Workflows alone?",
          options: [
            {
              text: "When the pipeline spans systems Databricks doesn't own — e.g. wait for an SFTP drop, run a Databricks job, then trigger a vendor API and a dbt Cloud run",
              correct: true,
            },
            { text: "Whenever a job has more than 10 tasks" },
            { text: "Always — Workflows can't do dependencies" },
            { text: "Only when Spark is not involved" },
          ],
          explanation:
            "Rule of thumb: orchestrate WHERE the work is if it's all one platform; bring a cross-platform orchestrator when the DAG crosses system boundaries. Running both (Airflow triggering Jobs) is a normal, boring, good architecture.",
        },
      ],
    },
    {
      id: "dbsql-photon",
      title: "Databricks SQL & Photon",
      summary: "SQL warehouses for BI — and the ANSI SQL you already write.",
      minutes: 11,
      blocks: [
        {
          kind: "prose",
          markdown: `# Databricks SQL (DBSQL)

**SQL warehouses** are compute endpoints purpose-built for SQL: dashboards, BI
tools (Tableau/Power BI/Looker via JDBC), and analysts — with **Photon**
(vectorized C++ execution) and aggressive caching. Serverless warehouses start
in seconds and bill per use.

This completes the lakehouse pitch: the SAME Delta tables serve Spark pipelines
*and* BI dashboards — no copy into a separate warehouse product.

## The SQL is the SQL

Databricks SQL is ANSI-compliant: your joins, CTEs, and window functions run
unchanged. The additions worth knowing:

- \`QUALIFY\` — filter on a window function without a subquery:

\`\`\`sql
SELECT user_id, order_id, total
FROM orders
QUALIFY ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY total DESC) = 1
\`\`\`

  (Postgres lacks QUALIFY — you write the CTE + \`WHERE rn = 1\` you practiced.)
- Delta extras inline: \`VERSION AS OF\`, \`OPTIMIZE\`, \`DESCRIBE HISTORY\`.

The window-function drills from the PostgreSQL and Spark modules are exactly
what DBSQL interviews and dashboards demand — practice one more, portable-style.`,
        },
        {
          kind: "sql-runnable",
          title: "Portable analytics SQL (valid in Postgres & DBSQL)",
          seedId: "warehouse",
          sql: `-- Month-over-month revenue with a window — runs verbatim on Databricks SQL.
WITH monthly AS (
  SELECT d.year, d.month, SUM(f.amount) AS revenue
  FROM fact_sales f
  JOIN dim_date d USING (date_key)
  GROUP BY d.year, d.month
)
SELECT year, month, revenue,
       revenue - LAG(revenue) OVER (ORDER BY year, month) AS mom_change
FROM monthly
ORDER BY year, month;`,
        },
        {
          kind: "sql-challenge",
          title: "Top product per category",
          seedId: "warehouse",
          prompt:
            "A classic DBSQL interview drill (write it Postgres-style with a CTE, since QUALIFY isn't available here): for each product `category`, return the `name` and `revenue` (`SUM(amount)`) of its **highest-revenue product**. Order by `category`.",
          starterSql:
            "WITH per_product AS (\n  SELECT p.category, p.name, SUM(f.amount) AS revenue\n  FROM fact_sales f\n  JOIN dim_product p USING (product_key)\n  GROUP BY p.category, p.name\n)\nSELECT category, name, revenue FROM per_product ORDER BY category;",
          solution:
            "WITH per_product AS (SELECT p.category, p.name, SUM(f.amount) AS revenue FROM fact_sales f JOIN dim_product p USING (product_key) GROUP BY p.category, p.name), ranked AS (SELECT *, ROW_NUMBER() OVER (PARTITION BY category ORDER BY revenue DESC) AS rn FROM per_product) SELECT category, name, revenue FROM ranked WHERE rn = 1 ORDER BY category;",
          ordered: true,
          hints: [
            "Aggregate per (category, name) first, then rank within category.",
            "ROW_NUMBER() OVER (PARTITION BY category ORDER BY revenue DESC), keep rn = 1.",
          ],
          xp: 80,
        },
        {
          kind: "quiz",
          question: "What makes 'BI directly on the lakehouse' viable, when lakes were historically too slow for dashboards?",
          options: [
            {
              text: "Delta's file statistics + OPTIMIZE/clustering + Photon's vectorized execution + warehouse-side caching close the performance gap on the same open files",
              correct: true,
            },
            { text: "Dashboards secretly query a hidden copy in a proprietary store" },
            { text: "BI tools cache everything so the engine doesn't matter" },
            { text: "It isn't viable — a separate warehouse copy is still mandatory" },
          ],
          explanation:
            "Each layer attacks the old lake weakness: table formats add statistics and layout control, Photon adds a warehouse-class engine, caching absorbs repeated BI traffic. One copy of data, both workloads — that's the economic argument for the lakehouse.",
        },
      ],
    },
    {
      id: "cert-prep",
      title: "Rapid-Fire Review (Cert Prep)",
      summary: "Exam-style questions across the whole Databricks + Spark surface.",
      minutes: 12,
      blocks: [
        {
          kind: "prose",
          markdown: `# Rapid-fire review

These mirror the style of the **Databricks Certified Data Engineer Associate**
exam (and its Spark questions). Answer from what you've built across the last
two modules — every question here maps to a lesson you've done.`,
        },
        {
          kind: "quiz",
          question: "Which statement about Delta Lake tables is TRUE?",
          options: [
            {
              text: "The table is Parquet data files plus a transaction log; readers replay the log to find the current file set",
              correct: true,
            },
            { text: "Delta stores data in a proprietary row format" },
            { text: "Updates rewrite the transaction log but never the data files" },
            { text: "Time travel works forever regardless of VACUUM" },
          ],
          explanation:
            "Files + log = table. Updates rewrite affected data files and append a commit; VACUUM bounds how far back replays can go.",
        },
        {
          kind: "quiz",
          question: "A MERGE runs twice due to a retry. The target table ends up correct anyway. Which property made that safe?",
          options: [
            { text: "Idempotency — MERGE by key converges to the same state on re-run", correct: true },
            { text: "Isolation — the second run waited for the first" },
            { text: "Schema evolution" },
            { text: "Checkpointing" },
          ],
          explanation:
            "Matched keys update to the same values; unmatched keys were inserted the first time and simply match the second. Idempotent writes are what make retries (and orchestrator re-runs) boring.",
        },
        {
          kind: "quiz",
          question: "`df.filter(...).groupBy('k').agg(...).orderBy('total')` — how many shuffles?",
          options: [
            { text: "Two: one for the groupBy (hash by k), one for the global sort", correct: true },
            { text: "One: filter and groupBy share a shuffle" },
            { text: "Three: every method shuffles" },
            { text: "Zero: it's all lazy" },
          ],
          explanation:
            "filter is narrow; groupBy shuffles by key; a global orderBy range-shuffles again. (Lazy just means the shuffles happen at the action — they still happen.)",
        },
        {
          kind: "quiz",
          question: "Auto Loader's core guarantee for bronze ingestion is…",
          options: [
            { text: "each source file is processed exactly once, tracked via checkpointed state", correct: true },
            { text: "files are converted to Delta before landing" },
            { text: "schema can never change" },
            { text: "data arrives in event-time order" },
          ],
          explanation:
            "File-level exactly-once via checkpoints (with schema evolution handled via schemaLocation/_rescued_data). Ordering is NOT guaranteed — that's an event-time concern for the streaming module.",
        },
        {
          kind: "quiz",
          question: "In Unity Catalog, `analysts` need to query `prod.gold.revenue`. Which grants are required?",
          options: [
            {
              text: "USE CATALOG on prod, USE SCHEMA on prod.gold, and SELECT on the table (or schema-wide)",
              correct: true,
            },
            { text: "Only SELECT on the table" },
            { text: "ALL PRIVILEGES on the metastore" },
            { text: "Cluster-creation rights" },
          ],
          explanation:
            "Hierarchical access: you need passage through each level (catalog → schema) plus the object privilege — the same layered model as Postgres's USAGE-on-schema + SELECT-on-table.",
        },
        {
          kind: "flashcards",
          title: "Databricks & Delta — exam vocabulary",
          cards: [
            { front: "Delta Lake table =", back: "Parquet data files + a transaction log (_delta_log). Readers replay the log to find the current file set. ACID, time travel, and MERGE all come from the log." },
            { front: "OPTIMIZE vs VACUUM", back: "OPTIMIZE compacts small files into big ones (+ ZORDER/clustering for layout). VACUUM physically deletes unreferenced files past the retention window — which bounds time travel." },
            { front: "All-purpose cluster vs job cluster", back: "All-purpose: interactive, shared, for humans developing. Job cluster: ephemeral, spun up per scheduled run — cheaper and reproducible. Production jobs use job clusters." },
            { front: "Unity Catalog namespace", back: "Three levels: catalog.schema.table (e.g. prod.gold.revenue). Access requires passage through each level plus the object privilege." },
            { front: "Auto Loader's guarantee", back: "Each source file ingested exactly once, tracked via checkpointed state; schema inference/evolution with _rescued_data for unparseable values." },
            { front: "Photon", back: "Databricks' C++ vectorized execution engine — transparently accelerates SQL/DataFrame workloads (no code changes)." },
            { front: "DLT (Delta Live Tables)", back: "Declarative pipelines: each table is a transformation of upstream tables; the DAG is inferred from references; expectations enforce data quality inline." },
          ],
        },
        {
          kind: "quiz",
          question: "One task in a 400-task stage runs 50× longer than the rest. The FIRST thing to check is…",
          options: [
            { text: "key distribution — a hot key creating a skewed partition (then: AQE skew handling / salting)", correct: true },
            { text: "the driver's memory settings" },
            { text: "whether the cluster needs more nodes" },
            { text: "the notebook's cell ordering" },
          ],
          explanation:
            "A single straggler = a single oversized partition = skew, almost always. More nodes won't help — the one task still owns the one fat partition.",
        },
      ],
    },
  ],
};
