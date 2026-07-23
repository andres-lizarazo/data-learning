import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Circle, Target } from "lucide-react";
import { curriculum } from "../content/curriculum";
import { allChallenges } from "../lib/challenges";
import { useProgressStore } from "../store/progressStore";
import { useLocaleStore } from "../store/localeStore";
import { moduleGradient } from "../lib/moduleTheme";
import { useT, moduleTitle, type MessageKey } from "../i18n";
import Reveal from "../components/ui/Reveal";

type StatusFilter = "all" | "solved" | "unsolved";
type Difficulty = "Easy" | "Medium" | "Hard";
type DiffFilter = "all" | Difficulty;

// XP is our difficulty proxy: authored so that harder problems award more.
function difficultyOf(xp: number): Difficulty {
  if (xp <= 50) return "Easy";
  if (xp <= 70) return "Medium";
  return "Hard";
}

const DIFF_STYLE: Record<Difficulty, string> = {
  Easy: "border-accent-lime/40 text-accent-lime",
  Medium: "border-brand-yellow/40 text-brand-yellow",
  Hard: "border-brand-red/40 text-brand-red",
};

const DIFF_KEY: Record<Difficulty, MessageKey> = {
  Easy: "pr.easy",
  Medium: "pr.medium",
  Hard: "pr.hard",
};
const STATUS_KEY: Record<StatusFilter, MessageKey> = {
  all: "pr.stAll",
  unsolved: "pr.stUnsolved",
  solved: "pr.stSolved",
};

export default function Practice() {
  const solved = useProgressStore((s) => s.solvedChallenges);
  const locale = useLocaleStore((s) => s.locale);
  const t = useT();
  const [moduleId, setModuleId] = useState<string>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [difficulty, setDifficulty] = useState<DiffFilter>("all");

  const all = useMemo(allChallenges, []);
  const solvedCount = all.filter((c) => solved[c.id]).length;

  const filtered = all.filter((c) => {
    if (moduleId !== "all" && c.moduleId !== moduleId) return false;
    if (difficulty !== "all" && difficultyOf(c.xp) !== difficulty) return false;
    const isSolved = !!solved[c.id];
    if (status === "solved" && !isSolved) return false;
    if (status === "unsolved" && isSolved) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent-gradient shadow-glow">
          <Target className="h-5 w-5 text-white" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold text-white">{t("pr.title")}</h1>
          <p className="text-slate-400">
            {t("pr.subA")} {solvedCount}/{all.length} {t("pr.solved")}.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <select
          className="select"
          aria-label={t("pr.filterModule")}
          value={moduleId}
          onChange={(e) => setModuleId(e.target.value)}
        >
          <option value="all">{t("pr.allModules")}</option>
          {curriculum.map((m) => (
            <option key={m.id} value={m.id}>
              {moduleTitle(m, locale)}
            </option>
          ))}
        </select>
        <div className="flex overflow-hidden rounded-lg border border-white/10">
          {(["all", "unsolved", "solved"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 text-xs transition-colors ${
                status === s ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5"
              }`}
            >
              {t(STATUS_KEY[s])}
            </button>
          ))}
        </div>
        <div className="flex overflow-hidden rounded-lg border border-white/10">
          {(["all", "Easy", "Medium", "Hard"] as DiffFilter[]).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-3 py-1.5 text-xs transition-colors ${
                difficulty === d ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5"
              }`}
            >
              {d === "all" ? t("pr.any") : t(DIFF_KEY[d])}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-slate-400">{filtered.length} {t("pr.shown")}</span>
      </div>

      {/* List */}
      <ul className="mt-5 space-y-2.5">
        {filtered.length === 0 && (
          <li className="glass p-6 text-center text-sm text-slate-500">
            {t("pr.noMatch")}
          </li>
        )}
        {filtered.map((c, i) => {
          const isSolved = !!solved[c.id];
          return (
            <Reveal key={c.id} delay={Math.min(i * 0.02, 0.3)}>
              <Link
                to={`/learn/${c.moduleId}/${c.lessonId}`}
                className="glass group flex items-center gap-3 p-4 transition-shadow hover:glow-ring"
              >
                {isSolved ? (
                  <Check className="h-5 w-5 shrink-0 text-accent-lime" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-slate-600" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-white">{c.title}</div>
                  <div className="truncate text-xs text-slate-400">{c.lessonTitle}</div>
                </div>
                <span className={`pill hidden sm:inline-flex ${DIFF_STYLE[difficultyOf(c.xp)]}`}>
                  {t(DIFF_KEY[difficultyOf(c.xp)])}
                </span>
                <span
                  className="pill text-white"
                  style={{ background: moduleGradient(c.moduleId, 145) }}
                >
                  {c.moduleIcon}
                </span>
                <span className="hidden text-xs text-slate-400 sm:inline">+{c.xp} XP</span>
              </Link>
            </Reveal>
          );
        })}
      </ul>
    </div>
  );
}
