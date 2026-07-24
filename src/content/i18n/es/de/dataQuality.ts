import type { LessonI18n } from "../../overlay";

// Spanish overlay for the "Data Quality" module (Data Engineering track). Index-matched; text-only.
export const dataQualityEs: Record<string, LessonI18n> = {
  "dq-dimensions": {
    title: "Las Dimensiones de la Calidad de Datos",
    summary: "Un vocabulario compartido para 'los datos están mal'.",
    blocks: [
      {
        markdown: `# En qué se descompone la "calidad"

"Los datos están mal" no es accionable. Estas dimensiones sí lo son:

| Dimensión | La pregunta | Ejemplo de fallo |
|---|---|---|
| **Completitud** | ¿Está todo aquí? | 3 de 50 tiendas faltan en la carga de ayer |
| **Unicidad** | ¿Sin duplicados no intencionales? | job reintentado insertó órdenes dos veces |
| **Validez** | ¿Valores dentro de rangos/formatos permitidos? | \`qty = -4\`, \`email = "n/a"\` |
| **Consistencia** | ¿Los hechos relacionados coinciden? | total de orden ≠ suma de sus líneas |
| **Exactitud** | ¿Coincide con la realidad? | precio cargado en centavos, reportado en dólares |
| **Frescura / Puntualidad** | ¿Es suficientemente reciente? | tabla "diaria" actualizada por última vez hace 4 días |

Dos principios operativos ganados con esfuerzo:

1. **Comprueba en los bordes.** Valida en la ingesta (barato rechazar temprano), testea tras
   transformar (tests de dbt), monitorea al servir (frescura/volumen). Cuanto más tarde se atrapa un
   registro malo, más cuesta.
2. **Cada chequeo necesita un dueño y una acción.** Una alerta sobre la que nadie actúa entrena a todos
   a ignorar las alertas. Menos chequeos significativos le ganan a cientos de ruidosos.`,
      },
      {
        question: "El total de la orden #4412 es $128 pero sus líneas suman $97. ¿Qué dimensión de calidad se viola?",
        options: [
          "Consistencia — dos piezas de datos relacionadas se contradicen",
          "Completitud — faltan datos",
          "Frescura — los datos están obsoletos",
          "Unicidad — algo está duplicado",
        ],
        explanation:
          "Ambos valores existen, están frescos, y son individualmente plausibles — solo se contradicen. Las violaciones de consistencia se encuentran con consultas de *reconciliación* que comparan los dos lados (lección 3).",
      },
      {
        question: "¿Qué fallo es el más peligroso, y por qué?",
        options: [
          "El silencioso que pasa todos los chequeos — p. ej. un cambio de unidad (centavos→dólares) produciendo números de aspecto válido pero incorrectos sobre los que se toman decisiones",
          "Un crash del pipeline — los datos dejan de fluir por completo",
          "Un test de dbt fallido que bloquea un deploy",
          "Una consulta lenta en el dashboard",
        ],
        explanation:
          "Los fallos ruidosos se arreglan; la corrupción silenciosa se *cree*. Por eso los chequeos de exactitud comparan contra referencias independientes (reconciliación, los números de finanzas, conteos del sistema fuente) — los chequeos de validez internos no pueden atrapar una mentira consistente.",
      },
    ],
  },
  constraints: {
    title: "Restricciones: la Primera Línea de Defensa",
    summary: "Deja que la base de datos rechace los datos malos — míralo pasar.",
    blocks: [
      {
        markdown: `# Las restricciones rechazan filas malas en la puerta

Todo lo que declaraste en las lecciones de DDL es un control de calidad de datos que **nunca puede
saltarse, olvidarse, o eludirse en una carrera**:

- \`NOT NULL\` — completitud, por columna
- \`UNIQUE\` / \`PRIMARY KEY\` — unicidad
- \`CHECK (qty > 0)\` — validez
- \`REFERENCES\` (foreign keys) — consistencia referencial

Los bloques de abajo *se supone que fallan* — ese es el punto. La base de datos rechazando una fila
mala al momento de escribir es el chequeo de calidad más barato que desplegarás.

(Matiz del mundo real: la mayoría de los warehouses de analytics — Snowflake, BigQuery, Delta — ¡**no
imponen** restricciones PK/FK! Aceptan el DDL como documentación pero confían en el pipeline. Por eso
existen exactamente los tests de dbt: son la capa de imposición que los warehouses abandonaron.)`,
      },
      { title: "CHECK rechaza valores inválidos" },
      { title: "Las foreign keys rechazan huérfanos" },
      { title: "UNIQUE rechaza la doble carga" },
      {
        question: "Snowflake acepta `PRIMARY KEY` en el DDL pero no lo impone. ¿Qué se sigue para tus pipelines allí?",
        options: [
          "La unicidad ahora es TU trabajo: escrituras MERGE idempotentes + un test de unicidad agendado (estilo dbt) reemplazan la imposición que la base de datos abandonó",
          "Las primary keys son inútiles en los warehouses — omítelas",
          "Snowflake deduplica en silencio al cargar",
          "Solo las cargas de streaming pueden crear duplicados",
        ],
        explanation:
          "Los warehouses cambian imposición por velocidad de carga. Las claves declaradas-pero-no-impuestas aún documentan la intención y ayudan a los optimizadores — pero la garantía se movió a tus patrones de escritura y tests. Saber DÓNDE vive la imposición por plataforma es una pregunta real de entrevista de DE.",
      },
    ],
  },
  reconciliation: {
    title: "Reconciliación y Tests de Datos",
    summary: "Compara los dos lados — hay una discrepancia real en el seed para atrapar.",
    blocks: [
      {
        markdown: `# Reconciliación: confía, pero verifica contra el otro lado

Las restricciones comprueban filas de forma aislada. La **reconciliación** comprueba que dos datasets
que *deberían* coincidir realmente lo hacen:

- conteo de filas de la fuente vs conteo de filas cargadas (completitud)
- valores en staging vs valores en el warehouse para las mismas claves (consistencia)
- totales de hechos vs un sistema independiente (exactitud — p. ej. el libro mayor de finanzas)

La forma es siempre la misma: **une los dos lados por la clave, compara, devuelve los desacuerdos.**
Cero filas = reconciliado.

Tu seed warehouse contiene una discrepancia genuina: una línea de orden fue **re-entregada a staging
con valores distintos** de los que fact_sales cargó antes. Las auditorías de abajo la cazan.`,
      },
      { title: "Auditoría 1 — completitud: ¿todo lo que está en staging también está cargado?" },
      {
        title: "Auditoría 2 — consistencia: encuentra la re-entrega desajustada",
        prompt:
          "Para las líneas de orden presentes en **ambos** `staging.raw_orders` y `fact_sales` (join por `order_id`), devuelve `order_id`, la cantidad en staging como `staged_qty`, y la cantidad cargada como `fact_qty` — **solo donde las cantidades no coinciden**. Ordena por `order_id`. Debe volver exactamente una fila.",
        hints: [
          "El inner join por order_id conserva solo las líneas en ambos lados; `r.qty <> f.qty` encuentra el desacuerdo.",
          "La orden 116 se re-entregó con qty 2 pero la tabla de hechos cargó qty 1 — cuál lado es correcto es una pregunta para la FUENTE, no el pipeline.",
        ],
      },
      {
        title: "Auditoría 3 — consistencia interna de la tabla de hechos",
        prompt:
          "Un invariante de `fact_sales` es `amount = qty * unit_price`. Escribe la auditoría que devuelva `sale_id`, `amount`, y el valor recalculado como `expected` de cada fila que lo viola, ordenado por `sale_id`. (Una tabla sana devuelve cero filas — y eso es un pase.)",
        hints: [
          "`WHERE amount <> qty * unit_price` — el test entero.",
          "Cero filas de vuelta significa que el invariante se cumple; el calificador acepta el resultado vacío (pero con forma correcta).",
        ],
      },
      {
        question: "La Auditoría 2 encontró que staging dice qty=2 y la tabla de hechos dice qty=1 para la orden 116. ¿Cuál es el siguiente movimiento correcto?",
        options: [
          "Revisar el sistema FUENTE por la cantidad verdadera de la orden 116 — la auditoría encontró un desacuerdo, no cuál lado está mal; luego arreglar vía el camino de carga idempotente (MERGE)",
          "Confiar siempre en el valor más nuevo y actualizar la tabla de hechos",
          "Borrar la fila de ambos lados",
          "Promediar las dos cantidades",
        ],
        explanation:
          "La reconciliación detecta; no adjudica. Quizás el cliente aumentó la orden (staging tiene razón), quizás la re-entrega está corrupta (el hecho tiene razón). La verdad de fondo vive aguas arriba — y la corrección debería fluir por el pipeline idempotente normal, no por una edición a mano.",
      },
    ],
  },
  "python-validation": {
    title: "Validación en Python",
    summary: "Chequeos estilo Great Expectations, construidos a mano.",
    blocks: [
      {
        markdown: `# Expectations como código

Frameworks como **Great Expectations**, **Soda** y **pandera** comparten todos un modelo — una
expectation es una función sobre datos que devuelve un veredicto estructurado:

\`\`\`python
result = expect_column_values_between(rows, "qty", 1, 100)
# {"success": False, "failures": [17, 42]}   ← qué filas la rompieron
\`\`\`

Puntos de diseño clave (visibles en cada herramienta seria):

- **Devuelve veredictos, no lances** — una corrida de validación reporta TODOS los fallos, no solo el
  primero (compara: tus auditorías SQL devolviendo todas las filas que violan).
- **Resultados estructurados** — flag de éxito + valores/índices que fallan + un conteo, para que los
  pipelines puedan ramificar (cuarentena, alerta, bloqueo) y los humanos puedan depurar.
- **Suites** — expectations agrupadas por dataset, corridas en el borde (ese borde de Auto Loader /
  ingesta de nuevo).

El patrón entero son ~15 líneas de Python por expectation. Construye dos, luego confía en ti para leer
el fuente de cualquier framework de DQ.`,
      },
      { title: "Una suite de expectations en miniatura" },
      {
        title: "Escribe dos expectations",
        prompt: `Implementa (ambas toman \`rows\`, una lista de dicts, y un nombre de columna \`col\`):

- \`expect_not_null(rows, col)\` — falla para filas donde \`col\` falta del dict **o** es \`None\`.
- \`expect_unique(rows, col)\` — falla para valores que aparecen más de una vez.

Ambas devuelven \`{"success": <bool>, "failures": [...]}\`:
- para \`expect_not_null\`, failures = la lista de **índices de fila** (base 0) que fallaron, en orden;
- para \`expect_unique\`, failures = la **lista ordenada de valores duplicados** (cada uno listado una vez).`,
        hints: [
          "not_null: `enumerate(rows)`; falla cuando `r.get(col) is None` (cubre tanto faltante como None).",
          "unique: cuenta valores (dict o collections.Counter), luego `sorted(v for v, n in counts.items() if n > 1)`.",
        ],
      },
      {
        question: "¿Por qué los frameworks de validación DEVUELVEN reportes de fallo en vez de lanzar en la primera fila mala?",
        options: [
          "Una corrida debería sacar a la luz TODOS los problemas (para depurar y poner en cuarentena), y el pipeline — no el chequeo — decide si bloquear, alertar, o continuar",
          "Las excepciones son demasiado lentas para datasets grandes",
          "Lanzar haría rollback de la transacción de la base de datos",
          "Python no puede lanzar dentro de list comprehensions",
        ],
        explanation:
          "Fail-fast es correcto para bugs de código; los problemas de datos vienen en lotes y necesitan triaje. Separar la detección (la expectation) de la política (bloquear vs advertir vs cuarentena) es la misma división detección-vs-adjudicación que la lección de reconciliación.",
      },
    ],
  },
  observability: {
    title: "Observabilidad de Datos y Respuesta a Incidentes",
    summary: "Frescura, volumen, deriva de esquema — monitorear los pipelines que no puedes testear.",
    blocks: [
      {
        markdown: `# Observabilidad: calidad a lo largo del tiempo

Los tests comprueban lo que *anticipaste*. La observabilidad vigila lo que no — las familias estándar
de monitores (Monte Carlo, Elementary, y compañía convergen aquí):

- **Frescura** — ¿cuándo se actualizó esta tabla por última vez? (tu lección de source-freshness de dbt,
  generalizada a cada tabla)
- **Volumen** — conteos de filas vs el patrón usual: la carga de hoy es 4% de lo normal → algo aguas
  arriba se rompió, aunque el pipeline "tuvo éxito".
- **Deriva de esquema** — columnas añadidas/removidas/re-tipadas en las fuentes: atrápala antes del
  fallo de las 3am, o antes de que \`_rescued_data\` se llene en silencio.
- **Distribución** — la tasa de nulos se dobló, una categoría desapareció, los montos se movieron 10×
  (ese accidente de centavos/dólares): detección de anomalías sobre estadísticas de columna.

## Cuando la alerta se dispara — respuesta a incidentes

1. **Evalúa el radio de explosión** — linaje: ¿qué hay aguas abajo? (lección de Unity Catalog)
2. **Comunica primero** — marca los dashboards / mensajea a los consumidores *antes* de arreglar. Los
   números incorrectos-pero-confiados hacen más daño por hora que los ausentes.
3. **Contén** — pausa los jobs de aguas abajo; pon en cuarentena las particiones malas.
4. **Arregla a través del pipeline** — recargas/backfills idempotentes, nunca UPDATEs manuales en prod
   (son invisibles al linaje e irreproducibles).
5. **Previene** — añade el test/monitor que lo habría atrapado. Cada incidente debería mejorar
   permanentemente tu suite.

Nota el arco de este módulo: restricciones → tests → reconciliación → validación → monitoreo. Cada capa
atrapa lo que la anterior estructuralmente no puede. Ese stack ES "calidad de datos" como práctica.`,
      },
      {
        question: "Todos los tests de dbt pasan, pero el monitor de volumen marca la tabla de órdenes de hoy en 5% del conteo de filas normal. ¿Qué pasó?",
        options: [
          "Un fallo parcial aguas arriba: los tests validan las filas que LLEGARON (unique, not-null…), pero no pueden saber que el 95% de las filas nunca aparecieron — para eso existe exactamente el monitoreo de volumen",
          "Imposible — los tests que pasan significan que los datos están completos",
          "El monitor está mal calibrado; confía en los tests",
          "dbt se saltó los tests",
        ],
        explanation:
          "Los tests son aserciones por-fila/por-tabla; la completitud contra una expectativa de 'cuántos datos suelen existir' necesita una línea base de serie temporal. Tests verdes + datos ausentes es EL fallo silencioso clásico — trata las anomalías de volumen tan en serio como los fallos.",
      },
      {
        question: "Durante un incidente, ¿por qué 'comunica antes de arreglar' es la regla?",
        options: [
          "Cada minuto que los números siguen silenciosamente mal, los consumidores toman decisiones sobre ellos — marcar los dashboards malos detiene el daño de inmediato, mientras que el arreglo puede tomar horas",
          "Desvía la culpa del equipo de datos",
          "Los arreglos no pueden empezar hasta que los stakeholders aprueben",
          "Lo requiere el GDPR",
        ],
        explanation:
          "Los incidentes de datos dañan a través de la *creencia*. Un banner que dice 'cifras de ingreso bajo investigación' cuesta segundos y previene malas decisiones; un arreglo silencioso de tres horas deja pasar una mañana de ellas. La confianza, una vez quemada, es lo caro de reconstruir.",
      },
    ],
  },
};
