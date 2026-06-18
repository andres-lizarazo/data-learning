import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { getModule } from "../content/curriculum";
import { useProgressStore } from "../store/progressStore";
import { moduleGradient } from "../lib/moduleTheme";
import Reveal from "../components/ui/Reveal";

export default function ModulePage() {
  const { moduleId } = useParams();
  const module = moduleId ? getModule(moduleId) : undefined;
  const completed = useProgressStore((s) => s.completedLessons);

  if (!module) {
    return <div className="p-8 text-slate-300">Module not found.</div>;
  }

  const done = module.lessons.filter((l) => completed[l.id]).length;
  const pct = Math.round((done / module.lessons.length) * 100);

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> All modules
      </Link>

      <div className="mt-4 flex items-center gap-4">
        <span
          className="grid h-14 w-14 place-items-center rounded-2xl text-3xl shadow-glow"
          style={{ background: moduleGradient(module.id, 145) }}
        >
          {module.icon}
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold text-white">{module.title}</h1>
          <p className="text-slate-400">{module.blurb}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 text-sm text-slate-400">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, background: moduleGradient(module.id) }}
          />
        </div>
        <span>
          {done}/{module.lessons.length} done
        </span>
      </div>

      <ol className="mt-6 space-y-2.5">
        {module.lessons.map((l, i) => {
          const isDone = !!completed[l.id];
          return (
            <Reveal key={l.id} delay={i * 0.04}>
              <Link
                to={`/learn/${module.id}/${l.id}`}
                className="glass group flex items-center gap-4 p-4 transition-shadow hover:glow-ring"
              >
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-semibold text-white"
                  style={{
                    background: isDone ? moduleGradient(module.id, 145) : "rgba(255,255,255,0.06)",
                  }}
                >
                  {isDone ? <CheckCircle2 className="h-5 w-5" /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-white">{l.title}</div>
                  <div className="truncate text-sm text-slate-400">{l.summary}</div>
                </div>
                {l.minutes && (
                  <span className="hidden items-center gap-1 text-xs text-slate-500 sm:inline-flex">
                    <Clock className="h-3.5 w-3.5" /> {l.minutes}m
                  </span>
                )}
                <ArrowRight className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-white" />
              </Link>
            </Reveal>
          );
        })}
      </ol>
    </div>
  );
}
