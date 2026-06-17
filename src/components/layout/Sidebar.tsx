import { NavLink } from "react-router-dom";
import { curriculum } from "../../content/curriculum";
import { useProgressStore } from "../../store/progressStore";

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const completed = useProgressStore((s) => s.completedLessons);

  return (
    <nav className="h-full overflow-y-auto px-3 py-4">
      <NavLink
        to="/"
        end
        onClick={onNavigate}
        className={({ isActive }) =>
          `mb-2 block rounded-lg px-3 py-2 text-sm font-medium ${
            isActive ? "bg-brand/20 text-white" : "text-slate-300 hover:bg-ink-700"
          }`
        }
      >
        🏠 Home
      </NavLink>

      {curriculum.map((m) => (
        <div key={m.id} className="mb-3">
          <div className="flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <span>{m.icon}</span>
            <span>{m.title}</span>
            {m.status === "starter" && (
              <span className="pill bg-ink-700 text-[10px] text-slate-400">starter</span>
            )}
          </div>
          <ul>
            {m.lessons.map((l) => {
              const done = !!completed[l.id];
              return (
                <li key={l.id}>
                  <NavLink
                    to={`/learn/${m.id}/${l.id}`}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `flex items-center gap-2 rounded-md px-3 py-1.5 text-sm ${
                        isActive
                          ? "bg-brand/20 text-white"
                          : "text-slate-300 hover:bg-ink-700"
                      }`
                    }
                  >
                    <span className={done ? "text-brand-green" : "text-slate-600"}>
                      {done ? "✓" : "○"}
                    </span>
                    <span className="truncate">{l.title}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
