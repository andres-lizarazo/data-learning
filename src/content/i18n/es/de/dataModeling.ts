import type { LessonI18n } from "../../overlay";

// Spanish overlay for the "Data Modeling" module (Data Engineering track). Index-matched; text-only.
export const dataModelingEs: Record<string, LessonI18n> = {
  normalization: {
    title: "Repaso de Normalización (1FN–3FN)",
    summary: "Por qué los esquemas OLTP dividen los datos en muchas tablas — y qué le cuesta a analytics.",
    blocks: [
      {
        markdown: `# Normalización

Los esquemas OLTP están **normalizados**: cada hecho vive en exactamente un lugar, así las
actualizaciones no pueden contradecirse a sí mismas.

- **1FN** — valores atómicos, sin grupos repetidos (nada de \`"phone1, phone2"\` en una celda).
- **2FN** — ninguna columna depende de solo *parte* de una clave compuesta.
- **3FN** — ninguna columna depende de una columna *no-clave* (p. ej. guardar tanto
  \`category_id\` como \`category_name\` en products: el nombre depende del id).

La base de datos de la tienda que has consultado está en 3FN: \`orders\` no repite el email del
usuario, \`order_items\` no repite nombres de producto. Actualiza el nombre del producto una vez, y
cada orden pasada "lo ve".

**El costo:** las preguntas analíticas necesitan cadenas de JOIN. Sintamos ese costo.`,
      },
      { title: "La cadena de JOINs que fuerza un esquema normalizado" },
      { title: "Cómo se ven los datos desnormalizados — y su anomalía de actualización" },
      {
        markdown: `Ese email inconsistente es una **anomalía de actualización** — la razón por la que los sistemas OLTP
normalizan. Los warehouses de analytics revierten esto a propósito: *desnormalizan intencionalmente*
en esquemas en estrella, porque sus datos se cargan por pipelines controlados (no los actualiza el
código de la app), y la velocidad de lectura + simplicidad ganan. Ese trade es la siguiente lección.`,
      },
      {
        question:
          "Una tabla `products` guarda `category_id` Y `category_name`. ¿Qué forma normal viola eso, y qué sale mal?",
        options: [
          "3FN — category_name depende de category_id (una columna no-clave), así que renombrar una categoría significa actualizar muchas filas de producto y pueden desviarse",
          "1FN — los nombres no son valores atómicos",
          "2FN — tiene una clave primaria compuesta",
          "Ninguna — guardar ambos es práctica estándar en OLTP",
        ],
        explanation:
          "Una dependencia transitiva (no-clave → no-clave) es exactamente lo que 3FN prohíbe. Un renombre de categoría ahora toca N filas de producto, y una fila omitida deja datos contradictorios.",
      },
    ],
  },
  "er-grain": {
    title: "Entidades, Relaciones y Granularidad",
    summary: "La pregunta de modelado más importante: ¿qué significa una fila?",
    blocks: [
      {
        markdown: `# Granularidad (grain): ¿qué significa una fila?

Antes de diseñar cualquier tabla, responde una pregunta con precisión:

> **"Una fila en esta tabla representa exactamente un ___."**

Eso es la **granularidad** de la tabla. Cada error de diseño se rastrea a una granularidad difusa:
ingresos contados doble, joins imposibles, métricas que no coinciden.

## Pensamiento entidad-relación

Las entidades (cliente, producto, orden) se relacionan con **cardinalidad**:

- uno-a-muchos — un cliente *tiene muchas* órdenes (FK en el lado "muchos")
- muchos-a-muchos — las órdenes *contienen muchos* productos, los productos *aparecen en muchas*
  órdenes → resuelto por una tabla puente (\`order_items\`) cuya granularidad es
  **una fila por línea de orden**

## Declarar la granularidad de los hechos

En el modelado dimensional, la granularidad se declara PRIMERO, atómicamente ("una fila por **línea**
de orden", no "por orden"), y todo lo demás se sigue:

- las medidas deben ser verdaderas *a esa granularidad* (\`qty\`, \`amount\` de línea — ¡no el total de la orden!)
- las dimensiones son lo que describa esa granularidad (quién, qué, cuándo)

Poner un valor a nivel de orden (como el costo de envío) en una fila de granularidad de *línea* de
orden lo cuenta doble en el momento en que alguien sume la columna.`,
      },
      { title: "Lee la granularidad de una tabla desde sus claves" },
      {
        question:
          "Una tabla de hechos tiene granularidad 'una fila por línea de orden'. Alguien añade una columna `shipping_cost` con la tarifa de envío de la orden entera. ¿Qué se rompe?",
        options: [
          "SUM(shipping_cost) cuenta doble el envío en cada orden de varias líneas",
          "Nada — el envío es solo otra medida",
          "Los JOINs a la dimensión de fecha dejan de funcionar",
          "La tabla ya no está en 1FN",
        ],
        explanation:
          "La medida no es verdadera a la granularidad declarada. Los valores a nivel de orden pertenecen a una tabla de granularidad de orden (o deben asignarse entre líneas). '¿Es este valor verdadero para UNA fila?' es la prueba que cada columna debe pasar.",
      },
      {
        question: "¿Qué granularidad es el default más seguro para una tabla de hechos de ventas?",
        options: [
          "La más atómica disponible — una fila por línea de orden — porque siempre puedes agregar hacia arriba, nunca desagregar hacia abajo",
          "Una fila por día, para mantener la tabla pequeña",
          "Una fila por cliente, ya que los clientes son el foco del negocio",
          "Una fila por reporte que el negocio pidió",
        ],
        explanation:
          "La regla de Kimball: construye los hechos a la granularidad más baja (más atómica). Los resúmenes diarios/por cliente se pueden derivar; lo contrario es imposible. Las granularidades pre-agregadas te bloquean de las preguntas de mañana.",
      },
    ],
  },
  "star-schemas": {
    title: "Esquemas en Estrella y Modelado Dimensional",
    summary: "La gran idea de Kimball: hechos en el medio, contexto a su alrededor.",
    blocks: [
      {
        markdown: `# El esquema en estrella

El modelo dimensional de Kimball organiza los datos de analytics en dos tipos de tablas:

- **Tabla de hechos** (centro): las *mediciones* — numéricas, aditivas, a una granularidad declarada,
  con foreign keys hacia…
- **Tablas de dimensión** (puntas de la estrella): el *contexto* — quién, qué, cuándo, dónde. Anchas,
  descriptivas, desnormalizadas a propósito.

\`\`\`
              dim_date
                 │
dim_customer ─ fact_sales ─ dim_product
\`\`\`

Tu seed warehouse ES esta estrella. Compara las formas de consulta:

- Esquema tienda 3FN: ingreso por categoría = **cadena de join de 4 tablas**
- Esquema en estrella: cualquier medida por cualquier atributo = **hecho + las dimensiones que nombres**

Un esquema **copo de nieve (snowflake)** re-normaliza las dimensiones (dim_product → dim_category →
dim_department). Ahorra espacio trivial y cuesta joins extra — el consejo de Kimball, y el default de
la industria, es: **mantén las dimensiones planas**.`,
      },
      { title: "El join de estrella: medida por cualquier contexto" },
      { title: "Segmenta por una dimensión distinta — la misma forma" },
      {
        title: "Tu primera consulta de estrella",
        prompt:
          "Devuelve el ingreso de cada segmento de cliente: `segment` y `revenue` (`SUM(amount)`), uniendo `fact_sales` a `dim_customer`, ordenado por `revenue` descendente.",
        hints: [
          "JOIN por la clave subrogada: `USING (customer_key)`.",
          "GROUP BY segment, SUM del amount, ORDER BY la suma descendente.",
        ],
      },
      {
        question: "¿Por qué las tablas de dimensión se mantienen desnormalizadas (planas) en un esquema en estrella?",
        options: [
          "Son pequeñas, cargadas por pipelines controlados, y las dims planas significan menos joins + consultas más simples para cada consumidor",
          "Normalizar dimensiones es imposible en SQL",
          "Las tablas desnormalizadas comprimen mejor que las normalizadas",
          "Las anomalías de actualización no importan porque las dimensiones nunca cambian",
        ],
        explanation:
          "El riesgo de anomalía de actualización que justifica 3FN en OLTP apenas aplica: solo el pipeline de carga escribe las dimensiones. Mientras tanto cada consulta y cada analista se benefician de una tabla plana y legible. (Los *cambios* de dimensión se manejan deliberadamente — eso es SCD, dos lecciones adelante.)",
      },
    ],
  },
  "fact-tables": {
    title: "Tablas de Hechos",
    summary: "Hechos de transacción, snapshot y acumulativos — y qué medidas puedes SUM.",
    blocks: [
      {
        markdown: `# Tipos de tabla de hechos

| Tipo | Granularidad | Ejemplo | Cargada |
|---|---|---|---|
| **Transacción** | una fila por evento | \`fact_sales\` (una por línea de orden) | append |
| **Snapshot periódico** | una fila por entidad por periodo | saldo de cuenta por día | insert por periodo |
| **Snapshot acumulativo** | una fila por proceso, actualizada al avanzar | orden → enviada → entregada con una fecha por hito | actualizada en el sitio |

## Aditividad — ¿qué puedes SUMAR?

- **Aditiva** — sumable en *todas* las dimensiones: \`qty\`, \`amount\`. La mejor clase.
- **Semi-aditiva** — sumable en algunas dimensiones pero **no en el tiempo**: los *saldos* de cuenta
  (sumar el saldo de ayer + hoy no tiene sentido; toma el último/promedio en su lugar).
- **No aditiva** — ratios y porcentajes: nunca guardes un ratio pre-calculado que promediarías mal;
  guarda numerador y denominador y divide en tiempo de consulta.`,
      },
      { title: "Deriva un snapshot periódico del hecho de transacción" },
      {
        title: "Snapshot de ventas diario",
        prompt:
          "Construye el snapshot diario: para **cada fecha que tuvo ventas**, devuelve `full_date` y `revenue` (`SUM(amount)`), ordenado por `full_date`.",
        hints: [
          "Agrupa por `d.full_date` y suma los amounts.",
          "Solo aparecen fechas con ventas porque el JOIN parte de fact_sales.",
        ],
      },
      {
        question:
          "Una tabla de hechos guarda el `balance` de fin de día de cada cuenta. ¿Por qué `SUM(balance)` a lo largo de un mes está mal, y cómo se llama esta medida?",
        options: [
          "Los saldos son niveles, no flujos — sumar 30 niveles diarios cuenta el mismo dinero 30 veces. Es semi-aditiva: agrega entre cuentas, pero toma el último/promedio en el tiempo",
          "Es no-aditiva: los saldos nunca se pueden sumar, ni siquiera entre cuentas",
          "Nada está mal; el saldo es totalmente aditivo",
          "Está mal solo si a algunos días les faltan filas",
        ],
        explanation:
          "Las medidas semi-aditivas (saldos, niveles de inventario, headcounts) suman bien en la mayoría de las dimensiones pero NO en el tiempo. Este es uno de los bugs de dashboard más comunes del mundo real.",
      },
    ],
  },
  dimensions: {
    title: "Dimensiones y Claves Subrogadas",
    summary: "Por qué los warehouses acuñan sus propias claves, más las dimensiones degeneradas y junk.",
    blocks: [
      {
        markdown: `# Claves subrogadas (surrogate keys)

Mira \`dim_customer\`: tiene **dos columnas de clave**.

- \`customer_id\` — la **clave natural**: el id que usa el *sistema fuente*.
- \`customer_key\` — la **clave subrogada**: un entero sin significado que el *warehouse* acuña, uno
  por **versión** del cliente.

Los hechos referencian la subrogada. Tres razones por las que los warehouses insisten en esto:

1. **Historial.** Una clave natural puede tener muchas versiones en el tiempo (SCD2 — siguiente
   lección). Cada versión necesita su propia clave para que los hechos apunten a ella.
2. **Independencia.** Los sistemas fuente se migran, fusionan y reciclan ids. Las subrogadas aíslan al
   warehouse de todo eso.
3. **Múltiples fuentes.** Dos sistemas ambos tienen un "cliente 42" — las subrogadas los des-conflictúan.

## Dos "dimensiones" especiales

- **Dimensión degenerada**: \`order_id\` en \`fact_sales\` — un valor tipo-dimensión sin atributos
  propios, así que vive *en la tabla de hechos* sin tabla de dimensión.
- **Dimensión junk**: un puñado de flags de baja cardinalidad (is_gift, channel, payment_type)
  agrupadas en una dim pequeña en vez de 4 diminutas.`,
      },
      { title: "Una clave natural, dos versiones, dos claves subrogadas" },
      { title: "Los hechos apuntan a la versión que era verdad en su momento" },
      {
        title: "Cuenta versiones por cliente",
        prompt:
          "Para cada clave natural en `dim_customer`, devuelve `customer_id`, `name` (de cualquier versión — usa `MAX(name)`), y `versions` (conteo de filas), ordenado por `customer_id`.",
        hints: [
          "Agrupa por la clave NATURAL (customer_id), no por la subrogada.",
          "COUNT(*) por grupo es el número de versiones.",
        ],
      },
      {
        question: "¿Por qué `order_id` en `fact_sales` se llama dimensión *degenerada*?",
        options: [
          "Identifica/agrupa hechos como lo haría una dimensión, pero no tiene atributos descriptivos, así que no existe tabla de dimensión para él",
          "Porque debería borrarse del modelo",
          "Porque es una foreign key a dim_date",
          "Porque contiene NULL en la mayoría de las filas",
        ],
        explanation:
          "Agrupar por order_id (p. ej. líneas por orden) es comportamiento dimensional, pero no hay nada que guardar *sobre* un id de orden en sí — así que se queda en la tabla de hechos. Los números de ticket, factura y códigos de confirmación son degeneradas clásicas.",
      },
    ],
  },
  "date-dimension": {
    title: "La Dimensión de Fecha",
    summary: "La única dimensión que tiene cada warehouse — genérala, no la escribas.",
    blocks: [
      {
        markdown: `# La dimensión de fecha

¿Por qué una tabla entera para fechas, si SQL tiene funciones de fecha?

- **Consistencia**: "Q3", "semana 42", "is_holiday" calculados UNA vez, idénticamente para cada
  consulta y herramienta de BI — no re-derivados (distinto) en cada una.
- **Calendario de negocio**: años fiscales, días de trading, periodos de promo no vienen de
  \`EXTRACT()\` — viven en columnas que controlas.
- **Los joins le ganan a las funciones**: agrupar por una columna \`month_name\` pre-calculada es más
  simple y amigable con índices/pruning que envolver cada consulta en funciones.

Convenciones usadas en \`dim_date\` (y en la mayoría de warehouses reales):

- Clave inteligente \`yyyymmdd\` como entero (legible, ordena bien, amigable con particiones).
- Una fila por día de calendario, **generada** con \`generate_series\` — nunca escrita a mano.`,
      },
      { title: "Cómo se generó dim_date" },
      { title: "Lo que te da la dimensión de fecha" },
      {
        title: "Extiende el calendario",
        prompt:
          "`dim_date` termina en 2026-06-30. Genera los siguientes 10 días (2026-07-01 al 2026-07-10) con la misma forma: `date_key` (entero yyyymmdd), `full_date`, e `is_weekend`, ordenado por `date_key`.",
        hints: [
          "`to_char(d, 'YYYYMMDD')::int` construye la clave inteligente.",
          "Los días ISO 6 y 7 son sábado y domingo: `EXTRACT(isodow FROM d) IN (6,7)`.",
        ],
      },
      {
        question: "¿Por qué `dim_date` incluye filas para días sin ninguna venta?",
        options: [
          "Para que existan días 'cero' contra los cuales unir — p. ej. un reporte diario completo necesita cada día de calendario, no solo los días que resultaron tener hechos",
          "generate_series no puede saltar días",
          "Para hacer la tabla más grande para benchmarks realistas",
          "Las tablas de hechos requieren que cada date_key se use",
        ],
        explanation:
          "Las dimensiones describen lo que PUEDE pasar; los hechos registran lo que PASÓ. Un `dim_date LEFT JOIN fact_sales` te da los días con cero ingresos — imposible si el calendario solo contuviera fechas de transacción.",
      },
    ],
  },
  scd: {
    title: "Dimensiones de Cambio Lento (SCD 0–3)",
    summary: "El favorito de los exámenes: conservar el historial cuando cambian los atributos de dimensión.",
    blocks: [
      {
        markdown: `# Dimensiones de Cambio Lento

Un cliente se muda de ciudad. Sobrescríbelo, y cada reporte histórico cambia en silencio. Consérvalos
ambos, y necesitas reglas. Esas reglas son los tipos de SCD:

| Tipo | Estrategia | ¿Historial? | Úsalo cuando |
|---|---|---|---|
| **0** | nunca cambiar (retener el original) | solo el original | fecha de nacimiento, canal de primer contacto |
| **1** | sobrescribir en el sitio | ninguno | arreglos de typos, atributos donde el historial es ruido |
| **2** | **añadir una fila nueva** (cerrar la vieja, insertar la nueva) | completo | el default para cualquier cosa que los reportes segmenten |
| **3** | añadir una columna "valor_previo" | un paso | raro; p. ej. antes/después de un reajuste de territorio |

## Mecánica de SCD Tipo 2 — "cerrar e insertar"

Cuando los atributos cambian para el cliente \`X\` con fecha efectiva \`D\`:

1. **Cierra** la fila actual: \`valid_to = D - 1 día\`, \`is_current = false\`.
2. **Inserta** una fila nueva: nueva clave subrogada, \`valid_from = D\`,
   \`valid_to = '9999-12-31'\`, \`is_current = true\`.

Los hechos nuevos toman la clave subrogada *nueva* al cargar; los hechos viejos siguen apuntando a la
versión vieja. Historial preservado, ningún hecho jamás reescrito.`,
      },
      { title: "Recorre una actualización SCD2 completa" },
      {
        markdown: `Nota lo que **no** pasó: ninguna fila de hecho se tocó. Las ventas viejas de Globex siguen uniéndose a
la versión de la era \`startup\` — los reportes sobre 2025 quedan exactamente como estaban.

**Detectar qué filas en staging necesitan este tratamiento** es la otra mitad del trabajo: una
actualización en staging importa cuando la clave natural *no tiene fila actual* (cliente nuevo → solo
insertar) o sus atributos *difieren* de la fila actual (→ cerrar e insertar). Esa consulta de detección
es tu reto.`,
      },
      {
        title: "¿Qué actualizaciones en staging requieren acción?",
        prompt:
          "Compara `staging.customer_updates` con las filas **actuales** de `dim_customer` (clave natural `customer_id`). Devuelve `customer_id` y `name` de cada fila en staging que sea un **cliente nuevo** (sin fila dim actual) **o** que difiera de la fila actual en `name`, `segment`, o `city`. Ordena por `customer_id`.\n\n*Tip: `IS DISTINCT FROM` compara como `<>` pero trata los NULL con sensatez — y puedes comparar varias columnas a la vez envolviéndolas en paréntesis en ambos lados, p. ej. `(a, b) IS DISTINCT FROM (x, y)`.*",
        hints: [
          "LEFT JOIN solo a filas actuales (`AND c.is_current` en la condición del join).",
          "Cliente nuevo: `c.customer_key IS NULL`. Cambiado: comparación de fila `(u.name, u.segment, u.city) IS DISTINCT FROM (c.name, c.segment, c.city)`.",
        ],
      },
      {
        title: "Tipos de SCD — practícalos hasta el reflejo",
        cards: [
          { front: "SCD Tipo 0", back: "Retener el original — el atributo nunca cambia tras la primera carga (fecha de nacimiento, canal de primer contacto)." },
          { front: "SCD Tipo 1", back: "Sobrescribir en el sitio. Sin historial. Para arreglos de typos y atributos donde el historial es ruido." },
          { front: "SCD Tipo 2", back: "Añadir una FILA nueva por versión: cierra la vieja (valid_to, is_current=false), inserta la nueva con una clave subrogada fresca. Historial completo — el default." },
          { front: "SCD Tipo 3", back: "Añadir una COLUMNA con el valor previo. Solo un paso de historial. Raro — comparaciones antes/después como reajustes de territorio." },
          { front: "Los pasos 'cerrar e insertar' de SCD2", back: "1) UPDATE fila actual: valid_to = fecha_cambio - 1, is_current = false.\n2) INSERT fila nueva: nueva clave subrogada, valid_from = fecha_cambio, valid_to = 9999-12-31, is_current = true." },
          { front: "Por qué los hechos nunca necesitan actualizarse cuando cambia una dimensión (SCD2)", back: "Los hechos guardan la clave subrogada de la versión actual EN EL MOMENTO DE LA CARGA — los hechos viejos siguen apuntando a versiones viejas; los nuevos toman la clave nueva." },
          { front: "Por qué valid_to = '9999-12-31' en vez de NULL en filas actuales", back: "Las consultas point-in-time se vuelven un simple BETWEEN valid_from AND valid_to — sin manejo de NULL." },
        ],
      },
      {
        question:
          "Tras un cambio SCD2, ¿por qué los hechos NUEVOS toman la clave subrogada nueva mientras los VIEJOS conservan la vieja — sin ninguna actualización de hechos?",
        options: [
          "La carga de hechos busca la fila de dimensión ACTUAL al momento del insert; los hechos existentes ya tienen la clave de la versión que era actual cuando se cargaron",
          "Un trigger reescribe los hechos históricos a la clave más nueva",
          "Los hechos se unen por la clave natural, así que las claves no importan",
          "Los hechos viejos se borran y recargan cada noche",
        ],
        explanation:
          "Este es el corazón de SCD2: la clave subrogada capturada al momento de la carga congela el contexto histórico en cada fila de hecho para siempre. Eso es lo que hace funcionar el reporte 'as-was' — siguiente lección.",
      },
    ],
  },
  "star-analytics": {
    title: "Analytics de Estrella: As-Was vs As-Is",
    summary: "Pon la maquinaria de SCD2 a trabajar — la misma pregunta, dos respuestas correctas.",
    blocks: [
      {
        markdown: `# As-was vs as-is

"Ingreso por ciudad" tiene **dos** respuestas legítimas una vez que las dimensiones conservan historial:

- **As-was** (verdad histórica): acredita cada venta a la ciudad en la que estaba el cliente *al
  momento de la venta*. → une los hechos a las dims por la **clave subrogada**. Este es el default;
  SCD2 lo hace automático.
- **As-is** (vista actual): reformula todo bajo la ciudad *actual* de cada cliente. → salta de la
  versión del hecho a la clave natural, luego a la fila \`is_current\`.

Acme se mudó de Bogotá → Medellín el 2025-10-01, así que las dos respuestas genuinamente difieren en
este dataset. Veamos ambas.`,
      },
      { title: "As-was: el join subrogado lo hace automáticamente" },
      { title: "As-is: reformula el historial bajo la versión actual" },
      {
        markdown: `Compara: as-was divide el ingreso de Acme entre Bogotá y Medellín; as-is lo mueve todo a Medellín.
**Ninguna está mal** — "qué ciudad lo ganó" vs "cómo se vería el mapa hoy" son preguntas distintas.
Los analistas se equivocan cuando no saben cuál responde un dashboard.

Un tercer patrón — **point-in-time**: "¿cómo se veía la dimensión en la fecha D?" — filtra versiones
con \`D BETWEEN valid_from AND valid_to\`. Ese es tu segundo reto.`,
      },
      {
        title: "Ingreso as-was por segmento y año",
        prompt:
          "Devuelve `year`, `segment`, y `revenue` (`SUM(amount)`) usando la vista **as-was** (joins simples por clave subrogada), ordenado por `year`, luego `segment`.",
        hints: [
          "Join de estrella de tres tablas: fact + dim_date + dim_customer.",
          "As-was no necesita nada especial — la clave subrogada ya codifica el historial.",
        ],
      },
      {
        title: "Lookup point-in-time",
        prompt:
          "¿Cómo se veía la dimensión de clientes el **2025-06-15**? Devuelve `customer_id`, `name`, y `city` de cada versión válida en esa fecha (`valid_from <= fecha <= valid_to`), ordenado por `customer_id`.",
        hints: [
          "`DATE '2025-06-15' BETWEEN valid_from AND valid_to` selecciona la versión viva ese día.",
          "La convención '9999-12-31' en filas actuales es exactamente lo que hace funcionar BETWEEN sin chequeos de NULL.",
        ],
      },
    ],
  },
  "modern-modeling": {
    title: "Debates Modernos: One Big Table y Data Vault",
    summary: "Cuándo gana lo desnormalizado-hasta-el-fondo, y qué resuelve Data Vault.",
    blocks: [
      {
        markdown: `# Más allá de la estrella

El esquema en estrella es el default, pero otros dos patrones salen en entrevistas y arquitecturas
reales:

## One Big Table (OBT)

Pre-une la estrella en una sola tabla ancha (cada fila de hecho lleva sus atributos de dimensión
inline). En motores columnares el costo de almacenamiento es pequeño (los valores repetidos comprimen)
y las consultas se vuelven triviales — sin joins.

- **Gana**: herramientas de BI y consumidores menos hábiles en SQL; caminos de consulta muy calientes y
  bien conocidos.
- **Pierde**: manejo de SCD (reformular historial = reescribir la tabla grande), las actualizaciones de
  atributos tocan miles de millones de filas, una tabla por granularidad prolifera.
- **En la práctica**: las OBTs se construyen *desde* una estrella como capa de servir final — la
  estrella sigue siendo la fuente de verdad. (Los "marts" en el mundo de dbt suelen ser OBTs.)

## Data Vault (nivel de conciencia)

Una metodología de la capa de *ingesta* para empresas grandes, multi-fuente y con mucha auditoría:

- **Hubs** — una tabla por clave de negocio (customer, product…)
- **Links** — una tabla por relación entre hubs
- **Satellites** — los atributos, con timestamp, solo-append por fuente

Todo es solo-append y auditable, y las fuentes nuevas se atornillan sin remodelar. El costo: una
explosión de tablas y joins — así que un esquema en estrella casi siempre se construye ENCIMA del vault
para el analytics real.

**Modelo mental**: Vault (opcional, ingesta) → **Estrella (núcleo de modelado)** → OBT/marts (servir).
La estrella es la parte que debes dominar — hecho.`,
      },
      {
        question:
          "Tu equipo despliega una OBT a la herramienta de BI. El segmento de un cliente se corrige aguas arriba. ¿Cuál es el problema estructural de la OBT aquí?",
        options: [
          "El valor del segmento se repite en cada una de las filas de hecho de ese cliente — el arreglo significa reescribirlas todas (vs una fila dim en una estrella)",
          "Las OBTs no pueden guardar atributos de cliente",
          "Las herramientas de BI no pueden filtrar tablas desnormalizadas",
          "No hay problema — las OBTs se actualizan como cualquier tabla",
        ],
        explanation:
          "La desnormalización cambia costo de actualización por simplicidad de lectura. Por eso la estrella sigue siendo la fuente de verdad y las OBTs se *reconstruyen* desde ella (barato en motores modernos) en vez de actualizarse en el sitio.",
      },
      {
        question: "¿Para qué situación está realmente diseñado Data Vault?",
        options: [
          "Muchos sistemas fuente volátiles alimentando un warehouse donde debe preservarse el historial de auditoría completo de cada carga",
          "Una startup con una base de datos Postgres y un dashboard de BI",
          "Reemplazar esquemas en estrella para reportes de cara al analista",
          "Agregaciones de streaming en tiempo real",
        ],
        explanation:
          "El Vault brilla a escala de integración: los satellites solo-append conservan cada versión de cada fuente, y las fuentes nuevas añaden tablas en vez de remodelar. Para un stack pequeño es puro overhead — e incluso donde se usa, los analistas siguen consultando una estrella construida encima.",
      },
    ],
  },
};
