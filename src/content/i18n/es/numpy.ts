import type { LessonI18n } from "../overlay";

// Spanish overlay for the "NumPy" module. Index-matched; text-only.
export const numpyEs: Record<string, LessonI18n> = {
  ndarrays: {
    title: "Arrays y Vectorización",
    summary: "Crea arrays, haz broadcasting y calcula sin bucles de Python.",
    blocks: [
      {
        markdown: `# Arrays de NumPy

\`ndarray\` es un array homogéneo de tipo fijo. Las operaciones son **vectorizadas** —
corren sobre todo el array a velocidad de C, sin necesitar un bucle de Python.

> La primera ejecución instala NumPy en Pyodide (unos segundos). Las siguientes son instantáneas.`,
      },
      { title: "Matemática vectorizada" },
      { title: "Máscaras booleanas" },
      {
        title: "Escalar a 0–10",
        prompt:
          "Usa NumPy. `scale(nums)` devuelve una **lista** donde cada valor se multiplica por 10 (vectorizado, sin bucle de Python).",
        hints: [
          "Convierte la lista en un array primero (`np.array(nums)`) para que la aritmética aplique a cada elemento a la vez.",
          "Multiplicar un array por un escalar es vectorizado: `np.array(nums) * 10`. Vuelve a lista con `.tolist()`.",
        ],
      },
    ],
  },
  "indexing-reshaping": {
    title: "Indexado y Reshaping",
    summary: "Slicing, indexado fancy/booleano, reshape y ejes.",
    blocks: [
      {
        markdown: `# Indexado y Reshaping

El indexado de NumPy va más allá de las listas de Python:

\`\`\`python
a[2]          # un solo elemento
a[1:4]        # slice (¡una vista, no una copia!)
a[[0, 2, 4]]  # fancy indexing -> array nuevo
a[a > 5]      # indexado booleano
m[1, 2]       # fila 1, col 2 (2-D)
m[:, 0]       # toda la primera columna
\`\`\`

\`reshape(rows, cols)\` cambia la forma sin copiar datos; usa \`-1\` para que NumPy infiera
una dimensión.`,
      },
      { title: "Reshape e indexado 2-D" },
      { title: "Indexado fancy y booleano" },
      {
        title: "Reshape en filas",
        prompt:
          "Usa NumPy. `to_rows(nums, r)` reordena la lista plana `nums` en `r` filas y devuelve una **lista anidada** (deja que NumPy infiera el número de columnas).",
        hints: [
          "`np.array(nums).reshape(rows, cols)` reordena los mismos valores en una forma 2-D.",
          "Sabes el número de filas `r` pero no las columnas — pasa `-1` y NumPy lo calcula: `.reshape(r, -1)`. Termina con `.tolist()`.",
        ],
      },
    ],
  },
  "aggregations-broadcasting": {
    title: "Agregaciones y Broadcasting",
    summary: "Reduce a lo largo de ejes; combina formas con broadcasting.",
    blocks: [
      {
        markdown: `# Agregaciones y Broadcasting

Las **agregaciones** reducen un array; \`axis\` controla la dirección:

\`\`\`python
m.sum()          # todo -> escalar
m.sum(axis=0)    # por las columnas -> un valor por columna
m.sum(axis=1)    # por las filas   -> un valor por fila
\`\`\`

El **broadcasting** deja que NumPy combine arrays de formas distintas (compatibles) sin
copiar — p. ej. restar una media por columna a cada fila:

\`\`\`python
m - m.mean(axis=0)   # (3,4) - (4,) funciona por broadcasting
\`\`\``,
      },
      { title: "Reducciones por eje" },
      { title: "Broadcasting: estandarizar columnas" },
      {
        title: "Sumas por columna",
        prompt:
          "Usa NumPy. `column_sums(matrix)` devuelve una **lista** con la suma de cada columna de una lista 2-D.",
        hints: [
          "Haz un array 2-D desde `matrix`, luego redúcelo con `.sum(...)`.",
          "`axis=0` colapsa las filas y suma *por cada columna* (`axis=1` sumaría por cada fila). Devuelve `.tolist()`.",
        ],
      },
      {
        question: "Para un array 2-D `a` de forma (rows, cols), ¿qué devuelve `a.sum(axis=0)`?",
        options: [
          "Un valor por columna (suma por cada columna)",
          "Un valor por fila (suma por cada fila)",
          "Un solo escalar — el total general",
          "El mismo array sin cambios",
        ],
        explanation:
          "`axis=0` colapsa las filas, dejando un número por columna. `axis=1` colapsaría las columnas (uno por fila), y omitir `axis` suma todo a un escalar.",
      },
    ],
  },
  "linalg-random": {
    title: "Álgebra Lineal y Random",
    summary: "Productos de matrices, resolver sistemas con np.linalg, y aleatoriedad reproducible.",
    blocks: [
      {
        markdown: `# Matrices y aleatoriedad

NumPy es un motor de álgebra lineal. Dos operadores importan:

- \`*\` es multiplicación **elemento a elemento**.
- \`@\` (o \`np.dot\`) es el **producto de matrices** — el del álgebra lineal.

El módulo \`np.linalg\` resuelve el resto: \`np.linalg.inv\` (inversa), \`np.linalg.det\`
(determinante), y \`np.linalg.solve(A, b)\` para resolver \`A x = b\` **sin** formar la
inversa (más rápido y estable).

**Aleatoriedad — usa un Generator.** La API moderna es \`rng = np.random.default_rng(seed)\`.
Poner una semilla hace los resultados **reproducibles**; \`rng.random\`, \`rng.integers\`,
\`rng.normal\` y \`rng.choice\` toman muestras.`,
      },
      { title: "Producto de matrices vs elemento a elemento" },
      { title: "Resolver un sistema lineal A x = b" },
      { title: "Aleatoriedad reproducible con un Generator" },
      {
        question: "¿Cuál es la diferencia entre `A * B` y `A @ B` para arrays NumPy 2-D?",
        options: [
          "`*` multiplica elemento a elemento; `@` es el producto de matrices (dot).",
          "Son idénticos para arrays.",
          "`*` es el producto de matrices; `@` es elemento a elemento.",
          "`@` solo funciona en arrays 1-D.",
        ],
        explanation:
          "`*` es elemento a elemento (las formas deben hacer broadcasting). `@` (equivalente a `np.dot`/`np.matmul`) contrae las dimensiones internas — el producto de matrices del álgebra lineal.",
      },
      {
        title: "Producto matriz–vector",
        prompt:
          "Dada una lista 2-D `A` y una lista 1-D `v`, devuelve el producto matriz–vector `A @ v` como una lista de Python normal. Usa NumPy.",
        hints: [
          "Convierte ambos a arrays: `np.array(A)` y `np.array(v)`.",
          "El producto es `np.array(A) @ np.array(v)`; devuelve `.tolist()`.",
        ],
      },
    ],
  },
};
