import type { Module } from "../../types/lesson";

// Object-oriented Python — a "deep" module. Bridges the basics and the Software
// Design track: SOLID and design patterns assume everything taught here. Examples
// lean on data-engineering flavored objects (datasets, pipelines, connectors).
export const pythonOop: Module = {
  id: "python-oop",
  title: "Python OOP",
  blurb: "Classes, dunder methods, inheritance vs composition, dataclasses, properties.",
  level: "Intermediate",
  icon: "🏗️",
  status: "deep",
  lessons: [
    {
      id: "classes-objects",
      title: "Classes & Objects",
      summary: "Bundle data + behavior: __init__, self, attributes, and methods.",
      minutes: 12,
      blocks: [
        {
          kind: "prose",
          markdown: `# Classes & Objects

So far your data (lists, dicts) and your functions have lived apart. A **class**
bundles them: it describes a kind of object — what it *knows* (attributes) and what
it *does* (methods).

\`\`\`python
class Dataset:
    def __init__(self, name, rows):   # runs when you create an instance
        self.name = name              # attribute
        self.rows = rows

    def is_empty(self):               # method — self is THIS instance
        return len(self.rows) == 0
\`\`\`

- \`__init__\` is the **initializer**: it receives the new, empty object as \`self\`
  and fills in its attributes.
- \`self\` is not magic — it's just the instance, passed automatically:
  \`ds.is_empty()\` is really \`Dataset.is_empty(ds)\`.
- Each instance carries its **own** attribute values.`,
        },
        {
          kind: "runnable",
          title: "Define a class, create instances",
          code: `class Dataset:
    def __init__(self, name, rows):
        self.name = name
        self.rows = rows

    def row_count(self):
        return len(self.rows)

    def preview(self, n=2):
        return self.rows[:n]

sales = Dataset("sales", [("2026-01-01", 120), ("2026-01-02", 95), ("2026-01-03", 143)])
empty = Dataset("staging", [])

print(sales.name, "->", sales.row_count(), "rows")
print("preview:", sales.preview())
print(empty.name, "->", empty.row_count(), "rows")`,
        },
        {
          kind: "visualized",
          title: "Instances are separate objects — try the Objects view",
          code: `class Counter:
    def __init__(self):
        self.value = 0

    def bump(self):
        self.value += 1

a = Counter()
b = Counter()
a.bump()
a.bump()
b.bump()
print("a:", a.value)
print("b:", b.value)`,
        },
        {
          kind: "quiz",
          question: "Inside a method, what does `self` refer to?",
          options: [
            { text: "The class itself" },
            { text: "The instance the method was called on", correct: true },
            { text: "A copy of the instance" },
            { text: "The module the class is defined in" },
          ],
          explanation:
            "`ds.row_count()` is sugar for `Dataset.row_count(ds)` — Python passes the instance as the first argument, conventionally named `self`.",
        },
        {
          kind: "challenge",
          title: "Bank account",
          prompt: `Build a \`BankAccount\` class:

- \`BankAccount(balance)\` stores the starting balance in \`self.balance\`.
- \`.deposit(amount)\` adds to the balance.
- \`.withdraw(amount)\` subtracts — but raises \`ValueError\` if \`amount\` is greater
  than the current balance.`,
          starterCode: `class BankAccount:
    def __init__(self, balance):
        pass

    def deposit(self, amount):
        pass

    def withdraw(self, amount):
        pass`,
          tests: [
            {
              name: "deposit",
              assertion: `a = BankAccount(100)
a.deposit(50)
assert a.balance == 150`,
            },
            {
              name: "withdraw",
              assertion: `a = BankAccount(100)
a.withdraw(30)
assert a.balance == 70`,
            },
            {
              name: "overdraft raises",
              assertion: `a = BankAccount(10)
try:
    a.withdraw(1000)
    assert False, "expected ValueError"
except ValueError:
    assert a.balance == 10`,
              hidden: true,
            },
          ],
          hints: [
            "In `__init__`, assign the parameter to the instance: `self.balance = balance`.",
            "In `withdraw`, check first: `if amount > self.balance: raise ValueError(...)`.",
          ],
          solution: `class BankAccount:
    def __init__(self, balance):
        self.balance = balance

    def deposit(self, amount):
        self.balance += amount

    def withdraw(self, amount):
        if amount > self.balance:
            raise ValueError("insufficient funds")
        self.balance -= amount`,
          xp: 60,
        },
      ],
    },
    {
      id: "dunder-methods",
      title: "Dunder Methods",
      summary: "Make your objects feel built-in: __repr__, __eq__, __len__, operators.",
      minutes: 12,
      blocks: [
        {
          kind: "prose",
          markdown: `# Dunder ("double underscore") methods

Python's operators and built-ins are hooks. \`len(x)\` calls \`x.__len__()\`,
\`a == b\` calls \`a.__eq__(b)\`, \`a + b\` calls \`a.__add__(b)\`, and printing an
object in the console shows its \`__repr__\`.

Implement a few of these and your class behaves like a native type:

| You write | Python calls |
|---|---|
| \`repr(x)\`, REPL echo | \`x.__repr__()\` |
| \`str(x)\`, \`print(x)\` | \`x.__str__()\` (falls back to \`__repr__\`) |
| \`a == b\` | \`a.__eq__(b)\` |
| \`len(x)\` | \`x.__len__()\` |
| \`a + b\` | \`a.__add__(b)\` |
| \`x[i]\` | \`x.__getitem__(i)\` |

A good \`__repr__\` shows how to rebuild the object: \`Money(9.99, 'USD')\`.`,
        },
        {
          kind: "runnable",
          title: "Money that prints, compares, and adds",
          code: `class Money:
    def __init__(self, amount, currency):
        self.amount = amount
        self.currency = currency

    def __repr__(self):
        return f"Money({self.amount}, '{self.currency}')"

    def __eq__(self, other):
        return (self.amount, self.currency) == (other.amount, other.currency)

    def __add__(self, other):
        if self.currency != other.currency:
            raise ValueError("currency mismatch")
        return Money(self.amount + other.amount, self.currency)

a = Money(10, "USD")
b = Money(5, "USD")
print(a + b)                    # uses __add__ then __repr__
print(a == Money(10, "USD"))    # True thanks to __eq__
print(a == b)`,
        },
        {
          kind: "quiz",
          question: "Without a custom `__eq__`, what does `Money(10,'USD') == Money(10,'USD')` return?",
          options: [
            { text: "True — the attributes match" },
            { text: "False — default equality compares identity (are they the same object?)", correct: true },
            { text: "It raises TypeError" },
            { text: "It compares the __repr__ strings" },
          ],
          explanation:
            "Object equality defaults to `is` — same object in memory. Two separate instances are never equal until you define `__eq__`.",
        },
        {
          kind: "challenge",
          title: "A batch that feels native",
          prompt: `Create a \`Batch\` class wrapping a list of records:

- \`Batch(records)\` stores the list.
- \`len(batch)\` returns the number of records.
- \`batch[i]\` returns the i-th record.
- Two batches are \`==\` when their records are equal.`,
          starterCode: `class Batch:
    def __init__(self, records):
        pass`,
          tests: [
            {
              name: "len",
              assertion: `b = Batch([1, 2, 3])
assert len(b) == 3`,
            },
            {
              name: "indexing",
              assertion: `b = Batch(["a", "b"])
assert b[0] == "a" and b[1] == "b"`,
            },
            {
              name: "equality",
              assertion: `assert Batch([1, 2]) == Batch([1, 2])
assert not (Batch([1]) == Batch([2]))`,
              hidden: true,
            },
          ],
          hints: [
            "You need `__len__`, `__getitem__`, and `__eq__`.",
            "`__getitem__(self, i)` can simply return `self.records[i]`.",
          ],
          solution: `class Batch:
    def __init__(self, records):
        self.records = records

    def __len__(self):
        return len(self.records)

    def __getitem__(self, i):
        return self.records[i]

    def __eq__(self, other):
        return self.records == other.records`,
          xp: 60,
        },
      ],
    },
    {
      id: "inheritance",
      title: "Inheritance & super()",
      summary: "Share behavior through a base class; override and extend with super().",
      minutes: 12,
      blocks: [
        {
          kind: "prose",
          markdown: `# Inheritance

A subclass **is a** specialized version of its base class: it inherits every method,
and can **override** the ones it wants to change. \`super()\` reaches the base-class
version so you extend instead of replace.

\`\`\`python
class Connector:                    # base class
    def __init__(self, path):
        self.path = path

    def read(self):
        raise NotImplementedError   # subclasses must provide this

class CsvConnector(Connector):      # subclass
    def __init__(self, path, delimiter=","):
        super().__init__(path)      # run the base initializer too
        self.delimiter = delimiter

    def read(self):                 # override
        return f"reading {self.path} as CSV ({self.delimiter})"
\`\`\`

Use inheritance when the subclass truly *is* the base thing and callers can treat
them interchangeably. (The Software Design track pushes this much further.)`,
        },
        {
          kind: "runnable",
          title: "Subclasses behind one interface",
          code: `class Connector:
    def __init__(self, path):
        self.path = path

    def read(self):
        raise NotImplementedError

class CsvConnector(Connector):
    def read(self):
        return f"rows from CSV at {self.path}"

class JsonConnector(Connector):
    def read(self):
        return f"records from JSON at {self.path}"

# Caller code doesn't care WHICH connector it gets — that's the point.
for conn in [CsvConnector("sales.csv"), JsonConnector("events.json")]:
    print(type(conn).__name__, "->", conn.read())

print(isinstance(CsvConnector("x"), Connector))  # a CsvConnector IS a Connector`,
        },
        {
          kind: "quiz",
          question: "A subclass defines `__init__` but never calls `super().__init__(...)`. What happens?",
          options: [
            { text: "Python calls the base __init__ automatically afterwards" },
            { text: "The base __init__ never runs — attributes it would set are missing", correct: true },
            { text: "It raises TypeError at class definition time" },
            { text: "Nothing changes; __init__ can't be overridden" },
          ],
          explanation:
            "Defining `__init__` in the subclass replaces the base version. If the base one sets attributes you rely on, call `super().__init__(...)` explicitly.",
        },
        {
          kind: "challenge",
          title: "Notifier hierarchy",
          prompt: `You're given a base class (already in the starter — don't remove it). Add two
subclasses:

- \`EmailNotifier(Notifier)\` — \`send(msg)\` returns \`"EMAIL: " + msg\`
- \`SlackNotifier(Notifier)\` — \`send(msg)\` returns \`"SLACK: " + msg\`, and its
  constructor takes a \`channel\` **in addition to** \`name\`, stored as
  \`self.channel\` (keep \`name\` working via \`super()\`).`,
          starterCode: `class Notifier:
    def __init__(self, name):
        self.name = name

    def send(self, msg):
        raise NotImplementedError

# your subclasses here`,
          tests: [
            {
              name: "email",
              assertion: `e = EmailNotifier("alerts")
assert e.send("job done") == "EMAIL: job done"
assert e.name == "alerts"`,
            },
            {
              name: "slack",
              assertion: `s = SlackNotifier("alerts", "#data")
assert s.send("job failed") == "SLACK: job failed"
assert s.name == "alerts" and s.channel == "#data"`,
            },
            {
              name: "is-a",
              assertion: `assert isinstance(EmailNotifier("x"), Notifier)
assert isinstance(SlackNotifier("x", "#y"), Notifier)`,
              hidden: true,
            },
          ],
          hints: [
            "EmailNotifier only needs to override `send` — it can inherit `__init__` untouched.",
            "SlackNotifier's `__init__(self, name, channel)` should call `super().__init__(name)` first.",
          ],
          solution: `class Notifier:
    def __init__(self, name):
        self.name = name

    def send(self, msg):
        raise NotImplementedError

class EmailNotifier(Notifier):
    def send(self, msg):
        return "EMAIL: " + msg

class SlackNotifier(Notifier):
    def __init__(self, name, channel):
        super().__init__(name)
        self.channel = channel

    def send(self, msg):
        return "SLACK: " + msg`,
          xp: 70,
        },
      ],
    },
    {
      id: "composition",
      title: "Composition over Inheritance",
      summary: "Build objects out of parts (has-a) instead of deep class trees (is-a).",
      minutes: 11,
      blocks: [
        {
          kind: "prose",
          markdown: `# Composition over inheritance

Inheritance answers "what **is** this?"; composition answers "what does this
**have**?". Deep inheritance trees get brittle fast — a pipeline that *has* a list
of steps is far more flexible than a \`CsvUppercaseDedupePipeline\` subclass for
every combination.

\`\`\`python
class Pipeline:
    def __init__(self, steps):
        self.steps = steps          # HAS-A list of callables

    def run(self, value):
        for step in self.steps:
            value = step(value)
        return value
\`\`\`

Rule of thumb: reach for composition first. Use inheritance only when callers need
to treat the objects interchangeably through a shared interface.`,
        },
        {
          kind: "runnable",
          title: "A pipeline made of parts",
          code: `class Pipeline:
    def __init__(self, steps):
        self.steps = steps

    def run(self, value):
        for step in self.steps:
            value = step(value)
        return value

def strip(text):
    return text.strip()

def lower(text):
    return text.lower()

def collapse_spaces(text):
    return " ".join(text.split())

clean = Pipeline([strip, lower, collapse_spaces])
print(repr(clean.run("   Hello   DATA   World  ")))

# Recombine parts freely — no new subclass needed:
shout = Pipeline([strip, str.upper])
print(repr(shout.run("  quiet words  ")))`,
        },
        {
          kind: "quiz",
          question: "Which situation calls for composition rather than inheritance?",
          options: [
            {
              text: "A report object that needs a formatter, a data source, and a writer",
              correct: true,
            },
            { text: "A CsvConnector that is one kind of Connector" },
            { text: "A SlackNotifier that must be usable wherever a Notifier is expected" },
            { text: "Overriding one method of an otherwise identical base class" },
          ],
          explanation:
            "Formatter + source + writer are *parts* — swap any of them independently. That's has-a. The other options are genuine is-a relationships.",
        },
        {
          kind: "challenge",
          title: "Chainable pipeline",
          prompt: `Build a \`Pipeline\` class with a fluent interface:

- \`Pipeline()\` starts with no steps.
- \`.add(fn)\` appends a step **and returns the pipeline itself** so calls chain:
  \`p.add(f).add(g)\`.
- \`.run(value)\` feeds \`value\` through the steps in order and returns the result.
  With no steps, it returns \`value\` unchanged.`,
          starterCode: `class Pipeline:
    def __init__(self):
        pass

    def add(self, fn):
        pass

    def run(self, value):
        pass`,
          tests: [
            {
              name: "chains",
              assertion: `def add1(x): return x + 1
def times10(x): return x * 10
p = Pipeline().add(add1).add(times10)
assert p.run(2) == 30`,
            },
            {
              name: "order matters",
              assertion: `def add1(x): return x + 1
def times10(x): return x * 10
p = Pipeline().add(times10).add(add1)
assert p.run(2) == 21`,
            },
            {
              name: "empty",
              assertion: `assert Pipeline().run("unchanged") == "unchanged"`,
              hidden: true,
            },
          ],
          hints: [
            "Store steps in a list created in `__init__`.",
            "`add` must end with `return self` — that's what makes chaining work.",
          ],
          solution: `class Pipeline:
    def __init__(self):
        self.steps = []

    def add(self, fn):
        self.steps.append(fn)
        return self

    def run(self, value):
        for step in self.steps:
            value = step(value)
        return value`,
          xp: 70,
        },
      ],
    },
    {
      id: "dataclasses",
      title: "Dataclasses & NamedTuples",
      summary: "Kill the boilerplate: auto __init__, __repr__, __eq__ for record-like classes.",
      minutes: 10,
      blocks: [
        {
          kind: "prose",
          markdown: `# Dataclasses

Most data-engineering classes are records: a bag of named fields. \`@dataclass\`
writes \`__init__\`, \`__repr__\`, and \`__eq__\` for you from the field declarations.

\`\`\`python
from dataclasses import dataclass, field

@dataclass
class Order:
    id: int
    total: float
    status: str = "pending"          # default value
    tags: list = field(default_factory=list)  # NEVER a mutable default directly!

@dataclass(frozen=True)               # immutable — assignment raises
class Point:
    x: int
    y: int
\`\`\`

- \`field(default_factory=list)\` gives each instance its **own** list. A bare
  \`tags: list = []\` would be shared by every instance — a classic bug.
- \`frozen=True\` makes instances immutable (and therefore hashable — usable as
  dict keys, like tuples).
- \`typing.NamedTuple\` is the lighter cousin: immutable and iterable like a tuple.`,
        },
        {
          kind: "runnable",
          title: "Free __init__, __repr__, __eq__",
          code: `from dataclasses import dataclass, field

@dataclass
class Order:
    id: int
    total: float
    status: str = "pending"
    tags: list = field(default_factory=list)

a = Order(1, 99.5)
b = Order(1, 99.5)
print(a)                 # readable repr, for free
print(a == b)            # field-by-field equality, for free
a.tags.append("rush")
print(a.tags, b.tags)    # separate lists thanks to default_factory

@dataclass(frozen=True)
class Point:
    x: int
    y: int

p = Point(1, 2)
print({p: "origin-ish"})  # frozen => hashable => dict key
try:
    p.x = 99
except Exception as e:
    print("mutating a frozen dataclass:", type(e).__name__)`,
        },
        {
          kind: "quiz",
          question: "Why is `tags: list = []` dangerous in a dataclass (or as any default argument)?",
          options: [
            { text: "Empty lists are falsy so the field is skipped" },
            { text: "The same list object is shared by every instance that uses the default", correct: true },
            { text: "Lists can't be dataclass fields" },
            { text: "It only fails when frozen=True" },
          ],
          explanation:
            "Defaults are evaluated once. Every instance would append into the same list. `field(default_factory=list)` builds a fresh list per instance — dataclasses actually raise an error to protect you.",
        },
        {
          kind: "challenge",
          title: "Product record",
          prompt: `Define a dataclass \`Product\` with fields \`name: str\`, \`price: float\`, and
\`qty: int\` defaulting to \`1\`, plus a method \`total()\` returning \`price * qty\`.`,
          starterCode: `from dataclasses import dataclass

# define Product here`,
          tests: [
            {
              name: "fields + default",
              assertion: `p = Product("keyboard", 49.0)
assert p.name == "keyboard" and p.price == 49.0 and p.qty == 1`,
            },
            {
              name: "total",
              assertion: `assert Product("mouse", 10.0, 3).total() == 30.0`,
            },
            {
              name: "equality for free",
              assertion: `assert Product("a", 1.0) == Product("a", 1.0)`,
              hidden: true,
            },
          ],
          hints: [
            "Decorate with `@dataclass` and declare the three fields with type hints.",
            "Methods are defined normally inside the dataclass body.",
          ],
          solution: `from dataclasses import dataclass

@dataclass
class Product:
    name: str
    price: float
    qty: int = 1

    def total(self):
        return self.price * self.qty`,
          xp: 60,
        },
      ],
    },
    {
      id: "properties-classmethods",
      title: "Properties, classmethods & staticmethods",
      summary: "Computed attributes with validation, and alternative constructors.",
      minutes: 12,
      blocks: [
        {
          kind: "prose",
          markdown: `# Properties & the method decorators

**\`@property\`** turns a method into an attribute-style access — great for computed
values and for validating writes without changing the caller's code:

\`\`\`python
class Temperature:
    def __init__(self, celsius):
        self.celsius = celsius            # goes through the setter below!

    @property
    def celsius(self):
        return self._celsius

    @celsius.setter
    def celsius(self, value):
        if value < -273.15:
            raise ValueError("below absolute zero")
        self._celsius = value

    @property
    def fahrenheit(self):                 # computed, read-only
        return self._celsius * 9 / 5 + 32
\`\`\`

**\`@classmethod\`** receives the class (\`cls\`) instead of an instance — the idiom
for *alternative constructors* like \`Dataset.from_csv_line(...)\`.
**\`@staticmethod\`** receives neither — it's a plain function that lives on the
class for organization.`,
        },
        {
          kind: "runnable",
          title: "Validation + a computed attribute",
          code: `class Temperature:
    def __init__(self, celsius):
        self.celsius = celsius

    @property
    def celsius(self):
        return self._celsius

    @celsius.setter
    def celsius(self, value):
        if value < -273.15:
            raise ValueError("below absolute zero")
        self._celsius = value

    @property
    def fahrenheit(self):
        return self._celsius * 9 / 5 + 32

    @classmethod
    def from_fahrenheit(cls, f):
        return cls((f - 32) * 5 / 9)

t = Temperature(25)
print(t.celsius, "C =", t.fahrenheit, "F")   # attribute syntax, no ()

t.celsius = 30                                # runs the setter
print(t.fahrenheit)

boiling = Temperature.from_fahrenheit(212)    # alternative constructor
print(round(boiling.celsius, 1), "C")

try:
    Temperature(-500)
except ValueError as e:
    print("rejected:", e)`,
        },
        {
          kind: "quiz",
          question: "When is `@classmethod` the right tool?",
          options: [
            { text: "Any method that doesn't touch self" },
            {
              text: "Alternative constructors that build an instance from a different input shape",
              correct: true,
            },
            { text: "Methods that must not be overridden by subclasses" },
            { text: "Methods that need access to private attributes" },
          ],
          explanation:
            "`cls(...)` builds an instance of whatever class it's called on (subclasses included) — perfect for `from_csv_line`, `from_dict`, `from_config` style constructors. A method that touches neither self nor cls is a @staticmethod.",
        },
        {
          kind: "challenge",
          title: "Alternative constructor",
          prompt: `Build a \`Job\` class:

- \`Job(name, minutes)\` stores both attributes.
- A read-only property \`hours\` returns \`minutes / 60\`.
- A classmethod \`from_string(text)\` parses \`"name:minutes"\` (e.g. \`"etl:90"\`)
  and returns a \`Job\`.`,
          starterCode: `class Job:
    def __init__(self, name, minutes):
        pass`,
          tests: [
            {
              name: "hours property",
              assertion: `j = Job("etl", 90)
assert j.hours == 1.5`,
            },
            {
              name: "from_string",
              assertion: `j = Job.from_string("backfill:120")
assert j.name == "backfill" and j.minutes == 120 and j.hours == 2.0`,
            },
            {
              name: "property not a method",
              assertion: `assert Job("x", 30).hours == 0.5  # no parentheses`,
              hidden: true,
            },
          ],
          hints: [
            "Decorate `hours` with `@property` so it's accessed without parentheses.",
            "In `from_string`, use `text.split(':')`, convert minutes with `int(...)`, and `return cls(name, minutes)`.",
          ],
          solution: `class Job:
    def __init__(self, name, minutes):
        self.name = name
        self.minutes = minutes

    @property
    def hours(self):
        return self.minutes / 60

    @classmethod
    def from_string(cls, text):
        name, minutes = text.split(":")
        return cls(name, int(minutes))`,
          xp: 70,
        },
        {
          kind: "flashcards",
          title: "OOP — the terms that matter",
          cards: [
            { front: "`self`", back: "The instance the method was called on. Python passes it automatically; you name it `self` by convention in every method's first parameter." },
            { front: "`__init__` vs `__repr__`", back: "`__init__` builds/initializes a new instance; `__repr__` returns the developer-facing string shown in the REPL and by `repr()`." },
            { front: "Inheritance vs composition", back: "Inheritance = **is-a** (Dog is an Animal). Composition = **has-a** (a Car has an Engine). Prefer composition when you just need behavior, not identity." },
            { front: "`super().__init__(...)`", back: "Calls the parent class's method — used in a subclass `__init__` to run the base setup before adding your own." },
            { front: "`@dataclass`", back: "Auto-generates `__init__`, `__repr__`, and `__eq__` from typed class attributes — removes boilerplate for record-like classes." },
            { front: "`@property`", back: "Exposes a method as if it were an attribute (`obj.area`, no parens) — for computed or validated values." },
            { front: "`@classmethod` vs `@staticmethod`", back: "`@classmethod` takes `cls` (alternative constructors like `from_string`); `@staticmethod` takes neither `self` nor `cls` — just a namespaced function." },
          ],
        },
      ],
    },
    {
      id: "abstractions",
      title: "ABCs, Protocols & Enums",
      summary: "Define interfaces two ways (nominal ABCs vs structural Protocols) and model fixed sets with Enum.",
      minutes: 15,
      blocks: [
        {
          kind: "prose",
          markdown: `# Interfaces & fixed value sets

Three tools for expressing *contracts* in your types:

**Abstract Base Classes (\`abc\`)** — declare methods a subclass **must** implement.
An ABC can't be instantiated directly, and forgetting an \`@abstractmethod\` is an error
at construction time. This is **nominal** typing: you opt in by *inheriting*.

**Protocols (\`typing.Protocol\`)** — **structural** typing (static duck typing). Any object
with the right methods satisfies the protocol — no inheritance required. Great for "anything
with an \`.area()\`" without forcing a base class on unrelated types.

**Enums (\`enum.Enum\`)** — a fixed set of named constants (statuses, priorities, directions).
Safer and more readable than bare strings or magic numbers, and iterable.

| | Opt-in by | Checked | Use when |
|---|---|---|---|
| **ABC** | inheritance | at instantiation | you own the hierarchy and want to enforce it |
| **Protocol** | just having the methods | by the type checker | you accept types you don't control |`,
        },
        {
          kind: "runnable",
          title: "An ABC you can't instantiate until it's complete",
          code: `from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...

class Circle(Shape):
    def __init__(self, r): self.r = r
    def area(self): return 3.14159 * self.r ** 2

print("circle area:", round(Circle(2).area(), 2))

try:
    Shape()                       # abstract — can't instantiate
except TypeError as e:
    print("blocked:", e)`,
        },
        {
          kind: "runnable",
          title: "A Protocol: structural typing, no inheritance",
          code: `from typing import Protocol

class HasArea(Protocol):
    def area(self) -> float: ...

def describe(obj: HasArea) -> str:
    return f"area is {obj.area():.2f}"

class Square:                     # note: does NOT inherit HasArea
    def __init__(self, s): self.s = s
    def area(self): return self.s * self.s

print(describe(Square(3)))        # works: Square structurally has .area()`,
        },
        {
          kind: "runnable",
          title: "Enum: a fixed set of named values",
          code: `from enum import Enum

class Status(Enum):
    PENDING = "pending"
    PAID = "paid"
    REFUNDED = "refunded"

s = Status.PAID
print(s, "| name:", s.name, "| value:", s.value)
print("lookup by value:", Status("refunded"))
print("all members:", [m.name for m in Status])`,
        },
        {
          kind: "quiz",
          question:
            "What's the key difference between an abstract base class and a `typing.Protocol`?",
          options: [
            {
              text: "An ABC enforces the interface via inheritance (nominal); a Protocol matches any object that has the right methods (structural).",
              correct: true,
            },
            { text: "They are two names for the same feature." },
            { text: "Protocols require inheritance; ABCs do not." },
            { text: "Only ABCs can declare method signatures." },
          ],
          explanation:
            "ABCs are nominal — a type conforms by subclassing and implementing the abstract methods, checked when you instantiate. Protocols are structural — any object with matching methods satisfies them, checked by the type checker without inheritance.",
        },
        {
          kind: "challenge",
          title: "Model priority as an Enum",
          prompt:
            "Define an `enum.Enum` subclass named `Priority` with three members: `LOW = 1`, `MEDIUM = 2`, `HIGH = 3`.",
          starterCode: `from enum import Enum

class Priority(Enum):
    pass`,
          tests: [
            { name: "value", assertion: "assert Priority.LOW.value == 1" },
            { name: "high value", assertion: "assert Priority.HIGH.value == 3" },
            {
              name: "members in order",
              assertion: "assert [p.name for p in Priority] == ['LOW', 'MEDIUM', 'HIGH']",
              hidden: true,
            },
          ],
          hints: [
            "Inside the class body, assign each member: `LOW = 1`, and so on.",
            "Enum members are declared as plain class attributes with their values.",
          ],
          solution: `from enum import Enum

class Priority(Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3`,
          xp: 70,
        },
      ],
    },
  ],
};
