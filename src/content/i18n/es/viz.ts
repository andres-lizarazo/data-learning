import type { LessonI18n } from "../overlay";

// Spanish overlay for the "Data Visualization" module. Index-matched; text-only.
export const vizEs: Record<string, LessonI18n> = {
  matplotlib: {
    title: "Básicos de matplotlib",
    summary: "Gráficos de línea, barras y dispersión.",
    blocks: [
      {
        markdown: `# matplotlib

La librería de gráficos fundamental. Construye una figura, dibuja en ella, y el resultado
se renderiza debajo del editor **automáticamente** — sin necesidad de llamar a \`plt.show()\`.`,
      },
      { title: "Gráfico de línea y barras" },
      {
        title: "Dibuja dos líneas con un título",
        prompt: `Escribe \`compare(x, y1, y2)\` que dibuje **ambas** \`y1\` e \`y2\` contra \`x\` en los mismos ejes, ponga el título exactamente en \`"Comparison"\`, y **devuelva el objeto Axes**.

Crea los ejes con \`fig, ax = plt.subplots()\` y dibuja con \`ax.plot(...)\`.`,
        hints: [
          "Crea la figura/ejes con `fig, ax = plt.subplots()`.",
          "Llama `ax.plot(x, y1)` y `ax.plot(x, y2)` — dos llamadas hacen dos líneas.",
          '`ax.set_title("Comparison")`, luego `return ax`.',
        ],
      },
    ],
  },
  "customizing-plots": {
    title: "Personalizar Gráficos",
    summary: "Títulos, etiquetas, leyendas, estilos y rejillas de subplots.",
    blocks: [
      {
        markdown: `# Personalizar gráficos

Haz un gráfico legible: títulos, etiquetas de ejes, leyendas, rejilla, colores y una hoja
de estilo.

\`\`\`python
ax.set_title(...); ax.set_xlabel(...); ax.set_ylabel(...)
ax.legend(); ax.grid(True)
plt.style.use("seaborn-v0_8")     # o "ggplot", "dark_background", …
\`\`\`

Una rejilla \`subplots(rows, cols)\` te deja colocar varios gráficos en una figura.`,
      },
      { title: "Una rejilla 2×2 pulida" },
      {
        question: "¿Qué llamada añade una leyenda que usa el argumento `label=` de cada gráfico?",
        options: ["ax.set_title()", "ax.legend()", "ax.grid(True)", "plt.show()"],
        explanation: "`ax.legend()` lee el `label=` que pasaste a plot/bar/etc.",
      },
      {
        title: "Un gráfico de barras etiquetado",
        prompt: `Escribe \`bars(labels, values)\` que dibuje un gráfico de barras, etiquete el eje-y exactamente como \`"count"\`, y **devuelva los Axes**. Una barra por (label, value).`,
        hints: [
          'Crea los ejes con `fig, ax = plt.subplots()`, luego `ax.bar(labels, values)`.',
          "Cada barra es un patch — `ax.bar` crea uno por valor automáticamente.",
          '`ax.set_ylabel("count")`, luego `return ax`.',
        ],
      },
    ],
  },
  "pandas-plotting": {
    title: "Graficar desde Pandas",
    summary: "Gráficos directo desde un DataFrame con df.plot().",
    blocks: [
      {
        markdown: `# Graficar desde pandas

Los DataFrames y Series tienen un \`.plot()\` incorporado (respaldado por matplotlib):

\`\`\`python
df["col"].plot(kind="line")
df["cat"].value_counts().plot(kind="bar")
df.plot(x="a", y="b", kind="scatter")
\`\`\``,
      },
      { title: "Barras y líneas desde un DataFrame" },
      {
        question: "¿Qué llamada de pandas dibuja un gráfico de barras de cuántas veces aparece cada categoría?",
        options: [
          "df['cat'].value_counts().plot(kind='bar')",
          "df['cat'].sum().plot()",
          "df.plot(kind='scatter')",
          "df['cat'].hist()",
        ],
        explanation:
          "`value_counts()` cuenta cada categoría; `.plot(kind='bar')` grafica esos conteos.",
      },
      {
        title: "Gráfico de barras de frecuencia por categoría",
        prompt: `Escribe \`category_bars(values)\` — dada una lista de etiquetas de categoría, dibuja un **gráfico de barras de cuántas veces aparece cada categoría** usando pandas (\`value_counts().plot(kind="bar", ax=ax)\`) sobre unos Axes nuevos, y **devuelve esos Axes**.`,
        hints: [
          "Crea unos Axes nuevos primero: `fig, ax = plt.subplots()` (para que las barras no se apilen sobre una figura compartida).",
          '`pd.Series(values).value_counts()` cuenta cada categoría; encadena `.plot(kind="bar", ax=ax)`.',
          "`return ax`.",
        ],
      },
    ],
  },
  seaborn: {
    title: "seaborn — gráficos estadísticos",
    summary: "Gráficos estadísticos elegantes sobre matplotlib.",
    blocks: [
      {
        markdown: `# seaborn

Seaborn crea gráficos estadísticos atractivos con poco código e integra con DataFrames
de pandas.

> La primera ejecución instala seaborn (y scipy) vía pip en Pyodide — puede tardar
> ~15–30s la primera vez.`,
      },
      { title: "Distribución y relación" },
      {
        question:
          "Quieres mostrar la distribución de una sola columna numérica, dividida por una categoría. ¿Qué función de seaborn encaja mejor?",
        options: [
          'sns.histplot(data=df, x="value", hue="group")',
          'sns.scatterplot(data=df, x="a", y="b")',
          "sns.heatmap(df.corr())",
          'sns.lineplot(data=df, x="t", y="value")',
        ],
        explanation:
          "`histplot` (o `kdeplot`) muestra una distribución; `hue` la divide por categoría. Scatter/line relacionan dos variables, y heatmap muestra una matriz — ninguna es una distribución de una sola variable.",
      },
      {
        title: "Boxplot por categoría",
        prompt: `Escribe \`score_boxplot(df)\` — dado un DataFrame con columnas \`team\` y \`score\`, dibuja un **boxplot** de seaborn de \`score\` por \`team\`, pon el título exactamente en \`"Score by team"\`, y **devuelve los Axes**.`,
        hints: [
          "Crea los ejes: `fig, ax = plt.subplots()`.",
          '`sns.boxplot(data=df, x="team", y="score", ax=ax)`.',
          '`ax.set_title("Score by team")`, luego `return ax`.',
        ],
      },
    ],
  },
  "seaborn-categorical": {
    title: "seaborn — categóricos y heatmaps",
    summary: "Boxplots, barplots y heatmaps de correlación.",
    blocks: [
      {
        markdown: `# Gráficos categóricos y heatmaps

Seaborn brilla comparando grupos y mostrando matrices:

- \`sns.boxplot\` / \`sns.violinplot\` — distribución por categoría
- \`sns.barplot\` — media (con intervalo de confianza) por categoría
- \`sns.heatmap\` — una matriz (p. ej. una matriz de correlación) como colores`,
      },
      { title: "Boxplot, barplot y heatmap" },
      {
        markdown: `## 🧭 ¿Qué gráfico para qué pregunta?

Elige la marca a partir de la **pregunta**, no de los datos:

| Quieres mostrar… | Usa |
|---|---|
| **Tendencia en el tiempo** | gráfico de línea |
| **Comparar un valor entre categorías** | gráfico de barras |
| **Distribución de una variable numérica** | histograma / KDE (\`histplot\`, \`kdeplot\`) |
| **Distribución por categoría** | box / violin plot |
| **Relación entre dos numéricas** | gráfico de dispersión |
| **Composición / partes de un todo** | barras apiladas (evita el pie con muchas porciones) |
| **Una matriz de valores** (p. ej. correlaciones) | heatmap |

Reglas: empieza el eje de barras/líneas en **cero**, no codifiques más de ~2–3 variables en
un gráfico, y prefiere etiquetas directas o una leyenda a un arcoíris de colores.`,
      },
      {
        question: "Quieres comparar la distribución de puntuaciones entre tres equipos. El mejor gráfico es…",
        options: [
          "Un box o violin plot (uno por equipo).",
          "Un solo histograma de todas las puntuaciones juntas.",
          "Un scatter plot de score vs team.",
          "Un heatmap de correlación.",
        ],
        explanation:
          "Los box/violin plots muestran la dispersión (mediana, cuartiles, outliers) por categoría lado a lado. Un histograma combinado oculta las diferencias por equipo, y scatter/heatmap responden preguntas distintas.",
      },
    ],
  },
};
