import type { Module } from "../../types/lesson";

// Spark & PySpark. Spark itself needs a JVM and can't run in Pyodide, so this module
// mixes: concept lessons (architecture, shuffles, performance), *runnable* Python
// simulations (partitioning), pandas-graded "translate the PySpark" challenges (the
// DataFrame semantics ARE testable in pandas), and Spark SQL labs that run as ANSI
// SQL against PGlite with dialect callouts.
export const pyspark: Module = {
  id: "pyspark",
  title: "Spark & PySpark",
  blurb: "Distributed data processing: architecture, DataFrame API, Spark SQL, performance.",
  track: "Data Engineering",
  level: "Intermediate",
  icon: "⚡",
  status: "deep",
  lessons: [
    {
      id: "spark-model",
      title: "The Spark Model",
      summary: "Why distributed compute, RDDs vs DataFrames, lazy evaluation.",
      minutes: 12,
      blocks: [
        {
          kind: "prose",
          markdown: `# PySpark — the big picture

> ⚠️ **Why no live Spark runner here?** Spark runs on the **JVM** and distributes
> work across a cluster — it can't run inside the browser. This module teaches the
> model with quizzes, *runnable simulations*, pandas-graded translation exercises,
> and Spark SQL labs against the in-browser Postgres.

## Why Spark?
When data is too big for one machine's memory, Spark splits it across many workers
and runs computations in **parallel**.

## Core ideas
- **SparkSession** — your entry point.
- **DataFrame** — a distributed table (like pandas, but partitioned across nodes).
- **Transformations** (\`select\`, \`filter\`, \`groupBy\`) are **lazy** — they build a
  plan but don't execute.
- **Actions** (\`show\`, \`count\`, \`collect\`) **trigger** the computation.
- **Lazy evaluation** lets Spark optimize the whole plan (Catalyst optimizer) —
  you met this shape as the **Builder pattern** in the Design Patterns module.

\`\`\`python
from pyspark.sql import SparkSession
spark = SparkSession.builder.appName("demo").getOrCreate()

df = spark.read.csv("data.csv", header=True, inferSchema=True)
df.filter(df.age > 30).groupBy("city").count().show()   # action triggers it
\`\`\``,
        },
        {
          kind: "quiz",
          question: "Which of these is an *action* that triggers execution in Spark?",
          options: [
            { text: "select()" },
            { text: "filter()" },
            { text: "count()", correct: true },
            { text: "withColumn()" },
          ],
          explanation:
            "select/filter/withColumn are lazy transformations; count() is an action.",
        },
        {
          kind: "quiz",
          question:
            "A job chains 12 transformations then one `.write.parquet(...)`. When does Spark actually read the input data?",
          options: [
            { text: "At the write — the single action executes the whole optimized plan", correct: true },
            { text: "At the first transformation" },
            { text: "Incrementally, one transformation at a time" },
            { text: "When the SparkSession is created" },
          ],
          explanation:
            "Transformations only assemble the logical plan. The action lets Catalyst optimize it end-to-end first (pushdown, pruning, join reordering) — the whole point of being lazy.",
        },
      ],
    },
    {
      id: "pandas-vs-spark",
      title: "pandas ↔ PySpark",
      summary: "Translate the operations you already know.",
      minutes: 10,
      blocks: [
        {
          kind: "prose",
          markdown: `# pandas ↔ PySpark cheat sheet

You already know pandas from the Pandas module — here's how the same ideas map to
PySpark's DataFrame API.

| Task | pandas | PySpark |
|---|---|---|
| Select columns | \`df[["a","b"]]\` | \`df.select("a","b")\` |
| Filter rows | \`df[df.a > 5]\` | \`df.filter(df.a > 5)\` |
| New column | \`df["c"] = df.a + 1\` | \`df.withColumn("c", df.a + 1)\` |
| Group + agg | \`df.groupby("k").a.mean()\` | \`df.groupBy("k").avg("a")\` |
| Rename | \`df.rename(columns=...)\` | \`df.withColumnRenamed("a","b")\` |
| Sort | \`df.sort_values("a")\` | \`df.orderBy("a")\` |
| Row count | \`len(df)\` | \`df.count()\` |
| Peek | \`df.head()\` | \`df.show(5)\` |
| To memory | — | \`df.collect()\` / \`df.toPandas()\` |

### Mental model
- pandas = **one machine, eager**.
- PySpark = **many machines, lazy** (plan, then execute on an action).
- \`df.toPandas()\` pulls the *whole* distributed frame into one machine's memory —
  only do it on small results.`,
        },
        {
          kind: "prose",
          markdown: `### A typical PySpark job (reference)

\`\`\`python
from pyspark.sql import SparkSession, functions as F

spark = SparkSession.builder.appName("sales").getOrCreate()

sales = (spark.read
         .parquet("s3://bucket/sales/")
         .filter(F.col("amount") > 0)
         .withColumn("month", F.month("ts")))

monthly = (sales.groupBy("region", "month")
                .agg(F.sum("amount").alias("revenue"),
                     F.countDistinct("user_id").alias("buyers"))
                .orderBy("region", "month"))

monthly.show()          # action → Spark executes the optimized plan
monthly.write.parquet("s3://bucket/out/monthly/")
\`\`\`

When you're ready to run this for real, install \`pyspark\` locally (needs Java 11+)
or use a managed platform like Databricks (next module).`,
        },
      ],
    },
    {
      id: "spark-architecture",
      title: "Architecture: Driver, Executors & Partitions",
      summary: "Who plans, who works, and how data is split — simulate it in Python.",
      minutes: 13,
      blocks: [
        {
          kind: "prose",
          markdown: `# The moving parts

\`\`\`
        DRIVER  (your Python program: builds the plan, schedules tasks)
           │
   ┌───────┼───────┐
EXECUTOR EXECUTOR EXECUTOR      (JVM workers on cluster nodes)
 [p0][p1] [p2][p3] [p4][p5]     (each holds PARTITIONS of the data)
\`\`\`

- **Driver** — runs your code, turns it into a plan, splits the plan into
  **tasks**, and hands tasks to executors. Small brain, no big data.
- **Executors** — do the actual work, each on its share of the data, in parallel.
- **Partition** — the unit of parallelism: one chunk of rows, processed by one
  task on one core. A 10-billion-row DataFrame might be 2,000 partitions.

Key mental shift from pandas: **your DataFrame is not in one place.** Every
operation must be phrased so that each partition can be processed independently —
and operations that *can't* (groupBy across partitions, joins) require moving
rows between executors: the **shuffle** (next lesson).

How do rows land in partitions? For keyed operations: **hash partitioning** —
\`partition = hash(key) % num_partitions\` — so all rows with the same key land in
the same partition. Let's simulate exactly that.`,
        },
        {
          kind: "runnable",
          title: "Simulate hash partitioning across executors",
          code: `NUM_PARTITIONS = 4

rows = [
    {"user": "ana", "amount": 120}, {"user": "bob", "amount": 80},
    {"user": "ana", "amount": 45},  {"user": "carla", "amount": 200},
    {"user": "bob", "amount": 10},  {"user": "dan", "amount": 65},
    {"user": "ana", "amount": 30},  {"user": "carla", "amount": 15},
]

# The exact idea Spark uses for keyed operations:
def partition_for(key):
    return hash(key) % NUM_PARTITIONS

partitions = [[] for _ in range(NUM_PARTITIONS)]
for row in rows:
    partitions[partition_for(row["user"])].append(row)

for i, part in enumerate(partitions):
    users = sorted({r["user"] for r in part})
    print(f"partition {i}: {len(part)} rows, users={users}")

# Because ALL of each user's rows share a partition, a per-user aggregation can
# now run on every partition independently — perfectly parallel:
print()
for i, part in enumerate(partitions):
    totals = {}
    for r in part:
        totals[r["user"]] = totals.get(r["user"], 0) + r["amount"]
    if totals:
        print(f"partition {i} aggregates locally: {totals}")`,
        },
        {
          kind: "quiz",
          question: "Your PySpark job calls `df.toPandas()` on a 500 GB DataFrame and the job dies. What happened?",
          options: [
            {
              text: "toPandas() collects every partition from all executors into the driver's memory — the driver (not built for data) blew up",
              correct: true,
            },
            { text: "pandas can't read Spark's file format" },
            { text: "The executors ran out of disk" },
            { text: "toPandas() is a transformation and never runs" },
          ],
          explanation:
            "The driver is a coordinator, not a data node. collect()/toPandas() funnel the whole distributed dataset into it. Rule: aggregate/filter down FIRST; only collect small results.",
        },
        {
          kind: "quiz",
          question: "A stage runs 200 tasks on a cluster with 50 executor cores. How does that play out?",
          options: [
            {
              text: "50 tasks run in parallel; as each core finishes a partition it picks up the next — 4 waves total",
              correct: true,
            },
            { text: "It fails: tasks must equal cores" },
            { text: "Spark merges partitions down to 50 first" },
            { text: "150 tasks are skipped" },
          ],
          explanation:
            "Tasks queue onto available cores (one task = one partition = one core at a time). That's also why partition COUNT matters: 4 giant partitions would leave 46 cores idle — and one skewed partition makes the whole stage wait (the skew lesson ahead).",
        },
      ],
    },
    {
      id: "dataframe-api",
      title: "DataFrame API Deep Dive",
      summary: "select, withColumn, when, agg — and prove you can translate them to pandas.",
      minutes: 14,
      blocks: [
        {
          kind: "prose",
          markdown: `# The DataFrame API, for real work

The patterns you'll write daily (\`F\` is \`pyspark.sql.functions\`):

\`\`\`python
from pyspark.sql import functions as F

result = (orders
    .filter(F.col("amount") > 0)                       # keep valid rows
    .withColumn("tier",                                # conditional column
        F.when(F.col("amount") > 100, "big")
         .otherwise("small"))
    .groupBy("region", "tier")
    .agg(
        F.sum("amount").alias("revenue"),
        F.count("*").alias("orders"),
        F.countDistinct("user_id").alias("buyers"),
    )
    .orderBy("region", "tier"))
\`\`\`

Semantics to internalize (they differ from pandas in feel, not meaning):

- **Immutable**: every method returns a NEW DataFrame; nothing mutates in place.
- \`F.when(...).otherwise(...)\` ≈ SQL \`CASE WHEN\` ≈ \`np.where\` in pandas.
- \`agg\` takes *named* aggregations via \`.alias()\` — the result's columns are
  exactly what you alias.

Because the semantics match, you can *prove* you understand a PySpark chain by
reproducing it in pandas — which runs right here. That's your challenge.`,
        },
        {
          kind: "runnable",
          title: "The same chain, in pandas (runs here!)",
          packages: ["pandas"],
          code: `import pandas as pd
import numpy as np

orders = pd.DataFrame({
    "region": ["us", "us", "eu", "eu", "us", "eu"],
    "user_id": [1, 2, 3, 3, 1, 4],
    "amount":  [150, -5, 200, 40, 60, 310],
})

# PySpark:  orders.filter(F.col("amount") > 0)
#                 .withColumn("tier", F.when(F.col("amount") > 100, "big").otherwise("small"))
#                 .groupBy("region", "tier").agg(F.sum("amount").alias("revenue"))
valid = orders[orders["amount"] > 0].copy()
valid["tier"] = np.where(valid["amount"] > 100, "big", "small")
result = (valid.groupby(["region", "tier"], as_index=False)
               .agg(revenue=("amount", "sum"))
               .sort_values(["region", "tier"], ignore_index=True))
print(result)`,
        },
        {
          kind: "challenge",
          title: "Translate the PySpark job",
          packages: ["pandas"],
          prompt: `Translate this PySpark chain into a pandas function \`summarize(df)\`:

\`\`\`python
(df.filter(F.col("amount") > 100)
   .groupBy("region")
   .agg(F.sum("amount").alias("revenue"))
   .orderBy("region"))
\`\`\`

\`summarize\` receives a pandas DataFrame with columns \`region\` and \`amount\`,
and must return a DataFrame with columns \`region\` and \`revenue\` (one row per
region present after the filter), sorted by \`region\`, with a fresh 0..n index.`,
          starterCode: `import pandas as pd

def summarize(df):
    pass`,
          tests: [
            {
              name: "filters, groups, sums",
              assertion: `import pandas as pd
df = pd.DataFrame({"region": ["us", "eu", "us", "eu"], "amount": [150, 200, 50, 120]})
out = summarize(df)
assert list(out.columns) == ["region", "revenue"]
assert out.to_dict("records") == [
    {"region": "eu", "revenue": 320},
    {"region": "us", "revenue": 150},
]`,
            },
            {
              name: "regions with nothing above 100 disappear",
              assertion: `import pandas as pd
df = pd.DataFrame({"region": ["us", "eu"], "amount": [99, 101]})
out = summarize(df)
assert out.to_dict("records") == [{"region": "eu", "revenue": 101}]`,
            },
            {
              name: "index is reset",
              assertion: `import pandas as pd
df = pd.DataFrame({"region": ["b", "a"], "amount": [500, 300]})
out = summarize(df)
assert list(out.index) == [0, 1]
assert out.iloc[0]["region"] == "a"`,
              hidden: true,
            },
          ],
          hints: [
            "Filter first: `df[df['amount'] > 100]`.",
            "`.groupby('region', as_index=False).agg(revenue=('amount', 'sum'))` names the output column.",
            "Finish with `.sort_values('region', ignore_index=True)`.",
          ],
          solution: `import pandas as pd

def summarize(df):
    filtered = df[df["amount"] > 100]
    return (filtered.groupby("region", as_index=False)
                    .agg(revenue=("amount", "sum"))
                    .sort_values("region", ignore_index=True))`,
          xp: 90,
        },
        {
          kind: "quiz",
          question: "In PySpark, `df.withColumn('x', ...)` returns a new DataFrame and `df` is unchanged. Why does Spark insist on immutability?",
          options: [
            {
              text: "Immutable frames make the lineage/plan a clean DAG — enabling optimization, task retries, and recomputation of lost partitions",
              correct: true,
            },
            { text: "The JVM cannot mutate objects" },
            { text: "To force users to write shorter programs" },
            { text: "Mutability would require locks on the driver" },
          ],
          explanation:
            "Every DataFrame is a *recipe* (plan) rather than a buffer. Lose an executor? Re-run the recipe for its partitions. Same philosophy as pure functions in the Architecture module — at cluster scale.",
        },
      ],
    },
    {
      id: "joins-shuffles",
      title: "Joins & Shuffles",
      summary: "The most expensive thing Spark does — and how broadcast joins avoid it.",
      minutes: 12,
      blocks: [
        {
          kind: "prose",
          markdown: `# The shuffle

A \`groupBy\` or join needs all rows with the same key **on the same executor**.
When they aren't (the usual case), Spark must repartition data across the network:
the **shuffle** — write files, send over network, read back. It's the expensive
boundary that splits a job into **stages**:

\`\`\`
stage 1: read + filter + map        (narrow: partition → partition, no movement)
   ══════ SHUFFLE (by join/group key) ══════
stage 2: join / aggregate            (wide: needs co-located keys)
\`\`\`

- **Narrow** transformations (\`filter\`, \`select\`, \`withColumn\`) — each output
  partition depends on ONE input partition. Free.
- **Wide** transformations (\`groupBy\`, \`join\`, \`distinct\`, \`orderBy\`) — need
  data movement. Each one is a shuffle.

## Join strategies

- **Sort-merge join** (default for big⋈big): shuffle BOTH sides by key, sort,
  merge. Two shuffles — expensive but scales.
- **Broadcast join** (big⋈small): ship the ENTIRE small table to every executor;
  the big side never moves. No shuffle at all!

\`\`\`python
from pyspark.sql import functions as F
big.join(F.broadcast(small_dim), "customer_key")   # hint it explicitly
\`\`\`

Spark auto-broadcasts tables under \`spark.sql.autoBroadcastJoinThreshold\`
(default 10 MB) — and AQE (performance lesson) can switch to broadcast at
runtime. Star-schema queries (big fact ⋈ small dims) are broadcast-join heaven —
your dimensional modeling pays off again.`,
        },
        {
          kind: "quiz",
          question: "A 2-billion-row fact table joins a 5 MB dim_product. Which join should happen, and what moves over the network?",
          options: [
            {
              text: "Broadcast join: the 5 MB dim is copied to every executor; the 2B-row fact stays exactly where it is",
              correct: true,
            },
            { text: "Sort-merge: both tables shuffle by product_key" },
            { text: "The fact table is broadcast, since it matters more" },
            { text: "No join is possible without co-partitioning first" },
          ],
          explanation:
            "Moving 5 MB × N executors is nothing; shuffling 2B rows is enormous. This asymmetry is why dimension tables are kept small and why star schemas run so well on Spark.",
        },
        {
          kind: "quiz",
          question: "Which sequence causes TWO separate shuffles?",
          options: [
            { text: "df.groupBy('a').count() followed by .orderBy('cnt')", correct: true },
            { text: "df.filter(...).select(...).withColumn(...)" },
            { text: "df.join(F.broadcast(small), 'k').filter(...)" },
            { text: "df.select('a').filter('a > 1').limit(10)" },
          ],
          explanation:
            "groupBy shuffles by 'a'; the global sort then shuffles again by range of the count. The other options are narrow-only or broadcast (shuffle-free). Counting shuffles in a plan = predicting its cost.",
        },
        {
          kind: "challenge",
          title: "Translate the broadcast join",
          packages: ["pandas"],
          prompt: `Translate this PySpark star-schema join into a pandas function \`enrich(facts, dims)\`:

\`\`\`python
(facts.join(F.broadcast(dims), "product_id", "inner")
      .groupBy("category")
      .agg(F.sum("amount").alias("revenue"))
      .orderBy("category"))
\`\`\`

\`facts\` has columns \`product_id\`, \`amount\`; \`dims\` has \`product_id\`, \`category\`.
Return a DataFrame with columns \`category\` and \`revenue\` (summed over the joined
rows), sorted by \`category\`, with a fresh 0..n index.`,
          starterCode: `import pandas as pd

def enrich(facts, dims):
    pass`,
          tests: [
            {
              name: "joins then aggregates",
              assertion: `import pandas as pd
facts = pd.DataFrame({"product_id": [1, 2, 1, 3], "amount": [10, 20, 5, 40]})
dims = pd.DataFrame({"product_id": [1, 2, 3], "category": ["a", "b", "a"]})
out = enrich(facts, dims)
assert list(out.columns) == ["category", "revenue"]
assert out.to_dict("records") == [
    {"category": "a", "revenue": 55},
    {"category": "b", "revenue": 20},
]`,
            },
            {
              name: "unmatched fact rows drop (inner join)",
              assertion: `import pandas as pd
facts = pd.DataFrame({"product_id": [1, 99], "amount": [10, 500]})
dims = pd.DataFrame({"product_id": [1], "category": ["a"]})
out = enrich(facts, dims)
assert out.to_dict("records") == [{"category": "a", "revenue": 10}]`,
            },
            {
              name: "index is reset",
              assertion: `import pandas as pd
facts = pd.DataFrame({"product_id": [2, 1], "amount": [7, 3]})
dims = pd.DataFrame({"product_id": [1, 2], "category": ["z", "a"]})
out = enrich(facts, dims)
assert list(out.index) == [0, 1] and out.iloc[0]["category"] == "a"`,
              hidden: true,
            },
          ],
          hints: [
            "A broadcast join is still just an inner join by key: `facts.merge(dims, on=\"product_id\", how=\"inner\")`.",
            "Then group the joined frame by `category` and sum `amount`, renaming the result to `revenue`.",
            "`.groupby(\"category\")[\"amount\"].sum().reset_index(name=\"revenue\").sort_values(\"category\")` — finish with `.reset_index(drop=True)`.",
          ],
          solution: `import pandas as pd

def enrich(facts, dims):
    joined = facts.merge(dims, on="product_id", how="inner")
    out = (
        joined.groupby("category")["amount"].sum().reset_index(name="revenue")
    )
    return out.sort_values("category").reset_index(drop=True)`,
          xp: 90,
        },
      ],
    },
    {
      id: "spark-sql",
      title: "Spark SQL",
      summary: "Same engine, SQL syntax — practice the ANSI patterns live.",
      minutes: 13,
      blocks: [
        {
          kind: "prose",
          markdown: `# Spark SQL

Any DataFrame can become a SQL table, and any SQL becomes a DataFrame — both
compile to the *same* Catalyst plan, so neither is "faster":

\`\`\`python
orders.createOrReplaceTempView("orders")
top = spark.sql("""
    SELECT region, SUM(amount) AS revenue
    FROM orders
    WHERE amount > 0
    GROUP BY region
    ORDER BY revenue DESC
""")
\`\`\`

Spark SQL is largely **ANSI SQL** — which is why you can practice it right here
against Postgres. The handful of dialect differences that matter:

| Postgres | Spark SQL |
|---|---|
| \`||\` (or \`CONCAT\`) | \`CONCAT(a, b)\` |
| \`NOW()\` / \`CURRENT_DATE\` | \`current_timestamp()\` / \`current_date()\` |
| \`EXTRACT(month FROM d)\` | \`month(d)\` (also has \`EXTRACT\`) |
| \`x::int\` | \`CAST(x AS INT)\` |
| \`DISTINCT ON (...)\` | not supported — use \`row_number()\` |
| \`generate_series\` | \`sequence()\` + \`explode()\` |

Everything below runs on the e-commerce seed and is valid in both dialects
(where it isn't, the comment says so).`,
        },
        {
          kind: "sql-runnable",
          title: "An ANSI query that runs identically on Spark",
          seedId: "ecommerce",
          sql: `-- Valid Postgres AND Spark SQL:
SELECT u.name,
       COUNT(o.id)                                    AS orders,
       COALESCE(SUM(o.total), 0)                      AS lifetime_value,
       CASE WHEN COALESCE(SUM(o.total), 0) > 1000
            THEN 'vip' ELSE 'standard' END            AS tier
FROM users u
LEFT JOIN orders o ON o.user_id = u.id AND o.status = 'paid'
GROUP BY u.name
ORDER BY lifetime_value DESC;`,
        },
        {
          kind: "sql-challenge",
          title: "Write it once, run it anywhere",
          seedId: "ecommerce",
          prompt:
            "In portable ANSI SQL (no Postgres-only syntax!): return each product `name` and `units` (total `qty` across order_items), including products never ordered as `0`. Order by `units` descending, then `name`.",
          starterSql:
            "SELECT p.name\nFROM products p\nLEFT JOIN order_items oi ON oi.product_id = p.id\nGROUP BY p.name;",
          solution:
            "SELECT p.name, COALESCE(SUM(oi.qty), 0) AS units FROM products p LEFT JOIN order_items oi ON oi.product_id = p.id GROUP BY p.name ORDER BY units DESC, p.name;",
          ordered: true,
          hints: [
            "LEFT JOIN keeps never-ordered products; COALESCE turns their NULL sum into 0.",
            "Both COALESCE and this whole shape are identical in Spark SQL.",
          ],
          xp: 70,
        },
        {
          kind: "quiz",
          question: "Your teammate insists the DataFrame API is faster than spark.sql() strings. Who's right?",
          options: [
            {
              text: "Neither — both compile to the same Catalyst logical plan and get identical optimization",
              correct: true,
            },
            { text: "The DataFrame API — it skips SQL parsing" },
            { text: "SQL — it's closer to the engine" },
            { text: "It depends on the number of executors" },
          ],
          explanation:
            "Pick by readability and team convention, not performance. Complex conditional logic often reads better as DataFrame code; set-based analytics often reads better as SQL. Mixing both in one job is normal.",
        },
      ],
    },
    {
      id: "spark-windows",
      title: "Window Functions in Spark",
      summary: "Window.partitionBy ↔ OVER (PARTITION BY …) — same concept, both syntaxes.",
      minutes: 13,
      blocks: [
        {
          kind: "prose",
          markdown: `# Windows, Spark-style

You mastered SQL window functions in the PostgreSQL track. Spark has the exact
same concept with two syntaxes:

**SQL** (identical to what you know):
\`\`\`sql
SELECT *, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
FROM orders
\`\`\`

**DataFrame API**:
\`\`\`python
from pyspark.sql import Window, functions as F

w = Window.partitionBy("user_id").orderBy(F.desc("created_at"))
orders.withColumn("rn", F.row_number().over(w)).filter("rn = 1")
\`\`\`

Same pieces, same meaning: \`partitionBy\` ↔ \`PARTITION BY\`, \`orderBy\` ↔
\`ORDER BY\`, \`rowsBetween\` ↔ \`ROWS BETWEEN\`. And yes — \`partitionBy\` here
means a shuffle by that key, so windows are *wide* operations.

The dedupe-keep-latest pattern above is the #1 real-world use (and the Spark
replacement for Postgres's \`DISTINCT ON\`). Practice it below — the SQL runs
unchanged on Spark.`,
        },
        {
          kind: "sql-runnable",
          title: "Latest order per user (runs on Spark verbatim)",
          seedId: "ecommerce",
          sql: `WITH ranked AS (
  SELECT user_id, id AS order_id, created_at, total,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
  FROM orders
)
SELECT user_id, order_id, created_at, total
FROM ranked
WHERE rn = 1
ORDER BY user_id;`,
        },
        {
          kind: "sql-challenge",
          title: "Each user's biggest order",
          seedId: "ecommerce",
          prompt:
            "Using `ROW_NUMBER()`, return each user's single largest order: `user_id`, `order_id` (the order's `id`), and `total` — ranking by `total` descending (ties broken by `id` ascending). Order the result by `user_id`.",
          starterSql:
            "WITH ranked AS (\n  SELECT user_id, id AS order_id, total,\n         ROW_NUMBER() OVER (...) AS rn\n  FROM orders\n)\nSELECT user_id, order_id, total FROM ranked WHERE rn = 1 ORDER BY user_id;",
          solution:
            "WITH ranked AS (SELECT user_id, id AS order_id, total, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY total DESC, id) AS rn FROM orders) SELECT user_id, order_id, total FROM ranked WHERE rn = 1 ORDER BY user_id;",
          ordered: true,
          hints: [
            "PARTITION BY user_id, ORDER BY total DESC, id.",
            "Filter rn = 1 outside the CTE.",
          ],
          xp: 80,
        },
        {
          kind: "challenge",
          title: "The same window in pandas",
          packages: ["pandas"],
          prompt: `Prove the concept transfers: write \`keep_latest(df)\` in pandas. Given columns
\`user\`, \`order_id\`, \`ts\` (an integer timestamp), return only each user's row
with the **highest** \`ts\` — sorted by \`user\`, index reset. (This is
\`ROW_NUMBER() ... WHERE rn = 1\`, pandas-style.)`,
          starterCode: `import pandas as pd

def keep_latest(df):
    pass`,
          tests: [
            {
              name: "keeps the latest per user",
              assertion: `import pandas as pd
df = pd.DataFrame({
    "user": ["ana", "bob", "ana", "bob", "ana"],
    "order_id": [1, 2, 3, 4, 5],
    "ts": [10, 20, 30, 15, 25],
})
out = keep_latest(df)
assert out.to_dict("records") == [
    {"user": "ana", "order_id": 3, "ts": 30},
    {"user": "bob", "order_id": 2, "ts": 20},
]`,
            },
            {
              name: "single rows pass through",
              assertion: `import pandas as pd
df = pd.DataFrame({"user": ["zoe"], "order_id": [9], "ts": [1]})
assert keep_latest(df).to_dict("records") == [{"user": "zoe", "order_id": 9, "ts": 1}]`,
            },
          ],
          hints: [
            "Sort by ts descending, then `groupby('user').head(1)` — or use `df.loc[df.groupby('user')['ts'].idxmax()]`.",
            "Finish with `.sort_values('user', ignore_index=True)`.",
          ],
          solution: `import pandas as pd

def keep_latest(df):
    latest = df.loc[df.groupby("user")["ts"].idxmax()]
    return latest.sort_values("user", ignore_index=True)`,
          xp: 80,
        },
      ],
    },
    {
      id: "spark-performance",
      title: "Performance: Partitions, Caching, AQE & Skew",
      summary: "The four dials that decide whether the job takes minutes or hours.",
      minutes: 14,
      blocks: [
        {
          kind: "prose",
          markdown: `# The performance playbook

## 1. Partition count

- Too FEW → idle cores, giant slow tasks, memory pressure.
- Too MANY → scheduling overhead and (worse) a "small files problem" on write.
- Levers: \`spark.sql.shuffle.partitions\` (default 200), \`repartition(n)\`
  (full shuffle), \`coalesce(n)\` (merge without shuffle — for shrinking, e.g.
  before writing).

## 2. Caching

\`df.cache()\` keeps a computed DataFrame in executor memory. Worth it **only**
when the same frame is reused by multiple actions — caching something used once
just wastes memory. Call \`unpersist()\` when done.

## 3. AQE — Adaptive Query Execution

Spark 3.x re-optimizes **at runtime** using real statistics from completed
stages: coalesces tiny shuffle partitions, switches sort-merge → broadcast when
a side turns out small, and splits skewed partitions. Keep it on
(\`spark.sql.adaptive.enabled\`).

## 4. Skew — the silent killer

Hash partitioning assumes keys spread evenly. One hot key (the null customer,
the mega-client) makes ONE task carry most of the data: 199 tasks finish in
seconds, task 200 runs for an hour. The stage is as slow as its fattest
partition.

Fixes: filter/special-case hot keys, **salting** (append a random suffix to the
hot key so it spreads across N partitions, aggregate twice), or let AQE's skew
handling split oversized partitions.`,
        },
        {
          kind: "runnable",
          title: "See skew wreck a stage (simulation)",
          code: `import random
random.seed(7)

NUM_PARTITIONS = 8
# 10k events, but one "hot" customer produces 60% of them:
keys = ["mega-corp"] * 6000 + [f"cust-{i}" for i in random.choices(range(500), k=4000)]

def simulate(partition_of):
    sizes = [0] * NUM_PARTITIONS
    for k in keys:
        sizes[partition_of(k)] += 1
    slowest = max(sizes)
    print(f"  partition sizes: {sorted(sizes)}")
    print(f"  stage time ~ slowest task = {slowest} units")
    return slowest

print("plain hash partitioning (skewed):")
base = simulate(lambda k: hash(k) % NUM_PARTITIONS)

print()
print("with SALTING (hot key spread over 8 salts):")
def salted(k):
    if k == "mega-corp":
        k = f"{k}#{random.randint(0, 7)}"     # salt only the hot key
    return hash(k) % NUM_PARTITIONS
salted_max = simulate(salted)

print()
print(f"speedup of the stage: ~{base / salted_max:.1f}x")`,
        },
        {
          kind: "quiz",
          question:
            "A job's Spark UI shows a stage where 199/200 tasks finished in 30s and one task has run for 40 minutes. Diagnosis?",
          options: [
            { text: "Data skew: one partition holds a hot key's giant share of the rows", correct: true },
            { text: "Too few executors" },
            { text: "The driver is undersized" },
            { text: "The cluster network is saturated" },
          ],
          explanation:
            "Uniform slowness points at resources; ONE straggler task points at ONE oversized partition — a hot key. Find it (count by key), then salt it, special-case it, or enable AQE skew handling.",
        },
        {
          kind: "quiz",
          question: "When is `df.cache()` actually a win?",
          options: [
            {
              text: "When the same computed DataFrame feeds several downstream actions — e.g. one cleaned frame written to three outputs",
              correct: true,
            },
            { text: "On every DataFrame, as a habit" },
            { text: "Right before a single write, to speed it up" },
            { text: "On the raw input, before any filtering" },
          ],
          explanation:
            "Cache trades executor memory for skipped recomputation — it needs ≥2 uses to pay off. Caching a once-used frame (or worse, the biggest/rawest one) burns memory that stages actually needed.",
        },
      ],
    },
    {
      id: "spark-io",
      title: "Reading & Writing Data",
      summary: "Formats, save modes, and partitioned writes — where jobs quietly go wrong.",
      minutes: 11,
      blocks: [
        {
          kind: "prose",
          markdown: `# I/O: the edges of every job

## Reading

\`\`\`python
df = (spark.read
      .schema(schema)              # EXPLICIT schema: faster + safer than inferSchema
      .parquet("s3://lake/raw/events/"))
# also: .csv(header=True), .json(), spark.read.table("catalog.schema.table")
\`\`\`

\`inferSchema\` on CSV/JSON scans the data once just to guess types — on a lake
path that's an extra full read, and the guess can drift between runs. Production
jobs declare schemas.

## Writing: save modes

\`\`\`python
df.write.mode("append").parquet(path)     # add files
df.write.mode("overwrite").parquet(path)  # replace (see below!)
# modes: append | overwrite | ignore | error (default)
\`\`\`

## Partitioned writes

\`\`\`python
(df.write
   .partitionBy("event_date")             # → event_date=2026-07-03/part-*.parquet
   .mode("overwrite")
   .parquet("s3://lake/curated/events/"))
\`\`\`

This creates the Hive-style folders from the lakes lesson — downstream readers
prune by folder. Two classic traps:

- **partitionBy a high-cardinality column** (user_id!) → millions of tiny files.
- **Blind overwrite** replaces the WHOLE dataset. For "recompute one day",
  use *dynamic partition overwrite* (only touched partitions are replaced) —
  or a Delta \`MERGE\`, which the Databricks module covers next.`,
        },
        {
          kind: "quiz",
          question:
            "A daily job writes with `.mode('overwrite').partitionBy('date')` intending to refresh only yesterday. One morning the whole 3-year dataset is gone except yesterday. What happened?",
          options: [
            {
              text: "Static overwrite mode replaced the entire table path; dynamic partition overwrite (or a MERGE) was needed to touch only yesterday's partition",
              correct: true,
            },
            { text: "partitionBy deleted the other folders as duplicates" },
            { text: "S3 eventual consistency lost the files" },
            { text: "The schema changed, invalidating old partitions" },
          ],
          explanation:
            "Spark's default overwrite is table-level. `spark.sql.sources.partitionOverwriteMode=dynamic` limits replacement to partitions present in the written data. This exact incident is a rite of passage — cheaper to learn here.",
        },
        {
          kind: "quiz",
          question: "Why do production Spark jobs declare an explicit schema instead of `inferSchema=True`?",
          options: [
            {
              text: "Inference costs an extra pass over the data AND can silently guess different types run-to-run — an explicit schema is faster and fails loudly on drift",
              correct: true,
            },
            { text: "inferSchema only works on Parquet" },
            { text: "Explicit schemas compress the data better" },
            { text: "Schema inference requires cluster admin rights" },
          ],
          explanation:
            "A column of '00123' zip codes inferred as INT one day and STRING the next will corrupt downstream logic silently. Schema-as-code is a data contract at the pipeline edge (the Data Quality module builds on this).",
        },
      ],
    },
  ],
};
