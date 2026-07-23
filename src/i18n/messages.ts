import type { Locale } from "../store/localeStore";

// UI-chrome copy, keyed by dot-namespaced string ids. English is the source of truth and
// the fallback: any key missing from `es` renders the English text (and, failing that, the
// key itself). Keep keys stable; add new UI strings here rather than hard-coding them.

export type MessageKey =
  // top bar / nav
  | "nav.search"
  | "nav.searchPlaceholder"
  | "nav.path"
  | "nav.review"
  | "nav.practice"
  | "nav.playground"
  | "nav.sql"
  | "nav.reference"
  | "nav.home"
  | "nav.profile"
  | "nav.openMenu"
  | "nav.openSearch"
  | "nav.openSettings"
  // python interpreter status pill
  | "py.ready"
  | "py.idle"
  | "py.statusTitle"
  // theme + locale toggles
  | "theme.toLight"
  | "theme.toDark"
  | "locale.switch"
  | "locale.label"
  // settings dialog
  | "settings.title"
  | "settings.close"
  | "settings.language"
  | "settings.languageHint"
  | "settings.backupTitle"
  | "settings.backupHint"
  | "settings.export"
  | "settings.import"
  | "settings.dangerTitle"
  | "settings.dangerHint"
  | "settings.resetConfirm"
  | "settings.resetYes"
  | "settings.cancel"
  | "settings.reset"
  | "settings.exported"
  | "settings.notBackup"
  | "settings.badJson"
  | "settings.resetDone"
  // home / landing
  | "home.badge"
  | "home.title"
  | "home.titleAccent"
  | "home.intro"
  | "home.continue"
  | "home.start"
  | "home.startOver"
  | "home.statLevel"
  | "home.statXp"
  | "home.statLessons"
  | "home.learningPath"
  | "home.open"
  | "home.lessons"
  // lesson page
  | "lesson.notFound"
  | "lesson.save"
  | "lesson.saved"
  | "lesson.bookmarkAdd"
  | "lesson.bookmarkRemove"
  | "lesson.completed"
  | "lesson.markComplete"
  | "lesson.previous"
  | "lesson.next"
  // onboarding
  | "onb.welcome"
  | "onb.intro"
  | "onb.close"
  | "onb.start"
  | "onb.tip1.title"
  | "onb.tip1.body"
  | "onb.tip2.title"
  | "onb.tip2.body"
  | "onb.tip3.title"
  | "onb.tip3.body"
  | "onb.tip4.title"
  | "onb.tip4.body"
  | "onb.tip5.title"
  | "onb.tip5.body"
  // generic
  | "common.done";

type Dict = Record<MessageKey, string>;

const en: Dict = {
  "nav.search": "Search…",
  "nav.searchPlaceholder": "Search…",
  "nav.path": "Path",
  "nav.review": "Review",
  "nav.practice": "Practice",
  "nav.playground": "Playground",
  "nav.sql": "SQL",
  "nav.reference": "Reference",
  "nav.home": "Home",
  "nav.profile": "View your profile & achievements",
  "nav.openMenu": "Toggle menu",
  "nav.openSearch": "Open search",
  "nav.openSettings": "Settings — backup, restore, reset",
  "py.ready": "Python ready",
  "py.idle": "Python idle",
  "py.statusTitle": "Python interpreter status",
  "theme.toLight": "Switch to light theme",
  "theme.toDark": "Switch to dark theme",
  "locale.switch": "Cambiar a español",
  "locale.label": "Language",
  "settings.title": "Settings",
  "settings.close": "Close settings",
  "settings.language": "Language",
  "settings.languageHint": "Interface language. Lesson content is currently English-only.",
  "settings.backupTitle": "Backup & restore",
  "settings.backupHint":
    "Everything lives in this browser. Export a backup to move your XP, progress, notes, and code drafts to another device.",
  "settings.export": "Export backup",
  "settings.import": "Import backup",
  "settings.dangerTitle": "Danger zone",
  "settings.dangerHint": "Wipe all progress, XP, notes, and drafts on this device.",
  "settings.resetConfirm": "Are you sure? This can't be undone.",
  "settings.resetYes": "Yes, reset everything",
  "settings.cancel": "Cancel",
  "settings.reset": "Reset all progress",
  "settings.exported": "Backup downloaded.",
  "settings.notBackup": "That file doesn't look like a PyLearn backup.",
  "settings.badJson": "Could not read that file — is it valid JSON?",
  "settings.resetDone": "Progress and drafts reset.",
  "home.badge": "Runs 100% in your browser",
  "home.title": "Learn Data,",
  "home.titleAccent": "visually.",
  "home.intro":
    "An interactive, CodeSignal-style playground. Run real Python and SQL, watch loops and algorithms animate step by step, and solve challenges — from basics to data wrangling, DSA, and PostgreSQL.",
  "home.continue": "Continue",
  "home.start": "Start learning",
  "home.startOver": "Start over",
  "home.statLevel": "Level",
  "home.statXp": "XP earned",
  "home.statLessons": "Lessons done",
  "home.learningPath": "Learning path",
  "home.open": "Open",
  "home.lessons": "lessons",
  "lesson.notFound": "Lesson not found.",
  "lesson.save": "Save",
  "lesson.saved": "Saved",
  "lesson.bookmarkAdd": "Bookmark this lesson",
  "lesson.bookmarkRemove": "Remove bookmark",
  "lesson.completed": "Completed",
  "lesson.markComplete": "Mark lesson complete (+20 XP)",
  "lesson.previous": "Previous",
  "lesson.next": "Next",
  "onb.welcome": "Welcome to",
  "onb.intro": "An interactive way to learn Python & SQL. A few things worth knowing:",
  "onb.close": "Close",
  "onb.start": "Start learning",
  "onb.tip1.title": "Everything runs in your browser",
  "onb.tip1.body":
    "Real Python and real PostgreSQL execute locally — no account, no server. Your code and progress stay on this device.",
  "onb.tip2.title": "Watch your code run",
  "onb.tip2.body":
    "On many Python snippets, hit Visualize to step through execution line by line and see variables change.",
  "onb.tip3.title": "Jump anywhere with ⌘K",
  "onb.tip3.body":
    "Press ⌘K (Ctrl+K) to search every lesson — by title or by content — and jump straight to it.",
  "onb.tip4.title": "Navigate fast",
  "onb.tip4.body":
    "Use [ and ] to move to the previous / next lesson, and press ? anytime to see all shortcuts.",
  "onb.tip5.title": "Remember what you learn",
  "onb.tip5.body":
    "Flashcards feed a spaced-repetition Review queue, so key facts resurface right before you'd forget them.",
  "common.done": "Done",
};

const es: Partial<Dict> = {
  "nav.search": "Buscar…",
  "nav.searchPlaceholder": "Buscar…",
  "nav.path": "Ruta",
  "nav.review": "Repaso",
  "nav.practice": "Práctica",
  "nav.playground": "Playground",
  "nav.sql": "SQL",
  "nav.reference": "Referencia",
  "nav.home": "Inicio",
  "nav.profile": "Ver tu perfil y logros",
  "nav.openMenu": "Alternar menú",
  "nav.openSearch": "Abrir búsqueda",
  "nav.openSettings": "Ajustes — copia, restaurar, reiniciar",
  "py.ready": "Python listo",
  "py.idle": "Python inactivo",
  "py.statusTitle": "Estado del intérprete de Python",
  "theme.toLight": "Cambiar a tema claro",
  "theme.toDark": "Cambiar a tema oscuro",
  "locale.switch": "Switch to English",
  "locale.label": "Idioma",
  "settings.title": "Ajustes",
  "settings.close": "Cerrar ajustes",
  "settings.language": "Idioma",
  "settings.languageHint":
    "Idioma de la interfaz. El contenido de las lecciones está por ahora solo en inglés.",
  "settings.backupTitle": "Copia y restauración",
  "settings.backupHint":
    "Todo vive en este navegador. Exporta una copia para llevar tu XP, progreso, notas y borradores de código a otro dispositivo.",
  "settings.export": "Exportar copia",
  "settings.import": "Importar copia",
  "settings.dangerTitle": "Zona de peligro",
  "settings.dangerHint": "Borra todo el progreso, XP, notas y borradores de este dispositivo.",
  "settings.resetConfirm": "¿Seguro? Esto no se puede deshacer.",
  "settings.resetYes": "Sí, reiniciar todo",
  "settings.cancel": "Cancelar",
  "settings.reset": "Reiniciar todo el progreso",
  "settings.exported": "Copia descargada.",
  "settings.notBackup": "Ese archivo no parece una copia de PyLearn.",
  "settings.badJson": "No se pudo leer el archivo — ¿es un JSON válido?",
  "settings.resetDone": "Progreso y borradores reiniciados.",
  "home.badge": "Corre 100% en tu navegador",
  "home.title": "Aprende Datos,",
  "home.titleAccent": "visualmente.",
  "home.intro":
    "Un playground interactivo estilo CodeSignal. Ejecuta Python y SQL de verdad, mira cómo se animan bucles y algoritmos paso a paso, y resuelve retos — desde lo básico hasta manejo de datos, DSA y PostgreSQL.",
  "home.continue": "Continuar",
  "home.start": "Empezar a aprender",
  "home.startOver": "Empezar de nuevo",
  "home.statLevel": "Nivel",
  "home.statXp": "XP ganado",
  "home.statLessons": "Lecciones hechas",
  "home.learningPath": "Ruta de aprendizaje",
  "home.open": "Abrir",
  "home.lessons": "lecciones",
  "lesson.notFound": "Lección no encontrada.",
  "lesson.save": "Guardar",
  "lesson.saved": "Guardada",
  "lesson.bookmarkAdd": "Guardar esta lección",
  "lesson.bookmarkRemove": "Quitar de guardadas",
  "lesson.completed": "Completada",
  "lesson.markComplete": "Marcar lección como completada (+20 XP)",
  "lesson.previous": "Anterior",
  "lesson.next": "Siguiente",
  "onb.welcome": "Bienvenido a",
  "onb.intro": "Una forma interactiva de aprender Python y SQL. Algunas cosas que conviene saber:",
  "onb.close": "Cerrar",
  "onb.start": "Empezar a aprender",
  "onb.tip1.title": "Todo corre en tu navegador",
  "onb.tip1.body":
    "Python y PostgreSQL de verdad se ejecutan localmente — sin cuenta ni servidor. Tu código y progreso viven en este dispositivo.",
  "onb.tip2.title": "Mira correr tu código",
  "onb.tip2.body":
    "En muchos snippets de Python, pulsa Visualizar para recorrer la ejecución línea a línea y ver cómo cambian las variables.",
  "onb.tip3.title": "Salta a donde sea con ⌘K",
  "onb.tip3.body":
    "Pulsa ⌘K (Ctrl+K) para buscar en todas las lecciones — por título o contenido — y saltar directo.",
  "onb.tip4.title": "Navega rápido",
  "onb.tip4.body":
    "Usa [ y ] para ir a la lección anterior / siguiente, y pulsa ? en cualquier momento para ver todos los atajos.",
  "onb.tip5.title": "Recuerda lo que aprendes",
  "onb.tip5.body":
    "Las flashcards alimentan una cola de Repaso con repetición espaciada, para que los datos clave reaparezcan justo antes de que los olvidarías.",
  "common.done": "Hecho",
};

export const messages: Record<Locale, Partial<Dict>> = { en, es };

/** Look up a UI string, falling back to English, then to the key itself. */
export function translate(key: MessageKey, locale: Locale): string {
  return messages[locale]?.[key] ?? en[key] ?? key;
}
