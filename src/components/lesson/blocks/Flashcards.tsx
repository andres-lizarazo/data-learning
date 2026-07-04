import { useMemo } from "react";
import { Layers } from "lucide-react";
import FlashcardStudy from "../../review/FlashcardStudy";
import { cardId, type DeckCard } from "../../../store/reviewStore";
import type { FlashcardsBlock } from "../../../types/lesson";

// Inline flashcard deck inside a lesson. Grading here seeds the persistent
// spaced-repetition schedule — the cards resurface on /review when due.
export default function Flashcards({
  block,
  lessonId,
}: {
  block: FlashcardsBlock;
  lessonId: string;
}) {
  const cards: DeckCard[] = useMemo(
    () =>
      block.cards.map((c) => ({
        id: cardId(lessonId, c.front),
        moduleId: "",
        lessonId,
        lessonTitle: "",
        front: c.front,
        back: c.back,
      })),
    [block, lessonId],
  );

  return (
    <div className="glass overflow-hidden">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2 text-sm font-semibold text-slate-200">
        <Layers className="h-3.5 w-3.5 text-accent-violet" />
        {block.title ?? "Flashcards"}
        <span className="pill ml-auto border-white/10 bg-white/5 text-[10px] text-slate-400">
          {block.cards.length} cards
        </span>
      </div>
      <div className="p-4">
        <FlashcardStudy cards={cards} />
      </div>
    </div>
  );
}
