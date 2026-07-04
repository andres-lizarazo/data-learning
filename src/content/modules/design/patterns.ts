import type { Module } from "../../../types/lesson";

// Classic (GoF) design patterns, in Python, with data-pipeline flavored examples.
// Every pattern is runnable in Pyodide; the closing lesson maps them onto the tools
// this curriculum teaches (Airflow, dbt, Spark).
export const designPatterns: Module = {
  id: "design-patterns",
  title: "Design Patterns",
  blurb: "Factory, Singleton, Strategy, Adapter, Decorator, Observer — in working Python.",
  track: "Software Design",
  level: "Intermediate",
  icon: "🧩",
  status: "deep",
  lessons: [
    {
      id: "factory-builder",
      title: "Factory & Builder",
      summary: "Centralize object creation so callers stop caring about concrete classes.",
      minutes: 13,
      blocks: [
        {
          kind: "prose",
          markdown: `# Creational patterns

## Factory

A **factory** is one place that decides *which concrete class to build*. Callers
ask for "a connector for this path" and receive the right object — they never
import concrete classes, so adding a new one touches only the factory
(Open/Closed at the creation site).

## Builder

A **builder** assembles a complex object step by step, usually with a fluent
(chainable) API — ideal when constructors would need ten optional arguments:

\`\`\`python
query = (QueryBuilder("orders")
         .select("id", "total")
         .where("status = 'paid'")
         .limit(10)
         .build())
\`\`\`

You've met this shape before: your Pipeline \`.add(...).add(...)\` from the OOP
module *is* a builder. pandas method chains and Spark's
\`df.select(...).filter(...)\` are the same idea as APIs.`,
        },
        {
          kind: "runnable",
          title: "A connector factory + a query builder",
          code: `class CsvConnector:
    kind = "csv"

class JsonConnector:
    kind = "json"

def connector_for(path):                 # the factory: ONE place that decides
    if path.endswith(".csv"):
        return CsvConnector()
    if path.endswith(".json"):
        return JsonConnector()
    raise ValueError(f"no connector for {path}")

print(connector_for("sales.csv").kind)
print(connector_for("events.json").kind)

class QueryBuilder:                      # the builder: assemble step by step
    def __init__(self, table):
        self.table, self.cols, self.filters = table, ["*"], []

    def select(self, *cols):
        self.cols = list(cols); return self

    def where(self, cond):
        self.filters.append(cond); return self

    def build(self):
        sql = f"SELECT {', '.join(self.cols)} FROM {self.table}"
        if self.filters:
            sql += " WHERE " + " AND ".join(self.filters)
        return sql

print(QueryBuilder("orders").select("id", "total").where("status = 'paid'").build())`,
        },
        {
          kind: "challenge",
          title: "Build the reader factory",
          prompt: `Implement three tiny reader classes and the factory that picks between them:

- \`CsvReader\`, \`JsonReader\`, \`ParquetReader\` — each with a class attribute
  \`kind\` set to \`"csv"\`, \`"json"\`, \`"parquet"\` respectively.
- \`reader_for(path)\` — returns an **instance** of the right reader based on the
  file extension (\`.csv\`, \`.json\`, \`.parquet\`), and raises \`ValueError\` for
  anything else.`,
          starterCode: `class CsvReader:
    pass

class JsonReader:
    pass

class ParquetReader:
    pass

def reader_for(path):
    pass`,
          tests: [
            {
              name: "picks by extension",
              assertion: `assert reader_for("data/sales.csv").kind == "csv"
assert reader_for("events.json").kind == "json"
assert reader_for("lake/fact.parquet").kind == "parquet"`,
            },
            {
              name: "unknown extension raises",
              assertion: `try:
    reader_for("notes.txt")
    assert False, "expected ValueError"
except ValueError:
    pass`,
            },
            {
              name: "returns instances",
              assertion: `assert isinstance(reader_for("a.csv"), CsvReader)`,
              hidden: true,
            },
          ],
          hints: [
            "Set `kind = \"csv\"` etc. as class attributes.",
            "`path.endswith('.csv')` per format; `raise ValueError(...)` as the fallback.",
          ],
          solution: `class CsvReader:
    kind = "csv"

class JsonReader:
    kind = "json"

class ParquetReader:
    kind = "parquet"

def reader_for(path):
    if path.endswith(".csv"):
        return CsvReader()
    if path.endswith(".json"):
        return JsonReader()
    if path.endswith(".parquet"):
        return ParquetReader()
    raise ValueError(f"no reader for {path}")`,
          xp: 70,
        },
        {
          kind: "quiz",
          question: "What's the concrete payoff of routing all creation through `reader_for`?",
          options: [
            {
              text: "Adding an Avro reader changes ONE function — the 50 call sites that use readers never learn concrete class names",
              correct: true,
            },
            { text: "Objects are created faster at runtime" },
            { text: "The readers no longer need __init__ methods" },
            { text: "It prevents anyone from instantiating readers directly" },
          ],
          explanation:
            "Factories concentrate the knowledge of 'which class for which situation' in one place. Callers depend only on the returned shape — the same decoupling move as OCP/DIP, applied to construction.",
        },
      ],
    },
    {
      id: "singleton",
      title: "Singleton — and Why to Be Careful",
      summary: "One shared instance: legitimate uses, hidden costs, better alternatives.",
      minutes: 11,
      blocks: [
        {
          kind: "prose",
          markdown: `# Singleton

**Intent:** guarantee a class has one instance, globally reachable. Config
objects, connection pools, and expensive engines are the classic candidates —
this very app holds a single shared Pyodide interpreter and one PGlite database
for exactly that reason.

Pythonic implementations, simplest first:

1. **A module-level instance** — modules are imported once; \`from db import client\`
   IS a singleton. This is the idiomatic Python answer.
2. **Override \`__new__\`** to always return the same instance.
3. **Borg** — many instances, one *shared state* (\`self.__dict__\` aliased).

## The warning label

A singleton is a **global variable wearing a design-pattern badge**:

- Tests interfere with each other through its state (order-dependent failures).
- Dependencies become invisible — functions reach out to the global instead of
  declaring what they need.
- Swapping it (fake for tests, different config) requires monkey-patching.

Modern advice: create ONE instance at your app's entry point and **inject it**
(Dependency Inversion) — you get the single instance without the global access.`,
        },
        {
          kind: "runnable",
          title: "__new__ singleton vs Borg",
          code: `class Config:                                  # classic singleton
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.settings = {}
        return cls._instance

a = Config()
b = Config()
a.settings["env"] = "prod"
print("same object?", a is b)
print("b sees a's write:", b.settings)

class Borg:                                    # shared STATE, not shared identity
    _state = {}

    def __init__(self):
        self.__dict__ = Borg._state

x = Borg(); y = Borg()
x.region = "us-east-1"
print("same object?", x is y)
print("but y.region =", y.region)`,
        },
        {
          kind: "quiz",
          question: "Your test suite passes alone but fails when run together with other tests. A singleton is involved. Why?",
          options: [
            {
              text: "State written by one test lives in the shared instance and leaks into the next test — global mutable state makes tests order-dependent",
              correct: true,
            },
            { text: "Singletons are slower under parallel test runners" },
            { text: "__new__ can only be called once per process" },
            { text: "Test frameworks forbid the singleton pattern" },
          ],
          explanation:
            "The definition of test pollution. Fixes: reset the singleton between tests (a band-aid), or refactor to injection so each test constructs its own instance (the cure).",
        },
        {
          kind: "quiz",
          question: "Which is the most Pythonic way to provide a single shared database client?",
          options: [
            {
              text: "Create it once in a module (`client = DbClient()`), and pass it into the code that needs it",
              correct: true,
            },
            { text: "A metaclass that intercepts instantiation" },
            { text: "Storing it in a global mutable dict keyed by class name" },
            { text: "Re-creating it in every function that needs it" },
          ],
          explanation:
            "Python modules are natural singletons — no ceremony needed. Combining that with injection at the edges keeps the single-instance benefit while dodging the testability costs.",
        },
      ],
    },
    {
      id: "strategy-template",
      title: "Strategy & Template Method",
      summary: "Two ways to vary a step: plug in a function, or fill in a subclass blank.",
      minutes: 13,
      blocks: [
        {
          kind: "prose",
          markdown: `# Varying one step of an algorithm

## Strategy

Encapsulate interchangeable behaviors and pass one in. In Python a strategy is
usually just **a function** (or any object with the agreed method):

\`\`\`python
def dedupe(rows, keep):        # keep is the strategy
    ...
dedupe(rows, keep=keep_latest)
\`\`\`

You already used it: \`run_pipeline(..., transform=apply_bonus)\` in the SOLID
capstone, and \`sorted(data, key=...)\` in the standard library.

## Template Method

The *inverse* control flow: the **base class owns the skeleton**, subclasses fill
in the blanks:

\`\`\`python
class Job:
    def run(self):                    # the template — fixed order, never overridden
        self.extract()
        self.transform()
        self.load()
\`\`\`

Every ETL framework you'll touch has this shape: you implement \`extract()\` /
\`transform()\`; the framework decides when they run.

**Choosing:** Strategy composes (pass different functions per call, even combine
them); Template inherits (fixed skeleton, heavier but self-documenting for
framework-style code). Prefer Strategy when in doubt — composition again.`,
        },
        {
          kind: "runnable",
          title: "Both patterns, side by side",
          code: `# STRATEGY: tax calculation varies per country — inject it.
def us_tax(amount): return round(amount * 1.08, 2)
def de_tax(amount): return round(amount * 1.19, 2)

def invoice_total(prices, tax):
    return tax(sum(prices))

print("US:", invoice_total([100, 50], us_tax))
print("DE:", invoice_total([100, 50], de_tax))

# TEMPLATE METHOD: the ETL skeleton is fixed; steps are subclass blanks.
class EtlJob:
    def run(self):
        data = self.extract()
        data = self.transform(data)
        return f"loaded {len(data)} rows"

    def extract(self):
        raise NotImplementedError

    def transform(self, data):
        return data                     # sensible default: no-op

class OrdersJob(EtlJob):
    def extract(self):
        return [{"id": 1, "amt": 100}, {"id": 2, "amt": -5}]

    def transform(self, data):
        return [r for r in data if r["amt"] >= 0]

print(OrdersJob().run())`,
        },
        {
          kind: "challenge",
          title: "Strategy: pluggable aggregation",
          prompt: `Build a small analytics helper around injected strategies:

- \`summarize(values, strategy)\` — applies the strategy function to the list and
  returns the result; returns \`None\` for an empty list **without calling the
  strategy**.
- Provide two ready-made strategies: \`total(values)\` (the sum) and
  \`spread(values)\` (max minus min).`,
          starterCode: `def total(values):
    pass

def spread(values):
    pass

def summarize(values, strategy):
    pass`,
          tests: [
            {
              name: "built-in strategies",
              assertion: `assert summarize([1, 2, 3], total) == 6
assert summarize([3, 10, 4], spread) == 7`,
            },
            {
              name: "any callable works",
              assertion: `assert summarize([4, 1, 3], max) == 4
assert summarize([2, 2, 2], lambda v: sum(v) / len(v)) == 2.0`,
            },
            {
              name: "empty guard",
              assertion: `calls = []
def spy(v):
    calls.append(v); return 0
assert summarize([], spy) is None
assert calls == []`,
              hidden: true,
            },
          ],
          hints: [
            "`spread` is `max(values) - min(values)`.",
            "In `summarize`, check `if not values: return None` before calling the strategy.",
          ],
          solution: `def total(values):
    return sum(values)

def spread(values):
    return max(values) - min(values)

def summarize(values, strategy):
    if not values:
        return None
    return strategy(values)`,
          xp: 70,
        },
        {
          kind: "quiz",
          question: "Airflow runs your DAG's tasks; dbt runs your models in dependency order. Which pattern is this, from your code's point of view?",
          options: [
            {
              text: "Template Method (a.k.a. inversion of control): the framework owns the skeleton and calls YOUR filled-in blanks",
              correct: true,
            },
            { text: "Singleton: one framework instance runs everything" },
            { text: "Factory: the framework constructs your tasks" },
            { text: "Adapter: the framework wraps your incompatible code" },
          ],
          explanation:
            "\"Don't call us, we'll call you\" — you supply the steps (tasks, models, transform()), the framework supplies when/how/retries. Recognizing this shape makes every new framework instantly familiar.",
        },
      ],
    },
    {
      id: "adapter-facade-decorator",
      title: "Adapter, Facade & Decorator",
      summary: "Three wrappers: convert an interface, simplify a subsystem, add behavior.",
      minutes: 14,
      blocks: [
        {
          kind: "prose",
          markdown: `# The wrapper family

All three wrap an object — the *intent* differs:

| Pattern | Intent | Data-world example |
|---|---|---|
| **Adapter** | convert an interface you HAVE into one you NEED | wrap a legacy SOAP client so it looks like your \`Readable\` protocol |
| **Facade** | one simple front door over a messy subsystem | \`warehouse.load(df, table)\` hiding auth + staging + COPY + audit |
| **Decorator** | same interface, added behavior | retry / timing / caching around any function |

Python gives Decorator first-class syntax (\`@wraps\` functions), and duck typing
makes Adapters tiny — no interfaces to declare, just the right method names.`,
        },
        {
          kind: "runnable",
          title: "Adapter and Facade",
          code: `# The legacy client we CAN'T change:
class LegacySoapClient:
    def fetch_records_v2(self, xml_query):
        return f"<records for {xml_query}>"

# The interface our pipeline NEEDS: .read()
class SoapAdapter:
    def __init__(self, legacy):
        self.legacy = legacy

    def read(self):                       # adapt: translate the call
        return self.legacy.fetch_records_v2("<all/>")

def ingest(source):                       # pipeline code — knows only .read()
    return f"ingested: {source.read()}"

print(ingest(SoapAdapter(LegacySoapClient())))

# FACADE: one method over a 4-step dance every caller used to copy-paste.
class WarehouseFacade:
    def load(self, rows, table):
        steps = [
            "authenticated",
            f"staged {len(rows)} rows",
            f"copied into {table}",
            "audit row written",
        ]
        return " -> ".join(steps)

print(WarehouseFacade().load([1, 2, 3], "fact_sales"))`,
        },
        {
          kind: "runnable",
          title: "Decorator: add behavior to ANY function",
          code: `import time
from functools import wraps

def timed(fn):
    @wraps(fn)                       # keeps fn's name/docstring
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = fn(*args, **kwargs)
        ms = (time.perf_counter() - start) * 1000
        print(f"[timed] {fn.__name__} took {ms:.1f} ms")
        return result
    return wrapper

@timed
def slow_transform(rows):
    return [r * 2 for r in rows for _ in range(50)]

out = slow_transform(list(range(2000)))
print("rows out:", len(out))`,
        },
        {
          kind: "challenge",
          title: "Write @memoize",
          prompt: `Implement a \`memoize(fn)\` decorator that caches results by the function's
positional arguments: the first call with given args runs \`fn\` and stores the
result; repeat calls return the cached value **without calling \`fn\` again**.`,
          starterCode: `def memoize(fn):
    pass`,
          tests: [
            {
              name: "caches results",
              assertion: `calls = {"n": 0}
@memoize
def double(x):
    calls["n"] += 1
    return x * 2
assert double(21) == 42
assert double(21) == 42
assert calls["n"] == 1`,
            },
            {
              name: "different args, different cache slots",
              assertion: `calls = {"n": 0}
@memoize
def add(a, b):
    calls["n"] += 1
    return a + b
assert add(1, 2) == 3 and add(2, 1) == 3 and add(1, 2) == 3
assert calls["n"] == 2`,
            },
            {
              name: "speeds up recursion",
              assertion: `@memoize
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)
assert fib(60) == 1548008755920`,
              hidden: true,
            },
          ],
          hints: [
            "Keep a dict in the enclosing scope keyed by `args` (tuples are hashable).",
            "`if args not in cache: cache[args] = fn(*args)` then return `cache[args]`.",
          ],
          solution: `def memoize(fn):
    cache = {}

    def wrapper(*args):
        if args not in cache:
            cache[args] = fn(*args)
        return cache[args]

    return wrapper`,
          xp: 80,
        },
        {
          kind: "quiz",
          question: "You wrap a REST client so it satisfies the same `.read()` interface as your DB sources. You also wrap `.read()` itself with retry logic. Which patterns did you use?",
          options: [
            { text: "Adapter (interface conversion) then Decorator (same interface, added behavior)", correct: true },
            { text: "Facade twice" },
            { text: "Decorator then Adapter" },
            { text: "Strategy then Template Method" },
          ],
          explanation:
            "Interface changed → Adapter. Interface preserved but behavior added → Decorator. Intent, not mechanics, distinguishes the wrapper patterns.",
        },
      ],
    },
    {
      id: "observer",
      title: "Observer & Pub/Sub",
      summary: "Emit events; let subscribers react — the pattern behind Kafka's mental model.",
      minutes: 13,
      blocks: [
        {
          kind: "prose",
          markdown: `# Observer / Publish–Subscribe

**Problem:** when a pipeline finishes, you must update the dashboard cache, send
a Slack ping, and kick off a downstream job. Calling all three from the pipeline
couples it to every consumer — and every NEW consumer edits the pipeline.

**Pattern:** the pipeline just **publishes an event**; interested parties
**subscribe**. Publisher and subscribers never know each other.

\`\`\`
publisher ──event──▶ [ bus ] ──▶ subscriber A
                            └──▶ subscriber B
\`\`\`

- In-process: the **Observer** pattern (a list of callbacks per event).
- Between systems: **pub/sub infrastructure** — Kafka topics, SNS/SQS,
  Postgres LISTEN/NOTIFY. Same idea, network-sized.

This inversion (producers don't know consumers) is exactly why event-driven data
platforms scale organizationally: teams subscribe to topics without asking the
producing team to change anything.`,
        },
        {
          kind: "runnable",
          title: "A 20-line event bus",
          code: `class EventBus:
    def __init__(self):
        self.subscribers = {}                 # event name -> [callbacks]

    def subscribe(self, event, fn):
        self.subscribers.setdefault(event, []).append(fn)

    def publish(self, event, payload):
        for fn in self.subscribers.get(event, []):
            fn(payload)

bus = EventBus()
bus.subscribe("job.finished", lambda p: print(f"  slack: {p['job']} done ✔"))
bus.subscribe("job.finished", lambda p: print(f"  cache: refresh for {p['job']}"))
bus.subscribe("job.failed",   lambda p: print(f"  pager: {p['job']} FAILED!"))

# The pipeline knows only the bus — not who's listening:
print("pipeline publishes job.finished:")
bus.publish("job.finished", {"job": "nightly-load"})
print("pipeline publishes job.failed:")
bus.publish("job.failed", {"job": "cdc-sync"})`,
        },
        {
          kind: "challenge",
          title: "Build the event bus",
          prompt: `Implement \`EventBus\`:

- \`.subscribe(event, fn)\` — register a callback for an event name.
- \`.publish(event, payload)\` — call every callback registered for that event
  (in subscription order) with \`payload\`, and **return how many were notified**
  (\`0\` for an event nobody subscribed to).`,
          starterCode: `class EventBus:
    def __init__(self):
        pass

    def subscribe(self, event, fn):
        pass

    def publish(self, event, payload):
        pass`,
          tests: [
            {
              name: "delivers to subscribers",
              assertion: `bus = EventBus()
seen = []
bus.subscribe("done", lambda p: seen.append(("a", p)))
bus.subscribe("done", lambda p: seen.append(("b", p)))
assert bus.publish("done", 42) == 2
assert seen == [("a", 42), ("b", 42)]`,
            },
            {
              name: "unknown events are safe",
              assertion: `bus = EventBus()
assert bus.publish("nobody-listens", {"x": 1}) == 0`,
            },
            {
              name: "events are independent",
              assertion: `bus = EventBus()
a, b = [], []
bus.subscribe("ok", a.append)
bus.subscribe("fail", b.append)
bus.publish("ok", 1)
assert a == [1] and b == []`,
              hidden: true,
            },
          ],
          hints: [
            "Store a dict of event → list of callbacks; `setdefault(event, [])` keeps subscribe simple.",
            "publish: get the list (default `[]`), call each with the payload, return the list's length.",
          ],
          solution: `class EventBus:
    def __init__(self):
        self.subscribers = {}

    def subscribe(self, event, fn):
        self.subscribers.setdefault(event, []).append(fn)

    def publish(self, event, payload):
        fns = self.subscribers.get(event, [])
        for fn in fns:
            fn(payload)
        return len(fns)`,
          xp: 80,
        },
        {
          kind: "quiz",
          question: "Why does pub/sub scale better *organizationally* than direct calls between systems?",
          options: [
            {
              text: "A new consumer just subscribes to the topic — the producing team ships nothing and doesn't even need to know",
              correct: true,
            },
            { text: "Events are compressed better than API requests" },
            { text: "Publishers can enforce how subscribers process events" },
            { text: "It removes the need for schemas" },
          ],
          explanation:
            "Decoupling producer from consumers turns an N×M integration mesh into N producers + M subscribers around topics. (The flip side — nobody knows who depends on an event's schema — is why schema registries and data contracts exist.)",
        },
      ],
    },
    {
      id: "patterns-in-pipelines",
      title: "Patterns in Data Tools",
      summary: "Spot Factory, Strategy, Template, Decorator & Observer inside Airflow, dbt, and Spark.",
      minutes: 10,
      blocks: [
        {
          kind: "prose",
          markdown: `# You already know these tools' designs

The tools in the Data Engineering track are built from the patterns you just
learned. Recognizing them turns "memorizing an API" into "oh, it's that shape":

| Where | What you write | The pattern |
|---|---|---|
| Airflow | \`@task\` / operators; the scheduler calls you | **Template Method** (inversion of control) + **Decorator** |
| Airflow | \`PostgresOperator\`, \`S3Operator\`, one per system | **Adapter** family over external systems |
| dbt | \`materialized: view/table/incremental\` config | **Strategy** — same model SQL, swappable build behavior |
| dbt | \`ref()\` building the DAG that runs in order | **Observer-ish** dependency graph (declared, not called) |
| Spark | \`df.select(...).filter(...).groupBy(...)\` | **Builder** — assemble a plan, \`.collect()\` = \`.build()\` |
| Spark | lazy transformations vs actions | Builder again: nothing runs until the terminal call |
| pandas | \`.pipe(fn)\` chains | **Strategy** injected into a pipeline |
| Great Expectations | one \`Expectation\` class per check | **Strategy** + **Factory** (from config) |
| This app | one shared Pyodide/PGlite engine | **Singleton** (module-level instance) |

Two takeaways:

1. **Read new frameworks pattern-first.** "Where's the template? What's
   injectable? What's the factory config?" — you'll be productive in hours.
2. **Write your own pipeline code the same way** — your future teammates get the
   same fast on-ramp.`,
        },
        {
          kind: "flashcards",
          title: "Pattern intents — one line each",
          cards: [
            { front: "Factory", back: "One place decides WHICH concrete class to build; callers depend only on the returned shape. Adding a variant touches one function." },
            { front: "Builder", back: "Assemble a complex object/plan step by step, usually fluent (.a().b().build()). Spark DataFrames and SQL query builders are this." },
            { front: "Singleton", back: "One shared instance, globally reachable. Legit for expensive engines/config — but it's global state: prefer one instance created at the entry point and injected." },
            { front: "Strategy", back: "Interchangeable behaviors behind one interface, chosen/injected at runtime. In Python: usually just a passed-in function (sorted's key=, dbt materializations)." },
            { front: "Template Method", back: "Base class owns the fixed skeleton; subclasses fill in the blank steps. Frameworks calling YOUR code (Airflow tasks, ETL job classes) — inversion of control." },
            { front: "Adapter vs Facade vs Decorator", back: "All wrappers, different intent: Adapter CONVERTS an interface; Facade SIMPLIFIES a subsystem behind one door; Decorator KEEPS the interface and adds behavior (retry, cache, timing)." },
            { front: "Observer / Pub-Sub", back: "Producers publish events; subscribers register interest. Neither knows the other — new consumers need zero producer changes (EventBus, Kafka topics)." },
          ],
        },
        {
          kind: "quiz",
          question: "Spark's `df.filter(...).select(...)` returns instantly even on a billion rows; `.count()` takes minutes. Which pattern explains this?",
          options: [
            {
              text: "Builder: transformations assemble a query plan; the action is the .build() that finally executes it",
              correct: true,
            },
            { text: "Singleton: the DataFrame is shared and cached" },
            { text: "Observer: .count() subscribes to the rows" },
            { text: "Adapter: filter converts the row format" },
          ],
          explanation:
            "Lazy evaluation is the Builder pattern at engine scale: each transformation adds to a logical plan, and only an action materializes it — which lets Spark optimize the WHOLE plan first (predicate pushdown, column pruning).",
        },
        {
          kind: "quiz",
          question: "dbt lets the same model SQL be built as a view, a table, or incrementally, via one config line. As a pattern, the materialization is…",
          options: [
            { text: "a Strategy — interchangeable build behaviors behind one interface, selected by config", correct: true },
            { text: "a Facade over the warehouse" },
            { text: "a Singleton per model" },
            { text: "a Template Method subclass per model" },
          ],
          explanation:
            "Your SELECT stays identical; the materialization strategy wraps it in different DDL (CREATE VIEW / CREATE TABLE / MERGE). Swapping strategies without touching the model is textbook Strategy — you'll use it hands-on in the dbt module.",
        },
      ],
    },
  ],
};
