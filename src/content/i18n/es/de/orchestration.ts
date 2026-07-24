import type { LessonI18n } from "../../overlay";

// Spanish overlay for the "Orchestration (Airflow)" module (Data Engineering track). Index-matched; text-only.
export const orchestrationEs: Record<string, LessonI18n> = {
  "why-orchestration": {
    title: "¿Por qué Orquestación? DAGs de Trabajo",
    summary: "De jobs de cron enredados a un grafo de dependencias explícito.",
    blocks: [
      {
        markdown: `# El problema que resuelve la orquestación

La era de cron: \`extract\` a las 01:00, \`transform\` a las 02:00 ("debería estar listo para entonces"…),
\`report\` a las 03:00. Luego extract corre largo una noche y transform procesa medio dataset —
**en silencio**.

El arreglo: deja de codificar las dependencias como *huecos de tiempo* y codifícalas como un **grafo**.
Un orquestador corre un **DAG** (Grafo Dirigido Acíclico) de tareas:

\`\`\`
extract ──▶ transform ──▶ load ──▶ report
               │
validate ──────┘          (load espera a AMBAS)
\`\`\`

- **Dirigido** — las aristas tienen dirección (extract *luego* transform).
- **Acíclico** — sin bucles (una tarea no puede depender de sí misma, ni transitivamente).
- Las tareas corren **cuando sus padres tienen éxito** — nunca en un temporizador esperanzado.

Lo que el orquestador posee más allá del orden: reintentos con backoff, alertas, logs, backfills,
límites de concurrencia, y una UI que muestra exactamente qué tarea de qué corrida falló. Lo que NO
debería poseer: el procesamiento de datos en sí — las tareas *disparan* el trabajo (una consulta, un
job de Spark, una corrida de dbt); el trabajo pesado ocurre en los motores.

El orden de ejecución viene del grafo: las tareas sin padres pendientes están listas; termínalas y la
siguiente "oleada" se desbloquea — mira a BFS recorrer exactamente esas oleadas abajo.`,
      },
      {
        title: "Oleadas de ejecución: BFS sobre el grafo de tareas",
        caption:
          "Oleada 1: extract. Oleada 2: validate + transform (¡en paralelo!). Oleada 3: load. Oleada 4: report.",
      },
      {
        question: "¿Por qué el grafo de tareas debe ser ACÍCLICO?",
        options: [
          "Un ciclo significa que alguna tarea depende transitivamente de sí misma — no existe orden de ejecución válido",
          "Los ciclos hacen el diagrama de la UI demasiado desordenado",
          "Los grafos acíclicos usan menos memoria",
          "Es una limitación arbitraria de Airflow",
        ],
        explanation:
          "El orden topológico (un orden donde cada tarea sigue a todos sus padres) existe si y solo si el grafo no tiene ciclos. A→B→C→A es imposible de agendar: nadie puede ir primero. Implementarás el chequeo de ciclos tú mismo en el proyecto final.",
      },
      {
        question: "El diseño de hueco-de-cron ('transform a las 02:00, extract debería estar listo para entonces') falla ¿CÓMO exactamente?",
        options: [
          "La dependencia es implícita en el espaciado del reloj de pared — cualquier corrida aguas arriba lenta o fallida la viola en silencio y lo de aguas abajo procesa datos incorrectos/parciales",
          "cron no puede correr más de un job por hora",
          "Los jobs no pueden compartir una base de datos",
          "Falla ruidosamente, lo que despierta a la gente",
        ],
        explanation:
          "'En silencio' es la palabra asesina: cron no tiene idea de que los jobs están relacionados. Un orquestador hace la dependencia explícita e impuesta — lo de aguas abajo simplemente no empieza hasta que lo de aguas arriba tiene éxito.",
      },
    ],
  },
  "airflow-core": {
    title: "Conceptos Centrales de Airflow",
    summary: "DAGs, tareas, operadores, el scheduler — y qué es realmente un archivo DAG.",
    blocks: [
      {
        markdown: `# El vocabulario de Airflow

\`\`\`python
from airflow.decorators import dag, task
from datetime import datetime

@dag(schedule="@daily", start_date=datetime(2026, 1, 1), catchup=False)
def shop_pipeline():

    @task
    def extract():
        return fetch_orders()          # los returns se pasan vía XCom

    @task
    def transform(rows):
        return clean(rows)

    @task(retries=3)
    def load(rows):
        merge_into_warehouse(rows)

    load(transform(extract()))         # ← ¡las llamadas DEFINEN el grafo, perezosamente!

shop_pipeline()
\`\`\`

- **DAG** — la definición del pipeline (nombre, horario, fecha de inicio).
- **Task** — un nodo; con la API TaskFlow, una función Python decorada.
- **Operator** — tipos de tarea pre-construidos (\`BashOperator\`, \`SQLExecuteQueryOperator\`,
  \`DatabricksRunNowOperator\`…) — la familia Adapter que predijiste en Patrones de Diseño.
- **Scheduler** — el daemon que crea **DAG runs** en horario y encola tareas listas. Los **Workers**
  las ejecutan.
- **XCom** — metadatos pequeños pasados entre tareas (ids, rutas, conteos — NO dataframes; el big data
  va por almacenamiento).

Nota la detección de patrones: el archivo DAG *construye un plan* (las llamadas son perezosas — eso es
el Builder), el scheduler *llama a tus tareas* (inversión de control — Template Method). Ya viste ambas
formas dos veces.`,
      },
      {
        question: "`transform(extract())` en un archivo DAG de TaskFlow NO corre extract. ¿Qué hace?",
        options: [
          "Declara la arista extract → transform en el DAG; la ejecución ocurre después, tarea por tarea, en los workers cuando el scheduler dispara una corrida",
          "Corre extract de inmediato y cachea el resultado",
          "Es un error de sintaxis fuera de un worker",
          "Corre ambas funciones en un subproceso",
        ],
        explanation:
          "El archivo DAG es un *constructor de planes* que el scheduler parsea (¡frecuentemente!). Por eso los archivos DAG deben ser rápidos y sin efectos secundarios al importar — las llamadas API o consultas de nivel superior en un archivo DAG se ejecutan en cada parseo. Un error clásico y costoso.",
      },
      {
        question: "Una tarea 'devuelve' un DataFrame de 2 GB a la siguiente tarea vía XCom. ¿Qué está mal?",
        options: [
          "XCom es para metadatos pequeños (guardados en la propia BD de Airflow) — el big data debería escribirse al almacenamiento/warehouse y la tarea debería pasar una referencia (ruta/nombre de tabla)",
          "Nada, XCom transmite datos eficientemente",
          "XCom solo acepta strings",
          "Los DataFrames no se pueden serializar en absoluto",
        ],
        explanation:
          "Orquesta, no proceses: la BD del orquestador no es un plano de datos. La tarea A escribe a s3://.../staging/2026-07-03/, pasa la ruta; la tarea B la lee. El mismo principio que la división driver-vs-executors en Spark.",
      },
    ],
  },
  "scheduling-idempotency": {
    title: "Scheduling, Backfills e Idempotencia",
    summary: "Fechas lógicas, catchup, y tareas seguras de correr dos veces.",
    blocks: [
      {
        markdown: `# La fecha lógica

La idea más malentendida de Airflow: una corrida diaria tiene una **fecha lógica** — el intervalo de
datos que procesa — que NO es "ahora".

> La corrida con fecha lógica **2026-07-02** se ejecuta temprano el **2026-07-03**, después de que el
> intervalo que cubre haya terminado del todo.

Las tareas la reciben y deben usarla:

\`\`\`python
@task
def extract(ds=None):                                  # ds = "2026-07-02"
    return fetch_orders(day=ds)                        # ← ¡parametrizado!
    # NO: fetch_orders(day=today())  ← rompe backfills y reintentos
\`\`\`

## Por qué: backfills y catchup

- **Backfill**: "recalcular junio" = correr el DAG una vez por cada día de junio, cada uno con la fecha
  lógica de ese día. Solo funciona si las tareas derivan todo de ella.
- **Catchup**: con \`catchup=True\`, un DAG desplegado con un start_date de enero agenda de inmediato
  cada intervalo perdido desde entonces.

## La idempotencia completa el cuadro

Un backfill re-corre días que ya se cargaron. Cada tarea debe por tanto ser segura de re-correr:
**MERGE por clave o borrar-luego-insertar la partición** (tus patrones de warehouse), nunca append
ciego. Fecha lógica + escrituras idempotentes = cualquier rebanada del historial puede recalcularse sin
miedo, cualquier corrida fallida reintentarse a ciegas. Ese es el modelo operativo entero.`,
      },
      { title: "now() vs fecha lógica — mira un backfill salir mal" },
      {
        title: "Una carga de partición idempotente",
        prompt: `Escribe \`load_partition(warehouse, day, rows)\`:

- \`warehouse\` es un dict que mapea \`day\` → lista de filas.
- La carga debe ser **idempotente** vía borrar-luego-insertar: la partición del día se **reemplaza**
  por \`rows\` (nunca se le hace append), así las re-corridas convergen.
- Las particiones de otros días no deben tocarse.
- Devuelve el número de filas ahora en esa partición.`,
        hints: [
          "La asignación ES borrar-luego-insertar aquí: `warehouse[day] = list(rows)`.",
          "Devuelve `len(warehouse[day])`.",
        ],
      },
      {
        question: "Una tarea hace append a la tabla de hechos. Un backfill re-corre 30 días ya cargados. ¿Qué pasa, y cuál fue el error de diseño?",
        options: [
          "30 días de hechos duplicados (doble ingreso por todas partes); la tarea debió haber hecho MERGE por clave o reemplazado la partición de su fecha lógica",
          "Airflow detecta duplicados y hace rollback",
          "Nada — los backfills saltan los días cargados automáticamente",
          "La tarea falla con un error de primary-key, siempre",
        ],
        explanation:
          "Los orquestadores re-corren cosas — es su trabajo. Asumen que las tareas son idempotentes; no pueden hacerlas idempotentes. (Una restricción unique al menos fallaría ruidosamente — el escenario exacto de la lección de tests de dbt.)",
      },
    ],
  },
  "mini-orchestrator": {
    title: "Proyecto Final: Construye un Mini Orquestador",
    summary: "Ordenamiento topológico + ejecución con manejo de fallos — el corazón de Airflow, en 30 líneas.",
    blocks: [
      {
        markdown: `# Construye la cosa

El bucle central de un orquestador es genuinamente pequeño:

1. **Ordenamiento topológico** — encuentra un orden donde cada tarea siga a sus padres (algoritmo de
   Kahn: toma repetidamente una tarea sin padres pendientes).
2. **Ejecuta en ese orden**, saltando los descendientes de los fallos.
3. **Detecta ciclos** — si ninguna tarea está lista pero quedan tareas, el grafo es cíclico.

Implementarás el paso 1 (con desempate alfabético determinista, como el orden estable de un scheduler
real) y un runner encima.

El formato del DAG: \`deps = {"transform": ["extract"], ...}\` — cada tarea mapea a la lista de tareas de
las que **depende**.`,
      },
      { title: "Algoritmo de Kahn, narrado" },
      {
        title: "topo_order + run_dag",
        prompt: `Implementa el núcleo del orquestador:

- \`topo_order(deps)\` — devuelve una lista de todos los nombres de tarea en un orden topológico válido.
  Cuando varias tareas están listas a la vez, tómalas **alfabéticamente**. Si no se puede progresar
  mientras quedan tareas (un ciclo), lanza \`ValueError\`.
- \`run_dag(deps, run_task)\` — llama a \`run_task(name)\` para cada tarea en orden de \`topo_order\` y
  devuelve la lista de nombres en orden de ejecución.`,
        hints: [
          "Repite mientras queden tareas: recoge `ready` = tareas cuyos padres ya están todos ordenados; ordénalas; añádelas y quítalas.",
          "Si `ready` está vacío pero quedan tareas → lanza ValueError('cycle').",
          "run_dag: `order = topo_order(deps)`, llama a run_task para cada una, devuelve order.",
        ],
      },
      {
        question: "Tu topo_order no encontró tarea lista mientras quedan 3 tareas. En la UI de un orquestador real, ¿cómo se vería esto?",
        options: [
          "El DAG falla la validación/importación — Airflow rechaza DAGs cíclicos en tiempo de parseo, antes de que corra nada",
          "Las tres tareas corren en orden aleatorio",
          "El scheduler reintenta hasta que el ciclo se resuelva",
          "Las tareas se quedan en deadlock en silencio para siempre",
        ],
        explanation:
          "Los ciclos son estructuralmente imposibles de agendar, así que los orquestadores los rechazan lo antes posible — en el parseo del DAG — exactamente como tu ValueError, solo que más temprano en el ciclo de vida.",
      },
    ],
  },
  "sensors-ecosystem": {
    title: "Sensores, Reintentos, SLAs y el Ecosistema",
    summary: "Esperar al mundo, y dónde encajan Dagster/Prefect.",
    blocks: [
      {
        markdown: `# El kit operativo

## Sensores — tareas que esperan

Algunas dependencias no son tareas: la llegada del archivo de un proveedor, una partición apareciendo,
otro DAG terminando. Los **sensores** hacen polling (o difieren) hasta que se cumple una condición:
\`S3KeySensor\`, \`ExternalTaskSensor\`, \`SqlSensor\`. El Airflow moderno prefiere sensores **deferrable**
(liberan su slot de worker mientras esperan) y **scheduling consciente de datos** (\`Datasets\`/assets:
"corre cuando esta tabla se actualice").

## Reintentos, SLAs, alertas

\`\`\`python
@task(retries=3, retry_delay=timedelta(minutes=5),
      retry_exponential_backoff=True)
\`\`\`

Los reintentos manejan fallos *transitorios* (tu lección de Arquitectura, literal — nota reintentos ×
tarea no idempotente = desastre). Los **SLAs** alertan cuando las corridas terminan más tarde de lo
prometido; la guardia recibe el page, el linaje les dice a quién impacta.

## El ecosistema en un párrafo cada uno

- **Airflow** — el titular; DAGs de tareas imperativos; enorme ecosistema de operadores; el que nombran
  las ofertas de trabajo.
- **Dagster** — orientado a assets: declaras las *tablas/archivos* (assets) y sus dependencias; tipado
  fuerte, testing, y experiencia de desarrollo.
- **Prefect** — flujos dinámicos pythónicos, ligero; "tu código es el DAG".
- **Databricks Workflows / dbt Cloud** — schedulers nativos de la plataforma; bien cuando todo el
  trabajo vive en esa plataforma (la regla del módulo de Databricks).

Los conceptos que ahora posees — DAGs, fechas lógicas, idempotencia, backfills, sensores — se
transfieren a TODOS ellos; solo cambian los decoradores.`,
      },
      {
        question: "Un pipeline debe empezar cuando un proveedor deja un archivo en S3 — normalmente 6:00–6:30am, ocasionalmente 9am. El trigger correcto es…",
        options: [
          "Un sensor de clave S3 (deferrable) que compuerta el DAG — empieza el trabajo cuando el archivo realmente existe, por tarde que sea",
          "Agendar a las 06:30 y esperar",
          "Agendar a las 09:30 por seguridad, desperdiciando 3 horas diarias",
          "Correr cada 5 minutos y fallar hasta que aparezca el archivo",
        ],
        explanation:
          "Las condiciones de evento merecen triggers de evento, no temporizadores — la misma lección que los huecos de cron. El sabor deferrable importa a escala: un sensor simple ocupa un slot de worker durante toda su espera.",
      },
      {
        question: "El argumento de Dagster es 'orquesta assets, no tareas'. ¿Qué compra ese replanteo?",
        options: [
          "Los nodos del grafo SON tus tablas/archivos — la freshness, el linaje, y 'qué necesita reconstruirse' se vuelven de primera clase, en vez de inferirse de los nombres de tarea",
          "Los assets se ejecutan más rápido que las tareas",
          "Elimina la necesidad de horarios por completo",
          "Es solo una diferencia de UI",
        ],
        explanation:
          "Es la cosmovisión de dbt/DLT aplicada a la orquestación: declara los artefactos de datos y sus dependencias; los planes de ejecución se siguen. Nota cómo cada herramienta moderna converge en el DAG-de-datos-declarado — ya lo has visto cuatro veces.",
      },
    ],
  },
};
