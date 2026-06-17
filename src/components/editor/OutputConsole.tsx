interface Props {
  stdout?: string;
  stderr?: string;
  running?: boolean;
  placeholder?: string;
}

export default function OutputConsole({
  stdout = "",
  stderr = "",
  running = false,
  placeholder = "Output will appear here. Press Run ▶",
}: Props) {
  const empty = !stdout && !stderr && !running;
  return (
    <div className="rounded-lg border border-ink-600/60 bg-ink-900/80">
      <div className="flex items-center justify-between border-b border-ink-600/60 px-3 py-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Console
        </span>
        {running && <span className="pill bg-brand/20 text-brand">running…</span>}
      </div>
      <pre className="max-h-64 overflow-auto px-3 py-2 font-mono text-[13px] leading-relaxed">
        {empty && <span className="text-slate-500">{placeholder}</span>}
        {stdout && <span className="text-slate-100">{stdout}</span>}
        {stderr && <span className="text-brand-red">{stderr}</span>}
      </pre>
    </div>
  );
}
