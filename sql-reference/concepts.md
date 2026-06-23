# PostgreSQL — Complete Study Guide

> Live-coding test reference. Every section has syntax + working examples + gotchas.

---

## Table of Contents

0. [Quick-Reference Cheat Sheet](#0-quick-reference-cheat-sheet)
1. [SELECT + WHERE](#1-select--where)
2. [JOINs](#2-joins)
3. [GROUP BY + HAVING](#3-group-by--having)
4. [CASE](#4-case)
5. [Subqueries & EXISTS](#5-subqueries--exists)
6. [CTEs (WITH)](#6-ctes-with)
7. [Window Functions](#7-window-functions)
8. [Set Operations](#8-set-operations)
9. [INSERT / UPDATE / DELETE / UPSERT](#9-insert--update--delete--upsert)
10. [Transactions](#10-transactions)
11. [DDL & Constraints](#11-ddl--constraints)
12. [Indexes](#12-indexes)
13. [EXPLAIN ANALYZE](#13-explain-analyze)
14. [Arrays](#14-arrays)
15. [JSONB](#15-jsonb)
16. [Views & Materialized Views](#16-views--materialized-views)
17. [Functions (PL/pgSQL)](#17-functions-plpgsql)
18. [Stored Procedures](#18-stored-procedures)
19. [Triggers](#19-triggers)
20. [PL/pgSQL Control Flow](#20-plpgsql-control-flow)
21. [String Functions](#21-string-functions)
22. [Date / Time Functions](#22-date--time-functions)
23. [Math & NULL Functions](#23-math--null-functions)
24. [Full-Text Search](#24-full-text-search)
25. [Interview Patterns](#25-interview-patterns)

---

## 0. Quick-Reference Cheat Sheet

These are the patterns you're most likely to blank on mid-test.

```sql
-- NULL-safe equality        a IS NOT DISTINCT FROM b   (true even when both NULL)
-- NULL-safe inequality      a IS DISTINCT FROM b
-- First row per group       SELECT DISTINCT ON (col) ... ORDER BY col, col2
-- Top-N per group           ROW_NUMBER() OVER (PARTITION BY col ORDER BY col2) → filter rn<=N
-- Running total             SUM(amt) OVER (ORDER BY date ROWS UNBOUNDED PRECEDING)
-- Reset per group           SUM(amt) OVER (PARTITION BY col ORDER BY date ROWS UNBOUNDED PRECEDING)
-- Previous row              LAG(col, 1, default) OVER (ORDER BY date)
-- Next row                  LEAD(col) OVER (ORDER BY date)
-- Last value in window      LAST_VALUE(col) OVER (... ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
-- Conditional aggregate     COUNT(*) FILTER (WHERE col = 'x')
-- Percentile / median       PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY col)
-- Upsert                    INSERT ... ON CONFLICT (col) DO UPDATE SET col = EXCLUDED.col
-- Delete duplicates         DELETE FROM t WHERE id NOT IN (SELECT MIN(id) FROM t GROUP BY col)
-- Users with no orders      LEFT JOIN orders ON ... WHERE orders.id IS NULL
-- Rows since last N days    WHERE created_at >= now() - interval '30 days'
-- Fill date gaps            generate_series(start, end, '1 day'::interval)
-- Lateral join              FROM a, LATERAL (SELECT ... WHERE x = a.id LIMIT 1) sub
-- Safe division             revenue / NULLIF(visits, 0)
-- Cast                      col::numeric  /  CAST(col AS numeric)
-- Array contains value      'x' = ANY(arr)  /  arr @> ARRAY['x']
-- JSONB field as text       col->>'key'   (use ->> not -> to avoid extra quotes)
-- Regex match               col ~ 'pattern'   col ~* 'pattern' (case-insensitive)
-- Execution order           FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT
```

---

## 1. SELECT + WHERE

The basic building block. PostgreSQL evaluates: `FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT`.

```sql
SELECT
    id,
    name,
    price * 1.19 AS price_with_tax,   -- expressions in SELECT
    UPPER(name)  AS name_upper
FROM products
WHERE
    price > 100                         -- comparison
    AND category = 'electronics'        -- AND / OR / NOT
    AND status IN ('active', 'pending') -- IN list
    AND name LIKE 'iPhone%'             -- wildcard: % = any chars, _ = one char
    AND name ILIKE '%apple%'            -- case-insensitive LIKE
    AND created_at BETWEEN '2026-01-01' AND '2026-12-31'
    AND deleted_at IS NULL              -- NULL check (never use = NULL)
    AND deleted_at IS NOT NULL
ORDER BY price DESC NULLS LAST, name ASC
LIMIT 10
OFFSET 20;                              -- skip 20 rows (page 3 of 10)
```

```sql
-- DISTINCT — unique rows
SELECT DISTINCT category FROM products;

-- DISTINCT ON — first row per group (PostgreSQL-specific)
SELECT DISTINCT ON (category) id, category, name, price
FROM products
ORDER BY category, price DESC;   -- ORDER BY must start with DISTINCT ON cols
```

> **Gotcha:** `WHERE col = NULL` never matches — use `IS NULL`. DISTINCT ON requires the ORDER BY to start with the same columns.

> **vs MySQL:** `ILIKE` no existe en MySQL — en MySQL `LIKE` ya es case-insensitive por defecto. `DISTINCT ON` es exclusivo de PostgreSQL (MySQL no lo tiene). En MySQL los NULLs aparecen primero en `ASC`; en PostgreSQL aparecen últimos (`NULLS LAST` es el default en ASC).

---

## 2. JOINs

Joins combine rows from two or more tables. Always write the join condition explicitly.

```sql
-- INNER JOIN — only rows with a match in both tables
SELECT u.name, o.total
FROM users u
INNER JOIN orders o ON o.user_id = u.id;

-- LEFT JOIN — all rows from left, NULL on right if no match
SELECT u.name, o.total
FROM users u
LEFT JOIN orders o ON o.user_id = u.id;

-- RIGHT JOIN — all rows from right (rarely used; flip the tables instead)
SELECT u.name, o.total
FROM orders o
RIGHT JOIN users u ON o.user_id = u.id;

-- FULL OUTER JOIN — all rows from both, NULL where no match
SELECT u.name, o.total
FROM users u
FULL OUTER JOIN orders o ON o.user_id = u.id;

-- CROSS JOIN — cartesian product (every combination)
SELECT a.val, b.val
FROM table_a a
CROSS JOIN table_b b;

-- Self-join — join a table to itself
SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;

-- Multi-table join
SELECT o.id, u.name, p.name AS product, oi.qty
FROM orders o
JOIN users u         ON u.id = o.user_id
JOIN order_items oi  ON oi.order_id = o.id
JOIN products p      ON p.id = oi.product_id
WHERE o.created_at > now() - interval '30 days';
```

> **Gotcha:** Adding a `WHERE b.col = val` on a LEFT JOIN's right table silently converts it to an INNER JOIN. Put the filter in the `ON` clause or use a subquery to keep the LEFT JOIN behavior.

> **vs MySQL:** `FULL OUTER JOIN` no existe en MySQL — se emula con `LEFT JOIN UNION ALL RIGHT JOIN ... WHERE left.id IS NULL`. `LATERAL` se agregó en MySQL 8.0.14; en versiones anteriores no existe.

```sql
-- Correct: filter in ON
LEFT JOIN orders o ON o.user_id = u.id AND o.status = 'paid'

-- Wrong (turns into INNER JOIN):
LEFT JOIN orders o ON o.user_id = u.id
WHERE o.status = 'paid'
```

### LATERAL join

`LATERAL` lets a subquery in FROM reference columns from tables to its left — like a correlated subquery but returning multiple rows. Extremely useful for "most recent N per row" patterns.

```sql
-- Most recent order for each user (LATERAL)
SELECT u.name, latest.total, latest.created_at
FROM users u
LEFT JOIN LATERAL (
    SELECT total, created_at
    FROM orders o
    WHERE o.user_id = u.id
    ORDER BY created_at DESC
    LIMIT 1
) AS latest ON true;

-- Top 3 products per category using LATERAL
SELECT c.name AS category, p.name AS product, p.sales
FROM categories c
LEFT JOIN LATERAL (
    SELECT name, sales
    FROM products
    WHERE category_id = c.id
    ORDER BY sales DESC
    LIMIT 3
) AS p ON true;

-- LATERAL with a function
SELECT u.id, tags.*
FROM users u,
LATERAL unnest(u.tag_array) AS tags(tag);  -- comma = implicit CROSS JOIN LATERAL
```

> **Gotcha:** The `ON true` in `LEFT JOIN LATERAL` is required — the correlation is already in the subquery's WHERE, not in the ON. Without `LEFT`, users with no matching rows are dropped.

---

## 3. GROUP BY + HAVING

Aggregate functions collapse multiple rows into one. `HAVING` filters *after* aggregation; `WHERE` filters *before*.

```sql
SELECT
    category,
    COUNT(*)                    AS total_products,
    COUNT(DISTINCT brand)       AS unique_brands,
    SUM(price)                  AS revenue,
    AVG(price)                  AS avg_price,
    MIN(price)                  AS cheapest,
    MAX(price)                  AS most_expensive,
    ROUND(AVG(price), 2)        AS avg_price_rounded
FROM products
WHERE active = true             -- WHERE filters before grouping
GROUP BY category
HAVING COUNT(*) > 5             -- HAVING filters after grouping
ORDER BY revenue DESC;
```

```sql
-- Group by expression / date truncation
SELECT
    date_trunc('month', created_at) AS month,
    COUNT(*)                         AS signups
FROM users
GROUP BY date_trunc('month', created_at)
ORDER BY month;

-- Group by multiple columns
SELECT department, job_title, COUNT(*) AS headcount
FROM employees
GROUP BY department, job_title;

-- FILTER clause — conditional aggregation (PostgreSQL 9.4+)
SELECT
    COUNT(*) FILTER (WHERE status = 'active')   AS active_count,
    COUNT(*) FILTER (WHERE status = 'inactive') AS inactive_count
FROM users;

-- GROUPING SETS — multiple GROUP BY in one pass
SELECT department, job_title, COUNT(*)
FROM employees
GROUP BY GROUPING SETS (
    (department, job_title),
    (department),
    ()
);
```

```sql
-- PERCENTILE — ordered-set aggregate functions
SELECT
    department,
    PERCENTILE_CONT(0.5)  WITHIN GROUP (ORDER BY salary) AS median_salary,
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY salary) AS p25,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY salary) AS p75,
    PERCENTILE_DISC(0.5)  WITHIN GROUP (ORDER BY salary) AS median_disc  -- returns actual row value
FROM employees
GROUP BY department;

-- MODE — most frequent value
SELECT department, MODE() WITHIN GROUP (ORDER BY job_title) AS most_common_title
FROM employees
GROUP BY department;
```

> **Gotcha:** Every column in SELECT that is not inside an aggregate function must appear in GROUP BY. `PERCENTILE_CONT` interpolates between values (can return a decimal); `PERCENTILE_DISC` returns the nearest actual row value.

> **vs MySQL:** MySQL (sin `only_full_group_by`) permite seleccionar columnas no agrupadas — PostgreSQL siempre es estricto. `PERCENTILE_CONT`, `PERCENTILE_DISC`, `GROUPING SETS` y `FILTER` no existen en MySQL. `string_agg` → `GROUP_CONCAT` en MySQL.

---

## 4. CASE

`CASE` is SQL's if/else. It can appear in SELECT, WHERE, ORDER BY, GROUP BY, and inside aggregates.

```sql
-- Searched CASE (most common)
SELECT
    name,
    price,
    CASE
        WHEN price < 50   THEN 'budget'
        WHEN price < 200  THEN 'mid-range'
        WHEN price >= 200 THEN 'premium'
        ELSE 'unknown'
    END AS price_tier
FROM products;

-- Simple CASE (equality only)
SELECT
    name,
    CASE status
        WHEN 'A' THEN 'Active'
        WHEN 'I' THEN 'Inactive'
        ELSE 'Other'
    END AS status_label
FROM users;

-- CASE inside an aggregate — conditional count/sum
SELECT
    COUNT(*)                                         AS total,
    SUM(CASE WHEN status = 'paid'    THEN 1 ELSE 0 END) AS paid,
    SUM(CASE WHEN status = 'refund'  THEN amount ELSE 0 END) AS refunded_amount
FROM orders;

-- CASE in ORDER BY
SELECT name, status
FROM tasks
ORDER BY
    CASE status
        WHEN 'urgent'  THEN 1
        WHEN 'normal'  THEN 2
        ELSE 3
    END;

-- CASE to pivot data (manual pivot)
SELECT
    month,
    SUM(CASE WHEN region = 'north' THEN sales ELSE 0 END) AS north,
    SUM(CASE WHEN region = 'south' THEN sales ELSE 0 END) AS south
FROM monthly_sales
GROUP BY month;
```

---

## 5. Subqueries & EXISTS

A subquery is a SELECT inside another query. Use them when you can't express something as a simple join.

```sql
-- Scalar subquery — returns one value
SELECT name, price,
    (SELECT AVG(price) FROM products) AS global_avg
FROM products;

-- IN subquery — match against a list
SELECT name FROM users
WHERE id IN (
    SELECT DISTINCT user_id FROM orders WHERE total > 1000
);

-- NOT IN subquery — be careful with NULLs!
SELECT name FROM users
WHERE id NOT IN (
    SELECT user_id FROM orders WHERE user_id IS NOT NULL  -- must exclude NULLs
);

-- Correlated subquery — references the outer query (runs once per row)
SELECT name, price
FROM products p
WHERE price > (
    SELECT AVG(price)
    FROM products
    WHERE category = p.category   -- references outer p
);

-- EXISTS — true if subquery returns at least one row (efficient)
SELECT name FROM users u
WHERE EXISTS (
    SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.total > 500
);

-- NOT EXISTS — users with no orders
SELECT name FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM orders o WHERE o.user_id = u.id
);

-- Subquery in FROM (derived table)
SELECT dept, avg_salary
FROM (
    SELECT department AS dept, AVG(salary) AS avg_salary
    FROM employees
    GROUP BY department
) AS dept_stats
WHERE avg_salary > 60000;
```

> **Gotcha:** `NOT IN` with a subquery breaks if any returned value is NULL — the whole condition becomes UNKNOWN. Use `NOT EXISTS` or `LEFT JOIN ... WHERE IS NULL` instead.

---

## 6. CTEs (WITH)

Common Table Expressions make complex queries readable by naming intermediate results. Evaluated once (unless `MATERIALIZED` is overridden).

```sql
-- Basic CTE
WITH active_users AS (
    SELECT id, name, email
    FROM users
    WHERE active = true AND deleted_at IS NULL
)
SELECT *
FROM active_users
WHERE email LIKE '%@company.com';

-- Multiple CTEs (chained)
WITH
revenue AS (
    SELECT user_id, SUM(total) AS total_spent
    FROM orders
    GROUP BY user_id
),
high_value AS (
    SELECT user_id, total_spent
    FROM revenue
    WHERE total_spent > 1000
)
SELECT u.name, hv.total_spent
FROM high_value hv
JOIN users u ON u.id = hv.user_id
ORDER BY hv.total_spent DESC;

-- Recursive CTE — walk a hierarchy (org chart, categories tree)
WITH RECURSIVE org_tree AS (
    -- Base case: top-level employees (no manager)
    SELECT id, name, manager_id, 0 AS depth
    FROM employees
    WHERE manager_id IS NULL

    UNION ALL

    -- Recursive step: join to find direct reports
    SELECT e.id, e.name, e.manager_id, ot.depth + 1
    FROM employees e
    JOIN org_tree ot ON ot.id = e.manager_id
)
SELECT id, name, depth
FROM org_tree
ORDER BY depth, name;
```

> **Gotcha:** In PostgreSQL, CTEs are optimization fences by default — the planner can't push WHERE filters inside them. If performance matters, use `WITH ... AS NOT MATERIALIZED (...)` (PG 12+) or a subquery in FROM.

> **vs MySQL:** CTEs (incluyendo recursivos) se agregaron en MySQL 8.0. En MySQL los CTEs no son optimization fences — el planner los puede optimizar libremente.

---

## 7. Window Functions

Window functions compute a value across a set of rows *related to the current row*, without collapsing rows like GROUP BY does.

```sql
-- Syntax skeleton
function_name() OVER (
    PARTITION BY col    -- optional: reset per group
    ORDER BY col        -- optional: defines order within window
    ROWS BETWEEN ...    -- optional: frame
)
```

### Ranking functions

```sql
SELECT
    name,
    department,
    salary,
    ROW_NUMBER()   OVER (PARTITION BY department ORDER BY salary DESC) AS row_num,
    RANK()         OVER (PARTITION BY department ORDER BY salary DESC) AS rank,       -- gaps on ties
    DENSE_RANK()   OVER (PARTITION BY department ORDER BY salary DESC) AS dense_rank, -- no gaps
    NTILE(4)       OVER (PARTITION BY department ORDER BY salary DESC) AS quartile
FROM employees;
```

### Offset functions

```sql
SELECT
    date,
    revenue,
    LAG(revenue)           OVER (ORDER BY date)              AS prev_day,
    LAG(revenue, 7)        OVER (ORDER BY date)              AS week_ago,
    LEAD(revenue)          OVER (ORDER BY date)              AS next_day,
    FIRST_VALUE(revenue)   OVER (ORDER BY date)              AS first_ever,
    LAST_VALUE(revenue)    OVER (ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS last_ever
FROM daily_revenue;
```

### Aggregate window functions

```sql
SELECT
    date,
    revenue,
    SUM(revenue)  OVER (ORDER BY date ROWS UNBOUNDED PRECEDING) AS running_total,
    AVG(revenue)  OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS rolling_7day_avg,
    SUM(revenue)  OVER (PARTITION BY month ORDER BY date ROWS UNBOUNDED PRECEDING) AS monthly_running
FROM daily_revenue;
```

### FILTER in window functions

```sql
-- Count only paid orders in a running window
SELECT
    date,
    COUNT(*) FILTER (WHERE status = 'paid') OVER (ORDER BY date ROWS UNBOUNDED PRECEDING) AS running_paid_count,
    SUM(amount) FILTER (WHERE category = 'electronics') OVER (PARTITION BY month ORDER BY date) AS electronics_running
FROM orders;
```

### Common pattern: top-N per group

```sql
SELECT * FROM (
    SELECT
        *,
        ROW_NUMBER() OVER (PARTITION BY category ORDER BY sales DESC) AS rn
    FROM products
) ranked
WHERE rn <= 3;   -- top 3 per category
```

> **Gotcha:** You can't use window functions in WHERE or HAVING — wrap in a subquery or CTE.

> **vs MySQL:** Window functions se agregaron en MySQL 8.0. La sintaxis es casi idéntica, pero MySQL no soporta `FILTER (WHERE ...)` dentro de window functions.

---

## 8. Set Operations

Combine results of two queries. Column count and types must match.

```sql
-- UNION — combine, remove duplicates (slower)
SELECT id, name FROM employees
UNION
SELECT id, name FROM contractors;

-- UNION ALL — combine, keep duplicates (faster, use when you know no dups)
SELECT 'employee' AS type, id, name FROM employees
UNION ALL
SELECT 'contractor', id, name FROM contractors;

-- INTERSECT — rows present in both result sets
SELECT user_id FROM orders_2025
INTERSECT
SELECT user_id FROM orders_2026;

-- EXCEPT — rows in first set but NOT in second
SELECT id FROM users
EXCEPT
SELECT user_id FROM orders;  -- users who never ordered
```

---

## 9. INSERT / UPDATE / DELETE / UPSERT

```sql
-- INSERT single row
INSERT INTO products (name, price, category)
VALUES ('iPad Pro', 1099.00, 'electronics');

-- INSERT multiple rows
INSERT INTO products (name, price)
VALUES
    ('AirPods', 179.00),
    ('MagSafe', 39.00);

-- INSERT ... RETURNING — get back the generated id
INSERT INTO products (name, price)
VALUES ('Apple Watch', 399.00)
RETURNING id, name;

-- INSERT from SELECT
INSERT INTO products_archive
SELECT * FROM products WHERE deleted_at IS NOT NULL;

-- UPSERT — insert or update on conflict
INSERT INTO products (id, name, price)
VALUES (1, 'iPhone 15', 999.00)
ON CONFLICT (id) DO UPDATE
    SET name  = EXCLUDED.name,
        price = EXCLUDED.price,
        updated_at = now();

-- ON CONFLICT DO NOTHING — silently ignore duplicates
INSERT INTO tags (name) VALUES ('sale')
ON CONFLICT (name) DO NOTHING;

-- UPDATE
UPDATE products
SET price = price * 0.9,
    updated_at = now()
WHERE category = 'electronics' AND active = true;

-- UPDATE ... FROM (join another table)
UPDATE orders o
SET total = subq.new_total
FROM (
    SELECT order_id, SUM(price * qty) AS new_total
    FROM order_items
    GROUP BY order_id
) AS subq
WHERE o.id = subq.order_id;

-- UPDATE ... RETURNING
UPDATE products SET price = 0 WHERE id = 5
RETURNING id, name, price;

-- DELETE
DELETE FROM products WHERE id = 42;

-- DELETE ... USING (join)
DELETE FROM order_items oi
USING orders o
WHERE oi.order_id = o.id AND o.status = 'cancelled';

-- DELETE ... RETURNING
DELETE FROM sessions WHERE expires_at < now()
RETURNING id;

-- TRUNCATE — fast delete all rows (cannot WHERE filter)
TRUNCATE TABLE logs;
TRUNCATE TABLE products RESTART IDENTITY CASCADE;
```

> **vs MySQL:** `RETURNING` no existe en MySQL — para obtener el id generado se usa `LAST_INSERT_ID()`. El upsert en MySQL se hace con `ON DUPLICATE KEY UPDATE` (no `ON CONFLICT`). MySQL también tiene `INSERT IGNORE` para ignorar duplicados. `UPDATE ... FROM` no existe en MySQL — se usa `UPDATE a JOIN b ON ... SET`.

---

## 10. Transactions

A transaction groups SQL statements so they all succeed or all fail together (ACID).

```sql
-- Basic transaction
BEGIN;
    UPDATE accounts SET balance = balance - 100 WHERE id = 1;
    UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;   -- or ROLLBACK to undo everything

-- Rollback on error
BEGIN;
    DELETE FROM orders WHERE user_id = 99;
    -- something went wrong:
ROLLBACK;

-- SAVEPOINT — partial rollback
BEGIN;
    INSERT INTO logs (msg) VALUES ('step 1');
    SAVEPOINT sp1;

    INSERT INTO logs (msg) VALUES ('step 2');
    -- oops, undo only step 2:
    ROLLBACK TO SAVEPOINT sp1;

    INSERT INTO logs (msg) VALUES ('step 2 retry');
COMMIT;

-- Isolation levels (SET at transaction start)
BEGIN;
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
-- reads within this tx see a consistent snapshot
COMMIT;
```

| Level | Dirty Read | Non-repeatable Read | Phantom Read |
|---|---|---|---|
| READ COMMITTED (default) | No | Yes | Yes |
| REPEATABLE READ | No | No | No* |
| SERIALIZABLE | No | No | No |

*PostgreSQL REPEATABLE READ also prevents phantoms.

```sql
-- Explicit row locking
SELECT * FROM orders WHERE id = 5 FOR UPDATE;          -- lock for write
SELECT * FROM orders WHERE id = 5 FOR SHARE;           -- lock for read
SELECT * FROM orders WHERE id = 5 FOR UPDATE SKIP LOCKED; -- skip locked rows (queue pattern)
```

---

## 11. DDL & Constraints

```sql
-- CREATE TABLE
CREATE TABLE users (
    id          SERIAL PRIMARY KEY,           -- auto-increment integer
    uuid        UUID DEFAULT gen_random_uuid(),
    email       VARCHAR(255) NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    age         INTEGER CHECK (age >= 0 AND age <= 150),
    role        TEXT DEFAULT 'user',
    created_at  TIMESTAMPTZ DEFAULT now(),
    deleted_at  TIMESTAMPTZ
);

-- IDENTITY (modern alternative to SERIAL)
CREATE TABLE items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY
);

-- Foreign key
CREATE TABLE orders (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL,
    CONSTRAINT fk_orders_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE      -- options: CASCADE, SET NULL, RESTRICT, NO ACTION
        ON UPDATE CASCADE
);

-- Composite primary key
CREATE TABLE order_items (
    order_id    INTEGER REFERENCES orders(id),
    product_id  INTEGER REFERENCES products(id),
    qty         INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (order_id, product_id)
);

-- ALTER TABLE
ALTER TABLE products ADD COLUMN tags TEXT[];
ALTER TABLE products DROP COLUMN caption;
ALTER TABLE products ALTER COLUMN price SET NOT NULL;
ALTER TABLE products ALTER COLUMN price SET DEFAULT 0;
ALTER TABLE products ALTER COLUMN price TYPE NUMERIC(10,2);
ALTER TABLE products RENAME COLUMN caption TO description;
ALTER TABLE products RENAME TO items;

-- Add/drop constraints
ALTER TABLE products ADD CONSTRAINT chk_price CHECK (price >= 0);
ALTER TABLE products DROP CONSTRAINT chk_price;
ALTER TABLE users ADD CONSTRAINT uq_email UNIQUE (email);

-- DROP
DROP TABLE products;
DROP TABLE IF EXISTS products CASCADE;  -- CASCADE drops dependents
```

> **vs MySQL:** `SERIAL` → MySQL usa `INT AUTO_INCREMENT`. `GENERATED ALWAYS AS IDENTITY` no existe en MySQL (solo `AUTO_INCREMENT`). `CASCADE` en `DROP TABLE` no existe en MySQL — hay que borrar las tablas hijas primero. MySQL no tiene UUID nativo como tipo; se suele usar `CHAR(36)` + `UUID()`.

---

## 12. Indexes

Indexes speed up reads at the cost of slower writes. PostgreSQL picks the index automatically.

```sql
-- B-tree (default) — equality, range, ORDER BY, LIKE 'prefix%'
CREATE INDEX idx_products_price ON products (price);
CREATE INDEX idx_products_category_price ON products (category, price DESC);

-- Partial index — only index a subset of rows (smaller, faster)
CREATE INDEX idx_orders_pending ON orders (created_at)
WHERE status = 'pending';

-- Unique index
CREATE UNIQUE INDEX idx_users_email ON users (email);

-- GIN — arrays, JSONB, full-text search (multi-value)
CREATE INDEX idx_products_tags ON products USING GIN (tags);
CREATE INDEX idx_products_meta ON products USING GIN (metadata);   -- jsonb column

-- GiST — geometric types, full-text (alternative to GIN)
CREATE INDEX idx_fts ON articles USING GiST (to_tsvector('english', body));

-- BRIN — very large tables with natural sort order (timestamps, sequential IDs)
CREATE INDEX idx_logs_created ON logs USING BRIN (created_at);

-- Index on expression
CREATE INDEX idx_users_email_lower ON users (LOWER(email));

-- Non-blocking build (production safe)
CREATE INDEX CONCURRENTLY idx_big_table_col ON big_table (col);

-- Drop index
DROP INDEX idx_products_price;
DROP INDEX CONCURRENTLY idx_big_table_col;
```

**When indexes hurt:** High-write tables (every INSERT/UPDATE/DELETE must update the index). Tables so small a seq scan is faster. Very low-cardinality columns (boolean — rarely worth it).

> **vs MySQL:** MySQL no tiene índices GIN/GiST/BRIN ni índices parciales (`WHERE ...`). MySQL tiene índices FULLTEXT y SPATIAL. `CREATE INDEX CONCURRENTLY` no existe en MySQL (MySQL lockea la tabla por defecto, aunque InnoDB hace online DDL en versiones recientes). Los índices de expresión son soportados en MySQL 8.0+.

---

## 13. EXPLAIN ANALYZE

Shows the query execution plan and actual runtime. Essential for finding slow queries.

```sql
EXPLAIN SELECT * FROM products WHERE price > 100;
-- Shows plan without running the query

EXPLAIN ANALYZE SELECT * FROM products WHERE price > 100;
-- Runs the query AND shows actual timings (use on non-destructive queries)

EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) SELECT ...;
-- BUFFERS shows cache hits/misses
```

**Reading the output:**

```
Seq Scan on products  (cost=0.00..450.00 rows=1234 width=64)
                        (actual time=0.012..3.201 rows=1187 loops=1)
  Filter: (price > 100)
  Rows Removed by Filter: 4813
```

| Term | Meaning |
|---|---|
| `cost=X..Y` | Estimated startup cost .. total cost (arbitrary units) |
| `rows=N` | Estimated row count |
| `actual time=X..Y` | Real ms startup .. total |
| `loops=N` | How many times this node ran |
| `Seq Scan` | Full table scan — no usable index |
| `Index Scan` | Uses index to find rows, then fetches from heap |
| `Index Only Scan` | All data in index, no heap fetch (fastest) |
| `Bitmap Heap Scan` | Index + heap fetch, batched |
| `Hash Join` | Builds hash table, then probes it |
| `Nested Loop` | For each outer row, scans inner — good for small inner |
| `Merge Join` | Both inputs sorted; good for large sorted sets |

**Common slow-query causes:**
- `Seq Scan` on a large table → missing index
- `rows=5 actual rows=50000` → stale statistics → run `ANALYZE table_name`
- `Rows Removed by Filter: 99999` → index not selective enough
- `Nested Loop` with huge inner → consider `Hash Join` with `enable_nestloop=off` temporarily

---

## 14. Arrays

PostgreSQL arrays are first-class: you can store, query, and manipulate them directly.

```sql
-- Create table with array column
CREATE TABLE products (
    id      SERIAL PRIMARY KEY,
    name    TEXT,
    tags    TEXT[],
    scores  INTEGER[]
);

-- Insert
INSERT INTO products (name, tags, scores)
VALUES
    ('iPhone', ARRAY['apple', 'smartphone', 'premium'], ARRAY[95, 87, 92]),
    ('Galaxy', ARRAY['samsung', 'smartphone'],           ARRAY[88, 91]);

-- Access by index (1-based!)
SELECT tags[1] AS first_tag FROM products;

-- Array length
SELECT array_length(tags, 1) AS num_tags FROM products;

-- Contains single element
SELECT * FROM products WHERE 'apple' = ANY(tags);

-- Contains all elements (@>)
SELECT * FROM products WHERE tags @> ARRAY['apple', 'smartphone'];

-- Is contained by (<@)
SELECT * FROM products WHERE ARRAY['apple'] <@ tags;

-- Overlap (&&) — any element in common
SELECT * FROM products WHERE tags && ARRAY['samsung', 'huawei'];

-- Append / remove
UPDATE products SET tags = array_append(tags, 'sale')   WHERE id = 1;
UPDATE products SET tags = array_remove(tags, 'premium') WHERE id = 1;

-- Concatenate arrays
UPDATE products SET tags = tags || ARRAY['new', 'hot'] WHERE id = 1;

-- Unnest — expand array to rows
SELECT id, name, unnest(tags) AS tag FROM products;

-- Aggregate into array
SELECT category, ARRAY_AGG(name ORDER BY name) AS product_names
FROM products
GROUP BY category;

-- string_to_array / array_to_string
SELECT string_to_array('a,b,c', ',');          -- {a,b,c}
SELECT array_to_string(ARRAY['a','b'], '-');   -- a-b

-- GIN index for fast array searches
CREATE INDEX idx_products_tags ON products USING GIN (tags);
```

> **vs MySQL:** MySQL no tiene tipos array nativos. Se suele emular con JSON o una tabla de relación. Operadores como `@>`, `ANY()`, `unnest()` y `array_agg()` no existen.

---

## 15. JSONB

`JSONB` stores JSON as binary (indexed, faster queries). Prefer over `JSON` unless you need to preserve key order.

```sql
-- Create table
CREATE TABLE events (
    id      SERIAL PRIMARY KEY,
    data    JSONB
);

INSERT INTO events (data) VALUES
    ('{"user": "alice", "action": "login",  "meta": {"ip": "1.2.3.4", "tags": ["web","mobile"]}}'),
    ('{"user": "bob",   "action": "purchase","meta": {"amount": 99.9}}');

-- Access operators
SELECT
    data->>'user'             AS user_text,       -- -> returns jsonb, ->> returns text
    data->'meta'              AS meta_jsonb,
    data->'meta'->>'ip'       AS ip,
    data#>>'{meta,ip}'        AS ip_path          -- path operator
FROM events;

-- Filter by JSONB value
SELECT * FROM events WHERE data->>'action' = 'login';
SELECT * FROM events WHERE data->'meta'->>'amount' IS NOT NULL;

-- Containment (@>) — does json contain this sub-document?
SELECT * FROM events WHERE data @> '{"action": "login"}';
SELECT * FROM events WHERE data @> '{"meta": {"tags": ["web"]}}';

-- Key existence (?)
SELECT * FROM events WHERE data ? 'user';          -- has key "user"
SELECT * FROM events WHERE data ?| ARRAY['user','email'];  -- has any of these keys
SELECT * FROM events WHERE data ?& ARRAY['user','action']; -- has all of these keys

-- Modify JSONB
UPDATE events
SET data = jsonb_set(data, '{meta,processed}', 'true')
WHERE id = 1;

UPDATE events
SET data = data - 'action'   -- remove a key
WHERE id = 2;

-- Expand to rows
SELECT id, key, value
FROM events, jsonb_each(data);

-- Expand array inside JSONB
SELECT id, elem
FROM events, jsonb_array_elements(data->'meta'->'tags') AS elem
WHERE data ? 'meta';

-- Aggregate to JSONB
SELECT jsonb_agg(data) AS all_events FROM events;
SELECT jsonb_object_agg(data->>'user', data->>'action') FROM events;

-- GIN index for fast JSONB queries
CREATE INDEX idx_events_data ON events USING GIN (data);
-- Or index a specific path:
CREATE INDEX idx_events_action ON events USING GIN ((data->'action'));
```

---

## 16. Views & Materialized Views

### Views

A view is a saved query. No data is stored; it runs the query on every access.

```sql
CREATE OR REPLACE VIEW active_users AS
SELECT id, name, email, created_at
FROM users
WHERE active = true AND deleted_at IS NULL;

-- Use it like a table
SELECT * FROM active_users WHERE name ILIKE '%alice%';

-- Updatable view (simple views only)
UPDATE active_users SET name = 'Alice Smith' WHERE id = 1;

DROP VIEW active_users;
```

### Materialized Views

Stores the query result physically. Must be refreshed manually. Use when the query is expensive and data can be slightly stale.

```sql
CREATE MATERIALIZED VIEW monthly_sales AS
SELECT
    date_trunc('month', created_at) AS month,
    SUM(total) AS revenue,
    COUNT(*)   AS order_count
FROM orders
GROUP BY date_trunc('month', created_at);

-- Refresh (blocks reads)
REFRESH MATERIALIZED VIEW monthly_sales;

-- Refresh without blocking reads (requires unique index)
CREATE UNIQUE INDEX ON monthly_sales (month);
REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_sales;

-- Query it
SELECT * FROM monthly_sales WHERE month >= '2026-01-01';

DROP MATERIALIZED VIEW monthly_sales;
```

> **When to use each:** View = always fresh, cheap to maintain, use for frequently-changing data. Materialized View = fast reads, stale data OK, use for expensive aggregations run on a schedule.

> **vs MySQL:** MySQL tiene `JSON` (similar al `JSON` de PostgreSQL, no al `JSONB`) — sin indexación GIN, sin operadores `@>`, `?`, `#>>`. Los equivalentes son `JSON_EXTRACT(col, '$.key')` y `JSON_CONTAINS()`. **Materialized Views no existen en MySQL** — se emulan con una tabla normal + procedimiento que la repopula periódicamente.

---

## 17. Functions (PL/pgSQL)

Functions encapsulate reusable logic. They can return a scalar, a table, or nothing.

```sql
-- Scalar function: returns a single value
CREATE OR REPLACE FUNCTION full_name(first TEXT, last TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN first || ' ' || last;
END;
$$;

SELECT full_name('Alice', 'Smith');

-- Function with DECLARE block
CREATE OR REPLACE FUNCTION get_user_tier(p_user_id INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_total NUMERIC;
    v_tier  TEXT;
BEGIN
    SELECT SUM(total) INTO v_total
    FROM orders
    WHERE user_id = p_user_id;

    v_tier := CASE
        WHEN v_total >= 10000 THEN 'platinum'
        WHEN v_total >= 1000  THEN 'gold'
        WHEN v_total >= 100   THEN 'silver'
        ELSE 'bronze'
    END;

    RETURN v_tier;
END;
$$;

-- Table-valued function: returns a set of rows
CREATE OR REPLACE FUNCTION top_products(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (id INTEGER, name TEXT, total_sold BIGINT)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
        SELECT p.id, p.name, SUM(oi.qty)::BIGINT
        FROM products p
        JOIN order_items oi ON oi.product_id = p.id
        GROUP BY p.id, p.name
        ORDER BY SUM(oi.qty) DESC
        LIMIT p_limit;
END;
$$;

SELECT * FROM top_products(5);

-- SQL function (simpler, no plpgsql overhead)
CREATE OR REPLACE FUNCTION discount_price(price NUMERIC, pct NUMERIC)
RETURNS NUMERIC
LANGUAGE sql
AS $$
    SELECT price * (1 - pct / 100);
$$;

-- Drop
DROP FUNCTION full_name(TEXT, TEXT);
```

---

## 18. Stored Procedures

Procedures are like functions but can `COMMIT`/`ROLLBACK` internally. Called with `CALL`.

```sql
CREATE OR REPLACE PROCEDURE archive_old_orders(p_days INTEGER DEFAULT 90)
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Move old orders to archive table
    INSERT INTO orders_archive
    SELECT * FROM orders
    WHERE created_at < now() - (p_days || ' days')::INTERVAL;

    GET DIAGNOSTICS v_count = ROW_COUNT;

    DELETE FROM orders
    WHERE created_at < now() - (p_days || ' days')::INTERVAL;

    RAISE NOTICE 'Archived % orders', v_count;
    COMMIT;  -- procedures can commit; functions cannot
END;
$$;

CALL archive_old_orders(60);
CALL archive_old_orders();   -- uses default 90
```

> **Function vs Procedure:** Functions `RETURN` a value and can be used in SQL expressions (`SELECT my_func()`). Procedures use `CALL`, return nothing (or `INOUT` params), and can commit transactions.

---

## 19. Triggers

Triggers automatically execute a function in response to an INSERT, UPDATE, or DELETE.

```sql
-- Step 1: create the trigger function (must return trigger)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := now();  -- NEW = the row being inserted/updated
    RETURN NEW;               -- must return NEW for BEFORE row triggers
END;
$$;

-- Step 2: create the trigger
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Audit log trigger example
CREATE OR REPLACE FUNCTION log_product_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, operation, old_data, changed_at)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD), now());
        RETURN OLD;
    ELSE  -- INSERT or UPDATE
        INSERT INTO audit_log (table_name, operation, old_data, new_data, changed_at)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD), row_to_json(NEW), now());
        RETURN NEW;
    END IF;
END;
$$;

CREATE TRIGGER trg_products_audit
AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH ROW
EXECUTE FUNCTION log_product_changes();

-- Conditional trigger (WHEN clause)
CREATE TRIGGER trg_notify_price_change
AFTER UPDATE OF price ON products
FOR EACH ROW
WHEN (OLD.price IS DISTINCT FROM NEW.price)  -- only fires when price actually changes
EXECUTE FUNCTION notify_price_change();

-- Drop trigger
DROP TRIGGER trg_users_updated_at ON users;

-- Disable / enable without dropping
ALTER TABLE users DISABLE TRIGGER trg_users_updated_at;
ALTER TABLE users ENABLE  TRIGGER trg_users_updated_at;
```

| Variable | Meaning |
|---|---|
| `NEW` | The new row (INSERT/UPDATE) |
| `OLD` | The old row (UPDATE/DELETE) |
| `TG_OP` | `'INSERT'`, `'UPDATE'`, or `'DELETE'` |
| `TG_TABLE_NAME` | Name of the table that fired the trigger |
| `TG_WHEN` | `'BEFORE'` or `'AFTER'` |

---

## 20. PL/pgSQL Control Flow

```sql
CREATE OR REPLACE FUNCTION example_control_flow(p_val INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_result TEXT := '';
    v_row    RECORD;
    v_i      INTEGER;
BEGIN

    -- IF / ELSIF / ELSE
    IF p_val > 100 THEN
        v_result := 'big';
    ELSIF p_val > 10 THEN
        v_result := 'medium';
    ELSE
        v_result := 'small';
    END IF;

    -- Basic LOOP with EXIT
    v_i := 0;
    LOOP
        v_i := v_i + 1;
        EXIT WHEN v_i >= 5;
    END LOOP;

    -- WHILE
    WHILE v_i < 10 LOOP
        v_i := v_i + 1;
    END LOOP;

    -- FOR with integer range
    FOR v_i IN 1..5 LOOP
        RAISE NOTICE 'i = %', v_i;
    END LOOP;

    -- FOR with REVERSE
    FOR v_i IN REVERSE 5..1 LOOP
        RAISE NOTICE 'i = %', v_i;
    END LOOP;

    -- FOR over a query
    FOR v_row IN SELECT id, name FROM products WHERE active = true LOOP
        RAISE NOTICE 'Product: % - %', v_row.id, v_row.name;
    END LOOP;

    -- CONTINUE — skip to next iteration
    FOR v_i IN 1..10 LOOP
        CONTINUE WHEN v_i % 2 = 0;   -- skip even numbers
        RAISE NOTICE 'odd: %', v_i;
    END LOOP;

    -- RAISE levels
    RAISE DEBUG   'debug message (only shown if log_min_messages=debug)';
    RAISE NOTICE  'info for the client: %', v_result;
    RAISE WARNING 'something looks off';
    RAISE EXCEPTION 'fatal error: %', 'something broke';  -- rolls back tx

    RETURN v_result;
END;
$$;
```

```sql
-- Exception handling
BEGIN
    INSERT INTO products (name) VALUES ('test');
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'Duplicate, skipping';
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'FK error';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Unexpected error: %', SQLERRM;
END;
```

---

## 21. String Functions

```sql
-- Length
SELECT length('hello');           -- 5 (chars)
SELECT octet_length('hello');     -- 5 (bytes; differs for multi-byte chars)

-- Case
SELECT lower('Hello World');      -- hello world
SELECT upper('Hello World');      -- HELLO WORLD
SELECT initcap('hello world');    -- Hello World

-- Trim
SELECT trim('  hello  ');         -- 'hello'
SELECT ltrim('  hello  ');        -- 'hello  '
SELECT rtrim('  hello  ');        -- '  hello'
SELECT trim(BOTH 'x' FROM 'xxhelloxx');  -- 'hello'

-- Concat
SELECT 'Hello' || ' ' || 'World';         -- Hello World
SELECT concat('Hello', ' ', 'World');      -- Hello World
SELECT concat_ws(', ', 'Alice', 'Bob');    -- Alice, Bob

-- Substring / extraction
SELECT substring('Hello World' FROM 1 FOR 5);  -- Hello
SELECT left('Hello World', 5);                 -- Hello
SELECT right('Hello World', 5);                -- World

-- Search
SELECT position('World' IN 'Hello World');     -- 7
SELECT strpos('Hello World', 'World');         -- 7

-- Replace
SELECT replace('Hello World', 'World', 'PG'); -- Hello PG
SELECT translate('abc', 'abc', 'xyz');         -- xyz (char-by-char)

-- Split
SELECT split_part('a,b,c', ',', 2);                -- b
SELECT string_to_array('a,b,c', ',');              -- {a,b,c}
SELECT array_to_string(ARRAY['a','b','c'], '-');   -- a-b-c

-- Pad / repeat / reverse
SELECT lpad('42', 6, '0');     -- 000042
SELECT rpad('hi', 5, '.');     -- hi...
SELECT repeat('ab', 3);        -- ababab
SELECT reverse('hello');       -- olleh

-- Format
SELECT format('Hello %s, you are %s', 'Alice', 'admin');  -- Hello Alice, you are admin

-- Regex
SELECT regexp_replace('abc123', '[0-9]+', 'NUM');          -- abcNUM
SELECT regexp_match('abc123def', '[0-9]+');                -- {123}
SELECT regexp_matches('a1b2c3', '[0-9]', 'g');            -- {1}, {2}, {3}
SELECT regexp_split_to_array('a1b2c3', '[0-9]');          -- {a,b,c,}
SELECT regexp_split_to_table('a,b,,c', ',');              -- rows: a b (empty) c

-- Pattern matching
SELECT 'hello' LIKE '%ell%';           -- true
SELECT 'hello' ILIKE '%ELL%';          -- true (case-insensitive)
SELECT 'hello' SIMILAR TO '(hi|hello)'; -- true
SELECT 'hello' ~ '^h';                  -- true (regex)
SELECT 'hello' ~* '^H';                 -- true (regex case-insensitive)
SELECT 'hello' !~ '[0-9]';              -- true (regex no match)

-- Aggregate
SELECT string_agg(name, ', ' ORDER BY name) FROM products;

-- Misc
SELECT md5('password');               -- MD5 hash
SELECT ascii('A');                    -- 65
SELECT chr(65);                       -- A
```

> **vs MySQL:** `||` en MySQL es el operador lógico OR (no concatenación) — usar `CONCAT()` en su lugar. `string_agg()` → `GROUP_CONCAT()` en MySQL. `ILIKE` no existe. Regex en MySQL usa `REGEXP` / `RLIKE` en lugar de `~`. `SIMILAR TO` no existe en MySQL.

---

## 22. Date / Time Functions

```sql
-- Current moment
SELECT now();                        -- timestamp with timezone
SELECT current_timestamp;            -- same, SQL standard
SELECT current_date;                 -- date only
SELECT current_time;                 -- time only

-- Cast
SELECT now()::date;                  -- today's date
SELECT now()::time;                  -- current time
SELECT '2026-06-16'::date;
SELECT '2026-06-16 10:30:00'::timestamptz;

-- Extract parts
SELECT extract(year  FROM now());    -- 2026
SELECT extract(month FROM now());    -- 6
SELECT extract(day   FROM now());    -- 16
SELECT extract(hour  FROM now());
SELECT extract(dow   FROM now());    -- day of week: 0=Sun, 6=Sat
SELECT extract(epoch FROM now());    -- Unix timestamp (seconds since 1970)
SELECT date_part('year', now());     -- same as extract, alternative syntax

-- Truncate to period (great for GROUP BY)
SELECT date_trunc('year',    now());  -- 2026-01-01 00:00:00
SELECT date_trunc('month',   now());  -- 2026-06-01 00:00:00
SELECT date_trunc('week',    now());  -- Monday of current week
SELECT date_trunc('day',     now());  -- today at 00:00:00
SELECT date_trunc('hour',    now());  -- current hour

-- Arithmetic
SELECT now() + interval '1 day';
SELECT now() - interval '30 days';
SELECT now() + interval '2 hours 30 minutes';
SELECT date '2026-12-31' - date '2026-06-16';  -- 198 (days as integer)
SELECT age('2026-06-16', '1990-03-15');         -- interval: 36 years 3 months 1 day

-- Format / parse
SELECT to_char(now(), 'YYYY-MM-DD HH24:MI:SS');
SELECT to_char(now(), 'Day, DD Month YYYY');
SELECT to_date('16/06/2026', 'DD/MM/YYYY');
SELECT to_timestamp('2026-06-16 10:30', 'YYYY-MM-DD HH24:MI');

-- Range filters
SELECT * FROM orders WHERE created_at >= now() - interval '7 days';
SELECT * FROM orders WHERE created_at::date = current_date;
SELECT * FROM orders WHERE created_at BETWEEN '2026-01-01' AND '2026-12-31';

-- Timezone
SELECT now() AT TIME ZONE 'UTC';
SELECT now() AT TIME ZONE 'America/New_York';
SELECT timezone('UTC', now());
```

### GENERATE_SERIES — fill date/number gaps

```sql
-- Generate a sequence of numbers
SELECT generate_series(1, 10);
SELECT generate_series(0, 100, 5);   -- 0,5,10,...,100

-- Generate a series of dates (one row per day)
SELECT generate_series(
    '2026-01-01'::date,
    '2026-01-31'::date,
    '1 day'::interval
)::date AS day;

-- Fill date gaps — left join sales onto calendar
SELECT
    cal.day,
    COALESCE(SUM(o.total), 0) AS revenue
FROM generate_series(
    '2026-06-01'::date,
    '2026-06-30'::date,
    '1 day'::interval
) AS cal(day)
LEFT JOIN orders o ON o.created_at::date = cal.day
GROUP BY cal.day
ORDER BY cal.day;

-- Monthly series
SELECT generate_series(
    date_trunc('month', now() - interval '11 months'),
    date_trunc('month', now()),
    '1 month'::interval
)::date AS month;
```

> **vs MySQL:** Funciones distintas: `NOW()` equivale pero `CURDATE()` → `current_date`, `DATE_FORMAT(date, '%Y-%m')` → `to_char(date, 'YYYY-MM')`, `DATEDIFF(a, b)` → `(a::date - b::date)` o `age()`. `date_trunc()` no existe en MySQL — se emula con `DATE_FORMAT` o `DATE(DATE_SUB(...))`. `generate_series()` no existe en MySQL — se emula con una tabla de números o un CTE recursivo.

---

## 23. Math & NULL Functions

```sql
-- Basic arithmetic
SELECT 10 + 3, 10 - 3, 10 * 3, 10 / 3, 10.0 / 3, 10 % 3;
-- Integer division truncates: 10/3 = 3. Cast to get decimals: 10::numeric/3

-- Rounding
SELECT round(3.567, 2);   -- 3.57
SELECT round(3.5);        -- 4
SELECT floor(3.9);        -- 3
SELECT ceil(3.1);         -- 4
SELECT trunc(3.9);        -- 3 (toward zero)

-- Absolute / power / sqrt
SELECT abs(-42);           -- 42
SELECT power(2, 10);       -- 1024
SELECT sqrt(144);          -- 12

-- Min / max across columns (not aggregate)
SELECT greatest(10, 20, 5);   -- 20
SELECT least(10, 20, 5);      -- 5

-- Random
SELECT random();              -- 0.0 to 1.0
SELECT floor(random() * 10)::int;   -- random integer 0-9

-- NULL handling
SELECT coalesce(null, null, 'fallback');  -- 'fallback' (first non-null)
SELECT coalesce(price, 0) FROM products;  -- replace null price with 0

SELECT nullif(10, 10);        -- NULL (if a = b, return null; prevents /0)
SELECT nullif(10, 0);         -- 10

-- Safe division (avoid division by zero)
SELECT revenue / nullif(visits, 0) AS conversion_rate FROM stats;

-- NULL in comparisons
SELECT null = null;       -- NULL (not true!)
SELECT null IS NULL;      -- true
SELECT null IS NOT NULL;  -- false
SELECT 1 IS DISTINCT FROM null;      -- true  (null-safe comparison)
SELECT null IS NOT DISTINCT FROM null; -- true
```

---

## 24. Full-Text Search

```sql
-- to_tsvector: convert text to searchable vector
-- to_tsquery: convert search string to query

SELECT to_tsvector('english', 'The quick brown fox jumps');
-- 'brown':3 'fox':4 'jump':5 'quick':2

SELECT to_tsquery('english', 'quick & fox');
-- 'quick' & 'fox'

-- @@ operator: does vector match query?
SELECT 'The quick brown fox'::tsvector @@ 'fox'::tsquery;  -- true

-- Real usage
SELECT id, title
FROM articles
WHERE to_tsvector('english', title || ' ' || body) @@ to_tsquery('english', 'postgres & index');

-- plainto_tsquery: plain text, no operators needed
SELECT * FROM articles
WHERE to_tsvector('english', body) @@ plainto_tsquery('english', 'quick brown fox');

-- websearch_to_tsquery: Google-style input
SELECT * FROM articles
WHERE to_tsvector('english', body) @@ websearch_to_tsquery('english', '"quick brown" -fox');

-- Ranking results
SELECT id, title, ts_rank(to_tsvector('english', body), query) AS rank
FROM articles, to_tsquery('english', 'postgres') query
WHERE to_tsvector('english', body) @@ query
ORDER BY rank DESC;

-- GIN index for fast FTS (use a generated column or expression index)
CREATE INDEX idx_articles_fts
ON articles USING GIN (to_tsvector('english', title || ' ' || body));

-- Or: add a generated tsvector column
ALTER TABLE articles ADD COLUMN fts_vector TSVECTOR
    GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || body)) STORED;
CREATE INDEX idx_articles_fts ON articles USING GIN (fts_vector);

-- Then query using the stored column (uses the index)
SELECT * FROM articles WHERE fts_vector @@ to_tsquery('english', 'postgres');

-- ts_headline: highlight matching terms
SELECT ts_headline('english', body, to_tsquery('postgres'),
    'MaxWords=50, MinWords=10') AS excerpt
FROM articles
WHERE fts_vector @@ to_tsquery('postgres');
```

> **vs MySQL:** MySQL tiene FTS con `MATCH(col) AGAINST('term' IN BOOLEAN MODE)` y requiere un índice `FULLTEXT`. No tiene `tsvector`, `tsquery`, `ts_rank`, ni `ts_headline`. La sintaxis y el modelo de ranking son completamente distintos.

---

## 25. Interview Patterns

Recurring question shapes in SQL tests. Memorize the pattern, adapt to the problem.

### 1. Delete duplicates — keep one row, remove the rest

```sql
-- Keep the row with the lowest id for each email
DELETE FROM users
WHERE id NOT IN (
    SELECT MIN(id)
    FROM users
    GROUP BY email
);

-- Alternative with ctid (PostgreSQL physical row id)
DELETE FROM users a
USING users b
WHERE a.email = b.email
  AND a.id > b.id;  -- keep the lower id
```

### 2. Find rows with no match (orphans / users with no orders)

```sql
-- Method 1: LEFT JOIN + IS NULL (usually fastest)
SELECT u.id, u.name
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE o.id IS NULL;

-- Method 2: NOT EXISTS
SELECT id, name FROM users u
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE user_id = u.id);

-- Method 3: NOT IN (avoid if subquery can return NULLs)
SELECT id, name FROM users
WHERE id NOT IN (SELECT user_id FROM orders WHERE user_id IS NOT NULL);
```

### 3. Running total that resets per group

```sql
-- Daily revenue with a monthly running total
SELECT
    date,
    date_trunc('month', date) AS month,
    revenue,
    SUM(revenue) OVER (
        PARTITION BY date_trunc('month', date)
        ORDER BY date
        ROWS UNBOUNDED PRECEDING
    ) AS monthly_running_total
FROM daily_revenue
ORDER BY date;
```

### 4. Find gaps in a sequence / missing IDs

```sql
-- Find missing IDs between 1 and max(id)
SELECT s.id AS missing_id
FROM generate_series(1, (SELECT MAX(id) FROM orders)) AS s(id)
LEFT JOIN orders o ON o.id = s.id
WHERE o.id IS NULL;

-- Find date gaps (days with no sales)
SELECT cal.day
FROM generate_series(
    (SELECT MIN(created_at)::date FROM orders),
    (SELECT MAX(created_at)::date FROM orders),
    '1 day'::interval
) AS cal(day)
LEFT JOIN orders o ON o.created_at::date = cal.day
WHERE o.id IS NULL;
```

### 5. Median per group

```sql
-- PERCENTILE_CONT is the cleanest way
SELECT
    category,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) AS median_price
FROM products
GROUP BY category;

-- Without PERCENTILE_CONT: ROW_NUMBER trick
SELECT category, AVG(price) AS median_price
FROM (
    SELECT
        category, price,
        ROW_NUMBER() OVER (PARTITION BY category ORDER BY price)        AS rn,
        COUNT(*)    OVER (PARTITION BY category)                        AS cnt
    FROM products
) t
WHERE rn IN (FLOOR((cnt + 1) / 2.0), CEIL((cnt + 1) / 2.0))
GROUP BY category;
```

### 6. Consecutive sequences / islands and gaps

```sql
-- Group consecutive dates into "islands" (e.g., login streaks)
SELECT
    user_id,
    MIN(login_date) AS streak_start,
    MAX(login_date) AS streak_end,
    COUNT(*)        AS streak_length
FROM (
    SELECT
        user_id,
        login_date,
        -- subtract row number from date: same value = consecutive group
        login_date - ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date)::int AS grp
    FROM user_logins
) t
GROUP BY user_id, grp
ORDER BY user_id, streak_start;
```

### 7. Pivot / transpose rows to columns

```sql
-- Manual pivot with CASE + GROUP BY
SELECT
    user_id,
    SUM(CASE WHEN product = 'A' THEN qty ELSE 0 END) AS product_a,
    SUM(CASE WHEN product = 'B' THEN qty ELSE 0 END) AS product_b,
    SUM(CASE WHEN product = 'C' THEN qty ELSE 0 END) AS product_c
FROM purchases
GROUP BY user_id;
```

### 8. Cumulative percentage / contribution

```sql
SELECT
    name,
    sales,
    SUM(sales) OVER ()                                          AS total_sales,
    ROUND(100.0 * sales / SUM(sales) OVER (), 2)               AS pct_of_total,
    ROUND(100.0 * SUM(sales) OVER (ORDER BY sales DESC) / SUM(sales) OVER (), 2) AS cumulative_pct
FROM products
ORDER BY sales DESC;
```

### 9. Second (Nth) highest value

```sql
-- Method 1: OFFSET
SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET 1;

-- Method 2: subquery
SELECT MAX(salary) FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);

-- Method 3: DENSE_RANK (generalizes to Nth)
SELECT salary FROM (
    SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk
    FROM employees
) t WHERE rnk = 2;
```

### 10. Compare current row to previous / calculate change

```sql
SELECT
    date,
    revenue,
    LAG(revenue) OVER (ORDER BY date)                               AS prev_revenue,
    revenue - LAG(revenue) OVER (ORDER BY date)                     AS change,
    ROUND(100.0 * (revenue - LAG(revenue) OVER (ORDER BY date))
          / NULLIF(LAG(revenue) OVER (ORDER BY date), 0), 2)        AS pct_change
FROM daily_revenue
ORDER BY date;
```

---

## 26. Practical Examples — Schema Completo con Outputs

Un schema de e-commerce mínimo que permite aplicar todos los conceptos. Cada query muestra el resultado real dado los datos de ejemplo.

### Schema y datos de ejemplo

```sql
-- Categorías con jerarquía (para recursive CTE)
CREATE TABLE categories (
    id        SERIAL PRIMARY KEY,
    name      TEXT NOT NULL,
    parent_id INTEGER REFERENCES categories(id)
);

CREATE TABLE users (
    id         SERIAL PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT UNIQUE NOT NULL,
    created_at DATE NOT NULL,
    active     BOOLEAN DEFAULT true
);

CREATE TABLE products (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    price       NUMERIC(10,2) NOT NULL,
    tags        TEXT[],
    metadata    JSONB
);

CREATE TABLE orders (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER REFERENCES users(id),
    status     TEXT NOT NULL,   -- 'paid', 'pending', 'refunded'
    created_at DATE NOT NULL,
    total      NUMERIC(10,2)
);

CREATE TABLE order_items (
    order_id   INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    qty        INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL,
    PRIMARY KEY (order_id, product_id)
);
```

```sql
-- Seed data
INSERT INTO categories VALUES
    (1, 'Electronics', NULL),
    (2, 'Clothing',    NULL),
    (3, 'Phones',      1),
    (4, 'Laptops',     1),
    (5, 'T-Shirts',    2);

INSERT INTO users VALUES
    (1, 'Alice Smith',  'alice@email.com',  '2025-01-15', true),
    (2, 'Bob Jones',    'bob@email.com',    '2025-03-22', true),
    (3, 'Carol White',  'carol@email.com',  '2025-06-01', false),
    (4, 'Dave Brown',   'dave@email.com',   '2025-08-10', true),
    (5, 'Eve Davis',    'eve@email.com',    '2026-01-05', true);

INSERT INTO products VALUES
    (1, 'iPhone 15',   3, 999.00,  ARRAY['apple','premium','new'],  '{"color":"black","warranty":1}'),
    (2, 'Galaxy S25',  3, 849.00,  ARRAY['samsung','android'],      '{"color":"white","warranty":1}'),
    (3, 'MacBook Air', 4, 1299.00, ARRAY['apple','premium'],        '{"ram":"16GB","warranty":1}'),
    (4, 'ThinkPad X1', 4, 1199.00, ARRAY['lenovo','business'],     '{"ram":"32GB","warranty":3}'),
    (5, 'Basic Tee',   5, 29.99,   ARRAY['cotton','casual'],        '{"sizes":["S","M","L","XL"]}');

INSERT INTO orders VALUES
    (1, 1, 'paid',     '2025-02-10', 1998.00),
    (2, 1, 'paid',     '2025-05-20', 1299.00),
    (3, 2, 'paid',     '2025-04-15',  849.00),
    (4, 2, 'refunded', '2025-07-01',   29.99),
    (5, 4, 'paid',     '2025-09-12', 1199.00),
    (6, 5, 'pending',  '2026-02-01',  999.00);

INSERT INTO order_items VALUES
    (1, 1, 2,  999.00),   -- Alice compró 2x iPhone 15
    (2, 3, 1, 1299.00),   -- Alice compró 1x MacBook Air
    (3, 2, 1,  849.00),   -- Bob compró 1x Galaxy S25
    (4, 5, 1,   29.99),   -- Bob compró 1x Basic Tee (luego devolvió)
    (5, 4, 1, 1199.00),   -- Dave compró 1x ThinkPad X1
    (6, 1, 1,  999.00);   -- Eve tiene pendiente 1x iPhone 15
```

---

### SELECT + WHERE + DISTINCT ON

```sql
-- Producto más barato de cada categoría
SELECT DISTINCT ON (category_id)
    category_id, name, price
FROM products
ORDER BY category_id, price ASC;
```

| category\_id | name | price |
|---|---|---|
| 3 | Galaxy S25 | 849.00 |
| 4 | ThinkPad X1 | 1199.00 |
| 5 | Basic Tee | 29.99 |

---

### JOIN — órdenes con detalle completo

```sql
SELECT
    u.name        AS customer,
    o.id          AS order_id,
    o.created_at,
    p.name        AS product,
    oi.qty,
    oi.unit_price,
    (oi.qty * oi.unit_price) AS subtotal,
    o.status
FROM orders o
JOIN users u        ON u.id = o.user_id
JOIN order_items oi ON oi.order_id = o.id
JOIN products p     ON p.id = oi.product_id
ORDER BY o.created_at, u.name;
```

| customer | order\_id | created\_at | product | qty | unit\_price | subtotal | status |
|---|---|---|---|---|---|---|---|
| Alice Smith | 1 | 2025-02-10 | iPhone 15 | 2 | 999.00 | 1998.00 | paid |
| Bob Jones | 3 | 2025-04-15 | Galaxy S25 | 1 | 849.00 | 849.00 | paid |
| Alice Smith | 2 | 2025-05-20 | MacBook Air | 1 | 1299.00 | 1299.00 | paid |
| Bob Jones | 4 | 2025-07-01 | Basic Tee | 1 | 29.99 | 29.99 | refunded |
| Dave Brown | 5 | 2025-09-12 | ThinkPad X1 | 1 | 1199.00 | 1199.00 | paid |
| Eve Davis | 6 | 2026-02-01 | iPhone 15 | 1 | 999.00 | 999.00 | pending |

---

### LEFT JOIN — usuarios sin órdenes

```sql
SELECT u.name, COUNT(o.id) AS total_orders
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id, u.name
ORDER BY total_orders DESC, u.name;
```

| name | total\_orders |
|---|---|
| Alice Smith | 2 |
| Bob Jones | 2 |
| Dave Brown | 1 |
| Eve Davis | 1 |
| Carol White | **0** |

---

### GROUP BY + HAVING + CASE + FILTER

```sql
SELECT
    u.name,
    COUNT(o.id)                                         AS total_orders,
    COUNT(*) FILTER (WHERE o.status = 'paid')           AS paid_orders,
    SUM(o.total) FILTER (WHERE o.status = 'paid')       AS total_paid,
    ROUND(AVG(o.total) FILTER (WHERE o.status = 'paid'), 2) AS avg_paid,
    CASE
        WHEN SUM(o.total) FILTER (WHERE o.status = 'paid') >= 2000 THEN 'platinum'
        WHEN SUM(o.total) FILTER (WHERE o.status = 'paid') >= 1000 THEN 'gold'
        ELSE 'standard'
    END AS tier
FROM users u
JOIN orders o ON o.user_id = u.id
GROUP BY u.id, u.name
HAVING COUNT(o.id) > 0
ORDER BY total_paid DESC NULLS LAST;
```

| name | total\_orders | paid\_orders | total\_paid | avg\_paid | tier |
|---|---|---|---|---|---|
| Alice Smith | 2 | 2 | 3297.00 | 1648.50 | platinum |
| Dave Brown | 1 | 1 | 1199.00 | 1199.00 | gold |
| Bob Jones | 2 | 1 | 849.00 | 849.00 | standard |
| Eve Davis | 1 | 0 | NULL | NULL | standard |

---

### CTE + Subquery — usuario top y cuánto por encima del promedio está

```sql
WITH spending AS (
    SELECT
        u.id,
        u.name,
        SUM(o.total) FILTER (WHERE o.status = 'paid') AS total_paid
    FROM users u
    JOIN orders o ON o.user_id = u.id
    GROUP BY u.id, u.name
),
stats AS (
    SELECT AVG(total_paid) AS avg_spending FROM spending WHERE total_paid IS NOT NULL
)
SELECT
    s.name,
    s.total_paid,
    st.avg_spending::numeric(10,2)                        AS avg_all_users,
    (s.total_paid - st.avg_spending)::numeric(10,2)       AS above_avg
FROM spending s, stats st
WHERE s.total_paid IS NOT NULL
ORDER BY s.total_paid DESC;
```

| name | total\_paid | avg\_all\_users | above\_avg |
|---|---|---|---|
| Alice Smith | 3297.00 | 1782.33 | 1514.67 |
| Dave Brown | 1199.00 | 1782.33 | -583.33 |
| Bob Jones | 849.00 | 1782.33 | -933.33 |

---

### Recursive CTE — árbol de categorías

```sql
WITH RECURSIVE cat_tree AS (
    SELECT id, name, parent_id, name AS full_path, 0 AS depth
    FROM categories
    WHERE parent_id IS NULL

    UNION ALL

    SELECT c.id, c.name, c.parent_id,
           ct.full_path || ' > ' || c.name,
           ct.depth + 1
    FROM categories c
    JOIN cat_tree ct ON ct.id = c.parent_id
)
SELECT full_path, depth FROM cat_tree ORDER BY full_path;
```

| full\_path | depth |
|---|---|
| Clothing | 0 |
| Clothing > T-Shirts | 1 |
| Electronics | 0 |
| Electronics > Laptops | 1 |
| Electronics > Phones | 1 |

---

### Window Functions — ranking, running total y LAG

```sql
SELECT
    o.created_at,
    u.name,
    o.total,
    o.status,
    RANK() OVER (ORDER BY o.total DESC)                                           AS rank_by_amount,
    SUM(o.total) OVER (ORDER BY o.created_at ROWS UNBOUNDED PRECEDING)            AS running_total,
    LAG(o.total) OVER (PARTITION BY o.user_id ORDER BY o.created_at)              AS prev_order,
    o.total - LAG(o.total) OVER (PARTITION BY o.user_id ORDER BY o.created_at)    AS change_vs_prev
FROM orders o
JOIN users u ON u.id = o.user_id
ORDER BY o.created_at;
```

| created\_at | name | total | status | rank | running\_total | prev\_order | change\_vs\_prev |
|---|---|---|---|---|---|---|---|
| 2025-02-10 | Alice Smith | 1998.00 | paid | 1 | 1998.00 | NULL | NULL |
| 2025-04-15 | Bob Jones | 849.00 | paid | 5 | 2847.00 | NULL | NULL |
| 2025-05-20 | Alice Smith | 1299.00 | paid | 2 | 4146.00 | 1998.00 | -699.00 |
| 2025-07-01 | Bob Jones | 29.99 | refunded | 6 | 4175.99 | 849.00 | -819.01 |
| 2025-09-12 | Dave Brown | 1199.00 | paid | 3 | 5374.99 | NULL | NULL |
| 2026-02-01 | Eve Davis | 999.00 | pending | 4 | 6373.99 | NULL | NULL |

---

### Window Function — top producto por categoría

```sql
SELECT category_name, product_name, price FROM (
    SELECT
        cat.name   AS category_name,
        p.name     AS product_name,
        p.price,
        ROW_NUMBER() OVER (PARTITION BY cat.id ORDER BY p.price DESC) AS rn
    FROM products p
    JOIN categories cat ON cat.id = p.category_id
) ranked
WHERE rn = 1;
```

| category\_name | product\_name | price |
|---|---|---|
| Phones | iPhone 15 | 999.00 |
| Laptops | MacBook Air | 1299.00 |
| T-Shirts | Basic Tee | 29.99 |

---

### Arrays — buscar por tags

```sql
-- Productos con tag 'apple' O 'samsung'
SELECT name, tags
FROM products
WHERE tags && ARRAY['apple', 'samsung']
ORDER BY name;
```

| name | tags |
|---|---|
| Galaxy S25 | {samsung,android} |
| iPhone 15 | {apple,premium,new} |
| MacBook Air | {apple,premium} |

```sql
-- Todos los tags únicos en el catálogo (unnest + distinct)
SELECT DISTINCT unnest(tags) AS tag
FROM products
ORDER BY tag;
```

| tag |
|---|
| android |
| apple |
| business |
| casual |
| cotton |
| lenovo |
| new |
| premium |
| samsung |

---

### JSONB — filtrar y extraer campos anidados

```sql
-- Productos con garantía de 1 año y que tienen campo 'color'
SELECT
    name,
    metadata->>'color'         AS color,
    (metadata->>'warranty')::int AS warranty_years
FROM products
WHERE metadata @> '{"warranty": 1}'
  AND metadata ? 'color'
ORDER BY name;
```

| name | color | warranty\_years |
|---|---|---|
| Galaxy S25 | white | 1 |
| iPhone 15 | black | 1 |
| MacBook Air | NULL | 1 |

```sql
-- Extraer elementos del array JSON (sizes de Basic Tee)
SELECT
    name,
    jsonb_array_elements_text(metadata->'sizes') AS size
FROM products
WHERE metadata ? 'sizes';
```

| name | size |
|---|---|
| Basic Tee | S |
| Basic Tee | M |
| Basic Tee | L |
| Basic Tee | XL |

---

### UPSERT — actualizar producto existente o insertar nuevo

```sql
INSERT INTO products (id, name, category_id, price, tags, metadata)
VALUES (1, 'iPhone 15 Pro', 3, 1099.00, ARRAY['apple','premium','pro'],
        '{"color":"titanium","warranty":1}')
ON CONFLICT (id) DO UPDATE
    SET name     = EXCLUDED.name,
        price    = EXCLUDED.price,
        tags     = EXCLUDED.tags,
        metadata = EXCLUDED.metadata
RETURNING id, name, price;
```

| id | name | price |
|---|---|---|
| 1 | iPhone 15 Pro | 1099.00 |

---

### EXISTS — clientes que compraron productos Apple

```sql
SELECT u.name
FROM users u
WHERE EXISTS (
    SELECT 1
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p     ON p.id = oi.product_id
    WHERE o.user_id = u.id
      AND 'apple' = ANY(p.tags)
)
ORDER BY u.name;
```

| name |
|---|
| Alice Smith |
| Eve Davis |

---

### GENERATE_SERIES — revenue mensual con meses sin ventas

```sql
SELECT
    cal.month,
    COUNT(o.id)                        AS orders,
    COALESCE(SUM(o.total), 0)          AS revenue
FROM generate_series(
    '2025-01-01'::date,
    '2025-09-01'::date,
    '1 month'::interval
) AS cal(month)
LEFT JOIN orders o
       ON date_trunc('month', o.created_at) = cal.month
      AND o.status = 'paid'
GROUP BY cal.month
ORDER BY cal.month;
```

| month | orders | revenue |
|---|---|---|
| 2025-01-01 | 0 | 0.00 |
| 2025-02-01 | 1 | 1998.00 |
| 2025-03-01 | 0 | 0.00 |
| 2025-04-01 | 1 | 849.00 |
| 2025-05-01 | 1 | 1299.00 |
| 2025-06-01 | 0 | 0.00 |
| 2025-07-01 | 0 | 0.00 |
| 2025-08-01 | 0 | 0.00 |
| 2025-09-01 | 1 | 1199.00 |

---

### Pivot — ventas por status en columnas

```sql
SELECT
    date_trunc('quarter', created_at)::date        AS quarter,
    SUM(total) FILTER (WHERE status = 'paid')      AS paid,
    SUM(total) FILTER (WHERE status = 'refunded')  AS refunded,
    SUM(total) FILTER (WHERE status = 'pending')   AS pending,
    SUM(total)                                     AS gross
FROM orders
GROUP BY date_trunc('quarter', created_at)
ORDER BY quarter;
```

| quarter | paid | refunded | pending | gross |
|---|---|---|---|---|
| 2025-01-01 | 1998.00 | NULL | NULL | 1998.00 |
| 2025-04-01 | 2148.00 | 29.99 | NULL | 2177.99 |
| 2025-07-01 | 1199.00 | NULL | NULL | 1199.00 |
| 2026-01-01 | NULL | NULL | 999.00 | 999.00 |

---

### Query compleja — todo junto (CTE + Window + JOIN + CASE)

Pregunta: *"Para cada usuario activo, mostrar su última orden, cuánto gastó en total, su ranking global de gasto, y clasificarlo por tier."*

```sql
WITH user_totals AS (
    SELECT
        u.id,
        u.name,
        SUM(o.total) FILTER (WHERE o.status = 'paid')  AS lifetime_value,
        MAX(o.created_at)                               AS last_order_date
    FROM users u
    LEFT JOIN orders o ON o.user_id = u.id
    WHERE u.active = true
    GROUP BY u.id, u.name
),
ranked AS (
    SELECT *,
        RANK() OVER (ORDER BY lifetime_value DESC NULLS LAST) AS spend_rank
    FROM user_totals
)
SELECT
    name,
    COALESCE(lifetime_value, 0)     AS lifetime_value,
    last_order_date,
    spend_rank,
    CASE
        WHEN lifetime_value >= 3000 THEN '🥇 Platinum'
        WHEN lifetime_value >= 1000 THEN '🥈 Gold'
        WHEN lifetime_value > 0     THEN '🥉 Standard'
        ELSE 'No orders'
    END AS tier
FROM ranked
ORDER BY spend_rank;
```

| name | lifetime\_value | last\_order\_date | spend\_rank | tier |
|---|---|---|---|---|
| Alice Smith | 3297.00 | 2025-05-20 | 1 | 🥇 Platinum |
| Dave Brown | 1199.00 | 2025-09-12 | 2 | 🥈 Gold |
| Bob Jones | 849.00 | 2025-07-01 | 3 | 🥉 Standard |
| Eve Davis | 0.00 | 2026-02-01 | 4 | No orders |
