import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Award, Sparkles, Play } from "lucide-react";
import {
  getLesson,
  modulesByTrack,
  totalLessons,
  tracks,
} from "../content/curriculum";
import type { Module } from "../types/lesson";
import { useProgressStore } from "../store/progressStore";
import { levelProgress } from "../lib/level";
import { moduleGradient } from "../lib/moduleTheme";
import Reveal from "../components/ui/Reveal";
import AnimatedCounter from "../components/ui/AnimatedCounter";

function HeroCodeCard() {
  // Decorative glass "editor" that floats next to the headline.
  const lines = [
    { t: "for i in range(1, 4):", c: "text-slate-300" },
    { t: "    total += i", c: "text-slate-300", hl: true },
    { t: "    print(total)", c: "text-slate-300" },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: -2 }}
      animate={{ opacity: 1, y: 0, rotate: -2 }}
      transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
      className="glass w-full max-w-sm animate-float overflow-hidden"
    >
      <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        <span className="ml-2 font-mono text-xs text-slate-500">loops.py</span>
      </div>
      <pre className="px-4 py-3 font-mono text-[13px] leading-relaxed">
        {lines.map((l, i) => (
          <div
            key={i}
            className={`${l.c} ${l.hl ? "-mx-4 border-l-2 border-accent-violet bg-accent-violet/15 px-4" : ""}`}
          >
            {l.t}
          </div>
        ))}
        <div className="mt-2 text-accent-cyan">{"> 1"}</div>
        <div className="text-accent-cyan">{"> 3"}</div>
        <div className="text-accent-cyan">{"> 6"}</div>
      </pre>
    </motion.div>
  );
}

export default function Home() {
  const completed = useProgressStore((s) => s.completedLessons);
  const xp = useProgressStore((s) => s.xp);
  const lastModuleId = useProgressStore((s) => s.lastModuleId);
  const lastLessonId = useProgressStore((s) => s.lastLessonId);
  const doneCount = Object.keys(completed).length;
  const total = totalLessons();
  const { level } = levelProgress(xp);

  // "Continue where you left off" target, if it still exists in the curriculum.
  const cont =
    lastModuleId && lastLessonId ? getLesson(lastModuleId, lastLessonId) : undefined;

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      {/* Hero */}
      <section className="relative mb-12 grid items-center gap-8 md:grid-cols-[1.3fr_1fr]">
        {/* Soft glow behind the headline */}
        <div
          className="pointer-events-none absolute -left-10 -top-10 h-64 w-64 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.25), transparent 70%)" }}
        />
        <div className="relative">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pill mb-4 border-white/10 bg-white/5 text-slate-300"
          >
            <Sparkles className="h-3.5 w-3.5 text-accent-cyan" /> Runs 100% in your browser
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl"
          >
            Learn Data,
            <br />
            <span className="gradient-text">visually.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 max-w-xl text-lg text-slate-300"
          >
            An interactive, CodeSignal-style playground. Run real Python <i>and</i> SQL,{" "}
            <b className="text-white">watch loops and algorithms animate step by step</b>, and
            solve challenges — from basics to data wrangling, DSA, and PostgreSQL.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 flex flex-wrap items-center gap-3"
          >
            {cont ? (
              <Link
                to={`/learn/${cont.module.id}/${cont.lesson.id}`}
                className="btn-primary text-base"
              >
                Continue: {cont.lesson.title} <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link to="/learn/basics/variables-and-types" className="btn-primary text-base">
                Start learning <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            <Link
              to="/learn/basics/variables-and-types"
              className={cont ? "btn-ghost text-base" : "hidden"}
            >
              Start over
            </Link>
            <Link to="/playground" className="btn-ghost text-base">
              <Play className="h-4 w-4 text-accent-cyan" /> Playground
            </Link>
          </motion.div>

          {/* Stat chips */}
          <div className="mt-8 flex flex-wrap gap-3">
            {[
              { label: "Level", value: level },
              { label: "XP earned", value: xp },
              { label: "Lessons done", value: doneCount, of: total },
            ].map((s) => (
              <div key={s.label} className="glass px-4 py-3">
                <div className="font-display text-2xl font-bold text-white">
                  <AnimatedCounter value={s.value} />
                  {s.of !== undefined && (
                    <span className="text-base text-slate-500">/{s.of}</span>
                  )}
                </div>
                <div className="text-xs uppercase tracking-wide text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tech chips */}
          <div className="mt-6 flex flex-wrap gap-2">
            {["Data Structures", "DSA", "NumPy", "Pandas", "Matplotlib", "PostgreSQL"].map(
              (t) => (
                <span key={t} className="pill border-white/10 bg-white/5 text-slate-300">
                  {t}
                </span>
              ),
            )}
          </div>
        </div>

        <div className="flex justify-center md:justify-end">
          <HeroCodeCard />
        </div>
      </section>

      {/* Module grid, grouped into sections (Python / SQL). */}
      <h2 className="mb-1 font-display text-xl font-bold text-white">Learning path</h2>
      {tracks().map((track) => (
        <section key={track} className="mb-10">
          <h3 className="mb-3 mt-5 text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
            {track}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modulesByTrack(track).map((m, i) => (
              <ModuleCard key={m.id} m={m} i={i} completed={completed} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ModuleCard({
  m,
  i,
  completed,
}: {
  m: Module;
  i: number;
  completed: Record<string, true>;
}) {
  const done = m.lessons.filter((l) => completed[l.id]).length;
  const pct = Math.round((done / m.lessons.length) * 100);
  const allDone = done === m.lessons.length;
  return (
    <Reveal delay={i * 0.05}>
      <Link to={`/learn/${m.id}`} className="group block h-full">
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="glass relative h-full overflow-hidden p-5 transition-shadow group-hover:glow-ring"
        >
          {/* Top accent line */}
          <span
            className="absolute inset-x-0 top-0 h-1"
            style={{ background: moduleGradient(m.id) }}
          />
          <div className="flex items-center justify-between">
            <span
              className="grid h-11 w-11 place-items-center rounded-xl text-2xl"
              style={{ background: moduleGradient(m.id, 145) }}
            >
              {m.icon}
            </span>
            <div className="flex items-center gap-2">
              {allDone && (
                <span className="pill border-accent-lime/30 bg-accent-lime/10 text-accent-lime">
                  <Award className="h-3 w-3" /> Done
                </span>
              )}
              <span className="pill border-white/10 bg-white/5 text-slate-300">{m.level}</span>
            </div>
          </div>
          <h3 className="mt-3 font-display text-lg font-semibold text-white">{m.title}</h3>
          <p className="mt-1 text-sm text-slate-400">{m.blurb}</p>
          <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
            <span>
              {done}/{m.lessons.length} lessons
            </span>
            <span className="inline-flex items-center gap-1 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100">
              Open <ArrowRight className="h-3 w-3" />
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: moduleGradient(m.id) }}
            />
          </div>
        </motion.div>
      </Link>
    </Reveal>
  );
}
