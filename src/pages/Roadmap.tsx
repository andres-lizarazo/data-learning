import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Map as MapIcon, Play } from "lucide-react";
import { curriculum, modulesByTrack, tracks } from "../content/curriculum";
import { useProgressStore } from "../store/progressStore";
import { useLocaleStore } from "../store/localeStore";
import { moduleGradient, moduleTheme } from "../lib/moduleTheme";
import { useT, trackLabel, levelLabel, moduleTitle, moduleBlurb, type MessageKey } from "../i18n";
import type { Module, Track } from "../types/lesson";

// The recommended learning path: every module in curriculum order, grouped by track,
// numbered as one continuous journey, with progress and a "you are here" marker.

const TRACK_BLURB_KEY: Record<Track, MessageKey> = {
  "Foundations & Tooling": "rm.blurbFoundations",
  Python: "rm.blurbPython",
  SQL: "rm.blurbSQL",
  "Software Design": "rm.blurbDesign",
  "Data Engineering": "rm.blurbDE",
  Cloud: "rm.blurbCloud",
};

function moduleProgress(m: Module, completed: Record<string, true>) {
  const done = m.lessons.filter((l) => completed[l.id]).length;
  return { done, total: m.lessons.length, pct: m.lessons.length ? (done / m.lessons.length) * 100 : 0 };
}

export default function Roadmap() {
  const completed = useProgressStore((s) => s.completedLessons);
  const locale = useLocaleStore((s) => s.locale);
  const t = useT();

  // "You are here" = the first module in path order that isn't fully complete.
  const currentModuleId = useMemo(() => {
    for (const m of curriculum) {
      if (m.lessons.some((l) => !completed[l.id])) return m.id;
    }
    return null;
  }, [completed]);

  // Continue CTA: first incomplete lesson of the current module.
  const continueTarget = useMemo(() => {
    const m = curriculum.find((x) => x.id === currentModuleId);
    const lesson = m?.lessons.find((l) => !completed[l.id]);
    return m && lesson ? { moduleId: m.id, lessonId: lesson.id, title: lesson.title } : null;
  }, [currentModuleId, completed]);

  let step = 0;

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="flex items-center gap-2 font-display text-3xl font-bold tracking-tight text-white">
        <MapIcon className="h-7 w-7 text-accent-cyan" /> {t("home.learningPath")}
      </h1>
      <p className="mt-1 text-slate-400">{t("rm.intro")}</p>

      {continueTarget && (
        <Link
          to={`/learn/${continueTarget.moduleId}/${continueTarget.lessonId}`}
          className="btn-primary mt-5 inline-flex"
        >
          <Play className="h-4 w-4" /> {t("home.continue")}: {continueTarget.title}
        </Link>
      )}

      <div className="mt-8 space-y-10">
        {tracks().map((track, ti) => (
          <section key={track}>
            <div className="mb-1 flex items-baseline gap-3">
              <span className="font-mono text-xs text-slate-500">{t("rm.stage")} {ti + 1}</span>
              <h2 className="font-display text-xl font-bold text-white">
                {trackLabel(track, locale)}
              </h2>
            </div>
            <p className="mb-4 text-sm text-slate-400">{t(TRACK_BLURB_KEY[track])}</p>

            <ol className="relative ml-3 space-y-3 border-l border-white/10 pl-6">
              {modulesByTrack(track).map((m) => {
                step += 1;
                const { done, total, pct } = moduleProgress(m, completed);
                const complete = done === total && total > 0;
                const isHere = m.id === currentModuleId;
                const theme = moduleTheme(m.id);
                return (
                  <li key={m.id} className="relative">
                    {/* Timeline dot */}
                    <span
                      className="absolute -left-[31px] top-4 grid h-5 w-5 place-items-center rounded-full border text-[10px] font-bold"
                      style={{
                        background: complete ? moduleGradient(m.id) : "#12122a",
                        borderColor: complete || isHere ? theme.solid : "rgba(255,255,255,0.15)",
                        color: complete ? "#0a0a16" : theme.solid,
                      }}
                      aria-hidden
                    >
                      {complete ? <Check className="h-3 w-3" /> : step}
                    </span>

                    <Link
                      to={`/learn/${m.id}`}
                      className="glass block p-4 transition-colors hover:bg-white/[0.07]"
                      style={isHere ? { outline: `1px solid ${theme.solid}` } : undefined}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span aria-hidden>{m.icon}</span>
                        <span className="font-semibold text-white">{moduleTitle(m, locale)}</span>
                        <span className="pill border-white/10 bg-white/5 text-[10px] text-slate-400">
                          {levelLabel(m.level, locale)}
                        </span>
                        {isHere && (
                          <span
                            className="pill border-transparent text-[10px] font-semibold"
                            style={{ background: `${theme.solid}22`, color: theme.solid }}
                          >
                            {t("rm.youAreHere")}
                          </span>
                        )}
                        <span className="ml-auto font-mono text-xs text-slate-400">
                          {done}/{total}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-400">{moduleBlurb(m, locale)}</p>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full transition-[width] duration-500"
                          style={{ width: `${pct}%`, background: moduleGradient(m.id) }}
                        />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>

      <div className="mt-10 flex items-center gap-2 text-sm text-slate-500">
        <ArrowRight className="h-4 w-4" />
        {t("rm.footer")}
      </div>
    </div>
  );
}
