import { Image } from "lucide-react";

interface Props {
  /** base64-encoded PNG strings (no data: prefix). */
  plots: string[];
}

export default function PlotPanel({ plots }: Props) {
  if (!plots.length) return null;
  return (
    <div className="glass overflow-hidden">
      <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <Image className="h-3.5 w-3.5 text-accent-violet" /> Figure
      </div>
      <div className="space-y-3 p-3">
        {plots.map((b64, i) => (
          <img
            key={i}
            src={`data:image/png;base64,${b64}`}
            alt={`Figure ${i + 1}`}
            className="mx-auto max-w-full rounded-lg"
          />
        ))}
      </div>
    </div>
  );
}
