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
  // code editor / runnable
  | "editor.run"
  | "editor.running"
  | "editor.runningTests"
  | "editor.loadingPython"
  | "editor.visualize"
  | "editor.visualizeTitle"
  | "editor.reset"
  | "editor.backToRun"
  | "editor.stepThrough"
  | "editor.stepThroughTitle"
  | "editor.engineFailedRun"
  | "editor.engineNoResponse"
  // console
  | "console.title"
  | "console.running"
  | "console.placeholder"
  // quiz
  | "quiz.correct"
  | "quiz.notQuite"
  | "quiz.tryAgain"
  // challenge
  | "challenge.submit"
  | "challenge.hint"
  | "challenge.showSolution"
  | "challenge.hideSolution"
  | "challenge.solved"
  | "challenge.testsPassed"
  | "challenge.nice"
  | "challenge.hidden"
  | "challenge.referenceSolution"
  | "challenge.errBeforeTests"
  | "challenge.engineFailed"
  | "challenge.engineNoResponse"
  // playground pages
  | "pg.pySubtitle"
  | "pg.sqlSubtitle"
  | "pg.dataset"
  | "pg.resetQuery"
  | "pg.resetDb"
  // review page
  | "rv.intro"
  | "rv.cardsInCurriculum"
  | "rv.seenBefore"
  | "rv.caughtUp"
  | "rv.caughtUpHint"
  | "rv.findLesson"
  // reference page
  | "ref.title"
  | "ref.subtitle"
  | "ref.sqlGuide"
  | "ref.pyCheatsheet"
  | "ref.onThisPage"
  // profile page
  | "pf.title"
  | "pf.toLevel"
  | "pf.statXp"
  | "pf.statStreak"
  | "pf.statLessons"
  | "pf.statChallenges"
  | "pf.moduleProgress"
  | "pf.achievements"
  | "pf.unlocked"
  | "pf.savedLessons"
  | "pf.resetAll"
  | "pf.resetConfirm"
  // practice page
  | "pr.title"
  | "pr.subA"
  | "pr.solved"
  | "pr.filterModule"
  | "pr.allModules"
  | "pr.stAll"
  | "pr.stUnsolved"
  | "pr.stSolved"
  | "pr.any"
  | "pr.easy"
  | "pr.medium"
  | "pr.hard"
  | "pr.shown"
  | "pr.noMatch"
  // roadmap page
  | "rm.intro"
  | "rm.stage"
  | "rm.youAreHere"
  | "rm.footer"
  | "rm.blurbFoundations"
  | "rm.blurbPython"
  | "rm.blurbSQL"
  | "rm.blurbDesign"
  | "rm.blurbDE"
  | "rm.blurbCloud"
  // keyboard shortcuts help
  | "sc.title"
  | "sc.close"
  | "sc.search"
  | "sc.run"
  | "sc.prevLesson"
  | "sc.nextLesson"
  | "sc.showHelp"
  | "sc.closeDialogs"
  // command palette
  | "cmd.aria"
  | "cmd.searchAria"
  | "cmd.placeholder"
  | "cmd.noMatches"
  | "cmd.module"
  | "cmd.pHome"
  | "cmd.pRoadmap"
  | "cmd.pReview"
  | "cmd.pPractice"
  | "cmd.pReference"
  | "cmd.pPlayground"
  | "cmd.pSqlPlayground"
  | "cmd.pProfile"
  // execution visualizer
  | "viz.tracing"
  | "viz.prevStep"
  | "viz.nextStep"
  | "viz.restart"
  | "viz.pause"
  | "viz.play"
  | "viz.speed"
  | "viz.scrub"
  | "viz.step"
  | "viz.line"
  | "viz.callStack"
  | "viz.main"
  | "viz.variables"
  | "viz.depth"
  | "viz.watchPlaceholder"
  | "viz.watchAria"
  | "viz.tableView"
  | "viz.objectsView"
  | "viz.pressA"
  | "viz.pressB"
  | "viz.noWatched"
  | "viz.noLocals"
  | "viz.outputSoFar"
  | "viz.nothingPrinted"
  | "viz.engineFailed"
  | "viz.engineNoResponse"
  | "viz.truncated"
  // flashcards
  | "fc.deck"
  | "fc.cards"
  | "fc.complete"
  | "fc.completeHint"
  | "fc.done"
  | "fc.showQuestion"
  | "fc.revealAnswer"
  | "fc.answer"
  | "fc.questionTap"
  | "fc.again"
  | "fc.good"
  | "fc.easy"
  | "fc.recallHint"
  // sql result grid
  | "grid.result"
  | "grid.pressRun"
  | "grid.successPrefix"
  | "grid.rowWord"
  | "grid.rowsWord"
  | "grid.affectedLabel"
  | "grid.zeroRows"
  // sql
  | "sql.loadingPostgres"
  | "sql.tryIt"
  | "sql.expectedError"
  | "sql.resetsDB"
  | "sql.checking"
  | "sql.correct"
  | "sql.queryError"
  | "sql.refSolutionFailed"
  | "sql.engineFailed"
  | "sql.engineNoResponse"
  // notes
  | "notes.title"
  | "notes.saved"
  | "notes.placeholder"
  | "notes.aria"
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
  "editor.run": "Run",
  "editor.running": "Running…",
  "editor.runningTests": "Running tests…",
  "editor.loadingPython": "Loading Python…",
  "editor.visualize": "Visualize",
  "editor.visualizeTitle":
    "Step through this code line by line with the execution visualizer",
  "editor.reset": "Reset",
  "editor.backToRun": "Back to run",
  "editor.stepThrough": "step through",
  "editor.stepThroughTitle": "Step through",
  "editor.engineFailedRun": "The Python engine failed to run this:",
  "editor.engineNoResponse": "The Python engine did not respond. Try reloading the page.",
  "console.title": "Console",
  "console.running": "running…",
  "console.placeholder": "Output appears here. Press Run ▸",
  "quiz.correct": "Correct! 🎉",
  "quiz.notQuite": "Not quite.",
  "quiz.tryAgain": "try again",
  "challenge.submit": "Submit",
  "challenge.hint": "Hint",
  "challenge.showSolution": "Show solution",
  "challenge.hideSolution": "Hide solution",
  "challenge.solved": "Solved",
  "challenge.testsPassed": "tests passed",
  "challenge.nice": "— nice! 🎉",
  "challenge.hidden": "hidden",
  "challenge.referenceSolution": "Reference solution",
  "challenge.errBeforeTests": "Your code raised an error before tests could run.",
  "challenge.engineFailed": "The Python engine failed to run your code:",
  "challenge.engineNoResponse": "The Python engine did not respond. Try reloading the page.",
  "pg.pySubtitle": "A scratchpad running real Python in your browser. Nothing is sent to a server.",
  "pg.sqlSubtitle":
    "A scratchpad running real PostgreSQL in your browser. Nothing is sent to a server.",
  "pg.dataset": "Dataset:",
  "pg.resetQuery": "Reset query",
  "pg.resetDb": "Reset database",
  "rv.intro":
    "Spaced repetition over every flashcard deck in the curriculum. Cards you rate “Good” or “Easy” come back at growing intervals; “Again” brings them right back.",
  "rv.cardsInCurriculum": "cards in the curriculum",
  "rv.seenBefore": "seen before",
  "rv.caughtUp": "Nothing due — you're caught up! 🎉",
  "rv.caughtUpHint":
    "Decks live inside concept lessons. Study one to seed the queue, or come back when scheduled cards fall due.",
  "rv.findLesson": "Find a lesson on the roadmap",
  "ref.title": "Reference",
  "ref.subtitle":
    "An always-open cheatsheet — search it fast with ⌘K, or jump around with the contents on the left.",
  "ref.sqlGuide": "PostgreSQL guide",
  "ref.pyCheatsheet": "Python cheatsheet",
  "ref.onThisPage": "On this page",
  "pf.title": "Your profile",
  "pf.toLevel": "to level",
  "pf.statXp": "XP",
  "pf.statStreak": "Day streak",
  "pf.statLessons": "Lessons",
  "pf.statChallenges": "Challenges",
  "pf.moduleProgress": "Module progress",
  "pf.achievements": "Achievements",
  "pf.unlocked": "unlocked",
  "pf.savedLessons": "Saved lessons",
  "pf.resetAll": "Reset all progress",
  "pf.resetConfirm": "Reset all progress? This cannot be undone.",
  "pr.title": "Practice",
  "pr.subA": "Every challenge in one place —",
  "pr.solved": "solved",
  "pr.filterModule": "Filter by module",
  "pr.allModules": "All modules",
  "pr.stAll": "All",
  "pr.stUnsolved": "Unsolved",
  "pr.stSolved": "Solved",
  "pr.any": "Any",
  "pr.easy": "Easy",
  "pr.medium": "Medium",
  "pr.hard": "Hard",
  "pr.shown": "shown",
  "pr.noMatch": "No challenges match these filters.",
  "rm.intro":
    "The recommended order for a Data / Analytics Engineer — top to bottom. Each stage builds on the previous one.",
  "rm.stage": "STAGE",
  "rm.youAreHere": "You are here",
  "rm.footer":
    "New stages unlock nothing — jump anywhere. The order is a recommendation, not a gate.",
  "rm.blurbFoundations":
    "The engineer's environment: Linux & the command line, plus Git & GitHub.",
  "rm.blurbPython":
    "Foundations: the language, data structures, algorithms, and the analysis stack.",
  "rm.blurbSQL": "Real PostgreSQL in your browser — from SELECT to data-engineering patterns.",
  "rm.blurbDesign": "Write code that survives: SOLID, design patterns, and architecture.",
  "rm.blurbDE": "Modeling, warehouses, Spark, Databricks, dbt, orchestration, and quality.",
  "rm.blurbCloud":
    "Ship it for real: AWS core data services — IAM, S3 lakes, compute, and the data stack.",
  "sc.title": "Keyboard shortcuts",
  "sc.close": "Close shortcuts help",
  "sc.search": "Search lessons, modules & pages",
  "sc.run": "Run / submit the focused code editor",
  "sc.prevLesson": "Previous lesson",
  "sc.nextLesson": "Next lesson",
  "sc.showHelp": "Show this help",
  "sc.closeDialogs": "Close dialogs",
  "cmd.aria": "Command palette",
  "cmd.searchAria": "Search",
  "cmd.placeholder": "Search lessons, content, pages…",
  "cmd.noMatches": "No matches",
  "cmd.module": "Module",
  "cmd.pHome": "Home",
  "cmd.pRoadmap": "Learning path — Roadmap",
  "cmd.pReview": "Review — Flashcard queue",
  "cmd.pPractice": "Practice — Challenge bank",
  "cmd.pReference": "Reference — SQL & Python cheatsheet",
  "cmd.pPlayground": "Playground",
  "cmd.pSqlPlayground": "SQL Playground",
  "cmd.pProfile": "Profile & achievements",
  "viz.tracing": "Tracing…",
  "viz.prevStep": "Previous step",
  "viz.nextStep": "Next step",
  "viz.restart": "Restart",
  "viz.pause": "Pause",
  "viz.play": "Play",
  "viz.speed": "Playback speed",
  "viz.scrub": "Scrub execution steps",
  "viz.step": "Step",
  "viz.line": "line",
  "viz.callStack": "Call stack",
  "viz.main": "main",
  "viz.variables": "Variables",
  "viz.depth": "depth",
  "viz.watchPlaceholder": "watch (e.g. i, total)",
  "viz.watchAria": "Watch variables (comma-separated)",
  "viz.tableView": "table",
  "viz.objectsView": "objects",
  "viz.pressA": "Press",
  "viz.pressB": "then step through to watch variables change.",
  "viz.noWatched": "No watched variables in scope here.",
  "viz.noLocals": "No local variables yet at this line.",
  "viz.outputSoFar": "Output so far",
  "viz.nothingPrinted": "— nothing printed yet —",
  "viz.engineFailed": "The Python engine failed:",
  "viz.engineNoResponse": "The Python engine did not respond. Try reloading the page.",
  "viz.truncated": "⚠ Execution was long — only the first steps are shown.",
  "fc.deck": "Flashcards",
  "fc.cards": "cards",
  "fc.complete": "Deck complete!",
  "fc.completeHint": "Graded cards return in the review queue when they're due.",
  "fc.done": "done",
  "fc.showQuestion": "Show question",
  "fc.revealAnswer": "Reveal answer",
  "fc.answer": "Answer",
  "fc.questionTap": "Question — tap to reveal",
  "fc.again": "Again",
  "fc.good": "Good",
  "fc.easy": "Easy",
  "fc.recallHint": "Recall the answer first, then tap the card (or press Space).",
  "grid.result": "Result",
  "grid.pressRun": "Press Run ▸ to execute the query.",
  "grid.successPrefix": "Success —",
  "grid.rowWord": "row",
  "grid.rowsWord": "rows",
  "grid.affectedLabel": "affected",
  "grid.zeroRows": "(0 rows)",
  "sql.loadingPostgres": "Loading Postgres…",
  "sql.tryIt": "Try it",
  "sql.expectedError": "expected to error",
  "sql.resetsDB": "resets DB",
  "sql.checking": "Checking…",
  "sql.correct": "Correct — nice! 🎉",
  "sql.queryError": "Your query raised an error.",
  "sql.refSolutionFailed": "Reference solution failed to run (please report).",
  "sql.engineFailed": "The SQL engine failed to run:",
  "sql.engineNoResponse": "The SQL engine did not respond. Try reloading the page.",
  "notes.title": "My notes",
  "notes.saved": "saved",
  "notes.placeholder":
    "Jot down what you want to remember from this lesson… (saved automatically)",
  "notes.aria": "Lesson notes",
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
  "editor.run": "Ejecutar",
  "editor.running": "Ejecutando…",
  "editor.runningTests": "Ejecutando tests…",
  "editor.loadingPython": "Cargando Python…",
  "editor.visualize": "Visualizar",
  "editor.visualizeTitle":
    "Recorre este código línea a línea con el visualizador de ejecución",
  "editor.reset": "Reiniciar",
  "editor.backToRun": "Volver a ejecutar",
  "editor.stepThrough": "paso a paso",
  "editor.stepThroughTitle": "Paso a paso",
  "editor.engineFailedRun": "El motor de Python no pudo ejecutar esto:",
  "editor.engineNoResponse": "El motor de Python no respondió. Intenta recargar la página.",
  "console.title": "Consola",
  "console.running": "ejecutando…",
  "console.placeholder": "La salida aparece aquí. Pulsa Ejecutar ▸",
  "quiz.correct": "¡Correcto! 🎉",
  "quiz.notQuite": "No exactamente.",
  "quiz.tryAgain": "reintentar",
  "challenge.submit": "Enviar",
  "challenge.hint": "Pista",
  "challenge.showSolution": "Ver solución",
  "challenge.hideSolution": "Ocultar solución",
  "challenge.solved": "Resuelto",
  "challenge.testsPassed": "tests pasados",
  "challenge.nice": "— ¡bien! 🎉",
  "challenge.hidden": "oculto",
  "challenge.referenceSolution": "Solución de referencia",
  "challenge.errBeforeTests": "Tu código lanzó un error antes de poder correr los tests.",
  "challenge.engineFailed": "El motor de Python no pudo ejecutar tu código:",
  "challenge.engineNoResponse": "El motor de Python no respondió. Intenta recargar la página.",
  "pg.pySubtitle": "Un borrador que corre Python de verdad en tu navegador. No se envía nada a un servidor.",
  "pg.sqlSubtitle":
    "Un borrador que corre PostgreSQL de verdad en tu navegador. No se envía nada a un servidor.",
  "pg.dataset": "Conjunto de datos:",
  "pg.resetQuery": "Reiniciar consulta",
  "pg.resetDb": "Reiniciar base de datos",
  "rv.intro":
    "Repetición espaciada sobre cada mazo de flashcards del temario. Las tarjetas que calificas “Bien” o “Fácil” vuelven a intervalos crecientes; “Otra vez” las trae de inmediato.",
  "rv.cardsInCurriculum": "tarjetas en el temario",
  "rv.seenBefore": "vistas antes",
  "rv.caughtUp": "Nada pendiente — ¡estás al día! 🎉",
  "rv.caughtUpHint":
    "Los mazos viven dentro de las lecciones de conceptos. Estudia una para alimentar la cola, o vuelve cuando venzan las tarjetas programadas.",
  "rv.findLesson": "Encuentra una lección en el roadmap",
  "ref.title": "Referencia",
  "ref.subtitle":
    "Una chuleta siempre abierta — búscala rápido con ⌘K, o navega con el índice de la izquierda.",
  "ref.sqlGuide": "Guía de PostgreSQL",
  "ref.pyCheatsheet": "Chuleta de Python",
  "ref.onThisPage": "En esta página",
  "pf.title": "Tu perfil",
  "pf.toLevel": "para el nivel",
  "pf.statXp": "XP",
  "pf.statStreak": "Racha de días",
  "pf.statLessons": "Lecciones",
  "pf.statChallenges": "Retos",
  "pf.moduleProgress": "Progreso por módulo",
  "pf.achievements": "Logros",
  "pf.unlocked": "desbloqueados",
  "pf.savedLessons": "Lecciones guardadas",
  "pf.resetAll": "Reiniciar todo el progreso",
  "pf.resetConfirm": "¿Reiniciar todo el progreso? Esto no se puede deshacer.",
  "pr.title": "Práctica",
  "pr.subA": "Todos los retos en un solo lugar —",
  "pr.solved": "resueltos",
  "pr.filterModule": "Filtrar por módulo",
  "pr.allModules": "Todos los módulos",
  "pr.stAll": "Todos",
  "pr.stUnsolved": "Sin resolver",
  "pr.stSolved": "Resueltos",
  "pr.any": "Cualquiera",
  "pr.easy": "Fácil",
  "pr.medium": "Medio",
  "pr.hard": "Difícil",
  "pr.shown": "mostrados",
  "pr.noMatch": "Ningún reto coincide con estos filtros.",
  "rm.intro":
    "El orden recomendado para un Ingeniero de Datos / Analytics — de arriba abajo. Cada etapa se apoya en la anterior.",
  "rm.stage": "ETAPA",
  "rm.youAreHere": "Estás aquí",
  "rm.footer":
    "Las etapas no bloquean nada — salta a donde quieras. El orden es una recomendación, no una barrera.",
  "rm.blurbFoundations":
    "El entorno del ingeniero: Linux y la línea de comandos, más Git y GitHub.",
  "rm.blurbPython":
    "Fundamentos: el lenguaje, estructuras de datos, algoritmos y el stack de análisis.",
  "rm.blurbSQL":
    "PostgreSQL real en tu navegador — de SELECT a patrones de ingeniería de datos.",
  "rm.blurbDesign":
    "Escribe código que sobrevive: SOLID, patrones de diseño y arquitectura.",
  "rm.blurbDE":
    "Modelado, warehouses, Spark, Databricks, dbt, orquestación y calidad.",
  "rm.blurbCloud":
    "Llévalo a producción: servicios de datos de AWS — IAM, lakes en S3, cómputo y el stack de datos.",
  "sc.title": "Atajos de teclado",
  "sc.close": "Cerrar ayuda de atajos",
  "sc.search": "Buscar lecciones, módulos y páginas",
  "sc.run": "Ejecutar / enviar el editor de código enfocado",
  "sc.prevLesson": "Lección anterior",
  "sc.nextLesson": "Lección siguiente",
  "sc.showHelp": "Mostrar esta ayuda",
  "sc.closeDialogs": "Cerrar diálogos",
  "cmd.aria": "Paleta de comandos",
  "cmd.searchAria": "Buscar",
  "cmd.placeholder": "Buscar lecciones, contenido, páginas…",
  "cmd.noMatches": "Sin resultados",
  "cmd.module": "Módulo",
  "cmd.pHome": "Inicio",
  "cmd.pRoadmap": "Ruta de aprendizaje — Roadmap",
  "cmd.pReview": "Repaso — Cola de flashcards",
  "cmd.pPractice": "Práctica — Banco de retos",
  "cmd.pReference": "Referencia — Chuleta de SQL y Python",
  "cmd.pPlayground": "Playground",
  "cmd.pSqlPlayground": "Playground de SQL",
  "cmd.pProfile": "Perfil y logros",
  "viz.tracing": "Trazando…",
  "viz.prevStep": "Paso anterior",
  "viz.nextStep": "Paso siguiente",
  "viz.restart": "Reiniciar",
  "viz.pause": "Pausar",
  "viz.play": "Reproducir",
  "viz.speed": "Velocidad de reproducción",
  "viz.scrub": "Desplazar por los pasos de ejecución",
  "viz.step": "Paso",
  "viz.line": "línea",
  "viz.callStack": "Pila de llamadas",
  "viz.main": "main",
  "viz.variables": "Variables",
  "viz.depth": "profundidad",
  "viz.watchPlaceholder": "vigilar (ej. i, total)",
  "viz.watchAria": "Vigilar variables (separadas por comas)",
  "viz.tableView": "tabla",
  "viz.objectsView": "objetos",
  "viz.pressA": "Pulsa",
  "viz.pressB": "y avanza paso a paso para ver cambiar las variables.",
  "viz.noWatched": "No hay variables vigiladas en este ámbito.",
  "viz.noLocals": "Aún no hay variables locales en esta línea.",
  "viz.outputSoFar": "Salida hasta ahora",
  "viz.nothingPrinted": "— nada impreso aún —",
  "viz.engineFailed": "El motor de Python falló:",
  "viz.engineNoResponse": "El motor de Python no respondió. Intenta recargar la página.",
  "viz.truncated": "⚠ La ejecución fue larga — solo se muestran los primeros pasos.",
  "fc.deck": "Flashcards",
  "fc.cards": "tarjetas",
  "fc.complete": "¡Mazo completado!",
  "fc.completeHint": "Las tarjetas calificadas vuelven a la cola de repaso cuando toca.",
  "fc.done": "hechas",
  "fc.showQuestion": "Mostrar pregunta",
  "fc.revealAnswer": "Revelar respuesta",
  "fc.answer": "Respuesta",
  "fc.questionTap": "Pregunta — toca para revelar",
  "fc.again": "Otra vez",
  "fc.good": "Bien",
  "fc.easy": "Fácil",
  "fc.recallHint": "Recuerda la respuesta primero, luego toca la tarjeta (o pulsa Espacio).",
  "grid.result": "Resultado",
  "grid.pressRun": "Pulsa Ejecutar ▸ para correr la consulta.",
  "grid.successPrefix": "Correcto —",
  "grid.rowWord": "fila",
  "grid.rowsWord": "filas",
  "grid.affectedLabel": "afectadas",
  "grid.zeroRows": "(0 filas)",
  "sql.loadingPostgres": "Cargando Postgres…",
  "sql.tryIt": "Pruébalo",
  "sql.expectedError": "se espera error",
  "sql.resetsDB": "reinicia la BD",
  "sql.checking": "Comprobando…",
  "sql.correct": "Correcto — ¡bien! 🎉",
  "sql.queryError": "Tu consulta lanzó un error.",
  "sql.refSolutionFailed": "La solución de referencia falló al correr (por favor repórtalo).",
  "sql.engineFailed": "El motor de SQL no pudo ejecutar:",
  "sql.engineNoResponse": "El motor de SQL no respondió. Intenta recargar la página.",
  "notes.title": "Mis notas",
  "notes.saved": "guardado",
  "notes.placeholder":
    "Anota lo que quieras recordar de esta lección… (se guarda automáticamente)",
  "notes.aria": "Notas de la lección",
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
