import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BookText, Code2 } from "lucide-react";
import { useT } from "../i18n";
// The PostgreSQL study guide lives at the repo root (source of truth the SQL module was
// ported from). Import it raw so it's always in sync — no copy to maintain.
import sqlGuide from "../../sql-reference/concepts.md?raw";

// A compact Python cheatsheet, authored inline (the SQL guide is the big external asset).
const PY_CHEATSHEET = `## Python quick reference

### Sequences
\`\`\`python
xs[1:4]       xs[::-1]        # slice / reverse
xs.append(x)  xs.pop()        # list mutate
", ".join(parts)              # list -> str
[f(x) for x in xs if cond]    # comprehension
\`\`\`

### Dicts & sets
\`\`\`python
d.get(k, default)             # no KeyError
d.items()  d.keys()  d.values()
{x for x in xs}   a & b   a | b   a - b   # set algebra
\`\`\`

### Control & functions
\`\`\`python
"even" if n % 2 == 0 else "odd"          # ternary
def f(*args, **kwargs): ...              # varargs
lambda a, b: a + b                        # anonymous fn
\`\`\`

### Files, errors, iteration
\`\`\`python
with open(path) as f: data = f.read()     # auto-close
try: ... except ValueError as e: ...       # handle
for i, x in enumerate(xs): ...             # index + value
(x for x in xs)                            # lazy generator
\`\`\`

### Handy stdlib
\`\`\`python
from collections import Counter, defaultdict
from functools import reduce, lru_cache
import json, statistics, itertools
\`\`\`
`;

type Tab = "sql" | "python";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Extract "## " headings for the table of contents. */
function headings(md: string): { title: string; id: string }[] {
  return md
    .split("\n")
    .filter((l) => /^##\s+/.test(l))
    .map((l) => {
      const title = l.replace(/^##\s+/, "").trim();
      return { title, id: slugify(title) };
    });
}

const mdComponents = {
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 id={slugify(String(children))}>{children}</h2>
  ),
};

export default function Reference() {
  const [tab, setTab] = useState<Tab>("sql");
  const t = useT();
  const source = tab === "sql" ? sqlGuide : PY_CHEATSHEET;
  const toc = useMemo(() => headings(source), [source]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">{t("ref.title")}</h1>
        <p className="mt-1 text-sm text-slate-400">{t("ref.subtitle")}</p>
      </div>

      <div className="mb-6 flex gap-2">
        <button
          className={`pill inline-flex items-center gap-1.5 ${tab === "sql" ? "bg-accent-violet/20 text-white" : "text-slate-400"}`}
          onClick={() => setTab("sql")}
          aria-pressed={tab === "sql"}
        >
          <BookText className="h-4 w-4" /> {t("ref.sqlGuide")}
        </button>
        <button
          className={`pill inline-flex items-center gap-1.5 ${tab === "python" ? "bg-accent-violet/20 text-white" : "text-slate-400"}`}
          onClick={() => setTab("python")}
          aria-pressed={tab === "python"}
        >
          <Code2 className="h-4 w-4" /> {t("ref.pyCheatsheet")}
        </button>
      </div>

      <div className="flex gap-8">
        {/* Sticky table of contents */}
        <nav className="sticky top-6 hidden max-h-[80vh] w-56 shrink-0 overflow-y-auto lg:block">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("ref.onThisPage")}
          </p>
          <ul className="space-y-1 text-sm">
            {toc.map((h) => (
              <li key={h.id}>
                <a
                  href={`#${h.id}`}
                  className="block truncate rounded px-2 py-1 text-slate-400 hover:bg-white/5 hover:text-slate-200"
                >
                  {h.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <article className="prose-pylearn min-w-0 flex-1">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {source}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
