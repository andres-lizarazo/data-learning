import { useEffect, useState } from "react";
import { Play, RotateCcw, Database, RefreshCw } from "lucide-react";
import CodeEditor from "../components/editor/CodeEditor";
import SqlResultTable from "../components/sql/SqlResultTable";
import SchemaExplorer from "../components/sql/SchemaExplorer";
import { sqlClient, type SqlExecResult } from "../sql/sqlClient";
import { useSqlStore } from "../store/sqlStore";
import { useCodeDraft } from "../lib/useCodeDraft";

const DEFAULT = `-- Free SQL playground — real PostgreSQL in your browser (PGlite).
-- Query the sample e-commerce database. Open "Sample database" below for the schema.

SELECT u.name, COUNT(o.id) AS orders, SUM(o.total) FILTER (WHERE o.status = 'paid') AS paid
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id, u.name
ORDER BY paid DESC NULLS LAST;
`;

export default function SqlPlayground() {
  const { ready, boot, status } = useSqlStore();
  const [sql, setSql, resetSql] = useCodeDraft("sql-playground", DEFAULT);
  const [result, setResult] = useState<SqlExecResult | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    boot();
  }, [boot]);

  const run = async () => {
    setRunning(true);
    try {
      setResult(await sqlClient.exec(sql));
    } finally {
      setRunning(false);
    }
  };

  const resetDb = async () => {
    setRunning(true);
    try {
      await sqlClient.reset();
      setResult(null);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-white">
        <Database className="h-6 w-6 text-accent-cyan" /> SQL Playground
      </h1>
      <p className="mb-5 text-slate-400">
        A scratchpad running real PostgreSQL in your browser. Nothing is sent to a server.
      </p>

      <div className="mb-5">
        <SchemaExplorer />
      </div>

      <div className="space-y-3">
        <CodeEditor value={sql} onChange={setSql} language="sql" height={300} />
        <div className="flex flex-wrap items-center gap-2">
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
            <RotateCcw className="h-4 w-4" /> Reset query
          </button>
          <button className="btn-ghost" onClick={resetDb} disabled={running || !ready}>
            <RefreshCw className="h-4 w-4 text-accent-cyan" /> Reset database
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
