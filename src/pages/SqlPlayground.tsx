import { useEffect, useState } from "react";
import { Play, RotateCcw, Database, RefreshCw } from "lucide-react";
import CodeEditor from "../components/editor/CodeEditor";
import SqlResultTable from "../components/sql/SqlResultTable";
import SchemaExplorer from "../components/sql/SchemaExplorer";
import { sqlClient, type SqlExecResult } from "../sql/sqlClient";
import { SEED_LABELS, type SeedId } from "../sql/seeds";
import { useSqlStore } from "../store/sqlStore";
import { useCodeDraft } from "../lib/useCodeDraft";
import { useT } from "../i18n";

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
  const t = useT();
  const [sql, setSql, resetSql] = useCodeDraft("sql-playground", DEFAULT);
  const [result, setResult] = useState<SqlExecResult | null>(null);
  const [running, setRunning] = useState(false);
  const [seedId, setSeedId] = useState<SeedId>("ecommerce");

  useEffect(() => {
    boot();
  }, [boot]);

  const run = async () => {
    setRunning(true);
    try {
      setResult(await sqlClient.exec(sql, { seedId }));
    } finally {
      setRunning(false);
    }
  };

  const resetDb = async (target: SeedId = seedId) => {
    setRunning(true);
    try {
      await sqlClient.reset(target);
      setResult(null);
    } finally {
      setRunning(false);
    }
  };

  const switchSeed = (next: SeedId) => {
    setSeedId(next);
    // Switching datasets always rebuilds so the explorer matches what's loaded.
    void resetDb(next);
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-white">
        <Database className="h-6 w-6 text-accent-cyan" /> {t("cmd.pSqlPlayground")}
      </h1>
      <p className="mb-5 text-slate-400">{t("pg.sqlSubtitle")}</p>

      <div className="mb-3 flex items-center gap-2 text-sm">
        <label htmlFor="seed-picker" className="text-slate-400">
          {t("pg.dataset")}
        </label>
        <select
          id="seed-picker"
          value={seedId}
          onChange={(e) => switchSeed(e.target.value as SeedId)}
          disabled={running || !ready}
          className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-slate-200 outline-none focus:border-white/25"
        >
          {(Object.keys(SEED_LABELS) as SeedId[]).map((id) => (
            <option key={id} value={id} className="bg-ink-900">
              {SEED_LABELS[id].label} — {SEED_LABELS[id].blurb}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-5">
        <SchemaExplorer seedId={seedId} />
      </div>

      <div className="space-y-3">
        <CodeEditor
          value={sql}
          onChange={setSql}
          language="sql"
          height={300}
          onRun={() => {
            if (!running && ready) run();
          }}
        />
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn-primary" onClick={run} disabled={running || !ready}>
            <Play className="h-4 w-4" />
            {running ? t("editor.running") : ready ? t("editor.run") : t("sql.loadingPostgres")}
          </button>
          <button
            className="btn-ghost"
            onClick={() => {
              resetSql();
              setResult(null);
            }}
          >
            <RotateCcw className="h-4 w-4" /> {t("pg.resetQuery")}
          </button>
          <button className="btn-ghost" onClick={() => resetDb()} disabled={running || !ready}>
            <RefreshCw className="h-4 w-4 text-accent-cyan" /> {t("pg.resetDb")}
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
