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
};
