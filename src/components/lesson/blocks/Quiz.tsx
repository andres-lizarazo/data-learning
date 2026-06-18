import { useState } from "react";
import { motion } from "framer-motion";
import { Check, HelpCircle, X } from "lucide-react";
import type { QuizBlock } from "../../../types/lesson";

export default function Quiz({ block }: { block: QuizBlock }) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  const correct = answered && !!block.options[picked!].correct;

  return (
    <div className="glass p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-100">
        <HelpCircle className="h-4 w-4 text-accent-cyan" /> {block.question}
      </div>
      <div className="space-y-2">
        {block.options.map((opt, i) => {
          const show = answered;
          const isCorrect = !!opt.correct;
          const isPicked = picked === i;
          let cls = "border-white/10 bg-white/5 hover:bg-white/10";
          if (show && isCorrect) cls = "border-accent-lime/40 bg-accent-lime/10";
          else if (show && isPicked && !isCorrect)
            cls = "border-brand-red/40 bg-brand-red/10";
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => setPicked(i)}
              className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-sm text-slate-200 transition-colors ${cls}`}
            >
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md border border-white/10 font-mono text-xs text-slate-400">
                {String.fromCharCode(65 + i)}
              </span>
              <span>{opt.text}</span>
              {show && isCorrect && (
                <Check className="ml-auto h-4 w-4 text-accent-lime" />
              )}
              {show && isPicked && !isCorrect && (
                <X className="ml-auto h-4 w-4 text-brand-red" />
              )}
            </button>
          );
        })}
      </div>
      {answered && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-sm"
        >
          <span className={correct ? "text-accent-lime" : "text-brand-red"}>
            {correct ? "Correct! 🎉" : "Not quite."}
          </span>
          {block.explanation && (
            <span className="ml-2 text-slate-400">{block.explanation}</span>
          )}
          {!correct && (
            <button
              className="ml-3 text-xs text-accent-cyan underline"
              onClick={() => setPicked(null)}
            >
              try again
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
