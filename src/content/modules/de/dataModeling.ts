import type { Module } from "../../../types/lesson";

// Dimensional modeling (Kimball) taught hands-on: every lab runs against the
// "warehouse" seed — a real star schema (dim_date / dim_customer with SCD2 rows /
// dim_product / fact_sales) plus a staging schema, in PGlite.
export const dataModeling: Module = {
  id: "data-modeling",
  title: "Data Modeling",
  blurb: "Normalization, star schemas, facts & dimensions, surrogate keys, SCD Type 2.",
  track: "Data Engineering",
  level: "Intermediate",
  icon: "💠",
  status: "deep",
  lessons: [
    {
      id: "normalization",
      title: "Normalization Refresher (1NF–3NF)",
      summary: "Why OLTP schemas split data into many tables — and what it costs analytics.",
      minutes: 11,
      blocks: [
        {
          kind: "prose",
          markdown: `# Normalization

OLTP schemas are **normalized**: each fact lives in exactly one place, so updates
can't disagree with themselves.

- **1NF** — atomic values, no repeating groups (no \`"phone1, phone2"\` in one cell).
- **2NF** — no column depends on just *part* of a composite key.
- **3NF** — no column depends on a *non-key* column (e.g. storing both
  \`category_id\` and \`category_name\` on products: the name depends on the id).

The shop database you've been querying is in 3NF: \`orders\` doesn't repeat the
user's email, \`order_items\` doesn't repeat product names. Update the product name
once, every past order "sees" it.

**The cost:** analytical questions need JOIN chains. Let's feel that cost.`,
        },
        {
          kind: "sql-runnable",
          title: "The JOIN chain a normalized schema forces",
          seedId: "ecommerce",
          sql: `-- "Revenue by category name" — 4 tables deep in a 3NF schema.
SELECT c.name AS category, SUM(oi.qty * oi.unit_price) AS revenue
FROM order_items oi
JOIN orders   o ON o.id = oi.order_id
JOIN products p ON p.id = oi.product_id
JOIN categories c ON c.id = p.category_id
WHERE o.status = 'paid'
GROUP BY c.name
ORDER BY revenue DESC;`,
        },
        {
          kind: "sql-runnable",
          title: "What denormalized data looks like — and its update anomaly",
          seedId: "ecommerce",
          resetBefore: true,
          sql: `-- A flat, denormalized copy: every row repeats user + product info.
CREATE TABLE flat_sales AS
SELECT o.id AS order_id, u.name AS user_name, u.email,
       p.name AS product_name, oi.qty, oi.unit_price
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
JOIN users  u ON u.id = o.user_id
JOIN products p ON p.id = oi.product_id;

-- Alice changes her email… but only ONE of her rows gets updated. Oops.
UPDATE flat_sales SET email = 'alice@new.com'
WHERE order_id = 1 AND product_name = 'iPhone 15';

SELECT order_id, user_name, email FROM flat_sales
WHERE user_name = 'Alice Smith';`,
        },
        {
          kind: "prose",
          markdown: `That inconsistent email is an **update anomaly** — the reason OLTP systems
normalize. Analytics warehouses deliberately walk this back: they *denormalize on
purpose* into star schemas, because their data is loaded by controlled pipelines
(not updated by app code), and read speed + simplicity win. That trade is the next
lesson.`,
        },
        {
          kind: "quiz",
          question:
            "A `products` table stores `category_id` AND `category_name`. Which normal form does that violate, and what goes wrong?",
          options: [
            {
              text: "3NF — category_name depends on category_id (a non-key column), so renaming a category means updating many product rows and they can drift",
              correct: true,
            },
            { text: "1NF — names are not atomic values" },
            { text: "2NF — it has a composite primary key" },
            { text: "None — storing both is standard practice in OLTP" },
          ],
          explanation:
            "A transitive dependency (non-key → non-key) is exactly what 3NF forbids. One category rename now touches N product rows, and a missed row leaves contradictory data.",
        },
      ],
    },
    {
      id: "er-grain",
      title: "Entities, Relationships & Grain",
      summary: "The most important modeling question: what does one row mean?",
      minutes: 10,
      blocks: [
        {
          kind: "prose",
          markdown: `# Grain: what does one row mean?

Before any table is designed, answer one question precisely:

> **"One row in this table represents exactly one ___."**

That's the table's **grain**. Every design mistake traces back to fuzzy grain:
double-counted revenue, impossible joins, metrics that disagree.

## Entity-relationship thinking

Entities (customer, product, order) relate with **cardinality**:

- one-to-many — a customer *has many* orders (FK on the many side)
- many-to-many — orders *contain many* products, products *appear in many*
  orders → resolved by a bridge table (\`order_items\`) whose grain is
  **one row per order line**

## Declaring grain for facts

In dimensional modeling, grain is declared FIRST, atomically ("one row per order
**line**", not "per order"), and everything else follows:

- measures must be true *at that grain* (\`qty\`, line \`amount\` — not order total!)
- dimensions are whatever describes that grain (who, what, when)

Putting an order-level value (like shipping cost) on an order-*line* grain row
double-counts it the moment someone sums the column.`,
        },
        {
          kind: "sql-runnable",
          title: "Read a table's grain from its keys",
          seedId: "warehouse",
          sql: `-- fact_sales: one row per order LINE (order_id repeats; sale_id is unique).
SELECT order_id, COUNT(*) AS lines, SUM(amount) AS order_total
FROM fact_sales
GROUP BY order_id
HAVING COUNT(*) > 1;`,
        },
        {
          kind: "quiz",
          question:
            "A fact table has grain 'one row per order line'. Someone adds a `shipping_cost` column holding the whole order's shipping fee. What breaks?",
          options: [
            {
              text: "SUM(shipping_cost) double-counts shipping for every multi-line order",
              correct: true,
            },
            { text: "Nothing — shipping is just another measure" },
            { text: "JOINs to the date dimension stop working" },
            { text: "The table is no longer in 1NF" },
          ],
          explanation:
            "The measure isn't true at the declared grain. Order-level values belong in an order-grain table (or must be allocated across lines). 'Is this value true for ONE row?' is the test every column must pass.",
        },
        {
          kind: "quiz",
          question: "Which grain is the safest default for a sales fact table?",
          options: [
            {
              text: "The most atomic available — one row per order line — because you can always aggregate up, never disaggregate down",
              correct: true,
            },
            { text: "One row per day, to keep the table small" },
            { text: "One row per customer, since customers are the business focus" },
            { text: "One row per report the business asked for" },
          ],
          explanation:
            "Kimball's rule: build facts at the lowest (most atomic) grain. Daily/customer summaries can be derived; the reverse is impossible. Pre-aggregated grains lock you out of tomorrow's questions.",
        },
      ],
    },
    {
      id: "star-schemas",
      title: "Star Schemas & Dimensional Modeling",
      summary: "Kimball's big idea: facts in the middle, context around them.",
      minutes: 13,
      blocks: [
        {
          kind: "prose",
          markdown: `# The star schema

Kimball's dimensional model organizes analytics data into two kinds of tables:

- **Fact table** (center): the *measurements* — numeric, additive, at a declared
  grain, with foreign keys to…
- **Dimension tables** (points of the star): the *context* — who, what, when,
  where. Wide, descriptive, denormalized on purpose.

\`\`\`
              dim_date
                 │
dim_customer ─ fact_sales ─ dim_product
\`\`\`

Your warehouse seed IS this star. Compare the query shapes:

- 3NF shop schema: revenue by category = **4-table join chain**
- Star schema: any measure by any attribute = **fact + the dimensions you name**

A **snowflake** schema re-normalizes dimensions (dim_product → dim_category →
dim_department). It saves trivial space and costs extra joins — Kimball's advice,
and the industry default, is: **keep dimensions flat**.`,
        },
        {
          kind: "sql-runnable",
          title: "The star join: measure by any context",
          seedId: "warehouse",
          sql: `-- Revenue by product category and quarter: fact + two dimensions, that's it.
SELECT d.year, d.quarter, p.category, SUM(f.amount) AS revenue
FROM fact_sales f
JOIN dim_date    d USING (date_key)
JOIN dim_product p USING (product_key)
GROUP BY d.year, d.quarter, p.category
ORDER BY d.year, d.quarter, revenue DESC;`,
        },
        {
          kind: "sql-runnable",
          title: "Slice by a different dimension — same shape",
          seedId: "warehouse",
          sql: `-- Weekend vs weekday sales: swap in whichever dimension attributes you need.
SELECT d.is_weekend, COUNT(*) AS sales, SUM(f.amount) AS revenue
FROM fact_sales f
JOIN dim_date d USING (date_key)
GROUP BY d.is_weekend
ORDER BY d.is_weekend;`,
        },
        {
          kind: "sql-challenge",
          title: "Your first star query",
          seedId: "warehouse",
          prompt:
            "Return each customer segment's revenue: `segment` and `revenue` (`SUM(amount)`), joining `fact_sales` to `dim_customer`, ordered by `revenue` descending.",
          starterSql: "SELECT c.segment\nFROM fact_sales f\nJOIN dim_customer c USING (customer_key)\nGROUP BY c.segment;",
          solution:
            "SELECT c.segment, SUM(f.amount) AS revenue FROM fact_sales f JOIN dim_customer c USING (customer_key) GROUP BY c.segment ORDER BY revenue DESC;",
          ordered: true,
          hints: [
            "JOIN on the surrogate key: `USING (customer_key)`.",
            "GROUP BY segment, SUM the amount, ORDER BY the sum descending.",
          ],
          xp: 60,
        },
        {
          kind: "quiz",
          question: "Why do dimension tables stay denormalized (flat) in a star schema?",
          options: [
            {
              text: "They're small, loaded by controlled pipelines, and flat dims mean fewer joins + simpler queries for every consumer",
              correct: true,
            },
            { text: "Normalizing dimensions is impossible in SQL" },
            { text: "Denormalized tables compress better than normalized ones" },
            { text: "Update anomalies don't matter because dimensions never change" },
          ],
          explanation:
            "The update-anomaly risk that justifies 3NF in OLTP barely applies: only the load pipeline writes dimensions. Meanwhile every query and every analyst benefits from one flat, readable table. (Dimension *changes* are handled deliberately — that's SCD, two lessons ahead.)",
        },
      ],
    },
    {
      id: "fact-tables",
      title: "Fact Tables",
      summary: "Transaction, snapshot, and accumulating facts — and which measures you may SUM.",
      minutes: 12,
      blocks: [
        {
          kind: "prose",
          markdown: `# Fact table types

| Type | Grain | Example | Loaded |
|---|---|---|---|
| **Transaction** | one row per event | \`fact_sales\` (one per order line) | append |
| **Periodic snapshot** | one row per entity per period | account balance per day | insert per period |
| **Accumulating snapshot** | one row per process, updated as it advances | order → shipped → delivered with a date per milestone | updated in place |

## Additivity — what can you SUM?

- **Additive** — summable across *all* dimensions: \`qty\`, \`amount\`. The best kind.
- **Semi-additive** — summable across some dimensions but **not time**: account
  *balances* (sum of yesterday's + today's balance is meaningless; take the
  latest/avg instead).
- **Non-additive** — ratios & percentages: never store a pre-computed ratio you'd
  wrongly average; store numerator and denominator and divide at query time.`,
        },
        {
          kind: "sql-runnable",
          title: "Derive a periodic snapshot from the transaction fact",
          seedId: "warehouse",
          sql: `-- Monthly snapshot: one row per month with that month's activity.
SELECT d.year, d.month, COUNT(*) AS sales, SUM(f.qty) AS units, SUM(f.amount) AS revenue
FROM fact_sales f
JOIN dim_date d USING (date_key)
GROUP BY d.year, d.month
ORDER BY d.year, d.month;`,
        },
        {
          kind: "sql-challenge",
          title: "Daily sales snapshot",
          seedId: "warehouse",
          prompt:
            "Build the daily snapshot: for **each date that had sales**, return `full_date` and `revenue` (`SUM(amount)`), ordered by `full_date`.",
          starterSql: "SELECT d.full_date\nFROM fact_sales f\nJOIN dim_date d USING (date_key);",
          solution:
            "SELECT d.full_date, SUM(f.amount) AS revenue FROM fact_sales f JOIN dim_date d USING (date_key) GROUP BY d.full_date ORDER BY d.full_date;",
          ordered: true,
          hints: [
            "Group by `d.full_date` and sum the amounts.",
            "Only dates with sales appear because the JOIN starts from fact_sales.",
          ],
          xp: 60,
        },
        {
          kind: "quiz",
          question:
            "A fact table stores each account's end-of-day `balance`. Why is `SUM(balance)` across a month wrong, and what is this measure called?",
          options: [
            {
              text: "Balances are levels, not flows — summing 30 daily levels counts the same money 30 times. It's semi-additive: aggregate across accounts, but take latest/average across time",
              correct: true,
            },
            { text: "It's non-additive: balances can never be summed, even across accounts" },
            { text: "Nothing is wrong; balance is fully additive" },
            { text: "It's wrong only if some days are missing rows" },
          ],
          explanation:
            "Semi-additive measures (balances, inventory levels, headcounts) sum fine across most dimensions but NOT across time. This is one of the most common real-world dashboard bugs.",
        },
      ],
    },
    {
      id: "dimensions",
      title: "Dimensions & Surrogate Keys",
      summary: "Why warehouses mint their own keys, plus degenerate and junk dimensions.",
      minutes: 11,
      blocks: [
        {
          kind: "prose",
          markdown: `# Surrogate keys

Look at \`dim_customer\`: it has **two key columns**.

- \`customer_id\` — the **natural key**: the id the *source system* uses.
- \`customer_key\` — the **surrogate key**: a meaningless integer the *warehouse*
  mints, one per **version** of the customer.

Facts reference the surrogate. Three reasons warehouses insist on this:

1. **History.** One natural key can have many versions over time (SCD2 — next
   lesson). Each version needs its own key for facts to point at.
2. **Independence.** Source systems get migrated, merged, and recycle ids.
   Surrogates isolate the warehouse from all of it.
3. **Multiple sources.** Two systems both have a "customer 42" — surrogates
   de-conflict them.

## Two special "dimensions"

- **Degenerate dimension**: \`order_id\` on \`fact_sales\` — a dimension-like value
  with no attributes of its own, so it lives *in the fact table* with no dim table.
- **Junk dimension**: a handful of low-cardinality flags (is_gift, channel,
  payment_type) bundled into one small dim instead of 4 tiny ones.`,
        },
        {
          kind: "sql-runnable",
          title: "One natural key, two versions, two surrogate keys",
          seedId: "warehouse",
          sql: `SELECT customer_key, customer_id, name, city, valid_from, valid_to, is_current
FROM dim_customer
WHERE customer_id = 1
ORDER BY valid_from;`,
        },
        {
          kind: "sql-runnable",
          title: "Facts point at the version that was true at the time",
          seedId: "warehouse",
          sql: `-- Acme's sales: early rows hit surrogate key 1 (Bogotá era), late ones key 2 (Medellín).
SELECT f.order_id, d.full_date, f.customer_key, c.city
FROM fact_sales f
JOIN dim_customer c USING (customer_key)
JOIN dim_date d USING (date_key)
WHERE c.customer_id = 1
ORDER BY d.full_date;`,
        },
        {
          kind: "sql-challenge",
          title: "Count versions per customer",
          seedId: "warehouse",
          prompt:
            "For each natural key in `dim_customer`, return `customer_id`, `name` (of any version — use `MAX(name)`), and `versions` (row count), ordered by `customer_id`.",
          starterSql: "SELECT customer_id\nFROM dim_customer\nGROUP BY customer_id;",
          solution:
            "SELECT customer_id, MAX(name) AS name, COUNT(*) AS versions FROM dim_customer GROUP BY customer_id ORDER BY customer_id;",
          ordered: true,
          hints: [
            "Group by the NATURAL key (customer_id), not the surrogate.",
            "COUNT(*) per group is the number of versions.",
          ],
          xp: 50,
        },
        {
          kind: "quiz",
          question: "Why is `order_id` on `fact_sales` called a *degenerate* dimension?",
          options: [
            {
              text: "It identifies/groups facts like a dimension would, but has no descriptive attributes, so no dimension table exists for it",
              correct: true,
            },
            { text: "Because it should be deleted from the model" },
            { text: "Because it's a foreign key to dim_date" },
            { text: "Because it contains NULL for most rows" },
          ],
          explanation:
            "Grouping by order_id (e.g. lines per order) is dimensional behavior, but there's nothing to store *about* an order id itself — so it stays in the fact table. Ticket numbers, invoice numbers, and confirmation codes are classic degenerates.",
        },
      ],
    },
    {
      id: "date-dimension",
      title: "The Date Dimension",
      summary: "The one dimension every warehouse has — generate it, don't type it.",
      minutes: 11,
      blocks: [
        {
          kind: "prose",
          markdown: `# The date dimension

Why a whole table for dates, when SQL has date functions?

- **Consistency**: "Q3", "week 42", "is_holiday" computed ONCE, identically for
  every query and BI tool — not re-derived (differently) in each.
- **Business calendar**: fiscal years, trading days, promo periods don't come from
  \`EXTRACT()\` — they live in columns you control.
- **Joins beat functions**: grouping by a pre-computed \`month_name\` column is
  simpler and index/pruning-friendly compared to wrapping every query in functions.

Conventions used in \`dim_date\` (and most real warehouses):

- Smart key \`yyyymmdd\` as an integer (readable, sorts correctly, partition-friendly).
- One row per calendar day, **generated** with \`generate_series\` — never typed by hand.`,
        },
        {
          kind: "sql-runnable",
          title: "How dim_date was generated",
          seedId: "warehouse",
          sql: `-- The exact pattern that built the seed's dim_date:
SELECT to_char(d, 'YYYYMMDD')::int AS date_key,
       d::date                     AS full_date,
       EXTRACT(quarter FROM d)::int AS quarter,
       trim(to_char(d, 'Month'))   AS month_name,
       EXTRACT(isodow FROM d)::int AS iso_dow,
       EXTRACT(isodow FROM d) IN (6, 7) AS is_weekend
FROM generate_series('2026-06-25'::date, '2026-06-30'::date, interval '1 day') AS d;`,
        },
        {
          kind: "sql-runnable",
          title: "What the date dimension buys you",
          seedId: "warehouse",
          sql: `-- "Weekend revenue by quarter" — zero date functions in the query.
SELECT d.year, d.quarter, SUM(f.amount) AS weekend_revenue
FROM fact_sales f
JOIN dim_date d USING (date_key)
WHERE d.is_weekend
GROUP BY d.year, d.quarter
ORDER BY d.year, d.quarter;`,
        },
        {
          kind: "sql-challenge",
          title: "Extend the calendar",
          seedId: "warehouse",
          prompt:
            "`dim_date` ends at 2026-06-30. Generate the next 10 days (2026-07-01 through 2026-07-10) in the same shape: `date_key` (yyyymmdd integer), `full_date`, and `is_weekend`, ordered by `date_key`.",
          starterSql:
            "SELECT\n  -- date_key,\n  -- full_date,\n  -- is_weekend\nFROM generate_series('2026-07-01'::date, '2026-07-10'::date, interval '1 day') AS d;",
          solution:
            "SELECT to_char(d, 'YYYYMMDD')::int AS date_key, d::date AS full_date, EXTRACT(isodow FROM d) IN (6, 7) AS is_weekend FROM generate_series('2026-07-01'::date, '2026-07-10'::date, interval '1 day') AS d ORDER BY date_key;",
          ordered: true,
          hints: [
            "`to_char(d, 'YYYYMMDD')::int` builds the smart key.",
            "ISO day-of-week 6 and 7 are Saturday and Sunday: `EXTRACT(isodow FROM d) IN (6,7)`.",
          ],
          xp: 70,
        },
        {
          kind: "quiz",
          question: "Why does `dim_date` include rows for days with no sales at all?",
          options: [
            {
              text: "So 'zero' days exist to join against — e.g. a complete daily report needs every calendar day, not just days that happened to have facts",
              correct: true,
            },
            { text: "generate_series can't skip days" },
            { text: "To make the table bigger for realistic benchmarks" },
            { text: "Fact tables require every date_key to be used" },
          ],
          explanation:
            "Dimensions describe what CAN happen; facts record what DID. A `dim_date LEFT JOIN fact_sales` gives you the days with zero revenue — impossible if the calendar only contained transaction dates.",
        },
      ],
    },
    {
      id: "scd",
      title: "Slowly Changing Dimensions (SCD 0–3)",
      summary: "The exam favorite: keeping history when dimension attributes change.",
      minutes: 15,
      blocks: [
        {
          kind: "prose",
          markdown: `# Slowly Changing Dimensions

A customer moves city. Overwrite it, and every historical report silently changes.
Keep both, and you need rules. Those rules are the SCD types:

| Type | Strategy | History? | Use when |
|---|---|---|---|
| **0** | never change (retain original) | original only | birth date, first-touch channel |
| **1** | overwrite in place | none | typo fixes, attributes where history is noise |
| **2** | **add a new row** (close old, insert new) | full | the default for anything reports slice by |
| **3** | add a "previous_value" column | one step | rare; e.g. before/after a territory realignment |

## SCD Type 2 mechanics — "close and insert"

When attributes change for customer \`X\` effective date \`D\`:

1. **Close** the current row: \`valid_to = D - 1 day\`, \`is_current = false\`.
2. **Insert** a new row: new surrogate key, \`valid_from = D\`,
   \`valid_to = '9999-12-31'\`, \`is_current = true\`.

New facts pick up the *new* surrogate key at load time; old facts keep pointing at
the old version. History preserved, no fact ever rewritten.`,
        },
        {
          kind: "sql-runnable",
          title: "Walk through a full SCD2 update",
          seedId: "warehouse",
          resetBefore: true,
          sql: `-- Globex (customer_id 2) changed segment: startup → scaleup, effective 2026-05-01
-- (this exact change is waiting in staging.customer_updates).

-- Step 1: CLOSE the current version.
UPDATE dim_customer
SET valid_to = DATE '2026-05-01' - 1, is_current = false
WHERE customer_id = 2 AND is_current;

-- Step 2: INSERT the new version (fresh surrogate key from the sequence).
INSERT INTO dim_customer (customer_id, name, segment, city, valid_from)
VALUES (2, 'Globex', 'scaleup', 'Lima', '2026-05-01');

-- Result: full history, one current row.
SELECT customer_key, customer_id, segment, valid_from, valid_to, is_current
FROM dim_customer
WHERE customer_id = 2
ORDER BY valid_from;`,
        },
        {
          kind: "prose",
          markdown: `Notice what did **not** happen: no fact row was touched. Globex's old sales still
join to the \`startup\`-era version — reports about 2025 stay exactly as they were.

**Detecting which staged rows need this treatment** is the other half of the job:
a staged update matters when the natural key has *no current row* (brand-new
customer → just insert) or its attributes *differ* from the current row (→ close
and insert). That detection query is your challenge.`,
        },
        {
          kind: "sql-challenge",
          title: "Which staged updates require action?",
          seedId: "warehouse",
          prompt:
            "Compare `staging.customer_updates` to the **current** rows of `dim_customer` (natural key `customer_id`). Return `customer_id` and `name` of every staged row that is a **new customer** (no current dim row) **or** differs from the current row in `name`, `segment`, or `city`. Order by `customer_id`.\n\n*Tip: `IS DISTINCT FROM` compares like `<>` but treats NULLs sanely.*",
          starterSql:
            "SELECT u.customer_id, u.name\nFROM staging.customer_updates u\nLEFT JOIN dim_customer c\n  ON c.customer_id = u.customer_id AND c.is_current\nWHERE -- new customer OR changed attributes\n;",
          solution:
            "SELECT u.customer_id, u.name FROM staging.customer_updates u LEFT JOIN dim_customer c ON c.customer_id = u.customer_id AND c.is_current WHERE c.customer_key IS NULL OR (u.name, u.segment, u.city) IS DISTINCT FROM (c.name, c.segment, c.city) ORDER BY u.customer_id;",
          ordered: true,
          hints: [
            "LEFT JOIN to current rows only (`AND c.is_current` in the join condition).",
            "New customer: `c.customer_key IS NULL`. Changed: row comparison `(u.name, u.segment, u.city) IS DISTINCT FROM (c.name, c.segment, c.city)`.",
          ],
          xp: 90,
        },
        {
          kind: "flashcards",
          title: "SCD types — drill them until they're reflex",
          cards: [
            { front: "SCD Type 0", back: "Retain original — the attribute never changes after first load (birth date, first-touch channel)." },
            { front: "SCD Type 1", back: "Overwrite in place. No history. For typo fixes and attributes where history is noise." },
            { front: "SCD Type 2", back: "Add a new ROW per version: close the old (valid_to, is_current=false), insert the new with a fresh surrogate key. Full history — the default." },
            { front: "SCD Type 3", back: "Add a COLUMN holding the previous value. One step of history only. Rare — before/after comparisons like territory realignments." },
            { front: "The SCD2 'close and insert' steps", back: "1) UPDATE current row: valid_to = change_date - 1, is_current = false.\n2) INSERT new row: new surrogate key, valid_from = change_date, valid_to = 9999-12-31, is_current = true." },
            { front: "Why facts never need updating when a dimension changes (SCD2)", back: "Facts store the surrogate key of the version current AT LOAD TIME — old facts keep pointing at old versions; new facts pick up the new key." },
            { front: "Why valid_to = '9999-12-31' instead of NULL on current rows", back: "Point-in-time queries become a simple BETWEEN valid_from AND valid_to — no NULL handling needed." },
          ],
        },
        {
          kind: "quiz",
          question:
            "After an SCD2 change, why do NEW facts get the new surrogate key while OLD facts keep the old one — with no fact updates at all?",
          options: [
            {
              text: "The fact load looks up the CURRENT dimension row at insert time; existing facts already hold the key of whichever version was current when they loaded",
              correct: true,
            },
            { text: "A trigger rewrites historical facts to the newest key" },
            { text: "Facts join on the natural key, so keys don't matter" },
            { text: "Old facts are deleted and reloaded nightly" },
          ],
          explanation:
            "This is the heart of SCD2: the surrogate key captured at load time freezes the historical context into each fact row forever. That's what makes 'as-was' reporting work — next lesson.",
        },
      ],
    },
    {
      id: "star-analytics",
      title: "Star Schema Analytics: As-Was vs As-Is",
      summary: "Put the SCD2 machinery to work — the same question, two correct answers.",
      minutes: 13,
      blocks: [
        {
          kind: "prose",
          markdown: `# As-was vs as-is

"Revenue by city" has **two** legitimate answers once dimensions keep history:

- **As-was** (historical truth): credit each sale to the city the customer was in
  *at the time of the sale*. → join facts to dims on the **surrogate key**. This
  is the default; SCD2 makes it automatic.
- **As-is** (current view): restate everything under each customer's *current*
  city. → hop from the fact's version to the natural key, then to the
  \`is_current\` row.

Acme moved Bogotá → Medellín on 2025-10-01, so the two answers genuinely differ
in this dataset. Let's see both.`,
        },
        {
          kind: "sql-runnable",
          title: "As-was: the surrogate join does it automatically",
          seedId: "warehouse",
          sql: `SELECT c.city, SUM(f.amount) AS revenue
FROM fact_sales f
JOIN dim_customer c USING (customer_key)
GROUP BY c.city
ORDER BY revenue DESC;`,
        },
        {
          kind: "sql-runnable",
          title: "As-is: restate history under the current version",
          seedId: "warehouse",
          sql: `-- hist = the version the fact points at; cur = that customer's current row.
SELECT cur.city, SUM(f.amount) AS revenue
FROM fact_sales f
JOIN dim_customer hist USING (customer_key)
JOIN dim_customer cur
  ON cur.customer_id = hist.customer_id AND cur.is_current
GROUP BY cur.city
ORDER BY revenue DESC;`,
        },
        {
          kind: "prose",
          markdown: `Compare: as-was splits Acme's revenue between Bogotá and Medellín; as-is moves all
of it to Medellín. **Neither is wrong** — "which city earned it" vs "what would the
map look like today" are different questions. Analysts get bitten when they don't
know which one a dashboard answers.

A third pattern — **point-in-time**: "what did the dimension look like on date D?"
— filters versions with \`D BETWEEN valid_from AND valid_to\`. That's your second
challenge.`,
        },
        {
          kind: "sql-challenge",
          title: "As-was revenue by segment and year",
          seedId: "warehouse",
          prompt:
            "Return `year`, `segment`, and `revenue` (`SUM(amount)`) using the **as-was** view (plain surrogate-key joins), ordered by `year`, then `segment`.",
          starterSql:
            "SELECT d.year, c.segment\nFROM fact_sales f\nJOIN dim_date d USING (date_key)\nJOIN dim_customer c USING (customer_key);",
          solution:
            "SELECT d.year, c.segment, SUM(f.amount) AS revenue FROM fact_sales f JOIN dim_date d USING (date_key) JOIN dim_customer c USING (customer_key) GROUP BY d.year, c.segment ORDER BY d.year, c.segment;",
          ordered: true,
          hints: [
            "Three-table star join: fact + dim_date + dim_customer.",
            "As-was needs nothing special — the surrogate key already encodes history.",
          ],
          xp: 70,
        },
        {
          kind: "sql-challenge",
          title: "Point-in-time lookup",
          seedId: "warehouse",
          prompt:
            "What did the customer dimension look like on **2025-06-15**? Return `customer_id`, `name`, and `city` of every version valid on that date (`valid_from <= date <= valid_to`), ordered by `customer_id`.",
          starterSql:
            "SELECT customer_id, name, city\nFROM dim_customer\nWHERE -- valid on 2025-06-15\n;",
          solution:
            "SELECT customer_id, name, city FROM dim_customer WHERE DATE '2025-06-15' BETWEEN valid_from AND valid_to ORDER BY customer_id;",
          ordered: true,
          hints: [
            "`DATE '2025-06-15' BETWEEN valid_from AND valid_to` selects the version alive that day.",
            "The '9999-12-31' convention on current rows is exactly what makes BETWEEN work without NULL checks.",
          ],
          xp: 70,
        },
      ],
    },
    {
      id: "modern-modeling",
      title: "Modern Debates: One Big Table & Data Vault",
      summary: "When denormalized-all-the-way wins, and what Data Vault solves.",
      minutes: 10,
      blocks: [
        {
          kind: "prose",
          markdown: `# Beyond the star

The star schema is the default, but two other patterns come up in interviews and
real architectures:

## One Big Table (OBT)

Pre-join the star into a single wide table (every fact row carries its dimension
attributes inline). On columnar engines the storage cost is small (repeated values
compress away) and queries become trivial — no joins at all.

- **Wins**: BI tools & less-SQL-savvy consumers; very hot, well-known query paths.
- **Loses**: SCD handling (restating history = rewriting the big table), attribute
  updates touch billions of rows, one table per grain proliferates.
- **In practice**: OBTs are built *from* a star as a final serving layer — the
  star stays the source of truth. ("Marts" in the dbt world are often OBTs.)

## Data Vault (awareness level)

An *ingestion*-layer methodology for big, multi-source, audit-heavy enterprises:

- **Hubs** — one table per business key (customer, product…)
- **Links** — one table per relationship between hubs
- **Satellites** — the attributes, timestamped, append-only per source

Everything is append-only and auditable, and new sources bolt on without
remodeling. The cost: an explosion of tables and joins — so a star schema is
almost always built ON TOP of the vault for actual analytics.

**Mental model**: Vault (optional, ingestion) → **Star (modeling core)** →
OBT/marts (serving). The star is the part you must master — done.`,
        },
        {
          kind: "quiz",
          question:
            "Your team ships an OBT to the BI tool. A customer's segment gets corrected upstream. What's the OBT's structural problem here?",
          options: [
            {
              text: "The segment value is repeated on every one of that customer's fact rows — the fix means rewriting them all (vs one dim row in a star)",
              correct: true,
            },
            { text: "OBTs cannot store customer attributes" },
            { text: "BI tools can't filter denormalized tables" },
            { text: "There is no problem — OBTs update like any table" },
          ],
          explanation:
            "Denormalization trades update cost for read simplicity. That's why the star remains the source of truth and OBTs are *rebuilt* from it (cheap on modern engines) rather than updated in place.",
        },
        {
          kind: "quiz",
          question: "Which situation is Data Vault actually designed for?",
          options: [
            {
              text: "Many volatile source systems feeding one warehouse where full audit history of every load must be preserved",
              correct: true,
            },
            { text: "A startup with one Postgres app database and a BI dashboard" },
            { text: "Replacing star schemas for analyst-facing reporting" },
            { text: "Real-time streaming aggregations" },
          ],
          explanation:
            "Vault shines at integration scale: append-only satellites keep every version from every source, and new sources add tables instead of remodeling. For a small stack it's pure overhead — and even where it's used, analysts still query a star built on top.",
        },
      ],
    },
  ],
};
