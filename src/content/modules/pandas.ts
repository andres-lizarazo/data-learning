import type { Module } from "../../types/lesson";

// Pandas — data processing, cleaning, transformation. Now a "deep" module; runs in Pyodide.
export const pandas: Module = {
  id: "pandas",
  title: "Pandas — Data Wrangling",
  blurb: "Load, select, clean, group, merge and aggregate tabular data.",
  level: "Intermediate",
  icon: "🐼",
  status: "deep",
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
      id: "selecting-filtering",
      title: "Selecting & Filtering",
      summary: "loc / iloc, boolean masks and query.",
      minutes: 11,
      blocks: [
        {
          kind: "prose",
          markdown: `# Selecting & Filtering

- \`df["col"]\` → a Series; \`df[["a", "b"]]\` → a DataFrame of those columns.
- \`df.loc[rows, cols]\` selects by **label**; \`df.iloc[i, j]\` by **position**.
- Boolean masks filter rows: \`df[df["score"] > 90]\`.
- \`df.query("score > 90 and lang == 'python'")\` is a readable alternative.

\`\`\`python
df.loc[df["score"] > 90, "name"]   # names of high scorers
df.iloc[0]                          # first row
\`\`\``,
        },
        {
          kind: "runnable",
          title: "Filter rows & pick columns",
          packages: ["pandas"],
          code: `import pandas as pd
df = pd.DataFrame({
    "name": ["Ada", "Linus", "Grace", "Alan"],
    "lang": ["python", "c", "cobol", "math"],
    "score": [91, 85, 99, 88],
})
print("high scorers:\\n", df[df["score"] > 90][["name", "score"]])
print("\\nvia query:\\n", df.query("score >= 88 and lang != 'c'"))
print("\\niloc[0]:\\n", df.iloc[0])`,
        },
        {
          kind: "challenge",
          title: "Names above a threshold",
          prompt:
            "`records` is a list of dicts each with `\"name\"` and `\"score\"`. Using pandas, return a **list of names** whose score is `>= cutoff`, in their original order.",
          packages: ["pandas"],
          starterCode: `import pandas as pd

def names_above(records, cutoff):
    pass`,
          tests: [
            {
              name: "basic",
              assertion:
                "assert names_above([{'name':'a','score':90},{'name':'b','score':70},{'name':'c','score':80}], 80) == ['a','c']",
            },
            {
              name: "none pass",
              assertion: "assert names_above([{'name':'x','score':10}], 50) == []",
              hidden: true,
            },
          ],
          hints: [
            "Build a DataFrame from the records, then filter rows with a boolean mask: `df[df[\"score\"] >= cutoff]`.",
            "From the filtered frame, select the `name` column and return `.tolist()`.",
          ],
          solution: `import pandas as pd

def names_above(records, cutoff):
    df = pd.DataFrame(records)
    return df[df["score"] >= cutoff]["name"].tolist()`,
          xp: 70,
        },
      ],
    },
    {
      id: "cleaning",
      title: "Cleaning & Transforming",
      summary: "Missing values, types, filtering, derived columns.",
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
          title: "Handle missing values",
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
print("\\nafter fill:\\n", df)`,
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
    {
      id: "groupby-aggregation",
      title: "Group-by & Aggregation",
      summary: "Split-apply-combine: group, aggregate, pivot.",
      minutes: 13,
      blocks: [
        {
          kind: "prose",
          markdown: `# Group-by & Aggregation

The **split-apply-combine** pattern: split rows into groups, apply an aggregation,
combine the results.

\`\`\`python
df.groupby("city")["temp"].mean()
df.groupby("city").agg(avg=("temp", "mean"), n=("temp", "size"))
df.pivot_table(index="city", columns="season", values="temp", aggfunc="mean")
\`\`\``,
        },
        {
          kind: "runnable",
          title: "Group and aggregate",
          packages: ["pandas"],
          code: `import pandas as pd
df = pd.DataFrame({
    "city": ["NY", "NY", "LA", "LA", "LA"],
    "sales": [100, 150, 200, 50, 50],
})
print("sum by city:\\n", df.groupby("city")["sales"].sum())
print("\\nmulti-agg:\\n", df.groupby("city").agg(
    total=("sales", "sum"),
    avg=("sales", "mean"),
    n=("sales", "size"),
))`,
        },
        {
          kind: "challenge",
          title: "Average by group",
          prompt:
            "`records` is a list of dicts with keys `group` and `value`. Using pandas, return a **dict** mapping each group to the **mean** of its values (as plain floats).",
          packages: ["pandas"],
          starterCode: `import pandas as pd

def avg_by_group(records):
    pass`,
          tests: [
            {
              name: "two groups",
              assertion:
                "assert avg_by_group([{'group':'x','value':2},{'group':'x','value':4},{'group':'y','value':9}]) == {'x': 3.0, 'y': 9.0}",
            },
            {
              name: "single",
              assertion: "assert avg_by_group([{'group':'a','value':5}]) == {'a': 5.0}",
              hidden: true,
            },
          ],
          hints: [
            "`df.groupby(\"group\")[\"value\"].mean()` gives a Series indexed by group with the mean of each.",
            "Convert that Series to a plain dict with a comprehension over `.items()`, casting each value with `float(...)`.",
          ],
          solution: `import pandas as pd

def avg_by_group(records):
    s = pd.DataFrame(records).groupby("group")["value"].mean()
    return {k: float(v) for k, v in s.items()}`,
          xp: 80,
        },
        {
          kind: "quiz",
          question:
            "`df.groupby(\"city\")[\"sales\"].sum()` returns what, and what is `city` in the result?",
          options: [
            {
              text: "A Series of per-city sums, indexed by city (city becomes the index).",
              correct: true,
            },
            { text: "A DataFrame with city as a regular column." },
            { text: "A single number — the grand total." },
            { text: "A dict mapping city to sales." },
          ],
          explanation:
            "Aggregating one column over a groupby yields a Series indexed by the group key. Add `.reset_index()` to turn `city` back into an ordinary column, or use `.agg(...)` for multiple named aggregations.",
        },
      ],
    },
    {
      id: "merge-join-concat",
      title: "Merge, Join & Concat",
      summary: "Combine tables row-wise and key-wise.",
      minutes: 12,
      blocks: [
        {
          kind: "prose",
          markdown: `# Combining DataFrames

- \`pd.concat([df1, df2])\` stacks rows (or columns with \`axis=1\`).
- \`a.merge(b, on="key", how="inner")\` joins on a shared key — like a SQL JOIN.
  \`how\` can be \`inner\`, \`left\`, \`right\`, or \`outer\`.

\`\`\`python
orders.merge(prices, on="item", how="left")
\`\`\``,
        },
        {
          kind: "runnable",
          title: "Merge two tables",
          packages: ["pandas"],
          code: `import pandas as pd
orders = pd.DataFrame({"item": ["a", "b", "c"], "qty": [2, 1, 5]})
prices = pd.DataFrame({"item": ["a", "b", "c"], "price": [10, 25, 4]})

m = orders.merge(prices, on="item")
m["cost"] = m["qty"] * m["price"]
print(m)
print("\\ntotal cost:", m["cost"].sum())

# .iterrows() walks row by row when you need per-row values, not a vectorized column
for _, row in m.iterrows():
    print(row["item"], "->", row["cost"])`,
        },
        {
          kind: "challenge",
          title: "Join orders with prices",
          prompt:
            "`orders` = list of dicts `{item, qty}`; `prices` = list of dicts `{item, price}`. Using a pandas **merge**, return a **dict** mapping each item to its cost (`qty * price`, as int).",
          packages: ["pandas"],
          starterCode: `import pandas as pd

def order_costs(orders, prices):
    pass`,
          tests: [
            {
              name: "basic",
              assertion:
                "assert order_costs([{'item':'a','qty':2},{'item':'b','qty':3}], [{'item':'a','price':10},{'item':'b','price':5}]) == {'a': 20, 'b': 15}",
            },
            {
              name: "single",
              assertion:
                "assert order_costs([{'item':'x','qty':4}], [{'item':'x','price':3}]) == {'x': 12}",
              hidden: true,
            },
          ],
          hints: [
            "Make a DataFrame from each list and join them on the shared key: `df_orders.merge(df_prices, on=\"item\")`.",
            "Walk the merged rows with `.iterrows()` and build a dict mapping each item to `int(row[\"qty\"] * row[\"price\"])`.",
          ],
          solution: `import pandas as pd

def order_costs(orders, prices):
    m = pd.DataFrame(orders).merge(pd.DataFrame(prices), on="item")
    return {row["item"]: int(row["qty"] * row["price"]) for _, row in m.iterrows()}`,
          xp: 80,
        },
        {
          kind: "quiz",
          question:
            "You merge two DataFrames with `how=\"inner\"` on `item`. A row whose `item` exists in the left frame but not the right will…",
          options: [
            { text: "Be dropped from the result.", correct: true },
            { text: "Appear with the right-side columns filled with NaN." },
            { text: "Raise a KeyError." },
            { text: "Be kept with zeros in the missing columns." },
          ],
          explanation:
            "An inner join keeps only keys present in *both* frames. Use `how=\"left\"` to keep all left rows (unmatched right columns become NaN), `how=\"outer\"` to keep everything from both sides.",
        },
      ],
    },
    {
      id: "time-series",
      title: "Time Series",
      summary: "Datetime indexes, grouping by period, and rolling windows.",
      minutes: 12,
      blocks: [
        {
          kind: "prose",
          markdown: `# Time series

Parse strings to datetimes with \`pd.to_datetime\`, then group by a calendar **period**
or smooth with a **rolling** window.

\`\`\`python
df["date"] = pd.to_datetime(df["date"])
df.groupby(df["date"].dt.to_period("M"))["sales"].sum()   # per month
df["sales"].rolling(3).mean()                              # moving average
\`\`\``,
        },
        {
          kind: "runnable",
          title: "Group by month & rolling mean",
          packages: ["pandas"],
          code: `import pandas as pd
df = pd.DataFrame({
    "date": pd.to_datetime(["2024-01-03", "2024-01-20", "2024-02-02", "2024-02-19"]),
    "sales": [10, 20, 15, 30],
})
print("monthly totals:\\n", df.groupby(df["date"].dt.to_period("M"))["sales"].sum())
print("\\nrolling mean (2):\\n", df["sales"].rolling(2).mean())`,
        },
        {
          kind: "challenge",
          title: "Monthly totals",
          prompt:
            "`dates` are `'YYYY-MM-DD'` strings and `amounts` the matching values. Return a dict mapping `'YYYY-MM'` → total amount (int) for that month.",
          packages: ["pandas"],
          starterCode: `import pandas as pd

def monthly_totals(dates, amounts):
    pass`,
          tests: [
            {
              name: "two months",
              assertion:
                "assert monthly_totals(['2024-01-05','2024-01-20','2024-02-01'], [10,5,7]) == {'2024-01': 15, '2024-02': 7}",
            },
            {
              name: "single",
              assertion: "assert monthly_totals(['2023-12-31'], [4]) == {'2023-12': 4}",
              hidden: true,
            },
          ],
          hints: [
            "Build a DataFrame and parse dates with `pd.to_datetime`.",
            "Group by `df['date'].dt.strftime('%Y-%m')` and sum the amounts.",
            "Convert the resulting Series to a dict with int values.",
          ],
          solution: `import pandas as pd

def monthly_totals(dates, amounts):
    df = pd.DataFrame({"d": pd.to_datetime(dates), "a": amounts})
    s = df.groupby(df["d"].dt.strftime("%Y-%m"))["a"].sum()
    return {k: int(v) for k, v in s.items()}`,
          xp: 80,
        },
      ],
    },
    {
      id: "reshape-chaining",
      title: "Reshape & Method Chaining",
      summary: "pivot_table / melt and readable chained transforms.",
      minutes: 12,
      blocks: [
        {
          kind: "prose",
          markdown: `# Reshape & chaining

- \`pivot_table\` turns long data into a wide matrix (rows × columns × aggregate).
- \`melt\` does the reverse (wide → long).
- **Method chaining** keeps a transform readable as one pipeline.

\`\`\`python
(df.groupby("product")["sales"].sum()
   .sort_values(ascending=False)
   .head(3))
\`\`\``,
        },
        {
          kind: "runnable",
          title: "pivot_table & melt",
          packages: ["pandas"],
          code: `import pandas as pd
df = pd.DataFrame({
    "region": ["N", "N", "S", "S"],
    "product": ["a", "b", "a", "b"],
    "sales": [1, 2, 3, 4],
})
print(df.pivot_table(index="region", columns="product", values="sales", aggfunc="sum"))
print("\\nmelted:\\n", pd.melt(df, id_vars=["region", "product"], value_vars=["sales"]))`,
        },
        {
          kind: "challenge",
          title: "Top products",
          prompt:
            "`records` is a list of dicts with `product` and `sales`. Return the **top `n` product names** by total sales, highest first. Use a chained group-by.",
          packages: ["pandas"],
          starterCode: `import pandas as pd

def top_products(records, n):
    pass`,
          tests: [
            {
              name: "top 1",
              assertion:
                "assert top_products([{'product':'a','sales':5},{'product':'b','sales':9},{'product':'a','sales':3}], 1) == ['b']",
            },
            {
              name: "top 2",
              assertion:
                "assert top_products([{'product':'a','sales':5},{'product':'b','sales':9},{'product':'a','sales':3}], 2) == ['b', 'a']",
            },
          ],
          hints: [
            "Group by `product` and sum `sales`.",
            "Sort descending, take the first `n`, and return the index as a list.",
          ],
          solution: `import pandas as pd

def top_products(records, n):
    return (
        pd.DataFrame(records)
        .groupby("product")["sales"]
        .sum()
        .sort_values(ascending=False)
        .head(n)
        .index.tolist()
    )`,
          xp: 80,
        },
        {
          kind: "flashcards",
          title: "pandas — everyday operations",
          cards: [
            { front: "Series vs DataFrame", back: "A **Series** is one labeled column (1-D); a **DataFrame** is a table of aligned Series sharing one index (2-D)." },
            { front: "Boolean mask filtering", back: "`df[df[\"score\"] >= 90]` keeps rows where the condition is True. Combine with `&` / `|` (parenthesize each clause)." },
            { front: "`.loc` vs `.iloc`", back: "`.loc` selects by **label** (`df.loc[row_label, \"col\"]`); `.iloc` selects by **integer position** (`df.iloc[0, 2]`)." },
            { front: "groupby → aggregate", back: "`df.groupby(\"k\")[\"v\"].mean()` splits by key, applies an aggregate per group, returns a Series indexed by the key." },
            { front: "merge (join)", back: "`a.merge(b, on=\"key\", how=\"left\")` — SQL-style join. `how` ∈ inner/left/right/outer." },
            { front: "Why avoid `.iterrows()` when you can", back: "It's row-by-row Python (slow). Prefer vectorized column math (`df[\"a\"] * df[\"b\"]`) — orders of magnitude faster on real data." },
          ],
        },
      ],
    },
  ],
};
