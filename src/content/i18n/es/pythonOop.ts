import type { LessonI18n } from "../overlay";

// Spanish overlay for the "Python OOP" module. Index-matched to the English lesson blocks;
// only text is translated (code/tests unchanged).
export const pythonOopEs: Record<string, LessonI18n> = {
  "classes-objects": {
    title: "Clases y Objetos",
    summary: "Empaqueta datos + comportamiento: __init__, self, atributos y métodos.",
    blocks: [
      {
        markdown: `# Clases y Objetos

Hasta ahora tus datos (listas, dicts) y tus funciones vivían por separado. Una **clase**
los junta: describe un tipo de objeto — lo que *sabe* (atributos) y lo que *hace* (métodos).

\`\`\`python
class Dataset:
    def __init__(self, name, rows):   # se ejecuta al crear una instancia
        self.name = name              # atributo
        self.rows = rows

    def is_empty(self):               # método — self es ESTA instancia
        return len(self.rows) == 0
\`\`\`

- \`__init__\` es el **inicializador**: recibe el objeto nuevo y vacío como \`self\`
  y rellena sus atributos.
- \`self\` no es magia — es simplemente la instancia, pasada automáticamente:
  \`ds.is_empty()\` es en realidad \`Dataset.is_empty(ds)\`.
- Cada instancia lleva sus **propios** valores de atributos.`,
      },
      { title: "Define una clase, crea instancias" },
      { title: "Las instancias son objetos separados — prueba la vista de Objetos" },
      {
        question: "Dentro de un método, ¿a qué se refiere `self`?",
        options: [
          "A la clase en sí",
          "A la instancia sobre la que se llamó el método",
          "A una copia de la instancia",
          "Al módulo donde se define la clase",
        ],
        explanation:
          "`ds.row_count()` es azúcar para `Dataset.row_count(ds)` — Python pasa la instancia como primer argumento, convencionalmente llamado `self`.",
      },
      {
        title: "Cuenta bancaria",
        prompt: `Construye una clase \`BankAccount\`:

- \`BankAccount(balance)\` guarda el saldo inicial en \`self.balance\`.
- \`.deposit(amount)\` suma al saldo.
- \`.withdraw(amount)\` resta — pero lanza \`ValueError\` si \`amount\` es mayor que el
  saldo actual.`,
        hints: [
          "En `__init__`, asigna el parámetro a la instancia: `self.balance = balance`.",
          "En `withdraw`, comprueba primero: `if amount > self.balance: raise ValueError(...)`.",
        ],
      },
    ],
  },
  "dunder-methods": {
    title: "Métodos Dunder",
    summary: "Haz que tus objetos se sientan nativos: __repr__, __eq__, __len__, operadores.",
    blocks: [
      {
        markdown: `# Métodos dunder ("double underscore")

Los operadores y builtins de Python son ganchos. \`len(x)\` llama a \`x.__len__()\`,
\`a == b\` llama a \`a.__eq__(b)\`, \`a + b\` llama a \`a.__add__(b)\`, y mostrar un objeto
en la consola usa su \`__repr__\`.

Implementa algunos de estos y tu clase se comporta como un tipo nativo:

| Escribes | Python llama |
|---|---|
| \`repr(x)\`, eco en la REPL | \`x.__repr__()\` |
| \`str(x)\`, \`print(x)\` | \`x.__str__()\` (recurre a \`__repr__\`) |
| \`a == b\` | \`a.__eq__(b)\` |
| \`len(x)\` | \`x.__len__()\` |
| \`a + b\` | \`a.__add__(b)\` |
| \`x[i]\` | \`x.__getitem__(i)\` |

Un buen \`__repr__\` muestra cómo reconstruir el objeto: \`Money(9.99, 'USD')\`.`,
      },
      { title: "Money que se imprime, compara y suma" },
      {
        question: "Sin un `__eq__` propio, ¿qué devuelve `Money(10,'USD') == Money(10,'USD')`?",
        options: [
          "True — los atributos coinciden",
          "False — la igualdad por defecto compara identidad (¿son el mismo objeto?)",
          "Lanza TypeError",
          "Compara las cadenas de __repr__",
        ],
        explanation:
          "La igualdad de objetos usa `is` por defecto — el mismo objeto en memoria. Dos instancias separadas nunca son iguales hasta que defines `__eq__`.",
      },
      {
        title: "Un batch que se siente nativo",
        prompt: `Crea una clase \`Batch\` que envuelva una lista de registros:

- \`Batch(records)\` guarda la lista.
- \`len(batch)\` devuelve el número de registros.
- \`batch[i]\` devuelve el i-ésimo registro.
- Dos batches son \`==\` cuando sus registros son iguales.`,
        hints: [
          "Necesitas `__len__`, `__getitem__` y `__eq__`.",
          "`__getitem__(self, i)` puede simplemente devolver `self.records[i]`.",
        ],
      },
    ],
  },
  inheritance: {
    title: "Herencia y super()",
    summary: "Comparte comportamiento con una clase base; sobrescribe y extiende con super().",
    blocks: [
      {
        markdown: `# Herencia

Una subclase **es una** versión especializada de su clase base: hereda cada método
y puede **sobrescribir** los que quiera cambiar. \`super()\` alcanza la versión de la
clase base para que extiendas en vez de reemplazar.

\`\`\`python
class Connector:                    # clase base
    def __init__(self, path):
        self.path = path

    def read(self):
        raise NotImplementedError   # las subclases deben proveerlo

class CsvConnector(Connector):      # subclase
    def __init__(self, path, delimiter=","):
        super().__init__(path)      # ejecuta también el inicializador base
        self.delimiter = delimiter

    def read(self):                 # sobrescritura
        return f"reading {self.path} as CSV ({self.delimiter})"
\`\`\`

Usa herencia cuando la subclase realmente *es* la cosa base y quien la llama puede
tratarlas indistintamente. (El track de Diseño de Software lleva esto mucho más lejos.)`,
      },
      { title: "Subclases tras una sola interfaz" },
      {
        question: "Una subclase define `__init__` pero nunca llama a `super().__init__(...)`. ¿Qué pasa?",
        options: [
          "Python llama al __init__ base automáticamente después",
          "El __init__ base nunca corre — faltan los atributos que habría fijado",
          "Lanza TypeError al definir la clase",
          "Nada cambia; __init__ no se puede sobrescribir",
        ],
        explanation:
          "Definir `__init__` en la subclase reemplaza la versión base. Si la base fija atributos de los que dependes, llama a `super().__init__(...)` explícitamente.",
      },
      {
        title: "Jerarquía de notificadores",
        prompt: `Se te da una clase base (ya en el starter — no la borres). Añade dos subclases:

- \`EmailNotifier(Notifier)\` — \`send(msg)\` devuelve \`"EMAIL: " + msg\`
- \`SlackNotifier(Notifier)\` — \`send(msg)\` devuelve \`"SLACK: " + msg\`, y su
  constructor toma un \`channel\` **además de** \`name\`, guardado como
  \`self.channel\` (mantén \`name\` funcionando vía \`super()\`).`,
        hints: [
          "EmailNotifier solo necesita sobrescribir `send` — puede heredar `__init__` intacto.",
          "El `__init__(self, name, channel)` de SlackNotifier debe llamar a `super().__init__(name)` primero.",
        ],
      },
    ],
  },
  composition: {
    title: "Composición sobre Herencia",
    summary: "Construye objetos con partes (tiene-un) en vez de árboles de clases profundos (es-un).",
    blocks: [
      {
        markdown: `# Composición sobre herencia

La herencia responde "¿qué **es** esto?"; la composición responde "¿qué **tiene** esto?".
Los árboles de herencia profundos se vuelven frágiles rápido — un pipeline que *tiene* una
lista de pasos es mucho más flexible que una subclase \`CsvUppercaseDedupePipeline\` por
cada combinación.

\`\`\`python
class Pipeline:
    def __init__(self, steps):
        self.steps = steps          # TIENE-UNA lista de callables

    def run(self, value):
        for step in self.steps:
            value = step(value)
        return value
\`\`\`

Regla general: usa composición primero. Recurre a la herencia solo cuando quien llama
necesita tratar los objetos indistintamente a través de una interfaz compartida.`,
      },
      { title: "Un pipeline hecho de partes" },
      {
        question: "¿Qué situación pide composición en vez de herencia?",
        options: [
          "Un objeto reporte que necesita un formateador, una fuente de datos y un escritor",
          "Un CsvConnector que es un tipo de Connector",
          "Un SlackNotifier que debe usarse donde se espera un Notifier",
          "Sobrescribir un método de una clase base por lo demás idéntica",
        ],
        explanation:
          "Formateador + fuente + escritor son *partes* — intercambia cualquiera de forma independiente. Eso es tiene-un. Las otras opciones son relaciones genuinas es-un.",
      },
      {
        title: "Pipeline encadenable",
        prompt: `Construye una clase \`Pipeline\` con interfaz fluida:

- \`Pipeline()\` empieza sin pasos.
- \`.add(fn)\` añade un paso **y devuelve el pipeline mismo** para que las llamadas
  se encadenen: \`p.add(f).add(g)\`.
- \`.run(value)\` pasa \`value\` por los pasos en orden y devuelve el resultado.
  Sin pasos, devuelve \`value\` sin cambios.`,
        hints: [
          "Guarda los pasos en una lista creada en `__init__`.",
          "`add` debe terminar con `return self` — eso es lo que hace posible el encadenado.",
        ],
      },
    ],
  },
  dataclasses: {
    title: "Dataclasses y NamedTuples",
    summary: "Elimina el boilerplate: __init__, __repr__, __eq__ automáticos para clases tipo registro.",
    blocks: [
      {
        markdown: `# Dataclasses

La mayoría de las clases de ingeniería de datos son registros: una bolsa de campos con
nombre. \`@dataclass\` escribe \`__init__\`, \`__repr__\` y \`__eq__\` por ti a partir de las
declaraciones de campos.

\`\`\`python
from dataclasses import dataclass, field

@dataclass
class Order:
    id: int
    total: float
    status: str = "pending"          # valor por defecto
    tags: list = field(default_factory=list)  # ¡NUNCA un mutable por defecto directo!

@dataclass(frozen=True)               # inmutable — la asignación lanza error
class Point:
    x: int
    y: int
\`\`\`

- \`field(default_factory=list)\` da a cada instancia su **propia** lista. Un
  \`tags: list = []\` a secas sería compartido por todas las instancias — un bug clásico.
- \`frozen=True\` hace las instancias inmutables (y por tanto hasheables — usables como
  claves de dict, como las tuplas).
- \`typing.NamedTuple\` es la prima ligera: inmutable e iterable como una tupla.`,
      },
      { title: "__init__, __repr__, __eq__ gratis" },
      {
        question: "¿Por qué es peligroso `tags: list = []` en una dataclass (o como argumento por defecto)?",
        options: [
          "Las listas vacías son falsy, así que el campo se omite",
          "El mismo objeto lista se comparte entre todas las instancias que usan el default",
          "Las listas no pueden ser campos de dataclass",
          "Solo falla cuando frozen=True",
        ],
        explanation:
          "Los defaults se evalúan una vez. Cada instancia añadiría a la misma lista. `field(default_factory=list)` construye una lista nueva por instancia — las dataclasses incluso lanzan un error para protegerte.",
      },
      {
        title: "Registro de producto",
        prompt: `Define una dataclass \`Product\` con campos \`name: str\`, \`price: float\` y
\`qty: int\` con default \`1\`, más un método \`total()\` que devuelva \`price * qty\`.`,
        hints: [
          "Decora con `@dataclass` y declara los tres campos con type hints.",
          "Los métodos se definen normalmente dentro del cuerpo de la dataclass.",
        ],
      },
    ],
  },
  "properties-classmethods": {
    title: "Properties, classmethods y staticmethods",
    summary: "Atributos calculados con validación, y constructores alternativos.",
    blocks: [
      {
        markdown: `# Properties y los decoradores de método

**\`@property\`** convierte un método en un acceso estilo atributo — ideal para valores
calculados y para validar escrituras sin cambiar el código de quien llama:

\`\`\`python
class Temperature:
    def __init__(self, celsius):
        self.celsius = celsius            # ¡pasa por el setter de abajo!

    @property
    def celsius(self):
        return self._celsius

    @celsius.setter
    def celsius(self, value):
        if value < -273.15:
            raise ValueError("below absolute zero")
        self._celsius = value

    @property
    def fahrenheit(self):                 # calculado, solo lectura
        return self._celsius * 9 / 5 + 32
\`\`\`

**\`@classmethod\`** recibe la clase (\`cls\`) en vez de una instancia — el idioma para
*constructores alternativos* como \`Dataset.from_csv_line(...)\`.
**\`@staticmethod\`** no recibe ninguno — es una función normal que vive en la clase
por organización.`,
      },
      { title: "Validación + un atributo calculado" },
      {
        question: "¿Cuándo es `@classmethod` la herramienta correcta?",
        options: [
          "Cualquier método que no toque self",
          "Constructores alternativos que crean una instancia desde una forma de entrada distinta",
          "Métodos que no deben ser sobrescritos por subclases",
          "Métodos que necesitan acceso a atributos privados",
        ],
        explanation:
          "`cls(...)` crea una instancia de la clase sobre la que se llama (subclases incluidas) — perfecto para constructores estilo `from_csv_line`, `from_dict`, `from_config`. Un método que no toca ni self ni cls es un @staticmethod.",
      },
      {
        title: "Constructor alternativo",
        prompt: `Construye una clase \`Job\`:

- \`Job(name, minutes)\` guarda ambos atributos.
- Una property de solo lectura \`hours\` devuelve \`minutes / 60\`.
- Un classmethod \`from_string(text)\` parsea \`"name:minutes"\` (ej. \`"etl:90"\`)
  y devuelve un \`Job\`.`,
        hints: [
          "Decora `hours` con `@property` para que se acceda sin paréntesis.",
          "En `from_string`, usa `text.split(':')`, convierte los minutos con `int(...)` y `return cls(name, minutes)`.",
        ],
      },
      {
        title: "POO — los términos que importan",
        cards: [
          { front: "`self`", back: "La instancia sobre la que se llamó el método. Python lo pasa automáticamente; por convención lo nombras `self` como primer parámetro de cada método." },
          { front: "`__init__` vs `__repr__`", back: "`__init__` construye/inicializa una nueva instancia; `__repr__` devuelve la cadena para desarrolladores que se muestra en la REPL y con `repr()`." },
          { front: "Herencia vs composición", back: "Herencia = **es-un** (Dog es un Animal). Composición = **tiene-un** (un Car tiene un Engine). Prefiere composición cuando solo necesitas comportamiento, no identidad." },
          { front: "`super().__init__(...)`", back: "Llama al método de la clase padre — se usa en el `__init__` de una subclase para correr la configuración base antes de añadir la tuya." },
          { front: "`@dataclass`", back: "Autogenera `__init__`, `__repr__` y `__eq__` a partir de atributos de clase tipados — elimina el boilerplate de clases tipo registro." },
          { front: "`@property`", back: "Expone un método como si fuera un atributo (`obj.area`, sin paréntesis) — para valores calculados o validados." },
          { front: "`@classmethod` vs `@staticmethod`", back: "`@classmethod` recibe `cls` (constructores alternativos como `from_string`); `@staticmethod` no recibe ni `self` ni `cls` — solo una función con espacio de nombres." },
        ],
      },
    ],
  },
  abstractions: {
    title: "ABCs, Protocols y Enums",
    summary: "Define interfaces de dos formas (ABCs nominales vs Protocols estructurales) y modela conjuntos fijos con Enum.",
    blocks: [
      {
        markdown: `# Interfaces y conjuntos de valores fijos

Tres herramientas para expresar *contratos* en tus tipos:

**Abstract Base Classes (\`abc\`)** — declaran métodos que una subclase **debe**
implementar. Una ABC no se puede instanciar directamente, y olvidar un
\`@abstractmethod\` es un error al construir. Esto es tipado **nominal**: te adhieres
*heredando*.

**Protocols (\`typing.Protocol\`)** — tipado **estructural** (duck typing estático).
Cualquier objeto con los métodos correctos satisface el protocolo — sin herencia. Ideal
para "cualquier cosa con un \`.area()\`" sin forzar una clase base sobre tipos ajenos.

**Enums (\`enum.Enum\`)** — un conjunto fijo de constantes con nombre (estados, prioridades,
direcciones). Más seguro y legible que cadenas sueltas o números mágicos, e iterable.

| | Te adhieres por | Se comprueba | Úsalo cuando |
|---|---|---|---|
| **ABC** | herencia | al instanciar | eres dueño de la jerarquía y quieres imponerla |
| **Protocol** | solo tener los métodos | con el type checker | aceptas tipos que no controlas |`,
      },
      { title: "Una ABC que no puedes instanciar hasta completarla" },
      { title: "Un Protocol: tipado estructural, sin herencia" },
      { title: "Enum: un conjunto fijo de valores con nombre" },
      {
        question: "¿Cuál es la diferencia clave entre una abstract base class y un `typing.Protocol`?",
        options: [
          "Una ABC impone la interfaz vía herencia (nominal); un Protocol matchea cualquier objeto que tenga los métodos correctos (estructural).",
          "Son dos nombres para la misma característica.",
          "Los Protocols requieren herencia; las ABCs no.",
          "Solo las ABCs pueden declarar firmas de métodos.",
        ],
        explanation:
          "Las ABCs son nominales — un tipo cumple heredando e implementando los métodos abstractos, comprobado al instanciar. Los Protocols son estructurales — cualquier objeto con métodos coincidentes los satisface, comprobado por el type checker sin herencia.",
      },
      {
        title: "Modela la prioridad como un Enum",
        prompt:
          "Define una subclase de `enum.Enum` llamada `Priority` con tres miembros: `LOW = 1`, `MEDIUM = 2`, `HIGH = 3`.",
        hints: [
          "Dentro del cuerpo de la clase, asigna cada miembro: `LOW = 1`, y así.",
          "Los miembros de Enum se declaran como atributos de clase normales con su valor.",
        ],
      },
    ],
  },
};
