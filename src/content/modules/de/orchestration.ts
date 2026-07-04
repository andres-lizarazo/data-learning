import type { Module } from "../../../types/lesson";

// Orchestration — Airflow concepts plus the ideas underneath them (DAGs, logical
// dates, idempotent tasks). The capstone has the learner BUILD a miniature
// orchestrator (topological sort + execution) in pure Python.
export const orchestration: Module = {
  id: "orchestration",
  title: "Orchestration (Airflow)",
  blurb: "DAGs, scheduling, backfills, idempotent tasks — and build a mini orchestrator.",
  track: "Data Engineering",
  level: "Intermediate",
  icon: "🗓️",
  status: "deep",
  lessons: [
    {
      id: "why-orchestration",
      title: "Why Orchestration? DAGs of Work",
      summary: "From tangled cron jobs to an explicit dependency graph.",
      minutes: 11,
      blocks: [
        {
          kind: "prose",
          markdown: `# The problem orchestration solves

The cron era: \`extract\` at 01:00, \`transform\` at 02:00 ("should be done by
then"…), \`report\` at 03:00. Then extract runs long one night and transform
processes half a dataset — **silently**.

The fix: stop encoding dependencies as *time gaps* and encode them as a
**graph**. An orchestrator runs a **DAG** (Directed Acyclic Graph) of tasks:

\`\`\`
extract ──▶ transform ──▶ load ──▶ report
               │
validate ──────┘          (load waits for BOTH)
\`\`\`

- **Directed** — edges have direction (extract *then* transform).
- **Acyclic** — no loops (a task can't depend on itself, even transitively).
- Tasks run **when their parents succeed** — never on a hopeful timer.

What the orchestrator owns beyond ordering: retries with backoff, alerting,
logs, backfills, concurrency limits, and a UI showing exactly which task of
which run failed. What it should NOT own: the data processing itself — tasks
*trigger* work (a query, a Spark job, a dbt run); heavy lifting happens in the
engines.

Execution order comes from the graph: tasks with no unfinished parents are
ready; finish them and the next "wave" unlocks — watch BFS traverse exactly
those waves below.`,
        },
        {
          kind: "dsa-viz",
          viz: "graph",
          traversal: "bfs",
          title: "Execution waves: BFS over the task graph",
          data: {
            adjacency: {
              extract: ["validate", "transform"],
              validate: ["load"],
              transform: ["load"],
              load: ["report"],
              report: [],
            },
            start: "extract",
          },
          caption:
            "Wave 1: extract. Wave 2: validate + transform (parallel!). Wave 3: load. Wave 4: report.",
        },
        {
          kind: "quiz",
          question: "Why must the task graph be ACYCLIC?",
          options: [
            {
              text: "A cycle means some task transitively depends on itself — no valid execution order exists",
              correct: true,
            },
            { text: "Cycles make the UI diagram too cluttered" },
            { text: "Acyclic graphs use less memory" },
            { text: "It's an arbitrary Airflow limitation" },
          ],
          explanation:
            "Topological order (an order where every task follows all its parents) exists if and only if the graph has no cycles. A→B→C→A is unschedulable: nobody can go first. You'll implement the cycle check yourself in the capstone.",
        },
        {
          kind: "quiz",
          question: "The cron-gap design ('transform at 02:00, extract should be done by then') fails HOW exactly?",
          options: [
            {
              text: "The dependency is implicit in wall-clock spacing — any slow or failed upstream run silently violates it and downstream processes wrong/partial data",
              correct: true,
            },
            { text: "cron can't run more than one job per hour" },
            { text: "The jobs can't share a database" },
            { text: "It fails loudly, which wakes people up" },
          ],
          explanation:
            "'Silently' is the killer word: cron has no idea the jobs are related. An orchestrator makes the dependency explicit and enforced — downstream simply doesn't start until upstream succeeds.",
        },
      ],
    },
    {
      id: "airflow-core",
      title: "Airflow Core Concepts",
      summary: "DAGs, tasks, operators, the scheduler — and what a DAG file really is.",
      minutes: 12,
      blocks: [
        {
          kind: "prose",
          markdown: `# Airflow's vocabulary

\`\`\`python
from airflow.decorators import dag, task
from datetime import datetime

@dag(schedule="@daily", start_date=datetime(2026, 1, 1), catchup=False)
def shop_pipeline():

    @task
    def extract():
        return fetch_orders()          # returns are passed via XCom

    @task
    def transform(rows):
        return clean(rows)

    @task(retries=3)
    def load(rows):
        merge_into_warehouse(rows)

    load(transform(extract()))         # ← calls DEFINE the graph, lazily!

shop_pipeline()
\`\`\`

- **DAG** — the pipeline definition (name, schedule, start date).
- **Task** — one node; with the TaskFlow API, a decorated Python function.
- **Operator** — pre-built task types (\`BashOperator\`, \`SQLExecuteQueryOperator\`,
  \`DatabricksRunNowOperator\`…) — the Adapter family you predicted in Design
  Patterns.
- **Scheduler** — the daemon that creates **DAG runs** on schedule and queues
  ready tasks. **Workers** execute them.
- **XCom** — small metadata passed between tasks (ids, paths, counts — NOT
  dataframes; big data goes through storage).

Note the pattern-spotting: the DAG file *builds a plan* (calls are lazy — that's
the Builder), the scheduler *calls your tasks* (inversion of control — Template
Method). You've seen both shapes twice already.`,
        },
        {
          kind: "quiz",
          question: "`transform(extract())` in a TaskFlow DAG file does NOT run extract. What does it do?",
          options: [
            {
              text: "It declares the edge extract → transform in the DAG; execution happens later, task-by-task, on workers when the scheduler triggers a run",
              correct: true,
            },
            { text: "It runs extract immediately and caches the result" },
            { text: "It's a syntax error outside a worker" },
            { text: "It runs both functions in a subprocess" },
          ],
          explanation:
            "The DAG file is a *plan builder* that the scheduler parses (frequently!). That's also why DAG files must be fast and side-effect-free at import time — top-level API calls or queries in a DAG file execute on every parse. A classic and expensive mistake.",
        },
        {
          kind: "quiz",
          question: "A task 'returns' a 2 GB DataFrame to the next task via XCom. What's wrong?",
          options: [
            {
              text: "XCom is for small metadata (stored in Airflow's own DB) — big data should be written to storage/warehouse and the task should pass a reference (path/table name)",
              correct: true,
            },
            { text: "Nothing, XCom streams data efficiently" },
            { text: "XCom only accepts strings" },
            { text: "DataFrames can't be serialized at all" },
          ],
          explanation:
            "Orchestrate, don't process: the orchestrator's DB is not a data plane. Task A writes to s3://.../staging/2026-07-03/, passes the path; task B reads it. Same principle as the driver-vs-executors split in Spark.",
        },
      ],
    },
    {
      id: "scheduling-idempotency",
      title: "Scheduling, Backfills & Idempotency",
      summary: "Logical dates, catchup, and tasks that are safe to run twice.",
      minutes: 13,
      blocks: [
        {
          kind: "prose",
          markdown: `# The logical date

Airflow's most-misunderstood idea: a daily run has a **logical date** — the data
interval it processes — which is NOT "now".

> The run with logical date **2026-07-02** executes early on **2026-07-03**,
> after the interval it covers has fully ended.

Tasks receive it and must use it:

\`\`\`python
@task
def extract(ds=None):                                  # ds = "2026-07-02"
    return fetch_orders(day=ds)                        # ← parameterized!
    # NOT: fetch_orders(day=today())  ← breaks backfills & retries
\`\`\`

## Why: backfills and catchup

- **Backfill**: "recompute June" = run the DAG once per June day, each with
  that day's logical date. Only works if tasks derive everything from it.
- **Catchup**: with \`catchup=True\`, a DAG deployed with a January start_date
  immediately schedules every missed interval since.

## Idempotency completes the picture

A backfill re-runs days that already loaded. Every task must therefore be safe
to re-run: **MERGE by key or delete-then-insert the partition** (your warehouse
patterns), never blind append. Logical date + idempotent writes = any slice of
history can be recomputed fearlessly, any failed run retried blindly. That's
the entire operational model.`,
        },
        {
          kind: "runnable",
          title: "now() vs logical date — watch a backfill go wrong",
          code: `# A tiny warehouse: day -> rows loaded for that day.
warehouse = {}

def fetch_orders(day):
    return [f"{day}-order-{i}" for i in range(2)]     # pretend API call

# BAD task: derives the day itself.
def load_bad(today):
    day = today                       # stands in for datetime.now().date()
    warehouse[day] = fetch_orders(day)

# GOOD task: uses the injected logical date.
def load_good(logical_date):
    warehouse[logical_date] = fetch_orders(logical_date)

# Backfilling June 1–3 with the BAD task on July 3rd:
warehouse.clear()
for _ in ["2026-06-01", "2026-06-02", "2026-06-03"]:
    load_bad("2026-07-03")            # it always loads "today"!
print("bad backfill wrote:", sorted(warehouse))

warehouse.clear()
for day in ["2026-06-01", "2026-06-02", "2026-06-03"]:
    load_good(day)
print("good backfill wrote:", sorted(warehouse))`,
        },
        {
          kind: "challenge",
          title: "An idempotent partition load",
          prompt: `Write \`load_partition(warehouse, day, rows)\`:

- \`warehouse\` is a dict mapping \`day\` → list of rows.
- The load must be **idempotent** via delete-then-insert: the day's partition is
  **replaced** by \`rows\` (never appended to), so re-runs converge.
- Other days' partitions must be untouched.
- Return the number of rows now in that partition.`,
          starterCode: `def load_partition(warehouse, day, rows):
    pass`,
          tests: [
            {
              name: "loads a day",
              assertion: `wh = {}
assert load_partition(wh, "2026-06-01", ["a", "b"]) == 2
assert wh == {"2026-06-01": ["a", "b"]}`,
            },
            {
              name: "re-run replaces, never duplicates",
              assertion: `wh = {"2026-06-01": ["a", "b"]}
load_partition(wh, "2026-06-01", ["a", "b"])
load_partition(wh, "2026-06-01", ["a", "b"])
assert wh == {"2026-06-01": ["a", "b"]}`,
            },
            {
              name: "other partitions untouched",
              assertion: `wh = {"2026-06-01": ["old"], "2026-06-02": ["keep"]}
load_partition(wh, "2026-06-01", ["new1", "new2"])
assert wh == {"2026-06-01": ["new1", "new2"], "2026-06-02": ["keep"]}`,
              hidden: true,
            },
          ],
          hints: [
            "Assignment IS delete-then-insert here: `warehouse[day] = list(rows)`.",
            "Return `len(warehouse[day])`.",
          ],
          solution: `def load_partition(warehouse, day, rows):
    warehouse[day] = list(rows)
    return len(warehouse[day])`,
          xp: 70,
        },
        {
          kind: "quiz",
          question: "A task appends to the fact table. A backfill re-runs 30 already-loaded days. What happens, and what was the design error?",
          options: [
            {
              text: "30 days of duplicated facts (double revenue everywhere); the task should have MERGEd by key or replaced its logical date's partition",
              correct: true,
            },
            { text: "Airflow detects duplicates and rolls back" },
            { text: "Nothing — backfills skip loaded days automatically" },
            { text: "The task fails on a primary-key error, always" },
          ],
          explanation:
            "Orchestrators re-run things — that's their job. They assume tasks are idempotent; they cannot make them so. (A unique constraint would at least fail loudly — the dbt tests lesson's exact scenario.)",
        },
      ],
    },
    {
      id: "mini-orchestrator",
      title: "Capstone: Build a Mini Orchestrator",
      summary: "Topological sort + execution with failure handling — Airflow's heart, in 30 lines.",
      minutes: 17,
      blocks: [
        {
          kind: "prose",
          markdown: `# Build the thing

An orchestrator's core loop is genuinely small:

1. **Topological sort** — find an order where every task follows its parents
   (Kahn's algorithm: repeatedly take a task with no unfinished parents).
2. **Execute in that order**, skipping descendants of failures.
3. **Detect cycles** — if no task is ready but tasks remain, the graph is cyclic.

You'll implement step 1 (with deterministic alphabetical tie-breaking, like a
real scheduler's stable ordering) and a runner on top.

The DAG format: \`deps = {"transform": ["extract"], ...}\` — each task maps to
the list of tasks it **depends on**.`,
        },
        {
          kind: "runnable",
          title: "Kahn's algorithm, narrated",
          code: `deps = {
    "extract": [],
    "validate": ["extract"],
    "transform": ["extract"],
    "load": ["validate", "transform"],
    "report": ["load"],
}

remaining = dict(deps)
done = []
while remaining:
    ready = sorted(t for t, parents in remaining.items()
                   if all(p not in remaining for p in parents))
    print(f"wave: {ready}")
    for t in ready:
        del remaining[t]
    done.extend(ready)

print("execution order:", done)`,
        },
        {
          kind: "challenge",
          title: "topo_order + run_dag",
          prompt: `Implement the orchestrator core:

- \`topo_order(deps)\` — return a list of all task names in a valid topological
  order. When several tasks are ready at once, take them **alphabetically**.
  If no progress can be made while tasks remain (a cycle), raise \`ValueError\`.
- \`run_dag(deps, run_task)\` — call \`run_task(name)\` for every task in
  \`topo_order\` order and return the list of names in execution order.`,
          starterCode: `def topo_order(deps):
    pass

def run_dag(deps, run_task):
    pass`,
          tests: [
            {
              name: "linear chain",
              assertion: `deps = {"load": ["transform"], "extract": [], "transform": ["extract"]}
assert topo_order(deps) == ["extract", "transform", "load"]`,
            },
            {
              name: "diamond with alphabetical ties",
              assertion: `deps = {"a": [], "b": ["a"], "c": ["a"], "d": ["b", "c"]}
assert topo_order(deps) == ["a", "b", "c", "d"]`,
            },
            {
              name: "cycle raises",
              assertion: `try:
    topo_order({"a": ["b"], "b": ["a"]})
    assert False, "expected ValueError"
except ValueError:
    pass`,
            },
            {
              name: "run_dag executes in order",
              assertion: `ran = []
deps = {"report": ["load"], "load": ["extract"], "extract": []}
out = run_dag(deps, ran.append)
assert out == ["extract", "load", "report"]
assert ran == ["extract", "load", "report"]`,
            },
            {
              name: "independent roots run alphabetically",
              assertion: `deps = {"z_ingest": [], "a_ingest": [], "join": ["a_ingest", "z_ingest"]}
assert topo_order(deps) == ["a_ingest", "z_ingest", "join"]`,
              hidden: true,
            },
          ],
          hints: [
            "Loop while tasks remain: collect `ready` = tasks whose parents are all already ordered; sort them; append and remove.",
            "If `ready` is empty but tasks remain → raise ValueError('cycle').",
            "run_dag: `order = topo_order(deps)`, call run_task for each, return order.",
          ],
          solution: `def topo_order(deps):
    remaining = dict(deps)
    order = []
    while remaining:
        ready = sorted(
            t for t, parents in remaining.items()
            if all(p not in remaining for p in parents)
        )
        if not ready:
            raise ValueError("cycle detected")
        for t in ready:
            order.append(t)
            del remaining[t]
    return order

def run_dag(deps, run_task):
    order = topo_order(deps)
    for name in order:
        run_task(name)
    return order`,
          xp: 130,
        },
        {
          kind: "quiz",
          question: "Your topo_order found no ready task while 3 tasks remain. In a real orchestrator UI, what would this look like?",
          options: [
            {
              text: "The DAG fails validation/import — Airflow refuses cyclic DAGs at parse time, before anything runs",
              correct: true,
            },
            { text: "The three tasks run in random order" },
            { text: "The scheduler retries until the cycle resolves" },
            { text: "The tasks deadlock silently forever" },
          ],
          explanation:
            "Cycles are structurally unschedulable, so orchestrators reject them as early as possible — at DAG parse — exactly like your ValueError, just earlier in the lifecycle.",
        },
      ],
    },
    {
      id: "sensors-ecosystem",
      title: "Sensors, Retries, SLAs & the Ecosystem",
      summary: "Waiting for the world, and where Dagster/Prefect fit.",
      minutes: 11,
      blocks: [
        {
          kind: "prose",
          markdown: `# The operational toolkit

## Sensors — tasks that wait

Some dependencies aren't tasks: a vendor's file landing, a partition appearing,
another DAG finishing. **Sensors** poll (or defer) until a condition holds:
\`S3KeySensor\`, \`ExternalTaskSensor\`, \`SqlSensor\`. Modern Airflow prefers
**deferrable** sensors (they release their worker slot while waiting) and
**data-aware scheduling** (\`Datasets\`/assets: "run when this table updates").

## Retries, SLAs, alerting

\`\`\`python
@task(retries=3, retry_delay=timedelta(minutes=5),
      retry_exponential_backoff=True)
\`\`\`

Retries handle *transient* failures (your Architecture lesson, verbatim — note
retries × non-idempotent task = disaster). **SLAs** alert when runs finish later
than promised; on-call gets the page, lineage tells them who's impacted.

## The ecosystem in one paragraph each

- **Airflow** — the incumbent; imperative task-DAGs; enormous operator
  ecosystem; the thing job postings name.
- **Dagster** — asset-oriented: you declare the *tables/files* (assets) and
  their dependencies; strong typing, testing, and dev experience.
- **Prefect** — Pythonic dynamic flows, lightweight; "your code is the DAG".
- **Databricks Workflows / dbt Cloud** — platform-native schedulers; fine when
  all work lives on that platform (Databricks module's rule of thumb).

The concepts you now own — DAGs, logical dates, idempotency, backfills,
sensors — transfer to ALL of them; only the decorators change.`,
        },
        {
          kind: "quiz",
          question: "A pipeline must start when a vendor drops a file in S3 — usually 6:00–6:30am, occasionally 9am. The right trigger is…",
          options: [
            {
              text: "A (deferrable) S3 key sensor gating the DAG — it starts work when the file actually exists, however late",
              correct: true,
            },
            { text: "Schedule at 06:30 and hope" },
            { text: "Schedule at 09:30 to be safe, wasting 3 hours daily" },
            { text: "Run every 5 minutes and fail until the file appears" },
          ],
          explanation:
            "Event conditions deserve event triggers, not timers — the same lesson as cron gaps. The deferrable flavor matters at scale: a plain sensor occupies a worker slot for its whole wait.",
        },
        {
          kind: "quiz",
          question: "Dagster's pitch is 'orchestrate assets, not tasks'. What does that reframing buy?",
          options: [
            {
              text: "The graph nodes ARE your tables/files — freshness, lineage, and 'what needs rebuilding' become first-class, instead of being inferred from task names",
              correct: true,
            },
            { text: "Assets execute faster than tasks" },
            { text: "It removes the need for schedules entirely" },
            { text: "It's only a UI difference" },
          ],
          explanation:
            "It's the dbt/DLT worldview applied to orchestration: declare the data artifacts and their dependencies; execution plans follow. Notice how every modern tool converges on declared-DAG-of-data — you've now seen it four times.",
        },
      ],
    },
  ],
};
