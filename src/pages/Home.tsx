import { Link } from "react-router-dom";
import { curriculum, totalLessons } from "../content/curriculum";
import { useProgressStore } from "../store/progressStore";

export default function Home() {
  const completed = useProgressStore((s) => s.completedLessons);
  const xp = useProgressStore((s) => s.xp);
  const doneCount = Object.keys(completed).length;
  const total = totalLessons();

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <section className="mb-8">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          Learn Python, <span className="text-brand">visually</span>.
        </h1>
        <p className="mt-3 max-w-2xl text-slate-300">
          An interactive, CodeSignal-style playground. Write code that runs right in
          your browser, <b>watch loops and algorithms animate step by step</b>, and
          solve challenges — from Python basics to data wrangling and DSA.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link to="/learn/basics/variables-and-types" className="btn-primary">
            Start learning →
          </Link>
          <Link to="/playground" className="btn-ghost">
            Open Playground
          </Link>
          <span className="text-sm text-slate-400">
            {doneCount}/{total} lessons · ⭐ {xp} XP
          </span>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {curriculum.map((m) => {
          const done = m.lessons.filter((l) => completed[l.id]).length;
          return (
            <Link
              key={m.id}
              to={`/learn/${m.id}`}
              className="card group p-5 transition-colors hover:border-brand/60"
            >
              <div className="flex items-center justify-between">
                <span className="text-3xl">{m.icon}</span>
                <span className="pill bg-ink-700 text-slate-300">{m.level}</span>
              </div>
              <h3 className="mt-3 font-semibold text-white group-hover:text-brand">
                {m.title}
              </h3>
              <p className="mt-1 text-sm text-slate-400">{m.blurb}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <span>
                  {done}/{m.lessons.length} lessons
                </span>
                {m.status === "starter" && (
                  <span className="pill bg-ink-700 text-slate-400">starter</span>
                )}
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-700">
                <div
                  className="h-full rounded-full bg-brand-green transition-all"
                  style={{ width: `${(done / m.lessons.length) * 100}%` }}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
