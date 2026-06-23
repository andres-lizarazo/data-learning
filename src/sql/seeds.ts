// The canonical dataset every SQL lesson runs against: a small e-commerce schema
// (categories, users, products, orders, order_items) with seed data taken verbatim
// from the sql-learning notes (concepts.md §26). Authoring lesson examples against
// this fixture means their output matches the documented result tables exactly.

export const SEED_SQL = /* sql */ `
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

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

/** Static description of the seeded schema, rendered by the SchemaExplorer panel. */
export interface SchemaColumn {
  name: string;
  type: string;
  note?: string;
}
export interface SchemaTable {
  name: string;
  columns: SchemaColumn[];
}

export const SCHEMA: SchemaTable[] = [
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
