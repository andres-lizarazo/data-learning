import type { LessonI18n } from "../../overlay";

// Spanish overlay for the "Databricks" module (Data Engineering track). Index-matched; text-only.
export const databricksEs: Record<string, LessonI18n> = {
  "databricks-platform": {
    title: "La Plataforma Databricks",
    summary: "Workspace, notebooks, clústeres, Repos — el mapa de dónde ocurre el trabajo.",
    blocks: [
      {
        markdown: `# Qué es Databricks realmente

Databricks = **Spark gestionado + Delta Lake + un workspace colaborativo**, vendido como una
plataforma sobre tu cloud (los datos en sí quedan en TU cuenta de S3/ADLS/GCS).

## Las piezas que tocarás a diario

- **Workspace** — la UI web: notebooks, carpetas, permisos.
- **Notebooks** — celdas multi-lenguaje (\`%python\`, \`%sql\`, \`%scala\`, \`%md\`) adjuntas a un clúster.
  La superficie de desarrollo por defecto.
- **Clústeres (compute)**:
  - **Clústeres all-purpose** — interactivos, compartidos, para desarrollo. Caros de dejar corriendo.
  - **Clústeres de job** — se levantan para un job agendado, se terminan después. Más baratos; lo que
    debería usar producción.
  - **SQL warehouses** — cómputo casi-serverless para SQL/BI puro (lección 6).
- **Repos / Git folders** — sincroniza notebooks y código con GitHub para revisión de código real (sí,
  deberías PR-ear tus notebooks).
- **DBFS / Volumes** — acceso a archivos en capa sobre el almacenamiento cloud.
- **Unity Catalog** — gobernanza sobre todo ello (lección 4).

## El runtime

Los clústeres corren el **Databricks Runtime (DBR)**: Spark + parches de rendimiento + librerías
preinstaladas + **Photon** (un motor vectorizado en C++ que acelera cargas SQL/DataFrame de forma
transparente).

Tu conocimiento de PySpark se transfiere 1:1 — \`spark\` ya está definido en cada notebook; el trabajo
de la plataforma es quitar el yak-shaving de gestión de clústeres.`,
      },
      {
        question: "Un ETL de producción nocturno corre en un clúster all-purpose compartido que alguien deja arriba 24/7. El arreglo de costo-y-corrección es…",
        options: [
          "Correrlo como un Job en un clúster de job: el cómputo se levanta para la corrida, muere después, y el job obtiene recursos aislados y reproducibles",
          "Un clúster all-purpose más grande para que termine más rápido",
          "Mover el ETL a un refresco de dashboard",
          "Correrlo en el driver del SQL warehouse",
        ],
        explanation:
          "Los clústeres all-purpose son para humanos iterando; los de job para máquinas ejecutando. El cómputo de job efímero es a la vez más barato (sin quema ociosa) y más seguro (sin desviación de dependencias de un clúster compartido de larga vida).",
      },
      {
        question: "¿Dónde viven los datos cuando una empresa usa Databricks?",
        options: [
          "En el propio almacenamiento de objetos cloud de la empresa (S3/ADLS/GCS) — Databricks provee planos de cómputo y control sobre él",
          "Dentro de la base de datos propietaria de Databricks",
          "En los discos locales del clúster permanentemente",
          "En los archivos de notebook",
        ],
        explanation:
          "Este es el argumento del lakehouse: formatos abiertos (Delta/Parquet) en tus propios buckets. Los clústeres son cómputo sin estado; mátalos y los datos quedan intactos — y otros motores pueden leer los mismos archivos.",
      },
    ],
  },
  "delta-lake": {
    title: "Delta Lake en la Práctica",
    summary: "Upserts con MERGE (córrelo de verdad), time travel, OPTIMIZE y VACUUM.",
    blocks: [
      {
        markdown: `# Delta Lake, práctico

Construiste un mini transaction log en el módulo de Lakehouse — Delta es esa idea llevada a producción.
Las características del día a día:

## MERGE — la carga idempotente

\`\`\`sql
MERGE INTO fact_sales AS t
USING staged_updates AS s
  ON t.order_id = s.order_id
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *
\`\`\`

Una sentencia: actualiza las claves existentes, inserta las nuevas. Re-córrela y nada se duplica —
**el** patrón de escritura para cargas incrementales y mantenimiento de SCD.

## Time travel

\`\`\`sql
SELECT * FROM fact_sales VERSION AS OF 42;
SELECT * FROM fact_sales TIMESTAMP AS OF '2026-07-01';
RESTORE TABLE fact_sales TO VERSION AS OF 42;   -- deshacer-el-ups
\`\`\`

## Mantenimiento

- \`OPTIMIZE fact_sales\` — compacta muchos archivos pequeños en pocos grandes
  (+ \`ZORDER BY (customer_key)\` para co-ubicar columnas calientes).
- \`VACUUM fact_sales\` — borra físicamente los archivos no referenciados por la ventana de retención
  (default 7 días) — esto es lo que acota el time travel.

**Postgres 15+ tiene \`MERGE\` real** con la misma forma, así que puedes ejercitar la semántica exacta
aquí mismo sobre el seed warehouse.`,
      },
      { title: "Haz MERGE de las órdenes en staging a la tabla de hechos" },
      {
        title: "Predice el MERGE",
        prompt:
          "Antes de correr un MERGE deberías saber qué hará. Para cada fila en `staging.raw_orders`, devuelve `order_id` y `action`: `'update'` si ese `order_id` ya existe en `fact_sales`, si no `'insert'`. Ordena por `order_id`.",
        hints: [
          "EXISTS contra fact_sales dentro de un CASE decide matched vs not-matched.",
          "Esperado: 115/116 → update, 117/118/119 → insert.",
        ],
      },
      {
        question: "`VACUUM my_table RETAIN 0 HOURS` (forzado) corrió ayer. Hoy `SELECT * FROM my_table VERSION AS OF 10` falla. ¿Por qué?",
        options: [
          "VACUUM borró físicamente los archivos de datos viejos que la versión 10 referenciaba — el log sobrevive pero no tiene sobre qué reproducir",
          "VACUUM trunca el transaction log en sí",
          "Los números de versión se reinician tras cada VACUUM",
          "El time travel requiere OPTIMIZE primero",
        ],
        explanation:
          "Exactamente el trade que simulaste en el módulo de Lakehouse: el time travel vive en los archivos viejos retenidos. La retención (default 7 días) es el dial entre costo de almacenamiento y qué tan atrás puedes rebobinar.",
      },
    ],
  },
  "medallion-autoloader": {
    title: "Medallion en Databricks y Auto Loader",
    summary: "Bronze/silver/gold como tablas Delta, alimentadas por ingesta incremental de archivos.",
    blocks: [
      {
        markdown: `# El medallion, al estilo Databricks

Construiste bronze → silver → gold en PGlite. En Databricks cada capa es una **tabla Delta** (a menudo
un esquema por capa en Unity Catalog), y los flujos entre ellas son jobs de Spark o pipelines DLT:

\`\`\`
archivos cloud ─▶ BRONZE (Delta crudo, solo-append, + columnas _metadata)
                    └─▶ SILVER (MERGE: dedup, tipos, conformidad)
                           └─▶ GOLD (agregados, marts de negocio)
\`\`\`

## Auto Loader — el alimentador de bronze

El problema permanente: los archivos siguen aterrizando en un bucket; carga cada uno exactamente una vez.

\`\`\`python
(spark.readStream
      .format("cloudFiles")                       # ← Auto Loader
      .option("cloudFiles.format", "json")
      .option("cloudFiles.schemaLocation", chk)   # rastreo + evolución de esquema
      .load("s3://landing/events/")
      .writeStream
      .option("checkpointLocation", chk)
      .trigger(availableNow=True)                 # estilo batch: procesa archivos nuevos, para
      .toTable("bronze.events"))
\`\`\`

- Rastrea **qué archivos ya se ingirieron** (sin reprocesar, sin perderse ninguno) — la versión a
  nivel de archivo del high-water mark que implementaste.
- **Inferencia + evolución de esquema**: las columnas nuevas se capturan (o se ponen en cuarentena en
  \`_rescued_data\` en vez de fallar el pipeline).
- \`trigger(availableNow=True)\` lo hace correr como un job batch incremental — maquinaria de streaming,
  cadencia de batch.`,
      },
      {
        question: "Sin Auto Loader, un job re-lista el bucket entero y recarga todo cada noche. ¿Qué arregla Auto Loader exactamente?",
        options: [
          "Hace checkpoint de qué archivos ya se procesaron, así cada corrida ingiere solo archivos NUEVOS — exactly-once, incremental, barato",
          "Comprime los archivos durante la subida",
          "Convierte JSON a Parquet en el bucket",
          "Elimina la necesidad de una capa bronze",
        ],
        explanation:
          "Es el patrón high-water-mark aplicado a archivos, gestionado por ti (checkpoint + notificaciones cloud opcionales en vez de listados completos). La ingesta idempotente es el cimiento sobre el que se asienta todo el medallion.",
      },
      {
        question: "Un campo malformado empieza a aparecer en el JSON fuente. Con `_rescued_data` de Auto Loader, ¿qué pasa?",
        options: [
          "Los datos no parseables aterrizan en la columna _rescued_data en vez de matar el pipeline — puedes inspeccionarlos y repararlos aguas abajo",
          "El pipeline se detiene hasta que se arregle la fuente",
          "Los registros malos se descartan en silencio",
          "El archivo entero se salta",
        ],
        explanation:
          "El trabajo de bronze es nunca perder datos Y nunca bloquear: captura todo, pon en cuarentena lo que no encaja, mantén el flujo. Silver decide qué hacer con los valores rescatados — una decisión de calidad de datos, no un fallo de ingesta.",
      },
      {
        title: "Simula el MERGE de silver (dedup al último)",
        prompt: `El paso bronze→silver es un \`MERGE\` de Delta: para cada clave de negocio, conserva solo la
versión **más reciente**. Simula su núcleo en pandas.

Escribe \`to_silver(bronze)\` donde \`bronze\` es un DataFrame con columnas \`id\`, \`value\`, y \`version\`
(un entero; mayor = más nuevo). Devuelve una fila por \`id\` — la de \`version\` más alta — con columnas
\`id\` y \`value\`, ordenado por \`id\`, con un índice fresco 0..n.`,
        hints: [
          'Ordena por version para que la fila más nueva por id quede al final (o al inicio), p. ej. `bronze.sort_values("version")`.',
          '`drop_duplicates(subset="id", keep="last")` conserva una fila por id — la última tras ordenar ascendente por version.',
          'Selecciona solo `id` y `value`, luego `.sort_values("id").reset_index(drop=True)`.',
        ],
      },
    ],
  },
  "unity-catalog": {
    title: "Unity Catalog y Gobernanza",
    summary: "catalog.schema.table, permisos centralizados, linaje.",
    blocks: [
      {
        markdown: `# Unity Catalog

Una capa de gobernanza sobre cada workspace: **quién puede ver qué**, con linaje y auditoría
integrados.

## El namespace de tres niveles

\`\`\`sql
SELECT * FROM prod.gold.monthly_revenue;
--            └──┬─┘ └─┬─┘ └──────┬──────┘
--            catalog  schema     tabla
\`\`\`

Un layout común: catálogos por entorno (\`dev\`/\`staging\`/\`prod\`), esquemas por capa o dominio
(\`bronze\`/\`silver\`/\`gold\`, o \`finance\`/\`growth\`), tablas dentro. (El \`schema.table\` de Postgres es
la misma idea, un nivel más corta — la has usado desde las lecciones de warehouse.)

## Lo que te da

- **Permisos**: \`GRANT SELECT ON schema prod.gold TO analysts\` estándar — el modelo exacto de la
  lección de Roles y Permisos, a lo ancho del warehouse.
- **Linaje**: rastreo automático a nivel de columna de qué lee/escribe qué — "¿qué dashboards se rompen
  si cambio esta columna?" se vuelve una consulta.
- **Descubrimiento**: catálogo buscable con dueños, tags y documentación.
- **Cross-workspace**: un metastore gobierna muchos workspaces; comparte datos sin copiar (Delta Sharing).

La gobernanza suena burocrática hasta el incidente: el *linaje* es cómo encuentras cada consumidor de
una tabla corrupta en minutos en vez de días.`,
      },
      {
        question: "Una columna en `prod.silver.customers` debe eliminarse. ¿Cómo reduce el riesgo Unity Catalog?",
        options: [
          "El linaje a nivel de columna lista cada tabla, dashboard y job aguas abajo que la lee — conoces el radio de explosión antes de actuar",
          "Reescribe automáticamente las consultas de aguas abajo",
          "Evita que las columnas se eliminen alguna vez",
          "Respalda la columna a un catálogo separado",
        ],
        explanation:
          "El análisis de impacto es la característica estrella del linaje. Sin él, '¿quién usa esto?' es conocimiento tribal y grep; con él, es un lookup. (El cambio en sí aún merece una ventana de deprecación — las herramientas de gobernanza no reemplazan el juicio.)",
      },
      {
        question: "¿Qué diseño de permisos coincide con las capas medallion en Unity Catalog?",
        options: [
          "Pipelines/service principals escriben bronze y silver; los analistas obtienen SELECT en gold (y quizás silver); los humanos nunca escriben las capas crudas",
          "Todos los usuarios reciben ALL PRIVILEGES en el catálogo prod por velocidad",
          "Los analistas escriben en gold directamente para que los reportes queden frescos",
          "Cada equipo recibe su propia copia de los datos",
        ],
        explanation:
          "Idéntico a la lección de roles de Postgres, un nivel arriba: el acceso de escritura sigue el camino del pipeline automatizado, el de lectura sigue las capas de consumo. Los service principals (no cuentas personales) son dueños de las escrituras de producción para auditabilidad.",
      },
    ],
  },
  "jobs-workflows": {
    title: "Jobs, Workflows y DLT",
    summary: "Scheduling en la plataforma: DAGs de tareas, y pipelines declarativos.",
    blocks: [
      {
        markdown: `# Orquestación, nativa de Databricks

## Workflows (Jobs)

Un **Job** es un DAG de **tareas** (notebook / script / SQL / dbt), con:

- dependencias entre tareas (\`depends_on\`) — corre silver después de bronze;
- un horario o trigger por llegada de archivo;
- reintentos, timeouts, alertas;
- un **clúster de job** efímero (recuerda la lección 1).

Es un orquestador de verdad para el trabajo en la plataforma — los equipos con todo en Databricks a
menudo no necesitan nada más; los equipos que orquestan *entre* plataformas ponen Airflow (siguiente
módulo) encima, disparando jobs de Databricks como tareas.

## Delta Live Tables (DLT)

Un framework de pipelines **declarativo**: escribes *qué es cada tabla*, DLT infiere el DAG, gestiona el
procesamiento incremental, e impone calidad:

\`\`\`python
import dlt

@dlt.table
def silver_orders():
    return dlt.read_stream("bronze_orders").where("amount > 0")

@dlt.expect_or_drop("valid_qty", "qty > 0")     # ¡calidad de datos como código!
@dlt.table
def gold_daily():
    return dlt.read("silver_orders").groupBy("order_date").agg(...)
\`\`\`

Nota la forma: tablas definidas como transformaciones puras de tablas aguas arriba, DAG inferido de las
referencias — **el mismo modelo que dbt** (siguiente después de orquestación), en Python. Los
decoradores \`expect_*\` anticipan el módulo de Calidad de Datos.`,
      },
      {
        question: "En DLT nunca escribes 'corre bronze, LUEGO silver, LUEGO gold'. ¿Cómo sabe el orden?",
        options: [
          "Cada tabla declara qué lee (dlt.read / read_stream de otras tablas) — el DAG de dependencias se infiere de esas referencias",
          "Las tablas corren en el orden en que aparecen en el archivo",
          "Numeras las tablas con una opción de prioridad",
          "Todas las tablas corren en paralelo y reintentan hasta que existan las entradas",
        ],
        explanation:
          "Dependencias declarativas: di qué depende de qué (referenciándolo), deja que el motor derive el orden de ejecución. Guarda ese pensamiento — el ref() de dbt funciona exactamente igual, y es por eso que ambas herramientas también pueden construir linaje gratis.",
      },
      {
        question: "¿Cuándo Airflow-encima-de-Databricks le gana a solo Workflows?",
        options: [
          "Cuando el pipeline abarca sistemas que Databricks no posee — p. ej. esperar un drop de SFTP, correr un job de Databricks, luego disparar una API de un proveedor y una corrida de dbt Cloud",
          "Cuando un job tiene más de 10 tareas",
          "Siempre — Workflows no puede hacer dependencias",
          "Solo cuando Spark no está involucrado",
        ],
        explanation:
          "Regla general: orquesta DONDE está el trabajo si todo es una plataforma; trae un orquestador cross-plataforma cuando el DAG cruza fronteras de sistemas. Correr ambos (Airflow disparando Jobs) es una arquitectura normal, aburrida y buena.",
      },
    ],
  },
  "dbsql-photon": {
    title: "Databricks SQL y Photon",
    summary: "SQL warehouses para BI — y el SQL ANSI que ya escribes.",
    blocks: [
      {
        markdown: `# Databricks SQL (DBSQL)

Los **SQL warehouses** son endpoints de cómputo hechos a medida para SQL: dashboards, herramientas de
BI (Tableau/Power BI/Looker vía JDBC), y analistas — con **Photon** (ejecución vectorizada en C++) y
caching agresivo. Los warehouses serverless arrancan en segundos y cobran por uso.

Esto completa el argumento del lakehouse: las MISMAS tablas Delta sirven a los pipelines de Spark *y* a
los dashboards de BI — sin copiar a un producto de warehouse separado.

## El SQL es el SQL

Databricks SQL cumple ANSI: tus joins, CTEs y window functions corren sin cambios. Las adiciones que
vale la pena conocer:

- \`QUALIFY\` — filtra sobre una window function sin una subconsulta:

\`\`\`sql
SELECT user_id, order_id, total
FROM orders
QUALIFY ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY total DESC) = 1
\`\`\`

  (Postgres no tiene QUALIFY — escribes el CTE + \`WHERE rn = 1\` que practicaste.)
- Extras de Delta inline: \`VERSION AS OF\`, \`OPTIMIZE\`, \`DESCRIBE HISTORY\`.

Los ejercicios de window function de los módulos de PostgreSQL y Spark son exactamente lo que exigen
las entrevistas y dashboards de DBSQL — practica uno más, al estilo portable.`,
      },
      { title: "SQL analítico portable (válido en Postgres y DBSQL)" },
      {
        title: "Producto top por categoría",
        prompt:
          "Un ejercicio clásico de entrevista de DBSQL (escríbelo al estilo Postgres con un CTE, ya que QUALIFY no está disponible aquí): para cada `category` de producto, devuelve el `name` y `revenue` (`SUM(amount)`) de su **producto de mayor ingreso**. Ordena por `category`.",
        hints: [
          "Agrega por (category, name) primero, luego rankea dentro de la categoría.",
          "ROW_NUMBER() OVER (PARTITION BY category ORDER BY revenue DESC), conserva rn = 1.",
        ],
      },
      {
        question: "¿Qué hace viable 'BI directo sobre el lakehouse', cuando los lakes eran históricamente demasiado lentos para dashboards?",
        options: [
          "Las estadísticas de archivo de Delta + OPTIMIZE/clustering + la ejecución vectorizada de Photon + el caching del lado del warehouse cierran la brecha de rendimiento sobre los mismos archivos abiertos",
          "Los dashboards consultan en secreto una copia oculta en un store propietario",
          "Las herramientas de BI cachean todo así que el motor no importa",
          "No es viable — una copia de warehouse separada sigue siendo obligatoria",
        ],
        explanation:
          "Cada capa ataca la vieja debilidad del lake: los formatos de tabla añaden estadísticas y control de layout, Photon añade un motor de clase warehouse, el caching absorbe el tráfico repetido de BI. Una copia de datos, ambas cargas — ese es el argumento económico del lakehouse.",
      },
    ],
  },
  "cert-prep": {
    title: "Repaso Rápido (Prep de Certificación)",
    summary: "Preguntas estilo examen sobre toda la superficie de Databricks + Spark.",
    blocks: [
      {
        markdown: `# Repaso rápido

Estas reflejan el estilo del examen **Databricks Certified Data Engineer Associate** (y sus preguntas
de Spark). Responde desde lo que has construido en los últimos dos módulos — cada pregunta aquí mapea a
una lección que hiciste.`,
      },
      {
        question: "¿Qué afirmación sobre las tablas de Delta Lake es VERDADERA?",
        options: [
          "La tabla son archivos de datos Parquet más un transaction log; los lectores reproducen el log para encontrar el conjunto de archivos actual",
          "Delta guarda los datos en un formato de fila propietario",
          "Las actualizaciones reescriben el transaction log pero nunca los archivos de datos",
          "El time travel funciona para siempre sin importar VACUUM",
        ],
        explanation:
          "Archivos + log = tabla. Las actualizaciones reescriben los archivos de datos afectados y añaden un commit; VACUUM acota qué tan atrás pueden llegar las reproducciones.",
      },
      {
        question: "Un MERGE corre dos veces por un reintento. La tabla destino termina correcta de todas formas. ¿Qué propiedad lo hizo seguro?",
        options: [
          "Idempotencia — MERGE por clave converge al mismo estado al re-correr",
          "Aislamiento — la segunda corrida esperó a la primera",
          "Evolución de esquema",
          "Checkpointing",
        ],
        explanation:
          "Las claves coincidentes se actualizan a los mismos valores; las no coincidentes se insertaron la primera vez y simplemente coinciden la segunda. Las escrituras idempotentes son lo que hace aburridos los reintentos (y las re-corridas del orquestador).",
      },
      {
        question: "`df.filter(...).groupBy('k').agg(...).orderBy('total')` — ¿cuántos shuffles?",
        options: [
          "Dos: uno para el groupBy (hash por k), uno para la ordenación global",
          "Uno: filter y groupBy comparten un shuffle",
          "Tres: cada método hace shuffle",
          "Cero: todo es perezoso",
        ],
        explanation:
          "filter es narrow; groupBy hace shuffle por clave; un orderBy global vuelve a hacer range-shuffle. (Perezoso solo significa que los shuffles ocurren en la acción — igual ocurren.)",
      },
      {
        question: "La garantía central de Auto Loader para la ingesta a bronze es…",
        options: [
          "cada archivo fuente se procesa exactamente una vez, rastreado vía estado con checkpoint",
          "los archivos se convierten a Delta antes de aterrizar",
          "el esquema nunca puede cambiar",
          "los datos llegan en orden de event-time",
        ],
        explanation:
          "Exactly-once a nivel de archivo vía checkpoints (con evolución de esquema manejada vía schemaLocation/_rescued_data). El orden NO está garantizado — eso es un tema de event-time para el módulo de streaming.",
      },
      {
        question: "En Unity Catalog, los `analysts` necesitan consultar `prod.gold.revenue`. ¿Qué grants se requieren?",
        options: [
          "USE CATALOG en prod, USE SCHEMA en prod.gold, y SELECT en la tabla (o a lo ancho del esquema)",
          "Solo SELECT en la tabla",
          "ALL PRIVILEGES en el metastore",
          "Derechos de creación de clústeres",
        ],
        explanation:
          "Acceso jerárquico: necesitas paso por cada nivel (catálogo → esquema) más el privilegio del objeto — el mismo modelo en capas que el USAGE-en-esquema + SELECT-en-tabla de Postgres.",
      },
      {
        title: "Databricks y Delta — vocabulario de examen",
        cards: [
          { front: "Tabla de Delta Lake =", back: "Archivos de datos Parquet + un transaction log (_delta_log). Los lectores reproducen el log para encontrar el conjunto de archivos actual. ACID, time travel y MERGE vienen todos del log." },
          { front: "OPTIMIZE vs VACUUM", back: "OPTIMIZE compacta archivos pequeños en grandes (+ ZORDER/clustering para el layout). VACUUM borra físicamente los archivos no referenciados pasada la ventana de retención — que acota el time travel." },
          { front: "Clúster all-purpose vs de job", back: "All-purpose: interactivo, compartido, para humanos desarrollando. Clúster de job: efímero, levantado por corrida agendada — más barato y reproducible. Los jobs de producción usan clústeres de job." },
          { front: "Namespace de Unity Catalog", back: "Tres niveles: catalog.schema.table (p. ej. prod.gold.revenue). El acceso requiere paso por cada nivel más el privilegio del objeto." },
          { front: "La garantía de Auto Loader", back: "Cada archivo fuente ingerido exactamente una vez, rastreado vía estado con checkpoint; inferencia/evolución de esquema con _rescued_data para valores no parseables." },
          { front: "Photon", back: "El motor de ejecución vectorizado en C++ de Databricks — acelera transparentemente cargas SQL/DataFrame (sin cambios de código)." },
          { front: "DLT (Delta Live Tables)", back: "Pipelines declarativos: cada tabla es una transformación de tablas aguas arriba; el DAG se infiere de las referencias; las expectations imponen calidad de datos inline." },
        ],
      },
      {
        question: "Una tarea en una stage de 400 tareas corre 50× más que el resto. Lo PRIMERO a revisar es…",
        options: [
          "la distribución de claves — una clave caliente creando una partición desbalanceada (luego: manejo de skew de AQE / salting)",
          "los ajustes de memoria del driver",
          "si el clúster necesita más nodos",
          "el orden de las celdas del notebook",
        ],
        explanation:
          "Un solo rezagado = una sola partición sobredimensionada = skew, casi siempre. Más nodos no ayudarán — la única tarea sigue siendo dueña de la única partición gorda.",
      },
    ],
  },
};
