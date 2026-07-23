import { useEffect, useState } from "react";
import { Play, RotateCcw, Eye } from "lucide-react";
import CodeEditor from "../../editor/CodeEditor";
import OutputConsole from "../../editor/OutputConsole";
import PlotPanel from "../../plot/PlotPanel";
import ExecutionVisualizer from "../../visualizer/ExecutionVisualizer";
import { pyodideClient, type RunResult } from "../../../pyodide/pyodideClient";
import { usePyodideStore } from "../../../store/pyodideStore";
import { useCodeDraft } from "../../../lib/useCodeDraft";
import { useT } from "../../../i18n";
import type { RunnableBlock } from "../../../types/lesson";

export default function RunnableCode({
  block,
  draftKey,
}: {
  block: RunnableBlock;
  draftKey?: string;
}) {
  const { ready, boot, status } = usePyodideStore();
  const t = useT();
  const [code, setCode, resetCode] = useCodeDraft(draftKey, block.code);
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [visualizing, setVisualizing] = useState(false);

  // The step-through visualizer traces plain Python; it isn't meaningful for snippets that
  // pull in heavy packages or render a plot, so only offer it on pure-Python blocks.
  const canVisualize = !block.packages?.length && !block.expectPlot;

  useEffect(() => {
    boot();
  }, [boot]);

  const run = async () => {
    setRunning(true);
    setError("");
    try {
      const res = await pyodideClient.runCode(code, {
        packages: block.packages,
        expectPlot: block.expectPlot,
      });
      setResult(res);
    } catch (err) {
      setError(
        err instanceof Error
          ? `${t("editor.engineFailedRun")} ${err.message}`
          : t("editor.engineNoResponse"),
      );
    } finally {
      setRunning(false);
    }
  };

  // When visualizing, hand the current code to the ExecutionVisualizer instead.
  if (visualizing) {
    return (
      <div className="space-y-2">
        <ExecutionVisualizer
          initialCode={code}
          title={
            block.title
              ? `${block.title} — ${t("editor.stepThrough")}`
              : t("editor.stepThroughTitle")
          }
        />
        <button
          className="btn-ghost text-xs"
          onClick={() => setVisualizing(false)}
        >
          <Play className="h-3.5 w-3.5" /> {t("editor.backToRun")}
        </button>
      </div>
    );
  }

  return (
    <div className="glass overflow-hidden">
      {block.title && (
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2 text-sm font-semibold text-slate-200">
          <Play className="h-3.5 w-3.5 text-accent-cyan" /> {block.title}
        </div>
      )}
      <div className="space-y-3 p-4">
        <CodeEditor
          value={code}
          onChange={setCode}
          height={Math.min(360, 60 + code.split("\n").length * 20)}
          filename={block.title ? undefined : "example.py"}
          onRun={() => {
            if (!running && ready) run();
          }}
        />
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn-primary" onClick={run} disabled={running || !ready}>
            <Play className="h-4 w-4" />
            {running ? t("editor.running") : ready ? t("editor.run") : t("editor.loadingPython")}
          </button>
          {canVisualize && (
            <button
              className="btn-ghost"
              onClick={() => setVisualizing(true)}
              title={t("editor.visualizeTitle")}
            >
              <Eye className="h-4 w-4 text-accent-violet" /> {t("editor.visualize")}
            </button>
          )}
          <button
            className="btn-ghost"
            onClick={() => {
              resetCode();
              setResult(null);
              setError("");
            }}
          >
            <RotateCcw className="h-4 w-4" /> {t("editor.reset")}
          </button>
          {(!ready || (running && status !== "ready")) && (
            <span className="text-xs text-slate-400">{status}</span>
          )}
        </div>
        {error && (
          <pre className="overflow-auto rounded-lg border border-brand-red/40 bg-brand-red/10 px-3 py-2 font-mono text-xs text-brand-red">
            {error}
          </pre>
        )}
        <OutputConsole stdout={result?.stdout} stderr={result?.stderr} running={running} />
        {result?.plots && <PlotPanel plots={result.plots} />}
      </div>
    </div>
  );
}
