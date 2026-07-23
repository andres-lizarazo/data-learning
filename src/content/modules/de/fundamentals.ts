import type { Module } from "../../../types/lesson";

// Entry point of the Data Engineering track: the vocabulary and mental models
// everything else builds on. Concepts stay hands-on — OLTP vs OLAP runs real
// EXPLAIN plans in PGlite, and the columnar-format lesson simulates row vs column
// layouts in Python.
export const dataFundamentals: Module = {
  id: "data-fundamentals",
  title: "Data Fundamentals",
  blurb: "The data landscape: roles, OLTP vs OLAP, file formats, batch vs streaming.",
  track: "Data Engineering",
  level: "Beginner",
  icon: "🧭",
  status: "deep",
  lessons: [
    {
      id: "data-landscape",
      title: "The Data Landscape & Roles",
      summary: "Who does what in a data team, and the map of the modern data stack.",
      minutes: 10,
      blocks: [
        {
          kind: "prose",
          markdown: `# The data landscape

Data flows through a company in stages, and each stage has an owner:

\`\`\`
sources        ingest         store            transform        serve
(apps, APIs,   (batch jobs,   (warehouse /     (SQL models,     (BI dashboards,
 databases) →   streaming) →   lake /       →   Spark, dbt)  →   ML features,
                               lakehouse)                        reverse ETL)
\`\`\`

## The roles

| Role | Owns | Typical tools |
|---|---|---|
| **Data Engineer** | ingest + store + pipelines that move/clean data | Python, SQL, Spark, Airflow, Kafka |
| **Analytics Engineer** | transform: modeling raw data into clean, tested tables | SQL, dbt, warehouse |
| **Data Analyst** | serve: metrics, dashboards, answering business questions | SQL, BI tools |
| **Data Scientist** | models & experiments on top of the served data | Python, ML libraries |

The lines blur — a **Data/Analytics Engineer** (this curriculum's target) sits across
the middle: solid SQL + Python, dimensional modeling, pipeline orchestration, and
enough platform knowledge (warehouse/lakehouse, Spark/Databricks) to design the flow
end to end.

## Why the order of this track matters

Modeling (how to structure data) comes before warehouses (where it lives), which
comes before Spark/dbt/orchestration (how it's built and kept fresh), and quality/
streaming close the loop. Each module leans on the previous one.`,
        },
        {
          kind: "quiz",
          question:
            "A team needs raw application events turned into clean, tested, documented tables the BI team can trust. Whose core job is that?",
          options: [
            { text: "Analytics Engineer", correct: true },
            { text: "Data Scientist" },
            { text: "Database Administrator" },
            { text: "BI Analyst" },
          ],
          explanation:
            "That transform layer — modeling raw data into reliable tables (usually SQL + dbt in a warehouse) — is the Analytics Engineer's core job. Data Engineers focus on getting the raw data there reliably.",
        },
        {
          kind: "quiz",
          question: "In the ingest → store → transform → serve flow, where does a BI dashboard sit?",
          options: [
            { text: "Serve — it consumes the modeled data", correct: true },
            { text: "Transform — it reshapes the data" },
            { text: "Store — it holds the data it shows" },
            { text: "Ingest — it pulls data from sources" },
          ],
          explanation:
            "Dashboards are consumers at the serve layer. If a dashboard is doing heavy reshaping itself, that logic usually belongs upstream in the transform layer.",
        },
      ],
    },
    {
      id: "oltp-vs-olap",
      title: "OLTP vs OLAP",
      summary: "Row stores for transactions, column thinking for analytics — with real query plans.",
      minutes: 13,
      blocks: [
        {
          kind: "prose",
          markdown: `# OLTP vs OLAP

Two fundamentally different workloads:

| | **OLTP** (transactions) | **OLAP** (analytics) |
|---|---|---|
| Question | "fetch/update THIS order" | "average order value by month" |
| Touches | a few rows, all columns | millions of rows, few columns |
| Pattern | point lookups by key, writes | big scans + aggregates, reads |
| Optimized by | indexes, normalized schema | columnar storage, star schemas, partitioning |
| Systems | Postgres, MySQL | Snowflake, BigQuery, Redshift, Databricks SQL |

Postgres is an OLTP row store, but it's perfect for *seeing* the difference: an
index makes a point lookup jump straight to one row, while an aggregate must scan
everything regardless.`,
        },
        {
          kind: "sql-runnable",
          title: "Build a bigger table so the planner has something to choose about",
          sql: `-- 20,000 orders — enough that index vs scan actually matters.
DROP TABLE IF EXISTS big_orders;
CREATE TABLE big_orders AS
SELECT g                        AS id,
       1 + (g * 7) % 500        AS customer_id,
       (g % 3 = 0)              AS returned,
       round((50 + (g * 13) % 950)::numeric, 2) AS total,
       DATE '2025-01-01' + (g % 365) AS created_at
FROM generate_series(1, 20000) g;

CREATE INDEX idx_big_orders_id ON big_orders(id);
ANALYZE big_orders;

SELECT COUNT(*) FROM big_orders;`,
        },
        {
          kind: "sql-runnable",
          title: "OLTP: a point lookup uses the index",
          sql: `EXPLAIN SELECT * FROM big_orders WHERE id = 12345;`,
        },
        {
          kind: "sql-runnable",
          title: "OLAP: an aggregate must scan every row",
          sql: `EXPLAIN SELECT customer_id, SUM(total)
FROM big_orders
GROUP BY customer_id;`,
        },
        {
          kind: "prose",
          markdown: `Read the two plans: the lookup shows an **Index Scan** (jump to one row via the
B-tree), the aggregate a **Seq Scan** (read all 20,000 rows — no index helps, because
every row participates).

Columnar engines attack the second case from a different angle: they store each
**column** contiguously, so \`SUM(total)\` reads *only* the \`total\` column — often
50× less I/O on wide tables — and compresses it far better. That's the single most
important idea behind every analytics warehouse.`,
        },
        {
          kind: "sql-challenge",
          title: "Think like OLAP",
          seedId: "ecommerce",
          prompt:
            "An OLAP-style question against the shop DB: return each order `status` with the number of orders (`orders`) and total revenue (`revenue`, `SUM(total)`), ordered by `revenue` descending.",
          starterSql: "SELECT status\nFROM orders\nGROUP BY status;",
          solution:
            "SELECT status, COUNT(*) AS orders, SUM(total) AS revenue FROM orders GROUP BY status ORDER BY revenue DESC;",
          ordered: true,
          hints: [
            "COUNT(*) and SUM(total), grouped by status.",
            "Order by the revenue alias descending.",
          ],
          xp: 50,
        },
        {
          kind: "quiz",
          question:
            "Why does a columnar store make `SELECT AVG(price) FROM products_with_200_columns` dramatically cheaper than a row store?",
          options: [
            { text: "It reads only the `price` column's data instead of every full row", correct: true },
            { text: "It caches the answer from a previous run" },
            { text: "Columnar stores keep all data in RAM" },
            { text: "It skips NULL values automatically" },
          ],
          explanation:
            "In a row store every page holds whole rows, so a 1-column aggregate still drags all 200 columns off disk. Columnar layout stores each column contiguously — the query touches ~1/200th of the data, and similar values compress much better too.",
        },
      ],
    },
    {
      id: "file-formats",
      title: "File Formats: CSV, JSON, Parquet & Avro",
      summary: "Row vs columnar layouts, and why Parquet won analytics.",
      minutes: 13,
      blocks: [
        {
          kind: "prose",
          markdown: `# File formats

What you write to the lake determines how fast everything downstream runs.

| Format | Layout | Schema | Best for |
|---|---|---|---|
| **CSV** | row, text | none (guess & pray) | interchange with humans/legacy |
| **JSON** | row, text | self-describing, per record | APIs, nested/evolving events |
| **Avro** | row, binary | schema in file, evolution rules | streaming (Kafka), record-at-a-time |
| **Parquet** | **columnar**, binary | schema in file + rich stats | analytics — the lake standard |

## Why Parquet dominates analytics

- **Columnar**: a query reading 3 of 200 columns does ~1.5% of the I/O.
- **Row groups + statistics**: each chunk stores min/max per column, so engines
  *skip* whole chunks that can't match a filter (predicate pushdown).
- **Compression**: similar values stored together compress far better than mixed rows.

Rule of thumb: **row formats for writing/streaming** (append one record fast),
**columnar for reading/analytics** (scan a few columns of many records fast).`,
        },
        {
          kind: "runnable",
          title: "Simulate row vs columnar layout",
          code: `import time

N = 200_000
# Row layout: list of records (like CSV/JSON lines)
rows = [{"id": i, "price": i % 100, "qty": i % 7, "region": "r" + str(i % 5)} for i in range(N)]
# Columnar layout: one list per column (like Parquet)
cols = {
    "id": list(range(N)),
    "price": [i % 100 for i in range(N)],
    "qty": [i % 7 for i in range(N)],
    "region": ["r" + str(i % 5) for i in range(N)],
}

t = time.perf_counter()
total_row = sum(r["price"] for r in rows)          # visits every record dict
row_ms = (time.perf_counter() - t) * 1000

t = time.perf_counter()
total_col = sum(cols["price"])                     # touches ONE contiguous list
col_ms = (time.perf_counter() - t) * 1000

print(f"row layout:      sum(price) = {total_row}  in {row_ms:.1f} ms")
print(f"columnar layout: sum(price) = {total_col}  in {col_ms:.1f} ms")
print(f"columnar was ~{row_ms / col_ms:.0f}x faster here — same data, different layout")`,
        },
        {
          kind: "challenge",
          title: "Convert rows to columnar",
          prompt: `Write \`to_columnar(rows)\`: given a list of dicts that all share the same keys,
return a dict mapping each key to the **list of that key's values in row order**.
Return \`{}\` for an empty list.`,
          starterCode: `def to_columnar(rows):
    pass`,
          tests: [
            {
              name: "basic",
              assertion: `assert to_columnar([{"a": 1, "b": 2}, {"a": 3, "b": 4}]) == {"a": [1, 3], "b": [2, 4]}`,
            },
            {
              name: "single row",
              assertion: `assert to_columnar([{"x": "hi"}]) == {"x": ["hi"]}`,
            },
            {
              name: "empty",
              assertion: `assert to_columnar([]) == {}`,
              hidden: true,
            },
          ],
          hints: [
            "Take the keys from the first row, then build a list per key.",
            "A dict comprehension works: `{k: [r[k] for r in rows] for k in rows[0]}` — handle the empty case first.",
          ],
          solution: `def to_columnar(rows):
    if not rows:
        return {}
    return {k: [r[k] for r in rows] for k in rows[0]}`,
          xp: 60,
        },
        {
          kind: "quiz",
          question:
            "A Kafka pipeline appends one event at a time; a nightly report scans billions of events but only 4 columns. Which formats fit best?",
          options: [
            { text: "Avro for the stream, Parquet for the analytical copy", correct: true },
            { text: "Parquet for both" },
            { text: "CSV for the stream, JSON for analytics" },
            { text: "Avro for both" },
          ],
          explanation:
            "Row formats (Avro) append single records efficiently and carry schema-evolution rules — ideal in flight. Columnar (Parquet) is what you *land* for analytics. Pipelines commonly convert Avro → Parquet at rest.",
        },
      ],
    },
    {
      id: "batch-vs-streaming",
      title: "Batch, Micro-batch & Streaming",
      summary: "Latency vs complexity: when 'every night' beats 'right now'.",
      minutes: 9,
      blocks: [
        {
          kind: "prose",
          markdown: `# Batch vs streaming

The question is always: **how fresh does the data need to be, and what does that
freshness cost?**

| Mode | Latency | Example | Trade-off |
|---|---|---|---|
| **Batch** | minutes–hours | nightly warehouse load | simplest, cheapest, easy retries/backfills |
| **Micro-batch** | seconds–minutes | Spark Structured Streaming | near-real-time with batch-like semantics |
| **Streaming** | milliseconds–seconds | fraud detection on Kafka | most complex: ordering, late events, exactly-once |

Two rules experienced teams follow:

1. **Start with batch.** Most "we need real-time" requirements are actually
   "the dashboard should be fresh this hour."
2. **Latency is a product requirement, not a technology preference.** Pick the
   mode from the SLA, then the tool.

A common architecture is *both*: a streaming path for the few truly-real-time
consumers, plus batch into the warehouse for everything else (you'll meet the
lambda/kappa architectures in the Streaming module).`,
        },
        {
          kind: "quiz",
          question:
            "Finance needs yesterday's revenue every morning at 8am. Which processing mode fits — and why?",
          options: [
            { text: "Batch — the SLA is daily; anything fancier adds cost and failure modes", correct: true },
            { text: "Streaming — fresher is always better" },
            { text: "Micro-batch — a good compromise for every use case" },
            { text: "Batch and streaming together, to be safe" },
          ],
          explanation:
            "The requirement is a daily report. A nightly batch job is trivially retryable, backfillable, and cheap. Streaming infrastructure for a daily SLA is pure accidental complexity.",
        },
        {
          kind: "quiz",
          question: "Which problem exists in streaming but NOT in classic batch processing?",
          options: [
            { text: "Events arriving late or out of order relative to when they happened", correct: true },
            { text: "Schema changes in the source data" },
            { text: "Duplicate rows in the input" },
            { text: "Jobs failing and needing retries" },
          ],
          explanation:
            "A batch job sees a complete, closed set of data. A stream never ends, so 'is 09:59's data complete yet?' becomes a real question — that's event-time vs processing-time, watermarks, and windowing (Streaming module).",
        },
      ],
    },
    {
      id: "data-lifecycle",
      title: "The Data Lifecycle",
      summary: "Ingest → store → transform → serve — the map for the rest of the track.",
      minutes: 9,
      blocks: [
        {
          kind: "prose",
          markdown: `# The data lifecycle

Every pipeline in every company is some version of this:

\`\`\`
1. INGEST     pull/receive raw data          (APIs, CDC, files, streams)
2. STORE      land it cheaply, immutably     (lake / staging schema, raw & append-only)
3. TRANSFORM  clean, conform, model          (staging → core star schema → marts)
4. SERVE      expose for consumption         (BI, ML features, APIs, reverse ETL)
\`\`\`

Principles that show up at every stage:

- **Keep raw data raw.** Land it untouched (bronze/staging); transform *copies*.
  You can always rebuild downstream from raw — never the other way around.
- **Idempotency.** Re-running yesterday's load must not duplicate or corrupt data
  (you'll implement MERGE/upsert patterns for exactly this).
- **Lineage.** Every served number should be traceable back through the transforms
  to raw. Tools help, but naming layers consistently (staging → core → marts) is 90%.
- **Contracts at the edges.** Schemas are promises: validate on ingest (data quality
  module), document on serve.

## Where each module of this track fits

| Lifecycle stage | Modules |
|---|---|
| Ingest | Orchestration, Streaming |
| Store | Warehouse, Lakehouse & Lakes |
| Transform | Data Modeling, Spark, dbt |
| Serve (+ trust) | Data Quality |`,
        },
        {
          kind: "flashcards",
          title: "Data-landscape essentials",
          cards: [
            { front: "The four lifecycle stages", back: "Ingest (pull/receive raw) → Store (land cheaply & immutably) → Transform (clean, conform, model) → Serve (BI, ML, APIs)." },
            { front: "Keep raw data raw", back: "Land data untouched and append-only; transform COPIES. Downstream layers stay rebuildable from raw — never the reverse." },
            { front: "Idempotency", back: "Running a load twice = running it once. Achieved with MERGE/upsert by key or delete-then-insert-partition. Makes retries and backfills safe." },
            { front: "OLTP vs OLAP in one line", back: "OLTP: many small keyed reads/writes (apps, row stores, indexes). OLAP: big scans + aggregates over few columns (analytics, columnar storage)." },
            { front: "Why Parquet for analytics", back: "Columnar layout (read only needed columns), row-group min/max statistics (skip chunks), great compression. Row formats (Avro/JSON) stay better for writing streams." },
            { front: "Data Engineer vs Analytics Engineer", back: "DE: ingest/store/pipelines that move data reliably (Python, Spark, Airflow, Kafka). AE: the transform layer — modeling raw into tested, documented tables (SQL, dbt)." },
          ],
        },
        {
          kind: "quiz",
          question:
            "A transform bug corrupted a mart table. Thanks to the 'keep raw data raw' principle, the fix is to…",
          options: [
            { text: "fix the transform and rebuild the mart from the untouched raw layer", correct: true },
            { text: "restore last week's database backup and lose a week of data" },
            { text: "hand-edit the corrupted rows in the mart" },
            { text: "ask the source system to resend everything" },
          ],
          explanation:
            "Because raw landed immutably, downstream layers are disposable and rebuildable. This is why every serious architecture (medallion included) makes the first layer append-only and untransformed.",
        },
        {
          kind: "quiz",
          question: "'Running the same load twice produces the same result as running it once' is the definition of…",
          options: [
            { text: "Idempotency", correct: true },
            { text: "Atomicity" },
            { text: "Lineage" },
            { text: "Normalization" },
          ],
          explanation:
            "Idempotency is THE property that makes pipelines operable: retries after failures and re-runs during backfills become safe. MERGE/upsert-by-key and delete-then-insert-partition are the standard idempotent write patterns.",
        },
      ],
    },
    {
      id: "sql-from-python",
      title: "SQL from Python & API Ingestion",
      summary: "Run real SQL from Python with SQLAlchemy, and load an API's JSON into a table.",
      minutes: 13,
      blocks: [
        {
          kind: "prose",
          markdown: `# Connecting Python to a database

You've learned Python and SQL separately. In a pipeline they meet: Python **drives**
the database — creating tables, loading data, and running queries — while SQL does the
set-based work. The standard tool is **SQLAlchemy**, whose *Core* layer is a thin,
portable wrapper over raw SQL.

> **Browser note:** real pipelines connect to a server with a driver like \`psycopg\`
> (Postgres) and pull from APIs with \`requests\`. Those need network sockets, which this
> in-browser Python (Pyodide) doesn't have. So here we run the *identical* SQLAlchemy code
> against an **in-memory SQLite** database — the API and driver differ, the pattern is the same.

## Parametrized queries — never format SQL by hand

\`\`\`python
# ✅ pass values as parameters — the driver escapes them
conn.execute(text("INSERT INTO product (name, price) VALUES (:n, :p)"), {"n": name, "p": price})

# ❌ never build SQL with f-strings — this is how SQL injection happens
conn.execute(text(f"INSERT INTO product VALUES ('{name}', {price})"))
\`\`\`

Parameters (\`:name\`) also let the database **reuse the query plan** and pass a *list* of
dicts for a fast bulk insert.`,
        },
        {
          kind: "runnable",
          title: "Create, insert, query — with SQLAlchemy Core",
          packages: ["sqlalchemy"],
          code: `from sqlalchemy import create_engine, text

engine = create_engine("sqlite:///:memory:")   # a real DB, just in-memory

with engine.begin() as conn:                    # begin() = transaction, auto-commit on exit
    conn.execute(text("CREATE TABLE product (id INTEGER PRIMARY KEY, name TEXT, price REAL)"))
    conn.execute(
        text("INSERT INTO product (name, price) VALUES (:n, :p)"),
        [{"n": "pen", "p": 2.5}, {"n": "mug", "p": 8.0}, {"n": "lamp", "p": 20.0}],
    )

with engine.connect() as conn:
    rows = conn.execute(
        text("SELECT name, price FROM product WHERE price >= :min ORDER BY price DESC"),
        {"min": 5},
    ).fetchall()

for name, price in rows:
    print(f"{name}: {price}")`,
        },
        {
          kind: "runnable",
          title: "Ingest an API payload into the table",
          packages: ["sqlalchemy"],
          code: `import json
from sqlalchemy import create_engine, text

# In a real job: resp = requests.get(url); records = resp.json()
# Here we stand in for the API response with a JSON string.
api_response = '[{"name": "desk", "price": 120.0}, {"name": "chair", "price": 45.0}]'
records = json.loads(api_response)   # list[dict] — parsed straight into rows

engine = create_engine("sqlite:///:memory:")
with engine.begin() as conn:
    conn.execute(text("CREATE TABLE product (name TEXT, price REAL)"))
    # one execute, a whole batch of rows — the bulk-load idiom
    conn.execute(text("INSERT INTO product (name, price) VALUES (:name, :price)"), records)

with engine.connect() as conn:
    total = conn.execute(text("SELECT SUM(price) FROM product")).scalar()
print("rows loaded:", len(records), "| total price:", total)`,
        },
        {
          kind: "challenge",
          title: "Load records and query them",
          packages: ["sqlalchemy"],
          prompt: `Write \`expensive(records, min_price)\`:

- \`records\` is a list of dicts \`{"name": str, "price": float}\`.
- Load them into an **in-memory SQLite** table using SQLAlchemy, then run a SQL query
  that returns the **names** of products whose \`price\` is **≥ \`min_price\`**, ordered by
  price **descending**.
- Return that list of names.

Use \`text(...)\` with a bound parameter for \`min_price\` — no f-strings in the SQL.`,
          starterCode: `from sqlalchemy import create_engine, text

def expensive(records, min_price):
    pass`,
          tests: [
            {
              name: "filters and orders",
              assertion: `rows = [{"name": "a", "price": 5.0}, {"name": "b", "price": 20.0}, {"name": "c", "price": 12.0}]
assert expensive(rows, 10) == ["b", "c"]`,
            },
            {
              name: "boundary is inclusive",
              assertion: `rows = [{"name": "x", "price": 10.0}, {"name": "y", "price": 9.99}]
assert expensive(rows, 10) == ["x"]`,
            },
            {
              name: "empty when nothing qualifies",
              assertion: `assert expensive([{"name": "z", "price": 1.0}], 100) == []`,
              hidden: true,
            },
          ],
          hints: [
            "Make the engine with `create_engine(\"sqlite:///:memory:\")`, then inside `engine.begin()` create the table and bulk-insert `records` (pass the list straight to one `execute`).",
            "Query with a bound parameter: `text(\"SELECT name FROM product WHERE price >= :min ORDER BY price DESC\")` and `{\"min\": min_price}`.",
            "`.fetchall()` returns rows; pull the first column of each with `[r[0] for r in rows]`.",
          ],
          solution: `from sqlalchemy import create_engine, text

def expensive(records, min_price):
    engine = create_engine("sqlite:///:memory:")
    with engine.begin() as conn:
        conn.execute(text("CREATE TABLE product (name TEXT, price REAL)"))
        conn.execute(text("INSERT INTO product (name, price) VALUES (:name, :price)"), records)
    with engine.connect() as conn:
        rows = conn.execute(
            text("SELECT name FROM product WHERE price >= :min ORDER BY price DESC"),
            {"min": min_price},
        ).fetchall()
    return [r[0] for r in rows]`,
          xp: 90,
        },
        {
          kind: "quiz",
          question: "Why pass values as `:params` instead of building the SQL string with an f-string?",
          options: [
            {
              text: "The driver escapes parameters safely — it prevents SQL injection and lets the DB reuse the query plan",
              correct: true,
            },
            { text: "f-strings don't work inside text()" },
            { text: "Parameters make the query run on more rows at once" },
            { text: "It's the only way to select multiple columns" },
          ],
          explanation:
            "String-formatting user input into SQL is the classic SQL-injection hole. Bound parameters are escaped by the driver and let the database cache the compiled plan across calls — safer AND faster.",
        },
      ],
    },
  ],
};
