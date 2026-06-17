interface Props {
  /** base64-encoded PNG strings (no data: prefix). */
  plots: string[];
}

export default function PlotPanel({ plots }: Props) {
  if (!plots.length) return null;
  return (
    <div className="space-y-3 rounded-lg border border-ink-600/60 bg-white/95 p-3">
      {plots.map((b64, i) => (
        <img
          key={i}
          src={`data:image/png;base64,${b64}`}
          alt={`Figure ${i + 1}`}
          className="mx-auto max-w-full rounded"
        />
      ))}
    </div>
  );
}
