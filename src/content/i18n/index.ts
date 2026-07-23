import type { Lesson } from "../../types/lesson";
import type { Locale } from "../../store/localeStore";
import { localizeLesson, type LessonI18n } from "./overlay";
import { basicsEs } from "./es/basics";
import { dataStructuresEs } from "./es/dataStructures";
import { pythonOopEs } from "./es/pythonOop";
import { pythonEngineeringEs } from "./es/pythonEngineering";

// Registry of Spanish lesson overlays, keyed by lesson id. Add a module's overlay here as it
// gets translated; lessons without an entry fall back to their English content automatically.
const esOverlays: Record<string, LessonI18n> = {
  ...basicsEs,
  ...dataStructuresEs,
  ...pythonOopEs,
  ...pythonEngineeringEs,
};

const overlays: Record<Locale, Record<string, LessonI18n>> = {
  en: {},
  es: esOverlays,
};

/** The full lesson localized to `locale` (English when there's no overlay). */
export function getLocalizedLesson(lesson: Lesson, locale: Locale): Lesson {
  return localizeLesson(lesson, overlays[locale]?.[lesson.id]);
}

/** Localized lesson title (for sidebars/nav) — falls back to the English title. */
export function localizedLessonTitle(
  lessonId: string,
  englishTitle: string,
  locale: Locale,
): string {
  return overlays[locale]?.[lessonId]?.title ?? englishTitle;
}

export type { LessonI18n } from "./overlay";
