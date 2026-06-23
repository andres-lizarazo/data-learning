import { useEffect, useState } from "react";
import { Play, RotateCcw, Database } from "lucide-react";
import CodeEditor from "../../editor/CodeEditor";
import SqlResultTable from "../../sql/SqlResultTable";
import { sqlClient, type SqlExecResult } from "../../../sql/sqlClient";
import { useSqlStore } from "../../../store/sqlStore";
import { useCodeDraft } from "../../../lib/useCodeDraft";
import type { SqlRunnableBlock } from "../../../types/lesson";

// Editable SQL run against the seeded Postgres (PGlite) engine — the SQL twin of
// RunnableCode. Mutating examples set `resetBefore` so the seed is reloaded first.
export default function SqlRunnable({
  block,
  draftKey,
}: {
  block: SqlRunnableBlock;
  draftKey?: string;
}) {
  const { ready, boot, status } = useSqlStore();
  const [sql, setSql, resetSql] = useCodeDraft(draftKey, block.sql);
  const [result, setResult] = useState<SqlExecResult | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    boot();
  }, [boot]);

  const run = async () => {
    setRunning(true);
    try {
      setResult(await sqlClient.exec(sql, { reset: block.resetBefore }));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="glass overflow-hidden">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2 text-sm font-semibold text-slate-200">
        <Database className="h-3.5 w-3.5 text-accent-cyan" /> {block.title ?? "Try it"}
        <span className="ml-auto flex items-center gap-1.5">
          {block.expectError && (
            <span className="pill border-amber-300/30 bg-amber-400/10 text-[10px] text-amber-200">
              expected to error
            </span>
          )}
          {block.resetBefore && (
            <span className="pill border-white/10 bg-white/5 text-[10px] text-slate-400">
              resets DB
            </span>
          )}
        </span>
      </div>
      <div className="space-y-3 p-4">
        <CodeEditor
          value={sql}
          onChange={setSql}
          language="sql"
          height={Math.min(360, 60 + sql.split("\n").length * 20)}
        />
        <div className="flex items-center gap-2">
          <button className="btn-primary" onClick={run} disabled={running || !ready}>
            <Play className="h-4 w-4" />
            {running ? "Running…" : ready ? "Run" : "Loading Postgres…"}
          </button>
          <button
            className="btn-ghost"
            onClick={() => {
              resetSql();
              setResult(null);
            }}
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
          {(!ready || (running && status !== "ready")) && (
            <span className="text-xs text-slate-400">{status}</span>
          )}
        </div>
        <SqlResultTable result={result} running={running} />
      </div>
    </div>
  );
}
