import type { Module } from "../../types/lesson";

// Production Python — the engineering layer between "knows Python" and "ships
// pipelines": typing, real error handling, generators, context managers, file
// I/O (Pyodide has a real filesystem!), testing, and data validation.
export const pythonEngineering: Module = {
  id: "python-engineering",
  title: "Python Engineering",
  blurb: "Type hints, exceptions done right, generators, context managers, files, testing.",
  level: "Intermediate",
  icon: "🛠️",
  status: "deep",
  lessons: [
    {
      id: "type-hints",
      title: "Type Hints",
      summary: "Annotations that document, that editors check, that bugs fear.",
      minutes: 12,
      blocks: [
        {
          kind: "prose",
          markdown: `# Type hints

Python stays dynamic — hints don't change runtime behavior — but they give you:

- **documentation that can't go stale** (it sits on the signature),
- **editor superpowers** (completion, refactors), and
- **static checking** (mypy/pyright catch bugs before any test runs).

\`\`\`python
def load_orders(path: str, limit: int | None = None) -> list[dict[str, float]]:
    ...
\`\`\`

The vocabulary that covers 95% of real code:

| Hint | Means |
|---|---|
| \`int | None\` | maybe-missing values (the old \`Optional[int]\`) |
| \`list[str]\`, \`dict[str, float]\` | typed containers |
| \`tuple[int, str]\` | fixed-shape tuples |
| \`Callable[[int], str]\` | a function taking int, returning str |
| \`TypedDict\` | a dict with known keys/types (record-shaped data!) |
| \`Protocol\` | structural interfaces — your ISP lesson, statically checked |

For a data engineer the payoff concentrates at **boundaries**: functions that
pass records around. \`dict\` says nothing; \`OrderRecord\` (a TypedDict) says
everything.`,
        },
        {
          kind: "runnable",
          title: "Hints in action (and what they don't do)",
          code: `from typing import TypedDict

class Order(TypedDict):
    id: int
    amount: float
    status: str

def total_paid(orders: list[Order]) -> float:
    return sum(o["amount"] for o in orders if o["status"] == "paid")

orders: list[Order] = [
    {"id": 1, "amount": 100.0, "status": "paid"},
    {"id": 2, "amount": 55.5,  "status": "pending"},
    {"id": 3, "amount": 20.0,  "status": "paid"},
]
print(total_paid(orders))

# Hints are NOT enforced at runtime — this "wrong" call still runs:
print(total_paid([]))          # fine
result: int = total_paid(orders)   # mypy would flag: float assigned to int
print("runtime doesn't care:", result)
# A type checker (mypy/pyright) is what turns annotations into guarantees.`,
        },
        {
          kind: "quiz",
          question: "`def f(x: int) -> str` is called as `f(\"hello\")` and runs without error. Why?",
          options: [
            {
              text: "Hints are metadata: Python ignores them at runtime — only a static checker (mypy/pyright) or editor reports the mismatch",
              correct: true,
            },
            { text: "Python auto-converted the string to int" },
            { text: "The annotation was syntactically invalid so it was skipped" },
            { text: "It would error — annotated functions validate arguments" },
          ],
          explanation:
            "Gradual typing is Python's deal: annotations are optional, checked out-of-band, and free at runtime. (Libraries like pydantic *choose* to enforce them at runtime — that's the validation lesson later.)",
        },
        {
          kind: "quiz",
          question: "A function may return a user dict OR nothing-found. The honest signature is…",
          options: [
            { text: "def find_user(uid: int) -> User | None — callers are forced to handle the None case", correct: true },
            { text: "def find_user(uid: int) -> User — return {} when missing" },
            { text: "def find_user(uid) — no hint avoids the problem" },
            { text: "def find_user(uid: int) -> object" },
          ],
          explanation:
            "`| None` makes absence part of the contract, and type checkers then refuse code that uses the result without checking. The dishonest alternatives (empty dicts, hidden Nones) become the NoneType-has-no-attribute crash three modules away.",
        },
      ],
    },
    {
      id: "errors-done-right",
      title: "Errors Done Right",
      summary: "Custom exceptions, raise-from, and failing loudly with context.",
      minutes: 13,
      blocks: [
        {
          kind: "prose",
          markdown: `# Error handling beyond try/except

The basics you know; production code adds three habits:

**1. Custom exception types** — so callers can catch YOUR failures precisely:

\`\`\`python
class ConfigError(Exception):
    """Bad or missing pipeline configuration."""

try:
    cfg = parse_config(text)
except ConfigError:      # catches exactly this — not every bug in parse_config
    use_defaults()
\`\`\`

**2. \`raise ... from err\`** — translate low-level errors without destroying the
evidence:

\`\`\`python
try:
    value = int(raw)
except ValueError as err:
    raise ConfigError(f"port must be a number, got {raw!r}") from err
\`\`\`

The traceback shows BOTH: your domain error and the original cause underneath.

**3. Catch narrowly, fail loudly.** \`except Exception: pass\` is how pipelines
"succeed" with half the data (the silent failures from the Data Quality module).
Catch the specific type you can actually handle; let the rest crash the task —
the orchestrator's retry exists for exactly that.`,
        },
        {
          kind: "runnable",
          title: "Exception chaining preserves the evidence",
          code: `class ConfigError(Exception):
    pass

def parse_port(raw):
    try:
        return int(raw)
    except ValueError as err:
        raise ConfigError(f"port must be a number, got {raw!r}") from err

try:
    parse_port("eighty")
except ConfigError as e:
    print("caught:", e)
    print("caused by:", type(e.__cause__).__name__, "-", e.__cause__)

# Compare the anti-pattern — the cause is destroyed:
def parse_port_bad(raw):
    try:
        return int(raw)
    except ValueError:
        raise ConfigError("bad config")        # which field? what value? gone.

try:
    parse_port_bad("eighty")
except ConfigError as e:
    print("\\nanti-pattern:", e, "| cause preserved?", e.__cause__ is not None)`,
        },
        {
          kind: "challenge",
          title: "A config parser with real errors",
          prompt: `Build a small config parser:

- Define \`class ConfigError(Exception)\`.
- \`parse_config(text)\` — \`text\` has one \`key=value\` pair per line (skip blank
  lines). Every value must parse as an **int**. Return a dict \`{key: int}\`.
- A line without \`=\` raises \`ConfigError\` mentioning the line.
- A non-integer value raises \`ConfigError\` **chained from** the original
  \`ValueError\` (use \`raise ... from err\`).`,
          starterCode: `class ConfigError(Exception):
    pass

def parse_config(text):
    pass`,
          tests: [
            {
              name: "parses valid config",
              assertion: `assert parse_config("port=8080\\nworkers=4") == {"port": 8080, "workers": 4}`,
            },
            {
              name: "skips blank lines",
              assertion: `assert parse_config("a=1\\n\\nb=2\\n") == {"a": 1, "b": 2}`,
            },
            {
              name: "missing = raises ConfigError",
              assertion: `try:
    parse_config("just-a-word")
    assert False, "expected ConfigError"
except ConfigError:
    pass`,
            },
            {
              name: "bad int raises chained ConfigError",
              assertion: `try:
    parse_config("port=eighty")
    assert False, "expected ConfigError"
except ConfigError as e:
    assert isinstance(e.__cause__, ValueError)`,
            },
          ],
          hints: [
            "Loop over text.splitlines(); `if not line.strip(): continue`.",
            "`if '=' not in line: raise ConfigError(...)`; else split on '=' once.",
            "Wrap `int(value)` in try/except ValueError and re-raise `from err`.",
          ],
          solution: `class ConfigError(Exception):
    pass

def parse_config(text):
    config = {}
    for line in text.splitlines():
        if not line.strip():
            continue
        if "=" not in line:
            raise ConfigError(f"invalid line: {line!r}")
        key, value = line.split("=", 1)
        try:
            config[key] = int(value)
        except ValueError as err:
            raise ConfigError(f"{key} must be an integer, got {value!r}") from err
    return config`,
          xp: 80,
        },
        {
          kind: "quiz",
          question: "A pipeline task wraps its whole body in `except Exception: log.warning(...)` and returns normally. What's the operational consequence?",
          options: [
            {
              text: "The orchestrator sees success: no retry, no alert, downstream runs on missing/partial data — the failure is laundered into silence",
              correct: true,
            },
            { text: "The task retries forever" },
            { text: "Memory leaks from unraised exceptions" },
            { text: "Nothing — logging is equivalent to failing" },
          ],
          explanation:
            "Retries, alerting, and blocked downstreams all key off the task FAILING. Swallowing exceptions disables the entire reliability machinery you configured. Crash loudly; that's what it's for.",
        },
      ],
    },
    {
      id: "generators",
      title: "Iterators & Generators",
      summary: "yield: process a million rows without holding a million rows.",
      minutes: 13,
      blocks: [
        {
          kind: "prose",
          markdown: `# Generators

A function with \`yield\` returns a **generator**: it produces values one at a
time, *on demand*, keeping only its current state in memory.

\`\`\`python
def read_events(lines):
    for line in lines:
        yield parse(line)        # one event in memory at a time
\`\`\`

Why this is THE data-processing idiom:

- **Constant memory**: a 10 GB file streams through a pipeline that never holds
  more than one record.
- **Composability**: generators chain into lazy pipelines —
  \`total(valid(parse(lines)))\` — where nothing computes until consumed.
  (Spark's lazy transformations are this idea, cluster-sized.)
- **Early exit for free**: \`next()\` / breaking a loop stops the whole upstream
  chain — no wasted work.

One sharp edge: generators are **single-use**. Iterate twice and the second
pass sees nothing.`,
        },
        {
          kind: "visualized",
          title: "Watch lazy evaluation happen",
          code: `def numbers():
    for n in [1, 2, 3, 4]:
        yield n * 10

gen = numbers()          # nothing has run yet!
a = next(gen)            # runs JUST far enough to yield 10
b = next(gen)            # resumes, yields 20
rest = list(gen)         # drains the remainder
print(a, b, rest)`,
        },
        {
          kind: "runnable",
          title: "A lazy pipeline with constant memory",
          code: `def parse(lines):
    for line in lines:
        name, amount = line.split(",")
        yield {"name": name, "amount": float(amount)}

def only_valid(records):
    for r in records:
        if r["amount"] >= 0:
            yield r

def running_total(records):
    total = 0.0
    for r in records:
        total += r["amount"]
        yield r["name"], round(total, 2)

lines = ["ana,120.5", "bob,-3", "carla,80", "dan,49.5"]

# Three chained generators — NOTHING executes until the for-loop pulls:
pipeline = running_total(only_valid(parse(lines)))
for name, total in pipeline:
    print(f"after {name}: {total}")

# Single-use! The pipeline is now exhausted:
print("second pass sees:", list(pipeline))`,
        },
        {
          kind: "challenge",
          title: "Implement chunked()",
          prompt: `Loading rows one-by-one is slow; loading all-at-once blows memory. The classic
middle path: batches. Write the **generator function** \`chunked(items, size)\`
that yields consecutive lists of up to \`size\` items (the last chunk may be
smaller).`,
          starterCode: `def chunked(items, size):
    pass`,
          tests: [
            {
              name: "even chunks",
              assertion: `assert list(chunked([1, 2, 3, 4], 2)) == [[1, 2], [3, 4]]`,
            },
            {
              name: "ragged tail",
              assertion: `assert list(chunked([1, 2, 3, 4, 5], 2)) == [[1, 2], [3, 4], [5]]`,
            },
            {
              name: "it's actually a generator (lazy)",
              assertion: `gen = chunked([1, 2, 3], 1)
assert hasattr(gen, "__next__")
assert next(gen) == [1]`,
            },
            {
              name: "empty input yields nothing",
              assertion: `assert list(chunked([], 3)) == []`,
              hidden: true,
            },
          ],
          hints: [
            "Accumulate into a batch list; `yield` it when len(batch) == size and start fresh.",
            "After the loop, yield the leftover batch if it's non-empty.",
          ],
          solution: `def chunked(items, size):
    batch = []
    for item in items:
        batch.append(item)
        if len(batch) == size:
            yield batch
            batch = []
    if batch:
        yield batch`,
          xp: 80,
        },
        {
          kind: "quiz",
          question: "`data = (parse(l) for l in lines)` then `list(data)` twice — the second list is empty. Why?",
          options: [
            {
              text: "Generators are one-shot iterators: the first list() consumed every value; the exhausted generator has nothing left",
              correct: true,
            },
            { text: "The generator expression had a syntax error" },
            { text: "list() deletes the source data" },
            { text: "Generator expressions cap at one evaluation per scope" },
          ],
          explanation:
            "Need multiple passes? Materialize once (`rows = list(gen)`) or rebuild the generator. This bites everyone exactly once — usually inside a debugging session where the print 'ate' the data.",
        },
      ],
    },
    {
      id: "context-managers",
      title: "Context Managers",
      summary: "with-blocks: guaranteed cleanup — then build your own.",
      minutes: 12,
      blocks: [
        {
          kind: "prose",
          markdown: `# Context managers

\`with\` guarantees setup/teardown around a block — **even when it raises**:

\`\`\`python
with open("data.csv") as f:     # file closes no matter what
    process(f)
\`\`\`

Anything with \`__enter__\` / \`__exit__\` works:

\`\`\`python
class Timer:
    def __enter__(self):
        self.start = time.perf_counter()
        return self                              # bound to the as-name

    def __exit__(self, exc_type, exc, tb):
        self.elapsed = time.perf_counter() - self.start
        return False                             # False = don't swallow errors
\`\`\`

Or the shortcut for simple cases:

\`\`\`python
from contextlib import contextmanager

@contextmanager
def timer():
    start = time.perf_counter()
    yield                                        # ← the with-block runs here
    print(f"took {time.perf_counter() - start:.3f}s")
\`\`\`

Data-engineering uses everywhere: connections and cursors, transactions
(commit on success / rollback on error — your challenge), temp resources,
timing blocks, \`pytest.raises\`.`,
        },
        {
          kind: "runnable",
          title: "Cleanup survives exceptions",
          code: `class Resource:
    def __enter__(self):
        print("  acquired")
        return self

    def __exit__(self, exc_type, exc, tb):
        print(f"  released (exception inside: {exc_type.__name__ if exc_type else 'none'})")
        return False        # let exceptions propagate

print("happy path:")
with Resource():
    print("  working…")

print("\\ncrash path:")
try:
    with Resource():
        raise RuntimeError("boom mid-work")
except RuntimeError as e:
    print("caught outside:", e)
# 'released' printed BEFORE the exception escaped — that's the guarantee.`,
        },
        {
          kind: "challenge",
          title: "A transactional dict",
          prompt: `Build \`Transaction\` — a context manager giving all-or-nothing semantics over a
dict:

- \`Transaction(store)\` wraps a dict.
- \`__enter__\` snapshots the dict's current contents and returns \`store\` (so
  the with-block mutates it directly).
- \`__exit__\`: if the block raised, **restore the snapshot** (roll back) and let
  the exception propagate; if it succeeded, keep the changes.`,
          starterCode: `class Transaction:
    def __init__(self, store):
        pass

    def __enter__(self):
        pass

    def __exit__(self, exc_type, exc, tb):
        pass`,
          tests: [
            {
              name: "commit on success",
              assertion: `store = {"a": 1}
with Transaction(store) as s:
    s["b"] = 2
assert store == {"a": 1, "b": 2}`,
            },
            {
              name: "rollback on error",
              assertion: `store = {"a": 1}
try:
    with Transaction(store) as s:
        s["a"] = 999
        s["b"] = 2
        raise RuntimeError("boom")
except RuntimeError:
    pass
assert store == {"a": 1}`,
            },
            {
              name: "exceptions still propagate",
              assertion: `store = {}
raised = False
try:
    with Transaction(store):
        raise ValueError("must escape")
except ValueError:
    raised = True
assert raised`,
              hidden: true,
            },
          ],
          hints: [
            "Snapshot with `dict(self.store)` in __enter__.",
            "In __exit__: if exc_type is not None → `self.store.clear(); self.store.update(snapshot)`.",
            "Return False (or None) from __exit__ so exceptions propagate.",
          ],
          solution: `class Transaction:
    def __init__(self, store):
        self.store = store

    def __enter__(self):
        self.snapshot = dict(self.store)
        return self.store

    def __exit__(self, exc_type, exc, tb):
        if exc_type is not None:
            self.store.clear()
            self.store.update(self.snapshot)
        return False`,
          xp: 90,
        },
        {
          kind: "quiz",
          question: "What does returning True from `__exit__` do — and why is it usually wrong?",
          options: [
            {
              text: "It SWALLOWS the exception (the with-block's error never propagates) — a blanket True turns every bug into silence, the except-pass anti-pattern in disguise",
              correct: true,
            },
            { text: "It re-raises the exception with more context" },
            { text: "It marks the resource as successfully closed" },
            { text: "It retries the with-block once" },
          ],
          explanation:
            "Return True only for specific, expected exceptions you genuinely handle (contextlib.suppress exists for that). Default to False/None: clean up, then get out of the way.",
        },
      ],
    },
    {
      id: "files-pathlib",
      title: "Files & pathlib",
      summary: "Real file I/O — reading, writing, CSVs, and paths as objects.",
      minutes: 12,
      blocks: [
        {
          kind: "prose",
          markdown: `# Files, done the modern way

(Pyodide gives you a real in-memory filesystem — everything here actually runs.)

**pathlib** treats paths as objects, replacing os.path string-surgery:

\`\`\`python
from pathlib import Path

p = Path("data") / "raw" / "orders.csv"    # joining with /
p.parent.mkdir(parents=True, exist_ok=True)
p.write_text("id,amount\\n1,99.5\\n")        # tiny files: one-liners
text = p.read_text()
p.suffix, p.stem                            # ".csv", "orders"
list(Path("data").glob("**/*.csv"))         # find files recursively
\`\`\`

For anything bigger than a one-liner, \`open\` inside \`with\` (context managers —
you know why), and the **csv** module instead of naive \`split(",")\` (real CSVs
have quoted commas):

\`\`\`python
import csv
with open(p, newline="") as f:
    for row in csv.DictReader(f):           # {"id": "1", "amount": "99.5"}
        ...
\`\`\`

Note: \`csv\` gives you **strings** — type conversion is your job (or pandas',
whose \`read_csv\` does this at scale).`,
        },
        {
          kind: "runnable",
          title: "A round-trip: write, discover, read, aggregate",
          code: `import csv
from pathlib import Path

base = Path("lake") / "raw"
base.mkdir(parents=True, exist_ok=True)

# Write two partitioned files (hello, lake layout):
(base / "orders_2026-07-01.csv").write_text("id,amount\\n1,100.5\\n2,49.5\\n")
(base / "orders_2026-07-02.csv").write_text("id,amount\\n3,200.0\\n")

# Discover + read them:
total = 0.0
for path in sorted(base.glob("orders_*.csv")):
    with open(path, newline="") as f:
        rows = list(csv.DictReader(f))
    day_total = sum(float(r["amount"]) for r in rows)
    print(f"{path.name}: {len(rows)} rows, {day_total}")
    total += day_total

print("grand total:", total)`,
        },
        {
          kind: "challenge",
          title: "Write and read a report",
          prompt: `Two functions (they must round-trip through a real file):

- \`write_report(path, rows)\` — \`rows\` is a list of \`(name, amount)\` tuples.
  Write one \`name,amount\` line per row to the file at \`path\`. Return the
  number of rows written.
- \`read_total(path)\` — read the file back and return the **sum of the
  amounts** as a float (0.0 for an empty file).`,
          starterCode: `def write_report(path, rows):
    pass

def read_total(path):
    pass`,
          tests: [
            {
              name: "round trip",
              assertion: `import tempfile, os
p = os.path.join(tempfile.gettempdir(), "pylearn_report_a.csv")
assert write_report(p, [("ana", 10.5), ("bob", 2.5)]) == 2
assert read_total(p) == 13.0
os.remove(p)`,
            },
            {
              name: "empty file",
              assertion: `import tempfile, os
p = os.path.join(tempfile.gettempdir(), "pylearn_report_b.csv")
write_report(p, [])
assert read_total(p) == 0.0
os.remove(p)`,
            },
            {
              name: "overwrites cleanly",
              assertion: `import tempfile, os
p = os.path.join(tempfile.gettempdir(), "pylearn_report_c.csv")
write_report(p, [("x", 100.0)])
write_report(p, [("y", 1.0)])
assert read_total(p) == 1.0
os.remove(p)`,
              hidden: true,
            },
          ],
          hints: [
            "Write mode 'w' truncates — that's what makes re-writes clean.",
            "Write: `f.write(f\"{name},{amount}\\n\")` per row, inside `with open(path, 'w') as f`.",
            "Read: split each non-empty line on ',' and sum float(parts[1]).",
          ],
          solution: `def write_report(path, rows):
    with open(path, "w") as f:
        for name, amount in rows:
            f.write(f"{name},{amount}\\n")
    return len(rows)

def read_total(path):
    total = 0.0
    with open(path) as f:
        for line in f:
            if line.strip():
                total += float(line.split(",")[1])
    return total`,
          xp: 80,
        },
        {
          kind: "quiz",
          question: "Why does parsing CSVs with `line.split(',')` eventually corrupt data?",
          options: [
            {
              text: "Quoted fields legally contain commas (`\"Bogotá, DC\"`) — naive splitting shears them apart; the csv module handles quoting/escaping correctly",
              correct: true,
            },
            { text: "split() is too slow for files" },
            { text: "CSV files use semicolons, never commas" },
            { text: "It doesn't — split is exactly what csv does internally" },
          ],
          explanation:
            "The classic time-bomb: works in every test, breaks the day an address or product name contains a comma — silently shifting every subsequent column. Use csv.DictReader (or pandas). Same story for hand-rolled JSON, dates, encodings…",
        },
      ],
    },
    {
      id: "testing",
      title: "Testing with pytest",
      summary: "Arrange-act-assert, parametrization, fixtures — and build a mini test runner.",
      minutes: 13,
      blocks: [
        {
          kind: "prose",
          markdown: `# pytest in one lesson

A test is a function named \`test_*\` making assertions; pytest finds and runs
them all:

\`\`\`python
# test_pricing.py
def test_discount_applies_over_100():
    order = make_order(amount=150)          # Arrange
    total = price(order)                    # Act
    assert total == 135.0                   # Assert

def test_negative_amount_rejected():
    with pytest.raises(ValueError):         # asserting on ERRORS
        price(make_order(amount=-5))
\`\`\`

The power features you'll use weekly:

- **Parametrize** — one test, many cases:
  \`@pytest.mark.parametrize("amount,expected", [(150, 135.0), (100, 100.0), (0, 0.0)])\`
- **Fixtures** — shared, composable setup with cleanup:
  \`def test_load(tmp_path): ...\` (pytest injects a fresh temp dir — dependency
  injection, again!).

What to test in data code: the **pure transforms** (your architecture made them
easy — plain values in, plain values out), the **edge cases** (empty input,
one row, duplicates, Nones), and the **failure behavior** (bad input raises the
right error). The in-app challenges you've been solving use exactly this
machinery: assertions run against your code.`,
        },
        {
          kind: "runnable",
          title: "The whole idea, executable",
          code: `# The code under test:
def price(amount):
    if amount < 0:
        raise ValueError("negative amount")
    return amount * 0.9 if amount > 100 else amount

# Tests are just asserting functions:
def test_discount_over_100():
    assert price(150) == 135.0

def test_no_discount_at_100():
    assert price(100) == 100

def test_negative_raises():
    try:
        price(-5)
        assert False, "should have raised"
    except ValueError:
        pass

# A 10-line pytest: find test_* functions, run, report.
for name, fn in sorted(globals().items()):
    if name.startswith("test_") and callable(fn):
        try:
            fn()
            print(f"PASS {name}")
        except AssertionError as e:
            print(f"FAIL {name}: {e}")`,
        },
        {
          kind: "challenge",
          title: "Build the mini test runner",
          prompt: `Formalize that loop: write \`run_tests(tests)\` where \`tests\` is a list of
callables.

- Call each one. No exception = pass. \`AssertionError\` = fail. Any **other**
  exception = error.
- Return \`{"passed": [...], "failed": [...], "errors": [...]}\` — each a list of
  the callables' \`__name__\`s, in the order given.`,
          starterCode: `def run_tests(tests):
    pass`,
          tests: [
            {
              name: "classifies pass/fail/error",
              assertion: `def test_ok():
    assert True
def test_bad():
    assert 1 == 2
def test_boom():
    raise RuntimeError("setup exploded")
out = run_tests([test_ok, test_bad, test_boom])
assert out == {"passed": ["test_ok"], "failed": ["test_bad"], "errors": ["test_boom"]}`,
            },
            {
              name: "one failure doesn't stop the run",
              assertion: `ran = []
def t1():
    ran.append(1); assert False
def t2():
    ran.append(2)
run_tests([t1, t2])
assert ran == [1, 2]`,
            },
            {
              name: "empty suite",
              assertion: `assert run_tests([]) == {"passed": [], "failed": [], "errors": []}`,
              hidden: true,
            },
          ],
          hints: [
            "try / except AssertionError / except Exception — order matters (AssertionError first!).",
            "Append `fn.__name__` to the right bucket; never let an exception escape the loop.",
          ],
          solution: `def run_tests(tests):
    result = {"passed": [], "failed": [], "errors": []}
    for fn in tests:
        try:
            fn()
            result["passed"].append(fn.__name__)
        except AssertionError:
            result["failed"].append(fn.__name__)
        except Exception:
            result["errors"].append(fn.__name__)
    return result`,
          xp: 90,
        },
        {
          kind: "quiz",
          question: "pytest distinguishes FAILED (assertion untrue) from ERROR (unexpected exception). Why does the distinction matter?",
          options: [
            {
              text: "A failure means the code's BEHAVIOR is wrong; an error means the test never got to check anything (broken setup/fixture) — they're debugged completely differently",
              correct: true,
            },
            { text: "Errors are counted double in the summary" },
            { text: "Failures re-run automatically, errors don't" },
            { text: "It's cosmetic — both mean 'red'" },
          ],
          explanation:
            "A failing assertion is information about the product; an erroring test is information about the TEST. Fixing the wrong one wastes the afternoon — your run_tests encodes the same triage.",
        },
      ],
    },
    {
      id: "validation",
      title: "Validating Data with Schemas",
      summary: "pydantic's idea, hand-rolled: declare the shape, enforce it at the boundary.",
      minutes: 13,
      blocks: [
        {
          kind: "prose",
          markdown: `# Schema validation

Type hints check your CODE statically. But data arriving at runtime — API
payloads, CSV rows, queue messages — needs **runtime** enforcement. That's
**pydantic**'s job:

\`\`\`python
from pydantic import BaseModel

class Order(BaseModel):
    id: int
    amount: float
    status: str = "pending"

Order(id="7", amount="99.5")     # coerces clean strings → Order(id=7, amount=99.5)
Order(id="x", amount=1)          # raises ValidationError, pointing at 'id'
\`\`\`

Declare the shape once; every construction validates. FastAPI, dbt artifacts,
and half the modern Python ecosystem run on this.

The mechanism is no magic: **check each field against a declared schema,
collect what's wrong.** You've written the per-column version (Data Quality);
now the per-record version — the last piece is naming which fields failed, so
the error message does the debugging for you.`,
        },
        {
          kind: "runnable",
          title: "A pydantic-style validator in 25 lines",
          code: `SCHEMA = {"id": int, "amount": float, "status": str}

def validate_order(record):
    problems = []
    for field, expected in SCHEMA.items():
        if field not in record:
            problems.append(f"{field}: missing")
        elif not isinstance(record[field], expected):
            got = type(record[field]).__name__
            problems.append(f"{field}: expected {expected.__name__}, got {got}")
    return problems

good = {"id": 7, "amount": 99.5, "status": "paid"}
bad  = {"id": "seven", "amount": 99.5}

print("good:", validate_order(good) or "valid ✔")
print("bad: ", validate_order(bad))

# At a pipeline boundary: split the batch, don't crash it.
batch = [good, bad, {"id": 8, "amount": 1.0, "status": "pending"}]
valid   = [r for r in batch if not validate_order(r)]
invalid = [r for r in batch if validate_order(r)]
print(f"\\n{len(valid)} valid → load; {len(invalid)} invalid → quarantine")`,
        },
        {
          kind: "challenge",
          title: "Write validate()",
          prompt: `Generalize it: \`validate(record, schema)\` where \`schema\` maps field names to
types.

- Return a **sorted list of field names** that are invalid: either **missing**
  from the record or of the **wrong type**.
- Extra fields in the record are fine (ignore them).
- Return \`[]\` for a fully valid record.`,
          starterCode: `def validate(record, schema):
    pass`,
          tests: [
            {
              name: "valid record",
              assertion: `assert validate({"name": "ana", "age": 30}, {"name": str, "age": int}) == []`,
            },
            {
              name: "missing field",
              assertion: `assert validate({"name": "ana"}, {"name": str, "age": int}) == ["age"]`,
            },
            {
              name: "wrong types, sorted",
              assertion: `assert validate({"name": 1, "age": "x"}, {"name": str, "age": int}) == ["age", "name"]`,
            },
            {
              name: "extra fields ignored",
              assertion: `assert validate({"name": "a", "age": 1, "extra": True}, {"name": str, "age": int}) == []`,
              hidden: true,
            },
          ],
          hints: [
            "Iterate over schema.items(), not the record — the schema defines what's required.",
            "Invalid = `field not in record or not isinstance(record[field], expected)`.",
            "Return `sorted(bad_fields)`.",
          ],
          solution: `def validate(record, schema):
    bad = []
    for field, expected in schema.items():
        if field not in record or not isinstance(record[field], expected):
            bad.append(field)
    return sorted(bad)`,
          xp: 90,
        },
        {
          kind: "quiz",
          question: "Where in a pipeline does schema validation pay off most, and why there?",
          options: [
            {
              text: "At ingestion — the boundary where untrusted data enters: rejecting/quarantining bad records early stops them from corrupting every layer downstream",
              correct: true,
            },
            { text: "At the dashboard, where users see the data" },
            { text: "Nowhere — the database types are validation enough" },
            { text: "Spread evenly through every function" },
          ],
          explanation:
            "The 'check at the boundaries' principle: one validated edge means everything inside can trust its inputs (and skip re-checking). It's the runtime mirror of typing your function boundaries — and it closes the loop with the Data Quality module.",
        },
      ],
    },
  ],
};
