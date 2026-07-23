import { useCallback, useEffect, useState } from "react";
import { Check, RotateCw, Zap } from "lucide-react";
import { useReviewStore, type DeckCard, type Grade } from "../../store/reviewStore";

// One study session over a list of cards: flip → grade (Again/Good/Easy).
// "Again" re-queues the card at the end of this session; grades also feed the
// persistent spaced-repetition schedule. Used inline in lessons and on /review.
export default function FlashcardStudy({
  cards,
  showSource = false,
  onFinished,
}: {
  cards: DeckCard[];
  /** Show which lesson each card came from (used on /review). */
  showSource?: boolean;
  onFinished?: () => void;
}) {
  const grade = useReviewStore((s) => s.grade);
  const [queue, setQueue] = useState<DeckCard[]>(cards);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);

  // A new deck (e.g. navigating between lessons) restarts the session.
  useEffect(() => {
    setQueue(cards);
    setFlipped(false);
    setDone(0);
  }, [cards]);

  const card = queue[0];

  const answer = useCallback(
    (g: Grade) => {
      if (!card) return;
      grade(card.id, g);
      setFlipped(false);
      setQueue((q) => {
        // "again" → back of this session's queue; otherwise the card is done.
        const rest = q.slice(1);
        const next = g === "again" ? [...rest, card] : rest;
        if (next.length === 0) onFinished?.();
        return next;
      });
      if (g !== "again") setDone((n) => n + 1);
    },
    [card, grade, onFinished],
  );

  // Keyboard shortcuts: Space/Enter flips; once flipped, 1/2/3 grade Again/Good/Easy.
  // Registered unconditionally (before any early return) to respect the rules of hooks.
  useEffect(() => {
    if (!card) return;
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return;
      if (!flipped) {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          setFlipped(true);
        }
        return;
      }
      if (e.key === "1") answer("again");
      else if (e.key === "2") answer("good");
      else if (e.key === "3") answer("easy");
      else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipped, card, answer]);

  if (!card) {
    return (
      <div className="grid place-items-center gap-2 py-10 text-center">
        <Check className="h-8 w-8 text-accent-lime" />
        <p className="font-semibold text-white">Deck complete!</p>
        <p className="text-sm text-slate-400">
          Graded cards return in the review queue when they're due.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>
          {done}/{done + queue.length} done
        </span>
        {showSource && <span className="truncate pl-3">{card.lessonTitle}</span>}
      </div>

      <button
        className="block w-full rounded-xl border border-white/10 bg-white/[0.03] p-6 text-left transition-colors hover:border-white/25"
        onClick={() => setFlipped((f) => !f)}
        aria-label={flipped ? "Show question" : "Reveal answer"}
      >
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {flipped ? "Answer" : "Question — tap to reveal"}
        </div>
        <div className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-slate-100">
          {flipped ? card.back : card.front}
        </div>
      </button>

      {flipped ? (
        <div className="flex gap-2">
          <button
            className="btn-ghost flex-1 justify-center border-rose-400/30 text-rose-300"
            onClick={() => answer("again")}
          >
            <RotateCw className="h-4 w-4" /> Again <kbd className="pill ml-1 px-1.5 text-[10px]">1</kbd>
          </button>
          <button className="btn-ghost flex-1 justify-center" onClick={() => answer("good")}>
            <Check className="h-4 w-4 text-accent-cyan" /> Good <kbd className="pill ml-1 px-1.5 text-[10px]">2</kbd>
          </button>
          <button className="btn-ghost flex-1 justify-center" onClick={() => answer("easy")}>
            <Zap className="h-4 w-4 text-accent-lime" /> Easy <kbd className="pill ml-1 px-1.5 text-[10px]">3</kbd>
          </button>
        </div>
      ) : (
        <p className="text-center text-xs text-slate-500">
          Recall the answer first, then tap the card (or press Space).
        </p>
      )}
    </div>
  );
}
