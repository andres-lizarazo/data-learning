import type { LessonI18n } from "../overlay";

// Spanish overlay for the "Core Libraries" module. Index-matched; text-only.
export const librariesEs: Record<string, LessonI18n> = {
  "collections-itertools": {
    title: "collections e itertools",
    summary: "Counter, defaultdict, deque e iteradores perezosos.",
    blocks: [
      {
        markdown: `# collections e itertools

La librería estándar tiene herramientas potentes que te ahorran reinventar la rueda.

- \`Counter\` — cuenta elementos hasheables al instante
- \`defaultdict\` — dicts con valores por defecto
- \`deque\` — appends/pops O(1) en ambos extremos
- \`itertools\` — \`chain, groupby, combinations, accumulate\`, …`,
      },
      { title: "Counter y defaultdict" },
      { title: "itertools" },
      {
        title: "Elemento más común",
        prompt:
          "Devuelve el único elemento más común en `items` (cualquier ganador vale en empates). Pista: `collections.Counter`.",
        hints: [
          "`Counter(items)` cuenta cuántas veces aparece cada valor en una línea.",
          "`.most_common(1)` devuelve `[(value, count)]` del elemento top — el índice `[0][0]` extrae solo el valor.",
        ],
      },
    ],
  },
  "datetime-random-json": {
    title: "datetime, random y json",
    summary: "Fechas, aleatoriedad y (de)serialización.",
    blocks: [{ title: "datetime" }, { title: "random y json" }],
  },
  "math-statistics": {
    title: "math y statistics",
    summary: "Funciones matemáticas comunes y estadística descriptiva.",
    blocks: [
      {
        markdown: `# math y statistics

El módulo \`math\` tiene constantes y funciones; \`statistics\` cubre estadística descriptiva
sin necesitar NumPy.

\`\`\`python
import math
math.sqrt(16)     # 4.0
math.gcd(12, 18)  # 6
math.factorial(5) # 120
math.pi, math.e

import statistics as st
st.mean([1, 2, 3, 4])    # 2.5
st.median([1, 2, 3, 4])  # 2.5
st.stdev([1, 2, 3, 4])   # desviación estándar muestral
\`\`\``,
      },
      { title: "Pruébalas" },
      {
        title: "Media y mediana",
        prompt:
          "Devuelve una tupla `(mean, median)` de los números en `nums` usando el módulo `statistics`.",
        hints: [
          "El módulo `statistics` lo tiene incorporado — sin cálculos manuales.",
          "Devuelve ambos como tupla: `(st.mean(nums), st.median(nums))`.",
        ],
      },
    ],
  },
  functools: {
    title: "functools",
    summary: "reduce, lru_cache y partial.",
    blocks: [
      {
        markdown: `# functools

- \`reduce(fn, iterable, initial)\` — pliega una secuencia en un solo valor.
- \`@lru_cache\` — memoiza una función automáticamente (genial para recursión/DP).
- \`partial(fn, *args)\` — pre-rellena algunos argumentos.

\`\`\`python
from functools import reduce, lru_cache, partial

reduce(lambda a, b: a * b, [1, 2, 3, 4], 1)   # 24

@lru_cache
def fib(n):
    return n if n < 2 else fib(n-1) + fib(n-2)

add = lambda a, b: a + b
inc = partial(add, 1)   # inc(5) -> 6
\`\`\``,
      },
      { title: "Fibonacci memoizado" },
      {
        title: "Producto vía reduce",
        prompt:
          "Devuelve el producto de todos los números en `nums` usando `functools.reduce`. El producto de una lista vacía es `1`.",
        hints: [
          "`reduce(fn, iterable, initial)` pliega una función de dos argumentos sobre la secuencia, arrastrando un acumulador.",
          "Multiplica pares con `lambda a, b: a * b`, y empieza el acumulador en `1` para que una lista vacía devuelva 1.",
        ],
      },
      {
        question: "Necesitas contar ocurrencias de cada elemento en una lista. La herramienta más limpia es…",
        options: [
          "collections.Counter(items)",
          "functools.reduce sobre la lista",
          "sorted(items) y luego contar a mano",
          "itertools.count()",
        ],
        explanation:
          "`Counter` está hecho para contar — `Counter(items)` da un dict-like de conteos, más `.most_common(n)`. `itertools.count()` es un contador infinito (no relacionado), y reduce/sorted son trabajo innecesario aquí.",
      },
    ],
  },
  regex: {
    title: "Expresiones Regulares (re)",
    summary: "Buscar, extraer y reemplazar patrones de texto con el módulo re.",
    blocks: [
      {
        markdown: `# Coincidencia de patrones con \`re\`

Las expresiones regulares describen **patrones** en el texto. El módulo \`re\` de Python
compila un patrón y lo compara contra cadenas.

**Las funciones principales:**

| Llamada | Devuelve |
|---|---|
| \`re.search(p, s)\` | primera coincidencia **en cualquier parte**, o \`None\` |
| \`re.match(p, s)\` | coincidencia **solo al inicio**, o \`None\` |
| \`re.findall(p, s)\` | lista de **todas** las coincidencias |
| \`re.finditer(p, s)\` | iterador de objetos match |
| \`re.sub(p, repl, s)\` | \`s\` con las coincidencias **reemplazadas** |
| \`re.split(p, s)\` | separa \`s\` por el patrón |

**Los bloques que más usarás:**

- \`\\d\` dígito, \`\\w\` carácter de palabra, \`\\s\` espacio (mayúscula = negación: \`\\D \\W \\S\`)
- \`.\` cualquier char, \`^\` inicio, \`$\` fin
- cuantificadores: \`*\` (0+), \`+\` (1+), \`?\` (0 o 1), \`{2,4}\` (rango)
- \`[abc]\` un conjunto, \`[^abc]\` conjunto negado, \`(…)\` un **grupo de captura**, \`a|b\` alternancia

> Escribe siempre los patrones como **cadenas crudas** — \`r"\\d+"\` — para que las barras
> invertidas lleguen a \`re\` en vez de ser consumidas por los escapes de cadena de Python.`,
      },
      { title: "search, match, findall" },
      { title: "Grupos y sustitución" },
      {
        question: "¿Cuál es la diferencia entre `re.match` y `re.search`?",
        options: [
          "`match` ancla al inicio de la cadena; `search` escanea toda la cadena.",
          "`match` devuelve un bool; `search` devuelve un objeto match.",
          "`match` es insensible a mayúsculas; `search` es sensible.",
          "No hay diferencia — son alias.",
        ],
        explanation:
          "`re.match` solo tiene éxito si el patrón coincide en la posición 0, mientras que `re.search` encuentra la primera coincidencia en cualquier parte. Para forzar una coincidencia de cadena completa, usa `re.fullmatch` o ancla con `^…$`.",
      },
      {
        title: "Extrae los números",
        prompt:
          "Devuelve una lista de **todos los enteros** que aparecen en la cadena `s`, en orden, como `int`. Usa `re.findall`. Si no hay ninguno, devuelve `[]`.",
        hints: [
          "`re.findall(r'\\\\d+', s)` devuelve cada secuencia de dígitos como cadenas.",
          "Convierte cada coincidencia a int: `[int(x) for x in re.findall(r'\\\\d+', s)]`.",
        ],
      },
    ],
  },
};
