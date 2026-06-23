import type { LucideIcon } from "lucide-react";
import { Award, Crown, Flame, Sparkles, Target, Trophy, Zap } from "lucide-react";
import { curriculum } from "../content/curriculum";
import { levelFromXp } from "./level";

export interface Badge {
  id: string;
  name: string;
  desc: string;
  icon: LucideIcon;
  unlocked: boolean;
}

export interface ProgressSnapshot {
  completedLessons: Record<string, true>;
  solvedChallenges: Record<string, true>;
  xp: number;
  streakDays: number;
}

export function computeBadges(p: ProgressSnapshot): Badge[] {
  const solved = Object.keys(p.solvedChallenges).length;
  const lessons = Object.keys(p.completedLessons).length;
  const level = levelFromXp(p.xp);

  const milestones: Badge[] = [
    {
      id: "first-solve",
      name: "First Blood",
      desc: "Solve your first challenge",
      icon: Trophy,
      unlocked: solved >= 1,
    },
    {
      id: "solver-10",
      name: "Problem Solver",
      desc: "Solve 10 challenges",
      icon: Target,
      unlocked: solved >= 10,
    },
    {
      id: "first-lesson",
      name: "Getting Started",
      desc: "Complete your first lesson",
      icon: Sparkles,
      unlocked: lessons >= 1,
    },
    {
      id: "streak-5",
      name: "On Fire",
      desc: "Reach a 5-day streak",
      icon: Flame,
      unlocked: p.streakDays >= 5,
    },
    {
      id: "level-5",
      name: "Rising Star",
      desc: "Reach level 5",
      icon: Zap,
      unlocked: level >= 5,
    },
  ];

  // One badge per fully-completed module.
  const moduleBadges: Badge[] = curriculum.map((m) => ({
    id: `module-${m.id}`,
    name: `${m.title} ✓`,
    desc: `Complete every lesson in ${m.title}`,
    icon: Award,
    unlocked: m.lessons.every((l) => p.completedLessons[l.id]),
  }));

  const allDone: Badge = {
    id: "completionist",
    name: "Completionist",
    desc: "Finish every lesson in Data Learning",
    icon: Crown,
    unlocked: curriculum.every((m) => m.lessons.every((l) => p.completedLessons[l.id])),
  };

  return [...milestones, ...moduleBadges, allDone];
}
