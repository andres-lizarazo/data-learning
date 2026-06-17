import { Link, useParams } from "react-router-dom";
import { getModule } from "../content/curriculum";
import { useProgressStore } from "../store/progressStore";

export default function ModulePage() {
  const { moduleId } = useParams();
  const module = moduleId ? getModule(moduleId) : undefined;
  const completed = useProgressStore((s) => s.completedLessons);

  if (!module) {
    return <div className="p-8 text-slate-300">Module not found.</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <Link to="/" className="text-sm text-slate-400 hover:text-brand">
        ← All modules
      </Link>
      <div className="mt-3 flex items-center gap-3">
        <span className="text-4xl">{module.icon}</span>
        <div>
          <h1 className="text-2xl font-bold text-white">{module.title}</h1>
          <p className="text-slate-400">{module.blurb}</p>
        </div>
      </div>

      <ol className="mt-6 space-y-2">
        {module.lessons.map((l, i) => {
          const done = !!completed[l.id];
          return (
            <li key={l.id}>
              <Link
                to={`/learn/${module.id}/${l.id}`}
                className="card flex items-center gap-4 p-4 transition-colors hover:border-brand/60"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    done ? "bg-brand-green/20 text-brand-green" : "bg-ink-700 text-slate-300"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <div className="min-w-0">
                  <div className="font-medium text-white">{l.title}</div>
                  <div className="truncate text-sm text-slate-400">{l.summary}</div>
                </div>
                {l.minutes && (
                  <span className="ml-auto text-xs text-slate-500">{l.minutes} min</span>
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
