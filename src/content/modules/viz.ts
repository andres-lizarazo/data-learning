import type { Module } from "../../types/lesson";

// Data Visualization — matplotlib + seaborn rendered to PNG via Pyodide. Now "deep".
// Plots are captured automatically after each run (no checkbox needed).
export const viz: Module = {
  id: "viz",
  title: "Data Visualization",
  blurb: "Plot with matplotlib and seaborn — rendered right in the browser.",
  level: "Intermediate",
  icon: "📈",
  status: "deep",
  lessons: [
    {
      id: "matplotlib",
      title: "matplotlib Basics",
      summary: "Line, bar, and scatter plots.",
      minutes: 10,
      blocks: [
        {
          kind: "prose",
          markdown: `# matplotlib

The foundational plotting library. Build a figure, draw on it, and the result renders
below the editor **automatically** — no need to call \`plt.show()\`.`,
        },
        {
          kind: "runnable",
          title: "Line & bar plot",
          packages: ["matplotlib", "numpy"],
          code: `import numpy as np
import matplotlib.pyplot as plt

x = np.linspace(0, 2*np.pi, 100)
fig, axes = plt.subplots(1, 2, figsize=(9, 3))
axes[0].plot(x, np.sin(x), label="sin")
axes[0].plot(x, np.cos(x), label="cos")
axes[0].legend(); axes[0].set_title("Trig")

axes[1].bar(["A", "B", "C", "D"], [5, 9, 3, 7], color="#3776ab")
axes[1].set_title("Categories")
fig.tight_layout()`,
        },
        {
          kind: "challenge",
          title: "Plot two lines with a title",
          prompt: `Write \`compare(x, y1, y2)\` that draws **both** \`y1\` and \`y2\` against \`x\` on the same axes, sets the title to exactly \`"Comparison"\`, and **returns the Axes object**.

Create the axes with \`fig, ax = plt.subplots()\` and draw with \`ax.plot(...)\`.`,
          packages: ["matplotlib"],
          starterCode: `import matplotlib.pyplot as plt

def compare(x, y1, y2):
    pass`,
          tests: [
            {
              name: "draws two lines",
              assertion: `ax = compare([0, 1, 2], [0, 1, 2], [0, 2, 4])
assert len(ax.lines) == 2`,
            },
            {
              name: "sets the title",
              assertion: `ax = compare([0, 1], [1, 2], [2, 3])
assert ax.get_title() == "Comparison"`,
            },
          ],
          hints: [
            "Make the figure/axes with `fig, ax = plt.subplots()`.",
            "Call `ax.plot(x, y1)` and `ax.plot(x, y2)` — two calls make two lines.",
            "`ax.set_title(\"Comparison\")`, then `return ax`.",
          ],
          solution: `import matplotlib.pyplot as plt

def compare(x, y1, y2):
    fig, ax = plt.subplots()
    ax.plot(x, y1)
    ax.plot(x, y2)
    ax.set_title("Comparison")
    return ax`,
          xp: 70,
        },
      ],
    },
    {
      id: "customizing-plots",
      title: "Customizing Plots",
      summary: "Titles, labels, legends, styles and subplot grids.",
      minutes: 11,
      blocks: [
        {
          kind: "prose",
          markdown: `# Customizing plots

Make a chart readable: titles, axis labels, legends, grid, colors and a style sheet.

\`\`\`python
ax.set_title(...); ax.set_xlabel(...); ax.set_ylabel(...)
ax.legend(); ax.grid(True)
plt.style.use("seaborn-v0_8")     # or "ggplot", "dark_background", …
\`\`\`

A \`subplots(rows, cols)\` grid lets you place several charts in one figure.`,
        },
        {
          kind: "runnable",
          title: "A polished 2×2 grid",
          packages: ["matplotlib", "numpy"],
          code: `import numpy as np
import matplotlib.pyplot as plt

plt.style.use("ggplot")
x = np.linspace(0, 10, 100)
fig, ax = plt.subplots(2, 2, figsize=(9, 5))

ax[0, 0].plot(x, np.sin(x)); ax[0, 0].set_title("sin"); ax[0, 0].grid(True)
ax[0, 1].plot(x, np.sqrt(x), color="purple"); ax[0, 1].set_title("sqrt")
ax[1, 0].scatter(np.random.rand(40), np.random.rand(40), alpha=0.6)
ax[1, 0].set_xlabel("x"); ax[1, 0].set_ylabel("y"); ax[1, 0].set_title("scatter")
ax[1, 1].hist(np.random.randn(500), bins=20, color="teal")
ax[1, 1].set_title("histogram")

fig.suptitle("Customized subplot grid", fontsize=14)
fig.tight_layout()`,
        },
        {
          kind: "quiz",
          question: "Which call adds a legend that uses each plot's `label=` argument?",
          options: [
            { text: "ax.set_title()" },
            { text: "ax.legend()", correct: true },
            { text: "ax.grid(True)" },
            { text: "plt.show()" },
          ],
          explanation: "`ax.legend()` reads the `label=` you passed to plot/bar/etc.",
        },
        {
          kind: "challenge",
          title: "A labelled bar chart",
          prompt: `Write \`bars(labels, values)\` that draws a bar chart, labels the y-axis exactly \`"count"\`, and **returns the Axes**. One bar per (label, value).`,
          packages: ["matplotlib"],
          starterCode: `import matplotlib.pyplot as plt

def bars(labels, values):
    pass`,
          tests: [
            {
              name: "one bar per value",
              assertion: `ax = bars(["a", "b", "c"], [3, 5, 2])
assert len(ax.patches) == 3`,
            },
            {
              name: "bar heights match",
              assertion: `ax = bars(["a", "b"], [4, 7])
assert sorted(round(p.get_height()) for p in ax.patches) == [4, 7]`,
            },
            {
              name: "labels the y-axis",
              assertion: `ax = bars(["a"], [1])
assert ax.get_ylabel() == "count"`,
              hidden: true,
            },
          ],
          hints: [
            "Make the axes with `fig, ax = plt.subplots()`, then `ax.bar(labels, values)`.",
            "Each bar is a patch — `ax.bar` creates one per value automatically.",
            "`ax.set_ylabel(\"count\")`, then `return ax`.",
          ],
          solution: `import matplotlib.pyplot as plt

def bars(labels, values):
    fig, ax = plt.subplots()
    ax.bar(labels, values)
    ax.set_ylabel("count")
    return ax`,
          xp: 70,
        },
      ],
    },
    {
      id: "pandas-plotting",
      title: "Plotting from Pandas",
      summary: "Charts straight from a DataFrame with df.plot().",
      minutes: 10,
      blocks: [
        {
          kind: "prose",
          markdown: `# Plotting from pandas

DataFrames and Series have a built-in \`.plot()\` (backed by matplotlib):

\`\`\`python
df["col"].plot(kind="line")
df["cat"].value_counts().plot(kind="bar")
df.plot(x="a", y="b", kind="scatter")
\`\`\``,
        },
        {
          kind: "runnable",
          title: "Bar & line from a DataFrame",
          packages: ["pandas", "matplotlib"],
          code: `import pandas as pd
import matplotlib.pyplot as plt

df = pd.DataFrame({
    "month": ["Jan", "Feb", "Mar", "Apr", "May"],
    "sales": [120, 150, 90, 170, 200],
    "costs": [80, 100, 70, 110, 130],
})

fig, axes = plt.subplots(1, 2, figsize=(9, 3.2))
df.plot(x="month", y=["sales", "costs"], kind="bar", ax=axes[0], title="Monthly")
df.assign(profit=df["sales"] - df["costs"]).plot(
    x="month", y="profit", marker="o", ax=axes[1], title="Profit", legend=False
)
fig.tight_layout()`,
        },
        {
          kind: "quiz",
          question: "Which pandas call draws a bar chart of how often each category appears?",
          options: [
            { text: "df['cat'].value_counts().plot(kind='bar')", correct: true },
            { text: "df['cat'].sum().plot()" },
            { text: "df.plot(kind='scatter')" },
            { text: "df['cat'].hist()" },
          ],
          explanation:
            "`value_counts()` tallies each category; `.plot(kind='bar')` charts those tallies.",
        },
        {
          kind: "challenge",
          title: "Category frequency bar chart",
          prompt: `Write \`category_bars(values)\` — given a list of category labels, draw a **bar chart of how often each category appears** using pandas (\`value_counts().plot(kind="bar", ax=ax)\`) on a fresh Axes, and **return that Axes**.`,
          packages: ["pandas", "matplotlib"],
          starterCode: `import pandas as pd
import matplotlib.pyplot as plt

def category_bars(values):
    pass`,
          tests: [
            {
              name: "one bar per distinct category",
              assertion: `ax = category_bars(["a", "a", "b", "c", "c", "c"])
assert len(ax.patches) == 3`,
            },
            {
              name: "two categories",
              assertion: `ax = category_bars(["x", "y", "x"])
assert len(ax.patches) == 2`,
              hidden: true,
            },
          ],
          hints: [
            "Make a fresh Axes first: `fig, ax = plt.subplots()` (so bars don't pile onto a shared figure).",
            "`pd.Series(values).value_counts()` tallies each category; chain `.plot(kind=\"bar\", ax=ax)`.",
            "`return ax`.",
          ],
          solution: `import pandas as pd
import matplotlib.pyplot as plt

def category_bars(values):
    fig, ax = plt.subplots()
    pd.Series(values).value_counts().plot(kind="bar", ax=ax)
    return ax`,
          xp: 70,
        },
      ],
    },
    {
      id: "seaborn",
      title: "seaborn — statistical plots",
      summary: "Beautiful statistical graphics on top of matplotlib.",
      minutes: 10,
      blocks: [
        {
          kind: "prose",
          markdown: `# seaborn

Seaborn makes attractive statistical plots with minimal code and integrates with
pandas DataFrames.

> The first run installs seaborn (and scipy) via pip in Pyodide — this can take
> ~15–30s the first time.`,
        },
        {
          kind: "runnable",
          title: "Distribution & relationship",
          packages: ["seaborn", "pandas", "numpy", "matplotlib"],
          code: `import numpy as np
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

rng = np.random.default_rng(0)
df = pd.DataFrame({
    "x": rng.normal(0, 1, 200),
    "group": rng.choice(["A", "B"], 200),
})
df["y"] = df["x"] * 2 + rng.normal(0, 0.5, 200)

sns.set_theme(style="darkgrid", rc={"axes.facecolor": "none", "figure.facecolor": "none"})
fig, axes = plt.subplots(1, 2, figsize=(9, 3.2))
sns.histplot(data=df, x="x", hue="group", ax=axes[0])
sns.scatterplot(data=df, x="x", y="y", hue="group", ax=axes[1])
fig.tight_layout()`,
        },
        {
          kind: "quiz",
          question:
            "You want to show the distribution of a single numeric column, split by a category. Which seaborn function fits best?",
          options: [
            { text: "sns.histplot(data=df, x=\"value\", hue=\"group\")", correct: true },
            { text: "sns.scatterplot(data=df, x=\"a\", y=\"b\")" },
            { text: "sns.heatmap(df.corr())" },
            { text: "sns.lineplot(data=df, x=\"t\", y=\"value\")" },
          ],
          explanation:
            "`histplot` (or `kdeplot`) shows a distribution; `hue` splits it by category. Scatter/line relate two variables, and heatmap shows a matrix — none is a single-variable distribution.",
        },
        {
          kind: "challenge",
          title: "Boxplot per category",
          prompt: `Write \`score_boxplot(df)\` — given a DataFrame with columns \`team\` and \`score\`, draw a seaborn **boxplot** of \`score\` per \`team\`, set the title to exactly \`"Score by team"\`, and **return the Axes**.`,
          packages: ["seaborn", "pandas", "matplotlib"],
          starterCode: `import seaborn as sns
import matplotlib.pyplot as plt

def score_boxplot(df):
    pass`,
          tests: [
            {
              name: "sets the title",
              assertion: `import pandas as pd
df = pd.DataFrame({"team": ["A", "A", "B", "B"], "score": [1, 2, 3, 4]})
ax = score_boxplot(df)
assert ax.get_title() == "Score by team"`,
            },
            {
              name: "one box per team",
              assertion: `import pandas as pd
df = pd.DataFrame({"team": ["A", "B", "C"], "score": [1, 2, 3]})
ax = score_boxplot(df)
labels = sorted(t.get_text() for t in ax.get_xticklabels())
assert labels == ["A", "B", "C"]`,
              hidden: true,
            },
          ],
          hints: [
            "Make the axes: `fig, ax = plt.subplots()`.",
            "`sns.boxplot(data=df, x=\"team\", y=\"score\", ax=ax)`.",
            "`ax.set_title(\"Score by team\")`, then `return ax`.",
          ],
          solution: `import seaborn as sns
import matplotlib.pyplot as plt

def score_boxplot(df):
    fig, ax = plt.subplots()
    sns.boxplot(data=df, x="team", y="score", ax=ax)
    ax.set_title("Score by team")
    return ax`,
          xp: 80,
        },
      ],
    },
    {
      id: "seaborn-categorical",
      title: "seaborn — categorical & heatmaps",
      summary: "Boxplots, barplots and correlation heatmaps.",
      minutes: 11,
      blocks: [
        {
          kind: "prose",
          markdown: `# Categorical plots & heatmaps

Seaborn shines at comparing groups and showing matrices:

- \`sns.boxplot\` / \`sns.violinplot\` — distribution per category
- \`sns.barplot\` — mean (with confidence interval) per category
- \`sns.heatmap\` — a matrix (e.g. a correlation matrix) as colors`,
        },
        {
          kind: "runnable",
          title: "Boxplot, barplot & heatmap",
          packages: ["seaborn", "pandas", "numpy", "matplotlib"],
          code: `import numpy as np
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

rng = np.random.default_rng(1)
df = pd.DataFrame({
    "team": rng.choice(["A", "B", "C"], 120),
    "score": rng.normal(50, 12, 120),
    "minutes": rng.normal(30, 8, 120),
})

sns.set_theme(style="darkgrid", rc={"axes.facecolor": "none", "figure.facecolor": "none"})
fig, axes = plt.subplots(1, 3, figsize=(11, 3.2))
sns.boxplot(data=df, x="team", y="score", ax=axes[0])
axes[0].set_title("Score by team")
sns.barplot(data=df, x="team", y="minutes", ax=axes[1])
axes[1].set_title("Avg minutes")
sns.heatmap(df[["score", "minutes"]].corr(), annot=True, cmap="Blues", ax=axes[2])
axes[2].set_title("Correlation")
fig.tight_layout()`,
        },
        {
          kind: "prose",
          markdown: `## 🧭 Which chart for which question?

Pick the mark from the **question**, not the data:

| You want to show… | Reach for |
|---|---|
| **Trend over time** | line plot |
| **Compare a value across categories** | bar plot |
| **Distribution of one numeric variable** | histogram / KDE (\`histplot\`, \`kdeplot\`) |
| **Distribution per category** | box / violin plot |
| **Relationship between two numerics** | scatter plot |
| **Composition / parts of a whole** | stacked bar (avoid pie for many slices) |
| **A matrix of values** (e.g. correlations) | heatmap |

Rules of thumb: start the bar/line axis at **zero**, don't encode more than ~2–3 variables in
one chart, and prefer direct labels or a legend over a rainbow of colors.`,
        },
        {
          kind: "quiz",
          question: "You want to compare the distribution of scores across three teams. The best chart is…",
          options: [
            { text: "A box or violin plot (one per team).", correct: true },
            { text: "A single histogram of all scores combined." },
            { text: "A scatter plot of score vs team." },
            { text: "A correlation heatmap." },
          ],
          explanation:
            "Box/violin plots show the spread (median, quartiles, outliers) per category side by side. A combined histogram hides the per-team differences, and scatter/heatmap answer different questions.",
        },
      ],
    },
  ],
};
