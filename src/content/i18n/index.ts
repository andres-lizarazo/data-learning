import type { Lesson } from "../../types/lesson";
import type { Locale } from "../../store/localeStore";
import { localizeLesson, type LessonI18n } from "./overlay";
import { basicsEs } from "./es/basics";
import { dataStructuresEs } from "./es/dataStructures";
import { pythonOopEs } from "./es/pythonOop";
import { pythonEngineeringEs } from "./es/pythonEngineering";
import { pandasEs } from "./es/pandas";
import { dsaEs } from "./es/dsa";
import { librariesEs } from "./es/libraries";
import { numpyEs } from "./es/numpy";
import { vizEs } from "./es/viz";
import { mlEs } from "./es/ml";
import { postgresEs } from "./es/postgres";
import { solidEs } from "./es/solid";
import { designPatternsEs } from "./es/patterns";
import { architectureEs } from "./es/architecture";
import { dataFundamentalsEs } from "./es/de/fundamentals";
import { dataModelingEs } from "./es/de/dataModeling";
import { warehouseLakehouseEs } from "./es/de/warehouse";
import { pysparkEs } from "./es/pyspark";
import { databricksEs } from "./es/de/databricks";
import { dbtEs } from "./es/de/dbt";
import { orchestrationEs } from "./es/de/orchestration";
import { dataQualityEs } from "./es/de/dataQuality";
import { streamingEs } from "./es/de/streaming";

// Registry of Spanish lesson overlays, keyed by lesson id. Add a module's overlay here as it
// gets translated; lessons without an entry fall back to their English content automatically.
const esOverlays: Record<string, LessonI18n> = {
  ...basicsEs,
  ...dataStructuresEs,
  ...pythonOopEs,
  ...pythonEngineeringEs,
  ...pandasEs,
  ...dsaEs,
  ...librariesEs,
  ...numpyEs,
  ...vizEs,
  ...mlEs,
  ...postgresEs,
  ...solidEs,
  ...designPatternsEs,
  ...architectureEs,
  ...dataFundamentalsEs,
  ...dataModelingEs,
  ...warehouseLakehouseEs,
  ...pysparkEs,
  ...databricksEs,
  ...dbtEs,
  ...orchestrationEs,
  ...dataQualityEs,
  ...streamingEs,
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
