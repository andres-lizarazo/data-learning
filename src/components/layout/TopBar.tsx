import { Link } from "react-router-dom";
import { BookText, Database, GraduationCap, Map as MapIcon, Menu, Search, Settings, Sparkles, Target } from "lucide-react";
import ThemeToggle from "../ui/ThemeToggle";
import LocaleToggle from "../ui/LocaleToggle";
import { useProgressStore } from "../../store/progressStore";
import { dueCards, useReviewStore } from "../../store/reviewStore";
import { usePyodideStore } from "../../store/pyodideStore";
import { useT } from "../../i18n";
import Logo from "../ui/Logo";
import XPBar from "../ui/XPBar";
import StreakFlame from "../ui/StreakFlame";

export default function TopBar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const xp = useProgressStore((s) => s.xp);
  const streak = useProgressStore((s) => s.streakDays);
  const cardStates = useReviewStore((s) => s.cards);
  const due = dueCards(cardStates).length;
  const { ready, booting, status } = usePyodideStore();
  const t = useT();

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/10 bg-ink-900/60 px-4 py-2.5 backdrop-blur-xl">
      <button
        className="btn-ghost px-2 md:hidden"
        onClick={onToggleSidebar}
        aria-label={t("nav.openMenu")}
      >
        <Menu className="h-5 w-5" />
      </button>
      <Logo />

      <button
        className="ml-4 hidden items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:border-white/20 hover:text-slate-200 lg:flex"
        onClick={() => window.dispatchEvent(new Event("pylearn:open-command"))}
        aria-label={t("nav.openSearch")}
      >
        <Search className="h-3.5 w-3.5" />
        {t("nav.search")}
        <kbd className="pill border-white/10 bg-white/5 text-[10px]">⌘K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-2 text-sm">
        <span
          className="hidden items-center gap-1.5 pill border-white/10 bg-white/5 text-slate-300 sm:inline-flex"
          title={t("py.statusTitle")}
        >
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              ready
                ? "bg-accent-lime shadow-[0_0_8px_2px_rgba(163,230,53,0.6)]"
                : booting
                  ? "animate-pulse bg-accent-cyan"
                  : "bg-slate-500"
            }`}
          />
          {ready ? t("py.ready") : booting ? status : t("py.idle")}
        </span>
        <Link
          to="/profile"
          className="flex items-center gap-2 rounded-xl px-1 transition-opacity hover:opacity-80"
          title={t("nav.profile")}
        >
          <StreakFlame days={streak} />
          <XPBar xp={xp} />
        </Link>
        <Link to="/roadmap" className="btn-ghost hidden md:inline-flex">
          <MapIcon className="h-4 w-4 text-accent-violet" />
          {t("nav.path")}
        </Link>
        <Link
          to="/review"
          className="btn-ghost hidden md:inline-flex"
          title="Flashcard review queue"
        >
          <GraduationCap className="h-4 w-4 text-accent-violet" />
          {t("nav.review")}
          {due > 0 && (
            <span className="pill border-accent-violet/40 bg-accent-violet/15 text-[10px] text-violet-200">
              {due}
            </span>
          )}
        </Link>
        <Link to="/practice" className="btn-ghost hidden md:inline-flex">
          <Target className="h-4 w-4 text-accent-lime" />
          {t("nav.practice")}
        </Link>
        <Link to="/playground" className="btn-ghost hidden sm:inline-flex">
          <Sparkles className="h-4 w-4 text-accent-cyan" />
          {t("nav.playground")}
        </Link>
        <Link to="/sql-playground" className="btn-ghost hidden lg:inline-flex">
          <Database className="h-4 w-4 text-accent-cyan" />
          {t("nav.sql")}
        </Link>
        <Link
          to="/reference"
          className="btn-ghost hidden lg:inline-flex"
          title="SQL & Python reference cheatsheet"
        >
          <BookText className="h-4 w-4 text-accent-cyan" />
          {t("nav.reference")}
        </Link>
        <LocaleToggle />
        <ThemeToggle />
        <button
          className="btn-ghost px-2"
          onClick={() => window.dispatchEvent(new Event("pylearn:open-settings"))}
          aria-label={t("nav.openSettings")}
          title={t("nav.openSettings")}
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
