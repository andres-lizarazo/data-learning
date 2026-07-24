import type { LessonI18n } from "../overlay";

// Spanish overlay for the "Architecture Patterns" module (Software Design track). Index-matched; text-only.
export const architectureEs: Record<string, LessonI18n> = {
  "layered-hexagonal": {
    title: "Arquitectura en Capas y Hexagonal",
    summary: "Mantén la lógica central pura; empuja bases de datos y APIs a los bordes.",
    blocks: [
      {
        markdown: `# De capas a hexágonos

## Arquitectura en capas

El stack clásico — cada capa solo puede llamar hacia abajo:

\`\`\`
presentación  (API / CLI / UI)
   ↓
negocio       (las reglas — la parte que ES tu app)
   ↓
persistencia  (repositorios)
   ↓
base de datos
\`\`\`

Buen comienzo, pero la capa de negocio aún *depende de* la persistencia debajo — cambia la base de
datos y la capa del medio tiembla.

## Hexagonal (a.k.a. Puertos y Adaptadores)

Voltea las flechas con Inversión de Dependencias:

- El **núcleo** (lógica de negocio) se sienta en el medio, puro, sin depender de nada concreto.
- Define **puertos** — las interfaces que necesita (\`OrderRepo\` con \`get/save\`) o que ofrece.
- Los **adaptadores** implementan los puertos para tecnología real: adaptador Postgres, adaptador REST,
  adaptador en-memoria para tests.

\`\`\`
   adaptador REST ─▶ ┌────────────┐ ◀─ adaptador Postgres
                     │   NÚCLEO   │
   adaptador CLI  ─▶ │ (neg. puro)│ ◀─ adaptador en-memoria (¡tests!)
                     └────────────┘
\`\`\`

**Beneficio:** el núcleo es testeable con cero infraestructura, y las decisiones de tecnología se
vuelven detalles intercambiables. Para un ingeniero de datos: lógica de transformación = núcleo;
fuentes/destinos = adaptadores. Escribe las transformaciones como funciones puras sobre datos planos y
sobrevivirán cada migración de plataforma.`,
      },
      { title: "Una mini-app hexagonal" },
      {
        question: "En términos hexagonales, ¿qué son el 'núcleo' y los 'adaptadores' de un pipeline de datos?",
        options: [
          "Núcleo: la lógica de transformación sobre datos planos. Adaptadores: los lectores/escritores para S3, Postgres, Kafka, APIs",
          "Núcleo: el orquestador. Adaptadores: las transformaciones",
          "Núcleo: la base de datos. Adaptadores: las consultas SQL",
          "Núcleo: el proveedor cloud. Adaptadores: los pipelines",
        ],
        explanation:
          "El valor de negocio vive en las transformaciones — mantenlas puras y libres de plataforma. La tecnología de I/O cambia (este año S3, el próximo GCS); los adaptadores absorben el cambio mientras el núcleo y sus tests sobreviven intactos.",
      },
      {
        question: "¿Por qué el adaptador en-memoria es posiblemente el más valioso que escribirás?",
        options: [
          "Hace todo el núcleo testeable en milisegundos sin base de datos, sin red, sin docker",
          "Es el adaptador más rápido en producción",
          "Elimina la necesidad de los adaptadores reales",
          "Cachea las consultas de producción automáticamente",
        ],
        explanation:
          "Los tests rápidos y deterministas cambian cómo trabaja un equipo: el TDD se vuelve práctico, el CI tarda segundos, y los refactors son seguros. Todo eso se compra con que los puertos existan — el adaptador en-memoria solo se enchufa.",
      },
    ],
  },
  "di-wiring": {
    title: "Inyección de Dependencias y Configuración",
    summary: "Una raíz de composición cablea la app; todo lo demás solo declara necesidades.",
    blocks: [
      {
        markdown: `# Cablear una aplicación

Ya inyectaste dependencias sueltas. Las apps reales tienen grafos de ellas:

\`\`\`
UserService ─▶ Database
     └───────▶ Cache ─▶ (ttl desde config)
\`\`\`

Dos reglas lo mantienen sano:

1. **Los componentes declaran necesidades en su constructor** y nunca construyen sus propias
   dependencias (nada de \`Database()\` dentro de \`UserService\`).
2. **Una raíz de composición** — una sola función \`build_app(config)\` en el punto de entrada —
   construye todo, guiada por la config. Es el ÚNICO lugar que conoce las clases concretas.

\`\`\`python
def build_app(config):
    db = Postgres(config["dsn"]) if config["env"] == "prod" else FakeDb()
    cache = Cache(ttl=config["cache_ttl"])
    return UserService(db, cache)
\`\`\`

No hace falta framework en Python — una función es una raíz de composición perfecta.
(La config misma sigue la misma regla: parséala una vez en el borde a valores/objetos planos; no pases
lecturas de \`os.environ\` hasta lo profundo del núcleo.)`,
      },
      { title: "Una raíz de composición en acción" },
      {
        title: "Cablea un servicio de usuarios con caché",
        prompt: `Construye los tres componentes y deja que la inyección haga las capas:

- \`Database\` — \`.fetch(uid)\` devuelve \`{"id": uid}\` y **cuenta las llamadas** en
  \`self.calls\` (empieza en 0).
- \`Cache\` — \`.get(key)\` devuelve el valor guardado o \`None\`; \`.set(key, value)\`
  lo guarda.
- \`UserService(db, cache)\` — \`.get_user(uid)\`: devuelve el usuario cacheado si
  está; si no, obténlo de la db, cachéalo, y devuélvelo.`,
        hints: [
          "Database: `self.calls = 0` en __init__; incrementa dentro de fetch.",
          "UserService.get_user: `hit = self.cache.get(uid)` — devuélvelo `if hit is not None`; si no obtén, `cache.set`, devuelve.",
        ],
      },
      {
        question: "¿Por qué `os.environ['DB_HOST']` debería leerse en exactamente un lugar (la raíz de composición) en vez de donde se necesite?",
        options: [
          "Las lecturas de env dispersas son entradas ocultas: hacen los componentes no testeables sin parchear el entorno, e imposibles de reutilizar con distintos ajustes en un proceso",
          "Leer variables de entorno es lento",
          "os.environ no es thread-safe",
          "Las variables de entorno no pueden guardar secretos",
        ],
        explanation:
          "Las lecturas de config son dependencias disfrazadas. Parseadas una vez en el borde y pasadas como valores planos, se vuelven argumentos de constructor visibles y testeables — la misma historia de DI que cualquier otra dependencia.",
      },
    ],
  },
  "functional-composition": {
    title: "Composición Funcional de Pipelines",
    summary: "Funciones puras + composición: la arquitectura escondida dentro de cada buen pipeline.",
    blocks: [
      {
        markdown: `# Los pipelines son composición de funciones

Una **función pura** devuelve la misma salida para la misma entrada y no toca nada fuera de sí misma —
sin I/O, sin globales, sin mutar sus argumentos.

Las transformaciones puras dan superpoderes a un pipeline:

- **Testeable** con valores planos, sin setup.
- **Re-ejecutable** — la pureza es idempotencia gratis.
- **Reordenable/paralelizable** — sin estado oculto con el que tropezar.
- **Componible** — los pasos pequeños se encajan en flujos grandes:

\`\`\`python
clean = compose(strip_whitespace, drop_empty, parse_amounts)
\`\`\`

Este es precisamente el modelo de dbt (modelos = SELECTs puros sobre entradas) y de Spark
(transformaciones = funciones puras sobre DataFrames inmutables). Arquitecta el Python entre ellos de
la misma forma: **núcleo puro, I/O en los bordes** — el replanteo funcional de la arquitectura
hexagonal.`,
      },
      { title: "Compón pasos puros pequeños" },
      {
        title: "Implementa compose",
        prompt: `Escribe \`compose(*fns)\`: devuelve una **nueva función** que aplica \`fns\`
de izquierda a derecha — \`compose(f, g)(x)\` es \`g(f(x))\`. Sin funciones,
el resultado devuelve su entrada sin cambios.`,
        hints: [
          "Define una función interna que recorra fns, hilando el valor a través.",
          "Devuelve la función interna — compose es una función que construye funciones.",
        ],
      },
      {
        question: "¿Qué función es PURA?",
        options: [
          "def tax(amount, rate): return round(amount * rate, 2)",
          "def load(rows): db.insert(rows); return len(rows)",
          "def stamp(row): row['at'] = datetime.now(); return row",
          "def next_id(): COUNTER[0] += 1; return COUNTER[0]",
        ],
        explanation:
          "Solo `tax` depende únicamente de sus entradas y no toca nada más. `load` hace I/O, `stamp` muta su argumento Y lee el reloj, `next_id` muta una global. Cada impureza es una razón por la que una re-ejecución podría comportarse distinto — veneno para pipelines.",
      },
    ],
  },
  reliability: {
    title: "Idempotencia, Reintentos y Fiabilidad",
    summary: "Diseña para la re-ejecución: los patrones que hacen aburridos los fallos de las 3am.",
    blocks: [
      {
        markdown: `# Todo falla; diseña para la re-ejecución

Las redes parpadean, los pods mueren, las APIs limitan por rate. Los pipelines fiables lo asumen:

## Idempotencia (lo no negociable)

*Correr dos veces = correr una vez.* Los patrones de escritura:

- **Upsert / MERGE por clave** — en vez de un INSERT ciego (lo practicaste con
  \`ON CONFLICT\` / \`MERGE\` en el módulo de PostgreSQL).
- **Borrar-luego-insertar la partición** — ¿recomputar un día? Limpia exactamente ese día primero,
  luego escríbelo.
- **Claves de idempotencia** — deduplica peticiones/eventos por una clave única provista por quien llama.

## Reintentos — con criterio

- Reintenta solo errores **transitorios** (timeouts, 429/503) — nunca bugs de datos; una fila
  malformada fallará idéntico las 5 veces.
- **Backoff exponencial + jitter** (1s, 2s, 4s…±aleatorio) para que un servicio en apuros no sea
  arrollado por reintentadores sincronizados.
- Reintentar una operación **no idempotente** es cómo cobras dos veces a un cliente — la idempotencia
  va primero, los reintentos segundo.

Más allá de estos dos: **timeouts** en cada llamada externa, **circuit breakers** (deja de llamar a un
servicio moribundo), y **dead-letter queues** (aparca los mensajes venenosos; mantén el flujo).`,
      },
      { title: "Escrituras idempotentes vs no idempotentes" },
      {
        title: "Escribe retry()",
        prompt: `Implementa \`retry(fn, attempts)\`:

- Llama a \`fn()\`; al éxito devuelve su resultado de inmediato.
- Si lanza, intenta de nuevo — hasta \`attempts\` llamadas en total.
- Si cada intento lanza, re-lanza la **última** excepción.
- \`attempts\` es al menos 1.`,
        hints: [
          "Repite `attempts` veces; devuelve dentro del try, recuerda la excepción en el except.",
          "Tras el bucle, `raise last_error` (o usa `raise` desde el except final).",
        ],
      },
      {
        question: "Una llamada a una API de pagos dio timeout — pero el cargo PUEDE haberse hecho. ¿Qué la hace segura de reintentar?",
        options: [
          "Una clave de idempotencia en la petición: el servidor deduplica, así un cargo reintentado con la misma clave no puede cobrar doble",
          "Esperar lo suficiente para que la primera petición deba haber expirado",
          "Reintentar con un monto menor",
          "Nada — los timeouts nunca deben reintentarse",
        ],
        explanation:
          "Un timeout significa resultado DESCONOCIDO — la petición pudo haber tenido éxito. Solo la idempotencia (dedup del lado del servidor por clave) hace seguro el retry-ante-lo-desconocido. Las APIs estilo Stripe y el procesamiento de streams exactly-once se construyen sobre exactamente esto.",
      },
    ],
  },
  "choosing-architecture": {
    title: "Elegir una Arquitectura",
    summary: "Script → pipeline modular → plataforma orquestada: evoluciona, no sobre-construyas.",
    blocks: [
      {
        markdown: `# La arquitectura es una secuencia de upgrades *ganados*

## Etapa 1 — el script
Un archivo, corre en cron. **Elección correcta** para una fuente, una salida, un mantenedor. Incluso
aquí: funciones puras dentro, config arriba, escrituras idempotentes.

## Etapa 2 — el pipeline modular
El script creció. Divide por responsabilidad (módulos extract / transform / load), inyecta el I/O
(¡testea las transformaciones!), añade logging y reintentos. Sigue siendo un proceso — solo uno del que
puedes razonar. La mayoría de los equipos deberían vivir aquí más de lo que creen.

## Etapa 3 — la plataforma orquestada
Muchos pipelines, dependencias entre ellos, SLAs, backfills, guardia (on-call). Ahora un orquestador
(el módulo de Airflow más adelante), warehouse en capas, dbt para transformaciones, alertas, linaje.
Los patrones que aprendiste son el kit de supervivencia a esta escala — bordes hexagonales, DI,
idempotencia en todas partes.

## Reglas para elegir

1. **Elige para la escala actual +1, no +10.** Una startup con una plataforma Kafka + Spark +
   Kubernetes para 100 MB/día compró pura carga de operaciones.
2. **Las migraciones son la norma** — la división núcleo-puro/adaptadores es lo que hace baratos los
   upgrades de etapa.
3. **Lo aburrido le gana a lo novedoso.** Postgres + Python + cron correctamente le gana a un stack
   exótico incorrectamente — siempre.`,
      },
      {
        question:
          "Un equipo de 3 personas carga dos APIs a Postgres cada noche (~200 MB) para un dashboard. La arquitectura 'correcta' es…",
        options: [
          "Etapa 1–2: un job Python modular en un scheduler, transformaciones puras, escrituras MERGE idempotentes — sin clúster, sin orquestador aún",
          "Kafka + Spark Structured Streaming + un lakehouse, para estar a prueba de futuro",
          "Un microservicio por API con un bus de mensajes entre ellos",
          "Exportaciones manuales semanales a CSV hasta que el equipo crezca",
        ],
        explanation:
          "Ajusta la arquitectura a la carga de trabajo y al equipo. La buena noticia: escrito con transformaciones puras e I/O inyectado, este job sube a Etapa 3 después *rehospedando*, no reescribiendo.",
      },
      {
        question: "¿Qué práctica única reduce más el costo de la migración Etapa 2 → Etapa 3?",
        options: [
          "Mantener la lógica de transformación pura y el I/O tras interfaces — el cambio de orquestador toca entonces solo los bordes",
          "Escribir el pipeline de Etapa 2 en el DSL del orquestador desde el día uno",
          "Evitar tests hasta que la arquitectura se estabilice",
          "Elegir el mismo lenguaje para cada componente futuro",
        ],
        explanation:
          "Airflow (o cualquier orquestador) quiere tareas pequeñas, idempotentes e inyectables — exactamente lo que produce el diseño hexagonal + funcional. Los patrones de arquitectura no eran académicos: son lo que hace del crecimiento un refactor en vez de una reescritura.",
      },
    ],
  },
};
