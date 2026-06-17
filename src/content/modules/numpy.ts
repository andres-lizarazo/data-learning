import type { Module } from "../../types/lesson";

// NumPy — "starter". Runs real numpy in the browser via Pyodide.
export const numpy: Module = {
  id: "numpy",
  title: "NumPy",
  blurb: "Fast n-dimensional arrays and vectorized math.",
  level: "Intermediate",
  icon: "🔢",
  status: "starter",
  lessons: [
    {
      id: "ndarrays",
      title: "Arrays & Vectorization",
      summary: "Create arrays, broadcast, and compute without Python loops.",
      minutes: 12,
      blocks: [
        {
          kind: "prose",
          markdown: `# NumPy arrays

\`ndarray\` is a homogeneous, fixed-type array. Operations are **vectorized** — they
run on the whole array at C speed, no Python loop needed.

> The first run installs NumPy into Pyodide (a few seconds). Subsequent runs are instant.`,
        },
        {
          kind: "runnable",
          title: "Vectorized math",
          packages: ["numpy"],
          code: `import numpy as np

a = np.array([1, 2, 3, 4])
print("a * 2     =", a * 2)
print("a ** 2    =", a ** 2)
print("mean/std  =", a.mean(), round(a.std(), 3))

m = np.arange(1, 7).reshape(2, 3)
print(m)
print("sum axis0 =", m.sum(axis=0))
print("transpose =\\n", m.T)`,
        },
        {
          kind: "runnable",
          title: "Boolean masking",
          packages: ["numpy"],
          code: `import numpy as np
data = np.array([3, 8, 1, 9, 4, 7])
mask = data > 5
print("mask:", mask)
print("filtered:", data[mask])
data[data < 5] = 0
print("clamped:", data)`,
        },
      ],
    },
  ],
};
