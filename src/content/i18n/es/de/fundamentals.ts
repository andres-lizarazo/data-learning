import type { LessonI18n } from "../../overlay";

// Spanish overlay for the "Data Fundamentals" module (Data Engineering track). Index-matched; text-only.
export const dataFundamentalsEs: Record<string, LessonI18n> = {
  "data-landscape": {
    title: "El Panorama de Datos y los Roles",
    summary: "Quién hace qué en un equipo de datos, y el mapa del stack de datos moderno.",
    blocks: [
      {
        markdown: `# El panorama de datos

Los datos fluyen por una empresa en etapas, y cada etapa tiene un dueño:

\`\`\`
fuentes        ingesta        almacenar        transformar      servir
(apps, APIs,   (jobs batch,   (warehouse /     (modelos SQL,    (dashboards BI,
 bases datos)→  streaming) →   lake /       →   Spark, dbt)  →   features ML,
                               lakehouse)                        reverse ETL)
\`\`\`

## Los roles

| Rol | Es dueño de | Herramientas típicas |
|---|---|---|
| **Data Engineer** | ingesta + almacenamiento + pipelines que mueven/limpian datos | Python, SQL, Spark, Airflow, Kafka |
| **Analytics Engineer** | transformar: modelar datos crudos en tablas limpias y testeadas | SQL, dbt, warehouse |
| **Data Analyst** | servir: métricas, dashboards, responder preguntas de negocio | SQL, herramientas BI |
| **Data Scientist** | modelos y experimentos sobre los datos servidos | Python, librerías de ML |

Las líneas se difuminan — un **Data/Analytics Engineer** (el objetivo de este curriculum) se sitúa
en el medio: SQL + Python sólidos, modelado dimensional, orquestación de pipelines, y suficiente
conocimiento de plataforma (warehouse/lakehouse, Spark/Databricks) para diseñar el flujo de punta a
punta.

## Por qué importa el orden de este track

El modelado (cómo estructurar los datos) va antes que los warehouses (dónde viven), que van antes de
Spark/dbt/orquestación (cómo se construyen y mantienen frescos), y calidad/streaming cierran el
círculo. Cada módulo se apoya en el anterior.`,
      },
      {
        question:
          "Un equipo necesita convertir eventos crudos de una app en tablas limpias, testeadas y documentadas en las que el equipo de BI pueda confiar. ¿De quién es ese trabajo central?",
        options: ["Analytics Engineer", "Data Scientist", "Administrador de Base de Datos", "Analista de BI"],
        explanation:
          "Esa capa de transformación — modelar datos crudos en tablas confiables (normalmente SQL + dbt en un warehouse) — es el trabajo central del Analytics Engineer. Los Data Engineers se enfocan en llevar los datos crudos ahí de forma fiable.",
      },
      {
        question: "En el flujo ingesta → almacenar → transformar → servir, ¿dónde se sitúa un dashboard de BI?",
        options: [
          "Servir — consume los datos modelados",
          "Transformar — remodela los datos",
          "Almacenar — guarda los datos que muestra",
          "Ingesta — jala datos de las fuentes",
        ],
        explanation:
          "Los dashboards son consumidores en la capa de servir. Si un dashboard hace remodelado pesado él mismo, esa lógica normalmente pertenece más arriba en la capa de transformación.",
      },
    ],
  },
  "oltp-vs-olap": {
    title: "OLTP vs OLAP",
    summary: "Row stores para transacciones, pensamiento columnar para analytics — con planes de consulta reales.",
    blocks: [
      {
        markdown: `# OLTP vs OLAP

Dos cargas de trabajo fundamentalmente distintas:

| | **OLTP** (transacciones) | **OLAP** (analytics) |
|---|---|---|
| Pregunta | "trae/actualiza ESTA orden" | "valor promedio de orden por mes" |
| Toca | pocas filas, todas las columnas | millones de filas, pocas columnas |
| Patrón | lookups puntuales por clave, escrituras | grandes scans + agregados, lecturas |
| Optimizado por | índices, esquema normalizado | almacenamiento columnar, esquemas en estrella, particionado |
| Sistemas | Postgres, MySQL | Snowflake, BigQuery, Redshift, Databricks SQL |

Postgres es un row store OLTP, pero es perfecto para *ver* la diferencia: un índice hace que un lookup
puntual salte directo a una fila, mientras que un agregado debe escanear todo sin importar nada.`,
      },
      { title: "Construye una tabla más grande para que el planner tenga algo que elegir" },
      { title: "OLTP: un lookup puntual usa el índice" },
      { title: "OLAP: un agregado debe escanear cada fila" },
      {
        markdown: `Lee los dos planes: el lookup muestra un **Index Scan** (salta a una fila vía el B-tree), el agregado
un **Seq Scan** (lee las 20,000 filas — ningún índice ayuda, porque cada fila participa).

Los motores columnares atacan el segundo caso desde otro ángulo: almacenan cada **columna** de forma
contigua, así \`SUM(total)\` lee *solo* la columna \`total\` — a menudo 50× menos I/O en tablas anchas —
y la comprime mucho mejor. Esa es la idea más importante detrás de cada warehouse de analytics.`,
      },
      {
        title: "Piensa como OLAP",
        prompt:
          "Una pregunta estilo OLAP contra la BD de la tienda: devuelve cada `status` de orden con el número de órdenes (`orders`) y el ingreso total (`revenue`, `SUM(total)`), ordenado por `revenue` descendente.",
        hints: ["COUNT(*) y SUM(total), agrupados por status.", "Ordena por el alias revenue descendente."],
      },
      {
        question:
          "¿Por qué un store columnar hace `SELECT AVG(price) FROM products_with_200_columns` dramáticamente más barato que un row store?",
        options: [
          "Lee solo los datos de la columna `price` en vez de cada fila completa",
          "Cachea la respuesta de una ejecución anterior",
          "Los stores columnares mantienen todos los datos en RAM",
          "Salta los valores NULL automáticamente",
        ],
        explanation:
          "En un row store cada página tiene filas completas, así que un agregado de 1 columna igual arrastra las 200 columnas del disco. El layout columnar almacena cada columna contigua — la consulta toca ~1/200 de los datos, y los valores similares comprimen mucho mejor también.",
      },
    ],
  },
  "file-formats": {
    title: "Formatos de Archivo: CSV, JSON, Parquet y Avro",
    summary: "Layouts por fila vs columnar, y por qué Parquet ganó en analytics.",
    blocks: [
      {
        markdown: `# Formatos de archivo

Lo que escribes al lake determina qué tan rápido corre todo aguas abajo.

| Formato | Layout | Esquema | Mejor para |
|---|---|---|---|
| **CSV** | fila, texto | ninguno (adivina y reza) | intercambio con humanos/legado |
| **JSON** | fila, texto | auto-descriptivo, por registro | APIs, eventos anidados/en evolución |
| **Avro** | fila, binario | esquema en el archivo, reglas de evolución | streaming (Kafka), registro a registro |
| **Parquet** | **columnar**, binario | esquema en archivo + estadísticas ricas | analytics — el estándar del lake |

## Por qué Parquet domina en analytics

- **Columnar**: una consulta que lee 3 de 200 columnas hace ~1.5% del I/O.
- **Row groups + estadísticas**: cada chunk guarda min/max por columna, así los motores *saltan*
  chunks enteros que no pueden coincidir con un filtro (predicate pushdown).
- **Compresión**: los valores similares guardados juntos comprimen mucho mejor que filas mezcladas.

Regla general: **formatos de fila para escribir/streaming** (añadir un registro rápido),
**columnar para leer/analytics** (escanear pocas columnas de muchos registros rápido).`,
      },
      { title: "Simula layout por fila vs columnar" },
      {
        title: "Convierte filas a columnar",
        prompt: `Escribe \`to_columnar(rows)\`: dada una lista de dicts que comparten las mismas claves,
devuelve un dict que mapee cada clave a la **lista de los valores de esa clave en orden de fila**.
Devuelve \`{}\` para una lista vacía.`,
        hints: [
          "Toma las claves de la primera fila, luego construye una lista por clave.",
          "Una dict comprehension funciona: `{k: [r[k] for r in rows] for k in rows[0]}` — maneja el caso vacío primero.",
        ],
      },
      {
        question:
          "Un pipeline de Kafka añade un evento a la vez; un reporte nocturno escanea miles de millones de eventos pero solo 4 columnas. ¿Qué formatos encajan mejor?",
        options: [
          "Avro para el stream, Parquet para la copia analítica",
          "Parquet para ambos",
          "CSV para el stream, JSON para analytics",
          "Avro para ambos",
        ],
        explanation:
          "Los formatos de fila (Avro) añaden registros individuales eficientemente y llevan reglas de evolución de esquema — ideal en vuelo. El columnar (Parquet) es lo que *aterrizas* para analytics. Los pipelines comúnmente convierten Avro → Parquet en reposo.",
      },
    ],
  },
  "batch-vs-streaming": {
    title: "Batch, Micro-batch y Streaming",
    summary: "Latencia vs complejidad: cuándo 'cada noche' le gana a 'ahora mismo'.",
    blocks: [
      {
        markdown: `# Batch vs streaming

La pregunta siempre es: **¿qué tan fresco necesita estar el dato, y qué cuesta esa frescura?**

| Modo | Latencia | Ejemplo | Trade-off |
|---|---|---|---|
| **Batch** | minutos–horas | carga nocturna al warehouse | lo más simple, barato, reintentos/backfills fáciles |
| **Micro-batch** | segundos–minutos | Spark Structured Streaming | casi-tiempo-real con semántica tipo batch |
| **Streaming** | milisegundos–segundos | detección de fraude en Kafka | lo más complejo: orden, eventos tardíos, exactly-once |

Dos reglas que siguen los equipos con experiencia:

1. **Empieza con batch.** La mayoría de los "necesitamos tiempo real" son en realidad "el dashboard
   debería estar fresco esta hora".
2. **La latencia es un requisito de producto, no una preferencia tecnológica.** Elige el modo desde
   el SLA, luego la herramienta.

Una arquitectura común es *ambos*: un camino de streaming para los pocos consumidores realmente en
tiempo real, más batch al warehouse para todo lo demás (conocerás las arquitecturas lambda/kappa en
el módulo de Streaming).`,
      },
      {
        question:
          "Finanzas necesita el ingreso de ayer cada mañana a las 8am. ¿Qué modo de procesamiento encaja — y por qué?",
        options: [
          "Batch — el SLA es diario; cualquier cosa más sofisticada añade costo y modos de fallo",
          "Streaming — más fresco siempre es mejor",
          "Micro-batch — un buen compromiso para cada caso de uso",
          "Batch y streaming juntos, por seguridad",
        ],
        explanation:
          "El requisito es un reporte diario. Un job batch nocturno es trivialmente reintentable, backfilleable y barato. Infraestructura de streaming para un SLA diario es pura complejidad accidental.",
      },
      {
        question: "¿Qué problema existe en streaming pero NO en el procesamiento batch clásico?",
        options: [
          "Eventos que llegan tarde o fuera de orden respecto a cuándo ocurrieron",
          "Cambios de esquema en los datos fuente",
          "Filas duplicadas en la entrada",
          "Jobs que fallan y necesitan reintentos",
        ],
        explanation:
          "Un job batch ve un conjunto de datos completo y cerrado. Un stream nunca termina, así que '¿ya está completo el dato de las 09:59?' se vuelve una pregunta real — eso es event-time vs processing-time, watermarks y windowing (módulo de Streaming).",
      },
    ],
  },
  "data-lifecycle": {
    title: "El Ciclo de Vida del Dato",
    summary: "Ingesta → almacenar → transformar → servir — el mapa para el resto del track.",
    blocks: [
      {
        markdown: `# El ciclo de vida del dato

Cada pipeline en cada empresa es alguna versión de esto:

\`\`\`
1. INGESTA     jala/recibe datos crudos       (APIs, CDC, archivos, streams)
2. ALMACENAR   aterrízalo barato, inmutable   (lake / schema staging, crudo & solo-append)
3. TRANSFORMAR limpia, conforma, modela        (staging → core star schema → marts)
4. SERVIR      expón para consumo              (BI, features ML, APIs, reverse ETL)
\`\`\`

Principios que aparecen en cada etapa:

- **Mantén los datos crudos crudos.** Aterrízalos intactos (bronze/staging); transforma *copias*.
  Siempre puedes reconstruir lo de aguas abajo desde el crudo — nunca al revés.
- **Idempotencia.** Re-correr la carga de ayer no debe duplicar ni corromper datos (implementarás
  patrones de MERGE/upsert exactamente para esto).
- **Linaje.** Cada número servido debería poder rastrearse por las transformaciones hasta el crudo.
  Las herramientas ayudan, pero nombrar las capas consistentemente (staging → core → marts) es el 90%.
- **Contratos en los bordes.** Los esquemas son promesas: valida en la ingesta (módulo de calidad de
  datos), documenta en el servir.

## Dónde encaja cada módulo de este track

| Etapa del ciclo | Módulos |
|---|---|
| Ingesta | Orquestación, Streaming |
| Almacenar | Warehouse, Lakehouse y Lakes |
| Transformar | Modelado de Datos, Spark, dbt |
| Servir (+ confianza) | Calidad de Datos |`,
      },
      {
        title: "Esenciales del panorama de datos",
        cards: [
          { front: "Las cuatro etapas del ciclo de vida", back: "Ingesta (jala/recibe crudo) → Almacenar (aterriza barato e inmutable) → Transformar (limpia, conforma, modela) → Servir (BI, ML, APIs)." },
          { front: "Mantén los datos crudos crudos", back: "Aterriza los datos intactos y solo-append; transforma COPIAS. Las capas de aguas abajo siguen siendo reconstruibles desde el crudo — nunca al revés." },
          { front: "Idempotencia", back: "Correr una carga dos veces = correrla una vez. Se logra con MERGE/upsert por clave o borrar-luego-insertar-partición. Hace seguros los reintentos y backfills." },
          { front: "OLTP vs OLAP en una línea", back: "OLTP: muchas lecturas/escrituras pequeñas por clave (apps, row stores, índices). OLAP: grandes scans + agregados sobre pocas columnas (analytics, almacenamiento columnar)." },
          { front: "Por qué Parquet para analytics", back: "Layout columnar (lee solo las columnas necesarias), estadísticas min/max por row-group (salta chunks), gran compresión. Los formatos de fila (Avro/JSON) siguen siendo mejores para escribir streams." },
          { front: "Data Engineer vs Analytics Engineer", back: "DE: ingesta/almacenar/pipelines que mueven datos de forma fiable (Python, Spark, Airflow, Kafka). AE: la capa de transformación — modelar crudo en tablas testeadas y documentadas (SQL, dbt)." },
        ],
      },
      {
        question:
          "Un bug de transformación corrompió una tabla mart. Gracias al principio 'mantén los datos crudos crudos', el arreglo es…",
        options: [
          "arreglar la transformación y reconstruir el mart desde la capa cruda intacta",
          "restaurar el backup de la base de datos de la semana pasada y perder una semana de datos",
          "editar a mano las filas corruptas en el mart",
          "pedir al sistema fuente que reenvíe todo",
        ],
        explanation:
          "Como el crudo aterrizó de forma inmutable, las capas de aguas abajo son desechables y reconstruibles. Por esto cada arquitectura seria (medallion incluida) hace la primera capa solo-append y sin transformar.",
      },
      {
        question: "'Correr la misma carga dos veces produce el mismo resultado que correrla una vez' es la definición de…",
        options: ["Idempotencia", "Atomicidad", "Linaje", "Normalización"],
        explanation:
          "La idempotencia es LA propiedad que hace operables los pipelines: los reintentos tras fallos y las re-ejecuciones durante backfills se vuelven seguros. MERGE/upsert-por-clave y borrar-luego-insertar-partición son los patrones de escritura idempotente estándar.",
      },
    ],
  },
  "sql-from-python": {
    title: "SQL desde Python e Ingesta de APIs",
    summary: "Corre SQL real desde Python con SQLAlchemy, y carga el JSON de una API en una tabla.",
    blocks: [
      {
        markdown: `# Conectar Python a una base de datos

Aprendiste Python y SQL por separado. En un pipeline se encuentran: Python **maneja** la base de datos
— creando tablas, cargando datos, y corriendo consultas — mientras SQL hace el trabajo basado en
conjuntos. La herramienta estándar es **SQLAlchemy**, cuya capa *Core* es un wrapper delgado y portable
sobre SQL crudo.

> **Nota del navegador:** los pipelines reales se conectan a un servidor con un driver como \`psycopg\`
> (Postgres) y jalan de APIs con \`requests\`. Eso necesita sockets de red, que este Python en el
> navegador (Pyodide) no tiene. Así que aquí corremos el código SQLAlchemy *idéntico* contra un
> **SQLite en-memoria** — la API y el driver difieren, el patrón es el mismo.

## Consultas parametrizadas — nunca formatees SQL a mano

\`\`\`python
# ✅ pasa los valores como parámetros — el driver los escapa
conn.execute(text("INSERT INTO product (name, price) VALUES (:n, :p)"), {"n": name, "p": price})

# ❌ nunca construyas SQL con f-strings — así ocurre la inyección SQL
conn.execute(text(f"INSERT INTO product VALUES ('{name}', {price})"))
\`\`\`

Los parámetros (\`:name\`) también dejan a la base de datos **reutilizar el plan de consulta** y pasar
una *lista* de dicts para un insert masivo rápido.`,
      },
      { title: "Crear, insertar, consultar — con SQLAlchemy Core" },
      { title: "Ingesta un payload de API en la tabla" },
      {
        title: "Carga registros y consúltalos",
        prompt: `Escribe \`expensive(records, min_price)\`:

- \`records\` es una lista de dicts \`{"name": str, "price": float}\`.
- Cárgalos en una tabla **SQLite en-memoria** usando SQLAlchemy, luego corre una consulta SQL que
  devuelva los **nombres** de los productos cuyo \`price\` sea **≥ \`min_price\`**, ordenados por precio
  **descendente**.
- Devuelve esa lista de nombres.

Usa \`text(...)\` con un parámetro enlazado para \`min_price\` — sin f-strings en el SQL.`,
        hints: [
          'Crea el engine con `create_engine("sqlite:///:memory:")`, luego dentro de `engine.begin()` crea la tabla e inserta en masa `records` (pasa la lista directo a un `execute`).',
          'Consulta con un parámetro enlazado: `text("SELECT name FROM product WHERE price >= :min ORDER BY price DESC")` y `{"min": min_price}`.',
          "`.fetchall()` devuelve filas; extrae la primera columna de cada una con `[r[0] for r in rows]`.",
        ],
      },
      {
        question: "¿Por qué pasar valores como `:params` en vez de construir el string SQL con un f-string?",
        options: [
          "El driver escapa los parámetros de forma segura — previene la inyección SQL y deja a la BD reutilizar el plan de consulta",
          "Los f-strings no funcionan dentro de text()",
          "Los parámetros hacen que la consulta corra sobre más filas a la vez",
          "Es la única forma de seleccionar varias columnas",
        ],
        explanation:
          "Formatear entrada de usuario en SQL es el hueco clásico de inyección SQL. Los parámetros enlazados los escapa el driver y dejan a la base de datos cachear el plan compilado entre llamadas — más seguro Y más rápido.",
      },
    ],
  },
};
