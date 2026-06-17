import { Link } from "react-router-dom";
import { useProgressStore } from "../../store/progressStore";
import { usePyodideStore } from "../../store/pyodideStore";

export default function TopBar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const xp = useProgressStore((s) => s.xp);
  const streak = useProgressStore((s) => s.streakDays);
  const { ready, booting, status } = usePyodideStore();

  return (
    <header className="flex items-center gap-3 border-b border-ink-600/60 bg-ink-800/80 px-4 py-2.5 backdrop-blur">
      <button
        className="btn-ghost md:hidden"
        onClick={onToggleSidebar}
        aria-label="Toggle menu"
      >
        ☰
      </button>
      <Link to="/" className="flex items-center gap-2 text-lg font-bold text-white">
        <span>🐍</span>
        <span>
          Py<span className="text-brand">Learn</span>
        </span>
      </Link>

      <div className="ml-auto flex items-center gap-2 text-sm">
        <span className="pill bg-ink-700 text-slate-300" title="Python interpreter status">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              ready
                ? "bg-brand-green"
                : booting
                  ? "animate-pulse bg-brand-yellow"
                  : "bg-slate-500"
            }`}
          />
          {ready ? "Python ready" : booting ? status : "Python idle"}
        </span>
        <span className="pill bg-brand-yellow/15 text-brand-yellow" title="Streak">
          🔥 {streak}d
        </span>
        <span className="pill bg-brand/15 text-brand" title="Experience points">
          ⭐ {xp} XP
        </span>
        <Link to="/playground" className="btn-ghost hidden sm:inline-flex">
          Playground
        </Link>
      </div>
    </header>
  );
}
