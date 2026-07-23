import type { LessonI18n } from "../overlay";

// Spanish overlay for the "SOLID Principles" module (Software Design track). Index-matched;
// text-only (code/tests unchanged).
export const solidEs: Record<string, LessonI18n> = {
  "why-design": {
    title: "¿Por qué principios de diseño?",
    summary: "Acoplamiento, cohesión y el costo real del cambio.",
    blocks: [
      {
        markdown: `# ¿Por qué principios de diseño?

El código se lee y se **cambia** mucho más a menudo de lo que se escribe. La calidad de diseño es
simplemente: *¿qué tan caro es el próximo cambio?* Dos fuerzas lo deciden:

- **Acoplamiento (coupling)** — cuánto una pieza *sabe de* otra. Alto acoplamiento significa que un
  cambio aquí rompe cosas allá.
- **Cohesión (cohesion)** — cuánto el contenido de una pieza *pertenece junto*. Baja cohesión significa
  que cada cambio tiene que tocar este archivo por razones no relacionadas.

**Meta: bajo acoplamiento, alta cohesión.** SOLID son cinco reglas concretas para lograrlo:

| Letra | Principio | En una línea |
|---|---|---|
| **S** | Responsabilidad Única | una razón para cambiar por unidad |
| **O** | Abierto/Cerrado | extiende comportamiento sin editar código que funciona |
| **L** | Sustitución de Liskov | los subtipos deben honrar las promesas del tipo base |
| **I** | Segregación de Interfaces | sin dependencia forzada de métodos que no usas |
| **D** | Inversión de Dependencias | depende de abstracciones, no de detalles concretos |

Esto importa *más* en ingeniería de datos, no menos: los pipelines viven años, las fuentes se
intercambian, los formatos cambian, y el incidente de las 3am siempre está en el job enredado que
nadie se atreve a tocar.`,
      },
      { title: "Siente el acoplamiento" },
      {
        question: "Un módulo tiene alta cohesión cuando…",
        options: [
          "todo lo que contiene cambia junto, por el mismo tipo de razón",
          "importa muchos otros módulos",
          "contiene tanta funcionalidad como sea posible",
          "otros módulos dependen mucho de él",
        ],
        explanation:
          "La cohesión es sobre pertenencia: un `pricing.py` donde cada función es sobre precios es cohesivo. Un `utils.py` con helpers de fechas, strings de SQL y código de email no lo es — razones no relacionadas para cambiar se apilan en un solo lugar.",
      },
      {
        question: "¿Qué cambio señala ALTO acoplamiento?",
        options: [
          "Renombrar un campo del dict de órdenes rompe el reporte, el cargador y el módulo de alertas",
          "Añadir un módulo nuevo requiere escribir tests nuevos",
          "Un bugfix en una función requiere redesplegar el servicio",
          "Dos módulos importan la librería estándar",
        ],
        explanation:
          "El radio de explosión es la señal: cuando un cambio local detona en módulos distantes, esos módulos saben demasiado de los internos de los otros. Los arreglos son interfaces/abstracciones — el resto de este módulo.",
      },
    ],
  },
  "single-responsibility": {
    title: "S — Responsabilidad Única",
    summary: "Una razón para cambiar: divide la god-function en partes cohesivas.",
    blocks: [
      {
        markdown: `# Principio de Responsabilidad Única

> Un módulo/clase/función debe tener **una razón para cambiar**.

"Responsabilidad" = una *fuente de solicitudes de cambio*. El equipo de finanzas cambia la regla de
ingresos; el equipo de plataforma cambia el almacenamiento; los analistas cambian el formato del
reporte. Si los tres caen en la misma función, se pisan entre sí — y no puedes testear uno sin los
otros.

El refactor es casi mecánico:

1. Nombra cada responsabilidad (parsear / validar / calcular / formatear / escribir).
2. Extrae cada una a su propia función o clase.
3. Compónlas en el borde.

Las unidades pequeñas de propósito único son testeables de forma independiente, reutilizables y
seguras de cambiar — el beneficio de cada otro principio se construye sobre este.`,
      },
      { title: "Antes / después" },
      {
        title: "Divide la god-function",
        prompt: `Este job creció hasta ser un solo blob (mira el comentario en el starter). Refactorízalo en
tres funciones de propósito único:

- \`filter_paid(orders)\` → solo las órdenes cuyo \`"status"\` es \`"paid"\`
- \`revenue(orders)\` → la suma de sus valores \`"amount"\`
- \`summary(orders)\` → la cadena \`"<n> paid orders, revenue <r>"\` donde \`n\`
  es el conteo de pagadas y \`r\` el ingreso de las pagadas

\`summary\` debe construirse **llamando a las otras dos**.`,
        hints: [
          "`filter_paid` es una list comprehension con una condición.",
          "`revenue` solo debe sumar `o['amount']` — deja que quien llama decida qué filtrar primero.",
          "En `summary`, llama a `filter_paid` una vez, luego usa `len(...)` y `revenue(...)` sobre el resultado.",
        ],
      },
      {
        question: "¿Qué clase viola SRP más claramente?",
        options: [
          "OrderManager: valida órdenes, las guarda en la BD, envía recibos por email, y renderiza el HTML de admin",
          "OrderValidator: comprueba campos requeridos y rangos de monto",
          "OrderRepository: lee y escribe órdenes al almacenamiento",
          "ReceiptEmailer: formatea y envía emails de recibo",
        ],
        explanation:
          "Cuatro equipos distintos podrían exigir cambios a OrderManager (reglas de negocio, DBA, comunicaciones, frontend). Las otras tres responden cada una a un solo amo — ese es el principio en forma de clase.",
      },
    ],
  },
  "open-closed": {
    title: "O — Abierto/Cerrado",
    summary: "Añade comportamiento añadiendo código, no editando código que funciona.",
    blocks: [
      {
        markdown: `# Principio Abierto/Cerrado

> El software debe estar **abierto a la extensión, cerrado a la modificación**.

El olor es la cadena \`if/elif\` que crece:

\`\`\`python
def export(data, format):
    if format == "csv": ...
    elif format == "json": ...
    elif format == "xml": ...      # cada formato nuevo EDITA esta función
\`\`\`

Cada edición arriesga los formatos que ya funcionaban, y la función se infla para siempre.

El arreglo: define un **punto de extensión** — una forma (interfaz) que las variantes implementan —
y haz que el código central dependa solo de la forma. El nuevo comportamiento llega entonces como una
*nueva clase/función*, y el central nunca cambia. En Python la forma puede ser una clase base, un
\`Protocol\`, o simplemente un callable pasado como argumento.`,
      },
      { title: "Un punto de extensión en vez de una cadena if" },
      {
        title: "Descuentos enchufables",
        prompt: `Construye un checkout que esté cerrado a la modificación, abierto a nuevos tipos de descuento:

- \`PercentDiscount(pct)\` — \`.apply(price)\` devuelve el precio reducido en
  \`pct\` por ciento.
- \`FixedDiscount(amount)\` — \`.apply(price)\` resta \`amount\`, pero nunca
  baja de \`0\`.
- \`checkout(price, discounts)\` — aplica cada descuento **en orden** y
  devuelve el precio final. Debe funcionar con CUALQUIER objeto que tenga \`.apply\`.`,
        hints: [
          "Cada descuento guarda su parámetro en __init__ e implementa apply(price).",
          "checkout es un bucle: `for d in discounts: price = d.apply(price)`.",
          "El test oculto pasa un tipo de descuento totalmente nuevo — eso solo funciona si checkout no sabe nada de las clases concretas.",
        ],
      },
      {
        question: "Tu pipeline debe soportar un nuevo sistema fuente el mes que viene. En un diseño Abierto/Cerrado, eso llega como…",
        options: [
          "una nueva clase Connector que implementa la interfaz existente — cero ediciones al núcleo del pipeline",
          "una nueva rama elif en la función de despacho de fuentes del pipeline",
          "un feature flag dentro del connector existente",
          "una copia del pipeline con la nueva fuente hardcodeada",
        ],
        explanation:
          "El núcleo depende de la *forma* del connector; las fuentes son plug-ins. La versión con cadena if significa re-testear cada fuente existente cada vez que se añade una — el riesgo exacto que OCP elimina.",
      },
    ],
  },
  liskov: {
    title: "L — Sustitución de Liskov",
    summary: "Una subclase debe cumplir las promesas de su clase base — mira una romperlas.",
    blocks: [
      {
        markdown: `# Principio de Sustitución de Liskov

> Donde el código espera un tipo base, **cualquier subtipo debe funcionar** — sin que quien llama
> sepa o le importe cuál recibió.

La herencia promete sustituibilidad. Una subclase rompe LSP cuando:

- **lanza** donde el base tenía éxito (\`NotSupportedError\` en un override),
- **estrecha las entradas** (el base aceptaba cualquier lista; el hijo exige no-vacía),
- **debilita las salidas** (el base garantizaba resultados ordenados; el hijo no),
- silenciosamente **no hace nada** donde el base hacía algo.

La señal clásica: chequeos \`isinstance\` esparcidos por el código que llama — quien llama empezó a
defenderse de su propia jerarquía de tipos.

El arreglo suele ser **reestructurar la jerarquía** para que cada subtipo genuinamente pueda honrar el
contrato (o usar composición en su lugar).`,
      },
      { title: "Mira una subclase romper el contrato" },
      {
        question: "En la demo de arriba, ¿cuál es el arreglo de diseño correcto?",
        options: [
          "No hagas AuditLogStorage un Storage — dale a los stores solo-append su propio tipo (p. ej. AppendOnlyStorage con un contrato append())",
          "Haz que checkpoint() capture PermissionError y salte el save",
          "Añade `if isinstance(storage, AuditLogStorage)` dentro de checkpoint()",
          "Haz que save() devuelva False en vez de lanzar",
        ],
        explanation:
          "Si un subtipo *no puede* cumplir la promesa, no es un subtipo — la jerarquía está mal, no quien llama. Las opciones B y C empujan la defensa a cada llamador para siempre; ese es el impuesto de violar LSP.",
      },
      {
        title: "Arregla la jerarquía de aves",
        prompt: `El clásico: \`Bird.fly()\` + \`Penguin(Bird)\` = un crash esperando en cada bandada.
Reestructúralo:

- \`Bird\` — clase base con \`move()\` que devuelve \`"walking"\`.
- \`FlyingBird(Bird)\` — sobrescribe \`move()\` para devolver \`"flying"\`.
- \`Sparrow(FlyingBird)\` — hereda el vuelo tal cual.
- \`Penguin(Bird)\` — sobrescribe \`move()\` para devolver \`"swimming"\`.

Cada ave debe responder a \`move()\` — ninguna ave lanza, ningún llamador chequea tipos.`,
        hints: [
          "El contrato base debe ser algo que CADA ave pueda honrar: move(), no fly().",
          "Volar es la especialización — pertenece a FlyingBird, no a Bird.",
        ],
      },
    ],
  },
  "interface-segregation": {
    title: "I — Segregación de Interfaces",
    summary: "Muchas interfaces pequeñas le ganan a una gorda — sin métodos falsos forzados.",
    blocks: [
      {
        markdown: `# Principio de Segregación de Interfaces

> Ningún cliente debe ser forzado a depender de métodos que no usa.

El olor: una clase base gorda donde los implementadores dejan la mitad de los métodos como stubs —

\`\`\`python
class Connector:                # "la" interfaz para todo
    def read(self): ...
    def write(self, data): ...
    def stream(self): ...

class S3ReadOnlyConnector(Connector):
    def read(self): ...
    def write(self, data): raise NotImplementedError   # mentira forzada
    def stream(self): raise NotImplementedError        # mentira forzada
\`\`\`

Cada stub \`NotImplementedError\` es a la vez una violación de ISP *y* una mina de LSP.

El arreglo: **divide por capacidad**. Interfaces pequeñas (\`Readable\`, \`Writable\`, \`Streamable\`) que
las clases mezclan y combinan. Python te da dos herramientas limpias: herencia múltiple de bases
pequeñas, y \`typing.Protocol\` (estructural — una clase lo satisface solo por tener los métodos).`,
      },
      { title: "Divide por capacidad + Protocols" },
      {
        title: "Des-engorda la interfaz del trabajador",
        prompt: `Una base \`Worker\` gorda forzaba a los robots a implementar \`eat()\`. Divídela por capacidad:

- \`Workable\` — provee \`work()\` que devuelve \`"working"\`.
- \`Eatable\` — provee \`eat()\` que devuelve \`"eating"\`.
- \`Human(Workable, Eatable)\` — ambas capacidades.
- \`Robot(Workable)\` — trabaja, y **no** tiene ningún atributo \`eat\`.`,
        hints: [
          "Define work() en Workable y eat() en Eatable.",
          "Herencia múltiple de Python: `class Human(Workable, Eatable): pass`.",
        ],
      },
      {
        question: "¿Qué síntoma apunta a una violación de ISP en un código?",
        options: [
          "Varias implementaciones de una interfaz lanzan NotImplementedError (o pass) para el mismo subconjunto de métodos",
          "Una interfaz tiene una sola implementación",
          "Una clase implementa dos interfaces distintas",
          "Los métodos de una interfaz toman muchos parámetros",
        ],
        explanation:
          "Cuando múltiples implementadores consistentemente no pueden honrar los mismos métodos, esos métodos pertenecen a una interfaz *distinta*. La interfaz gorda forzó una dependencia que sus clientes nunca quisieron — esa es la definición de la violación.",
      },
    ],
  },
  "dependency-inversion": {
    title: "D — Inversión de Dependencias",
    summary: "La política de alto nivel no debe importar el detalle de bajo nivel — inyéctalo.",
    blocks: [
      {
        markdown: `# Principio de Inversión de Dependencias

> Los módulos de alto nivel no deben depender de los de bajo nivel. **Ambos deben depender de
> abstracciones.**

Sin él, tu lógica de negocio hardcodea su infraestructura:

\`\`\`python
class ReportJob:
    def run(self):
        db = PostgresClient("prod-host")     # ← ¡construido adentro!
        s3 = S3Client("prod-bucket")         # ← no testeable, no intercambiable
        ...
\`\`\`

No puedes hacer unit-test de \`ReportJob\` sin una base de datos real, y mudarte a un nuevo store
reescribe la lógica de negocio.

**Invertido**: el job declara *qué necesita* (algo con \`fetch()\`, algo con \`save()\`) y lo recibe —
**inyección de dependencias** por el constructor. Producción cablea clientes reales; los tests cablean
fakes. En Python no hace falta framework: los parámetros del constructor SON el mecanismo de inyección.

Este principio es la columna vertebral de los pipelines testeables — y de cada migración "cambia
Postgres por BigQuery" que salió bien.`,
      },
      { title: "Inyección por constructor en acción" },
      {
        title: "Invierte el servicio de reportes",
        prompt: `Construye un publicador de reportes agnóstico al almacenamiento:

- \`MemoryStorage\` — \`.save(name, content)\` guarda en un dict y devuelve \`True\`;
  \`.load(name)\` devuelve el contenido guardado (o \`None\` si no existe).
- \`ReportService(storage)\` — recibe CUALQUIER storage por el constructor.
  \`.publish(name, rows)\` formatea las filas como \`"<n> rows"\` (n = \`len(rows)\`),
  guarda esa cadena bajo \`name\`, y devuelve la cadena formateada.`,
        hints: [
          "MemoryStorage: un dict en __init__; save guarda y devuelve True; load usa .get(name).",
          "ReportService guarda el storage inyectado y llama a self.storage.save(...) en publish.",
        ],
      },
      {
        question: "¿Qué invierte realmente la 'inversión' en la Inversión de Dependencias?",
        options: [
          "La dirección de la dependencia: en vez de política → detalle concreto, ambos apuntan a una abstracción que la política define",
          "El orden en que se importan los módulos",
          "El flujo de control — callbacks en vez de bucles",
          "La jerarquía de clases — los hijos se vuelven padres",
        ],
        explanation:
          "Clásicamente, el código de alto nivel importa el de bajo nivel. DIP voltea la flecha: el alto nivel es dueño de la interfaz ('algo con .send'), y las implementaciones de bajo nivel se conforman a ella. El detalle ahora depende de la abstracción de la política — invertido.",
      },
    ],
  },
  "solid-capstone": {
    title: "Proyecto Final: Refactoriza un Pipeline Enredado",
    summary: "Aplica S, O y D a la vez sobre un blob realista.",
    blocks: [
      {
        markdown: `# Proyecto final

Aquí un blob que todo ingeniero de datos ha heredado:

\`\`\`python
def run(lines):
    total = 0
    for line in lines:
        parts = line.split(",")
        if parts[0] != "" and float(parts[1]) >= 0:      # validación, inline
            amount = float(parts[1])
            if amount > 100:
                amount = amount * 1.1                     # regla de negocio, inline
            total += amount
    return total
\`\`\`

Parseo, validación, transformación y agregación — soldados juntos. Lo reconstruirás como cuatro
unidades pequeñas más una función de composición cuyos **pasos se inyectan**, para que el cambio de
regla de mañana sea una nueva función, no una edición.

Esto es SRP (cuatro unidades), OCP + DIP (el pipeline toma sus pasos como parámetros), todo en ~20 líneas.`,
      },
      {
        title: "El refactor completo",
        prompt: `Reconstruye el blob como partes componibles:

- \`parse_row(line)\` — \`"ana,150"\` → \`{"name": "ana", "amount": 150.0}\`
- \`is_valid(record)\` — \`True\` solo si \`name\` no está vacío **y**
  \`amount >= 0\`
- \`apply_bonus(record)\` — devuelve un dict **nuevo**; si \`amount > 100\`,
  el nuevo monto es \`amount * 1.1\`, si no sin cambios
- \`run_pipeline(lines, parse, valid, transform)\` — parsea cada línea, conserva los
  registros válidos, los transforma, y devuelve la **suma de los amounts**

\`run_pipeline\` debe usar SOLO sus funciones inyectadas — sin llamadas directas a las tres de arriba.`,
        hints: [
          "parse_row: separa por ',', name es parts[0], amount es float(parts[1]).",
          "apply_bonus NO debe mutar su entrada — construye un dict nuevo (p. ej. `{**record, 'amount': ...}`).",
          "run_pipeline: parsear todo → filtrar con valid → mapear con transform → sumar los amounts. ¡Usa solo los parámetros!",
        ],
      },
      {
        question:
          "Próximo sprint: 'las órdenes de fin de semana reciben un bono plano de 5% en su lugar'. En tu diseño refactorizado, ese cambio es…",
        options: [
          "una nueva función transform pasada a run_pipeline — parseo, validación y agregación quedan intactos y no pueden regresar",
          "una edición dentro del bucle de run_pipeline",
          "una subclase de run_pipeline",
          "un nuevo elif en apply_bonus",
        ],
        explanation:
          "Ese es el beneficio entero: el pipeline está cerrado a la modificación, la regla es una estrategia inyectada, y los tests de cada unidad siguen protegiendo las partes que no cambiaron.",
      },
    ],
  },
};
