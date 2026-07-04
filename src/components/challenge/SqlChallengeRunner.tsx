import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Eye, EyeOff, Lightbulb, Play, RotateCcw, Trophy, X } from "lucide-react";
import CodeEditor from "../editor/CodeEditor";
import SqlResultTable from "../sql/SqlResultTable";
import { sqlClient, type SqlExecResult } from "../../sql/sqlClient";
import { useSqlStore } from "../../store/sqlStore";
import { useProgressStore } from "../../store/progressStore";
import { celebrate } from "../../lib/confetti";
import { useCodeDraft } from "../../lib/useCodeDraft";
import { compareResultSets } from "../../lib/sqlCompare";
import type { SqlChallengeBlock } from "../../types/lesson";

interface Props {
  block: SqlChallengeBlock;
  /** Stable id for progress tracking (lessonId::blockIndex). */
  id: string;
}

export default function SqlChallengeRunner({ block, id }: Props) {
  const { ready, boot, status } = useSqlStore();
  const solveChallenge = useProgressStore((s) => s.solveChallenge);
  const alreadySolved = useProgressStore((s) => s.isChallengeSolved(id));

  const [sql, setSql, resetSql] = useCodeDraft(id, block.starterSql);
  const [result, setResult] = useState<SqlExecResult | null>(null);
  const [verdict, setVerdict] = useState<{ pass: boolean; reason?: string } | null>(null);
  const [running, setRunning] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [revealedHints, setRevealedHints] = useState(0);
  const hints = block.hints ?? [];

  useEffect(() => {
    boot();
  }, [boot]);

  const submit = async () => {
    setRunning(true);
    setVerdict(null);
    try {
      // Run against a freshly seeded DB so prior blocks/runs can't affect the result.
      await sqlClient.reset(block.seedId);
      const expected = await sqlClient.queryRows(block.solution);
      await sqlClient.reset(block.seedId);
      const userRows = await sqlClient.queryRows(sql);

      // Mirror the result grid using the user's query (re-exec for the display shape).
      const display = await sqlClient.exec(sql);
      setResult(display);

      if (!userRows.ok) {
        setVerdict({ pass: false, reason: userRows.error ?? "Your query raised an error." });
        return;
      }
      if (!expected.ok) {
        setVerdict({ pass: false, reason: "Reference solution failed to run (please report)." });
        return;
      }

      const cmp = compareResultSets(userRows, expected, block.ordered);
      setVerdict(cmp);
      if (cmp.pass) {
        if (!alreadySolved) celebrate();
        solveChallenge(id, block.xp ?? 50);
      }
    } finally {
      setRunning(false);
    }
  };

  const solved = alreadySolved || verdict?.pass;

  return (
    <div className="glass overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-100">
          <Trophy className="h-4 w-4 text-accent-lime" /> {block.title}
        </span>
        {solved && (
          <span className="pill border-accent-lime/30 bg-accent-lime/10 text-accent-lime">
            <Check className="h-3 w-3" /> Solved
          </span>
        )}
      </div>

      <div className="space-y-4 p-4">
        <div className="prose-pylearn text-sm text-slate-300">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{block.prompt}</ReactMarkdown>
        </div>

        <CodeEditor
          value={sql}
          onChange={setSql}
          language="sql"
          height={220}
          onRun={() => {
            if (!running && ready) submit();
          }}
        />

        <div className="flex flex-wrap items-center gap-2">
          <button className="btn-primary" onClick={submit} disabled={running || !ready}>
            <Play className="h-4 w-4" />
            {running ? "Checking…" : ready ? "Submit" : "Loading Postgres…"}
          </button>
          <button
            className="btn-ghost"
            onClick={() => {
              resetSql();
              setResult(null);
              setVerdict(null);
            }}
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
          {revealedHints < hints.length && (
            <button className="btn-ghost" onClick={() => setRevealedHints((n) => n + 1)}>
              <Lightbulb className="h-4 w-4 text-amber-300" />
              {revealedHints === 0 ? "Hint" : `Hint ${revealedHints + 1}/${hints.length}`}
            </button>
          )}
          {block.solution && (
            <button className="btn-ghost" onClick={() => setShowSolution((s) => !s)}>
              {showSolution ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showSolution ? "Hide solution" : "Show solution"}
            </button>
          )}
          {running && status !== "ready" && (
            <span className="text-xs text-slate-400">{status}</span>
          )}
        </div>

        {revealedHints > 0 && (
          <ul className="space-y-1.5">
            {hints.slice(0, revealedHints).map((h, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-lg border border-amber-300/20 bg-amber-400/5 px-3 py-2 text-sm text-amber-100"
              >
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        )}

        {verdict && (
          <div
            className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
              verdict.pass
                ? "border-accent-lime/30 bg-accent-lime/10 text-accent-lime"
                : "border-brand-red/30 bg-brand-red/10 text-brand-red"
            }`}
          >
            {verdict.pass ? (
              <Check className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <X className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{verdict.pass ? "Correct — nice! 🎉" : verdict.reason}</span>
          </div>
        )}

        {result && <SqlResultTable result={result} />}

        {showSolution && (
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Reference solution
            </div>
            <CodeEditor value={block.solution} language="sql" height={160} readOnly />
          </div>
        )}
      </div>
    </div>
  );
}
