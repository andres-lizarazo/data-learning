import type { Lesson, Module } from "../types/lesson";
import { linux } from "./modules/platform/linux";
import { gitGithub } from "./modules/platform/git";
import { basics } from "./modules/basics";
import { dataStructures } from "./modules/dataStructures";
import { pythonOop } from "./modules/pythonOop";
import { pythonEngineering } from "./modules/pythonEngineering";
import { dsa } from "./modules/dsa";
import { libraries } from "./modules/libraries";
import { numpy } from "./modules/numpy";
import { pandas } from "./modules/pandas";
import { viz } from "./modules/viz";
import { ml } from "./modules/ml";
import { pyspark } from "./modules/pyspark";
import { postgres } from "./modules/sql/postgres";
import { solid } from "./modules/design/solid";
import { designPatterns } from "./modules/design/patterns";
import { architecture } from "./modules/design/architecture";
import { dataFundamentals } from "./modules/de/fundamentals";
import { dataModeling } from "./modules/de/dataModeling";
import { warehouseLakehouse } from "./modules/de/warehouse";
import { databricks } from "./modules/de/databricks";
import { dbt } from "./modules/de/dbt";
import { orchestration } from "./modules/de/orchestration";
import { dataQuality } from "./modules/de/dataQuality";
import { streaming } from "./modules/de/streaming";
import { aws } from "./modules/cloud/aws";

// Master curriculum — ordered as the intended learning path. The sidebar, router,
// and progress tracking all read from here. Modules without a `track` default to the
// "Python" section; SQL modules carry `track: "SQL"`.
export const curriculum: Module[] = [
  linux,
  gitGithub,
  basics,
  dataStructures,
  pythonOop,
  pythonEngineering,
  dsa,
  libraries,
  numpy,
  pandas,
  viz,
  ml,
  postgres,
  solid,
  designPatterns,
  architecture,
  dataFundamentals,
  dataModeling,
  warehouseLakehouse,
  pyspark,
  databricks,
  dbt,
  orchestration,
  dataQuality,
  streaming,
  aws,
];

/** Distinct tracks in curriculum order, e.g. ["Python", "SQL"]. */
export function tracks(): import("../types/lesson").Track[] {
  const seen: import("../types/lesson").Track[] = [];
  for (const m of curriculum) {
    const t = m.track ?? "Python";
    if (!seen.includes(t)) seen.push(t);
  }
  return seen;
}

/** Modules belonging to a given track, in curriculum order. */
export function modulesByTrack(track: import("../types/lesson").Track): Module[] {
  return curriculum.filter((m) => (m.track ?? "Python") === track);
}

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
