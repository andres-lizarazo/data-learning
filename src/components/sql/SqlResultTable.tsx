import { Table2, AlertTriangle, Check } from "lucide-react";
import type { SqlExecResult } from "../../sql/sqlClient";

// Renders a SQL execution result like a database console: a result grid for SELECTs,
// an "OK / N rows affected" line for writes, or a red error box on failure.

/** Format a single cell value for display (NULL, arrays, JSON, dates, etc.). */
function formatCell(v: unknown): { text: string; muted?: boolean } {
  if (v === null || v === undefined) return { text: "NULL", muted: true };
  if (typeof v === "boolean") return { text: v ? "true" : "false" };
  if (Array.isArray(v)) return { text: `{${v.map((x) => String(x)).join(",")}}` };
  if (v instanceof Date) return { text: v.toISOString().slice(0, 10) };
  if (typeof v === "object") return { text: JSON.stringify(v) };
  return { text: String(v) };
}

export default function SqlResultTable({
  result,
  running,
}: {
  result: SqlExecResult | null;
  running?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#070710]/80">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <Table2 className="h-3.5 w-3.5 text-accent-cyan" /> Result
        </span>
        {running && <span className="pill text-accent-cyan">running…</span>}
        {result?.ok && !running && (
          <span className="text-xs text-slate-500">
            {result.hasResultSet ? `${result.rows.length} rows` : `${result.affectedRows} affected`}
          </span>
        )}
      </div>

      <div className="max-h-80 overflow-auto" aria-live="polite">
        {!result && !running && (
          <div className="px-3 py-3 text-sm text-slate-400">Press Run ▸ to execute the query.</div>
        )}

        {result && !result.ok && (
          <pre className="flex items-start gap-2 whitespace-pre-wrap px-3 py-2 font-mono text-xs text-brand-red">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {result.error}
          </pre>
        )}

        {result && result.ok && !result.hasResultSet && (
          <div className="flex items-center gap-2 px-3 py-3 text-sm text-accent-lime">
            <Check className="h-4 w-4" />
            Success — {result.affectedRows} row{result.affectedRows === 1 ? "" : "s"} affected.
          </div>
        )}

        {result && result.ok && result.hasResultSet && (
          <table className="w-full border-collapse text-left font-mono text-[13px]">
            <thead className="sticky top-0 bg-[#0d0d1c]">
              <tr>
                {result.columns.map((c, i) => (
                  <th
                    key={i}
                    className="border-b border-white/10 px-3 py-1.5 font-semibold text-accent-cyan"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.length === 0 && (
                <tr>
                  <td
                    colSpan={result.columns.length}
                    className="px-3 py-3 text-sm text-slate-500"
                  >
                    (0 rows)
                  </td>
                </tr>
              )}
              {result.rows.map((row, ri) => (
                <tr key={ri} className="even:bg-white/[0.02] hover:bg-white/[0.04]">
                  {row.map((cell, ci) => {
                    const { text, muted } = formatCell(cell);
                    return (
                      <td
                        key={ci}
                        className={`border-b border-white/5 px-3 py-1.5 ${
                          muted ? "italic text-slate-500" : "text-slate-200"
                        }`}
                      >
                        {text}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
