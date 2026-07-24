import type { LessonI18n } from "../../overlay";

// Spanish overlay for the "Streaming & Kafka" module (Data Engineering track). Index-matched; text-only.
export const streamingEs: Record<string, LessonI18n> = {
  "streaming-fundamentals": {
    title: "Fundamentos de Streaming",
    summary: "Datos sin límites, y los dos relojes en los que vive cada stream.",
    blocks: [
      {
        markdown: `# Pensar en streams

El batch procesa un dataset **acotado** ("las órdenes de junio"). Un stream es **no acotado** — los
eventos siguen llegando para siempre, así que cada pregunta debe replantearse sobre **ventanas**
("órdenes por ventana de 5 minutos").

## Los dos relojes

Cada evento tiene dos timestamps, y confundirlos causa bugs reales:

- **Event time** — cuándo *ocurrió* la cosa (en el payload del evento).
- **Processing time** — cuándo tu sistema lo *vio*.

Un teléfono compra algo offline a las 09:58; el evento se sube a las 10:07. ¿A qué bucket de 5 minutos
pertenece? **El event time dice 09:55–10:00** — y eso es casi siempre lo que el negocio quiere decir.
Pero tu sistema se enteró tarde, así que el conteo de la ventana de las 09:55 ya estaba mal cuando
cerró…

- Los **eventos tardíos** son por tanto normales, no excepcionales.
- Los **watermarks** son la respuesta estándar: "esperaré N minutos a los rezagados antes de finalizar
  una ventana" — un trade ajustable entre latencia y completitud.

Todo lo demás en streaming — windowing, garantías de entrega, estado — es maquinaria para responder
preguntas con forma de batch sobre datos interminables y fuera de orden.`,
      },
      {
        question: "Un dashboard cuenta órdenes por hora por el momento en que los eventos LLEGAN (processing time). La app móvil agrupa las subidas cuando los dispositivos recuperan señal. ¿Qué sale mal?",
        options: [
          "Las órdenes hechas offline se cuentan en la hora equivocada (posterior) — aparecen picos en los momentos de reconexión, y los números de negocio por hora simplemente están mal",
          "Nada — el tiempo de llegada y el event time son equivalentes a escala",
          "El dashboard cuenta doble las subidas agrupadas",
          "Los eventos se descartan cuando llegan tarde",
        ],
        explanation:
          "El processing time mide tu infraestructura; el event time mide el negocio. Cualquier fuente con buffering (móvil, IoT, reintentos) hace divergir a los dos — el windowing por event-time más watermarks es el arreglo.",
      },
      {
        question: "Un watermark de 10 minutos significa…",
        options: [
          "las ventanas se finalizan una vez que el progreso de event-time del stream pasa fin-de-ventana + 10 minutos — los eventos más tardíos que eso son 'demasiado tarde' y se manejan especialmente (descartados o side-output)",
          "los eventos se retrasan 10 minutos a propósito",
          "el pipeline puede ir con a lo sumo 10 minutos de retraso",
          "cada ventana dura 10 minutos",
        ],
        explanation:
          "El watermark es la apuesta de completitud: espera más → resultados más precisos pero más lentos; espera menos → más rápido pero más correcciones por eventos tardíos. No hay almuerzo gratis — solo un dial.",
      },
    ],
  },
  "kafka-concepts": {
    title: "Conceptos Centrales de Kafka",
    summary: "Topics, particiones, offsets, consumer groups — simula la mecánica.",
    blocks: [
      {
        markdown: `# El modelo de Kafka

Kafka es un **log distribuido y solo-append**:

\`\`\`
topic "orders"
  partición 0:  [e0] [e1] [e2] [e3] ...   ← ordenado, inmutable
  partición 1:  [e0] [e1] ...
  partición 2:  [e0] [e1] [e2] ...
\`\`\`

- **Topic** — un stream con nombre (como una tabla para eventos).
- **Partición** — la unidad de paralelismo y orden. Los eventos con la misma **clave** (p. ej.
  user_id) hashean a la misma partición — así el orden por-clave está garantizado, el orden global no.
  (¡El mismo hash-partitioning que Spark!)
- **Offset** — la posición de cada evento en su partición. Los consumidores rastrean "he procesado
  hasta el offset N" — un **high-water mark**, de nuevo.
- **Consumer group** — un conjunto de consumidores que comparten las particiones de un topic: cada
  partición la lee exactamente UN miembro, así que añadir miembros (hasta el número de particiones)
  escala el consumo. Distintos grupos leen de forma independiente — pub/sub (tu lección de Observer)
  con replay.

Dos propiedades que hacen a Kafka la columna vertebral de la plataforma de datos: los eventos se
**retienen** (re-legibles — un nuevo consumidor puede empezar desde el offset 0), y los consumidores
están **desacoplados** (el grupo del equipo de fraude y el del cargador del warehouse nunca se afectan).`,
      },
      { title: "Simula consumer groups y offsets" },
      {
        title: "Vocabulario de Kafka",
        cards: [
          { front: "Topic", back: "Un stream de eventos con nombre y durable — la 'tabla' del mundo del streaming." },
          { front: "Partición", back: "La unidad de paralelismo Y orden: un log solo-append. Los eventos de la misma clave hashean a la misma partición, así el orden por-clave está garantizado (el global no)." },
          { front: "Offset", back: "La posición de un evento en su partición. Los consumidores comitean 'procesado hasta el offset N' — un high-water mark que hace de la recuperación tras crash un resume, no una pérdida." },
          { front: "Consumer group", back: "Consumidores que comparten un topic: cada partición la posee exactamente un miembro. Distintos grupos leen el mismo topic de forma independiente (pub/sub con replay)." },
          { front: "Event time vs processing time", back: "Cuándo OCURRIÓ (en el payload) vs cuándo tu sistema lo VIO. Las preguntas de negocio casi siempre quieren decir event time; las fuentes con buffering hacen divergir a los dos." },
          { front: "Watermark", back: "'Esperaré N minutos a los eventos tardíos antes de finalizar una ventana.' El dial entre latencia del resultado y completitud." },
          { front: "At-least-once + sink idempotente =", back: "Exactly-once efectivo: los duplicados de la re-entrega se vuelven no-ops cuando la escritura hace MERGE/dedup por la clave de evento." },
        ],
      },
      {
        question: "Un topic tiene 6 particiones y un consumer group con 8 miembros. ¿Qué pasa?",
        options: [
          "6 miembros reciben una partición cada uno; 2 quedan ociosos — las particiones, no los consumidores, son el techo de paralelismo",
          "Los 8 miembros comparten particiones round-robin por evento",
          "Kafka crea 2 particiones más automáticamente",
          "El grupo falla al arrancar",
        ],
        explanation:
          "Una partición → a lo sumo un consumidor por grupo (eso es lo que preserva el orden por-partición). Elegir el número de particiones es planificación de capacidad: puedes añadir particiones después, pero redimensionar reordena qué claves van a dónde.",
      },
      {
        question: "¿Por qué el cargador del warehouse cayéndose por una hora NO pierde eventos?",
        options: [
          "Los eventos se retienen en el log; el offset comiteado del grupo se quedó quieto, así que al reiniciar retoma exactamente donde se quedó",
          "Kafka pausa los productores mientras los consumidores están caídos",
          "Otro consumer group los procesa como respaldo",
          "Sí los pierde — para eso existe la replicación",
        ],
        explanation:
          "El log + offsets desacoplan la producción del consumo en el TIEMPO, no solo en el espacio. El cargador vuelve, se encuentra atrasado, y se pone al día — el lag del consumidor es una métrica a monitorear, no un evento de pérdida de datos.",
      },
    ],
  },
  "windowing-semantics": {
    title: "Windowing y Semánticas de Entrega",
    summary: "Ventanas tumbling en la práctica, y la escalera at-least/exactly-once.",
    blocks: [
      {
        markdown: `# Ventanas

Las agregaciones sobre streams no acotados necesitan límites:

- **Tumbling** — fijas, sin solapamiento: \`[0–5) [5–10) [10–15)\`. Cada evento pertenece a exactamente
  una ventana: \`window_start = ts - (ts % size)\`.
- **Sliding/hopping** — solapadas: una ventana de 5 min cada 1 min (los eventos pertenecen a varias).
- **Session** — dinámicas: una ventana por ráfaga de actividad, cerrada por un hueco (la sesionización
  por hueco de tu lección de SQL Analytics — la misma idea).

# Semánticas de entrega

¿Qué le pasa a un evento cuando las cosas se caen a mitad del procesamiento?

| Garantía | Significado | Costo |
|---|---|---|
| **at-most-once** | puede perder eventos, nunca duplica | lo más barato (commit antes de procesar) |
| **at-least-once** | nunca pierde, puede duplicar (commit después; crash en medio = re-entrega) | el default práctico |
| **exactly-once** | el *efecto* de cada evento ocurre una vez | transacciones/idempotencia — la cara |

El secreto a voces de la industria: la mayoría de los sistemas "exactly-once" son **entrega
at-least-once + procesamiento idempotente** — dedup por la clave de evento en el sink. Posees ese
patrón desde el módulo de warehouse; aquí solo lleva un disfraz de streaming.`,
      },
      { title: "Ventanas tumbling sobre un stream de eventos" },
      {
        title: "Implementa conteos por ventana tumbling",
        prompt: `Escribe \`tumbling_counts(events, size)\`:

- \`events\` es una lista de tuplas \`(ts, value)\` (\`ts\` es un entero; el orden no está garantizado).
- Asigna cada evento a la ventana tumbling que empieza en \`ts - (ts % size)\`.
- Devuelve un dict que mapee **inicio de ventana → conteo de eventos**, conteniendo solo ventanas con
  al menos un evento.`,
        hints: [
          "`start = ts - (ts % size)` pone ts=10, size=10 en la ventana 10 (las ventanas son [start, start+size)).",
          "Un dict simple con `get(start, 0) + 1` hace el conteo.",
        ],
      },
      {
        question: "Un consumidor procesa un evento, escribe al warehouse, luego se cae ANTES de comitear su offset. Al reiniciar, el evento se re-entrega. ¿Qué semántica es esta, y qué salva al warehouse?",
        options: [
          "Entrega at-least-once; una escritura idempotente (MERGE por la clave de evento) hace del duplicado un no-op — 'exactly-once efectivo'",
          "Exactly-once — Kafka lo garantiza por defecto",
          "At-most-once — el evento se pierde",
          "El warehouse rechaza transaccionalmente los eventos reprocesados por su cuenta",
        ],
        explanation:
          "Commit-después-de-procesar = at-least-once = duplicados en el crash, por diseño. La idempotencia del sink convierte los duplicados en no-ops. Las semánticas de entrega + los patrones de escritura son un solo sistema — esta pregunta es un básico de entrevistas de streaming.",
      },
    ],
  },
  "structured-streaming-architectures": {
    title: "Structured Streaming y Arquitecturas",
    summary: "El modelo de streaming de Spark, y lambda vs kappa.",
    blocks: [
      {
        markdown: `# Spark Structured Streaming

La respuesta de Spark al streaming: **escribe código de DataFrame batch; córrelo sobre una tabla no
acotada.**

\`\`\`python
from pyspark.sql import functions as F

stream = (spark.readStream.format("kafka")
          .option("subscribe", "orders").load())

counts = (stream
    .withWatermark("event_time", "10 minutes")            # ¡el dial del watermark!
    .groupBy(F.window("event_time", "5 minutes"), "region")
    .agg(F.sum("amount").alias("revenue")))

(counts.writeStream
    .outputMode("append")
    .option("checkpointLocation", "s3://chk/orders/")     # el estado + offsets viven aquí
    .toTable("gold.revenue_5min"))
\`\`\`

Todo lo que sabes se mapea: la consulta es perezosa y optimizada; el procesamiento es **micro-batch**;
el **checkpoint** guarda offsets + estado de ventana (mata el job, reinícialo, retoma — Auto Loader era
esta maquinaria disfrazada); los watermarks acotan el estado para eventos tardíos.

# Lambda vs Kappa

- **Lambda**: dos caminos paralelos — una capa batch (completa, correcta, nocturna) Y una capa de
  velocidad (aproximada, en tiempo real) — fusionadas en tiempo de consulta. Robusto pero mantienes
  cada pipeline **dos veces**.
- **Kappa**: UN camino de streaming; el log retenido (Kafka) significa que "batch" es solo *reproducir
  el stream* desde el offset 0. Un solo codebase; necesita infra de streaming sólida y fuentes
  reproducibles.

La respuesta pragmática de los 2020s es mayormente-kappa sobre un lakehouse: transmite a tablas Delta
bronze continuamente, corre silver/gold como micro-batches incrementales, reproduce desde el log (o
bronze) cuando la lógica cambia. Ahora posees cada concepto que usa esa frase — que es exactamente
hacia donde iba este track.`,
      },
      {
        question: "¿Por qué Structured Streaming exige una ubicación de checkpoint antes de correr una agregación?",
        options: [
          "El checkpoint persiste los offsets consumidos Y el estado de ventana — sin él, un reinicio perdería las ventanas en vuelo o reprocesaría eventos sin memoria de lo que se contó",
          "Es donde se guarda la tabla de salida",
          "Las licencias de Spark se validan a través de él",
          "Solo por rendimiento — es una caché opcional",
        ],
        explanation:
          "El streaming con estado = el estado ES el cálculo. El checkpointing hace el job reiniciable en su posición exacta — el gemelo de streaming de los commits de offset + sinks idempotentes.",
      },
      {
        question: "La afirmación central de la arquitectura kappa es 'no necesitas una capa batch separada'. ¿Qué lo hace posible?",
        options: [
          "El log retiene el historial, así que 'batch' = reproducir el stream desde el inicio a través del MISMO código — un pipeline sirve para ambas necesidades",
          "Los motores de streaming se volvieron más rápidos que los de batch",
          "Kappa guarda todo en RAM",
          "Los datos modernos nunca necesitan recálculo",
        ],
        explanation:
          "La reproducibilidad colapsa los dos caminos: arreglar la lógica = redesplegar + reproducir desde el offset 0 (o desde bronze). El costo se movió de mantener dos codebases a operar una plataforma de streaming seria — un trade que sigue mejorando a medida que las herramientas maduran.",
      },
    ],
  },
};
