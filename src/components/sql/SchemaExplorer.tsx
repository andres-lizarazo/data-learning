import { useState } from "react";
import { Database, ChevronDown, KeyRound } from "lucide-react";
import { SCHEMA } from "../../sql/seeds";

// A collapsible panel listing the seeded tables and their columns so the learner
// knows what they can query. Shown alongside SQL lessons and the SQL Playground.
export default function SchemaExplorer({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="glass overflow-hidden">
      <button
        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-200"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <Database className="h-4 w-4 text-accent-cyan" />
        Sample database
        <span className="text-xs font-normal text-slate-500">
          (e-commerce — {SCHEMA.length} tables)
        </span>
        <ChevronDown
          className={`ml-auto h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="grid gap-3 border-t border-white/10 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {SCHEMA.map((t) => (
            <div key={t.name} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
              <div className="mb-1.5 font-mono text-sm font-semibold text-accent-lime">
                {t.name}
              </div>
              <ul className="space-y-0.5">
                {t.columns.map((c) => (
                  <li key={c.name} className="flex items-baseline gap-1.5 text-xs">
                    {c.note?.includes("PK") && (
                      <KeyRound className="h-3 w-3 shrink-0 text-amber-300" />
                    )}
                    <span className="font-mono text-slate-200">{c.name}</span>
                    <span className="font-mono text-slate-500">{c.type}</span>
                    {c.note && <span className="text-slate-600">{c.note}</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
