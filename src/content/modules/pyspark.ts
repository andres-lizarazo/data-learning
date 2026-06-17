import type { Module } from "../../types/lesson";

// PySpark — conceptual track. Spark needs a JVM and can't run in Pyodide, so this
// module teaches the model + shows code with pandas <-> PySpark equivalences.
export const pyspark: Module = {
  id: "pyspark",
  title: "PySpark (Concepts)",
  blurb: "Distributed data processing — the model, the API, pandas↔Spark.",
  level: "Advanced",
  icon: "⚡",
  status: "starter",
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

> ⚠️ **Why no live runner here?** Spark runs on the **JVM** and distributes work
> across a cluster. It can't run inside the browser (Pyodide). This module teaches
> the *concepts* and *API* so the code is familiar when you run it on a real
> cluster (Databricks, EMR, or a local \`pyspark\` install).

## Why Spark?
When data is too big for one machine's memory, Spark splits it across many workers
and runs computations in **parallel**.

## Core ideas
- **SparkSession** — your entry point.
- **DataFrame** — a distributed table (like pandas, but partitioned across nodes).
- **Transformations** (\`select\`, \`filter\`, \`groupBy\`) are **lazy** — they build a
  plan but don't execute.
- **Actions** (\`show\`, \`count\`, \`collect\`) **trigger** the computation.
- **Lazy evaluation** lets Spark optimize the whole plan (Catalyst optimizer).

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
or use a managed platform like Databricks.`,
        },
      ],
    },
  ],
};
