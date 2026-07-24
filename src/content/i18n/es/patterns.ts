import type { LessonI18n } from "../overlay";

// Spanish overlay for the "Design Patterns" module (Software Design track). Index-matched; text-only.
export const designPatternsEs: Record<string, LessonI18n> = {
  "factory-builder": {
    title: "Factory y Builder",
    summary: "Centraliza la creación de objetos para que quien llama deje de preocuparse por clases concretas.",
    blocks: [
      {
        markdown: `# Patrones creacionales

## Factory

Una **factory** es un solo lugar que decide *qué clase concreta construir*. Quien llama pide "un
connector para esta ruta" y recibe el objeto correcto — nunca importa clases concretas, así que añadir
una nueva toca solo la factory (Abierto/Cerrado en el punto de creación).

## Builder

Un **builder** ensambla un objeto complejo paso a paso, normalmente con una API fluida (encadenable) —
ideal cuando los constructores necesitarían diez argumentos opcionales:

\`\`\`python
query = (QueryBuilder("orders")
         .select("id", "total")
         .where("status = 'paid'")
         .limit(10)
         .build())
\`\`\`

Ya viste esta forma: tu Pipeline \`.add(...).add(...)\` del módulo de POO *es* un builder. Los method
chains de pandas y el \`df.select(...).filter(...)\` de Spark son la misma idea como APIs.`,
      },
      { title: "Una factory de connectors + un query builder" },
      {
        title: "Construye la factory de readers",
        prompt: `Implementa tres clases reader diminutas y la factory que elige entre ellas:

- \`CsvReader\`, \`JsonReader\`, \`ParquetReader\` — cada una con un atributo de clase
  \`kind\` puesto en \`"csv"\`, \`"json"\`, \`"parquet"\` respectivamente.
- \`reader_for(path)\` — devuelve una **instancia** del reader correcto según la
  extensión del archivo (\`.csv\`, \`.json\`, \`.parquet\`), y lanza \`ValueError\` para
  cualquier otra cosa.`,
        hints: [
          'Pon `kind = "csv"` etc. como atributos de clase.',
          "`path.endswith('.csv')` por formato; `raise ValueError(...)` como fallback.",
        ],
      },
      {
        question: "¿Cuál es el beneficio concreto de enrutar toda la creación por `reader_for`?",
        options: [
          "Añadir un reader de Avro cambia UNA función — los 50 sitios que usan readers nunca aprenden nombres de clases concretas",
          "Los objetos se crean más rápido en runtime",
          "Los readers ya no necesitan métodos __init__",
          "Evita que alguien instancie readers directamente",
        ],
        explanation:
          "Las factories concentran el conocimiento de 'qué clase para qué situación' en un solo lugar. Quien llama depende solo de la forma devuelta — el mismo movimiento de desacople que OCP/DIP, aplicado a la construcción.",
      },
    ],
  },
  singleton: {
    title: "Singleton — y por qué tener cuidado",
    summary: "Una instancia compartida: usos legítimos, costos ocultos, mejores alternativas.",
    blocks: [
      {
        markdown: `# Singleton

**Intención:** garantizar que una clase tenga una sola instancia, alcanzable globalmente. Los objetos
de configuración, los pools de conexiones y los motores costosos son los candidatos clásicos — esta
misma app tiene un único intérprete Pyodide compartido y una sola base de datos PGlite por exactamente
esa razón.

Implementaciones pythonicas, de la más simple primero:

1. **Una instancia a nivel de módulo** — los módulos se importan una vez; \`from db import client\`
   ES un singleton. Esta es la respuesta idiomática de Python.
2. **Sobrescribe \`__new__\`** para devolver siempre la misma instancia.
3. **Borg** — muchas instancias, un *estado compartido* (\`self.__dict__\` aliasado).

## La etiqueta de advertencia

Un singleton es una **variable global con un badge de patrón de diseño**:

- Los tests se interfieren entre sí a través de su estado (fallos dependientes del orden).
- Las dependencias se vuelven invisibles — las funciones alcanzan la global en vez de declarar qué necesitan.
- Intercambiarlo (fake para tests, config distinta) requiere monkey-patching.

Consejo moderno: crea UNA instancia en el punto de entrada de tu app e **inyéctala**
(Inversión de Dependencias) — obtienes la única instancia sin el acceso global.`,
      },
      { title: "Singleton con __new__ vs Borg" },
      {
        question: "Tu suite de tests pasa sola pero falla al correr junto con otros tests. Hay un singleton involucrado. ¿Por qué?",
        options: [
          "El estado escrito por un test vive en la instancia compartida y se filtra al siguiente — el estado global mutable hace los tests dependientes del orden",
          "Los singletons son más lentos bajo runners de tests paralelos",
          "__new__ solo se puede llamar una vez por proceso",
          "Los frameworks de tests prohíben el patrón singleton",
        ],
        explanation:
          "La definición de contaminación de tests. Arreglos: reiniciar el singleton entre tests (un parche), o refactorizar a inyección para que cada test construya su propia instancia (la cura).",
      },
      {
        question: "¿Cuál es la forma más pythonica de proveer un único cliente de base de datos compartido?",
        options: [
          "Créalo una vez en un módulo (`client = DbClient()`), y pásalo al código que lo necesita",
          "Una metaclase que intercepta la instanciación",
          "Guardarlo en un dict global mutable indexado por nombre de clase",
          "Recrearlo en cada función que lo necesita",
        ],
        explanation:
          "Los módulos de Python son singletons naturales — sin ceremonia. Combinar eso con inyección en los bordes conserva el beneficio de la única instancia esquivando los costos de testeabilidad.",
      },
    ],
  },
  "strategy-template": {
    title: "Strategy y Template Method",
    summary: "Dos formas de variar un paso: enchufa una función, o rellena un hueco de subclase.",
    blocks: [
      {
        markdown: `# Variar un paso de un algoritmo

## Strategy

Encapsula comportamientos intercambiables y pasa uno. En Python una strategy suele ser simplemente
**una función** (o cualquier objeto con el método acordado):

\`\`\`python
def dedupe(rows, keep):        # keep es la strategy
    ...
dedupe(rows, keep=keep_latest)
\`\`\`

Ya la usaste: \`run_pipeline(..., transform=apply_bonus)\` en el proyecto final de SOLID, y
\`sorted(data, key=...)\` en la librería estándar.

## Template Method

El flujo de control *inverso*: la **clase base es dueña del esqueleto**, las subclases rellenan los
huecos:

\`\`\`python
class Job:
    def run(self):                    # la plantilla — orden fijo, nunca sobrescrito
        self.extract()
        self.transform()
        self.load()
\`\`\`

Cada framework de ETL que toques tiene esta forma: tú implementas \`extract()\` / \`transform()\`; el
framework decide cuándo corren.

**Cómo elegir:** Strategy compone (pasa distintas funciones por llamada, incluso combínalas); Template
hereda (esqueleto fijo, más pesado pero auto-documentado para código estilo framework). Prefiere
Strategy en la duda — composición otra vez.`,
      },
      { title: "Ambos patrones, lado a lado" },
      {
        title: "Strategy: agregación enchufable",
        prompt: `Construye un pequeño helper de analytics alrededor de strategies inyectadas:

- \`summarize(values, strategy)\` — aplica la función strategy a la lista y devuelve
  el resultado; devuelve \`None\` para una lista vacía **sin llamar a la strategy**.
- Provee dos strategies listas: \`total(values)\` (la suma) y
  \`spread(values)\` (máximo menos mínimo).`,
        hints: [
          "`spread` es `max(values) - min(values)`.",
          "En `summarize`, comprueba `if not values: return None` antes de llamar a la strategy.",
        ],
      },
      {
        question: "Airflow corre las tareas de tu DAG; dbt corre tus modelos en orden de dependencias. ¿Qué patrón es este, desde el punto de vista de tu código?",
        options: [
          "Template Method (a.k.a. inversión de control): el framework es dueño del esqueleto y llama a TUS huecos rellenados",
          "Singleton: una instancia del framework corre todo",
          "Factory: el framework construye tus tareas",
          "Adapter: el framework envuelve tu código incompatible",
        ],
        explanation:
          '"No nos llames, nosotros te llamamos" — tú provees los pasos (tareas, modelos, transform()), el framework provee cuándo/cómo/reintentos. Reconocer esta forma hace que cada framework nuevo sea instantáneamente familiar.',
      },
    ],
  },
  "adapter-facade-decorator": {
    title: "Adapter, Facade y Decorator",
    summary: "Tres wrappers: convierte una interfaz, simplifica un subsistema, añade comportamiento.",
    blocks: [
      {
        markdown: `# La familia de wrappers

Los tres envuelven un objeto — la *intención* difiere:

| Patrón | Intención | Ejemplo del mundo de datos |
|---|---|---|
| **Adapter** | convierte una interfaz que TIENES en una que NECESITAS | envuelve un cliente SOAP legado para que parezca tu protocolo \`Readable\` |
| **Facade** | una puerta simple sobre un subsistema enredado | \`warehouse.load(df, table)\` ocultando auth + staging + COPY + audit |
| **Decorator** | misma interfaz, comportamiento añadido | retry / timing / caching alrededor de cualquier función |

Python da a Decorator sintaxis de primera clase (funciones \`@wraps\`), y el duck typing hace los
Adapters diminutos — sin interfaces que declarar, solo los nombres de método correctos.`,
      },
      { title: "Adapter y Facade" },
      { title: "Decorator: añade comportamiento a CUALQUIER función" },
      {
        title: "Escribe @memoize",
        prompt: `Implementa un decorador \`memoize(fn)\` que cachee resultados por los argumentos posicionales
de la función: la primera llamada con args dados corre \`fn\` y guarda el resultado; las llamadas
repetidas devuelven el valor cacheado **sin llamar a \`fn\` de nuevo**.`,
        hints: [
          "Mantén un dict en el ámbito envolvente indexado por `args` (las tuplas son hasheables).",
          "`if args not in cache: cache[args] = fn(*args)` luego devuelve `cache[args]`.",
        ],
      },
      {
        question: "Envuelves un cliente REST para que satisfaga la misma interfaz `.read()` que tus fuentes de BD. También envuelves `.read()` con lógica de retry. ¿Qué patrones usaste?",
        options: [
          "Adapter (conversión de interfaz) y luego Decorator (misma interfaz, comportamiento añadido)",
          "Facade dos veces",
          "Decorator y luego Adapter",
          "Strategy y luego Template Method",
        ],
        explanation:
          "Interfaz cambiada → Adapter. Interfaz preservada pero comportamiento añadido → Decorator. La intención, no la mecánica, distingue los patrones de wrapper.",
      },
    ],
  },
  observer: {
    title: "Observer y Pub/Sub",
    summary: "Emite eventos; deja que los suscriptores reaccionen — el patrón tras el modelo mental de Kafka.",
    blocks: [
      {
        markdown: `# Observer / Publish–Subscribe

**Problema:** cuando un pipeline termina, debes actualizar la caché del dashboard, mandar un ping a
Slack, y arrancar un job aguas abajo. Llamar a los tres desde el pipeline lo acopla a cada consumidor —
y cada NUEVO consumidor edita el pipeline.

**Patrón:** el pipeline solo **publica un evento**; las partes interesadas **se suscriben**. Publicador
y suscriptores nunca se conocen.

\`\`\`
publicador ──evento──▶ [ bus ] ──▶ suscriptor A
                             └──▶ suscriptor B
\`\`\`

- Dentro del proceso: el patrón **Observer** (una lista de callbacks por evento).
- Entre sistemas: **infraestructura pub/sub** — topics de Kafka, SNS/SQS, LISTEN/NOTIFY de Postgres.
  La misma idea, a tamaño de red.

Esta inversión (los productores no conocen a los consumidores) es exactamente por qué las plataformas
de datos dirigidas por eventos escalan organizacionalmente: los equipos se suscriben a topics sin pedir
al equipo productor que cambie nada.`,
      },
      { title: "Un event bus de 20 líneas" },
      {
        title: "Construye el event bus",
        prompt: `Implementa \`EventBus\`:

- \`.subscribe(event, fn)\` — registra un callback para un nombre de evento.
- \`.publish(event, payload)\` — llama a cada callback registrado para ese evento
  (en orden de suscripción) con \`payload\`, y **devuelve cuántos fueron notificados**
  (\`0\` para un evento al que nadie se suscribió).`,
        hints: [
          "Guarda un dict de evento → lista de callbacks; `setdefault(event, [])` mantiene subscribe simple.",
          "publish: obtén la lista (default `[]`), llama a cada uno con el payload, devuelve la longitud de la lista.",
        ],
      },
      {
        question: "¿Por qué pub/sub escala mejor *organizacionalmente* que las llamadas directas entre sistemas?",
        options: [
          "Un consumidor nuevo solo se suscribe al topic — el equipo productor no despliega nada y ni siquiera necesita saber",
          "Los eventos se comprimen mejor que las peticiones de API",
          "Los publicadores pueden imponer cómo los suscriptores procesan eventos",
          "Elimina la necesidad de esquemas",
        ],
        explanation:
          "Desacoplar productor de consumidores convierte una malla de integración N×M en N productores + M suscriptores alrededor de topics. (El reverso — nadie sabe quién depende del esquema de un evento — es por qué existen los schema registries y los data contracts.)",
      },
    ],
  },
  "patterns-in-pipelines": {
    title: "Patrones en Herramientas de Datos",
    summary: "Detecta Factory, Strategy, Template, Decorator y Observer dentro de Airflow, dbt y Spark.",
    blocks: [
      {
        markdown: `# Ya conoces el diseño de estas herramientas

Las herramientas del track de Ingeniería de Datos están construidas con los patrones que acabas de
aprender. Reconocerlos convierte "memorizar una API" en "ah, es esa forma":

| Dónde | Lo que escribes | El patrón |
|---|---|---|
| Airflow | \`@task\` / operators; el scheduler te llama | **Template Method** (inversión de control) + **Decorator** |
| Airflow | \`PostgresOperator\`, \`S3Operator\`, uno por sistema | familia **Adapter** sobre sistemas externos |
| dbt | config \`materialized: view/table/incremental\` | **Strategy** — mismo SQL de modelo, comportamiento de build intercambiable |
| dbt | \`ref()\` construyendo el DAG que corre en orden | grafo de dependencias tipo **Observer** (declarado, no llamado) |
| Spark | \`df.select(...).filter(...).groupBy(...)\` | **Builder** — ensambla un plan, \`.collect()\` = \`.build()\` |
| Spark | transformaciones lazy vs acciones | Builder otra vez: nada corre hasta la llamada terminal |
| pandas | cadenas \`.pipe(fn)\` | **Strategy** inyectada en un pipeline |
| Great Expectations | una clase \`Expectation\` por chequeo | **Strategy** + **Factory** (desde config) |
| Esta app | un motor Pyodide/PGlite compartido | **Singleton** (instancia a nivel de módulo) |

Dos filas que vale la pena desglosar, ya que conocerás ambas herramientas a fondo después en el track
de Ingeniería de Datos:

- **La pereza de Spark es Builder.** \`.filter(...)\`/\`.select(...)\` no tocan datos — cada llamada solo
  añade un paso a un plan lógico (el objeto en construcción). Solo una **acción** terminal como
  \`.count()\` o \`.collect()\` "construye" — es decir, realmente corre el plan. Por eso la cadena
  devuelve al instante pero la acción es lenta: todo el trabajo real se aplazó a una sola llamada, lo
  que también deja al motor optimizar el plan entero antes de correrlo.
- **La config \`materialized\` de dbt es Strategy.** El SELECT que escribes nunca cambia;
  \`view\`/\`table\`/\`incremental\` son tres *comportamientos de build* intercambiables envueltos alrededor
  de ese mismo SQL, elegidos por una línea de config en vez de una rama de código — exactamente la
  forma "intercambia el algoritmo, conserva la interfaz" que describe Strategy.

Dos conclusiones:

1. **Lee los frameworks nuevos patrón-primero.** "¿Dónde está la plantilla? ¿Qué es inyectable? ¿Cuál
   es la config de la factory?" — serás productivo en horas.
2. **Escribe tu propio código de pipeline igual** — tus futuros compañeros obtienen la misma rampa
   rápida.`,
      },
      {
        title: "Intenciones de los patrones — una línea cada uno",
        cards: [
          { front: "Factory", back: "Un lugar decide QUÉ clase concreta construir; quien llama depende solo de la forma devuelta. Añadir una variante toca una función." },
          { front: "Builder", back: "Ensambla un objeto/plan complejo paso a paso, normalmente fluido (.a().b().build()). Los DataFrames de Spark y los query builders de SQL son esto." },
          { front: "Singleton", back: "Una instancia compartida, alcanzable globalmente. Legítimo para motores/config costosos — pero es estado global: prefiere una instancia creada en el punto de entrada e inyectada." },
          { front: "Strategy", back: "Comportamientos intercambiables tras una interfaz, elegidos/inyectados en runtime. En Python: normalmente solo una función pasada (el key= de sorted, las materializaciones de dbt)." },
          { front: "Template Method", back: "La clase base es dueña del esqueleto fijo; las subclases rellenan los pasos en blanco. Frameworks que llaman a TU código (tareas de Airflow, clases de job ETL) — inversión de control." },
          { front: "Adapter vs Facade vs Decorator", back: "Todos wrappers, distinta intención: Adapter CONVIERTE una interfaz; Facade SIMPLIFICA un subsistema tras una puerta; Decorator CONSERVA la interfaz y añade comportamiento (retry, cache, timing)." },
          { front: "Observer / Pub-Sub", back: "Los productores publican eventos; los suscriptores registran interés. Ninguno conoce al otro — los consumidores nuevos no requieren cambios del productor (EventBus, topics de Kafka)." },
        ],
      },
      {
        question: "El `df.filter(...).select(...)` de Spark devuelve al instante incluso con mil millones de filas; `.count()` tarda minutos. ¿Qué patrón lo explica?",
        options: [
          "Builder: las transformaciones ensamblan un plan de consulta; la acción es el .build() que finalmente lo ejecuta",
          "Singleton: el DataFrame es compartido y cacheado",
          "Observer: .count() se suscribe a las filas",
          "Adapter: filter convierte el formato de fila",
        ],
        explanation:
          "La evaluación lazy es el patrón Builder a escala de motor: cada transformación se añade a un plan lógico, y solo una acción lo materializa — lo que deja a Spark optimizar el plan ENTERO primero (predicate pushdown, column pruning).",
      },
      {
        question: "dbt deja que el mismo SQL de modelo se construya como vista, tabla, o incrementalmente, vía una línea de config. Como patrón, la materialización es…",
        options: [
          "una Strategy — comportamientos de build intercambiables tras una interfaz, seleccionados por config",
          "una Facade sobre el warehouse",
          "un Singleton por modelo",
          "una subclase de Template Method por modelo",
        ],
        explanation:
          "Tu SELECT queda idéntico; la strategy de materialización lo envuelve en distinto DDL (CREATE VIEW / CREATE TABLE / MERGE). Intercambiar strategies sin tocar el modelo es Strategy de manual — lo usarás de forma práctica en el módulo de dbt.",
      },
    ],
  },
};
