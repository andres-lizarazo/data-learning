import type { LessonI18n } from "../overlay";

// Spanish overlay for the "Spark & PySpark" module (Data Engineering track). Index-matched; text-only.
export const pysparkEs: Record<string, LessonI18n> = {
  "spark-model": {
    title: "El Modelo de Spark",
    summary: "Por qué cómputo distribuido, RDDs vs DataFrames, evaluación perezosa.",
    blocks: [
      {
        markdown: `# PySpark — el panorama general

> ⚠️ **¿Por qué no hay un runner de Spark en vivo aquí?** Spark corre sobre la **JVM** y distribuye
> el trabajo por un clúster — no puede correr dentro del navegador. Este módulo enseña el modelo con
> quizzes, *simulaciones ejecutables*, ejercicios de traducción calificados en pandas, y labs de Spark
> SQL contra el Postgres del navegador.

## ¿Por qué Spark?
Cuando los datos son demasiado grandes para la memoria de una máquina, Spark los divide entre muchos
workers y corre los cálculos en **paralelo**.

## Ideas centrales
- **SparkSession** — tu punto de entrada.
- **DataFrame** — una tabla distribuida (como pandas, pero particionada entre nodos).
- Las **Transformaciones** (\`select\`, \`filter\`, \`groupBy\`) son **perezosas** — construyen un plan
  pero no ejecutan.
- Las **Acciones** (\`show\`, \`count\`, \`collect\`) **disparan** el cálculo.
- La **evaluación perezosa** deja a Spark optimizar el plan entero (optimizador Catalyst) — conociste
  esta forma como el **patrón Builder** en el módulo de Patrones de Diseño.

\`\`\`python
from pyspark.sql import SparkSession
spark = SparkSession.builder.appName("demo").getOrCreate()

df = spark.read.csv("data.csv", header=True, inferSchema=True)
df.filter(df.age > 30).groupBy("city").count().show()   # la acción lo dispara
\`\`\``,
      },
      {
        question: "¿Cuál de estas es una *acción* que dispara la ejecución en Spark?",
        options: ["select()", "filter()", "count()", "withColumn()"],
        explanation: "select/filter/withColumn son transformaciones perezosas; count() es una acción.",
      },
      {
        question:
          "Un job encadena 12 transformaciones y luego un `.write.parquet(...)`. ¿Cuándo lee Spark realmente los datos de entrada?",
        options: [
          "En el write — la única acción ejecuta el plan optimizado entero",
          "En la primera transformación",
          "Incrementalmente, una transformación a la vez",
          "Cuando se crea la SparkSession",
        ],
        explanation:
          "Las transformaciones solo ensamblan el plan lógico. La acción deja a Catalyst optimizarlo de punta a punta primero (pushdown, pruning, reordenamiento de joins) — el punto entero de ser perezoso.",
      },
    ],
  },
  "pandas-vs-spark": {
    title: "pandas ↔ PySpark",
    summary: "Traduce las operaciones que ya conoces.",
    blocks: [
      {
        markdown: `# Chuleta pandas ↔ PySpark

Ya conoces pandas del módulo de Pandas — aquí está cómo las mismas ideas se mapean a la API de
DataFrame de PySpark.

| Tarea | pandas | PySpark |
|---|---|---|
| Seleccionar columnas | \`df[["a","b"]]\` | \`df.select("a","b")\` |
| Filtrar filas | \`df[df.a > 5]\` | \`df.filter(df.a > 5)\` |
| Columna nueva | \`df["c"] = df.a + 1\` | \`df.withColumn("c", df.a + 1)\` |
| Agrupar + agg | \`df.groupby("k").a.mean()\` | \`df.groupBy("k").avg("a")\` |
| Renombrar | \`df.rename(columns=...)\` | \`df.withColumnRenamed("a","b")\` |
| Ordenar | \`df.sort_values("a")\` | \`df.orderBy("a")\` |
| Conteo de filas | \`len(df)\` | \`df.count()\` |
| Ojear | \`df.head()\` | \`df.show(5)\` |
| A memoria | — | \`df.collect()\` / \`df.toPandas()\` |

### Modelo mental
- pandas = **una máquina, ansioso (eager)**.
- PySpark = **muchas máquinas, perezoso** (planifica, luego ejecuta en una acción).
- \`df.toPandas()\` jala el frame distribuido *entero* a la memoria de una máquina — hazlo solo con
  resultados pequeños.`,
      },
      {
        markdown: `### Un job típico de PySpark (referencia)

\`\`\`python
from pyspark.sql import SparkSession, functions as F

spark = SparkSession.builder.appName("sales").getOrCreate()

sales = (spark.read
         .parquet("s3://bucket/sales/")
         .filter(F.col("amount") > 0)
         .withColumn("month", F.month("ts")))

monthly = (sales.groupBy("region", "month")
                .agg(F.sum("amount").alias("revenue"),
                     F.countDistinct("user_id").alias("buyers"))
                .orderBy("region", "month"))

monthly.show()          # acción → Spark ejecuta el plan optimizado
monthly.write.parquet("s3://bucket/out/monthly/")
\`\`\`

Cuando estés listo para correr esto de verdad, instala \`pyspark\` localmente (necesita Java 11+) o usa
una plataforma gestionada como Databricks (siguiente módulo).`,
      },
    ],
  },
  "spark-architecture": {
    title: "Arquitectura: Driver, Executors y Particiones",
    summary: "Quién planifica, quién trabaja, y cómo se dividen los datos — simúlalo en Python.",
    blocks: [
      {
        markdown: `# Las partes móviles

\`\`\`
        DRIVER  (tu programa Python: construye el plan, agenda tareas)
           │
   ┌───────┼───────┐
EXECUTOR EXECUTOR EXECUTOR      (workers JVM en nodos del clúster)
 [p0][p1] [p2][p3] [p4][p5]     (cada uno tiene PARTICIONES de los datos)
\`\`\`

- **Driver** — corre tu código, lo convierte en un plan, divide el plan en **tareas**, y entrega las
  tareas a los executors. Cerebro pequeño, sin big data.
- **Executors** — hacen el trabajo real, cada uno sobre su porción de los datos, en paralelo.
- **Partición** — la unidad de paralelismo: un trozo de filas, procesado por una tarea en un core. Un
  DataFrame de 10 mil millones de filas podría ser 2,000 particiones.

Cambio mental clave desde pandas: **tu DataFrame no está en un solo lugar.** Cada operación debe
formularse para que cada partición pueda procesarse de forma independiente — y las operaciones que *no*
pueden (groupBy entre particiones, joins) requieren mover filas entre executors: el **shuffle**
(siguiente lección).

¿Cómo caen las filas en las particiones? Para operaciones con clave: **hash partitioning** —
\`partition = hash(key) % num_partitions\` — así todas las filas con la misma clave caen en la misma
partición. Simulemos exactamente eso.`,
      },
      { title: "Simula el hash partitioning entre executors" },
      {
        question: "Tu job de PySpark llama a `df.toPandas()` sobre un DataFrame de 500 GB y el job muere. ¿Qué pasó?",
        options: [
          "toPandas() recolecta cada partición de todos los executors en la memoria del driver — el driver (no hecho para datos) reventó",
          "pandas no puede leer el formato de archivo de Spark",
          "A los executors se les acabó el disco",
          "toPandas() es una transformación y nunca corre",
        ],
        explanation:
          "El driver es un coordinador, no un nodo de datos. collect()/toPandas() embudan el dataset distribuido entero hacia él. Regla: agrega/filtra hacia abajo PRIMERO; solo recolecta resultados pequeños.",
      },
      {
        question: "Una stage corre 200 tareas en un clúster con 50 cores de executor. ¿Cómo se desarrolla?",
        options: [
          "50 tareas corren en paralelo; a medida que cada core termina una partición toma la siguiente — 4 oleadas en total",
          "Falla: las tareas deben igualar a los cores",
          "Spark fusiona las particiones a 50 primero",
          "Se saltan 150 tareas",
        ],
        explanation:
          "Las tareas se encolan en los cores disponibles (una tarea = una partición = un core a la vez). Por eso también el NÚMERO de particiones importa: 4 particiones gigantes dejarían 46 cores ociosos — y una partición desbalanceada hace esperar a toda la stage (la lección de skew adelante).",
      },
    ],
  },
  "dataframe-api": {
    title: "API de DataFrame a Fondo",
    summary: "select, withColumn, when, agg — y demuestra que puedes traducirlos a pandas.",
    blocks: [
      {
        markdown: `# La API de DataFrame, para trabajo real

Los patrones que escribirás a diario (\`F\` es \`pyspark.sql.functions\`):

\`\`\`python
from pyspark.sql import functions as F

result = (orders
    .filter(F.col("amount") > 0)                       # conserva filas válidas
    .withColumn("tier",                                # columna condicional
        F.when(F.col("amount") > 100, "big")
         .otherwise("small"))
    .groupBy("region", "tier")
    .agg(
        F.sum("amount").alias("revenue"),
        F.count("*").alias("orders"),
        F.countDistinct("user_id").alias("buyers"),
    )
    .orderBy("region", "tier"))
\`\`\`

Semántica a internalizar (difiere de pandas en la sensación, no en el significado):

- **Inmutable**: cada método devuelve un DataFrame NUEVO; nada muta en el sitio.
- \`F.when(...).otherwise(...)\` ≈ \`CASE WHEN\` de SQL ≈ \`np.where\` en pandas.
- \`agg\` toma agregaciones *con nombre* vía \`.alias()\` — las columnas del resultado son exactamente
  lo que aliases.

Como la semántica coincide, puedes *demostrar* que entiendes una cadena de PySpark reproduciéndola en
pandas — que corre justo aquí. Ese es tu reto.`,
      },
      { title: "La misma cadena, en pandas (¡corre aquí!)" },
      {
        title: "Traduce el job de PySpark",
        prompt: `Traduce esta cadena de PySpark a una función pandas \`summarize(df)\`:

\`\`\`python
(df.filter(F.col("amount") > 100)
   .groupBy("region")
   .agg(F.sum("amount").alias("revenue"))
   .orderBy("region"))
\`\`\`

\`summarize\` recibe un DataFrame de pandas con columnas \`region\` y \`amount\`, y debe devolver un
DataFrame con columnas \`region\` y \`revenue\` (una fila por región presente tras el filtro), ordenado
por \`region\`, con un índice fresco 0..n.`,
        hints: [
          "Filtra primero: `df[df['amount'] > 100]`.",
          "`.groupby('region', as_index=False).agg(revenue=('amount', 'sum'))` nombra la columna de salida.",
          "Termina con `.sort_values('region', ignore_index=True)`.",
        ],
      },
      {
        question: "En PySpark, `df.withColumn('x', ...)` devuelve un DataFrame nuevo y `df` queda sin cambios. ¿Por qué Spark insiste en la inmutabilidad?",
        options: [
          "Los frames inmutables hacen del linaje/plan un DAG limpio — habilitando optimización, reintentos de tareas, y recálculo de particiones perdidas",
          "La JVM no puede mutar objetos",
          "Para forzar a los usuarios a escribir programas más cortos",
          "La mutabilidad requeriría locks en el driver",
        ],
        explanation:
          "Cada DataFrame es una *receta* (plan) en vez de un buffer. ¿Pierdes un executor? Re-corre la receta para sus particiones. La misma filosofía que las funciones puras en el módulo de Arquitectura — a escala de clúster.",
      },
    ],
  },
  "joins-shuffles": {
    title: "Joins y Shuffles",
    summary: "Lo más caro que hace Spark — y cómo los broadcast joins lo evitan.",
    blocks: [
      {
        markdown: `# El shuffle

Un \`groupBy\` o join necesita todas las filas con la misma clave **en el mismo executor**. Cuando no
lo están (el caso usual), Spark debe reparticionar los datos por la red: el **shuffle** — escribir
archivos, enviar por red, leer de vuelta. Es la frontera cara que divide un job en **stages**:

\`\`\`
stage 1: leer + filtrar + map        (estrecha: partición → partición, sin movimiento)
   ══════ SHUFFLE (por clave de join/group) ══════
stage 2: join / agregar              (ancha: necesita claves co-ubicadas)
\`\`\`

- Transformaciones **estrechas (narrow)** (\`filter\`, \`select\`, \`withColumn\`) — cada partición de
  salida depende de UNA partición de entrada. Gratis.
- Transformaciones **anchas (wide)** (\`groupBy\`, \`join\`, \`distinct\`, \`orderBy\`) — necesitan
  movimiento de datos. Cada una es un shuffle.

## Estrategias de join

- **Sort-merge join** (default para grande⋈grande): shuffle de AMBOS lados por clave, ordenar, mezclar.
  Dos shuffles — caro pero escala.
- **Broadcast join** (grande⋈pequeño): envía la tabla pequeña ENTERA a cada executor; el lado grande
  nunca se mueve. ¡Sin ningún shuffle!

\`\`\`python
from pyspark.sql import functions as F
big.join(F.broadcast(small_dim), "customer_key")   # sugiérelo explícitamente
\`\`\`

Spark auto-broadcastea tablas bajo \`spark.sql.autoBroadcastJoinThreshold\` (default 10 MB) — y AQE
(lección de rendimiento) puede cambiar a broadcast en runtime. Las consultas de esquema en estrella
(fact grande ⋈ dims pequeñas) son el cielo del broadcast-join — tu modelado dimensional rinde de nuevo.`,
      },
      {
        question: "Una tabla de hechos de 2 mil millones de filas se une a un dim_product de 5 MB. ¿Qué join debería ocurrir, y qué se mueve por la red?",
        options: [
          "Broadcast join: el dim de 5 MB se copia a cada executor; el fact de 2B filas se queda exactamente donde está",
          "Sort-merge: ambas tablas hacen shuffle por product_key",
          "El fact se broadcastea, ya que importa más",
          "Ningún join es posible sin co-particionar primero",
        ],
        explanation:
          "Mover 5 MB × N executors no es nada; hacer shuffle de 2B filas es enorme. Esta asimetría es por qué las tablas de dimensión se mantienen pequeñas y por qué los esquemas en estrella corren tan bien en Spark.",
      },
      {
        question: "¿Qué secuencia causa DOS shuffles separados?",
        options: [
          "df.groupBy('a').count() seguido de .orderBy('cnt')",
          "df.filter(...).select(...).withColumn(...)",
          "df.join(F.broadcast(small), 'k').filter(...)",
          "df.select('a').filter('a > 1').limit(10)",
        ],
        explanation:
          "groupBy hace shuffle por 'a'; la ordenación global luego hace shuffle de nuevo por rango del conteo. Las otras opciones son solo-narrow o broadcast (sin shuffle). Contar shuffles en un plan = predecir su costo.",
      },
      {
        title: "Traduce el broadcast join",
        prompt: `Traduce este join de esquema en estrella de PySpark a una función pandas \`enrich(facts, dims)\`:

\`\`\`python
(facts.join(F.broadcast(dims), "product_id", "inner")
      .groupBy("category")
      .agg(F.sum("amount").alias("revenue"))
      .orderBy("category"))
\`\`\`

\`facts\` tiene columnas \`product_id\`, \`amount\`; \`dims\` tiene \`product_id\`, \`category\`. Devuelve un
DataFrame con columnas \`category\` y \`revenue\` (sumado sobre las filas unidas), ordenado por
\`category\`, con un índice fresco 0..n.`,
        hints: [
          'Un broadcast join sigue siendo solo un inner join por clave: `facts.merge(dims, on="product_id", how="inner")`.',
          "Luego agrupa el frame unido por `category` y suma `amount`, renombrando el resultado a `revenue`.",
          '`.groupby("category")["amount"].sum().reset_index(name="revenue").sort_values("category")` — termina con `.reset_index(drop=True)`.',
        ],
      },
    ],
  },
  "spark-sql": {
    title: "Spark SQL",
    summary: "El mismo motor, sintaxis SQL — practica los patrones ANSI en vivo.",
    blocks: [
      {
        markdown: `# Spark SQL

Cualquier DataFrame puede volverse una tabla SQL, y cualquier SQL se vuelve un DataFrame — ambos
compilan al *mismo* plan de Catalyst, así que ninguno es "más rápido":

\`\`\`python
orders.createOrReplaceTempView("orders")
top = spark.sql("""
    SELECT region, SUM(amount) AS revenue
    FROM orders
    WHERE amount > 0
    GROUP BY region
    ORDER BY revenue DESC
""")
\`\`\`

Spark SQL es en gran parte **ANSI SQL** — por eso puedes practicarlo aquí mismo contra Postgres. El
puñado de diferencias de dialecto que importan:

| Postgres | Spark SQL |
|---|---|
| \`||\` (o \`CONCAT\`) | \`CONCAT(a, b)\` |
| \`NOW()\` / \`CURRENT_DATE\` | \`current_timestamp()\` / \`current_date()\` |
| \`EXTRACT(month FROM d)\` | \`month(d)\` (también tiene \`EXTRACT\`) |
| \`x::int\` | \`CAST(x AS INT)\` |
| \`DISTINCT ON (...)\` | no soportado — usa \`row_number()\` |
| \`generate_series\` | \`sequence()\` + \`explode()\` |

Todo lo de abajo corre sobre el seed e-commerce y es válido en ambos dialectos (donde no lo es, el
comentario lo dice).`,
      },
      { title: "Una consulta ANSI que corre idéntica en Spark" },
      {
        title: "Escríbela una vez, córrela en cualquier lado",
        prompt:
          "En SQL ANSI portable (¡sin sintaxis solo-Postgres!): devuelve cada `name` de producto y `units` (total `qty` en order_items), incluyendo los productos nunca ordenados como `0`. Ordena por `units` descendente, luego `name`.",
        hints: [
          "LEFT JOIN conserva los productos nunca ordenados; COALESCE convierte su suma NULL en 0.",
          "Tanto COALESCE como toda esta forma son idénticos en Spark SQL.",
        ],
      },
      {
        question: "Tu compañero insiste en que la API de DataFrame es más rápida que los strings de spark.sql(). ¿Quién tiene razón?",
        options: [
          "Ninguno — ambos compilan al mismo plan lógico de Catalyst y obtienen optimización idéntica",
          "La API de DataFrame — se salta el parseo de SQL",
          "SQL — está más cerca del motor",
          "Depende del número de executors",
        ],
        explanation:
          "Elige por legibilidad y convención de equipo, no por rendimiento. La lógica condicional compleja a menudo se lee mejor como código DataFrame; el analytics basado en conjuntos a menudo se lee mejor como SQL. Mezclar ambos en un job es normal.",
      },
    ],
  },
  "spark-windows": {
    title: "Window Functions en Spark",
    summary: "Window.partitionBy ↔ OVER (PARTITION BY …) — el mismo concepto, ambas sintaxis.",
    blocks: [
      {
        markdown: `# Windows, al estilo Spark

Dominaste las window functions de SQL en el track de PostgreSQL. Spark tiene exactamente el mismo
concepto con dos sintaxis:

**SQL** (idéntico a lo que conoces):
\`\`\`sql
SELECT *, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
FROM orders
\`\`\`

**API de DataFrame**:
\`\`\`python
from pyspark.sql import Window, functions as F

w = Window.partitionBy("user_id").orderBy(F.desc("created_at"))
orders.withColumn("rn", F.row_number().over(w)).filter("rn = 1")
\`\`\`

Las mismas piezas, el mismo significado: \`partitionBy\` ↔ \`PARTITION BY\`, \`orderBy\` ↔ \`ORDER BY\`,
\`rowsBetween\` ↔ \`ROWS BETWEEN\`. Y sí — \`partitionBy\` aquí significa un shuffle por esa clave, así que
las windows son operaciones *anchas*.

El patrón dedupe-mantén-el-último de arriba es el uso #1 del mundo real (y el reemplazo en Spark del
\`DISTINCT ON\` de Postgres). Practícalo abajo — el SQL corre sin cambios en Spark.`,
      },
      { title: "Orden más reciente por usuario (corre en Spark literal)" },
      {
        title: "La orden más grande de cada usuario",
        prompt:
          "Usando `ROW_NUMBER()`, devuelve la única orden más grande de cada usuario: `user_id`, `order_id` (el `id` de la orden), y `total` — rankeando por `total` descendente (empates rotos por `id` ascendente). Ordena el resultado por `user_id`.",
        hints: ["PARTITION BY user_id, ORDER BY total DESC, id.", "Filtra rn = 1 fuera del CTE."],
      },
      {
        title: "La misma window en pandas",
        prompt: `Demuestra que el concepto se transfiere: escribe \`keep_latest(df)\` en pandas. Dadas las columnas
\`user\`, \`order_id\`, \`ts\` (un timestamp entero), devuelve solo la fila de cada usuario con el \`ts\`
**más alto** — ordenado por \`user\`, índice reiniciado. (Esto es \`ROW_NUMBER() ... WHERE rn = 1\`, al
estilo pandas.)`,
        hints: [
          "Ordena por ts descendente, luego `groupby('user').head(1)` — o usa `df.loc[df.groupby('user')['ts'].idxmax()]`.",
          "Termina con `.sort_values('user', ignore_index=True)`.",
        ],
      },
    ],
  },
  "spark-performance": {
    title: "Rendimiento: Particiones, Caching, AQE y Skew",
    summary: "Los cuatro diales que deciden si el job tarda minutos u horas.",
    blocks: [
      {
        markdown: `# El playbook de rendimiento

## 1. Número de particiones

- Muy POCAS → cores ociosos, tareas gigantes y lentas, presión de memoria.
- DEMASIADAS → overhead de scheduling y (peor) un "problema de archivos pequeños" al escribir.
- Palancas: \`spark.sql.shuffle.partitions\` (default 200), \`repartition(n)\` (shuffle completo),
  \`coalesce(n)\` (fusiona sin shuffle — para encoger, p. ej. antes de escribir).

## 2. Caching

\`df.cache()\` mantiene un DataFrame calculado en la memoria del executor. Vale la pena **solo** cuando
el mismo frame se reusa en múltiples acciones — cachear algo usado una vez solo desperdicia memoria.
Llama a \`unpersist()\` cuando termines.

## 3. AQE — Adaptive Query Execution

Spark 3.x re-optimiza **en runtime** usando estadísticas reales de stages completadas: fusiona
particiones de shuffle diminutas, cambia sort-merge → broadcast cuando un lado resulta pequeño, y
divide particiones desbalanceadas. Mantenlo activo (\`spark.sql.adaptive.enabled\`).

## 4. Skew — el asesino silencioso

El hash partitioning asume que las claves se reparten uniformemente. Una clave caliente (el cliente
null, el mega-cliente) hace que UNA tarea cargue la mayoría de los datos: 199 tareas terminan en
segundos, la tarea 200 corre por una hora. La stage es tan lenta como su partición más gorda.

Arreglos: filtra/caso-especial las claves calientes, **salting** (añade un sufijo aleatorio a la clave
caliente para que se reparta entre N particiones, agrega dos veces), o deja que el manejo de skew de
AQE divida las particiones sobredimensionadas.`,
      },
      { title: "Mira el skew arruinar una stage (simulación)" },
      {
        question:
          "El Spark UI de un job muestra una stage donde 199/200 tareas terminaron en 30s y una tarea lleva 40 minutos corriendo. ¿Diagnóstico?",
        options: [
          "Data skew: una partición tiene la porción gigante de filas de una clave caliente",
          "Muy pocos executors",
          "El driver está subdimensionado",
          "La red del clúster está saturada",
        ],
        explanation:
          "La lentitud uniforme apunta a recursos; UNA tarea rezagada apunta a UNA partición sobredimensionada — una clave caliente. Encuéntrala (cuenta por clave), luego sálala, caso-especialízala, o activa el manejo de skew de AQE.",
      },
      {
        question: "¿Cuándo es `df.cache()` realmente una ganancia?",
        options: [
          "Cuando el mismo DataFrame calculado alimenta varias acciones aguas abajo — p. ej. un frame limpio escrito a tres salidas",
          "En cada DataFrame, por costumbre",
          "Justo antes de un solo write, para acelerarlo",
          "Sobre la entrada cruda, antes de cualquier filtrado",
        ],
        explanation:
          "El cache cambia memoria de executor por recálculo saltado — necesita ≥2 usos para rendir. Cachear un frame usado una vez (o peor, el más grande/crudo) quema memoria que las stages realmente necesitaban.",
      },
    ],
  },
  "spark-io": {
    title: "Leer y Escribir Datos",
    summary: "Formatos, modos de guardado, y escrituras particionadas — donde los jobs se tuercen en silencio.",
    blocks: [
      {
        markdown: `# I/O: los bordes de cada job

## Leer

\`\`\`python
df = (spark.read
      .schema(schema)              # esquema EXPLÍCITO: más rápido + seguro que inferSchema
      .parquet("s3://lake/raw/events/"))
# también: .csv(header=True), .json(), spark.read.table("catalog.schema.table")
\`\`\`

\`inferSchema\` en CSV/JSON escanea los datos una vez solo para adivinar los tipos — en una ruta de lake
eso es una lectura completa extra, y la adivinanza puede desviarse entre corridas. Los jobs de
producción declaran esquemas.

## Escribir: modos de guardado

\`\`\`python
df.write.mode("append").parquet(path)     # añade archivos
df.write.mode("overwrite").parquet(path)  # reemplaza (¡ver abajo!)
# modos: append | overwrite | ignore | error (default)
\`\`\`

## Escrituras particionadas

\`\`\`python
(df.write
   .partitionBy("event_date")             # → event_date=2026-07-03/part-*.parquet
   .mode("overwrite")
   .parquet("s3://lake/curated/events/"))
\`\`\`

Esto crea las carpetas estilo Hive de la lección de lakes — los lectores aguas abajo podan por carpeta.
Dos trampas clásicas:

- **partitionBy sobre una columna de alta cardinalidad** (¡user_id!) → millones de archivos diminutos.
- **Overwrite ciego** reemplaza el dataset COMPLETO. Para "recalcular un día", usa *dynamic partition
  overwrite* (solo se reemplazan las particiones tocadas) — o un \`MERGE\` de Delta, que el módulo de
  Databricks cubre a continuación.`,
      },
      {
        question:
          "Un job diario escribe con `.mode('overwrite').partitionBy('date')` con la intención de refrescar solo ayer. Una mañana todo el dataset de 3 años desapareció excepto ayer. ¿Qué pasó?",
        options: [
          "El modo overwrite estático reemplazó la ruta entera de la tabla; se necesitaba dynamic partition overwrite (o un MERGE) para tocar solo la partición de ayer",
          "partitionBy borró las otras carpetas como duplicados",
          "La consistencia eventual de S3 perdió los archivos",
          "El esquema cambió, invalidando las particiones viejas",
        ],
        explanation:
          "El overwrite por defecto de Spark es a nivel de tabla. `spark.sql.sources.partitionOverwriteMode=dynamic` limita el reemplazo a las particiones presentes en los datos escritos. Este incidente exacto es un rito de paso — más barato de aprender aquí.",
      },
      {
        question: "¿Por qué los jobs de Spark en producción declaran un esquema explícito en vez de `inferSchema=True`?",
        options: [
          "La inferencia cuesta una pasada extra sobre los datos Y puede adivinar tipos distintos de corrida a corrida en silencio — un esquema explícito es más rápido y falla ruidosamente ante la desviación",
          "inferSchema solo funciona en Parquet",
          "Los esquemas explícitos comprimen mejor los datos",
          "La inferencia de esquema requiere derechos de admin del clúster",
        ],
        explanation:
          "Una columna de códigos postales '00123' inferida como INT un día y STRING el siguiente corromperá la lógica de aguas abajo en silencio. El schema-as-code es un contrato de datos en el borde del pipeline (el módulo de Calidad de Datos construye sobre esto).",
      },
    ],
  },
};
