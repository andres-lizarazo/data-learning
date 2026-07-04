import type { Module } from "../../../types/lesson";

// Architecture patterns — the level above classes: how whole applications and
// pipelines are shaped. Ports & adapters, dependency injection, functional
// composition, and the reliability patterns (idempotency, retries) that
// data-engineering interviews love.
export const architecture: Module = {
  id: "architecture",
  title: "Architecture Patterns",
  blurb: "Layers, hexagonal/ports & adapters, DI wiring, composition, idempotency & retries.",
  track: "Software Design",
  level: "Advanced",
  icon: "🏛️",
  status: "deep",
  lessons: [
    {
      id: "layered-hexagonal",
      title: "Layered & Hexagonal Architecture",
      summary: "Keep the core logic pure; push databases and APIs to the edges.",
      minutes: 14,
      blocks: [
        {
          kind: "prose",
          markdown: `# From layers to hexagons

## Layered architecture

The classic stack — each layer may only call downward:

\`\`\`
presentation  (API / CLI / UI)
   ↓
business      (the rules — the part that IS your app)
   ↓
persistence   (repositories)
   ↓
database
\`\`\`

Good start, but the business layer still *depends on* persistence below it —
swap the database and the middle layer trembles.

## Hexagonal (a.k.a. Ports & Adapters)

Flip the arrows with Dependency Inversion:

- The **core** (business logic) sits in the middle, pure, depending on nothing
  concrete.
- It defines **ports** — the interfaces it needs (\`OrderRepo\` with \`get/save\`)
  or offers.
- **Adapters** implement ports for real tech: Postgres adapter, REST adapter,
  in-memory adapter for tests.

\`\`\`
   REST adapter ─▶ ┌────────────┐ ◀─ Postgres adapter
                   │    CORE    │
   CLI adapter  ─▶ │ (pure biz) │ ◀─ In-memory adapter (tests!)
                   └────────────┘
\`\`\`

**Payoff:** the core is testable with zero infrastructure, and tech choices
become swappable details. For a data engineer: transformation logic = core;
sources/sinks = adapters. Write transforms as pure functions over plain data and
they'll survive every platform migration.`,
        },
        {
          kind: "runnable",
          title: "A hexagonal mini-app",
          code: `# CORE — pure business logic. No imports, no I/O, no framework.
def price_order(items, vip):
    subtotal = sum(qty * price for qty, price in items)
    discount = 0.10 if vip and subtotal > 100 else 0.0
    return round(subtotal * (1 - discount), 2)

class CheckoutService:
    def __init__(self, repo, notifier):   # ports: "things with get_items/send"
        self.repo, self.notifier = repo, notifier

    def checkout(self, order_id, vip=False):
        total = price_order(self.repo.get_items(order_id), vip)
        self.notifier.send(f"order {order_id}: \${total}")
        return total

# ADAPTERS — swappable edges.
class InMemoryRepo:
    def __init__(self, data): self.data = data
    def get_items(self, order_id): return self.data[order_id]

class ConsoleNotifier:
    def send(self, msg): print("notify:", msg)

# WIRING — the only place that knows concrete classes.
repo = InMemoryRepo({7: [(2, 30.0), (1, 55.0)]})
service = CheckoutService(repo, ConsoleNotifier())
print("total:", service.checkout(7, vip=True))

# The core function is trivially testable — no service, no adapters:
assert price_order([(1, 50.0)], vip=False) == 50.0
assert price_order([(3, 50.0)], vip=True) == 135.0
print("pure-core tests passed")`,
        },
        {
          kind: "quiz",
          question: "In hexagonal terms, what are a data pipeline's 'core' and 'adapters'?",
          options: [
            {
              text: "Core: the transformation logic on plain data. Adapters: the readers/writers for S3, Postgres, Kafka, APIs",
              correct: true,
            },
            { text: "Core: the orchestrator. Adapters: the transformations" },
            { text: "Core: the database. Adapters: the SQL queries" },
            { text: "Core: the cloud provider. Adapters: the pipelines" },
          ],
          explanation:
            "Business value lives in the transforms — keep them pure and platform-free. I/O tech churns (this year S3, next year GCS); adapters absorb the churn while the core and its tests survive untouched.",
        },
        {
          kind: "quiz",
          question: "Why is the in-memory adapter arguably the most valuable one you'll write?",
          options: [
            {
              text: "It makes the entire core testable in milliseconds with no database, no network, no docker",
              correct: true,
            },
            { text: "It's the fastest adapter in production" },
            { text: "It removes the need for the real adapters" },
            { text: "It caches production queries automatically" },
          ],
          explanation:
            "Fast, deterministic tests change how a team works: TDD becomes practical, CI takes seconds, and refactors are safe. That's bought entirely by the ports existing — the in-memory adapter just plugs in.",
        },
      ],
    },
    {
      id: "di-wiring",
      title: "Dependency Injection & Configuration",
      summary: "One composition root wires the app; everything else just declares needs.",
      minutes: 13,
      blocks: [
        {
          kind: "prose",
          markdown: `# Wiring an application

You've injected single dependencies. Real apps have graphs of them:

\`\`\`
UserService ─▶ Database
     └───────▶ Cache ─▶ (ttl from config)
\`\`\`

Two rules keep this sane:

1. **Components declare needs in their constructor** and never construct their
   own dependencies (no \`Database()\` inside \`UserService\`).
2. **One composition root** — a single \`build_app(config)\` function at the entry
   point — constructs everything, guided by config. It is the ONLY place that
   knows concrete classes.

\`\`\`python
def build_app(config):
    db = Postgres(config["dsn"]) if config["env"] == "prod" else FakeDb()
    cache = Cache(ttl=config["cache_ttl"])
    return UserService(db, cache)
\`\`\`

No framework required in Python — a function is a fine composition root.
(Config itself follows the same rule: parse it once at the edge into plain
values/objects; don't pass \`os.environ\` reads deep into the core.)`,
        },
        {
          kind: "runnable",
          title: "A composition root in action",
          code: `class RealDb:
    def fetch(self, uid): return {"id": uid, "name": f"user-{uid} (from prod db)"}

class FakeDb:
    def fetch(self, uid): return {"id": uid, "name": f"user-{uid} (fake)"}

class UserService:
    def __init__(self, db):
        self.db = db

    def display_name(self, uid):
        return self.db.fetch(uid)["name"].upper()

def build_app(config):                      # the composition root
    db = RealDb() if config["env"] == "prod" else FakeDb()
    return UserService(db)

print(build_app({"env": "prod"}).display_name(1))
print(build_app({"env": "test"}).display_name(1))

# Change what "test" means, add a staging env, swap the db vendor —
# all of it happens HERE, never inside UserService.`,
        },
        {
          kind: "challenge",
          title: "Wire a cached user service",
          prompt: `Build the three components and let injection do the layering:

- \`Database\` — \`.fetch(uid)\` returns \`{"id": uid}\` and **counts calls** in
  \`self.calls\` (starts at 0).
- \`Cache\` — \`.get(key)\` returns the stored value or \`None\`; \`.set(key, value)\`
  stores it.
- \`UserService(db, cache)\` — \`.get_user(uid)\`: return the cached user if
  present; otherwise fetch from the db, cache it, and return it.`,
          starterCode: `class Database:
    def __init__(self):
        pass

class Cache:
    def __init__(self):
        pass

class UserService:
    def __init__(self, db, cache):
        pass`,
          tests: [
            {
              name: "fetches and caches",
              assertion: `db, cache = Database(), Cache()
svc = UserService(db, cache)
assert svc.get_user(7) == {"id": 7}
assert db.calls == 1
assert cache.get(7) == {"id": 7}`,
            },
            {
              name: "cache hit skips the db",
              assertion: `db, cache = Database(), Cache()
svc = UserService(db, cache)
svc.get_user(7)
svc.get_user(7)
svc.get_user(7)
assert db.calls == 1`,
            },
            {
              name: "different users, different fetches",
              assertion: `db, cache = Database(), Cache()
svc = UserService(db, cache)
svc.get_user(1); svc.get_user(2); svc.get_user(1)
assert db.calls == 2`,
              hidden: true,
            },
          ],
          hints: [
            "Database: `self.calls = 0` in __init__; increment inside fetch.",
            "UserService.get_user: `hit = self.cache.get(uid)` — return it `if hit is not None`; else fetch, `cache.set`, return.",
          ],
          solution: `class Database:
    def __init__(self):
        self.calls = 0

    def fetch(self, uid):
        self.calls += 1
        return {"id": uid}

class Cache:
    def __init__(self):
        self.data = {}

    def get(self, key):
        return self.data.get(key)

    def set(self, key, value):
        self.data[key] = value

class UserService:
    def __init__(self, db, cache):
        self.db = db
        self.cache = cache

    def get_user(self, uid):
        hit = self.cache.get(uid)
        if hit is not None:
            return hit
        user = self.db.fetch(uid)
        self.cache.set(uid, user)
        return user`,
          xp: 90,
        },
        {
          kind: "quiz",
          question: "Why should `os.environ['DB_HOST']` be read in exactly one place (the composition root) instead of wherever it's needed?",
          options: [
            {
              text: "Scattered env reads are hidden inputs: they make components untestable without patching the environment and impossible to reuse with different settings in one process",
              correct: true,
            },
            { text: "Reading environment variables is slow" },
            { text: "os.environ is not thread-safe" },
            { text: "Environment variables can't hold secrets" },
          ],
          explanation:
            "Config reads are dependencies in disguise. Parsed once at the edge and passed in as plain values, they become visible, testable constructor arguments — the same DI story as every other dependency.",
        },
      ],
    },
    {
      id: "functional-composition",
      title: "Functional Pipeline Composition",
      summary: "Pure functions + composition: the architecture hiding inside every good pipeline.",
      minutes: 12,
      blocks: [
        {
          kind: "prose",
          markdown: `# Pipelines are function composition

A **pure function** returns the same output for the same input and touches
nothing outside itself — no I/O, no globals, no mutation of its arguments.

Pure transforms give a pipeline superpowers:

- **Testable** with plain values, no setup.
- **Rerunnable** — purity is idempotency for free.
- **Reorderable/parallelizable** — no hidden state to trip over.
- **Composable** — small steps snap together into big flows:

\`\`\`python
clean = compose(strip_whitespace, drop_empty, parse_amounts)
\`\`\`

This is precisely the model of dbt (models = pure SELECTs over inputs) and Spark
(transformations = pure functions over immutable DataFrames). Architect the
Python between them the same way: **pure core, I/O at the edges** — the
functional restatement of hexagonal architecture.`,
        },
        {
          kind: "runnable",
          title: "Compose small pure steps",
          code: `def compose(*fns):
    def composed(value):
        for fn in fns:
            value = fn(value)
        return value
    return composed

# Small, pure, boring — exactly what you want:
def strip_all(rows):   return [r.strip() for r in rows]
def drop_empty(rows):  return [r for r in rows if r]
def to_floats(rows):   return [float(r) for r in rows]

clean = compose(strip_all, drop_empty, to_floats)

raw = ["  3.5 ", "", " 7.25", "  ", "1.0 "]
print(clean(raw))

# Recompose freely — a different pipeline is a different composition:
just_text = compose(strip_all, drop_empty)
print(just_text(raw))`,
        },
        {
          kind: "challenge",
          title: "Implement compose",
          prompt: `Write \`compose(*fns)\`: it returns a **new function** that applies \`fns\`
left-to-right — \`compose(f, g)(x)\` is \`g(f(x))\`. With no functions at all,
the result returns its input unchanged.`,
          starterCode: `def compose(*fns):
    pass`,
          tests: [
            {
              name: "left to right",
              assertion: `f = compose(lambda x: x + 1, lambda x: x * 10)
assert f(2) == 30`,
            },
            {
              name: "order matters",
              assertion: `g = compose(lambda x: x * 10, lambda x: x + 1)
assert g(2) == 21`,
            },
            {
              name: "identity when empty",
              assertion: `assert compose()("anything") == "anything"`,
            },
            {
              name: "composes compositions",
              assertion: `inner = compose(str.strip, str.lower)
outer = compose(inner, lambda s: s + "!")
assert outer("  HELLO  ") == "hello!"`,
              hidden: true,
            },
          ],
          hints: [
            "Define an inner function that loops over fns, threading the value through.",
            "Return the inner function — compose is a function that builds functions.",
          ],
          solution: `def compose(*fns):
    def composed(value):
        for fn in fns:
            value = fn(value)
        return value
    return composed`,
          xp: 80,
        },
        {
          kind: "quiz",
          question: "Which function is PURE?",
          options: [
            { text: "def tax(amount, rate): return round(amount * rate, 2)", correct: true },
            { text: "def load(rows): db.insert(rows); return len(rows)" },
            { text: "def stamp(row): row['at'] = datetime.now(); return row" },
            { text: "def next_id(): COUNTER[0] += 1; return COUNTER[0]" },
          ],
          explanation:
            "Only `tax` depends solely on its inputs and touches nothing else. `load` does I/O, `stamp` mutates its argument AND reads the clock, `next_id` mutates a global. Each impurity is a reason a rerun might behave differently — poison for pipelines.",
        },
      ],
    },
    {
      id: "reliability",
      title: "Idempotency, Retries & Reliability",
      summary: "Design for the rerun: the patterns that make 3am failures boring.",
      minutes: 14,
      blocks: [
        {
          kind: "prose",
          markdown: `# Everything fails; design for the rerun

Networks blip, pods die, APIs rate-limit. Reliable pipelines assume it:

## Idempotency (the non-negotiable)

*Running twice = running once.* The write patterns:

- **Upsert / MERGE by key** — instead of blind INSERT (you built this in the
  warehouse module).
- **Delete-then-insert the partition** — recompute a day? Wipe exactly that day
  first, then write it.
- **Idempotency keys** — dedupe requests/events by a caller-supplied unique key.

## Retries — with judgment

- Retry only **transient** errors (timeouts, 429/503) — never data bugs; a
  malformed row will fail identically all 5 times.
- **Exponential backoff + jitter** (1s, 2s, 4s…±random) so a struggling service
  isn't stampeded by synchronized retriers.
- Retrying a **non-idempotent** operation is how you double-charge a customer —
  idempotency comes first, retries second.

Beyond these two: **timeouts** on every external call, **circuit breakers**
(stop calling a dying service), and **dead-letter queues** (park poison
messages; keep the stream flowing).`,
        },
        {
          kind: "runnable",
          title: "Idempotent vs non-idempotent writes",
          code: `import random

# A flaky operation: fails ~half the time.
random.seed(42)
def flaky_fetch():
    if random.random() < 0.5:
        raise TimeoutError("network blip")
    return "payload"

def retry(fn, attempts=5):
    for i in range(1, attempts + 1):
        try:
            result = fn()
            print(f"  attempt {i}: success")
            return result
        except TimeoutError as e:
            print(f"  attempt {i}: {e} — retrying")
    raise RuntimeError("all retries exhausted")

print("retrying a flaky call:")
print("got:", retry(flaky_fetch))

# Why idempotency must come FIRST:
store = {}
def naive_append(key, amount):          # NOT idempotent
    store.setdefault(key, 0)
    store[key] += amount

def upsert(key, amount):                # idempotent: same call, same end state
    store[key] = amount

store.clear()
naive_append("order-7", 100); naive_append("order-7", 100)   # a retry double-counts!
print("after retried append:", store)

store.clear()
upsert("order-7", 100); upsert("order-7", 100)               # a retry is harmless
print("after retried upsert:", store)`,
        },
        {
          kind: "challenge",
          title: "Write retry()",
          prompt: `Implement \`retry(fn, attempts)\`:

- Call \`fn()\`; on success return its result immediately.
- If it raises, try again — up to \`attempts\` total calls.
- If every attempt raises, re-raise the **last** exception.
- \`attempts\` is at least 1.`,
          starterCode: `def retry(fn, attempts):
    pass`,
          tests: [
            {
              name: "succeeds on the 3rd try",
              assertion: `state = {"calls": 0}
def flaky():
    state["calls"] += 1
    if state["calls"] < 3:
        raise ValueError("boom")
    return "ok"
assert retry(flaky, attempts=5) == "ok"
assert state["calls"] == 3`,
            },
            {
              name: "no wasted calls after success",
              assertion: `state = {"calls": 0}
def fine():
    state["calls"] += 1
    return 42
assert retry(fine, attempts=3) == 42
assert state["calls"] == 1`,
            },
            {
              name: "exhausted retries re-raise",
              assertion: `state = {"calls": 0}
def doomed():
    state["calls"] += 1
    raise KeyError("always")
try:
    retry(doomed, attempts=2)
    assert False, "should have raised"
except KeyError:
    assert state["calls"] == 2`,
            },
          ],
          hints: [
            "Loop `attempts` times; return inside try, remember the exception in except.",
            "After the loop, `raise last_error` (or use `raise` from the final except).",
          ],
          solution: `def retry(fn, attempts):
    last_error = None
    for _ in range(attempts):
        try:
            return fn()
        except Exception as e:
            last_error = e
    raise last_error`,
          xp: 90,
        },
        {
          kind: "quiz",
          question: "A payment API call timed out — but the charge MAY have gone through. What makes it safe to retry?",
          options: [
            {
              text: "An idempotency key on the request: the server dedupes, so a retried charge with the same key can't double-bill",
              correct: true,
            },
            { text: "Waiting long enough that the first request must have expired" },
            { text: "Retrying with a smaller amount" },
            { text: "Nothing — timeouts must never be retried" },
          ],
          explanation:
            "A timeout means UNKNOWN outcome — the request might have succeeded. Only idempotency (server-side dedupe by key) makes retry-on-unknown safe. Stripe-style APIs and exactly-once stream processing are built on exactly this.",
        },
      ],
    },
    {
      id: "choosing-architecture",
      title: "Choosing an Architecture",
      summary: "Script → modular pipeline → orchestrated platform: evolve, don't over-build.",
      minutes: 11,
      blocks: [
        {
          kind: "prose",
          markdown: `# Architecture is a sequence of *earned* upgrades

## Stage 1 — the script
One file, runs on cron. **Correct choice** for one source, one output, one
maintainer. Even here: pure functions inside, config at the top, idempotent
writes.

## Stage 2 — the modular pipeline
The script grew. Split by responsibility (extract / transform / load modules),
inject the I/O (test the transforms!), add logging and retries. Still one
process — just one you can reason about. Most teams should live here longer
than they think.

## Stage 3 — the orchestrated platform
Many pipelines, dependencies between them, SLAs, backfills, on-call. Now an
orchestrator (Airflow module ahead), layered warehouse, dbt for transforms,
alerting, lineage. The patterns you've learned are the survival kit at this
scale — hexagonal edges, DI, idempotency everywhere.

## Choosing rules

1. **Choose for current scale +1, not +10.** A startup with a Kafka + Spark +
   Kubernetes platform for 100 MB/day bought pure ops burden.
2. **Migrations are the norm** — the pure-core/adapters split is what makes
   stage upgrades cheap.
3. **Boring beats novel.** Postgres + Python + cron correctly beats an
   exotic stack incorrectly — every time.`,
        },
        {
          kind: "quiz",
          question:
            "A 3-person team loads two APIs into Postgres nightly (~200 MB) for one dashboard. The 'right' architecture is…",
          options: [
            {
              text: "Stage 1–2: a modular Python job on a scheduler, pure transforms, idempotent MERGE writes — no cluster, no orchestrator yet",
              correct: true,
            },
            { text: "Kafka + Spark Structured Streaming + a lakehouse, to be future-proof" },
            { text: "A microservice per API with a message bus between them" },
            { text: "Manual weekly CSV exports until the team grows" },
          ],
          explanation:
            "Match the architecture to the workload and the team. The good news: written with pure transforms and injected I/O, this job upgrades to Stage 3 later by *rehosting*, not rewriting.",
        },
        {
          kind: "quiz",
          question: "Which single practice most reduces the cost of the Stage 2 → Stage 3 migration?",
          options: [
            {
              text: "Keeping transformation logic pure and I/O behind interfaces — the orchestrator swap then touches only the edges",
              correct: true,
            },
            { text: "Writing the Stage 2 pipeline in the orchestrator's DSL from day one" },
            { text: "Avoiding tests until the architecture stabilizes" },
            { text: "Choosing the same language for every future component" },
          ],
          explanation:
            "Airflow (or any orchestrator) wants small, idempotent, injectable tasks — exactly what hexagonal + functional design produces. The architecture patterns weren't academic: they're what makes growth a refactor instead of a rewrite.",
        },
      ],
    },
  ],
};
