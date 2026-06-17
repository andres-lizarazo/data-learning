import type { Module } from "../../types/lesson";

// Pandas — data processing, cleaning, transformation. "starter", runs in Pyodide.
export const pandas: Module = {
  id: "pandas",
  title: "Pandas — Data Wrangling",
  blurb: "Load, clean, transform and aggregate tabular data.",
  level: "Intermediate",
  icon: "🐼",
  status: "starter",
  lessons: [
    {
      id: "dataframes",
      title: "Series & DataFrames",
      summary: "The core pandas objects and selection.",
      minutes: 12,
      blocks: [
        {
          kind: "prose",
          markdown: `# Pandas

A **DataFrame** is a 2-D labeled table; a **Series** is a single labeled column.
Pandas is the workhorse of data analysis in Python.

> The first run installs pandas into Pyodide (a few seconds).`,
        },
        {
          kind: "runnable",
          title: "Create & inspect",
          packages: ["pandas"],
          code: `import pandas as pd

df = pd.DataFrame({
    "name": ["Ada", "Linus", "Grace", "Alan"],
    "lang": ["python", "c", "cobol", "math"],
    "score": [91, 85, 99, 88],
})
print(df)
print("\\nshape:", df.shape)
print("\\nmean score:", df["score"].mean())
print("\\ntop scorer:\\n", df.loc[df["score"].idxmax()])`,
        },
      ],
    },
    {
      id: "cleaning",
      title: "Cleaning & Transforming",
      summary: "Missing values, types, filtering, group-by.",
      minutes: 14,
      blocks: [
        {
          kind: "prose",
          markdown: `# Cleaning data

Real data is messy: missing values, wrong types, duplicates. The typical pipeline:
**inspect → handle NaNs → fix types → filter → derive columns → aggregate**.`,
        },
        {
          kind: "runnable",
          title: "Handle missing values & group-by",
          packages: ["pandas", "numpy"],
          code: `import pandas as pd
import numpy as np

df = pd.DataFrame({
    "city": ["NY", "NY", "LA", "LA", "SF"],
    "temp": [30, np.nan, 75, 80, np.nan],
})
print("missing per column:\\n", df.isna().sum())

# fill NaNs with the city's mean temperature
df["temp"] = df.groupby("city")["temp"].transform(lambda s: s.fillna(s.mean()))
print("\\nafter fill:\\n", df)

print("\\navg temp by city:\\n", df.groupby("city")["temp"].mean())`,
        },
        {
          kind: "runnable",
          title: "Filter & derive columns",
          packages: ["pandas"],
          code: `import pandas as pd
df = pd.DataFrame({
    "product": ["A", "B", "C", "D"],
    "price": [10, 25, 5, 40],
    "qty": [3, 1, 10, 2],
})
df["revenue"] = df["price"] * df["qty"]
hot = df[df["revenue"] > 30].sort_values("revenue", ascending=False)
print(hot)`,
        },
      ],
    },
  ],
};
