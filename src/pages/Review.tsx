import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Layers } from "lucide-react";
import FlashcardStudy from "../components/review/FlashcardStudy";
import { allCards, dueCards, useReviewStore } from "../store/reviewStore";
import { useT } from "../i18n";

// The spaced-repetition queue: every flashcard in the curriculum that is new or
// due today, studied in one session.
export default function Review() {
  const cardStates = useReviewStore((s) => s.cards);
  const t = useT();
  // Snapshot the queue once per visit — grading mid-session shouldn't reshuffle it.
  const [initialQueue] = useState(() => dueCards(cardStates));
  const total = useMemo(() => allCards().length, []);
  const studied = Object.keys(cardStates).length;

  return (
    <div className="mx-auto max-w-xl px-5 py-10">
      <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-white">
        <GraduationCap className="h-6 w-6 text-accent-violet" /> {t("nav.review")}
      </h1>
      <p className="mb-6 mt-1 text-slate-400">{t("rv.intro")}</p>

      <div className="mb-6 flex gap-3 text-sm">
        <span className="pill border-white/10 bg-white/5 text-slate-300">
          <Layers className="h-3.5 w-3.5 text-accent-cyan" /> {total} {t("rv.cardsInCurriculum")}
        </span>
        <span className="pill border-white/10 bg-white/5 text-slate-300">
          {studied} {t("rv.seenBefore")}
        </span>
      </div>

      {initialQueue.length === 0 ? (
        <div className="glass grid place-items-center gap-3 p-10 text-center">
          <p className="font-semibold text-white">{t("rv.caughtUp")}</p>
          <p className="text-sm text-slate-400">{t("rv.caughtUpHint")}</p>
          <Link to="/roadmap" className="btn-primary">
            {t("rv.findLesson")}
          </Link>
        </div>
      ) : (
        <div className="glass p-4">
          <FlashcardStudy cards={initialQueue} showSource />
        </div>
      )}
    </div>
  );
}
