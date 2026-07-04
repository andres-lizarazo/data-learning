// Named seed datasets for the in-browser Postgres. Each seed fully rebuilds the
// database (DROP SCHEMA ... CASCADE prelude) so switching seeds — or resetting —
// always yields a clean, deterministic state.
//
// - "ecommerce": the original OLTP-style shop schema (categories, users, products,
//   orders, order_items) — the default for the PostgreSQL module. Data taken verbatim
//   from the sql-learning notes (concepts.md §26) so lesson outputs match the docs.
// - "warehouse": a Kimball-style star schema (dim_date, dim_customer with SCD2 rows,
//   dim_product, fact_sales) plus a `staging` schema (raw_orders, customer_updates)
//   used by the Data Engineering track for modeling / ETL / incremental-load labs.

import type { SqlSeedId } from "../types/lesson";
export type SeedId = SqlSeedId;

// Both seeds start from a blank slate; dropping the schemas (rather than individual
// tables) means a seed switch can't leak tables from the previous seed.
const RESET_PRELUDE = /* sql */ `
DROP SCHEMA IF EXISTS staging CASCADE;
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
`;

const ECOMMERCE_SQL = /* sql */ `
${RESET_PRELUDE}

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
    (4, 'ThinkPad X1', 4, 1199.00, ARRAY['lenovo','business'],      '{"ram":"32GB","warranty":3}'),
    (5, 'Basic Tee',   5, 29.99,   ARRAY['cotton','casual'],        '{"sizes":["S","M","L","XL"]}');

INSERT INTO orders VALUES
    (1, 1, 'paid',     '2025-02-10', 1998.00),
    (2, 1, 'paid',     '2025-05-20', 1299.00),
    (3, 2, 'paid',     '2025-04-15',  849.00),
    (4, 2, 'refunded', '2025-07-01',   29.99),
    (5, 4, 'paid',     '2025-09-12', 1199.00),
    (6, 5, 'pending',  '2026-02-01',  999.00);

INSERT INTO order_items VALUES
    (1, 1, 2,  999.00),   -- Alice: 2x iPhone 15
    (2, 3, 1, 1299.00),   -- Alice: 1x MacBook Air
    (3, 2, 1,  849.00),   -- Bob: 1x Galaxy S25
    (4, 5, 1,   29.99),   -- Bob: 1x Basic Tee (later refunded)
    (5, 4, 1, 1199.00),   -- Dave: 1x ThinkPad X1
    (6, 1, 1,  999.00);   -- Eve: pending 1x iPhone 15

-- Advance the SERIAL sequences past the hand-assigned ids so INSERT lessons that
-- omit the id (relying on the sequence) get fresh values instead of colliding.
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
SELECT setval('users_id_seq',      (SELECT MAX(id) FROM users));
SELECT setval('products_id_seq',   (SELECT MAX(id) FROM products));
SELECT setval('orders_id_seq',     (SELECT MAX(id) FROM orders));
`;

const WAREHOUSE_SQL = /* sql */ `
${RESET_PRELUDE}
CREATE SCHEMA staging;

-- Date dimension: one row per calendar day, keyed as yyyymmdd.
CREATE TABLE dim_date (
    date_key   INTEGER PRIMARY KEY,          -- 20250110
    full_date  DATE NOT NULL UNIQUE,
    year       INTEGER NOT NULL,
    quarter    INTEGER NOT NULL,
    month      INTEGER NOT NULL,
    month_name TEXT NOT NULL,
    day        INTEGER NOT NULL,
    iso_dow    INTEGER NOT NULL,             -- 1 = Monday … 7 = Sunday
    is_weekend BOOLEAN NOT NULL
);

INSERT INTO dim_date
SELECT to_char(d, 'YYYYMMDD')::int,
       d::date,
       EXTRACT(year FROM d)::int,
       EXTRACT(quarter FROM d)::int,
       EXTRACT(month FROM d)::int,
       trim(to_char(d, 'Month')),
       EXTRACT(day FROM d)::int,
       EXTRACT(isodow FROM d)::int,
       EXTRACT(isodow FROM d) IN (6, 7)
FROM generate_series('2025-01-01'::date, '2026-06-30'::date, interval '1 day') AS d;

-- Customer dimension with SCD Type 2 history: customer_key is the surrogate key,
-- customer_id the natural/business key. Current rows use valid_to = '9999-12-31'.
-- Acme Corp (customer_id 1) has TWO versions: it moved city on 2025-10-01.
CREATE TABLE dim_customer (
    customer_key SERIAL PRIMARY KEY,
    customer_id  INTEGER NOT NULL,
    name         TEXT NOT NULL,
    segment      TEXT NOT NULL,              -- 'enterprise' | 'scaleup' | 'startup' | 'smb'
    city         TEXT NOT NULL,
    valid_from   DATE NOT NULL,
    valid_to     DATE NOT NULL DEFAULT '9999-12-31',
    is_current   BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO dim_customer (customer_key, customer_id, name, segment, city, valid_from, valid_to, is_current) VALUES
    (1, 1, 'Acme Corp', 'enterprise', 'Bogotá',   '2025-01-01', '2025-09-30', false),
    (2, 1, 'Acme Corp', 'enterprise', 'Medellín', '2025-10-01', '9999-12-31', true),
    (3, 2, 'Globex',    'startup',    'Lima',     '2025-01-01', '9999-12-31', true),
    (4, 3, 'Initech',   'smb',        'Quito',    '2025-02-15', '9999-12-31', true),
    (5, 4, 'Umbrella',  'enterprise', 'Santiago', '2025-03-01', '9999-12-31', true);
SELECT setval('dim_customer_customer_key_seq', (SELECT MAX(customer_key) FROM dim_customer));

CREATE TABLE dim_product (
    product_key SERIAL PRIMARY KEY,
    product_id  INTEGER NOT NULL,
    name        TEXT NOT NULL,
    category    TEXT NOT NULL,
    unit_price  NUMERIC(10,2) NOT NULL
);

INSERT INTO dim_product (product_key, product_id, name, category, unit_price) VALUES
    (1, 1, 'Laptop Pro',    'Electronics', 1200.00),
    (2, 2, 'Monitor 27in',  'Electronics',  300.00),
    (3, 3, 'Desk Chair',    'Furniture',    180.00),
    (4, 4, 'Standing Desk', 'Furniture',    450.00),
    (5, 5, 'USB-C Dock',    'Accessories',   80.00);
SELECT setval('dim_product_product_key_seq', (SELECT MAX(product_key) FROM dim_product));

-- Fact table. Grain: one row per order line. order_id is a degenerate dimension.
-- Note how Acme's sales point at customer_key 1 before the 2025-10-01 move and
-- customer_key 2 after — that's SCD2 in action.
CREATE TABLE fact_sales (
    sale_id      SERIAL PRIMARY KEY,
    date_key     INTEGER NOT NULL REFERENCES dim_date(date_key),
    customer_key INTEGER NOT NULL REFERENCES dim_customer(customer_key),
    product_key  INTEGER NOT NULL REFERENCES dim_product(product_key),
    order_id     INTEGER NOT NULL,
    qty          INTEGER NOT NULL,
    unit_price   NUMERIC(10,2) NOT NULL,
    amount       NUMERIC(10,2) NOT NULL
);

INSERT INTO fact_sales (date_key, customer_key, product_key, order_id, qty, unit_price, amount) VALUES
    (20250110, 1, 1, 101, 2, 1200.00, 2400.00),
    (20250110, 1, 5, 101, 3,   80.00,  240.00),
    (20250205, 3, 2, 102, 1,  300.00,  300.00),
    (20250311, 4, 3, 103, 4,  180.00,  720.00),
    (20250402, 3, 1, 104, 1, 1200.00, 1200.00),
    (20250518, 5, 4, 105, 2,  450.00,  900.00),
    (20250630, 1, 2, 106, 2,  300.00,  600.00),
    (20250704, 4, 5, 107, 5,   80.00,  400.00),
    (20250812, 5, 1, 108, 1, 1200.00, 1200.00),
    (20250903, 1, 3, 109, 1,  180.00,  180.00),
    (20251015, 2, 4, 110, 1,  450.00,  450.00),
    (20251122, 3, 5, 111, 2,   80.00,  160.00),
    (20251201, 2, 1, 112, 1, 1200.00, 1200.00),
    (20260114, 4, 2, 113, 3,  300.00,  900.00),
    (20260220, 2, 5, 114, 4,   80.00,  320.00),
    (20260305, 3, 3, 115, 2,  180.00,  360.00),
    (20260412, 5, 2, 116, 1,  300.00,  300.00);

-- Landing zone for ETL labs. Orders 115/116 are already in fact_sales; 117–119 are
-- new — perfect for incremental-load / high-water-mark exercises. Order 116 was
-- re-delivered with qty 2 (fact_sales loaded qty 1): a deliberate discrepancy the
-- data-quality reconciliation lesson hunts down (and MERGE demos update).
CREATE TABLE staging.raw_orders (
    order_id    INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,             -- natural key (join to dim_customer)
    product_id  INTEGER NOT NULL,             -- natural key (join to dim_product)
    qty         INTEGER NOT NULL,
    unit_price  NUMERIC(10,2) NOT NULL,
    order_date  DATE NOT NULL,
    loaded_at   TIMESTAMP NOT NULL
);

INSERT INTO staging.raw_orders VALUES
    (115, 2, 3, 2,  180.00, '2026-03-05', '2026-03-05 06:00'),
    (116, 4, 2, 2,  300.00, '2026-04-12', '2026-04-12 06:00'),
    (117, 1, 5, 2,   80.00, '2026-05-02', '2026-05-02 06:00'),
    (118, 3, 1, 1, 1200.00, '2026-05-15', '2026-05-15 06:00'),
    (119, 2, 4, 1,  450.00, '2026-06-01', '2026-06-01 06:00');

-- Incoming customer changes for SCD2 labs: Globex changed segment; Nakatomi is new.
CREATE TABLE staging.customer_updates (
    customer_id INTEGER NOT NULL,
    name        TEXT NOT NULL,
    segment     TEXT NOT NULL,
    city        TEXT NOT NULL,
    changed_on  DATE NOT NULL
);

INSERT INTO staging.customer_updates VALUES
    (2, 'Globex',   'scaleup',    'Lima',  '2026-05-01'),
    (5, 'Nakatomi', 'enterprise', 'Tokyo', '2026-05-01');
`;

export const SEEDS: Record<SeedId, string> = {
  ecommerce: ECOMMERCE_SQL,
  warehouse: WAREHOUSE_SQL,
};

/** Back-compat alias: the default (e-commerce) seed. */
export const SEED_SQL = SEEDS.ecommerce;

/** Static description of a seeded schema, rendered by the SchemaExplorer panel. */
export interface SchemaColumn {
  name: string;
  type: string;
  note?: string;
}
export interface SchemaTable {
  name: string;
  columns: SchemaColumn[];
}

const ECOMMERCE_SCHEMA: SchemaTable[] = [
  {
    name: "categories",
    columns: [
      { name: "id", type: "serial", note: "PK" },
      { name: "name", type: "text" },
      { name: "parent_id", type: "int", note: "→ categories.id (hierarchy)" },
    ],
  },
  {
    name: "users",
    columns: [
      { name: "id", type: "serial", note: "PK" },
      { name: "name", type: "text" },
      { name: "email", type: "text", note: "unique" },
      { name: "created_at", type: "date" },
      { name: "active", type: "bool" },
    ],
  },
  {
    name: "products",
    columns: [
      { name: "id", type: "serial", note: "PK" },
      { name: "name", type: "text" },
      { name: "category_id", type: "int", note: "→ categories.id" },
      { name: "price", type: "numeric(10,2)" },
      { name: "tags", type: "text[]", note: "array" },
      { name: "metadata", type: "jsonb" },
    ],
  },
  {
    name: "orders",
    columns: [
      { name: "id", type: "serial", note: "PK" },
      { name: "user_id", type: "int", note: "→ users.id" },
      { name: "status", type: "text", note: "paid | pending | refunded" },
      { name: "created_at", type: "date" },
      { name: "total", type: "numeric(10,2)" },
    ],
  },
  {
    name: "order_items",
    columns: [
      { name: "order_id", type: "int", note: "PK, → orders.id" },
      { name: "product_id", type: "int", note: "PK, → products.id" },
      { name: "qty", type: "int" },
      { name: "unit_price", type: "numeric(10,2)" },
    ],
  },
];

const WAREHOUSE_SCHEMA: SchemaTable[] = [
  {
    name: "dim_date",
    columns: [
      { name: "date_key", type: "int", note: "PK, yyyymmdd" },
      { name: "full_date", type: "date", note: "unique" },
      { name: "year", type: "int" },
      { name: "quarter", type: "int" },
      { name: "month", type: "int" },
      { name: "month_name", type: "text" },
      { name: "day", type: "int" },
      { name: "iso_dow", type: "int", note: "1=Mon … 7=Sun" },
      { name: "is_weekend", type: "bool" },
    ],
  },
  {
    name: "dim_customer",
    columns: [
      { name: "customer_key", type: "serial", note: "PK (surrogate)" },
      { name: "customer_id", type: "int", note: "natural key" },
      { name: "name", type: "text" },
      { name: "segment", type: "text" },
      { name: "city", type: "text" },
      { name: "valid_from", type: "date", note: "SCD2" },
      { name: "valid_to", type: "date", note: "9999-12-31 = current" },
      { name: "is_current", type: "bool" },
    ],
  },
  {
    name: "dim_product",
    columns: [
      { name: "product_key", type: "serial", note: "PK (surrogate)" },
      { name: "product_id", type: "int", note: "natural key" },
      { name: "name", type: "text" },
      { name: "category", type: "text" },
      { name: "unit_price", type: "numeric(10,2)" },
    ],
  },
  {
    name: "fact_sales",
    columns: [
      { name: "sale_id", type: "serial", note: "PK" },
      { name: "date_key", type: "int", note: "→ dim_date" },
      { name: "customer_key", type: "int", note: "→ dim_customer" },
      { name: "product_key", type: "int", note: "→ dim_product" },
      { name: "order_id", type: "int", note: "degenerate dim" },
      { name: "qty", type: "int" },
      { name: "unit_price", type: "numeric(10,2)" },
      { name: "amount", type: "numeric(10,2)" },
    ],
  },
  {
    name: "staging.raw_orders",
    columns: [
      { name: "order_id", type: "int" },
      { name: "customer_id", type: "int", note: "natural key" },
      { name: "product_id", type: "int", note: "natural key" },
      { name: "qty", type: "int" },
      { name: "unit_price", type: "numeric(10,2)" },
      { name: "order_date", type: "date" },
      { name: "loaded_at", type: "timestamp", note: "high-water mark" },
    ],
  },
  {
    name: "staging.customer_updates",
    columns: [
      { name: "customer_id", type: "int", note: "natural key" },
      { name: "name", type: "text" },
      { name: "segment", type: "text" },
      { name: "city", type: "text" },
      { name: "changed_on", type: "date" },
    ],
  },
];

export const SCHEMAS: Record<SeedId, SchemaTable[]> = {
  ecommerce: ECOMMERCE_SCHEMA,
  warehouse: WAREHOUSE_SCHEMA,
};

export const SEED_LABELS: Record<SeedId, { label: string; blurb: string }> = {
  ecommerce: { label: "e-commerce", blurb: "OLTP shop schema" },
  warehouse: { label: "warehouse", blurb: "star schema + staging" },
};

/** Back-compat alias: the default (e-commerce) schema description. */
export const SCHEMA = SCHEMAS.ecommerce;
