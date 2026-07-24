import type { LessonI18n } from "../../overlay";

// Spanish overlay for the "dbt" module (Data Engineering track). Index-matched; text-only.
export const dbtEs: Record<string, LessonI18n> = {
  "dbt-workflow": {
    title: "Qué es dbt y el Flujo de Analytics Engineering",
    summary: "Transformaciones SQL como software versionado, testeado y documentado.",
    blocks: [
      {
        markdown: `# dbt: la T en ELT

dbt (data build tool) toma la capa de transformación — el SQL entre los datos crudos y los marts
servidos — y la trata como **software**:

- **Modelos** — cada transformación es un \`SELECT\` en un archivo \`.sql\`.
- **DAG** — los modelos se referencian entre sí con \`ref()\`; dbt deriva el orden de construcción (y el
  linaje completo) automáticamente.
- **Tests** — aserciones sobre los datos (\`unique\`, \`not_null\`, SQL propio) corren en cada build.
- **Docs** — descripciones en YAML compilan a un sitio navegable y consciente del linaje.
- **Control de versiones** — todo son archivos de texto: ramas, PRs, revisión de código, CI.

\`\`\`
models/
  staging/     stg_orders.sql, stg_customers.sql     (1:1 con fuentes, limpieza)
  intermediate/ int_orders_enriched.sql              (joins/lógica reutilizable)
  marts/       fct_orders.sql, dim_customers.sql     (hechos y dims — ¡tu estrella!)
\`\`\`

El flujo: rama → edita modelos → \`dbt run\` (build) + \`dbt test\` → PR → CI lo corre todo → merge → el
job de producción corre en horario.

dbt no procesa datos él mismo — **compila SQL y lo envía a tu warehouse** (Postgres, Snowflake,
BigQuery, Databricks). Por eso todo lo que hace se puede practicar aquí mismo.`,
      },
      {
        question: "¿Con qué ejecuta dbt realmente las transformaciones?",
        options: [
          "Tu warehouse — dbt compila los modelos a SQL y los corre ahí; no tiene motor de procesamiento propio",
          "Un clúster Spark embebido",
          "Un motor de dataframes de Python en el servidor de dbt",
          "La capa de consultas de la herramienta de BI",
        ],
        explanation:
          "dbt es un compilador + orquestador de SQL, no un motor. Ese es su truco de portabilidad: el mismo proyecto corre en cualquier warehouse soportado, y todo tu conocimiento de precios/tuning de cómputo sigue aplicando.",
      },
      {
        question: "Antes de dbt, la capa de transformación eran a menudo scripts SQL agendados. ¿Qué es lo único más grande que dbt añade sobre eso?",
        options: [
          "El bucle de ingeniería: dependencias derivadas del código, tests en cada cambio, revisión vía PRs — el SQL deja de ser scripts snowflake sin testear",
          "Ejecución de SQL más rápida",
          "Un diseñador visual de transformaciones drag-and-drop",
          "Ingesta de datos incorporada desde APIs",
        ],
        explanation:
          "El SQL es el mismo SQL. Lo que cambia es todo lo que lo rodea: linaje en vez de conocimiento tribal, tests en vez de esperanza, revisión de código en vez de ediciones en prod. 'Analytics engineering' es esa disciplina, nombrada.",
      },
    ],
  },
  "models-ref": {
    title: "Modelos y ref(): Construyendo el DAG",
    summary: "Encadena modelos con ref() — y construye el DAG de vistas equivalente en vivo.",
    blocks: [
      {
        markdown: `# Modelos y ref()

Un modelo es un SELECT. Otros modelos lo referencian con \`ref()\`:

\`\`\`sql
-- models/staging/stg_orders.sql
SELECT order_id, customer_id, qty * unit_price AS amount, order_date
FROM {{ source('shop', 'raw_orders') }}

-- models/marts/fct_daily_revenue.sql
SELECT order_date, SUM(amount) AS revenue
FROM {{ ref('stg_orders') }}          -- ← la dependencia
GROUP BY order_date
\`\`\`

\`ref()\` hace dos trabajos a la vez:

1. compila al nombre real de la tabla/vista (por entorno — dev construye en tu esquema dev, prod en
   prod), y
2. **declara la arista en el DAG** — dbt ahora sabe que \`stg_orders\` debe construirse primero (la
   misma inferencia-desde-referencias que DLT).

Por dentro, \`dbt run\` ejecuta \`CREATE VIEW/TABLE ... AS <tu select>\` en orden de dependencias. Así
que hagamos literalmente eso, a mano, en Postgres.`,
      },
      {
        title: "Un DAG de dbt se construye en oleadas de dependencia (orden BFS)",
        caption:
          "raw → staging → dims/facts → marts: cada oleada puede construirse en paralelo una vez que existan sus padres — exactamente cómo `dbt run` agenda los modelos.",
      },
      { title: "dbt run, a mano: el DAG de vistas" },
      {
        title: "Escribe el modelo aguas abajo",
        prompt:
          "Estás añadiendo `top_customers.sql` aguas abajo de staging. Como la calificación reinicia la BD, inline la lógica de staging como un CTE (¡exactamente lo que dbt compila los modelos efímeros!): con `stg AS (SELECT customer_id, qty * unit_price AS amount FROM staging.raw_orders)`, devuelve `customer_id` y `lifetime_value` (`SUM(amount)`) de los clientes con valor de por vida **superior a 500**, ordenado por `lifetime_value` descendente.",
        hints: [
          "GROUP BY customer_id, filtra los grupos con HAVING SUM(amount) > 500.",
          "HAVING (no WHERE) porque el filtro es sobre el agregado.",
        ],
      },
      {
        question: "¿Por qué los modelos deben usar `ref('stg_orders')` en vez de hardcodear el nombre de tabla calificado con esquema?",
        options: [
          "ref() se resuelve por entorno (esquemas dev/prod) Y registra la arista del DAG — hardcodear rompe tanto el aislamiento de entornos como el linaje/orden de build",
          "Los nombres hardcodeados son más lentos de consultar",
          "ref() cachea la tabla referenciada",
          "SQL no permite nombres calificados con esquema en vistas",
        ],
        explanation:
          "Un `analytics.stg_orders` hardcodeado haría que tu corrida dev leyera/escribiera prod, y dbt no vería dependencia — posiblemente construyendo tu modelo antes que su padre. ref()/source() son las dos puertas por las que todo debe pasar.",
      },
    ],
  },
  materializations: {
    title: "Materializaciones",
    summary: "view vs table vs incremental — el mismo SELECT, tres estrategias de build.",
    blocks: [
      {
        markdown: `# Materializaciones

Una línea de config decide CÓMO el SELECT de un modelo se vuelve un objeto de base de datos (el patrón
Strategy, como detectaste en Patrones de Diseño):

| Materialización | Compila a | Úsala para |
|---|---|---|
| **view** (default) | \`CREATE VIEW ... AS\` | staging barato; siempre fresco; cómputo en tiempo de consulta |
| **table** | \`CREATE TABLE ... AS\` (rebuild completo) | lógica pesada consultada a menudo; datos pequeños/medianos |
| **incremental** | primera corrida: tabla; después: **insert/merge solo filas nuevas** | tablas de hechos grandes donde los rebuilds completos son muy lentos |
| **ephemeral** | inline como un CTE en los modelos aguas abajo | lógica helper diminuta; sin objeto de BD |

## Incremental — la de los filos peligrosos

\`\`\`sql
{{ config(materialized='incremental', unique_key='order_id') }}

SELECT order_id, customer_id, qty * unit_price AS amount, order_date
FROM {{ source('shop', 'raw_orders') }}
{% if is_incremental() %}
WHERE order_date > (SELECT MAX(order_date) FROM {{ this }})   -- ¡high-water mark!
{% endif %}
\`\`\`

Ese \`WHERE\` es tu high-water mark del módulo de warehouse; con \`unique_key\` puesto, dbt hace MERGE (tu
lección de Delta) en vez de insertar a ciegas. \`dbt run --full-refresh\` reconstruye desde cero cuando
la lógica cambia.`,
      },
      { title: "A qué compila incremental (corre ambas etapas)" },
      {
        title: "Escribe el filtro incremental",
        prompt:
          "Un modelo incremental ya cargó todo hasta `2026-05-02` (ese es `MAX(order_date)` en la tabla existente). Escribe el SELECT para la siguiente corrida: todas las columnas `order_id`, `customer_id`, `order_date` de `staging.raw_orders` **estrictamente después** de esa fecha, ordenado por `order_date`. (Usa la fecha literal — en dbt sería la subconsulta `{{ this }}`.)",
        hints: [
          "Estrictamente mayor que la marca: `order_date > '2026-05-02'`.",
          "Deben volver dos filas (órdenes 118 y 119).",
        ],
      },
      {
        question:
          "Un modelo incremental filtra por `updated_at`, pero las filas que llegan tarde llevan valores VIEJOS de `updated_at`. ¿Qué pasa, y cuál es la mitigación estándar?",
        options: [
          "Las filas tardías caen por debajo del high-water mark y se saltan en silencio; los equipos usan una ventana de lookback (p. ej. marca menos 3 días) más un MERGE con unique_key para reprocesar el solapamiento de forma segura",
          "dbt detecta datos tardíos automáticamente y hace backfill",
          "La corrida falla con un error de freshness",
          "Nada — los modelos incrementales no pueden perderse datos",
        ],
        explanation:
          "El punto ciego del watermark del módulo de warehouse, con ropa de dbt. Solapamiento + MERGE idempotente es el arreglo estándar: reprocesar unos días es barato; el unique_key detiene los duplicados.",
      },
    ],
  },
  "dbt-tests": {
    title: "Tests y Documentación",
    summary: "unique, not_null, relationships — los tests son solo consultas de filas malas.",
    blocks: [
      {
        markdown: `# Tests de dbt

Declarados en YAML junto al modelo:

\`\`\`yaml
models:
  - name: dim_customer
    columns:
      - name: customer_key
        tests: [unique, not_null]
      - name: segment
        tests:
          - accepted_values: {values: [enterprise, scaleup, startup, smb]}
  - name: fct_sales
    columns:
      - name: customer_key
        tests:
          - relationships: {to: ref('dim_customer'), field: customer_key}
\`\`\`

**El mecanismo es hermosamente simple:** cada test compila a una consulta que devuelve las filas que
VIOLAN la regla. Cero filas = pasa; cualquier fila = falla (y la consulta te muestra exactamente qué
filas la rompieron).

| Test | La consulta compilada devuelve |
|---|---|
| \`not_null\` | filas donde la columna ES NULL |
| \`unique\` | valores que aparecen más de una vez |
| \`accepted_values\` | filas con un valor fuera de la lista |
| \`relationships\` | filas hijas cuya clave no tiene padre (huérfanos) |

Los tests propios son la misma idea: cualquier SELECT que escribas — falla si devuelve filas. Así que
escribir tests de dbt ES escribir SQL, que puedes hacer ahora mismo.`,
      },
      { title: "Cómo compila `unique`" },
      {
        title: "Escribe el test `relationships`",
        prompt:
          "Escribe la forma compilada de un test `relationships`: devuelve el `customer_id` y `name` de cada fila en `staging.customer_updates` cuyo `customer_id` **no tenga fila actual coincidente** en `dim_customer` (clave natural `customer_id`, `is_current = true`). Ordena por `customer_id`. *(Hay exactamente un huérfano en el seed — encuéntralo.)*",
        hints: [
          "Anti-join con NOT EXISTS, coincidiendo en customer_id AND is_current.",
          "El huérfano es Nakatomi (customer_id 5) — un cliente nuevo que la dimensión aún no ha visto. En un proyecto real este test fallando dice: corre la carga snapshot/SCD primero.",
        ],
      },
      {
        title: "Escribe un test accepted_values",
        prompt:
          "Compila un test `accepted_values` para `dim_customer.segment` con valores permitidos `('enterprise', 'startup', 'smb')` — devuelve el `customer_key`, `name`, y `segment` de cada fila cuyo segment NO esté en esa lista, ordenado por `customer_key`. *(Este debería atrapar una fila — un valor válido en la realidad pero ausente de la lista del test. Eso es una lección en sí: los tests codifican suposiciones.)*",
        hints: [
          "`segment NOT IN (...)` es el test entero.",
          "Devuelve la fila 'scaleup' de Globex — la lista aceptada estaba obsoleta. Los tests que fallan a veces significan que el TEST necesita actualizarse, no los datos.",
        ],
      },
      {
        question: "Un test `unique` sobre `fct_orders.order_id` empezó a fallar tras reemplazar el MERGE incremental por un INSERT simple. ¿De qué te protege el test?",
        options: [
          "Fan-out silencioso: las claves duplicadas doblan el ingreso en cada join/agregado aguas abajo — el test atrapa la carga mala antes que los consumidores",
          "Consultas lentas sobre la tabla de órdenes",
          "Cambios de esquema en la fuente",
          "Nada — la unicidad es cosmética",
        ],
        explanation:
          "La unicidad de clave es la suposición en la que se apoya en silencio cada join de la capa de marts. Esta regresión exacta (escritura idempotente → append ciego) está entre las capturas de test de dbt más comunes del mundo real — normalmente a las 6am, antes de que se refresque el dashboard del CFO.",
      },
    ],
  },
  "sources-snapshots": {
    title: "Sources, Seeds y Snapshots",
    summary: "Declarar entradas crudas, datos de lookup diminutos — y snapshots = SCD2 automatizado.",
    blocks: [
      {
        markdown: `# Los otros objetos de dbt

## Sources

Las tablas crudas (cargadas por ingesta, NO construidas por dbt) se declaran para que estén en el DAG y
sean testeables:

\`\`\`yaml
sources:
  - name: shop
    schema: staging
    tables:
      - name: raw_orders
        freshness:
          error_after: {count: 24, period: hour}   # fuente obsoleta = corrida fallida
\`\`\`

Los modelos las leen con \`{{ source('shop', 'raw_orders') }}\` — completando el linaje de crudo a mart.

## Seeds

CSVs pequeños en el repo (\`dbt seed\` los carga como tablas): códigos de país, mapeos de categoría —
datos suficientemente pequeños para versionar.

## Snapshots — SCD2 sin escribir el SCD2

\`\`\`sql
{% snapshot customers_snapshot %}
{{ config(unique_key='customer_id', strategy='check',
          check_cols=['name', 'segment', 'city']) }}
SELECT * FROM {{ source('crm', 'customers') }}
{% endsnapshot %}
\`\`\`

Cada corrida de \`dbt snapshot\` compara la fuente con la tabla de snapshot y realiza **exactamente el
cerrar-e-insertar que construiste a mano** en el módulo de Modelado de Datos — añadiendo columnas
\`dbt_valid_from\` / \`dbt_valid_to\`. Tus habilidades manuales de SCD2 son lo que te deja *depurar* los
snapshots cuando se portan mal.`,
      },
      { title: "Qué hace una corrida de snapshot (el paso de diff)" },
      {
        question: "¿Por qué los snapshots existen como un comando separado (`dbt snapshot`) en vez de ser modelos ordinarios?",
        options: [
          "Los modelos son reconstruibles desde las fuentes en cualquier momento; los snapshots capturan estado que se PIERDE una vez que la fuente sobrescribe — deben correr en horario y no son re-derivables idempotentemente",
          "Los snapshots necesitan un motor más rápido que los modelos",
          "Los modelos no pueden contener sentencias SELECT *",
          "Es solo una convención de nombres",
        ],
        explanation:
          "Un snapshot es un *dispositivo de grabación* histórico: pierde una semana de corridas y las versiones intermedias de esa semana son irrecuperables. Los modelos son funciones puras de las fuentes; los snapshots son el único objeto con estado y sensible al tiempo en un proyecto dbt.",
      },
      {
        question: "Los chequeos de freshness de fuente (`error_after: 24 hours`) protegen contra qué modo de fallo?",
        options: [
          "El silencioso: la ingesta se rompió hace días, cada corrida de dbt 'tiene éxito' sobre datos obsoletos, y los dashboards muestran en silencio números viejos",
          "El warehouse quedándose sin almacenamiento",
          "Los modelos construyendo en el orden equivocado",
          "Consultas lentas en horario laboral",
        ],
        explanation:
          "Un pipeline verde sobre entradas muertas es peor que un pipeline rojo — nadie investiga lo verde. La freshness convierte 'el cargador se detuvo en silencio' en un fallo ruidoso en la capa de transformación. (El módulo de Calidad de Datos generaliza esto a observabilidad.)",
      },
    ],
  },
  "jinja-macros": {
    title: "Jinja, Macros y Estructura de Proyecto",
    summary: "Templating que escribe tu SQL — simúlalo, luego las convenciones de layout.",
    blocks: [
      {
        markdown: `# Jinja: SQL que escribe SQL

Todo en \`{{ }}\` / \`{% %}\` es **templating Jinja**, renderizado a SQL plano en tiempo de compilación.
\`ref()\`, \`source()\`, \`config()\` son macros; puedes escribir las tuyas:

\`\`\`sql
{% macro money(col) %} round({{ col }}::numeric, 2) {% endmacro %}

-- uso en un modelo:
SELECT {{ money('qty * unit_price') }} AS amount FROM ...
\`\`\`

Los bucles matan el copy-paste (p. ej. una rama CASE por método de pago):

\`\`\`sql
SELECT order_id,
{% for method in ['card', 'paypal', 'wire'] %}
  SUM(CASE WHEN method = '{{ method }}' THEN amount END) AS {{ method }}_amount
  {{- "," if not loop.last }}
{% endfor %}
FROM payments GROUP BY order_id
\`\`\`

El modelo mental: **una plantilla + valores → texto SQL generado.** Los \`string.Template\`/f-strings de
Python funcionan igual — así que puedes sentir el mecanismo aquí mismo.`,
      },
      { title: "Simula la compilación de Jinja en Python" },
      {
        markdown: `# Convenciones de estructura de proyecto

El layout estándar de la comunidad (que vale la pena seguir — cada dev de dbt puede navegarlo):

\`\`\`
models/
  staging/        una carpeta por sistema fuente
    shop/
      _shop__sources.yml        declaraciones de source + freshness
      stg_shop__orders.sql      1:1 con tablas crudas: renombra, castea, limpieza ligera
  intermediate/   int_*.sql     lógica de negocio reutilizable, no expuesta a BI
  marts/          fct_*.sql, dim_*.sql   el esquema en estrella que consultan los consumidores
tests/            tests SQL propios
macros/           tus macros de Jinja
snapshots/        grabadores de SCD2
seeds/            CSVs pequeños
\`\`\`

Reglas de nombres con peso real: los modelos \`stg_\` solo limpian (sin joins entre fuentes); los nombres
\`fct_\`/\`dim_\` prometen semántica de modelado dimensional (ahora sabes exactamente qué significan);
los marts son la ÚNICA capa que BI lee — el mismo contrato de capas que staging → core → marts y bronze
→ silver → gold.`,
      },
      {
        question: "Un compañero escribe un modelo mart que lee `{{ source('shop', 'raw_orders') }}` directamente. ¿Por qué se marcará en la revisión?",
        options: [
          "Se salta staging: las rarezas crudas (tipos, nombres, duplicados) se filtran al mart, la lógica de limpieza se duplica entre marts, y el linaje pierde su estructura de capas",
          "source() no se puede usar más de una vez por proyecto",
          "Los marts no pueden contener sentencias SELECT",
          "Crearía una dependencia circular",
        ],
        explanation:
          "La capa de staging es el único lugar donde los datos crudos se civilizan — cada consumidor aguas abajo hereda la misma limpieza. Saltársela reintroduce exactamente la desviación de copy-paste que dbt existe para matar. La disciplina de capas ES la arquitectura.",
      },
      {
        question: "¿Cuándo debería la lógica pasar de un modelo a un macro?",
        options: [
          "Cuando el mismo patrón SQL (un redondeo de moneda, un date spine estándar, un hash de clave subrogada) se repite entre modelos — los macros son la extracción de funciones de dbt",
          "Cuando un modelo excede las 50 líneas",
          "Cuando el SQL necesita correr más rápido",
          "Nunca — los macros son solo para los internos de dbt",
        ],
        explanation:
          "El mismo juicio que extraer una función de Python (¡SRP!): intención repetida → un lugar nombrado y testeado. El primer macro clásico es `cents_to_dollars()` o un wrapper de `generate_surrogate_key()` — pequeño, aburrido, en todas partes.",
      },
    ],
  },
};
