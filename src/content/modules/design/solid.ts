import type { Module } from "../../../types/lesson";

// SOLID principles — fully runnable: every principle is shown as working Python in
// Pyodide, with refactor-to-pass-the-tests challenges. Examples use data-pipeline
// flavored code so the principles land where this curriculum's learner works.
export const solid: Module = {
  id: "solid",
  title: "SOLID Principles",
  blurb: "Five principles that keep growing codebases changeable — hands-on in Python.",
  track: "Software Design",
  level: "Intermediate",
  icon: "📐",
  status: "deep",
  lessons: [
    {
      id: "why-design",
      title: "Why Design Principles?",
      summary: "Coupling, cohesion, and the real cost of change.",
      minutes: 10,
      blocks: [
        {
          kind: "prose",
          markdown: `# Why design principles?

Code is read and **changed** far more often than it is written. Design quality is
simply: *how expensive is the next change?* Two forces decide that:

- **Coupling** — how much one piece *knows about* another. High coupling means a
  change here breaks things over there.
- **Cohesion** — how much the contents of one piece *belong together*. Low
  cohesion means every change has to touch this file for unrelated reasons.

**Goal: low coupling, high cohesion.** SOLID is five concrete rules for getting
there:

| Letter | Principle | One-liner |
|---|---|---|
| **S** | Single Responsibility | one reason to change per unit |
| **O** | Open/Closed | extend behavior without editing working code |
| **L** | Liskov Substitution | subtypes must honor the base type's promises |
| **I** | Interface Segregation | no forced dependence on methods you don't use |
| **D** | Dependency Inversion | depend on abstractions, not concrete details |

These matter *more* in data engineering, not less: pipelines live for years,
sources get swapped, formats change, and the 3am incident is always in the
tangled job nobody dares touch.`,
        },
        {
          kind: "runnable",
          title: "Feel the coupling",
          code: `# This report function is coupled to EVERYTHING: the data layout, the
# business rule, the formatting, and the output channel.
def report(orders):
    total = 0
    for o in orders:
        if o[2] == "paid":            # coupled to tuple positions
            total += o[1] * 0.9       # business rule buried inline
    print("REVENUE: $" + str(round(total, 2)))   # coupled to stdout + format

orders = [("a1", 100, "paid"), ("a2", 50, "pending"), ("a3", 200, "paid")]
report(orders)

# Now imagine the asks: "also write it to a file", "the discount changed",
# "orders are dicts now". Every single one edits THIS function. That's the smell.`,
        },
        {
          kind: "quiz",
          question: "A module has high cohesion when…",
          options: [
            { text: "everything inside it changes together, for the same kind of reason", correct: true },
            { text: "it imports many other modules" },
            { text: "it contains as much functionality as possible" },
            { text: "other modules depend heavily on it" },
          ],
          explanation:
            "Cohesion is about belonging: a `pricing.py` where every function is about pricing is cohesive. A `utils.py` with date helpers, SQL strings, and email code is not — unrelated reasons to change pile up in one place.",
        },
        {
          kind: "quiz",
          question: "Which change signals HIGH coupling?",
          options: [
            {
              text: "Renaming a field in the orders dict breaks the report, the loader, and the alerting module",
              correct: true,
            },
            { text: "Adding a new module requires writing new tests" },
            { text: "A bugfix in one function requires redeploying the service" },
            { text: "Two modules import the standard library" },
          ],
          explanation:
            "Blast radius is the tell: when one local change detonates in distant modules, those modules know too much about each other's internals. The fixes are interfaces/abstractions — the rest of this module.",
        },
      ],
    },
    {
      id: "single-responsibility",
      title: "S — Single Responsibility",
      summary: "One reason to change: split the god-function into cohesive parts.",
      minutes: 13,
      blocks: [
        {
          kind: "prose",
          markdown: `# Single Responsibility Principle

> A module/class/function should have **one reason to change**.

"Responsibility" = a *source of change requests*. The finance team changes the
revenue rule; the platform team changes storage; the analysts change the report
format. If all three land in the same function, they trample each other — and you
can't test one without the others.

The refactor is almost mechanical:

1. Name each responsibility (parse / validate / compute / format / write).
2. Extract each into its own function or class.
3. Compose them at the edge.

Small, single-purpose units are independently testable, reusable, and safe to
change — the payoff for every other principle builds on this one.`,
        },
        {
          kind: "runnable",
          title: "Before / after",
          code: `# BEFORE — three responsibilities in one place:
def do_everything(rows):
    parsed = [(r.split(",")[0], float(r.split(",")[1])) for r in rows]   # parsing
    total = sum(amount for _, amount in parsed)                          # computing
    return f"TOTAL: {total:.2f}"                                          # formatting

# AFTER — one job each, composed:
def parse(rows):
    return [(name, float(amount)) for name, amount in (r.split(",") for r in rows)]

def total(records):
    return sum(amount for _, amount in records)

def fmt(value):
    return f"TOTAL: {value:.2f}"

rows = ["ana,100.5", "bob,49.5"]
print(do_everything(rows))
print(fmt(total(parse(rows))))   # same output, three testable pieces

# The payoff: total() is now trivially testable, parse() reusable,
# and a format change touches ONLY fmt().`,
        },
        {
          kind: "challenge",
          title: "Split the god-function",
          prompt: `This job grew into one blob (see the comment in the starter). Refactor it into
three single-purpose functions:

- \`filter_paid(orders)\` → only the orders whose \`"status"\` is \`"paid"\`
- \`revenue(orders)\` → the sum of their \`"amount"\` values
- \`summary(orders)\` → the string \`"<n> paid orders, revenue <r>"\` where \`n\`
  is the paid count and \`r\` is the revenue of the paid orders

\`summary\` must be built **by calling the other two**.`,
          starterCode: `# The blob you're replacing looked like:
#   def do_report(orders):
#       t = 0; n = 0
#       for o in orders:
#           if o["status"] == "paid":
#               n += 1; t += o["amount"]
#       return str(n) + " paid orders, revenue " + str(t)

def filter_paid(orders):
    pass

def revenue(orders):
    pass

def summary(orders):
    pass`,
          tests: [
            {
              name: "filter_paid",
              assertion: `orders = [{"status": "paid", "amount": 10}, {"status": "pending", "amount": 5}]
assert filter_paid(orders) == [{"status": "paid", "amount": 10}]`,
            },
            {
              name: "revenue",
              assertion: `orders = [{"status": "paid", "amount": 10}, {"status": "paid", "amount": 15}]
assert revenue(filter_paid(orders)) == 25`,
            },
            {
              name: "summary",
              assertion: `orders = [
    {"status": "paid", "amount": 10},
    {"status": "pending", "amount": 99},
    {"status": "paid", "amount": 30},
]
assert summary(orders) == "2 paid orders, revenue 40"`,
            },
            {
              name: "empty",
              assertion: `assert summary([]) == "0 paid orders, revenue 0"`,
              hidden: true,
            },
          ],
          hints: [
            "`filter_paid` is a list comprehension with a condition.",
            "`revenue` should just sum `o['amount']` — let callers decide what to filter first.",
            "In `summary`, call `filter_paid` once, then use `len(...)` and `revenue(...)` on the result.",
          ],
          solution: `def filter_paid(orders):
    return [o for o in orders if o["status"] == "paid"]

def revenue(orders):
    return sum(o["amount"] for o in orders)

def summary(orders):
    paid = filter_paid(orders)
    return f"{len(paid)} paid orders, revenue {revenue(paid)}"`,
          xp: 70,
        },
        {
          kind: "quiz",
          question: "Which class violates SRP most clearly?",
          options: [
            {
              text: "OrderManager: validates orders, saves them to the DB, emails receipts, and renders the admin HTML",
              correct: true,
            },
            { text: "OrderValidator: checks required fields and amount ranges" },
            { text: "OrderRepository: reads and writes orders to storage" },
            { text: "ReceiptEmailer: formats and sends receipt emails" },
          ],
          explanation:
            "Four different teams could demand changes to OrderManager (business rules, DBA, comms, frontend). The other three each answer to one master — that's the principle in class form.",
        },
      ],
    },
    {
      id: "open-closed",
      title: "O — Open/Closed",
      summary: "Add behavior by adding code, not by editing working code.",
      minutes: 13,
      blocks: [
        {
          kind: "prose",
          markdown: `# Open/Closed Principle

> Software should be **open for extension, closed for modification**.

The smell is the growing \`if/elif\` chain:

\`\`\`python
def export(data, format):
    if format == "csv": ...
    elif format == "json": ...
    elif format == "xml": ...      # every new format EDITS this function
\`\`\`

Each edit risks the formats that already worked, and the function bloats forever.

The fix: define an **extension point** — a shape (interface) that variants
implement — and make the core code depend only on the shape. New behavior then
arrives as a *new class/function*, and the core never changes. In Python the shape
can be a base class, a \`Protocol\`, or just a passed-in callable.`,
        },
        {
          kind: "runnable",
          title: "An extension point instead of an if-chain",
          code: `class CsvExporter:
    def export(self, rows):
        header = ",".join(rows[0].keys())
        lines = [",".join(str(v) for v in r.values()) for r in rows]
        return "\\n".join([header] + lines)

class JsonExporter:
    def export(self, rows):
        import json
        return json.dumps(rows)

def run_export(rows, exporter):        # ← closed: never edited again
    return exporter.export(rows)

rows = [{"name": "ana", "amount": 100}, {"name": "bob", "amount": 50}]
print(run_export(rows, CsvExporter()))
print(run_export(rows, JsonExporter()))

# Need XML next sprint? Write XmlExporter. run_export stays untouched —
# and every already-shipped exporter stays un-broken.`,
        },
        {
          kind: "challenge",
          title: "Pluggable discounts",
          prompt: `Build a checkout that's closed for modification, open for new discount types:

- \`PercentDiscount(pct)\` — \`.apply(price)\` returns the price reduced by
  \`pct\` percent.
- \`FixedDiscount(amount)\` — \`.apply(price)\` subtracts \`amount\`, but never
  goes below \`0\`.
- \`checkout(price, discounts)\` — applies each discount **in order** and
  returns the final price. It must work with ANY object that has \`.apply\`.`,
          starterCode: `class PercentDiscount:
    def __init__(self, pct):
        pass

class FixedDiscount:
    def __init__(self, amount):
        pass

def checkout(price, discounts):
    pass`,
          tests: [
            {
              name: "percent",
              assertion: `assert PercentDiscount(10).apply(100) == 90`,
            },
            {
              name: "fixed floors at zero",
              assertion: `assert FixedDiscount(15).apply(100) == 85
assert FixedDiscount(500).apply(100) == 0`,
            },
            {
              name: "checkout chains in order",
              assertion: `assert checkout(200, [PercentDiscount(50), FixedDiscount(20)]) == 80`,
            },
            {
              name: "open for extension",
              assertion: `class Freebie:
    def apply(self, price):
        return 0
assert checkout(999, [Freebie()]) == 0`,
              hidden: true,
            },
          ],
          hints: [
            "Each discount stores its parameter in __init__ and implements apply(price).",
            "checkout is a loop: `for d in discounts: price = d.apply(price)`.",
            "The hidden test passes a brand-new discount type — that only works if checkout knows nothing about concrete classes.",
          ],
          solution: `class PercentDiscount:
    def __init__(self, pct):
        self.pct = pct

    def apply(self, price):
        return price * (100 - self.pct) / 100

class FixedDiscount:
    def __init__(self, amount):
        self.amount = amount

    def apply(self, price):
        return max(0, price - self.amount)

def checkout(price, discounts):
    for d in discounts:
        price = d.apply(price)
    return price`,
          xp: 80,
        },
        {
          kind: "quiz",
          question: "Your pipeline must support a new source system next month. In an Open/Closed design, that lands as…",
          options: [
            { text: "a new Connector class implementing the existing interface — zero edits to the pipeline core", correct: true },
            { text: "a new elif branch in the pipeline's source-dispatch function" },
            { text: "a feature flag inside the existing connector" },
            { text: "a copy of the pipeline with the new source hardcoded" },
          ],
          explanation:
            "The core depends on the connector *shape*; sources are plug-ins. The if-chain version means re-testing every existing source each time one is added — the exact risk OCP eliminates.",
        },
      ],
    },
    {
      id: "liskov",
      title: "L — Liskov Substitution",
      summary: "A subclass must keep its base class's promises — watch one break them.",
      minutes: 13,
      blocks: [
        {
          kind: "prose",
          markdown: `# Liskov Substitution Principle

> Anywhere the code expects a base type, **any subtype must work** — without the
> caller knowing or caring which one it got.

Inheritance promises substitutability. A subclass breaks LSP when it:

- **raises** where the base succeeded (\`NotSupportedError\` in an override),
- **narrows inputs** (base accepted any list; child demands non-empty),
- **weakens outputs** (base guaranteed sorted results; child doesn't),
- silently **does nothing** where the base did something.

The classic tell: \`isinstance\` checks sprinkled through calling code — the caller
has started defending itself against its own type hierarchy.

The fix is usually to **restructure the hierarchy** so every subtype genuinely
can honor the contract (or to use composition instead).`,
        },
        {
          kind: "runnable",
          title: "Watch a subclass break the contract",
          code: `class Storage:
    def save(self, key, value):
        """Store value; return True on success."""
        raise NotImplementedError

class MemoryStorage(Storage):
    def __init__(self):
        self.data = {}

    def save(self, key, value):
        self.data[key] = value
        return True

class AuditLogStorage(Storage):          # append-only: overwrites forbidden!
    def __init__(self):
        self.data = {}

    def save(self, key, value):
        if key in self.data:
            raise PermissionError("audit logs are immutable")   # ← breaks LSP
        self.data[key] = value
        return True

def checkpoint(storage):
    # Written against Storage's contract: save() returns True. Retries are normal.
    storage.save("state", "step-1")
    storage.save("state", "step-2")      # same key again — base contract allows it
    return "checkpointed"

print(checkpoint(MemoryStorage()))       # fine
try:
    print(checkpoint(AuditLogStorage())) # KABOOM — substitution failed
except PermissionError as e:
    print("broken substitution:", e)`,
        },
        {
          kind: "quiz",
          question: "In the demo above, what's the correct design fix?",
          options: [
            {
              text: "Don't make AuditLogStorage a Storage — give append-only stores their own type (e.g. AppendOnlyStorage with an append() contract)",
              correct: true,
            },
            { text: "Make checkpoint() catch PermissionError and skip the save" },
            { text: "Add `if isinstance(storage, AuditLogStorage)` inside checkpoint()" },
            { text: "Make save() return False instead of raising" },
          ],
          explanation:
            "If a subtype *can't* keep the promise, it isn't a subtype — the hierarchy is wrong, not the caller. Options B and C push the defense into every caller forever; that's the LSP-violation tax.",
        },
        {
          kind: "challenge",
          title: "Fix the bird hierarchy",
          prompt: `The classic: \`Bird.fly()\` + \`Penguin(Bird)\` = a crash waiting in every flock.
Restructure it:

- \`Bird\` — base class with \`move()\` returning \`"walking"\`.
- \`FlyingBird(Bird)\` — overrides \`move()\` to return \`"flying"\`.
- \`Sparrow(FlyingBird)\` — inherits flying as-is.
- \`Penguin(Bird)\` — overrides \`move()\` to return \`"swimming"\`.

Every bird must respond to \`move()\` — no bird raises, no caller checks types.`,
          starterCode: `# Broken version (do NOT keep this shape):
#   class Bird:
#       def fly(self): return "flying"
#   class Penguin(Bird):
#       def fly(self): raise RuntimeError("penguins can't fly!")

class Bird:
    pass`,
          tests: [
            {
              name: "every bird moves",
              assertion: `assert Bird().move() == "walking"
assert Sparrow().move() == "flying"
assert Penguin().move() == "swimming"`,
            },
            {
              name: "substitution works on a flock",
              assertion: `flock = [Bird(), Sparrow(), Penguin()]
assert [b.move() for b in flock] == ["walking", "flying", "swimming"]`,
            },
            {
              name: "hierarchy is honest",
              assertion: `assert isinstance(Sparrow(), FlyingBird)
assert isinstance(Penguin(), Bird)
assert not isinstance(Penguin(), FlyingBird)`,
              hidden: true,
            },
          ],
          hints: [
            "The base contract must be something EVERY bird can honor: move(), not fly().",
            "Flying is the specialization — it belongs on FlyingBird, not on Bird.",
          ],
          solution: `class Bird:
    def move(self):
        return "walking"

class FlyingBird(Bird):
    def move(self):
        return "flying"

class Sparrow(FlyingBird):
    pass

class Penguin(Bird):
    def move(self):
        return "swimming"`,
          xp: 80,
        },
      ],
    },
    {
      id: "interface-segregation",
      title: "I — Interface Segregation",
      summary: "Many small interfaces beat one fat one — no forced fake methods.",
      minutes: 12,
      blocks: [
        {
          kind: "prose",
          markdown: `# Interface Segregation Principle

> No client should be forced to depend on methods it does not use.

The smell: a fat base class where implementors stub out half the methods —

\`\`\`python
class Connector:                # "the" interface for everything
    def read(self): ...
    def write(self, data): ...
    def stream(self): ...

class S3ReadOnlyConnector(Connector):
    def read(self): ...
    def write(self, data): raise NotImplementedError   # forced lie
    def stream(self): raise NotImplementedError        # forced lie
\`\`\`

Every \`NotImplementedError\` stub is both an ISP violation *and* an LSP landmine.

The fix: **split by capability**. Small interfaces (\`Readable\`, \`Writable\`,
\`Streamable\`) that classes mix and match. Python gives you two clean tools:
multiple inheritance of small bases, and \`typing.Protocol\` (structural — a class
satisfies it just by having the methods).`,
        },
        {
          kind: "runnable",
          title: "Split by capability + Protocols",
          code: `from typing import Protocol

class Readable(Protocol):
    def read(self) -> list: ...

class Writable(Protocol):
    def write(self, data: list) -> int: ...

class CsvSource:                       # only reads — implements ONLY Readable
    def read(self):
        return [{"id": 1}, {"id": 2}]

class WarehouseTable:                  # reads and writes
    def __init__(self):
        self.rows = []
    def read(self):
        return self.rows
    def write(self, data):
        self.rows.extend(data)
        return len(data)

def copy_data(src: Readable, dst: Writable) -> int:
    return dst.write(src.read())

wt = WarehouseTable()
print("copied:", copy_data(CsvSource(), wt))
print("target now:", wt.read())

# CsvSource never had to fake a write() — and copy_data's signature documents
# exactly which capabilities it needs. That's ISP.`,
        },
        {
          kind: "challenge",
          title: "Un-fatten the worker interface",
          prompt: `A fat \`Worker\` base forced robots to implement \`eat()\`. Split it by capability:

- \`Workable\` — provides \`work()\` returning \`"working"\`.
- \`Eatable\` — provides \`eat()\` returning \`"eating"\`.
- \`Human(Workable, Eatable)\` — both capabilities.
- \`Robot(Workable)\` — works, and has **no** \`eat\` attribute at all.`,
          starterCode: `# Broken fat interface (don't keep):
#   class Worker:
#       def work(self): return "working"
#       def eat(self): raise NotImplementedError  # robots forced to carry this

class Workable:
    pass

class Eatable:
    pass`,
          tests: [
            {
              name: "human does both",
              assertion: `h = Human()
assert h.work() == "working" and h.eat() == "eating"`,
            },
            {
              name: "robot works",
              assertion: `assert Robot().work() == "working"`,
            },
            {
              name: "robot is not forced to eat",
              assertion: `assert not hasattr(Robot(), "eat")`,
            },
            {
              name: "capabilities are real classes",
              assertion: `assert isinstance(Human(), Workable) and isinstance(Human(), Eatable)
assert isinstance(Robot(), Workable) and not isinstance(Robot(), Eatable)`,
              hidden: true,
            },
          ],
          hints: [
            "Define work() on Workable and eat() on Eatable.",
            "Python multiple inheritance: `class Human(Workable, Eatable): pass`.",
          ],
          solution: `class Workable:
    def work(self):
        return "working"

class Eatable:
    def eat(self):
        return "eating"

class Human(Workable, Eatable):
    pass

class Robot(Workable):
    pass`,
          xp: 70,
        },
        {
          kind: "quiz",
          question: "Which symptom points at an ISP violation in a codebase?",
          options: [
            {
              text: "Several implementations of an interface raise NotImplementedError (or pass) for the same subset of methods",
              correct: true,
            },
            { text: "An interface has only one implementation" },
            { text: "A class implements two different interfaces" },
            { text: "An interface's methods all take many parameters" },
          ],
          explanation:
            "When multiple implementors consistently can't honor the same methods, those methods belong to a *different* interface. The fat interface forced a dependency its clients never wanted — that's the definition of the violation.",
        },
      ],
    },
    {
      id: "dependency-inversion",
      title: "D — Dependency Inversion",
      summary: "High-level policy shouldn't import low-level detail — inject it.",
      minutes: 13,
      blocks: [
        {
          kind: "prose",
          markdown: `# Dependency Inversion Principle

> High-level modules should not depend on low-level modules. **Both should depend
> on abstractions.**

Without it, your business logic hard-codes its infrastructure:

\`\`\`python
class ReportJob:
    def run(self):
        db = PostgresClient("prod-host")     # ← constructed inside!
        s3 = S3Client("prod-bucket")         # ← untestable, unswappable
        ...
\`\`\`

You can't unit-test \`ReportJob\` without a real database, and moving to a new
store rewrites business logic.

**Inverted**: the job declares *what it needs* (something with \`fetch()\`,
something with \`save()\`) and receives it — **dependency injection** through the
constructor. Production wires real clients; tests wire fakes. In Python no
framework is needed: constructor parameters ARE the injection mechanism.

This principle is the backbone of testable pipelines — and of every "swap
Postgres for BigQuery" migration that went smoothly.`,
        },
        {
          kind: "runnable",
          title: "Constructor injection in action",
          code: `class EmailSender:                       # low-level detail #1
    def send(self, to, body):
        return f"EMAIL to {to}: {body}"

class SlackSender:                       # low-level detail #2
    def send(self, to, body):
        return f"SLACK {to}: {body}"

class AlertService:                      # high-level policy
    def __init__(self, sender):          # ← depends on "something with .send"
        self.sender = sender

    def alert_failure(self, job_name):
        return self.sender.send("on-call", f"{job_name} FAILED")

print(AlertService(EmailSender()).alert_failure("nightly-load"))
print(AlertService(SlackSender()).alert_failure("nightly-load"))

# And the unit test needs no email server at all:
class FakeSender:
    def __init__(self): self.sent = []
    def send(self, to, body):
        self.sent.append((to, body)); return "ok"

fake = FakeSender()
AlertService(fake).alert_failure("test-job")
print("captured by test double:", fake.sent)`,
        },
        {
          kind: "challenge",
          title: "Invert the report service",
          prompt: `Build a storage-agnostic report publisher:

- \`MemoryStorage\` — \`.save(name, content)\` stores in a dict and returns \`True\`;
  \`.load(name)\` returns the stored content (or \`None\` if missing).
- \`ReportService(storage)\` — takes ANY storage via the constructor.
  \`.publish(name, rows)\` formats the rows as \`"<n> rows"\` (n = \`len(rows)\`),
  saves that string under \`name\`, and returns the formatted string.`,
          starterCode: `class MemoryStorage:
    def __init__(self):
        pass

class ReportService:
    def __init__(self, storage):
        pass`,
          tests: [
            {
              name: "storage works",
              assertion: `s = MemoryStorage()
assert s.save("a", "hello") is True
assert s.load("a") == "hello"
assert s.load("missing") is None`,
            },
            {
              name: "publish saves through the injected storage",
              assertion: `s = MemoryStorage()
svc = ReportService(s)
assert svc.publish("daily", [1, 2, 3]) == "3 rows"
assert s.load("daily") == "3 rows"`,
            },
            {
              name: "any storage will do",
              assertion: `class SpyStorage:
    def __init__(self): self.calls = []
    def save(self, name, content):
        self.calls.append((name, content)); return True
spy = SpyStorage()
ReportService(spy).publish("x", [])
assert spy.calls == [("x", "0 rows")]`,
              hidden: true,
            },
          ],
          hints: [
            "MemoryStorage: a dict in __init__; save stores and returns True; load uses .get(name).",
            "ReportService stores the injected storage and calls self.storage.save(...) in publish.",
          ],
          solution: `class MemoryStorage:
    def __init__(self):
        self.data = {}

    def save(self, name, content):
        self.data[name] = content
        return True

    def load(self, name):
        return self.data.get(name)

class ReportService:
    def __init__(self, storage):
        self.storage = storage

    def publish(self, name, rows):
        content = f"{len(rows)} rows"
        self.storage.save(name, content)
        return content`,
          xp: 80,
        },
        {
          kind: "quiz",
          question: "What does the 'inversion' in Dependency Inversion actually invert?",
          options: [
            {
              text: "The direction of dependency: instead of policy → concrete detail, both point at an abstraction the policy defines",
              correct: true,
            },
            { text: "The order in which modules are imported" },
            { text: "Control flow — callbacks instead of loops" },
            { text: "The class hierarchy — children become parents" },
          ],
          explanation:
            "Classically, high-level code imports low-level code. DIP flips the arrow: the high level owns the interface ('something with .send'), and low-level implementations conform to it. The detail now depends on the policy's abstraction — inverted.",
        },
      ],
    },
    {
      id: "solid-capstone",
      title: "Capstone: Refactor a Messy Pipeline",
      summary: "Apply S, O, and D at once to a realistic blob.",
      minutes: 16,
      blocks: [
        {
          kind: "prose",
          markdown: `# Capstone

Here's a blob every data engineer has inherited:

\`\`\`python
def run(lines):
    total = 0
    for line in lines:
        parts = line.split(",")
        if parts[0] != "" and float(parts[1]) >= 0:      # validation, inline
            amount = float(parts[1])
            if amount > 100:
                amount = amount * 1.1                     # business rule, inline
            total += amount
    return total
\`\`\`

Parsing, validation, transformation, and aggregation — welded together. You'll
rebuild it as four small units plus a composition function whose **steps are
injected**, so tomorrow's rule change is a new function, not an edit.

This is SRP (four units), OCP + DIP (the pipeline takes its steps as parameters),
all in ~20 lines.`,
        },
        {
          kind: "challenge",
          title: "The full refactor",
          prompt: `Rebuild the blob as composable parts:

- \`parse_row(line)\` — \`"ana,150"\` → \`{"name": "ana", "amount": 150.0}\`
- \`is_valid(record)\` — \`True\` only if \`name\` is non-empty **and**
  \`amount >= 0\`
- \`apply_bonus(record)\` — returns a **new** dict; if \`amount > 100\`,
  the new amount is \`amount * 1.1\`, otherwise unchanged
- \`run_pipeline(lines, parse, valid, transform)\` — parses every line, keeps the
  valid records, transforms them, and returns the **sum of the amounts**

\`run_pipeline\` must use ONLY its injected functions — no direct calls to the
three above.`,
          starterCode: `def parse_row(line):
    pass

def is_valid(record):
    pass

def apply_bonus(record):
    pass

def run_pipeline(lines, parse, valid, transform):
    pass`,
          tests: [
            {
              name: "parse_row",
              assertion: `assert parse_row("ana,150") == {"name": "ana", "amount": 150.0}`,
            },
            {
              name: "is_valid",
              assertion: `assert is_valid({"name": "ana", "amount": 50.0})
assert not is_valid({"name": "", "amount": 50.0})
assert not is_valid({"name": "bob", "amount": -1.0})`,
            },
            {
              name: "apply_bonus",
              assertion: `assert abs(apply_bonus({"name": "a", "amount": 200.0})["amount"] - 220.0) < 1e-9
assert apply_bonus({"name": "a", "amount": 50.0})["amount"] == 50.0`,
            },
            {
              name: "the composed pipeline",
              assertion: `result = run_pipeline(["ana,150", "bob,50", ",-3"], parse_row, is_valid, apply_bonus)
assert abs(result - 215.0) < 1e-9`,
            },
            {
              name: "steps are truly injected",
              assertion: `assert run_pipeline(["a,10", "b,20"], parse_row, is_valid, lambda r: r) == 30.0
assert run_pipeline(["a,10"], parse_row, lambda r: False, apply_bonus) == 0`,
              hidden: true,
            },
          ],
          hints: [
            "parse_row: split on ',', name is parts[0], amount is float(parts[1]).",
            "apply_bonus must NOT mutate its input — build a new dict (e.g. `{**record, 'amount': ...}`).",
            "run_pipeline: parse all → filter with valid → map with transform → sum the amounts. Use only the parameters!",
          ],
          solution: `def parse_row(line):
    name, amount = line.split(",")
    return {"name": name, "amount": float(amount)}

def is_valid(record):
    return record["name"] != "" and record["amount"] >= 0

def apply_bonus(record):
    amount = record["amount"]
    if amount > 100:
        amount = amount * 1.1
    return {**record, "amount": amount}

def run_pipeline(lines, parse, valid, transform):
    records = [parse(line) for line in lines]
    kept = [r for r in records if valid(r)]
    transformed = [transform(r) for r in kept]
    return sum(r["amount"] for r in transformed)`,
          xp: 120,
        },
        {
          kind: "quiz",
          question:
            "Next sprint: 'weekend orders get a flat 5% bonus instead'. In your refactored design, that change is…",
          options: [
            {
              text: "a new transform function passed to run_pipeline — parse, validation, and aggregation are untouched and can't regress",
              correct: true,
            },
            { text: "an edit inside run_pipeline's loop" },
            { text: "a subclass of run_pipeline" },
            { text: "a new elif in apply_bonus" },
          ],
          explanation:
            "That's the whole payoff: the pipeline is closed for modification, the rule is an injected strategy, and each unit's tests keep protecting the parts that didn't change.",
        },
      ],
    },
  ],
};
