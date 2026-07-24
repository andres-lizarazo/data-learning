import type { LessonI18n } from "../../overlay";

// Spanish overlay for the "Warehouse, Lake & Lakehouse" module (Data Engineering track). Index-matched; text-only.
export const warehouseLakehouseEs: Record<string, LessonI18n> = {
  "warehouse-architecture": {
    title: "Arquitectura de Warehouse: Staging → Core → Marts",
    summary: "Construye el clásico warehouse de tres capas en vivo, con esquemas Postgres reales.",
    blocks: [
      {
        markdown: `# El warehouse en capas

Cada warehouse serio separa responsabilidades en capas (los nombres varían; los roles no):

\`\`\`
STAGING            CORE                     MARTS
crudo, tal cual    integrado, modelado      hecho a medida para consumidores
solo-append        (¡el esquema en estrella!) agregados, tablas anchas
1:1 con fuentes    limpio, conformado, SCD  uno por equipo/caso de uso
\`\`\`

- **Staging** — aterriza los datos exactamente como se recibieron. Sin transformaciones, sin
  opiniones. Reconstruible-desde-la-fuente es el único requisito.
- **Core** — la verdad modelada: tu esquema en estrella vive aquí. Una versión consistente de
  "cliente", "orden", "ingreso" para toda la empresa.
- **Marts** — lo que cada consumidor realmente consulta: pre-unido, pre-agregado, nombrado en su
  lenguaje.

Los **esquemas** (namespaces) de Postgres modelan esto perfectamente — y así es exactamente como los
warehouses reales (Snowflake, datasets de BigQuery, esquemas de Databricks) lo organizan. El seed ya
tiene \`staging.raw_orders\`; añadamos las otras capas.`,
      },
      { title: "Crea las capas y llena un mart" },
      { title: "Cada capa responde a una audiencia distinta" },
      {
        title: "Construye una consulta de mart de clientes",
        prompt:
          "El equipo de CRM quiere un resumen por cliente desde la capa core: `name` (solo versión actual — `is_current`), `orders` (conteo de `order_id` **distintos**), y `revenue` (`SUM(amount)`). Ordena por `revenue` descendente.\n\n*Nota: une por la clave natural `customer_id` para que los hechos de todas las versiones se acumulen al nombre actual.*",
        hints: [
          "Este es el patrón as-is de Modelado de Datos: salta hist → clave natural → fila actual.",
          "COUNT(DISTINCT order_id) porque la granularidad del hecho son LÍNEAS de orden.",
        ],
      },
      {
        question: "¿Por qué la capa de staging debe quedar libre de transformaciones — incluso arreglos 'obvios'?",
        options: [
          "Es el punto de reconstrucción: si alguna lógica de aguas abajo resulta mal, los datos de staging intactos te dejan reproducir; un staging 'arreglado' destruye la evidencia",
          "Las transformaciones en staging son más lentas que en core",
          "Las tablas de staging no soportan sentencias UPDATE",
          "Para que los analistas consulten datos crudos directamente",
        ],
        explanation:
          "Staging = copia fiel de la fuente al momento de la carga. Cada arreglo pertenece una capa arriba donde está versionado, testeado y re-ejecutable. (El mismo principio que bronze en la arquitectura medallion — dos lecciones adelante.)",
      },
    ],
  },
  "etl-vs-elt": {
    title: "ETL vs ELT",
    summary: "Dónde ocurre la T, y por qué los stacks modernos la voltearon.",
    blocks: [
      {
        markdown: `# ETL vs ELT

Las mismas tres letras, distinto orden, distinta era:

| | **ETL** (clásico) | **ELT** (moderno) |
|---|---|---|
| La transformación ocurre | *antes* de cargar, en un motor separado (Informatica, SSIS, Spark propio) | *dentro* del warehouse, en SQL, tras cargar el crudo |
| El warehouse recibe | tablas limpias y finales | datos crudos (staging), transformados en el sitio |
| Impulsado por | cómputo de warehouse caro — carga solo lo necesario | cómputo elástico y barato (Snowflake/BigQuery/Databricks) |
| Herramientas de transformación | GUIs de ETL, jobs Java/Python | **SQL + dbt** |
| ¿Se conserva el crudo? | normalmente no | sí — recarga/reproduce cuando sea |

Por qué ganó ELT:

1. **El cómputo del warehouse se volvió barato y elástico** — transformar dentro le gana a mantener un
   segundo motor.
2. **Crudo-en-el-warehouse = reproducibilidad** — ¿bug en la transformación? Arregla el SQL y
   reconstruye; la capa cruda sigue ahí.
3. **SQL es el lenguaje compartido** — los analytics engineers son dueños de las transformaciones sin
   un sacerdocio de Java/herramientas ETL.

ETL aún se gana su lugar cuando los datos deben limpiarse *antes* de poder guardarse (redacción de PII,
regulatorio), o cuando el volumen de la fuente debe reducirse en vuelo.`,
      },
      {
        title: "Vocabulario de arquitectura de almacenamiento",
        cards: [
          { front: "ETL vs ELT", back: "ETL: transforma ANTES de cargar, en un motor separado. ELT: carga el crudo al warehouse, transforma ahí en SQL (dbt). ELT ganó porque el cómputo del warehouse se abarató y el crudo-en-el-warehouse significa reproducibilidad." },
          { front: "Warehouse vs lake vs lakehouse", back: "Warehouse: tablas gestionadas, schema-on-write, ACID. Lake: archivos baratos, schema-on-read, todo vale. Lakehouse: almacenamiento de lake + formatos de tabla = garantías de warehouse sobre archivos abiertos." },
          { front: "Capas medallion", back: "Bronze: crudo, solo-append, punto de replay. Silver: limpio, tipado, deduplicado, conformado. Gold: agregados de negocio y marts. Los consumidores leen la capa cuyas promesas necesitan." },
          { front: "El truco del transaction-log (Delta/Iceberg)", back: "Una tabla = archivos de datos + un log ordenado de commits (add/remove de archivos). Reproduce el log → tabla actual; reproduce parte → time travel; un commit atómico → ACID." },
          { front: "High-water mark", back: "Recuerda el id/timestamp máximo ya cargado; la siguiente corrida toma solo filas por encima. Carga incremental simple — pero se pierde actualizaciones en el sitio (usa MERGE o CDC para esas)." },
          { front: "Partition pruning", back: "Divide tablas grandes por una columna de filtro (casi siempre fecha) para que las consultas escaneen solo las piezas que coinciden. Se anula envolviendo la columna de partición en funciones." },
        ],
      },
      {
        question:
          "Se encuentra un bug en la lógica de ingresos de hace 3 meses. ¿Por qué el equipo ELT tiene un día mucho mejor que el equipo ETL clásico?",
        options: [
          "Los datos crudos siguen en el warehouse — arregla la transformación SQL y reconstruye; el equipo ETL debe re-extraer de fuentes que quizás ya no tengan el historial",
          "Las transformaciones ELT están escritas en Python, que tiene menos bugs",
          "Los pipelines ELT nunca tienen bugs de lógica porque SQL es declarativo",
          "El warehouse del equipo ETL es demasiado pequeño para reprocesar",
        ],
        explanation:
          "Conservar los datos crudos residentes es el superpoder de ELT: las transformaciones se vuelven código desechable y versionado (modelos de dbt) sobre datos crudos duraderos. El ETL clásico tiraba el crudo tras transformar.",
      },
      {
        question: "¿Qué requisito argumenta genuinamente por transformar ANTES de cargar (estilo ETL)?",
        options: [
          "La PII debe enmascararse antes de que se persista en la plataforma de analytics",
          "Las transformaciones están escritas en SQL",
          "El equipo quiere conservar los datos crudos para replay",
          "El warehouse cobra por consulta",
        ],
        explanation:
          "Las restricciones de cumplimiento sobre lo que puede *almacenarse* fuerzan la T antes de la L. La mayoría de las demás consideraciones — costo, herramientas, reproducibilidad — favorecen ELT en plataformas modernas.",
      },
    ],
  },
  "data-lakes": {
    title: "Data Lakes",
    summary: "Almacenamiento de objetos barato, schema-on-read, y cómo los lakes se vuelven pantanos.",
    blocks: [
      {
        markdown: `# Data lakes

Un **data lake** son archivos en almacenamiento de objetos barato — S3, ADLS, GCS — organizados por
convención:

\`\`\`
s3://company-lake/
  raw/salesforce/accounts/ingest_date=2026-07-01/part-0001.parquet
  raw/app-events/date=2026-07-01/hour=13/events-*.json
  curated/sales/fact_sales/year=2026/month=06/*.parquet
\`\`\`

## Warehouse vs lake — la división clásica

| | Warehouse | Lake |
|---|---|---|
| Guarda | tablas (gestionadas por el motor) | archivos (los gestionas tú) |
| Esquema | **al escribir** — impuesto al cargar | **al leer** — aplicado al consultar |
| Tipos de dato | estructurado | lo que sea: logs, imágenes, JSON, Parquet |
| Costo | cómputo+almacenamiento acoplados (clásicamente) | almacenamiento baratísimo, trae tu propio motor |
| ACID / actualizaciones | sí | **no** — los archivos no hacen transacciones |

**Schema-on-read** es la espada de doble filo: puedes aterrizar *cualquier cosa* ahora y decidir su
estructura después — pero nada evita que la mitad de tus archivos discrepen sobre esa estructura.

## El pantano

Un lake sin propiedad, sin disciplina de esquema, sin convenciones de partición, y sin catálogo es un
**data swamp**: petabytes que nadie puede consultar ni en los que confiar. Las curas son exactamente lo
que la siguiente lección añade: **formatos de tabla** (traen esquema + ACID a los archivos) y
**catálogos** (saber qué existe).`,
      },
      {
        question:
          "¿Por qué las empresas corrieron un lake Y un warehouse lado a lado durante años (la arquitectura 'de dos niveles')?",
        options: [
          "El lake guardaba todo barato (incl. datos no estructurados para ML), pero le faltaba ACID/esquema/rendimiento — así que subconjuntos curados se copiaban a un warehouse para BI",
          "Las regulaciones requieren guardar cada dataset dos veces",
          "Los warehouses no pueden leer archivos Parquet en absoluto",
          "Los lakes son más rápidos para dashboards de BI que los warehouses",
        ],
        explanation:
          "Cada nivel cubría la debilidad del otro, al precio de almacenamiento duplicado, desviación entre copias, y dos modelos de seguridad. El lakehouse existe para colapsar esto de vuelta a un nivel.",
      },
      {
        question: "En layouts de lake como `.../events/date=2026-07-01/hour=13/`, ¿qué hace la convención de carpetas?",
        options: [
          "Particionado estilo Hive: los motores podan carpetas enteras cuando una consulta filtra por date/hour, saltándose la mayoría de los datos",
          "Hacer los archivos más fáciles de navegar para humanos — sin impacto en consultas",
          "Cifrar los datos por día",
          "Garantizar escrituras exactly-once",
        ],
        explanation:
          "Las carpetas de partición son el índice grueso del lake: `WHERE date = '2026-07-01'` lee una carpeta en vez del dataset entero. Verás la misma idea que el particionado de tablas en la última lección de este módulo.",
      },
    ],
  },
  "lakehouse-formats": {
    title: "Lakehouse y Formatos de Tabla (Delta, Iceberg, Hudi)",
    summary: "Cómo un transaction log convierte archivos en tablas ACID — construye uno para verlo.",
    blocks: [
      {
        markdown: `# El lakehouse

**Lakehouse = almacenamiento de lake + garantías de warehouse.** Una copia de los datos, en formatos
de archivo abiertos, con transacciones ACID, imposición de esquema, y time travel. El truco es un
**formato de tabla abierto** en capa sobre archivos Parquet:

- **Delta Lake** (ecosistema Databricks), **Apache Iceberg** (el más amplio soporte de motores),
  **Apache Hudi** (raíces de streaming-upsert). La misma idea central.

## La idea central: un transaction log

La tabla no son los archivos — son los archivos **más un log de commits**:

\`\`\`
_delta_log/00000.json   {"add": ["part-001.parquet", "part-002.parquet"]}
_delta_log/00001.json   {"add": ["part-003.parquet"]}
_delta_log/00002.json   {"remove": ["part-001.parquet"], "add": ["part-004.parquet"]}
\`\`\`

Los lectores reproducen el log para saber *qué archivos son la tabla actualmente*. Ese único diseño
compra todo:

- **ACID**: un commit es una entrada de log atómica — los lectores lo ven todo o nada.
- **Time travel**: reproduce el log solo hasta la versión N ⇒ la tabla a fecha N.
- **Actualizaciones/borrados sobre archivos inmutables**: reescribe los archivos afectados, loguea
  remove+add; los archivos viejos quedan para el historial hasta que se vacuum.

Construyamos uno en miniatura.`,
      },
      { title: "Un transaction log diminuto estilo Delta" },
      {
        title: "Implementa time travel",
        prompt: `Se te da una lista de commits, cada uno un dict como
\`{"add": [...], "remove": [...]}\`. Escribe \`files_at(commits, version)\` que reproduzca los commits
\`0..version\` (inclusive) y devuelva la **lista ordenada** de archivos que componen la tabla en esa
versión.`,
        hints: [
          "Mantén un set; para cada commit hasta `version`: resta los removes, añade los adds.",
          "Devuelve `sorted(files)` al final.",
        ],
      },
      {
        question:
          "El OPTIMIZE (compactación) de Delta fusiona muchos archivos pequeños en pocos grandes, y VACUUM borra los archivos no referenciados. ¿Por qué el time travel deja de funcionar más allá del horizonte de VACUUM?",
        options: [
          "Las versiones viejas se reconstruyen desde archivos viejos — una vez que VACUUM borra físicamente los archivos que ninguna versión actual referencia, esas versiones históricas no tienen sobre qué reproducir",
          "VACUUM borra el transaction log en sí",
          "OPTIMIZE reescribe el historial a los archivos nuevos",
          "El time travel nunca funcionó tras ninguna escritura",
        ],
        explanation:
          "El log aún puede describir la versión N, pero los archivos parquet a los que esa versión apuntaba se fueron. De ahí las ventanas de retención: VACUUM solo elimina archivos más viejos que el horizonte de time-travel configurado.",
      },
    ],
  },
  medallion: {
    title: "Arquitectura Medallion: Bronze / Silver / Gold",
    summary: "El patrón en capas del lakehouse — construye las tres capas en SQL.",
    blocks: [
      {
        markdown: `# Arquitectura medallion

La versión lakehouse de staging → core → marts, popularizada por Databricks:

| Capa | Contenido | Regla |
|---|---|---|
| **Bronze** | crudo, tal-como-se-ingesta, solo-append (+ columnas de auditoría como \`loaded_at\`) | nunca edites; el punto de replay |
| **Silver** | entidades limpias, tipadas, deduplicadas, conformadas | una fila = una cosa verdadera |
| **Gold** | agregados de nivel de negocio y marts | con forma para consumidores |

Los datos solo fluyen **hacia adelante**; cada capa es reconstruible desde la anterior. Nuestro
\`staging.raw_orders\` (con su columna de auditoría \`loaded_at\`) hace de bronze. Construyamos silver y
gold encima.`,
      },
      { title: "Bronze → Silver: limpia, tipa, enriquece" },
      { title: "Silver → Gold: agregados de negocio" },
      {
        title: "Una consulta de capa gold desde bronze",
        prompt:
          "La calificación reinicia la BD, así que consulta bronze directamente (`staging.raw_orders`): produce el ingreso diario estilo-gold — `order_date` y `revenue` (`SUM(qty * unit_price)`) por día, ordenado por `order_date`.",
        hints: ["El ingreso por fila es qty * unit_price; SUM por order_date."],
      },
      {
        question: "Los dashboards nunca deben leer bronze directamente. ¿Cuál es la razón real?",
        options: [
          "Bronze es crudo y solo-append: duplicados, tipos malos, y valores no conformados son todos *esperados* ahí — las garantías de confianza empiezan solo en silver",
          "Las tablas bronze se guardan en un formato más lento",
          "El almacenamiento de objetos no puede servir consultas",
          "Bronze está cifrado y los dashboards no tienen la clave",
        ],
        explanation:
          "Cada capa hace promesas: bronze promete solo completitud/reproducibilidad; silver añade corrección (tipado, deduplicado, conformado); gold añade significado de negocio. Los consumidores leen la capa cuyas promesas necesitan.",
      },
    ],
  },
  "incremental-cdc": {
    title: "Cargas Incrementales y CDC",
    summary: "High-water marks, cargas con anti-join, y dónde encaja CDC.",
    blocks: [
      {
        markdown: `# Cargas incrementales

Las recargas completas no escalan. Las cargas incrementales mueven **solo lo nuevo**, usando una de:

- **High-water mark**: recuerda el \`loaded_at\` / \`id\` máximo procesado; la siguiente corrida toma
  filas por encima. Simple; se pierde las *actualizaciones* a filas viejas.
- **Anti-join / MERGE por clave**: carga filas cuya clave no esté en el destino (o MERGE para también
  actualizar las cambiadas). Idempotente — seguro de re-correr.
- **CDC (Change Data Capture)**: lee el log de replicación de la base de datos fuente — cada
  INSERT/UPDATE/DELETE como un evento (Debezium → Kafka es el stack clásico). Completo y de baja
  latencia, al costo de infraestructura.

Nuestro seed pone cinco líneas de orden en staging (\`staging.raw_orders\`), de las cuales **dos ya están
en \`fact_sales\`** — exactamente el desastre de re-entrega que la lógica incremental debe sobrevivir.
Mira ambos patrones manejarlo.`,
      },
      { title: "High-water mark: ¿qué hay por encima de la línea?" },
      { title: "La carga incremental idempotente (insert con anti-join)" },
      {
        title: "Encuentra las filas nuevas",
        prompt:
          "Usando el patrón **anti-join**, devuelve las líneas de orden en staging que aún no están en `fact_sales` (empareja por `order_id`): `order_id`, `customer_id`, y `order_date`, ordenado por `order_id`.",
        hints: [
          "`WHERE NOT EXISTS (SELECT 1 FROM fact_sales f WHERE f.order_id = r.order_id)`.",
          "Las órdenes 115 y 116 deben excluirse — ya se cargaron.",
        ],
      },
      {
        question:
          "Una fila fuente se ACTUALIZÓ después de cargarse por primera vez. ¿Qué estrategia incremental se la pierde silenciosamente, y cuál la maneja?",
        options: [
          "Un high-water mark sobre un id creciente se la pierde (el id no creció); MERGE por clave o CDC la atrapa",
          "Las tres estrategias se pierden las actualizaciones",
          "CDC se la pierde; el high-water mark la atrapa",
          "El INSERT con anti-join la atrapa insertando un duplicado",
        ],
        explanation:
          "Los watermarks solo ven valores *nuevos* por encima de la marca — una actualización en el sitio a una fila vieja nunca la cruza (a menos que la marca sea un `updated_at` confiable). MERGE compara por clave y actualiza; CDC transmite el evento de actualización en sí.",
      },
    ],
  },
  partitioning: {
    title: "Particionado y Clustering",
    summary: "Poda, no escanees: la palanca de rendimiento más importante del warehouse.",
    blocks: [
      {
        markdown: `# Particionado

Las tablas de hechos grandes se dividen físicamente por una columna — casi siempre **fecha** — para
que las consultas que filtran por ella lean solo las piezas que coinciden (**partition pruning**).

La misma idea lleva distintos nombres por plataforma:

| Plataforma | Mecanismo |
|---|---|
| Postgres | \`PARTITION BY RANGE/LIST/HASH\` declarativo — tablas hijas |
| BigQuery | columna de partición (+ **clustering** para ordenar dentro de particiones) |
| Snowflake | micro-particiones automáticas + claves de clustering opcionales |
| Databricks/Delta | carpetas de partición + Z-ORDER / liquid clustering |

El particionado de Postgres es real y observable en PGlite — veamos al planner podar.`,
      },
      { title: "Una tabla de eventos particionada" },
      { title: "Mira al planner podar" },
      { title: "…y mira cómo NO poda" },
      {
        question: "¿Qué columna debería particionar una tabla de hechos de clickstream de 10 mil millones de filas, y por qué?",
        options: [
          "Fecha de evento — casi cada consulta filtra por rango de tiempo, así que el pruning salta la mayoría de las particiones; particiones por usuario o por página explotarían en millones de piezas diminutas",
          "user_id — tiene los valores más distintos",
          "Un hash aleatorio, para mantener las particiones del mismo tamaño",
          "page_url — es la dimensión más consultada",
        ],
        explanation:
          "Particiona por lo que las consultas FILTRAN (tiempo, abrumadoramente), mantén la cardinalidad modesta (días/meses, no usuarios), y deja que las claves de clustering/orden manejen columnas secundarias dentro de las particiones.",
      },
      {
        question:
          "Una consulta filtra `WHERE date_trunc('month', created) = '2026-03-01'` y escanea todo. ¿Cuál es la reescritura amigable con el pruning?",
        options: [
          "Un rango sobre la columna cruda: `created >= '2026-03-01' AND created < '2026-04-01'`",
          "Añade un índice sobre date_trunc('month', created)",
          "Mueve el filtro a una cláusula HAVING",
          "Particiona por month_name en su lugar",
        ],
        explanation:
          "El pruning (y los índices B-tree) necesitan la columna de partición desnuda comparada con constantes. Las columnas envueltas en funciones anulan ambos — el bug de rendimiento #1 de tablas particionadas en cada plataforma.",
      },
    ],
  },
};
