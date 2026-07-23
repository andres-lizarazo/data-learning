import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Home } from "lucide-react";
import { modulesByTrack, tracks } from "../../content/curriculum";
import { useProgressStore } from "../../store/progressStore";
import { useLocaleStore } from "../../store/localeStore";
import { moduleTheme } from "../../lib/moduleTheme";
import { useT, trackLabel, moduleTitle } from "../../i18n";

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const completed = useProgressStore((s) => s.completedLessons);
  const locale = useLocaleStore((s) => s.locale);
  const t = useT();

  return (
    <nav className="glass m-3 h-[calc(100%-1.5rem)] overflow-y-auto rounded-2xl px-2.5 py-3">
      <NavLink
        to="/"
        end
        onClick={onNavigate}
        className={({ isActive }) =>
          `mb-2 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
            isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"
          }`
        }
      >
        <Home className="h-4 w-4" /> {t("nav.home")}
      </NavLink>

      {tracks().map((track) => (
        <div key={track} className="mb-2">
          <div className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">
            {trackLabel(track, locale)}
          </div>
          {modulesByTrack(track).map((m) => {
        const theme = moduleTheme(m.id);
        const done = m.lessons.filter((l) => completed[l.id]).length;
        const allDone = done === m.lessons.length;
        return (
          <div key={m.id} className="mb-3">
            <div className="flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: theme.solid, boxShadow: `0 0 8px ${theme.solid}` }}
              />
              <span className="text-slate-300">{moduleTitle(m, locale)}</span>
              {allDone && <span className="ml-auto text-[11px] text-accent-lime">★</span>}
            </div>
            <ul className="mt-0.5">
              {m.lessons.map((l) => {
                const isDone = !!completed[l.id];
                return (
                  <li key={l.id}>
                    <NavLink
                      to={`/learn/${m.id}/${l.id}`}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        `relative flex items-center gap-2 rounded-lg py-1.5 pl-3 pr-2 text-sm transition-colors ${
                          isActive
                            ? "bg-white/[0.07] text-white"
                            : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <motion.span
                              layoutId="sidebar-active"
                              className="absolute left-0 top-1.5 h-[calc(100%-0.75rem)] w-0.5 rounded-full"
                              style={{ background: theme.solid }}
                              transition={{ type: "spring", stiffness: 380, damping: 32 }}
                            />
                          )}
                          {isDone ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-accent-lime" />
                          ) : (
                            <Circle className="h-4 w-4 shrink-0 text-slate-600" />
                          )}
                          <span className="truncate">{l.title}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        );
          })}
        </div>
      ))}
    </nav>
  );
}
