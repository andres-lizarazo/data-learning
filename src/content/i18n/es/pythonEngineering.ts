import type { LessonI18n } from "../overlay";

// Spanish overlay for the "Python Engineering" module. Index-matched; text-only.
export const pythonEngineeringEs: Record<string, LessonI18n> = {
  "type-hints": {
    title: "Type Hints",
    summary: "Anotaciones que documentan, que los editores comprueban, que los bugs temen.",
    blocks: [
      {
        markdown: `# Type hints

Python sigue siendo dinámico — los hints no cambian el comportamiento en runtime — pero te dan:

- **documentación que no se queda obsoleta** (vive en la firma),
- **superpoderes del editor** (autocompletado, refactors), y
- **chequeo estático** (mypy/pyright cazan bugs antes de correr cualquier test).

\`\`\`python
def load_orders(path: str, limit: int | None = None) -> list[dict[str, float]]:
    ...
\`\`\`

El vocabulario que cubre el 95% del código real:

| Hint | Significa |
|---|---|
| \`int | None\` | valores que pueden faltar (el antiguo \`Optional[int]\`) |
| \`list[str]\`, \`dict[str, float]\` | contenedores tipados |
| \`tuple[int, str]\` | tuplas de forma fija |
| \`Callable[[int], str]\` | una función que toma int y devuelve str |
| \`TypedDict\` | un dict con claves/tipos conocidos (¡datos con forma de registro!) |
| \`Protocol\` | interfaces estructurales — tu lección de ISP, comprobada estáticamente |

Para un ingeniero de datos el beneficio se concentra en los **límites**: funciones que
pasan registros de un lado a otro. \`dict\` no dice nada; \`OrderRecord\` (un TypedDict) lo
dice todo.`,
      },
      { title: "Los hints en acción (y lo que no hacen)" },
      {
        question: '`def f(x: int) -> str` se llama como `f("hello")` y corre sin error. ¿Por qué?',
        options: [
          "Los hints son metadatos: Python los ignora en runtime — solo un chequeador estático (mypy/pyright) o el editor reporta el desajuste",
          "Python convirtió automáticamente la cadena a int",
          "La anotación era sintácticamente inválida así que se omitió",
          "Daría error — las funciones anotadas validan los argumentos",
        ],
        explanation:
          "El tipado gradual es el trato de Python: las anotaciones son opcionales, se comprueban aparte y son gratis en runtime. (Librerías como pydantic *eligen* imponerlas en runtime — esa es la lección de validación más adelante.)",
      },
      {
        question: "Una función puede devolver un dict de usuario O nada-encontrado. La firma honesta es…",
        options: [
          "def find_user(uid: int) -> User | None — quien llama está obligado a manejar el caso None",
          "def find_user(uid: int) -> User — devuelve {} cuando falta",
          "def find_user(uid) — sin hint se evita el problema",
          "def find_user(uid: int) -> object",
        ],
        explanation:
          "`| None` hace que la ausencia sea parte del contrato, y los chequeadores rechazan código que use el resultado sin comprobarlo. Las alternativas deshonestas (dicts vacíos, Nones ocultos) se vuelven el crash de NoneType-no-tiene-atributo tres módulos después.",
      },
    ],
  },
  "errors-done-right": {
    title: "Errores Bien Hechos",
    summary: "Excepciones propias, raise-from, y fallar fuerte con contexto.",
    blocks: [
      {
        markdown: `# Manejo de errores más allá de try/except

Lo básico ya lo sabes; el código de producción añade tres hábitos:

**1. Tipos de excepción propios** — para que quien llama pueda capturar TUS fallos con precisión:

\`\`\`python
class ConfigError(Exception):
    """Configuración de pipeline mala o ausente."""

try:
    cfg = parse_config(text)
except ConfigError:      # captura exactamente esto — no cualquier bug de parse_config
    use_defaults()
\`\`\`

**2. \`raise ... from err\`** — traduce errores de bajo nivel sin destruir la evidencia:

\`\`\`python
try:
    value = int(raw)
except ValueError as err:
    raise ConfigError(f"port must be a number, got {raw!r}") from err
\`\`\`

El traceback muestra AMBOS: tu error de dominio y la causa original debajo.

Fíjate en el \`!r\` dentro de \`{raw!r}\` — llama a \`repr()\` sobre el valor en vez de
\`str()\`, así \`"eighty"\` se imprime como \`'eighty'\` (con comillas). Esa precisión extra
importa en los mensajes de error: es la diferencia entre "got " (un blanco que no puedes
depurar) y "got '  '" (ajá, espacio en blanco al final).

**3. Captura estrecho, falla fuerte.** \`except Exception: pass\` es como los pipelines
"tienen éxito" con la mitad de los datos (los fallos silenciosos del módulo de Calidad de
Datos). Captura el tipo específico que realmente puedes manejar; deja que el resto rompa
la tarea — el retry del orquestador existe exactamente para eso.`,
      },
      { title: "El encadenado de excepciones preserva la evidencia" },
      {
        title: "Un parser de config con errores de verdad",
        prompt: `Construye un pequeño parser de config:

- Define \`class ConfigError(Exception)\`.
- \`parse_config(text)\` — \`text\` tiene un par \`key=value\` por línea (salta líneas
  vacías). Todo valor debe parsear como **int**. Devuelve un dict \`{key: int}\`.
- Una línea sin \`=\` lanza \`ConfigError\` mencionando la línea.
- Un valor no entero lanza \`ConfigError\` **encadenado desde** el \`ValueError\`
  original (usa \`raise ... from err\`).`,
        hints: [
          "Recorre text.splitlines(); `if not line.strip(): continue`.",
          "`if '=' not in line: raise ConfigError(...)`; si no, separa por '=' una vez.",
          "Envuelve `int(value)` en try/except ValueError y relanza `from err`.",
        ],
      },
      {
        question: "Una tarea de pipeline envuelve todo su cuerpo en `except Exception: log.warning(...)` y retorna normal. ¿Cuál es la consecuencia operativa?",
        options: [
          "El orquestador ve éxito: sin retry, sin alerta, lo de aguas abajo corre con datos ausentes/parciales — el fallo se lava en silencio",
          "La tarea reintenta para siempre",
          "Fugas de memoria por excepciones no lanzadas",
          "Nada — loguear equivale a fallar",
        ],
        explanation:
          "Los reintentos, alertas y bloqueos aguas abajo dependen de que la tarea FALLE. Tragarse las excepciones desactiva toda la maquinaria de fiabilidad que configuraste. Rompe fuerte; para eso está.",
      },
    ],
  },
  generators: {
    title: "Iteradores y Generadores",
    summary: "yield: procesa un millón de filas sin retener un millón de filas.",
    blocks: [
      {
        markdown: `# Generadores

Una función con \`yield\` devuelve un **generador**: produce valores uno a la vez,
*bajo demanda*, manteniendo solo su estado actual en memoria.

\`\`\`python
def read_events(lines):
    for line in lines:
        yield parse(line)        # un evento en memoria a la vez
\`\`\`

Por qué este es EL idioma del procesamiento de datos:

- **Memoria constante**: un archivo de 10 GB fluye por un pipeline que nunca retiene
  más de un registro.
- **Componibilidad**: los generadores se encadenan en pipelines perezosos —
  \`total(valid(parse(lines)))\` — donde nada se calcula hasta que se consume.
  (Las transformaciones perezosas de Spark son esta idea, a tamaño de clúster.)
- **Salida temprana gratis**: \`next()\` / romper un bucle detiene toda la cadena
  aguas arriba — sin trabajo desperdiciado.

Un filo peligroso: los generadores son de **un solo uso**. Itera dos veces y la
segunda pasada no ve nada.`,
      },
      { title: "Mira la evaluación perezosa" },
      { title: "Un pipeline perezoso con memoria constante" },
      {
        title: "Implementa chunked()",
        prompt: `Cargar filas de una en una es lento; cargarlas todas de golpe revienta la memoria.
El camino intermedio clásico: lotes. Escribe la **función generadora** \`chunked(items, size)\`
que va entregando listas consecutivas de hasta \`size\` elementos (el último lote puede
ser más pequeño).`,
        hints: [
          "Acumula en una lista lote; `yield` cuando len(batch) == size y empieza de nuevo.",
          "Después del bucle, entrega el lote sobrante si no está vacío.",
        ],
      },
      {
        question: "`data = (parse(l) for l in lines)` y luego `list(data)` dos veces — la segunda lista está vacía. ¿Por qué?",
        options: [
          "Los generadores son iteradores de un solo disparo: el primer list() consumió todos los valores; el generador agotado no tiene nada más",
          "La expresión generadora tenía un error de sintaxis",
          "list() borra los datos de origen",
          "Las expresiones generadoras se limitan a una evaluación por ámbito",
        ],
        explanation:
          "¿Necesitas varias pasadas? Materializa una vez (`rows = list(gen)`) o reconstruye el generador. Esto le muerde a todo el mundo exactamente una vez — normalmente en una sesión de depuración donde el print se 'comió' los datos.",
      },
    ],
  },
  "context-managers": {
    title: "Context Managers",
    summary: "Bloques with: limpieza garantizada — y luego construye el tuyo.",
    blocks: [
      {
        markdown: `# Context managers

\`with\` garantiza el setup/teardown alrededor de un bloque — **incluso cuando lanza**:

\`\`\`python
with open("data.csv") as f:     # el archivo se cierra pase lo que pase
    process(f)
\`\`\`

Cualquier cosa con \`__enter__\` / \`__exit__\` funciona:

\`\`\`python
class Timer:
    def __enter__(self):
        self.start = time.perf_counter()
        return self                              # ligado al nombre del as

    def __exit__(self, exc_type, exc, tb):
        self.elapsed = time.perf_counter() - self.start
        return False                             # False = no tragarse los errores
\`\`\`

O el atajo para casos simples:

\`\`\`python
from contextlib import contextmanager

@contextmanager
def timer():
    start = time.perf_counter()
    yield                                        # ← aquí corre el bloque with
    print(f"took {time.perf_counter() - start:.3f}s")
\`\`\`

Usos en ingeniería de datos por todas partes: conexiones y cursores, transacciones
(commit al éxito / rollback al error — tu reto), recursos temporales, bloques de
temporización, \`pytest.raises\`.`,
      },
      { title: "La limpieza sobrevive a las excepciones" },
      {
        title: "Un dict transaccional",
        prompt: `Construye \`Transaction\` — un context manager que da semántica de todo-o-nada
sobre un dict:

- \`Transaction(store)\` envuelve un dict.
- \`__enter__\` toma una instantánea del contenido actual del dict y devuelve \`store\`
  (para que el bloque with lo mute directamente).
- \`__exit__\`: si el bloque lanzó, **restaura la instantánea** (rollback) y deja que
  la excepción se propague; si tuvo éxito, conserva los cambios.`,
        hints: [
          "En `__enter__`, guarda una copia: `self.snapshot = dict(store)` y `return store`.",
          "En `__exit__`, si `exc_type is not None`, restaura: `store.clear(); store.update(self.snapshot)`.",
          "Devuelve `False` para no tragarte la excepción.",
        ],
      },
      {
        question: "¿Qué hace devolver True desde `__exit__` — y por qué suele ser un error?",
        options: [
          "SE TRAGA la excepción (el error del bloque with nunca se propaga) — un True general convierte cada bug en silencio, el anti-patrón except-pass disfrazado",
          "Relanza la excepción con más contexto",
          "Marca el recurso como cerrado correctamente",
          "Reintenta el bloque with una vez",
        ],
        explanation:
          "Devuelve True solo para excepciones específicas y esperadas que realmente manejas (contextlib.suppress existe para eso). Por defecto False/None: limpia y quítate de en medio.",
      },
    ],
  },
  decorators: {
    title: "Decoradores",
    summary: "Envuelve una función para añadir comportamiento — logging, timing, caching — sin tocarla.",
    blocks: [
      {
        markdown: `# Decoradores

Un **decorador** es una función que toma una función y devuelve una función nueva que la
*envuelve* — añadiendo comportamiento antes/después, sin editar la original. Ya los has
*usado*: \`@property\`, \`@dataclass\`, \`@lru_cache\`. Ahora vas a *escribir* uno.

La forma es siempre la misma: define un \`wrapper\` interno, llama a la original dentro,
y devuelve \`wrapper\`.

\`\`\`python
import functools

def log_calls(fn):
    @functools.wraps(fn)          # conserva nombre/docstring de fn en el wrapper
    def wrapper(*args, **kwargs):  # acepta CUALQUIER argumento y los reenvía
        print(f"calling {fn.__name__}")
        result = fn(*args, **kwargs)
        print(f"{fn.__name__} -> {result!r}")
        return result
    return wrapper

@log_calls              # igual que: greet = log_calls(greet)
def greet(name):
    return f"hi {name}"
\`\`\`

Dos cosas lo hacen general:

- **\`*args, **kwargs\`** dejan que el wrapper acepte y reenvíe cualquier argumento que
  tome la función envuelta — así un decorador funciona sobre cualquier firma.
- **\`functools.wraps(fn)\`** copia el nombre y docstring de \`fn\` en \`wrapper\`, para que
  la función decorada no se haga pasar por \`wrapper\` en los tracebacks y en \`help()\`.`,
      },
      { title: "Un decorador de temporización" },
      {
        title: "Escribe @count_calls",
        prompt: `Escribe un decorador \`count_calls\` que registre cuántas veces se ha llamado la
función envuelta, expuesto como un atributo \`.calls\` en la función decorada.

- El wrapper debe reenviar todos los argumentos y devolver el resultado original.
- Antes de la primera llamada, \`.calls\` es \`0\`; incrementa en 1 en cada llamada.`,
        hints: [
          "Define `wrapper(*args, **kwargs)` dentro de `count_calls`, decóralo con `@functools.wraps(fn)`, y `return wrapper` al final.",
          "Guarda el conteo EN el wrapper mismo: pon `wrapper.calls = 0` antes de devolverlo.",
          "Dentro del wrapper, haz `wrapper.calls += 1`, luego `return fn(*args, **kwargs)`.",
        ],
      },
      {
        question: "¿Por qué los decoradores de producción envuelven con `@functools.wraps(fn)`?",
        options: [
          "Copia el nombre y docstring de la función envuelta en el wrapper, para que los tracebacks y help() sigan identificando la función real",
          "Hace que el decorador corra más rápido",
          "Es sintaxis obligatoria — el decorador da error sin ello",
          "Cachea los valores de retorno de la función",
        ],
        explanation:
          "Sin `functools.wraps`, la función decorada se reporta como `wrapper` sin docstring, lo que enturbia la depuración y la introspección. Es cosmético-pero-importante, no obligatorio para que el decorador corra.",
      },
    ],
  },
  "files-pathlib": {
    title: "Archivos y pathlib",
    summary: "I/O de archivos real — leer, escribir, CSVs, y rutas como objetos.",
    blocks: [
      {
        markdown: `# Archivos, a la manera moderna

(Pyodide te da un sistema de archivos real en memoria — todo esto corre de verdad.)

**pathlib** trata las rutas como objetos, reemplazando la cirugía de cadenas de os.path:

\`\`\`python
from pathlib import Path

p = Path("data") / "raw" / "orders.csv"    # unir con /
p.parent.mkdir(parents=True, exist_ok=True)
p.write_text("id,amount\\n1,99.5\\n")        # archivos diminutos: una línea
text = p.read_text()
p.suffix, p.stem                            # ".csv", "orders"
list(Path("data").glob("**/*.csv"))         # encontrar archivos recursivamente
\`\`\`

Para algo más grande que una línea, \`open\` dentro de \`with\` (context managers —
ya sabes por qué), y el módulo **csv** en vez de un \`split(",")\` ingenuo (los CSV
reales tienen comas entre comillas):

\`\`\`python
import csv
with open(p, newline="") as f:
    for row in csv.DictReader(f):           # {"id": "1", "amount": "99.5"}
        ...
\`\`\`

Nota: \`csv\` te da **cadenas** — la conversión de tipos es tu trabajo (o de pandas,
cuyo \`read_csv\` lo hace a escala).`,
      },
      { title: "Un ida y vuelta: escribir, descubrir, leer, agregar" },
      {
        title: "Escribe y lee un reporte",
        prompt: `Dos funciones (deben hacer ida-y-vuelta por un archivo real):

- \`write_report(path, rows)\` — \`rows\` es una lista de tuplas \`(name, amount)\`.
  Escribe una línea \`name,amount\` por fila en el archivo de \`path\`. Devuelve el
  número de filas escritas.
- \`read_total(path)\` — lee el archivo de vuelta y devuelve la **suma de los
  amounts** como float (0.0 para un archivo vacío).`,
        hints: [
          "El modo de escritura 'w' trunca — eso es lo que hace limpias las reescrituras.",
          "Escribir: `f.write(f\"{name},{amount}\\n\")` por fila, dentro de `with open(path, 'w') as f`.",
          "Leer: separa cada línea no vacía por ',' y suma float(parts[1]).",
        ],
      },
      {
        question: "¿Por qué parsear CSVs con `line.split(',')` acaba corrompiendo datos?",
        options: [
          'Los campos entre comillas contienen comas legalmente (`"Bogotá, DC"`) — el split ingenuo los parte; el módulo csv maneja comillas/escapes correctamente',
          "split() es demasiado lento para archivos",
          "Los archivos CSV usan punto y coma, nunca comas",
          "No lo hace — split es exactamente lo que csv hace internamente",
        ],
        explanation:
          "La bomba de tiempo clásica: funciona en cada test, se rompe el día que una dirección o nombre de producto contiene una coma — desplazando en silencio cada columna siguiente. Usa csv.DictReader (o pandas). Lo mismo con JSON, fechas, encodings hechos a mano…",
      },
    ],
  },
  testing: {
    title: "Testing con pytest",
    summary: "Arrange-act-assert, parametrización, fixtures — y construye un mini test runner.",
    blocks: [
      {
        markdown: `# pytest en una lección

Un test es una función llamada \`test_*\` que hace aserciones; pytest las encuentra
y las corre todas:

\`\`\`python
# test_pricing.py
def test_discount_applies_over_100():
    order = make_order(amount=150)          # Arrange
    total = price(order)                    # Act
    assert total == 135.0                   # Assert

def test_negative_amount_rejected():
    with pytest.raises(ValueError):         # aseverar sobre ERRORES
        price(make_order(amount=-5))
\`\`\`

Las características potentes que usarás cada semana:

- **Parametrizar** — un test, muchos casos:
  \`@pytest.mark.parametrize("amount,expected", [(150, 135.0), (100, 100.0), (0, 0.0)])\`
- **Fixtures** — setup compartido y componible con limpieza:
  \`def test_load(tmp_path): ...\` (pytest inyecta un dir temporal fresco — ¡inyección
  de dependencias, otra vez!).

Qué testear en código de datos: las **transformaciones puras** (tu arquitectura las hizo
fáciles — valores planos entran, valores planos salen), los **casos límite** (entrada
vacía, una fila, duplicados, Nones), y el **comportamiento de fallo** (mala entrada lanza
el error correcto). Los retos in-app que has resuelto usan exactamente esta maquinaria:
las aserciones corren contra tu código.`,
      },
      { title: "La idea entera, ejecutable" },
      {
        title: "Construye el mini test runner",
        prompt: `Formaliza ese bucle: escribe \`run_tests(tests)\` donde \`tests\` es una lista de
callables.

- Llama a cada uno. Sin excepción = pasa. \`AssertionError\` = falla. Cualquier **otra**
  excepción = error.
- Devuelve \`{"passed": [...], "failed": [...], "errors": [...]}\` — cada uno una lista
  de los \`__name__\` de los callables, en el orden dado.`,
        hints: [
          "try / except AssertionError / except Exception — el orden importa (¡AssertionError primero!).",
          "Añade `fn.__name__` al bucket correcto; nunca dejes que una excepción escape del bucle.",
        ],
      },
      {
        question: "pytest distingue FAILED (aserción falsa) de ERROR (excepción inesperada). ¿Por qué importa la distinción?",
        options: [
          "Un fallo significa que el COMPORTAMIENTO del código está mal; un error significa que el test nunca llegó a comprobar nada (setup/fixture roto) — se depuran de forma completamente distinta",
          "Los errores se cuentan doble en el resumen",
          "Los fallos se re-ejecutan automáticamente, los errores no",
          "Es cosmético — ambos significan 'rojo'",
        ],
        explanation:
          "Una aserción que falla es información sobre el producto; un test que da error es información sobre el TEST. Arreglar el equivocado desperdicia la tarde — tu run_tests codifica ese mismo triaje.",
      },
    ],
  },
  validation: {
    title: "Validar Datos con Esquemas",
    summary: "La idea de pydantic, hecha a mano: declara la forma, imponla en el límite.",
    blocks: [
      {
        markdown: `# Validación de esquemas

Los type hints comprueban tu CÓDIGO estáticamente. Pero los datos que llegan en runtime —
payloads de API, filas de CSV, mensajes de cola — necesitan imposición en **runtime**. Ese
es el trabajo de **pydantic**:

\`\`\`python
from pydantic import BaseModel

class Order(BaseModel):
    id: int
    amount: float
    status: str = "pending"

Order(id="7", amount="99.5")     # coacciona cadenas limpias → Order(id=7, amount=99.5)
Order(id="x", amount=1)          # lanza ValidationError, señalando 'id'
\`\`\`

Declara la forma una vez; cada construcción valida. FastAPI, los artefactos de dbt y
media parte del ecosistema Python moderno corren sobre esto.

El mecanismo no es magia: **comprueba cada campo contra un esquema declarado, recoge lo
que está mal.** Ya escribiste la versión por-columna (Calidad de Datos); ahora la versión
por-registro — la última pieza es nombrar qué campos fallaron, para que el mensaje de
error haga la depuración por ti.`,
      },
      { title: "Un validador estilo pydantic en 25 líneas" },
      {
        title: "Escribe validate()",
        prompt: `Generalízalo: \`validate(record, schema)\` donde \`schema\` mapea nombres de campo a
tipos.

- Devuelve una **lista ordenada de nombres de campo** inválidos: o **ausentes** del
  registro o del **tipo equivocado**.
- Los campos extra en el registro están bien (ignóralos).
- Devuelve \`[]\` para un registro totalmente válido.`,
        hints: [
          "Itera sobre schema.items(), no sobre el registro — el esquema define qué se requiere.",
          "Inválido = `field not in record or not isinstance(record[field], expected)`.",
          "Devuelve `sorted(bad_fields)`.",
        ],
      },
      {
        question: "¿Dónde en un pipeline rinde más la validación de esquema, y por qué ahí?",
        options: [
          "En la ingesta — el límite por donde entran datos no confiables: rechazar/poner en cuarentena los registros malos temprano evita que corrompan cada capa aguas abajo",
          "En el dashboard, donde los usuarios ven los datos",
          "En ningún lado — los tipos de la base de datos son validación suficiente",
          "Repartida por igual en cada función",
        ],
        explanation:
          "El principio de 'comprueba en los límites': un borde validado significa que todo lo de dentro puede confiar en sus entradas (y saltarse re-comprobarlas). Es el espejo en runtime de tipar los límites de tus funciones — y cierra el círculo con el módulo de Calidad de Datos.",
      },
      {
        title: "Python de producción — hábitos",
        cards: [
          { front: "`raise NewError(...) from err`", back: "Encadena excepciones: el traceback muestra tu error de dominio y la causa original. Nunca te tragues la causa raíz." },
          { front: "Por qué `except Exception: pass` es peligroso", back: "Lava el fallo en éxito silencioso — el pipeline 'tiene éxito' con datos ausentes/parciales, sin retry, sin alerta. Captura estrecho, falla fuerte." },
          { front: "generador vs lista", back: "Un generador (`yield`, o `(x for x in ...)`) produce elementos perezosamente, uno a la vez — memoria constante sobre un flujo enorme/infinito. Una lista los materializa todos." },
          { front: "Context manager (`with`)", back: "Garantiza setup/teardown incluso ante excepciones (`with open(...) as f:` cierra el archivo). Escribe el tuyo con `@contextmanager` + `yield`." },
          { front: "Type hint `x: int | None`", back: "Documenta que el valor puede faltar; un type checker obliga a quien llama a manejar el caso None. Las anotaciones son gratis en runtime." },
          { front: "Básicos de pytest", back: "Sentencias `assert` normales en funciones `test_*`; pytest las reescribe para mostrar los valores al fallar. Los fixtures inyectan setup (ej. `tmp_path`)." },
        ],
      },
    ],
  },
};
