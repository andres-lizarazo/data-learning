import type { LessonI18n } from "../overlay";

// Spanish overlay for the "Pandas — Data Wrangling" module. Index-matched; text-only.
export const pandasEs: Record<string, LessonI18n> = {
  dataframes: {
    title: "Series y DataFrames",
    summary: "Los objetos centrales de pandas y la selección.",
    blocks: [
      {
        markdown: `# Pandas

Un **DataFrame** es una tabla etiquetada 2-D; una **Series** es una única columna
etiquetada. Pandas es el caballo de batalla del análisis de datos en Python.

> La primera ejecución instala pandas en Pyodide (unos segundos).`,
      },
      { title: "Crear e inspeccionar" },
    ],
  },
  "selecting-filtering": {
    title: "Seleccionar y Filtrar",
    summary: "loc / iloc, máscaras booleanas y query.",
    blocks: [
      {
        markdown: `# Seleccionar y Filtrar

- \`df["col"]\` → una Series; \`df[["a", "b"]]\` → un DataFrame de esas columnas.
- \`df.loc[rows, cols]\` selecciona por **etiqueta**; \`df.iloc[i, j]\` por **posición**.
- Las máscaras booleanas filtran filas: \`df[df["score"] > 90]\`.
- \`df.query("score > 90 and lang == 'python'")\` es una alternativa legible.

\`\`\`python
df.loc[df["score"] > 90, "name"]   # nombres de los que puntúan alto
df.iloc[0]                          # primera fila
\`\`\``,
      },
      { title: "Filtrar filas y elegir columnas" },
      {
        title: "Nombres por encima de un umbral",
        prompt:
          '`records` es una lista de dicts cada uno con `"name"` y `"score"`. Usando pandas, devuelve una **lista de nombres** cuyo score sea `>= cutoff`, en su orden original.',
        hints: [
          'Construye un DataFrame desde los records, luego filtra filas con una máscara booleana: `df[df["score"] >= cutoff]`.',
          "Del frame filtrado, selecciona la columna `name` y devuelve `.tolist()`.",
        ],
      },
    ],
  },
  cleaning: {
    title: "Limpiar y Transformar",
    summary: "Valores faltantes, tipos, filtrado, columnas derivadas.",
    blocks: [
      {
        markdown: `# Limpiar datos

Los datos reales son un desastre: valores faltantes, tipos equivocados, duplicados. El
pipeline típico: **inspeccionar → manejar NaNs → arreglar tipos → filtrar → derivar
columnas → agregar**.`,
      },
      { title: "Manejar valores faltantes" },
      { title: "Filtrar y derivar columnas" },
    ],
  },
  "groupby-aggregation": {
    title: "Group-by y Agregación",
    summary: "Split-apply-combine: agrupar, agregar, pivotar.",
    blocks: [
      {
        markdown: `# Group-by y Agregación

El patrón **split-apply-combine**: divide las filas en grupos, aplica una agregación,
combina los resultados.

\`\`\`python
df.groupby("city")["temp"].mean()
df.groupby("city").agg(avg=("temp", "mean"), n=("temp", "size"))
df.pivot_table(index="city", columns="season", values="temp", aggfunc="mean")
\`\`\``,
      },
      { title: "Agrupar y agregar" },
      {
        title: "Promedio por grupo",
        prompt:
          "`records` es una lista de dicts con claves `group` y `value`. Usando pandas, devuelve un **dict** que mapee cada grupo a la **media** de sus valores (como floats normales).",
        hints: [
          '`df.groupby("group")["value"].mean()` da una Series indexada por grupo con la media de cada uno.',
          "Convierte esa Series a un dict normal con una comprehension sobre `.items()`, casteando cada valor con `float(...)`.",
        ],
      },
      {
        question:
          '`df.groupby("city")["sales"].sum()` devuelve qué, y ¿qué es `city` en el resultado?',
        options: [
          "Una Series de sumas por ciudad, indexada por city (city pasa a ser el índice).",
          "Un DataFrame con city como columna normal.",
          "Un solo número — el total general.",
          "Un dict que mapea city a sales.",
        ],
        explanation:
          'Agregar una columna sobre un groupby produce una Series indexada por la clave de grupo. Añade `.reset_index()` para volver `city` a columna normal, o usa `.agg(...)` para varias agregaciones con nombre.',
      },
    ],
  },
  "merge-join-concat": {
    title: "Merge, Join y Concat",
    summary: "Combinar tablas por filas y por clave.",
    blocks: [
      {
        markdown: `# Combinar DataFrames

- \`pd.concat([df1, df2])\` apila filas (o columnas con \`axis=1\`).
- \`a.merge(b, on="key", how="inner")\` une por una clave compartida — como un JOIN de SQL.
  \`how\` puede ser \`inner\`, \`left\`, \`right\` u \`outer\`.

\`\`\`python
orders.merge(prices, on="item", how="left")
\`\`\``,
      },
      { title: "Unir dos tablas" },
      {
        title: "Unir órdenes con precios",
        prompt:
          "`orders` = lista de dicts `{item, qty}`; `prices` = lista de dicts `{item, price}`. Usando un **merge** de pandas, devuelve un **dict** que mapee cada item a su costo (`qty * price`, como int).",
        hints: [
          'Haz un DataFrame de cada lista y únelos por la clave compartida: `df_orders.merge(df_prices, on="item")`.',
          'Recorre las filas unidas con `.iterrows()` y construye un dict que mapee cada item a `int(row["qty"] * row["price"])`.',
        ],
      },
      {
        question:
          'Unes dos DataFrames con `how="inner"` en `item`. Una fila cuyo `item` existe en el frame izquierdo pero no en el derecho…',
        options: [
          "Se descarta del resultado.",
          "Aparece con las columnas del lado derecho en NaN.",
          "Lanza un KeyError.",
          "Se conserva con ceros en las columnas faltantes.",
        ],
        explanation:
          'Un inner join conserva solo las claves presentes en *ambos* frames. Usa `how="left"` para conservar todas las filas izquierdas (las columnas derechas sin match quedan NaN), `how="outer"` para conservar todo de ambos lados.',
      },
    ],
  },
  "time-series": {
    title: "Series Temporales",
    summary: "Índices de fecha/hora, agrupar por periodo y ventanas móviles.",
    blocks: [
      {
        markdown: `# Series temporales

Parsea cadenas a fechas con \`pd.to_datetime\`, luego agrupa por un **periodo** de
calendario o suaviza con una ventana **móvil** (rolling).

\`\`\`python
df["date"] = pd.to_datetime(df["date"])
df.groupby(df["date"].dt.to_period("M"))["sales"].sum()   # por mes
df["sales"].rolling(3).mean()                              # media móvil
\`\`\``,
      },
      { title: "Agrupar por mes y media móvil" },
      {
        title: "Totales mensuales",
        prompt:
          "`dates` son cadenas `'YYYY-MM-DD'` y `amounts` los valores correspondientes. Devuelve un dict que mapee `'YYYY-MM'` → monto total (int) de ese mes.",
        hints: [
          "Construye un DataFrame y parsea las fechas con `pd.to_datetime`.",
          "Agrupa por `df['date'].dt.strftime('%Y-%m')` y suma los montos.",
          "Convierte la Series resultante a un dict con valores int.",
        ],
      },
    ],
  },
  "reshape-chaining": {
    title: "Reshape y Encadenado de Métodos",
    summary: "pivot_table / melt y transformaciones encadenadas legibles.",
    blocks: [
      {
        markdown: `# Reshape y encadenado

- \`pivot_table\` convierte datos largos en una matriz ancha (filas × columnas × agregado).
- \`melt\` hace lo inverso (ancho → largo).
- El **encadenado de métodos** mantiene una transformación legible como un solo pipeline.

\`\`\`python
(df.groupby("product")["sales"].sum()
   .sort_values(ascending=False)
   .head(3))
\`\`\``,
      },
      { title: "pivot_table y melt" },
      {
        title: "Productos top",
        prompt:
          "`records` es una lista de dicts con `product` y `sales`. Devuelve los **nombres de los top `n` productos** por ventas totales, de mayor a menor. Usa un group-by encadenado.",
        hints: [
          "Agrupa por `product` y suma `sales`.",
          "Ordena descendente, toma los primeros `n`, y devuelve el índice como lista.",
        ],
      },
      {
        title: "pandas — operaciones del día a día",
        cards: [
          { front: "Series vs DataFrame", back: "Una **Series** es una columna etiquetada (1-D); un **DataFrame** es una tabla de Series alineadas que comparten un índice (2-D)." },
          { front: "Filtrado con máscara booleana", back: "`df[df[\"score\"] >= 90]` conserva filas donde la condición es True. Combina con `&` / `|` (pon paréntesis en cada cláusula)." },
          { front: "`.loc` vs `.iloc`", back: "`.loc` selecciona por **etiqueta** (`df.loc[row_label, \"col\"]`); `.iloc` por **posición entera** (`df.iloc[0, 2]`)." },
          { front: "groupby → agregación", back: "`df.groupby(\"k\")[\"v\"].mean()` divide por clave, aplica un agregado por grupo, devuelve una Series indexada por la clave." },
          { front: "merge (join)", back: "`a.merge(b, on=\"key\", how=\"left\")` — join estilo SQL. `how` ∈ inner/left/right/outer." },
          { front: "Por qué evitar `.iterrows()` cuando puedas", back: "Es fila por fila en Python (lento). Prefiere matemática vectorizada de columnas (`df[\"a\"] * df[\"b\"]`) — órdenes de magnitud más rápido con datos reales." },
        ],
      },
    ],
  },
  polars: {
    title: "Polars — un DataFrame más rápido",
    summary: "El DataFrame moderno en Rust/Arrow: la API de expresiones, ejecución perezosa, y cuándo cambiar de pandas.",
    blocks: [
      {
        markdown: `# Polars — un DataFrame más rápido

**Polars** es una librería de DataFrames moderna escrita en **Rust**, construida sobre el
formato de memoria columnar **Apache Arrow**. Es la alternativa rápida a pandas y cada vez
más el default para trabajo nuevo:

- **Multihilo** por defecto — usa todos los núcleos de la CPU; pandas es mayormente de un
  solo hilo.
- **Columnar + Arrow** — amigable con la caché, vectorizado con SIMD, interoperabilidad
  sin copias con el ecosistema Arrow (DuckDB, Parquet, PyArrow).
- **Optimización perezosa de consultas** — un \`LazyFrame\` construye un *plan* que Polars
  optimiza (predicate/projection pushdown, etc.) antes de ejecutarlo — como un motor SQL
  para tu DataFrame.
- **Streaming más grande que la RAM** para datasets que no caben en memoria.

> **Ojo:** Polars es una extensión compilada en Rust, así que — como el track de PySpark —
> **no corre en este sandbox del navegador**. Los snippets de Polars de abajo se muestran
> para leer; la celda ejecutable demuestra la transformación *equivalente* en pandas, que
> sí corre aquí. Instálalo localmente con \`pip install polars\`.`,
      },
      {
        markdown: `## La API de expresiones

El superpoder de Polars son las **expresiones**: \`pl.col("x")\` es una *descripción* de un
cálculo, no un valor inmediato. Compones expresiones dentro de \`select\`, \`filter\`,
\`with_columns\` y \`group_by\`, y Polars las corre en paralelo.

\`\`\`python
import polars as pl

df = pl.DataFrame({
    "product": ["a", "b", "a", "b"],
    "region":  ["N", "N", "S", "S"],
    "sales":   [10, 20, 30, 40],
})

# Filtrar + agrupar + agregar, todo como expresiones:
out = (
    df.filter(pl.col("sales") > 15)
      .group_by("product")
      .agg(pl.col("sales").sum().alias("total"))
      .sort("total", descending=True)
)
\`\`\`

**Eager vs lazy.** \`pl.DataFrame\` corre de forma ansiosa (como pandas). \`pl.LazyFrame\`
(\`pl.scan_csv(...)\` o \`df.lazy()\`) registra el plan y solo ejecuta con \`.collect()\` —
dejando que Polars optimice toda la consulta primero:

\`\`\`python
result = (
    pl.scan_csv("orders.csv")          # aún no se lee nada
      .filter(pl.col("status") == "paid")
      .group_by("user_id")
      .agg(pl.col("total").sum())
      .collect()                        # AHORA corre, optimizado de punta a punta
)
\`\`\``,
      },
      { title: "La misma transformación en pandas (corre aquí)" },
      {
        question: "¿Cuál es la diferencia clave entre un `LazyFrame` de Polars y un `DataFrame` ansioso (eager)?",
        options: [
          "Un LazyFrame registra un plan de consulta y lo optimiza, ejecutándose solo con `.collect()`; un DataFrame ejecuta cada operación de inmediato.",
          "Un LazyFrame guarda los datos en disco; un DataFrame los mantiene en RAM.",
          "Los LazyFrames son de un solo hilo; los DataFrames son paralelos.",
          "No hay diferencia — son alias.",
        ],
        explanation:
          "El modo lazy deja que Polars vea toda la consulta y aplique optimizaciones (predicate/projection pushdown, reordenamiento) antes de que ocurra cualquier trabajo — la misma idea que usa un planificador de consultas SQL. El modo eager corre paso a paso como pandas.",
      },
      {
        question: "Tienes un CSV de 50 GB para filtrar y agregar en un portátil. ¿Cuál es la razón más fuerte para usar Polars en vez de pandas?",
        options: [
          "La ejecución lazy y en streaming procesa datos más grandes que la RAM y paraleliza en todos los núcleos.",
          "Polars tiene un logo más bonito.",
          "pandas no puede leer archivos CSV.",
          "Polars sube automáticamente los datos a un clúster.",
        ],
        explanation:
          "El motor lazy de Polars puede transmitir datos que no caben en memoria y usa todos los núcleos, así que los trabajos pesados de filter/group/aggregate terminan mucho más rápido que el pandas de un solo hilo — sin necesitar un clúster.",
      },
      {
        title: "Filtrar y luego agregar (la idea de las expresiones)",
        prompt: `Polars expresaría esto como \`df.filter(pl.col("active")).select(pl.col("value").mean())\`.
Implementa la misma lógica en **Python puro**: dado \`records\` (una lista de dicts con las
claves \`active\` (bool) y \`value\` (número)), devuelve la **media de \`value\` sobre las filas
donde \`active\` es True**. Devuelve \`0.0\` si no hay filas activas.`,
        hints: [
          "Primero filtra: recoge `r['value']` de las filas donde `r['active']` es True.",
          "Luego agrega: `sum(vals) / len(vals)` — pero protege el caso vacío para devolver `0.0`.",
        ],
      },
      {
        title: "Polars — lo esencial",
        cards: [
          { front: "¿Qué es Polars?", back: "Una librería de DataFrames rápida en **Rust** sobre el formato columnar **Apache Arrow** — multihilo por defecto, la alternativa moderna a pandas." },
          { front: "Expresiones de Polars", back: "`pl.col(\"x\")` describe un cálculo (no un valor inmediato). Compónlas en `select`/`filter`/`with_columns`/`group_by`; Polars las corre en paralelo." },
          { front: "Eager vs lazy", back: "`pl.DataFrame` corre de inmediato (como pandas). `pl.LazyFrame` / `scan_csv` construyen un plan de consulta optimizado y ejecutado solo con `.collect()`." },
          { front: "Por qué Polars es rápido", back: "Layout columnar Arrow + SIMD + todos los núcleos + optimización perezosa de consultas (predicate/projection pushdown) + streaming más grande que la RAM." },
          { front: "pandas vs Polars — cuándo", back: "pandas: datos pequeños, ecosistema enorme, notebooks. Polars: datos grandes, ETL crítico en rendimiento, pipelines lazy. Las APIs difieren pero los conceptos se transfieren." },
        ],
      },
    ],
  },
};
