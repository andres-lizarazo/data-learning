# sql-learning — Implementation Plan

## Overview
A self-study reference for PostgreSQL, built for live coding tests. The goal is a single scannable document covering every concept that typically appears in a SQL interview or coding challenge, with runnable examples and gotchas.

## Architecture
Single markdown file (`concepts.md`) organized by topic, with a quick-reference cheat sheet at the top. No database required to study; examples are self-contained.

## Implementation Checklist

### Phase 1 — Initial content
- [x] Topic list (SELECT, JOIN, GROUP BY, CASE, CTE, Window Functions, Indexes, EXPLAIN ANALYZE, JSONB, Transactions)
- [x] DDL examples (CREATE TABLE, constraints, indexes)
- [x] Array operations
- [x] String function reference
- [x] Date/time function reference
- [x] Math/NULL function reference

### Phase 2 — Full rewrite as concepts.md
- [x] Convert to Markdown for readability and syntax highlighting
- [x] Quick-reference cheat sheet (section 0)
- [x] SELECT + WHERE (operators, DISTINCT, DISTINCT ON, ORDER BY, LIMIT/OFFSET)
- [x] JOINs (INNER, LEFT, RIGHT, FULL OUTER, CROSS, self-join, multi-table, gotcha)
- [x] GROUP BY + HAVING (aggregates, FILTER clause, GROUPING SETS, date_trunc)
- [x] CASE (searched, simple, in aggregates, in ORDER BY, pivot)
- [x] Subqueries & EXISTS (scalar, IN, correlated, EXISTS, NOT EXISTS, derived table)
- [x] CTEs (basic, multiple, recursive)
- [x] Window Functions (ranking, offset, aggregate frames, top-N pattern)
- [x] Set Operations (UNION, UNION ALL, INTERSECT, EXCEPT)
- [x] INSERT / UPDATE / DELETE / UPSERT (RETURNING, ON CONFLICT, UPDATE FROM)
- [x] Transactions (BEGIN/COMMIT/ROLLBACK, SAVEPOINT, isolation levels, locking)
- [x] DDL & Constraints (CREATE/ALTER/DROP, FK actions, IDENTITY, composite PK)
- [x] Indexes (B-tree, GIN, GiST, BRIN, partial, expression, CONCURRENTLY)
- [x] EXPLAIN ANALYZE (terminology table, common slow-query causes)
- [x] Arrays (operators, unnest, array_agg, GIN index)
- [x] JSONB (operators, containment, jsonb_set, jsonb_each, GIN index)
- [x] Views & Materialized Views (refresh, CONCURRENTLY, when to use each)
- [x] Functions PL/pgSQL (scalar, table-valued, SQL functions)
- [x] Stored Procedures (CALL, commit inside procedure, vs function)
- [x] Triggers (BEFORE/AFTER, NEW/OLD, TG_OP, audit pattern, conditional WHEN)
- [x] PL/pgSQL control flow (IF, LOOP, WHILE, FOR, CONTINUE, RAISE, exceptions)
- [x] String functions (full reference with examples)
- [x] Date/time functions (full reference with examples)
- [x] Math & NULL functions (coalesce, nullif, safe division)
- [x] Full-Text Search (tsvector, tsquery, ts_rank, GIN index, generated column)

## Known Issues / Bugs
None.

## Decisions Log
- **Markdown over SQL file:** SQL files have no formatting or prose — impossible to skim during a test. Markdown renders in VS Code, GitHub, and any viewer.
- **Gotcha callouts:** Each major section ends with a `> Gotcha:` block for the most common pitfall — these come up in live tests.
- **Quick-reference at top:** One-liner reminders so you can confirm syntax in under 5 seconds without scrolling.
