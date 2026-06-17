import type { Module } from "../../types/lesson";

// Data Visualization — matplotlib + seaborn rendered to PNG via Pyodide. "starter".
export const viz: Module = {
  id: "viz",
  title: "Data Visualization",
  blurb: "Plot with matplotlib and seaborn — rendered right in the browser.",
  level: "Intermediate",
  icon: "📈",
  status: "starter",
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

The foundational plotting library. Build a figure, draw on it, and PyLearn renders
the result below the editor.

> The first plot installs matplotlib into Pyodide (a few seconds). Don't call
> \`plt.show()\` — just create the figure; PyLearn captures it automatically.`,
        },
        {
          kind: "runnable",
          title: "Line & bar plot",
          packages: ["matplotlib", "numpy"],
          expectPlot: true,
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
          expectPlot: true,
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

sns.set_theme(style="whitegrid")
fig, axes = plt.subplots(1, 2, figsize=(9, 3.2))
sns.histplot(data=df, x="x", hue="group", ax=axes[0])
sns.scatterplot(data=df, x="x", y="y", hue="group", ax=axes[1])
fig.tight_layout()`,
        },
      ],
    },
  ],
};
