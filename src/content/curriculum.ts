import type { Lesson, Module } from "../types/lesson";
import { basics } from "./modules/basics";
import { dataStructures } from "./modules/dataStructures";
import { dsa } from "./modules/dsa";
import { libraries } from "./modules/libraries";
import { numpy } from "./modules/numpy";
import { pandas } from "./modules/pandas";
import { viz } from "./modules/viz";
import { pyspark } from "./modules/pyspark";

// Master curriculum — ordered as the intended learning path. The sidebar, router,
// and progress tracking all read from here.
export const curriculum: Module[] = [
  basics,
  dataStructures,
  dsa,
  libraries,
  numpy,
  pandas,
  viz,
  pyspark,
];

export function getModule(id: string): Module | undefined {
  return curriculum.find((m) => m.id === id);
}

export function getLesson(
  moduleId: string,
  lessonId: string,
): { module: Module; lesson: Lesson; index: number } | undefined {
  const module = getModule(moduleId);
  if (!module) return undefined;
  const index = module.lessons.findIndex((l) => l.id === lessonId);
  if (index < 0) return undefined;
  return { module, lesson: module.lessons[index], index };
}

/** Flattened (module, lesson) pairs in curriculum order — used for prev/next nav. */
export function lessonSequence(): { moduleId: string; lessonId: string }[] {
  return curriculum.flatMap((m) =>
    m.lessons.map((l) => ({ moduleId: m.id, lessonId: l.id })),
  );
}

export function totalLessons(): number {
  return curriculum.reduce((n, m) => n + m.lessons.length, 0);
}
