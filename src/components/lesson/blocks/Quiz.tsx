import { useState } from "react";
import type { QuizBlock } from "../../../types/lesson";

export default function Quiz({ block }: { block: QuizBlock }) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  const correct = answered && !!block.options[picked!].correct;

  return (
    <div className="card p-4">
      <div className="mb-3 text-sm font-semibold text-slate-100">❓ {block.question}</div>
      <div className="space-y-2">
        {block.options.map((opt, i) => {
          const show = answered;
          const isCorrect = !!opt.correct;
          const isPicked = picked === i;
          let cls = "border-ink-600 bg-ink-700 hover:bg-ink-600";
          if (show && isCorrect) cls = "border-brand-green/50 bg-brand-green/15";
          else if (show && isPicked && !isCorrect)
            cls = "border-brand-red/50 bg-brand-red/15";
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => setPicked(i)}
              className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm text-slate-200 transition-colors ${cls}`}
            >
              <span className="font-mono text-xs text-slate-500">
                {String.fromCharCode(65 + i)}
              </span>
              <span>{opt.text}</span>
              {show && isCorrect && <span className="ml-auto">✓</span>}
              {show && isPicked && !isCorrect && <span className="ml-auto">✗</span>}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className="mt-3 text-sm">
          <span className={correct ? "text-brand-green" : "text-brand-red"}>
            {correct ? "Correct! 🎉" : "Not quite."}
          </span>
          {block.explanation && (
            <span className="ml-2 text-slate-400">{block.explanation}</span>
          )}
          {!correct && (
            <button
              className="ml-3 text-xs text-brand underline"
              onClick={() => setPicked(null)}
            >
              try again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
