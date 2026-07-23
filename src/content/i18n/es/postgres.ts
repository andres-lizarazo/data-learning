import type { LessonI18n } from "../overlay";

// Spanish overlay for the "PostgreSQL" module (SQL track). Index-matched; text-only — the SQL
// itself (and its inline comments) stays as authored. Translated in batches; any lesson not yet
// present here falls back to its English content automatically.
export const postgresEs: Record<string, LessonI18n> = {
  "select-where": {
    title: "SELECT y WHERE",
    summary: "Lee filas, fíltralas, ordena y pagina — más DISTINCT y DISTINCT ON.",
    blocks: [
      {
        markdown: `## El bloque básico

Postgres evalúa una consulta en este orden — vale la pena memorizarlo:

\`\`\`
FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT
\`\`\`

\`WHERE\` conserva solo las filas que quieres. Combina condiciones con \`AND\` / \`OR\` / \`NOT\`,
compara listas con \`IN\`, rangos con \`BETWEEN\`, y texto con \`LIKE\` (\`%\` = cualquier char,
\`_\` = uno). \`ILIKE\` no distingue mayúsculas.

> **Cuidado:** \`col = NULL\` nunca coincide — NULL es "desconocido". Usa siempre \`IS NULL\` / \`IS NOT NULL\`.

> **vs MySQL:** \`ILIKE\` no existe en MySQL (\`LIKE\` ya es insensible a mayúsculas allí). \`DISTINCT ON\` es solo de Postgres. En orden ASC, MySQL pone los NULLs primero; Postgres los pone al final.`,
      },
      { title: "Filtrar, ordenar y limitar" },
      {
        markdown: `## DISTINCT y DISTINCT ON

\`DISTINCT\` devuelve filas únicas. \`DISTINCT ON (col)\` — un especial de Postgres — devuelve la
**primera fila por grupo**; el \`ORDER BY\` debe *empezar* con la(s) misma(s) columna(s).`,
      },
      { title: "Producto más barato por categoría (DISTINCT ON)" },
      {
        title: "Productos premium",
        prompt:
          "Devuelve el `name` y `price` de cada producto que cueste **más de 1000**, del más barato primero.",
        hints: ["Filtra con `WHERE price > 1000`.", "Ordena ascendente con `ORDER BY price`."],
      },
    ],
  },
  joins: {
    title: "JOINs",
    summary: "Combina tablas: INNER, LEFT, FULL OUTER, self-joins y LATERAL.",
    blocks: [
      {
        markdown: `## Unir tablas

Un join cose filas de dos tablas según una condición.

- **INNER JOIN** — solo filas con coincidencia en ambas.
- **LEFT JOIN** — todas las filas izquierdas; NULLs a la derecha cuando no hay coincidencia.
- **FULL OUTER JOIN** — todas las filas de ambos lados.
- **Self-join** — una tabla unida consigo misma (p. ej. categoría → padre).

> **Cuidado:** Poner un \`WHERE right.col = x\` en un LEFT JOIN lo convierte en silencio en un INNER JOIN
> (los NULLs fallan la prueba). Mantén ese filtro en la cláusula \`ON\`.

> **vs MySQL:** \`FULL OUTER JOIN\` no existe en MySQL (emúlalo con \`LEFT JOIN UNION RIGHT JOIN\`).`,
      },
      {
        markdown: `## 🧭 Qué join — y JOIN vs. EXISTS

- **INNER JOIN** — conserva solo las filas que **coinciden en ambas** tablas.
- **LEFT JOIN** — conserva **todas las filas izquierdas**, NULLs donde la derecha no tiene coincidencia ("cada usuario, más sus órdenes si las hay"). Añade \`WHERE right.id IS NULL\` para encontrar las **no coincidencias** (anti-join).
- **FULL OUTER JOIN** — filas sin coincidencia de **ambos** lados (raro; reconciliación/diffing).
- **CROSS JOIN / LATERAL** — cada combinación, o "para cada fila izquierda, corre esta subconsulta" (top-N por fila).

**JOIN vs. EXISTS para "tiene una fila relacionada":**
- **\`EXISTS\`** cuando solo necesitas *comprobar* una coincidencia y quieres cada fila izquierda **una vez** — un JOIN puede multiplicar filas si la coincidencia es uno-a-muchos.
- **JOIN** cuando de verdad necesitas las **columnas** de la tabla relacionada en la salida.

**Regla general:** necesitas sus columnas → JOIN; solo compruebas existencia → \`EXISTS\`; necesitas filas *sin* coincidencia → LEFT JOIN + \`IS NULL\` (o \`NOT EXISTS\`).`,
      },
      { title: "Órdenes con detalle completo (join multi-tabla)" },
      { title: "Cada usuario, incluso los sin órdenes (LEFT JOIN)" },
      { title: "Self-join: cada categoría con el nombre de su padre" },
      {
        markdown: `## LATERAL — "para cada fila, corre esta subconsulta"

\`LATERAL\` permite que una subconsulta en \`FROM\` referencie columnas a su izquierda. Perfecto para
"las N más recientes por fila". El \`ON true\` es obligatorio porque la correlación vive en el
\`WHERE\` de la subconsulta.`,
      },
      { title: "Orden más reciente por usuario (LATERAL)" },
      {
        title: "Órdenes pagadas por valor",
        prompt:
          "Para cada orden con status `'paid'`, muestra el `name` del cliente y el `total` de la orden, **del total más alto primero**.",
        hints: [
          "`JOIN users u ON u.id = o.user_id`.",
          "Filtra `WHERE o.status = 'paid'`, luego `ORDER BY o.total DESC`.",
        ],
      },
    ],
  },
  "group-by": {
    title: "GROUP BY, HAVING y Agregados",
    summary: "Colapsa filas en resúmenes — COUNT/SUM/AVG, HAVING, FILTER y percentiles.",
    blocks: [
      {
        markdown: `## Agregar

Las funciones de agregación (\`COUNT\`, \`SUM\`, \`AVG\`, \`MIN\`, \`MAX\`) colapsan muchas filas en una por grupo.
\`WHERE\` filtra filas **antes** de agrupar; \`HAVING\` filtra grupos **después**.

Toda columna no agregada en \`SELECT\` debe aparecer en \`GROUP BY\`.

La cláusula \`FILTER (WHERE …)\` hace agregación condicional de forma limpia — cuenta/suma solo filas que coinciden.

> **vs MySQL:** \`FILTER\`, \`PERCENTILE_CONT\` y \`GROUPING SETS\` no existen en MySQL; \`string_agg\` es \`GROUP_CONCAT\`.`,
      },
      {
        markdown: `## 🧭 WHERE vs. HAVING, y GROUP BY vs. window

- **WHERE** filtra **filas individuales antes** de agrupar; **HAVING** filtra **grupos después** de agregar. Si una condición no involucra un agregado, ponla en WHERE — es más barato (menos filas que agrupar). Usa HAVING solo para condiciones sobre \`COUNT/SUM/AVG/...\`.
- **GROUP BY** cuando quieres **una fila por grupo** (las filas de detalle colapsan).
- **Window function** (\`… OVER (PARTITION BY …)\`) cuando quieres el agregado **junto a cada fila original** — totales corrientes, "cada fila vs. la media de su grupo", ranking. Las filas se **conservan**, no colapsan.

**Regla general:** filtrar filas crudas → WHERE; filtrar agregados → HAVING. Necesitas un resumen por grupo → GROUP BY; necesitas el resumen **y** las filas de detalle → window function.`,
      },
      { title: "Resumen de órdenes por usuario con FILTER y niveles CASE" },
      { title: "Mediana y cuartiles (agregados de conjunto ordenado)" },
      {
        title: "Órdenes por status",
        prompt:
          "Cuenta cuántas órdenes hay por cada `status`. Devuelve dos columnas: `status` y el conteo.",
        hints: ["`GROUP BY status`.", "`COUNT(*)` cuenta las filas de cada grupo."],
      },
    ],
  },
  case: {
    title: "Expresiones CASE",
    summary: "El if/else de SQL — en SELECT, ORDER BY, y dentro de agregados para pivots manuales.",
    blocks: [
      {
        markdown: `## CASE — lógica condicional

\`CASE\` es el if/else de SQL. La forma **searched** prueba condiciones booleanas; la forma **simple**
prueba igualdad contra una expresión. Funciona en \`SELECT\`, \`WHERE\`, \`ORDER BY\`, \`GROUP BY\`, y dentro
de agregados (genial para sumas condicionales y pivots manuales).`,
      },
      { title: "Clasificar productos en niveles de precio" },
      { title: "Pivot manual — ingresos por status, en columnas" },
      {
        title: "Etiquetar productos por precio",
        prompt:
          "Devuelve el `name` de cada producto y una columna `tier` que sea `'expensive'` cuando `price >= 1000`, si no `'cheap'`. Ordena por `name`.",
        hints: ["`CASE WHEN price >= 1000 THEN 'expensive' ELSE 'cheap' END`."],
      },
    ],
  },
  subqueries: {
    title: "Subconsultas y EXISTS",
    summary: "Consultas dentro de consultas — escalar, IN, correlacionada, EXISTS, y la trampa NOT IN / NULL.",
    blocks: [
      {
        markdown: `## Subconsultas

Una subconsulta es un \`SELECT\` anidado en otra consulta:

- **Escalar** — devuelve un valor, usable donde vaya un valor.
- **IN (…)** — compara contra un conjunto.
- **Correlacionada** — referencia la fila externa; corre por fila.
- **EXISTS** — verdadero si la subconsulta devuelve *alguna* fila (para en la primera; eficiente).

> **Cuidado:** \`NOT IN (subconsulta)\` se rompe si la subconsulta devuelve un NULL — toda la condición
> se vuelve UNKNOWN y obtienes **cero filas**. Prefiere \`NOT EXISTS\` o un \`LEFT JOIN … WHERE IS NULL\`.`,
      },
      {
        markdown: `## 🧭 Cuándo usar subconsulta vs. CTE vs. JOIN

- **Subconsulta escalar / \`IN\`** — un filtro rápido y puntual que devuelve un solo valor o una sola columna para \`WHERE x IN (…)\`. Inline, 1–2 líneas, usada en un solo lugar; no hace falta nombrarla.
- **CTE (\`WITH\`)** — lógica de varios pasos que quieres leer de arriba abajo, un resultado derivado que referencias **más de una vez** en la misma consulta, o recursión. Nombrar cada paso gana en legibilidad frente a subconsultas muy anidadas.
- **JOIN** — cuando de verdad necesitas **columnas de la otra tabla** en tu salida, no solo un filtro sí/no.

**Filas coincidentes — \`IN\` vs \`EXISTS\` vs \`JOIN\`:**
- \`IN (lista)\` — un conjunto pequeño y simple de valores; muy legible.
- \`EXISTS\` — "¿existe al menos una fila relacionada?" Para en la primera coincidencia y es **NULL-safe** — prefiérelo para chequeos correlacionados, especialmente \`NOT EXISTS\`.
- \`JOIN\` — cuando necesitas las **columnas** de la tabla coincidente (pero cuidado con la duplicación de filas si la coincidencia es uno-a-muchos).

**Regla general:** solo filtrar → subconsulta / \`EXISTS\`; necesitas sus columnas → JOIN; complejo, reutilizado o recursivo → CTE. Nunca uses \`NOT IN\` contra una subconsulta que pueda devolver NULL — da cero filas en silencio; usa \`NOT EXISTS\`.`,
      },
      { title: "Productos por encima de la media de su categoría (correlacionada)" },
      { title: "Usuarios sin órdenes (NOT EXISTS)" },
      {
        title: "Clientes que pagaron",
        prompt:
          "Usando `EXISTS`, lista el `name` de cada usuario que tenga al menos una orden con status `'paid'`.",
        hints: ["Dentro de EXISTS, correlaciona con `o.user_id = u.id` y añade `AND o.status = 'paid'`."],
      },
    ],
  },
  ctes: {
    title: "CTEs (WITH) y Recursión",
    summary: "Nombra resultados intermedios para legibilidad — incluyendo recorridos recursivos de jerarquías.",
    blocks: [
      {
        markdown: `## Common Table Expressions

Un CTE (\`WITH name AS (…)\`) nombra una subconsulta para que la lógica compleja se lea de arriba
abajo. Encadena varios y referencia los anteriores. Un CTE **recursivo** recorre jerarquías
(organigramas, árboles de categorías): un caso base \`UNION ALL\` un paso recursivo que se une de
vuelta al CTE.

> **vs MySQL:** los CTEs (incl. recursivos) llegaron en MySQL 8.0. En Postgres un CTE es una barrera de
> optimización por defecto — usa \`WITH … AS NOT MATERIALIZED (…)\` (PG12+) si necesitas que el planner lo integre.`,
      },
      {
        markdown: `## 🧭 Cuándo recurrir a un CTE

- **CTE sobre subconsulta anidada** cuando la consulta tiene **pasos distintos** (agregar → filtrar → unir) — nombrarlos hace la intención obvia y revisable.
- **CTE en vez de copiar-pegar una subconsulta** cuando necesitas el **mismo conjunto derivado dos veces** — defínelo una vez, referéncialo muchas.
- **CTE recursivo** para **jerarquías / grafos de profundidad desconocida** (organigramas, árboles de categorías, lista de materiales) — cualquier cosa que si no resolverías con un bucle.
- **Tabla temporal** en vez de un CTE cuando el conjunto intermedio es **grande y se reutiliza entre muchas consultas separadas** (no solo dentro de una sentencia), o quieres indexarlo.

**Rendimiento:** en Postgres moderno un CTE suele estar **inlined** (optimizado como una subconsulta). Fuérzalo con \`AS NOT MATERIALIZED\`, o fíjalo con \`AS MATERIALIZED\` cuando *quieras* que un paso costoso se compute **una vez** y se reutilice.

**Regla general:** usa un CTE para cualquier cosa que pase de un one-liner trivial — la legibilidad gana y el planner suele tratarlo como una subconsulta de todas formas.`,
      },
      { title: "Top gastador vs. la media (CTEs encadenados)" },
      { title: "Árbol de categorías (CTE recursivo)" },
      {
        title: "Grandes gastadores",
        prompt:
          "Usando un CTE que sume los totales de las órdenes **pagadas** de cada usuario, devuelve el `name` de los usuarios cuyo total pagado sea **mayor que 1000**.",
        hints: [
          "En el CTE: `SUM(o.total) FILTER (WHERE o.status='paid') AS total_paid`, agrupado por usuario.",
          "Luego filtra `WHERE total_paid > 1000`.",
        ],
      },
    ],
  },
  "window-functions": {
    title: "Window Functions",
    summary: "Calcula sobre filas relacionadas sin colapsarlas — ranking, LAG/LEAD, totales corrientes.",
    blocks: [
      {
        markdown: `## Windows: agregar sin colapsar

Una window function calcula sobre un conjunto de filas *relacionadas con la fila actual*, pero
conserva cada fila:

\`\`\`
function() OVER (PARTITION BY … ORDER BY … ROWS BETWEEN …)
\`\`\`

- **Ranking:** \`ROW_NUMBER\` (único), \`RANK\` (huecos en empates), \`DENSE_RANK\` (sin huecos), \`NTILE(n)\`.
- **Offset:** \`LAG\`/\`LEAD\` (fila anterior/siguiente), \`FIRST_VALUE\`/\`LAST_VALUE\`.
- **Agregados corrientes:** \`SUM(...) OVER (ORDER BY … ROWS UNBOUNDED PRECEDING)\`.

> **Cuidado:** No puedes usar una window function en \`WHERE\`/\`HAVING\` — envuélvela en una subconsulta/CTE y filtra fuera.`,
      },
      {
        markdown: `## 🧭 ROW_NUMBER vs. RANK vs. DENSE_RANK

- **\`ROW_NUMBER()\`** — 1, 2, 3… estricto y **sin empates**; cada fila única. Úsalo para "exactamente una fila por grupo" (top-1, dedupe-mantén-el-último, cursores de paginación).
- **\`RANK()\`** — los empates comparten rango, luego **salta** (1, 1, 3). Úsalo para tablas de posiciones donde "dos en 1º ⇒ el siguiente es 3º".
- **\`DENSE_RANK()\`** — los empates comparten rango, **sin huecos** (1, 1, 2). Úsalo para el "**N-ésimo distinto**" (2º salario más alto).
- **\`NTILE(n)\`** — divide las filas en n buckets iguales (cuartiles, deciles).

**Window vs. GROUP BY:** usa una window function cuando debas **conservar cada fila** y aun así calcular sobre un grupo. Si solo necesitas el resumen colapsado, GROUP BY es más simple y barato.

**Regla general:** selección única → \`ROW_NUMBER\`; ranking con huecos → \`RANK\`; ranking sin huecos / "N-ésimo distinto" → \`DENSE_RANK\`. No puedes filtrar un resultado de window en \`WHERE\` — envuélvelo en una subconsulta/CTE y filtra \`rn\`/\`rnk\` fuera.`,
      },
      { title: "Rank, total corriente y cambio vs. la anterior" },
      { title: "Producto top por categoría (ROW_NUMBER + filtrar fuera)" },
      {
        title: "Rankea órdenes por valor",
        prompt:
          "Devuelve el `id` de cada orden y su `rnk` — un `RANK()` sobre todas las órdenes ordenadas por `total` **descendente** (más alto = rango 1).",
        hints: ["`RANK() OVER (ORDER BY total DESC) AS rnk`."],
      },
    ],
  },
  "set-operations": {
    title: "Operaciones de Conjuntos",
    summary: "Combina result sets — UNION, UNION ALL, INTERSECT, EXCEPT.",
    blocks: [
      {
        markdown: `## Combinar consultas

Ambas consultas deben tener el mismo número de columnas con tipos compatibles.

- **UNION** — combina y elimina duplicados. **UNION ALL** — mantiene duplicados (más rápido).
- **INTERSECT** — filas en *ambas*. **EXCEPT** — filas en la primera pero *no* en la segunda.`,
      },
      {
        markdown: `## 🧭 UNION vs. UNION ALL (y vs. OR)

- **\`UNION ALL\`** — concatena y **mantiene duplicados**. Más rápido (sin ordenación de dedup). Úsalo cuando las entradas no pueden solaparse, o los duplicados están bien.
- **\`UNION\`** — concatena y **elimina duplicados** (un \`DISTINCT\` implícito → sort/hash). Úsalo solo cuando de verdad necesites dedup; es medibalemente más lento en conjuntos grandes.
- **Un solo \`WHERE a OR b\`** — si los "dos conjuntos" son solo dos filtros sobre la **misma tabla**, una consulta gana a UNION.
- **\`INTERSECT\` / \`EXCEPT\`** — pertenencia de conjuntos de fila completa ("en ambos" / "en A no en B"); \`EXCEPT\` es un anti-join limpio.

**Regla general:** usa **\`UNION ALL\`** por defecto y solo sube a \`UNION\` cuando debas eliminar duplicados — no pagues por un \`DISTINCT\` que no necesitas.`,
      },
      { title: "Usuarios que pagaron pero nunca tuvieron un reembolso (EXCEPT)" },
      {
        title: "Usuarios pagados ∩ pendientes",
        prompt:
          "Usando `INTERSECT`, encuentra los `user_id` que aparecen en **ambos**: una orden pagada y una orden pendiente. (Puede que no haya ninguno — devuelve lo que digan los datos.)",
        hints: ["Dos SELECTs unidos por `INTERSECT`, cada uno filtrando un status distinto."],
      },
    ],
  },
  "modifying-data": {
    title: "INSERT, UPDATE, DELETE y UPSERT",
    summary: "Escribe datos — inserts multi-fila, RETURNING, updates con join, y upserts ON CONFLICT.",
    blocks: [
      {
        markdown: `## Cambiar datos

\`INSERT … RETURNING\` te devuelve columnas generadas (como un nuevo \`id\`). \`UPDATE … FROM\` y
\`DELETE … USING\` te dejan unir otra tabla. **Upsert** = \`INSERT … ON CONFLICT (col) DO UPDATE\`,
donde \`EXCLUDED\` es la fila que intentaste insertar.

> Cada runnable de abajo **reinicia primero la base de datos de ejemplo** (fíjate en el badge), así
> tus experimentos nunca se filtran a otras lecciones.

> **vs MySQL:** \`RETURNING\` no existe en MySQL (usa \`LAST_INSERT_ID()\`); el upsert es
> \`ON DUPLICATE KEY UPDATE\`; \`UPDATE … FROM\` se escribe \`UPDATE a JOIN b … SET\`.`,
      },
      {
        markdown: `## 🧭 Escribir datos — elige la herramienta correcta

- **\`DELETE … WHERE\`** — elimina filas específicas; transaccional, dispara triggers, soporta \`RETURNING\`.
- **\`TRUNCATE\`** — borra **todas** las filas rápido (sin trabajo por fila; \`RESTART IDENTITY\` reinicia secuencias). No puede filtrar, lock más pesado. Úsalo para vaciar una tabla.
- **\`INSERT … ON CONFLICT (key) DO UPDATE\`** — el **upsert** de referencia ante un conflicto de unique/PK; soporta \`RETURNING\`.
- **\`MERGE\`** — cuando necesitas **ramificación** (insertar *y* actualizar *y* borrar) contra una fuente unida. Más potente, pero sin \`RETURNING\`.
- **\`UPDATE … FROM\` / \`DELETE … USING\`** — cuando el cambio depende de **otra tabla** (join dentro de la escritura).

**Regla general:** upsert simple sobre una clave → \`ON CONFLICT\`; multi-rama / dirigido por join → \`MERGE\`; vaciar una tabla entera → \`TRUNCATE\`; todo lo demás → \`DELETE/UPDATE … WHERE\`.`,
      },
      { title: "Insertar y recuperar el nuevo id" },
      { title: "Upsert con ON CONFLICT" },
      {
        title: "Descuenta todo un 10%",
        prompt:
          "Da a cada producto un **10% de descuento** y devuelve `name` y el nuevo `price` (redondeado a 2 decimales). Usa `UPDATE … RETURNING`.\n\n*(Nota: `RETURNING` no admite `ORDER BY`, así que solo devuelve las filas — el orden no importa aquí.)*",
        hints: [
          "`SET price = ROUND(price * 0.9, 2)`.",
          "`RETURNING name, price` te devuelve las filas actualizadas.",
        ],
      },
    ],
  },
  transactions: {
    title: "Transacciones",
    summary: "Unidades de trabajo de todo-o-nada — BEGIN/COMMIT/ROLLBACK, savepoints, niveles de aislamiento.",
    blocks: [
      {
        markdown: `## ACID en la práctica

Una transacción agrupa sentencias para que todas hagan commit o todas hagan rollback. \`BEGIN\` inicia
una, \`COMMIT\` guarda, \`ROLLBACK\` deshace. \`SAVEPOINT\` permite un rollback parcial.

| Nivel de aislamiento | Dirty read | No repetible | Phantom |
|---|---|---|---|
| READ COMMITTED (default) | No | Sí | Sí |
| REPEATABLE READ | No | No | No* |
| SERIALIZABLE | No | No | No |

*El REPEATABLE READ de Postgres también bloquea phantoms.`,
      },
      { title: "Haz rollback y comprueba que nada cambió" },
      {
        question:
          "Necesitas que cada lectura dentro de una transacción vea un snapshot consistente, aunque otras sesiones hagan commit mientras tanto. ¿Qué nivel de aislamiento encaja más simple?",
        options: ["READ COMMITTED", "REPEATABLE READ", "READ UNCOMMITTED", "Ningún aislamiento puede hacerlo"],
        explanation:
          "REPEATABLE READ da a la transacción un snapshot estable durante toda su duración (y en Postgres también previene lecturas fantasma). SERIALIZABLE es aún más estricto pero más pesado de lo necesario aquí.",
      },
    ],
  },
  "ddl-constraints": {
    title: "DDL y Restricciones",
    summary: "Crea y altera tablas; impón integridad con claves, CHECK, UNIQUE y foreign keys.",
    blocks: [
      {
        markdown: `## Definir la estructura

\`CREATE TABLE\` define columnas y **restricciones**: \`PRIMARY KEY\`, \`UNIQUE\`, \`NOT NULL\`, \`CHECK\`,
\`DEFAULT\`, y \`FOREIGN KEY … REFERENCES … ON DELETE CASCADE\`. \`SERIAL\` (o \`GENERATED ALWAYS AS
IDENTITY\`) auto-numera una columna. \`ALTER TABLE\` añade/quita columnas y restricciones después.

> **vs MySQL:** \`SERIAL\` → \`INT AUTO_INCREMENT\`; \`DROP TABLE … CASCADE\` no está disponible (borra los hijos primero).`,
      },
      { title: "Crea una tabla con restricciones y úsala" },
      { title: "Una restricción CHECK rechazando datos malos" },
      {
        question:
          "Una `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE` — ¿qué pasa con las órdenes de un usuario cuando se borra ese usuario?",
        options: [
          "El borrado se bloquea mientras existan órdenes",
          "Las órdenes también se borran",
          "El user_id de las órdenes se vuelve NULL",
          "Nada — las órdenes conservan el id viejo",
        ],
        explanation:
          "ON DELETE CASCADE propaga el borrado a las filas dependientes. `SET NULL` anularía la FK; `RESTRICT`/`NO ACTION` bloquearían el borrado.",
      },
    ],
  },
  "indexes-explain": {
    title: "Índices y EXPLAIN",
    summary: "Acelera lecturas con el índice correcto, y lee los planes de consulta con EXPLAIN.",
    blocks: [
      {
        markdown: `## Hacer las consultas rápidas

Los índices cambian escrituras más lentas por lecturas más rápidas. **B-tree** (default) sirve para
igualdad, rangos, \`ORDER BY\` y \`LIKE 'prefix%'\`. **GIN** indexa arrays, JSONB y full-text. Los índices
**parciales** cubren un subconjunto (\`WHERE status='pending'\`). Constrúyelos con \`CREATE INDEX CONCURRENTLY\` en producción.

\`EXPLAIN\` muestra el plan; \`EXPLAIN ANALYZE\` lo ejecuta y reporta tiempos reales. Un \`Seq Scan\` en una
tabla grande suele significar un índice ausente.

> **vs MySQL:** No hay GIN/GiST/BRIN ni índices parciales en MySQL; tiene FULLTEXT/SPATIAL en su lugar.`,
      },
      {
        markdown: `## 🧭 Qué índice — y cuándo NO

- **B-tree (default)** — igualdad, rangos (\`<, >, BETWEEN\`), \`ORDER BY\` y \`LIKE 'prefix%'\`. ~90% de los índices.
- **GIN** — "muchos valores por fila": arrays (\`@>\`, \`&&\`), JSONB (\`@>\`, \`?\`), full-text (\`tsvector\`).
- **BRIN** — tablas enormes con **orden natural** (timestamps/ids solo-append); diminuto, barato, genial para rangos de series temporales.
- **Índice parcial** (\`… WHERE status = 'pending'\`) — indexa solo el subconjunto caliente; más pequeño y rápido.
- **Índice de expresión** (\`LOWER(email)\`) — cuando consultas una función de una columna.

**Cuándo NO indexar:** tablas de mucha escritura (cada escritura mantiene cada índice), tablas diminutas (un seq scan es más rápido), y columnas de muy baja cardinalidad (un booleano rara vez ayuda).

**Regla general:** empieza con un B-tree en las columnas por las que filtras/ordenas; cambia a GIN para arrays/JSONB/FTS; luego confirma que se usa con \`EXPLAIN\` (busca *Index Scan*, no *Seq Scan*).`,
      },
      { title: "Crea un índice, luego lee el plan" },
      { title: "EXPLAIN ANALYZE — tiempos reales sobre una tabla más grande" },
      { title: "Índice GIN para pertenencia en array" },
      {
        question: "¿Qué tipo de índice usarías para acelerar `WHERE tags @> ARRAY['apple']` en una columna `text[]`?",
        options: ["B-tree", "GIN", "BRIN", "Ningún índice puede ayudar con la contención de arrays"],
        explanation:
          "GIN (Generalized Inverted Index) está hecho para columnas multi-valor — arrays, JSONB y vectores de full-text — y acelera operadores de contención/solapamiento como `@>` y `&&`.",
      },
    ],
  },
  arrays: {
    title: "Arrays",
    summary: "El tipo array de primera clase de Postgres — guarda, busca y expande columnas multi-valor.",
    blocks: [
      {
        markdown: `## Los arrays son de primera clase

Postgres puede guardar y consultar arrays directamente. La indexación es **base-1**.

- \`'x' = ANY(arr)\` — contiene un valor.
- \`arr @> ARRAY['a','b']\` — contiene todos. \`arr && ARRAY['a','b']\` — solapa (algo en común).
- \`unnest(arr)\` — expande a una fila por elemento. \`array_agg(x)\` — colapsa filas en un array.

> **vs MySQL:** No hay tipo array nativo — se emula con JSON o una tabla de unión.`,
      },
      {
        markdown: `## 🧭 Columna array vs. tabla de unión vs. JSONB

- **Columna array** (\`text[]\`) — una **lista pequeña y acotada de escalares** que pertenece a la fila y que sobre todo lees entera o pruebas pertenencia (tags, flags). Indexa con GIN para \`@>\`/\`&&\`.
- **Tabla de unión** (el default normalizado) — cuando los ítems son **entidades** con sus propios atributos, necesitan foreign keys/restricciones, o agregas sobre ellos ("top tags en general", "productos por tag"). La opción correcta para relaciones reales.
- **JSONB** — estructura heterogénea o anidada cuya forma varía por fila.

**Regla general:** unas pocas etiquetas simples leídas con la fila → array; cualquier cosa que unirías, contarías o restringirías → una tabla de unión propia. Los arrays cambian flexibilidad de consulta por localidad.`,
      },
      { title: "Busca por tags (solapamiento) y expande (unnest)" },
      { title: "Cada tag distinto del catálogo" },
      {
        title: "Productos Apple",
        prompt:
          "Devuelve el `name` de cada producto cuyo array `tags` contenga `'apple'`, ordenado por `name`.",
        hints: ["`WHERE 'apple' = ANY(tags)` — o `tags @> ARRAY['apple']`."],
      },
    ],
  },
  jsonb: {
    title: "JSONB",
    summary: "Guarda y consulta datos semi-estructurados — operadores, contención y pruebas de clave.",
    blocks: [
      {
        markdown: `## Consultar JSON

\`JSONB\` guarda JSON en forma binaria e indexable (prefiérelo sobre \`JSON\`). Accede con:

- \`->\` devuelve JSONB, \`->>\` devuelve **texto** (usa \`->>\` para comparar/castear).
- \`#>> '{a,b}'\` sigue una ruta. \`@>\` prueba contención de un sub-documento.
- \`? 'key'\` prueba existencia de clave; \`?|\` / \`?&\` prueban alguna/todas de varias claves.

> **vs MySQL:** el \`JSON\` de MySQL se parece más al \`JSON\` de PG (sin GIN, sin \`@>\`/\`?\`); usa \`JSON_EXTRACT\`/\`JSON_CONTAINS\`.`,
      },
      {
        markdown: `## 🧭 JSONB vs. JSON vs. columnas normales

- **Columnas normales** — para campos por los que **filtras, unes, ordenas o restringes**. Siempre prefiere columnas reales para atributos conocidos y estructurados: tipadas, indexables, validadas.
- **JSONB** — datos **semi-estructurados / variables** (claves distintas por fila, payloads de terceros, atributos dispersos). Binario, indexable con GIN, soporta \`@>\`, \`?\`, \`->>\`.
- **JSON (texto)** — solo cuando debas **preservar el formato/orden de claves exacto** y no consultarás dentro. Sin GIN, acceso más lento. Raro.

**Regla general:** estructurado y consultado → columnas; flexible y consultado → JSONB; blob crudo que solo guardas → JSON. No modeles todo tu esquema como una columna JSONB — pierdes restricciones y la ayuda del planner.`,
      },
      { title: "Extraer y castear campos anidados" },
      { title: "Expandir un array JSON de tallas en filas" },
      {
        title: "Garantía de un año",
        prompt:
          'Devuelve el `name` de cada producto cuyo `metadata` diga que `warranty` es `1`. Ordena por `name`. (Pista: contención con `@>`.)',
        hints: ['`WHERE metadata @> \'{"warranty": 1}\'` — nota que los números JSON no van entre comillas.'],
      },
    ],
  },
  views: {
    title: "Vistas y Vistas Materializadas",
    summary: "Guarda consultas como tablas virtuales; cachea las costosas con vistas materializadas.",
    blocks: [
      {
        markdown: `## Vistas vs. vistas materializadas

Una **vista** es una consulta guardada — no almacena datos, siempre fresca, recomputada en cada
lectura. Una **vista materializada** almacena el resultado físicamente (lecturas rápidas) y debe
hacerse \`REFRESH\` para actualizarse.

Usa una vista para datos que cambian con frecuencia; una vista materializada para agregaciones
costosas que pueden estar ligeramente desactualizadas.

> **vs MySQL:** Las vistas materializadas no existen en MySQL — emúlalas con una tabla refrescada en un horario.`,
      },
      {
        markdown: `## 🧭 Vista vs. Vista Materializada vs. CTE

- **Vista** — una consulta con nombre, **siempre fresca**, recomputada en cada lectura. Úsala para encapsular/estandarizar lógica sobre datos **que cambian con frecuencia**. Sin almacenamiento, sin desfase.
- **Vista Materializada** — almacena el **resultado precomputado** para lecturas rápidas; debe hacerse \`REFRESH\`. Úsala para **agregaciones costosas** donde datos algo desactualizados están bien (dashboards, reportes).
- **CTE** — acotado a una **sola consulta**, no reutilizable en otro lado. Úsalo para legibilidad dentro de una sentencia, no como objeto persistente.
- **Tabla** — cuando necesitas escribir en ella, indexarla mucho, o compartir un resultado grande ampliamente.

**Regla general:** lógica reutilizable que debe estar en vivo → vista; costosa y tolerante al desfase → vista materializada (refresca en un horario); legibilidad de una consulta → CTE.`,
      },
      { title: "Crea una vista y consúltala" },
      { title: "Una vista materializada de ingresos" },
      {
        question: "Tu dashboard corre una agregación costosa que puede estar unos minutos desactualizada. ¿Qué encaja mejor?",
        options: [
          "Una vista normal",
          "Una vista materializada, refrescada en un horario",
          "Un CTE",
          "Una tabla temporal por request",
        ],
        explanation:
          "Una vista materializada almacena el resultado precomputado para lecturas rápidas; un REFRESH programado la mantiene aceptablemente fresca. Una vista normal re-ejecutaría la consulta costosa en cada lectura.",
      },
    ],
  },
  "functions-plpgsql": {
    title: "Funciones, Procedimientos y Triggers",
    summary: "Encapsula lógica en PL/pgSQL — funciones escalares/de tabla, procedimientos y triggers.",
    blocks: [
      {
        markdown: `## Lógica del lado del servidor

Una **función** devuelve un valor (escalar o una tabla) y se usa en SQL: \`SELECT my_fn(…)\`. Un
**procedimiento** se llama con \`CALL\` y puede hacer \`COMMIT\`/\`ROLLBACK\`. Un **trigger** corre una
función automáticamente en \`INSERT\`/\`UPDATE\`/\`DELETE\`, con las filas \`NEW\`/\`OLD\` disponibles.

PL/pgSQL añade control de flujo: \`DECLARE\`, \`IF/ELSIF\`, \`LOOP\`/\`WHILE\`/\`FOR\`, y \`RAISE\`.`,
      },
      { title: "Una función escalar con un nivel basado en CASE" },
      { title: "Un trigger que marca la hora de las actualizaciones" },
      {
        markdown: `### Control de flujo dentro de una función

PL/pgSQL es un lenguaje procedural de verdad. Dentro de \`BEGIN … END\` puedes ramificar y hacer bucles:

- **\`IF / ELSIF / ELSE\`** para ramificar.
- **\`LOOP … EXIT WHEN\`**, **\`WHILE … LOOP\`**, y **\`FOR i IN 1..n LOOP\`** para iterar
  (\`FOR … IN REVERSE\` cuenta hacia atrás; \`CONTINUE WHEN\` salta una iteración).
- **\`FOR row IN SELECT … LOOP\`** para iterar sobre los resultados de una consulta fila por fila.
- **\`RAISE NOTICE / WARNING / EXCEPTION\`** para loguear o abortar.`,
      },
      { title: "Bucles + IF: suma de los números impares 1..n" },
      { title: "FOR sobre una consulta: cuenta filas por encima de un umbral" },
      { title: "Manejo de excepciones: captura una violación de restricción" },
      {
        markdown: `### Procedimientos — llamados con \`CALL\`

Un **procedimiento** es como una función pero se invoca con \`CALL\` en vez de \`SELECT\`, no devuelve
nada directamente, y (a diferencia de una función) puede hacer \`COMMIT\`/\`ROLLBACK\` de sus propias
transacciones — útil para trabajos por lotes que hacen commit en trozos.`,
      },
      { title: "Un procedimiento que muta datos, ejecutado con CALL" },
      {
        question: "¿Qué es cierto de un **procedimiento** PL/pgSQL (vs. una función)?",
        options: [
          "Puede hacer COMMIT/ROLLBACK de transacciones y se invoca con CALL",
          "Debe devolver un valor",
          "Se puede usar dentro de una lista SELECT",
          "No puede tomar parámetros",
        ],
        explanation:
          "Los procedimientos se llaman con `CALL`, no devuelven nada (o vía parámetros INOUT), y —a diferencia de las funciones— pueden gestionar transacciones internamente. Las funciones devuelven un valor y son usables en expresiones SQL.",
      },
      {
        title: "Factorial con un CTE recursivo",
        prompt:
          "Calcula **6! (= 720)** en una sola consulta usando un CTE `WITH RECURSIVE`. Devuelve una columna llamada `result`.\n\n(Las funciones PL/pgSQL se muestran en los runnables de arriba; el ejercicio calificado usa un CTE recursivo para que sea una sola sentencia.)",
        hints: [
          "Fila ancla: `SELECT 1, 1`. Paso recursivo: `SELECT n + 1, fact * (n + 1) FROM f WHERE n < 6`.",
          "El factorial final es el mayor `fact`: `SELECT max(fact) AS result FROM f`.",
        ],
      },
    ],
  },
  "builtin-functions": {
    title: "Funciones de String, Fecha, Math y NULL",
    summary: "La caja de herramientas diaria — manipulación de texto, matemática de fechas, redondeo y manejo de NULL.",
    blocks: [
      {
        markdown: `## La caja de herramientas diaria

- **Strings:** \`||\` concatena, \`upper/lower/initcap\`, \`trim\`, \`substring\`, \`split_part\`,
  \`replace\`, \`length\`, \`to_char\`, regex con \`~\` / \`regexp_replace\`. Agrega con \`string_agg\`.
- **Fechas:** \`now()\`, \`current_date\`, \`extract(field FROM ts)\`, \`date_trunc('month', ts)\`,
  matemática de intervalos (\`now() - interval '7 days'\`), \`to_char\`/\`to_date\`, y \`generate_series\` para rellenar huecos.
- **Math/NULL:** \`round/floor/ceil\`, \`coalesce(a,b)\` (primer no-null), \`nullif(a,b)\` (null cuando son iguales —
  genial para división segura: \`x / nullif(y,0)\`).

> **vs MySQL:** \`||\` es OR lógico en MySQL — usa \`CONCAT()\`; \`string_agg\`→\`GROUP_CONCAT\`;
> \`date_trunc\`/\`generate_series\` no existen (emúlalos con \`DATE_FORMAT\` / una tabla de números).`,
      },
      { title: "Formateo de strings y fechas" },
      { title: "Regex y modelado de strings" },
      { title: "Rellena huecos de fechas con generate_series" },
      {
        title: "Mes de registro por usuario",
        prompt:
          "Devuelve el `name` de cada usuario y su mes de registro como texto en formato `YYYY-MM` (llámalo `month`), ordenado por `name`.",
        hints: ["`to_char(created_at, 'YYYY-MM')`."],
      },
    ],
  },
  "full-text-search": {
    title: "Búsqueda de Texto Completo",
    summary: "Busca texto en lenguaje natural con tsvector / tsquery y rankea las coincidencias.",
    blocks: [
      {
        markdown: `## Buscar texto correctamente

\`to_tsvector(lang, text)\` convierte el texto en lexemas normalizados; \`to_tsquery\` / \`plainto_tsquery\` /
\`websearch_to_tsquery\` construyen una consulta; el operador \`@@\` prueba una coincidencia. \`ts_rank\`
puntúa los resultados, y un índice **GIN** sobre el tsvector lo hace rápido.

> **vs MySQL:** MySQL usa \`MATCH … AGAINST\` con un índice \`FULLTEXT\` — sin \`tsvector\`/\`tsquery\`/\`ts_rank\`.`,
      },
      { title: "Coincidir nombres de producto" },
      { title: "Rankear coincidencias por relevancia" },
      {
        question: "¿Por qué preferir `to_tsvector(...) @@ to_tsquery(...)` sobre `name ILIKE '%book%'` para buscar?",
        options: [
          "Normaliza palabras (stemming) y puede usar un índice GIN para velocidad/ranking",
          "ILIKE no se puede usar en WHERE",
          "tsquery es la única forma de hacer coincidencia insensible a mayúsculas",
          "No hay diferencia real",
        ],
        explanation:
          "La búsqueda de texto completo lematiza los tokens (así 'running' coincide con 'run'), ignora stop-words, soporta consultas booleanas/de frase y ranking, y se acelera con índice GIN — mucho más allá de un escaneo de substring con `LIKE`.",
      },
    ],
  },
  "interview-patterns": {
    title: "Patrones de Entrevista",
    summary: "Las formas de pregunta recurrentes — N-ésimo más alto, huérfanos, dedupe, totales corrientes.",
    blocks: [
      {
        markdown: `## Patrones que aparecen una y otra vez

Memoriza la *forma*, adapta al problema:

1. **N-ésimo más alto** — \`ORDER BY x DESC LIMIT 1 OFFSET n-1\`, o \`DENSE_RANK()\` filtrado a \`= n\`.
2. **Huérfanos / sin coincidencia** — \`LEFT JOIN … WHERE right.id IS NULL\` (o \`NOT EXISTS\`).
3. **Borrar duplicados** — conserva \`MIN(id)\` por clave, borra el resto.
4. **Total corriente que se reinicia por grupo** — \`SUM(x) OVER (PARTITION BY g ORDER BY t ROWS UNBOUNDED PRECEDING)\`.
5. **Pivot** — \`SUM(CASE WHEN … THEN … END)\` agrupado.`,
      },
      {
        markdown: `## 🧭 "Encontrar filas sin coincidencia" — tres formas

- **\`LEFT JOIN … WHERE right.id IS NULL\`** — normalmente el anti-join **más rápido** (el planner usa un hash/merge anti-join). Buen default.
- **\`NOT EXISTS\` (correlacionado)** — igualmente correcto y **NULL-safe**; se lee claro como "no existe tal fila". A menudo se planifica idéntico a la forma LEFT JOIN.
- **\`NOT IN (subconsulta)\`** — **evítalo** cuando la columna de la subconsulta puede ser NULL: un solo NULL hace el predicado UNKNOWN y obtienes **cero filas**. Solo seguro si la columna es \`NOT NULL\` (o añades \`WHERE col IS NOT NULL\`).

**Regla general:** usa \`NOT EXISTS\` o \`LEFT JOIN … IS NULL\` por defecto; nunca \`NOT IN\` contra una subconsulta que admita NULL.`,
      },
      { title: "Segundo precio distinto más alto — tres formas" },
      {
        title: "Segundo precio más alto",
        prompt:
          "Devuelve un solo valor: el `price` de producto **segundo más alto distinto**. (El más alto es 1299.00.)",
        hints: ["`ORDER BY price DESC` y luego `LIMIT 1 OFFSET 1`.", "`DISTINCT` protege contra empates."],
      },
      {
        title: "Clientes con cero órdenes",
        prompt:
          "Devuelve el `name` de cada usuario que **no tiene ninguna orden**, ordenado por `name`. Usa un `LEFT JOIN … IS NULL` o `NOT EXISTS`.",
        hints: ["Tras el LEFT JOIN, conserva las filas donde `o.id IS NULL`."],
      },
    ],
  },
  "advanced-queries": {
    title: "Taller de Consultas Avanzadas",
    summary:
      "Construye grandes consultas multi-paso con confianza — CTEs encadenados que combinan UNNEST, window functions, FILTER, ROLLUP y gaps-and-islands. Preparación para live-coding.",
    blocks: [
      {
        markdown: `## Leer y construir una consulta grande

En una prueba de live-coding te darán un muro de SQL — o te pedirán escribir uno. El truco es que una
**consulta multi-CTE es solo un pipeline**: cada bloque \`WITH\` es una transformación, y lo lees
**de arriba abajo** como un script. El \`SELECT\` final al fondo ensambla las piezas.

Una forma fiable de *construir* una bajo presión:

1. **Da forma a las filas** — \`FROM\`/\`JOIN\`/\`UNNEST\` para tener una fila por "cosa" (por evento, por línea de orden).
2. **Numera / rankea dentro de grupos** — \`ROW_NUMBER()\`/\`RANK()\` \`OVER (PARTITION BY … ORDER BY …)\`.
3. **Agrega** — \`GROUP BY\` con \`COUNT(DISTINCT …)\`, \`SUM(…) FILTER (WHERE …)\`, etc.
4. **Ensambla** — une los CTEs de vuelta y filtra (p. ej. \`WHERE rn = 1\`).

Todo lo de abajo corre contra la base de ejemplo (o una diminuta autocontenida) — **edita y re-ejecuta**.`,
      },
      {
        markdown: `## 1. Sesionización — "primera página + páginas únicas por sesión"

Este es el patrón de una pregunta clásica: los eventos se guardan como un **array por sesión**;
explótalos, encuentra la **primera** página de cada sesión, y cuenta sus páginas **distintas**.

**¿Es compatible con PostgreSQL?** Sí — con un requisito: \`events\` debe ser un *array de un tipo
compuesto (fila)* (aquí \`event_t(page, ts)\`). Entonces \`UNNEST(events) AS e(page, ts)\` expande cada
elemento en columnas. (En algunos setups escribirías \`(e).page\`; la forma de alias de columna
\`AS e(page, ts)\` es la portable. Si tus eventos fueran \`jsonb\`, cambiarías \`UNNEST\` por
\`jsonb_to_recordset(events) AS e(page text, ts timestamptz)\`.)`,
      },
      { title: "Sesionización (UNNEST + ROW_NUMBER + COUNT DISTINCT + JOIN USING)" },
      {
        markdown: `**Paso a paso** — exactamente los movimientos que un entrevistador quiere oírte narrar:

- **CTE \`events\`** — \`FROM activity_logs, UNNEST(events) AS e(page, ts)\` es un
  \`CROSS JOIN LATERAL\` implícito: por cada fila de log, emite una fila por elemento del array. Ahora
  tenemos \`(user_id, session_id, page, ts)\` plano.
- **CTE \`ranked\`** — \`ROW_NUMBER() OVER (PARTITION BY user_id, session_id ORDER BY ts)\` numera
  los eventos **dentro de cada sesión** por tiempo. El evento más temprano recibe \`rn = 1\`.
- **CTE \`unique_pages\`** — un \`GROUP BY\` normal con \`COUNT(DISTINCT page)\` para el conteo distinto
  por sesión (las window functions no pueden contar-\`DISTINCT\`, así que esto queda como agregado aparte).
- **\`SELECT\` final** — une los dos CTEs por la clave de sesión (\`USING (user_id, session_id)\`) y
  conserva solo \`rn = 1\` para colapsar a una fila por sesión: su primera página + su conteo de páginas únicas.`,
      },
      {
        markdown: `## 2. Ítem top por grupo (el patrón de entrevista #1)

"Por categoría, ¿cuál es el producto más vendido?" → agrega, **rankea dentro del grupo**, conserva el rango 1.`,
      },
      { title: "Producto más vendido por categoría" },
      {
        markdown: `## 3. Marcos de window — totales corrientes y participación del total

Dos windows en una consulta: un **total corriente** (un marco ordenado) y una **participación del
todo** (\`OVER ()\` — una window vacía = todo el result set, sin colapsar).`,
      },
      { title: "Ingreso pagado corriente + participación de cada orden en el total" },
      {
        markdown: `## 4. Pivot + subtotales con FILTER y ROLLUP

\`FILTER (WHERE …)\` pivota los status en columnas; \`GROUP BY ROLLUP(col)\` añade una fila de gran total
(donde \`col\` es NULL) en la misma pasada.`,
      },
      { title: "Ingreso por categoría, pagado vs. bruto, con una fila TOTAL" },
      {
        markdown: `## 5. Gaps & islands — rachas consecutivas

El truco famoso: resta un \`ROW_NUMBER()\` a la fecha. Los días consecutivos comparten la **misma**
diferencia, así que esa diferencia se vuelve una clave de grupo para cada "isla" (racha).`,
      },
      { title: "Rachas de login por usuario" },
      {
        markdown: `## Ahora tú — ejercicios calificados

Estos corren contra la base e-commerce de ejemplo (se reinicia antes de cada revisión). Usa los
patrones de arriba. El orden importa donde el enunciado lo diga.`,
      },
      {
        title: "Producto top por categoría",
        prompt:
          "Por cada categoría, devuelve `category` (el nombre de categoría), el `product` que vendió **más unidades** (suma de `order_items.qty`), y `units`. Una fila por categoría, ordenada por `category`. Desempata por nombre de producto.\n\n*Combina: JOIN → GROUP BY → ROW_NUMBER sobre PARTITION → filtrar rn = 1.*",
        hints: [
          "Primer CTE: `SUM(oi.qty)` agrupado por producto (y su categoría).",
          "Segundo CTE: `ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY units DESC, product)`.",
          "Final: `WHERE rn = 1`.",
        ],
      },
      {
        title: "Participación de categoría en el ingreso pagado",
        prompt:
          "Solo entre órdenes **pagadas**, devuelve cada `category` (nombre), su `paid_rev` (suma de `qty * unit_price`), y `pct` — el porcentaje de esa categoría sobre el ingreso pagado total, redondeado a 1 decimal. Mayor ingreso primero.\n\n*Combina: multi-join con un filtro → GROUP BY → una window `SUM() OVER ()` para el gran total.*",
        hints: [
          "Filtra a órdenes pagadas dentro del join: `JOIN orders o ON o.id = oi.order_id AND o.status = 'paid'`.",
          "`SUM(paid_rev) OVER ()` (window vacía) es el total entre todas las categorías.",
        ],
      },
      {
        title: "Rankea clientes por valor de por vida",
        prompt:
          "Devuelve el `name` de cada usuario y `rnk` — su `DENSE_RANK()` por valor **pagado** de por vida (suma de totales de órdenes pagadas; los usuarios sin ninguna cuentan como 0), mayor valor = rango 1. Incluye usuarios sin órdenes. Ordena por `rnk`, luego `name`.\n\n*Combina: LEFT JOIN → SUM condicional con FILTER → DENSE_RANK.*",
        hints: [
          "`COALESCE(SUM(o.total) FILTER (WHERE o.status='paid'), 0)` maneja usuarios sin órdenes pagadas.",
          "`DENSE_RANK()` (sin huecos) para que los empates compartan rango y el siguiente sea consecutivo.",
        ],
      },
      {
        title: "La primera orden de cada usuario",
        prompt:
          "Devuelve una fila por usuario que tenga órdenes: `user_id`, `first_order_id` (su orden más temprana por `created_at`), y el `total` de esa orden. Ordena por `user_id`.\n\n*Combina: ROW_NUMBER sobre PARTITION → filtrar a la primera fila.*",
        hints: [
          "Consulta interna: `ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) AS rn`.",
          "Externa: conserva `WHERE rn = 1`.",
        ],
      },
    ],
  },
  "analytics-patterns": {
    title: "Patrones de Analytics (Pack de Entrevista)",
    summary:
      "Los patrones que las entrevistas de analytics/DE reutilizan — periodo-sobre-periodo (LAG), medias móviles, sesionización por hueco, dedupe-mantén-el-último, segmentación NTILE, y retención de cohortes. Todo Postgres, todo ejecutable.",
    blocks: [
      {
        markdown: `## Las formas a las que se reduce ~90% de los tests de SQL

Los entrevistadores reutilizan un pequeño conjunto de patrones. Ya viste varios antes en este track:

| Patrón | Dónde |
|---|---|
| Filtrar y agregar | lección *GROUP BY* |
| Joins condicionales (LEFT JOIN + IS NULL) | *JOINs* / *Patrones de Entrevista* |
| Top-N por grupo | *Window Functions* / *Taller Avanzado* |
| Jerarquía / cadena de mánagers (CTE recursivo / self-join) | *CTEs* / *JOINs* |

Esta lección ejercita los de **sabor analítico** que separan "escribe SQL" de "escribe SQL
*analítico*": **cambio periodo-sobre-periodo, ventanas móviles, sesionización por hueco de
inactividad, deduplicación conservando la última fila, segmentación NTILE, y retención de cohortes.**
Edita y re-ejecuta cada uno.`,
      },
      {
        markdown: `## 1. Periodo-sobre-periodo — % de crecimiento mes a mes

El de referencia para cualquier "compara este periodo con el anterior". \`LAG(x) OVER (ORDER BY period)\`
trae la fila anterior; protege la división con \`NULLIF(prev, 0)\` para que un periodo previo cero o
ausente no la reviente.`,
      },
      { title: "Crecimiento de ingreso mes a mes" },
      {
        markdown: `## 2. Ventana móvil — media móvil de 7 días

Un marco de \`ROWS BETWEEN 6 PRECEDING AND CURRENT ROW\` son exactamente 7 filas (hoy + las 6 anteriores).
Cambia \`AVG\` por \`SUM\`/\`COUNT\` para totales móviles. Esta es la pregunta canónica de "DAU móvil de 7 días".`,
      },
      { title: "Media móvil de 7 días de usuarios activos diarios" },
      {
        markdown: `## 3. Sesionización por hueco de inactividad (la "regla de los 30 minutos")

La otra pregunta de sesionización (el *Taller Avanzado* hizo la versión de array-de-eventos): filas de
hits crudas, y una **nueva sesión empieza tras 30+ minutos de inactividad**. El truco es una window de
dos pasos:

1. Marca una fila como inicio de sesión cuando el hueco desde el hit anterior supera los 30 min (o es el
   primer hit del usuario) — \`ts - LAG(ts) OVER (…) > interval '30 minutes'\`.
2. Un **\`SUM\` corriente de esos flags** asigna un número de sesión creciente por usuario — cada flag lo
   sube en uno. Este "suma acumulada de un booleano" es un patrón que vale la pena memorizar.`,
      },
      { title: "Asignar ids de sesión a partir de un hueco de inactividad de 30 minutos" },
      {
        markdown: `## 4. Deduplicar — conserva la fila **más reciente** por clave

"Una fila por usuario — su orden más reciente." Numera las filas dentro de cada clave por un orden
descendente, conserva \`rn = 1\`. (Añade un desempate como \`id DESC\` para que sea determinista cuando los
timestamps colisionan.) La misma idea que top-N, aplicada al dedup.`,
      },
      { title: "Orden más reciente por usuario" },
      {
        markdown: `## 5. Segmentación — buckets NTILE

\`NTILE(n)\` divide las filas ordenadas en \`n\` buckets aproximadamente iguales — cuartiles, deciles,
"top 10%". El básico de la segmentación de clientes, cohortes A/B, y scoring de fraude.`,
      },
      { title: "Clasificar productos en cuartiles de precio" },
      {
        markdown: `## 6. Retención de cohortes

El clásico de producto-DS: agrupa usuarios por el periodo de su **primera** actividad (su *cohorte*),
luego mide cuántos siguen activos N periodos después. Pasos: encuentra el primer mes de cada usuario,
calcula el **offset de mes** de cada actividad desde esa cohorte, luego pivota los conteos de usuarios
distintos por offset con \`COUNT(DISTINCT …) FILTER (WHERE month_no = k)\`.`,
      },
      { title: "Tabla de cohortes — retención mes-0 y mes-1" },
      {
        markdown: `## Ejercicios calificados

Estos corren contra la base e-commerce de ejemplo (se reinicia antes de cada revisión). El orden importa donde se indica.`,
      },
      {
        title: "Conserva la última orden de cada usuario",
        prompt:
          "Devuelve una fila por usuario que tenga órdenes: `user_id`, `order_id` (su orden **más reciente** por `created_at`), y el `total` de esa orden. Ordena por `user_id`.\n\n*Patrón: dedupe-mantén-el-último — ROW_NUMBER ordenado DESC, conserva rn = 1.*",
        hints: [
          "Ordena **descendente** dentro de la window para que la más nueva reciba `rn = 1`.",
          "Añade `id DESC` como desempate para determinismo.",
        ],
      },
      {
        title: "Cambio vs. la orden pagada anterior del usuario",
        prompt:
          "Por cada orden **pagada**, devuelve `user_id`, `total`, y `vs_prev` — el total menos el total de la *anterior* orden pagada de ese usuario (NULL para la primera). Ordena por `user_id`, luego `created_at`.\n\n*Patrón: periodo-sobre-periodo con LAG particionado por usuario.*",
        hints: ["`LAG(total) OVER (PARTITION BY user_id ORDER BY created_at)` es el total anterior."],
      },
      {
        title: "Divide los productos en dos niveles de precio",
        prompt:
          "Usando `NTILE(2)` sobre `price` **descendente**, devuelve el `name` de cada producto y su `tier` (1 = mitad más cara, 2 = mitad más barata). Ordena por `price` descendente, luego `name`.\n\n*Patrón: segmentación NTILE.*",
        hints: ["`NTILE(2) OVER (ORDER BY price DESC)` divide las 5 filas en un 3/2 arriba/abajo."],
      },
    ],
  },
  "funnel-conversion": {
    title: "Conversión de Embudo (Funnel)",
    summary:
      "Mide el drop-off a través de una secuencia de pasos — embudos sueltos vs. estrictos (ordenados), tasas de conversión, y construir un embudo desde tablas existentes.",
    blocks: [
      {
        markdown: `## Qué mide un embudo

Un **embudo (funnel)** rastrea cuántos usuarios pasan por una secuencia ordenada de pasos —
\`view → cart → checkout → purchase\` — y dónde abandonan. Dos variantes salen en entrevistas:

- **Embudo suelto** — cuenta usuarios distintos que llegan a *cada* paso, de forma independiente. Simple,
  pero puede **sobrecontar** los pasos tardíos (alguien podría \`purchase\` sin un \`cart\` registrado).
- **Embudo estricto / ordenado** — un usuario solo cuenta en el paso *k* si completó todos los pasos
  previos **en orden** (por tiempo). Más fiel a la conversión "real".`,
      },
      { title: "Embudo suelto — usuarios por paso + tasas de conversión" },
      {
        markdown: `Detecta el bug: \`purchase\` muestra **3** usuarios y un \`pct_of_prev\` de **150%** — imposible para un
embudo real. El usuario 5 compró sin fila de \`cart\`/\`checkout\`, así que el conteo independiente por paso
sobrecuenta. El embudo **estricto** lo arregla.

## Embudo estricto — impón el orden con timestamps

Pivota el **primer** timestamp de cada usuario por paso (\`MIN(ts) FILTER (WHERE step = …)\`), luego un
usuario cuenta en un paso solo si sus timestamps son **monótonos** (cada paso en/después del anterior).`,
      },
      { title: "Embudo estricto ordenado" },
      {
        markdown: `Ahora \`purchased = 2\` (solo los usuarios 1 y 4 llegaron hasta el final en orden) — la compra fuera de
orden del usuario 5 se excluye correctamente. \`NULL >= …\` es desconocido, así que los pasos ausentes
fallan el filtro automáticamente.

## No siempre necesitas una tabla de eventos

Un embudo son solo **conteos con condiciones sucesivamente más estrictas**. Puedes construir uno
directamente desde tablas existentes — que es exactamente el siguiente ejercicio.`,
      },
      {
        title: "Embudo registro → orden → pagado",
        prompt:
          "Construye un embudo de 3 etapas desde la base de ejemplo y devuelve `step` y `users` (el conteo), en orden de embudo:\n\n1. `registered` — todos los usuarios.\n2. `ordered` — usuarios distintos que hicieron **cualquier** orden.\n3. `paid` — usuarios distintos con al menos una orden **pagada**.\n\nOrdena las filas registered → ordered → paid.",
        hints: [
          "Cada etapa es una subconsulta escalar: `(SELECT COUNT(DISTINCT user_id) FROM orders …)`.",
          "Lleva una columna `ord` para que las filas salgan registered → ordered → paid.",
        ],
      },
      {
        question:
          "Contar `COUNT(DISTINCT user_id)` por paso de forma independiente puede reportar MÁS conversiones en un paso tardío de lo real. ¿Por qué?",
        options: [
          "Cuenta usuarios que llegaron a un paso sin completar los pasos anteriores en orden",
          "COUNT(DISTINCT) no está soportado en Postgres",
          "Las window functions no se pueden usar en tablas de eventos",
          "Siempre subcuenta, nunca sobrecuenta",
        ],
        explanation:
          "Un conteo distinto por paso trata los pasos de forma independiente, así que eventos fuera de orden o con pasos saltados (p. ej. una compra sin cart) igual cuentan. Un embudo estricto impone el orden con timestamps por usuario.",
      },
    ],
  },
  "recursive-hierarchies": {
    title: "CTEs Recursivos — Cadenas de Mánagers y Árboles",
    summary:
      "Recorre jerarquías de profundidad desconocida — organigramas hacia abajo (descendientes) y cadenas de mando hacia arriba (ancestros), con profundidad, rutas y seguridad ante ciclos.",
    blocks: [
      {
        markdown: `## Recursión para jerarquías

Cuando una tabla se referencia a sí misma (\`employees.manager_id → employees.id\`, \`categories.parent_id\`),
no puedes saber la profundidad de antemano — así que **recursas**. Un CTE recursivo tiene dos partes
unidas por \`UNION ALL\`:

1. **Ancla** — las filas iniciales (las raíces, o un nodo específico).
2. **Miembro recursivo** — une la tabla de vuelta al CTE para traer el siguiente nivel, repitiendo hasta
   que no aparezcan filas nuevas.

Puedes recorrer **hacia abajo** (los descendientes de un mánager) o **hacia arriba** (la cadena de un
empleado hasta el CEO) — solo cambia qué lado del join es el CTE.`,
      },
      { title: "Organigrama — recorrer HACIA ABAJO desde arriba (profundidad + ruta)" },
      {
        markdown: `## Recorrer HACIA ARRIBA — la cadena de mando de un empleado

Cambia el join (\`e.id = chain.manager_id\`) y ancla en un empleado para subir hasta la raíz. Esta es la
pregunta "¿quiénes son los mánagers de Frank, hasta arriba?".`,
      },
      { title: "Cadena de mando por encima de Frank (ancestros)" },
      {
        markdown: `## La misma idea en la base de ejemplo

La tabla \`categories\` de ejemplo también es una jerarquía (\`parent_id\`). Recorre **hacia arriba** llevando
la raíz, y cada categoría aprende a qué sección de nivel superior pertenece.

> **Seguridad ante ciclos:** \`UNION ALL\` no parará si los datos tienen un bucle (A dirige a B dirige a A).
> Protégete con un tope de profundidad (\`WHERE depth < 100\`), rastreando ids visitados en un array
> (\`NOT id = ANY(path_ids)\`), o usando \`UNION\` (dedupe, pero más lento). Los datos reales de org/categoría
> suelen ser un árbol limpio.

> **vs MySQL:** los CTEs recursivos necesitan MySQL 8.0+; la sintaxis \`WITH RECURSIVE\` es la misma.`,
      },
      { title: "La raíz de nivel superior de cada categoría (subir por parent_id)" },
      {
        title: "Profundidad de categoría",
        prompt:
          "Usando un **CTE recursivo**, devuelve el `name` de cada categoría y su `depth` — las categorías de nivel superior son profundidad `0`, sus hijos profundidad `1`, y así. Ordena por `depth`, luego `name`.",
        hints: [
          "Ancla: `WHERE parent_id IS NULL` con `0 AS depth`.",
          "Recursivo: `JOIN tree t ON t.id = c.parent_id`, seleccionando `t.depth + 1`.",
        ],
      },
      {
        title: "Todos bajo un mánager",
        prompt:
          "La base de ejemplo no tiene empleados, así que usa `categories` como árbol: empezando desde **Electronics**, devuelve el `name` de Electronics **y todas las categorías debajo** (sus descendientes, a cualquier profundidad). Ordena por `name`.\n\n*Patrón: recorrido recursivo HACIA ABAJO desde un nodo.*",
        hints: [
          "Ancla en la única fila `WHERE name = 'Electronics'`.",
          "Miembro recursivo: `JOIN sub s ON c.parent_id = s.id` para traer cada nivel de hijos.",
        ],
      },
    ],
  },
  "pivot-unpivot": {
    title: "Pivot y Unpivot",
    summary:
      "Rota filas a columnas y de vuelta — el pivot portable con FILTER/CASE, la advertencia de crosstab, y el unpivot con VALUES + LATERAL.",
    blocks: [
      {
        markdown: `## Pivot: filas → columnas

"Pivotar" convierte valores de fila en columnas — p. ej. una columna por status. La forma **portable**
(funciona en todas partes, sin extensiones) es la **agregación condicional**: \`SUM(...) FILTER (WHERE …)\`
(o \`SUM(CASE WHEN … THEN … END)\`), una expresión por columna destino.

> **crosstab():** Postgres también trae una función \`crosstab()\` en la **extensión** \`tablefunc\`
> (\`CREATE EXTENSION tablefunc\`). Es más concisa pero necesita la extensión instalada (aquí no está, y a
> menudo no está en setups gestionados), y la lista de columnas debe declararse por adelantado. Para
> entrevistas y portabilidad, **usa \`FILTER\` primero.**`,
      },
      { title: "Pivot de ingresos por status, por trimestre (FILTER)" },
      {
        markdown: `## Unpivot: columnas → filas

Lo inverso — una tabla ancha (una columna por trimestre) en filas altas \`(key, value)\` — es más limpio
con \`CROSS JOIN LATERAL (VALUES …)\` (o \`unnest(ARRAY[…])\`). Cada fila de origen se empareja con una fila
por cada columna que listes.`,
      },
      { title: "Unpivot de una tabla trimestral ancha" },
      {
        title: "Conteos de órdenes por status, en una fila",
        prompt:
          "Pivota las órdenes en una sola fila con tres columnas — `paid`, `pending`, `refunded` — cada una el **conteo** de órdenes con ese status.",
        hints: ["Un `COUNT(*) FILTER (WHERE status = '…')` por columna; no hace falta GROUP BY."],
      },
    ],
  },
  "statistics-distributions": {
    title: "Estadística, Percentiles e Histogramas",
    summary:
      "Mediana de dos formas (incl. sin PERCENTILE_CONT), percent_rank vs cume_dist, moda, e histogramas con width_bucket.",
    blocks: [
      {
        markdown: `## Mediana — la forma limpia y la forma "sin percentil"

La forma limpia es el agregado de conjunto ordenado \`PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY x)\`. Pero
a los entrevistadores les encanta pedir la mediana **sin** él — para ver si entiendes la definición. El
truco: numera las filas, cuéntalas, y promedia la **del medio o las dos del medio**:

- Conteo impar → una fila central en \`(n+1)/2\`.
- Conteo par → promedia las dos filas centrales.

\`rn IN (FLOOR((c+1)/2.0), CEIL((c+1)/2.0))\` selecciona exactamente esas, y \`AVG\` termina el trabajo para
ambos casos a la vez.`,
      },
      { title: "Precio mediano — ambos métodos coinciden" },
      {
        markdown: `## Rango relativo: percent_rank, cume_dist, moda

- \`percent_rank()\` — dónde se sitúa una fila en la distribución, de 0 a 1 (su rango menos 1, sobre n−1).
- \`cume_dist()\` — distribución acumulada: fracción de filas en o por debajo de esta.
- \`mode() WITHIN GROUP (ORDER BY x)\` — el valor más frecuente.`,
      },
      { title: "¿Dónde se sitúa cada precio?" },
      {
        markdown: `## Histogramas con width_bucket

\`width_bucket(value, low, high, n)\` asigna un valor a uno de \`n\` buckets de igual ancho — la forma
estándar de construir un histograma en SQL.`,
      },
      { title: "Histograma de precios (3 buckets, 0–1500)" },
      {
        title: "Total mediano de órdenes — sin PERCENTILE_CONT",
        prompt:
          "Devuelve un solo valor `median` — la mediana de todos los `orders.total` — **sin** usar `PERCENTILE_CONT`/`PERCENTILE_DISC`. Usa el truco de ROW_NUMBER + COUNT.\n\n*(Hay 6 órdenes, así que la respuesta es el promedio del 3º y 4º total.)*",
        hints: [
          "Consulta interna: `ROW_NUMBER() OVER (ORDER BY total)` y `COUNT(*) OVER ()`.",
          "Conserva las filas donde `rn IN (FLOOR((c+1)/2.0), CEIL((c+1)/2.0))`, luego `AVG`.",
        ],
      },
    ],
  },
};
