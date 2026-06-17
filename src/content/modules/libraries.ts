import type { Module } from "../../types/lesson";

// Core standard-library modules. "starter" — seeded, expandable later.
export const libraries: Module = {
  id: "libraries",
  title: "Core Libraries",
  blurb: "collections, itertools, datetime, random, json — batteries included.",
  level: "Beginner",
  icon: "📦",
  status: "starter",
  lessons: [
    {
      id: "collections-itertools",
      title: "collections & itertools",
      summary: "Counter, defaultdict, deque, and lazy iterators.",
      minutes: 10,
      blocks: [
        {
          kind: "prose",
          markdown: `# collections & itertools

The standard library has powerful tools that save you from reinventing wheels.

- \`Counter\` — count hashable items instantly
- \`defaultdict\` — dicts with default values
- \`deque\` — O(1) appends/pops at both ends
- \`itertools\` — \`chain, groupby, combinations, accumulate\`, …`,
        },
        {
          kind: "runnable",
          title: "Counter & defaultdict",
          code: `from collections import Counter, defaultdict

words = "the cat the dog the bird".split()
print(Counter(words))
print(Counter(words).most_common(1))

groups = defaultdict(list)
for w in words:
    groups[len(w)].append(w)
print(dict(groups))`,
        },
        {
          kind: "runnable",
          title: "itertools",
          code: `from itertools import accumulate, combinations, chain

print(list(accumulate([1, 2, 3, 4])))        # running totals
print(list(combinations([1, 2, 3], 2)))      # pairs
print(list(chain([1, 2], [3, 4])))           # flatten`,
        },
      ],
    },
    {
      id: "datetime-random-json",
      title: "datetime, random & json",
      summary: "Dates, randomness, and (de)serialization.",
      minutes: 8,
      blocks: [
        {
          kind: "runnable",
          title: "datetime",
          code: `from datetime import datetime, timedelta

now = datetime(2026, 6, 17, 9, 30)
print(now.strftime("%Y-%m-%d %H:%M"))
print((now + timedelta(days=30)).date())`,
        },
        {
          kind: "runnable",
          title: "random & json",
          code: `import random, json
random.seed(42)
print(random.randint(1, 100))
print(random.sample(range(10), 3))

data = {"name": "Ada", "skills": ["python", "ml"]}
text = json.dumps(data)
print(text)
print(json.loads(text)["skills"])`,
        },
      ],
    },
  ],
};
