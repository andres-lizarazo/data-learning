import type { LessonI18n } from "../../overlay";

// Spanish overlay for the "Git & GitHub" module (Foundations & Tooling track).
// Index-matched; text-only. All executable code/tests/solutions come from the English source.
export const gitGithubEs: Record<string, LessonI18n> = {
  "git-mental-model": {
    title: "El Modelo Mental de Git",
    summary: "Snapshots (no diffs), las tres áreas, y el DAG de commits.",
    blocks: [
      {
        markdown: `# Git guarda snapshots, no cambios

La única idea que hace que Git encaje: un **commit es un snapshot de todo tu proyecto** en un
momento del tiempo, más un puntero a su(s) commit(s) padre. Git *no* guarda una lista de ediciones
— guarda árboles completos y es astuto para no duplicar archivos sin cambios. "El diff" que ves se
*calcula* entre dos snapshots, no es lo que se almacena.

Cada commit tiene:

- un **SHA** — un id de 40 caracteres hexadecimales (un hash de su contenido); \`a1b2c3d…\`. Cambia
  cualquier cosa y obtienes un commit distinto.
- uno o más punteros al **padre** (cero para el primer commit, dos para un merge).
- autor, timestamp y mensaje.

Sigue los padres hacia atrás y tienes toda tu **historia** — un **DAG** (grafo acíclico dirigido)
de commits.

# Las tres áreas (dónde viven tus cambios)

\`\`\`
 directorio de trabajo  →   staging area (index)   →   repositorio (.git)
   (tus ediciones)            (git add)                  (git commit)
\`\`\`

- **Directorio de trabajo** — los archivos reales que editas.
- **Staging area / index** — el conjunto de cambios que marcaste para ir en el *próximo* commit
  (\`git add\`). Este es el superpoder de Git: compones un commit deliberadamente en vez de volcarlo
  todo.
- **Repositorio** — la historia commiteada en la carpeta oculta \`.git\`.

\`\`\`bash
# edita archivos...         (cambios en el directorio de trabajo)
git add analysis.py        # stagea ese archivo (trabajo → staging)
git commit -m "Add ..."    # toma snapshot de lo staged (staging → repo)
\`\`\`

Una **rama (branch)** es solo un puntero ligero y movible a un commit. \`HEAD\` es un puntero a
"dónde estás" (normalmente a una rama). Commitear mueve el puntero de la rama actual hacia adelante
al nuevo snapshot. Casi todo lo demás en Git es mover estos punteros — por eso construir el grafo tú
mismo, abajo, hace que los comandos sean obvios.`,
      },
      {
        title: "Construye un DAG de commits y recorre su historia",
      },
      {
        question: "¿Qué es una rama de Git, mecánicamente?",
        options: [
          "Un puntero ligero y movible a un único commit — crear una es O(1) (solo escribe un id de 40 caracteres en un archivo), por lo que ramificar en Git es barato",
          "Una copia completa de todos los archivos del proyecto en una carpeta aparte",
          "Un diff de los cambios desde que te ramificaste",
          "Un snapshot del repositorio en un punto del tiempo",
        ],
        explanation:
          "Una rama son 41 bytes: un nombre → un SHA de commit. Commitear avanza el puntero; los commits mismos forman el DAG. Por esto ramificar en Git es instantáneo y fomenta muchas ramas de vida corta — a diferencia de VCS antiguos que copiaban archivos.",
      },
      {
        question: "Editaste tres archivos pero solo corriste `git add report.py`, luego `git commit`. ¿Qué termina en el commit?",
        options: [
          "Solo los cambios de report.py — el commit captura lo que está STAGED, así que las ediciones de los otros dos archivos quedan sin commitear en el directorio de trabajo",
          "Los tres archivos, porque commit siempre incluye cada cambio",
          "Nada, porque debes agregar cada archivo para que commit funcione",
          "Un subconjunto aleatorio elegido por Git",
        ],
        explanation:
          "El staging area es todo el punto: `git commit` toma snapshot exactamente de lo que hiciste `git add`, dejándote elaborar commits enfocados. Los otros dos archivos quedan modificados-pero-sin-stage (visibles en `git status`) para un commit posterior.",
      },
      {
        title: "Modelo mental de Git",
        cards: [
          { front: "Commit", back: "Un snapshot de todo el proyecto + puntero(s) al padre + autor/mensaje, identificado por un hash de contenido (SHA). Git guarda snapshots, no diffs." },
          { front: "El DAG de commits", back: "Los commits enlazados por punteros al padre forman un grafo acíclico dirigido. Seguir los padres hacia atrás es tu historia." },
          { front: "Directorio de trabajo / staging / repo", back: "Archivos que editas → cambios marcados para el próximo commit (git add) → historia commiteada en .git (git commit)." },
          { front: "Staging area (index)", back: "El conjunto de cambios que irán en el próximo commit. Te deja componer commits enfocados en vez de volcar cada edición." },
          { front: "Rama (branch)", back: "Un puntero movible a un commit (solo un nombre → SHA). Crear/cambiar es O(1), así que ramificar barato es idiomático." },
          { front: "HEAD", back: "Un puntero a 'dónde estás' — normalmente a la rama actual. Commitear mueve la rama (y por tanto HEAD) hacia adelante al nuevo snapshot." },
          { front: "SHA", back: "El hash de contenido de 40 caracteres hex de un commit. Cualquier cambio al contenido o a la historia produce un SHA distinto — así garantiza Git la integridad." },
        ],
      },
    ],
  },

  "git-core-workflow": {
    title: "El Flujo de Trabajo Central",
    summary: "init, status, add, commit, diff, log — el ciclo diario.",
    blocks: [
      {
        markdown: `# El ciclo de cada día

El noventa por ciento del uso de Git es un ciclo ajustado:

\`\`\`bash
git init                     # inicia un repo (crea .git/) — una vez por proyecto
git clone <url>              # ...o copia un repo existente de GitHub

git status                   # qué cambió / staged / sin trackear — córrelo A MENUDO
git diff                     # cambios sin stage (trabajo vs staging)
git diff --staged            # cambios staged (lo que contendrá el próximo commit)

git add analysis.py          # stagea un archivo
git add .                    # stagea todo bajo el directorio actual (¡cuidado!)
git restore --staged file    # QUITA del stage (conserva la edición, la saca del próximo commit)

git commit -m "Message"      # snapshot de los cambios staged
git commit -am "Message"     # agrega archivos trackeados + commitea en un paso

git log --oneline --graph    # historia compacta y visual
git show <sha>               # el mensaje de un commit + su diff
\`\`\`

\`git status\` es tu brújula — córrelo constantemente. Te dice qué archivos están **sin trackear**
(Git nunca los ha visto), **modificados** (trackeados, cambiados, sin stage), o **staged** (listos
para commitear).

# Mensajes de commit que no hacen perder el tiempo a nadie

Los commits son documentación que tu yo futuro y tus compañeros leen durante incidentes y reviews.
La convención ampliamente usada:

- Una línea de asunto corta e **imperativa** (~50 chars): "Add null check to order loader" — léela
  como "*este commit va a* Add…", no "Added…" ni "Adding…".
- Una línea en blanco, luego un cuerpo que explica el **porqué** (no el qué — el diff muestra el
  qué): el bug, el trade-off, el ticket.
- Un cambio lógico por commit. "Fix loader + refactor utils + bump deps" son tres commits, para que
  cada uno se pueda revisar y revertir de forma independiente.

Una buena historia es un log consultable de *por qué el código es como es* — invaluable cuando un
pipeline de datos se rompe a las 2 a.m. y haces \`git log\` del archivo que cambió.`,
      },
      {
        question: "¿Cuál es la diferencia entre `git diff` y `git diff --staged`?",
        options: [
          "`git diff` muestra los cambios sin stage (directorio de trabajo vs staging); `git diff --staged` muestra lo que has staged (staging vs último commit) — es decir, exactamente lo que incluirá el próximo commit",
          "Son alias idénticos",
          "`git diff` muestra toda la historia; `--staged` muestra solo un commit",
          "`--staged` muestra los cambios en el servidor remoto",
        ],
        explanation:
          "Hay dos 'brechas': trabajo↔staging (`git diff`) y staging↔HEAD (`git diff --staged`). Revisar `--staged` justo antes de commitear es el hábito que te evita commitear por accidente un print de debug o medio cambio.",
      },
      {
        question: "¿Cuál es la línea de asunto de commit mejor formada según la convención?",
        options: [
          "\"Fix null customer_id crash in order loader\" — corta, imperativa, un cambio enfocado",
          "\"fixed some stuff and also refactored the utils and updated a dependency\"",
          "\"changes\"",
          "\"WORKING NOW!!! finally\"",
        ],
        explanation:
          "Modo imperativo, ~50 chars, un cambio lógico, y nombra el arreglo real. Se lee bien en `git log --oneline`, es fácil de revertir aislado, y le dice al revisor qué esperar. Las demás agrupan cambios no relacionados o no dicen nada.",
      },
    ],
  },

  "git-branching-merging": {
    title: "Ramas y Merges",
    summary: "Ramas como punteros, fast-forward vs merge de 3 vías, conflictos.",
    blocks: [
      {
        markdown: `# Ramifica para trabajar aislado

Nunca construyes una feature en \`main\`. Ramificas, para que tu trabajo a medias no pueda romper a
nadie y \`main\` siga siendo desplegable:

\`\`\`bash
git switch -c feature/dedupe    # crea + cambia a una rama nueva (git checkout -b)
# ...commitea algo de trabajo en la rama...
git switch main                 # vuelve a main
git merge feature/dedupe        # trae los commits de la feature a main
git branch -d feature/dedupe    # borra la rama ya mergeada
\`\`\`

Una rama es solo un puntero, así que todo esto es barata contabilidad de punteros.

# Dos formas en que un merge se resuelve

**Fast-forward** — si \`main\` no se ha movido desde que ramificaste, Git puede simplemente deslizar
el puntero de \`main\` hacia adelante hasta el tip de tu rama. Sin commit nuevo; historia lineal.

\`\`\`
antes:   main → c2        feature → c4   (c2 ← c3 ← c4)
ff:      main → c4        (solo movió el puntero)
\`\`\`

**Merge de tres vías** — si \`main\` *también* recibió commits nuevos, las historias divergieron. Git
encuentra la **base de merge** (el último ancestro común), combina ambos lados, y registra un
**commit de merge** con **dos padres**:

\`\`\`
        c2 ← c3 ← c4        (feature)
       /
c1 ← c2 ← c5 ← c6           (main)
              ↘
               c7  ← commit de merge (padres: c6 y c4)
\`\`\`

# Conflictos

Si ambos lados cambiaron **las mismas líneas**, Git no puede adivinar y marca un **conflicto**:

\`\`\`
<<<<<<< HEAD
tax_rate = 0.07          # versión de main
=======
tax_rate = 0.08          # versión de feature
>>>>>>> feature/dedupe
\`\`\`

Editas el archivo al resultado correcto, quitas los marcadores, le haces \`git add\`, y \`git commit\`
para completar el merge. Los conflictos son normales en un repo activo — significan que dos personas
tocaron el mismo lugar, y Git (correctamente) se niega a elegir uno en silencio. Merges pequeños y
frecuentes los mantienen pequeños.`,
      },
      {
        title: "Encuentra la base de merge de dos ramas en el DAG",
      },
      {
        question: "¿Cuándo puede Git hacer un merge fast-forward en vez de crear un commit de merge?",
        options: [
          "Cuando la rama destino no ha divergido — su tip es un ancestro de la rama que se mergea, así que Git solo desliza el puntero hacia adelante sin commit nuevo",
          "Solo cuando hay cero conflictos entre las ramas",
          "Siempre que pases el flag --no-ff",
          "Solo para ramas con menos de 10 commits",
        ],
        explanation:
          "El fast-forward es posible exactamente cuando la base es igual al tip del destino (el destino no se movió). Si ambos lados avanzaron, las historias divergieron y Git debe registrar un commit de merge de dos padres para unirlas.",
      },
      {
        question: "Git reporta un conflicto de merge en `config.py`. ¿Qué lo causó en realidad?",
        options: [
          "Ambas ramas cambiaron la misma región de ese archivo, así que Git no puede combinarlas automáticamente y te pide elegir/mezclar el resultado, luego `git add` + commit",
          "El archivo se borró en el remoto",
          "Tienes cambios sin commitear en otro lugar",
          "Git se quedó sin memoria haciendo el merge",
        ],
        explanation:
          "Los conflictos ocurren solo donde los dos lados editaron líneas que se solapan. Git marca la región con <<<<<<< ======= >>>>>>>; tú la resuelves al valor deseado, quitas los marcadores, stageas y commiteas. Los cambios que no se solapan se mergean automáticamente.",
      },
    ],
  },

  "git-rebase-vs-merge": {
    title: "Rebase vs Merge",
    summary: "Reproducir commits, una historia lineal, y la regla de oro.",
    blocks: [
      {
        markdown: `# Dos formas de integrar trabajo

Ambas ponen tu rama al día con \`main\`; difieren en la *forma* de la historia que dejan detrás.

**Merge** une las dos historias con un commit de merge. La historia es veraz (muestra que la rama
existió de verdad) pero puede enredarse con muchas burbujas de merge.

\`\`\`
c1 ← c2 ← c5 ← c6 ───── M   (commit de merge; c3,c4 de feature cuelgan de c2)
       \\                /
        c3 ← c4 ────────
\`\`\`

**Rebase** *reproduce* los commits de tu rama encima del \`main\` más reciente, como si hubieras
empezado desde ahí. La historia se vuelve **lineal** — sin burbuja de merge:

\`\`\`bash
git switch feature
git rebase main            # mueve c3,c4 para que se asienten encima del c6 de main
\`\`\`

\`\`\`
c1 ← c2 ← c5 ← c6 ← c3' ← c4'   (c3',c4' son commits NUEVOS: mismos cambios, SHAs nuevos)
\`\`\`

Nota que c3' y c4' son **commits nuevos con SHAs nuevos** — rebasear *reescribe la historia*.

# La regla de oro del rebase

> **Nunca rebasees commits que otros ya han jalado (pulled).** (No rebasees ramas compartidas/
> públicas.)

Como el rebase crea SHAs nuevos, si un compañero ya basó trabajo en los commits viejos, ahora tienes
dos versiones divergentes de "la misma" historia, y su próximo \`git pull\` se convierte en un lío.
Rebasea libremente en tu **propia rama local, sin pushear** para ordenarla antes de abrir un PR; usa
merge para integrar ramas **compartidas**.

Un flujo ordenado común: \`git pull --rebase\` para reproducir tus commits locales encima del remoto
más reciente en vez de crear un commit de merge por cada sincronización. Muchos equipos de datos se
estandarizan en "rebasea tu rama de feature, mergea a main" para mantener la historia de \`main\`
legible.`,
      },
      {
        question: "¿Por qué rebasear una rama que otros ya han jalado causa problemas?",
        options: [
          "El rebase reescribe los commits en SHAs nuevos, así que la historia compartida ahora existe en dos formas divergentes — las ramas de los compañeros apuntan a los commits viejos y su próximo pull entra en conflicto/duplica",
          "El rebase borra permanentemente la rama remota",
          "El rebase solo puede correr una vez por repositorio",
          "El rebase siempre causa conflictos irresolubles",
        ],
        explanation:
          "La regla de oro se sigue directamente de 'el rebase crea SHAs nuevos': reescribir historia pública desincroniza a todos los que construyeron sobre los SHAs viejos. Reserva el rebase para tu propio trabajo sin pushear; integra ramas compartidas con merge.",
      },
      {
        question: "¿Cuál es la diferencia práctica en la historia RESULTANTE entre merge y rebase?",
        options: [
          "Merge preserva la forma real de la rama y añade un commit de merge; rebase reproduce tus commits sobre el destino para una historia lineal pero los reescribe en SHAs nuevos",
          "Merge es más rápido; rebase es más lento pero por lo demás idéntico",
          "Rebase conserva un commit de merge; merge hace la historia lineal",
          "No hay diferencia en la historia resultante",
        ],
        explanation:
          "Merge = historia precisa pero con burbujas, SHAs originales preservados. Rebase = historia lineal limpia, SHAs nuevos (reescritos). Elige merge para integración compartida y veracidad, rebase para una rama local ordenada antes del review.",
      },
      {
        title: "Rebase vs merge",
        cards: [
          { front: "Merge", back: "Une dos historias con un commit de merge de dos padres. Forma de rama veraz, SHAs originales preservados, pero la historia puede quedar con burbujas." },
          { front: "Rebase", back: "Reproduce los commits de tu rama encima del destino como commits nuevos (SHAs nuevos). Produce una historia limpia y lineal — pero reescribe la historia." },
          { front: "Regla de oro del rebase", back: "Nunca rebasees commits que otros ya han jalado (ramas compartidas/públicas). Reescribir SHAs públicos desincroniza a todos los que construyeron sobre ellos." },
          { front: "git pull --rebase", back: "Sincroniza reproduciendo tus commits locales encima del remoto más reciente en vez de añadir un commit de merge por cada pull — mantiene la historia lineal." },
          { front: "Por qué SHAs nuevos al rebasear", back: "El SHA de un commit hashea su padre + contenido; cambiar el padre (reproducir sobre una base nueva) produce necesariamente un SHA distinto." },
          { front: "Convención de equipo", back: "Patrón común: rebasea tu rama de feature para ordenarla, luego mergea a main. Limpieza local con rebase, integración compartida con merge." },
        ],
      },
    ],
  },

  "git-remotes-github": {
    title: "Remotos, GitHub y Pull Requests",
    summary: "clone/fetch/pull/push, origin, y el flujo de review con PRs.",
    blocks: [
      {
        markdown: `# Remotos: Git sobre la red

Git es **distribuido** — cada clon es un repositorio completo con la historia entera. Un **remoto**
es una referencia con nombre a otra copia (normalmente en GitHub). El remoto por defecto es
\`origin\`.

\`\`\`bash
git clone <url>            # copia un repo remoto localmente (configura 'origin')
git remote -v              # lista los remotos y sus URLs
git fetch                  # descarga commits nuevos de origin (aún no mergea)
git pull                   # fetch + merge (o --rebase) en tu rama
git push                   # sube tus commits a origin
git push -u origin feat/x  # primer push de una rama nueva (fija el tracking upstream)
\`\`\`

- **fetch** es solo lectura: actualiza tu conocimiento del remoto (\`origin/main\`) sin tocar tus
  archivos de trabajo — seguro de correr en cualquier momento.
- **pull** = fetch **+** integrar en tu rama actual.
- **push** sube tus commits locales; se rechaza si el remoto avanzó (haz fetch/pull primero,
  resuelve, luego push — Git no te dejará pisar el trabajo de otros).

# GitHub y el flujo de Pull Request

GitHub hospeda el remoto y añade colaboración encima. El ciclo de equipo estándar — el flujo de
**rama de feature / PR**:

1. \`git switch -c feature/x\` — ramifica desde \`main\`.
2. Commitea tu trabajo; \`git push -u origin feature/x\`.
3. Abre un **Pull Request** (PR): "por favor mergea feature/x a main."
4. **Code review** — los compañeros comentan; CI corre automáticamente (tests, linters, builds de
   dbt) y reporta pasa/falla en el PR.
5. Atiende el feedback con más commits (el PR se actualiza solo al pushear).
6. **Mergea** el PR (commit de merge / squash / rebase), luego borra la rama.

El PR es donde viven las puertas de calidad: nada llega a \`main\` sin review + CI en verde. Para los
equipos de datos esto es enorme — un PR es donde un revisor detecta "este modelo dbt cambia la
definición de una métrica" o "esta migración elimina una columna" **antes** de que golpee los datos
de producción. (Este mismo proyecto es un submódulo con su propio remoto — commitea dentro del
submódulo, luego actualiza el puntero en el repo padre.)`,
      },
      {
        question: "¿Cuál es la diferencia entre `git fetch` y `git pull`?",
        options: [
          "`fetch` solo descarga commits remotos y actualiza las refs origin/* (tus archivos no se tocan); `pull` hace un fetch Y mergea/rebasea esos commits en tu rama actual",
          "Son idénticos",
          "`fetch` sube tus commits; `pull` descarga",
          "`pull` es de solo lectura; `fetch` modifica tu directorio de trabajo",
        ],
        explanation:
          "fetch es el 'muéstrame qué hay nuevo upstream' seguro y de solo lectura; pull es fetch + integrar, que puede crear commits de merge o conflictos. Mucha gente hace `git fetch` primero para inspeccionar, luego decide cómo integrar.",
      },
      {
        question: "Tu `git push` es rechazado con 'updates were rejected because the remote contains work that you do not have locally.' ¿Qué pasó y cuál es el arreglo?",
        options: [
          "Un compañero pusheó commits después de tu última sincronización, así que la rama remota avanzó — haz pull (fetch + merge/rebase) para integrar su trabajo, resuelve conflictos, luego push",
          "Tu clave SSH expiró; regenérala",
          "La rama está protegida y nunca se le puede hacer push",
          "Usa `git push --force` — siempre es el arreglo correcto",
        ],
        explanation:
          "Git se niega a sobrescribir commits que no has visto. Integra primero (`git pull` / `pull --rebase`), luego push. `--force` descartaría sus commits — resérvalo para tus propias ramas no compartidas, nunca las compartidas.",
      },
      {
        title: "Remotos y GitHub",
        cards: [
          { front: "Remoto / origin", back: "Una referencia con nombre a otra copia del repo (normalmente en GitHub). 'origin' es el nombre por defecto del que clonaste." },
          { front: "VCS distribuido", back: "Cada clon es un repo completo con la historia entera — puedes commitear, ramificar y ver la historia totalmente offline." },
          { front: "git fetch", back: "Descarga commits nuevos y actualiza las refs origin/* SIN cambiar tus archivos. Seguro de correr en cualquier momento para ver qué hay nuevo upstream." },
          { front: "git pull", back: "fetch + integrar (merge o --rebase) en tu rama actual. Puede producir commits de merge o conflictos." },
          { front: "git push (rechazado)", back: "Rechazado cuando el remoto avanzó respecto a ti. Haz pull/rebase para integrar, luego push. Nunca hagas force-push a una rama compartida." },
          { front: "Pull Request (PR)", back: "Una solicitud de GitHub para mergear una rama en otra. Donde el code review + los checks de CI custodian la calidad antes de que algo llegue a main." },
          { front: "Flujo de rama de feature", back: "Ramifica de main → commit → push → abre PR → review + CI en verde → mergea → borra la rama. El ciclo de equipo por defecto." },
        ],
      },
    ],
  },

  "git-undoing": {
    title: "Deshacer Cosas de Forma Segura",
    summary: "restore, reset, revert, reflog, stash — y recuperar commits 'perdidos'.",
    blocks: [
      {
        markdown: `# El kit del 'oh no'

Distintos deshaceres para distintas situaciones — la pregunta clave es *qué se ha compartido*.

\`\`\`bash
# Descarta ediciones sin stage de un archivo (vuelve al último commit):
git restore analysis.py

# Quita un archivo del stage pero conserva la edición:
git restore --staged analysis.py

# Guarda temporalmente el WIP para cambiar de tarea, luego recupéralo:
git stash                 # guarda y limpia el directorio de trabajo
git stash pop             # reaplica y descarta el stash
\`\`\`

# reset: mueve el puntero de la rama (reescribe historia local)

\`git reset <commit>\` mueve el puntero de tu rama actual a \`<commit>\`. Tres modos difieren en lo
que le hacen a tus archivos:

| Modo | Puntero de rama | Staging | Directorio de trabajo |
|---|---|---|---|
| \`--soft\` | se mueve | conservado (staged) | conservado |
| \`--mixed\` (por defecto) | se mueve | reseteado | conservado |
| \`--hard\` | se mueve | reseteado | **reseteado (¡ediciones perdidas!)** |

\`git reset --soft HEAD~1\` "descommitea" el último commit pero conserva sus cambios staged (genial
para rehacer un commit). \`--hard\` tira el trabajo — poderoso y peligroso.

# revert: deshacer de forma segura sobre historia COMPARTIDA

\`\`\`bash
git revert <sha>          # crea un commit NUEVO que deshace <sha>
\`\`\`

\`revert\` no reescribe la historia — añade un commit que invierte uno anterior. **Este es el deshacer
seguro para cualquier cosa ya pusheada/compartida**, porque no cambia los SHAs existentes (sin
violación de la regla de oro).

> **reset vs revert:** \`reset\` mueve el puntero y reescribe historia — úsalo en tu trabajo
> **local, sin pushear**. \`revert\` registra un commit nuevo y opuesto — úsalo en trabajo
> **compartido/pusheado**. Mismo objetivo (deshacer), radio de impacto opuesto.

# reflog: tu red de seguridad

Casi nada se pierde de verdad. \`git reflog\` registra todos los lugares donde ha estado \`HEAD\` —
incluidos commits que "borraste" con un mal reset. Encuentra el SHA, y puedes volver:

\`\`\`bash
git reflog                       # ...  a1b2c3d HEAD@{2}: commit: important work
git reset --hard a1b2c3d         # restaura ese estado
\`\`\`

El reflog es por lo que la gente con experiencia se mantiene tranquila tras un reset aterrador: los
commits normalmente siguen existiendo, sin referencia, por ~90 días antes de la recolección de
basura.`,
      },
      {
        title: "reset mueve el puntero de la rama a lo largo del DAG",
      },
      {
        title: "Calcula el tip final de la rama tras operaciones de reset",
        prompt: `Dada una historia lineal de commits y una lista de operaciones, calcula dónde
termina el puntero de la rama. Escribe \`final_tip(parents, start, ops)\`:

- \`parents\` mapea cada id de commit a su padre (\`None\` para la raíz).
- \`start\` es el id del commit tip actual de la rama.
- \`ops\` es una lista de operaciones aplicadas en orden, cada una una de:
  - \`("commit", new_id)\` — un commit nuevo cuyo padre es el tip actual; la rama se mueve a
    \`new_id\` (y \`parents\` gana \`new_id -> tip viejo\`).
  - \`("reset", n)\` — mueve el tip \`n\` commits hacia atrás siguiendo los punteros al padre
    (como \`git reset HEAD~n\`).

Devuelve el id del commit al que apunta la rama tras aplicar cada op.`,
        hints: [
          "Mantén una variable local `tip`; itera sobre ops y actualízala.",
          "Para `commit`: registra `parents[new_id] = tip`, luego fija `tip = new_id`.",
          "Para `reset`: itera n veces haciendo `tip = parents[tip]`.",
        ],
      },
      {
        question: "Pusheaste un commit malo a `main` ayer y los compañeros lo han jalado. ¿Cuál es la forma correcta de deshacerlo?",
        options: [
          "`git revert <sha>` — añade un commit nuevo que invierte el cambio, dejando la historia compartida intacta (sin SHAs reescritos)",
          "`git reset --hard HEAD~1` y force-push, reescribiendo la historia compartida",
          "Borra el repositorio y vuelve a clonar",
          "Nada se puede hacer una vez que un commit está pusheado",
        ],
        explanation:
          "Sobre historia compartida, `revert` es el deshacer seguro: registra un commit opuesto y nunca cambia los SHAs existentes, así que ningún clon de nadie se rompe. `reset --hard` + force-push reescribe historia pública — una violación de la regla de oro que desincroniza a todos.",
      },
      {
        question: "Corriste `git reset --hard` y perdiste un commit que sí necesitabas. ¿Cuál es tu primer movimiento?",
        options: [
          "`git reflog` para encontrar el SHA del commit perdido (la historia de HEAD está registrada), luego `git reset --hard <sha>` o cherry-pick para traerlo de vuelta",
          "Nada — --hard borra los commits para siempre, permanente e inmediatamente",
          "Vuelve a clonar el repo desde origin y espera que esté ahí",
          "Corre `git commit` para traerlo de vuelta",
        ],
        explanation:
          "reflog registra cada posición que HEAD sostuvo, así que un commit 'perdido' normalmente sigue siendo alcanzable por SHA por ~90 días antes de la recolección de basura. Esta es la red de seguridad que hace sobrevivible el reset — encuentra el SHA, resetea/cherry-pickea de vuelta.",
      },
    ],
  },

  "git-for-data-teams": {
    title: "Git para Equipos de Datos",
    summary: ".gitignore, por qué no commitear datos/secretos, LFS y versionado de datos.",
    blocks: [
      {
        markdown: `# Git es para código, no para datos

Git fue construido para código fuente — texto que cambia línea por línea. Los datos rompen sus
supuestos, así que los equipos de datos siguen unas cuantas reglas firmes.

## .gitignore: mantén basura y datos fuera de la historia

Un archivo \`.gitignore\` lista patrones que Git nunca debe trackear:

\`\`\`gitignore
# secretos & config
.env
*.pem
credentials.json

# datos — pertenecen a S3/un warehouse, NO a git
*.csv
*.parquet
data/
*.db

# salida de notebooks & cachés
.ipynb_checkpoints/
__pycache__/
.venv/

# artefactos de build
dist/
\`\`\`

## Nunca commitees datos — tres razones

1. **Los repos se inflan para siempre.** Git conserva *cada versión* de cada archivo en la historia.
   Commitea un CSV de 500 MB, bórralo en el siguiente commit, y aún vive en \`.git\` para siempre —
   cada clon lo arrastra. Reescribir la historia para purgarlo es doloroso.
2. **Los diffs no tienen sentido.** Git hace line-diff de un archivo Parquet como binario ilegible;
   no obtienes valor de review y conflictos constantes.
3. **Los datos pertenecen a sistemas de datos** — object storage (S3), un warehouse, un lake. Git
   trackea el *código* que produce los datos; los datos mismos se versionan ahí.

## Nunca commitees secretos

Una API key o password de DB commiteada está en la historia **incluso después de borrarla** —
cualquiera que haya clonado el repo alguna vez la tiene. Si pasa: **rota la credencial de inmediato**
(asume que está comprometida), luego limpia la historia. Prevénlo con \`.gitignore\`, variables de
entorno, y escaneo de secretos (GitHub bloquea muchos formatos de clave conocidos al pushear).

## Cuando SÍ necesitas archivos grandes: LFS y versionado de datos

- **Git LFS** (Large File Storage) guarda archivos grandes (modelos, imágenes) fuera del repo y
  mantiene un pequeño puntero de texto en Git — la historia se mantiene ligera.
- **DVC / lakeFS / Delta / Iceberg** versionan *datasets* junto al código: Git trackea un pequeño
  archivo de puntero/metadatos; los datos reales viven en S3 con su propio versionado y viaje en el
  tiempo. Así consigues "reproduce los datos + código exactos de la corrida del modelo del martes
  pasado" sin meter terabytes en Git.`,
      },
      {
        question: "¿Por qué commitear un dataset de 500 MB a Git es un problema aunque lo borres en el siguiente commit?",
        options: [
          "Git conserva la historia completa, así que el blob de 500 MB queda en .git para siempre — cada clon y fetch lo arrastra, y quitarlo requiere una reescritura dolorosa de la historia",
          "Git se niega a guardar archivos de más de 100 MB, así que nunca se commiteó",
          "Borrarlo en el siguiente commit lo quita completamente de la historia",
          "Está bien — Git comprime los archivos de datos casi a cero",
        ],
        explanation:
          "La historia es append-only: un borrado es solo otro commit; el contenido viejo sigue siendo alcanzable y clonado. Por eso los datos viven en S3/warehouses (versionados ahí) y Git trackea solo el código — con punteros LFS/DVC cuando un artefacto grande de verdad debe referenciarse.",
      },
      {
        question: "Commiteaste y pusheaste por accidente una access key de AWS. ¿Qué debes hacer PRIMERO?",
        options: [
          "Rota/revoca la clave de inmediato — asume que está comprometida — luego límpiala de la historia; quitar solo el commit no es suficiente",
          "Solo borra la línea en un commit nuevo; eso la quita de la historia",
          "Haz el repo privado y considéralo resuelto",
          "Nada, mientras nadie se haya dado cuenta",
        ],
        explanation:
          "Una vez pusheado, el secreto existe en la historia y en cada clon/fork — cualquiera que tuvo acceso puede tenerlo. La rotación es el único arreglo real; limpiar la historia y .gitignore previenen la recurrencia pero no des-filtran el valor viejo.",
      },
      {
        title: "Git para equipos de datos",
        cards: [
          { front: ".gitignore", back: "Un archivo de patrones que Git nunca debe trackear — secretos (.env, *.pem), datos (*.csv, *.parquet, data/), cachés y artefactos de build." },
          { front: "Por qué no commitear datos", back: "La historia conserva cada versión para siempre (inflado del repo), los diffs binarios no tienen sentido, y los datos pertenecen a S3/warehouses/lakes que los versionan bien." },
          { front: "Secreto commiteado = secreto filtrado", back: "Queda en la historia y en cada clon incluso tras borrarlo. Arreglo = rota la credencial de inmediato, luego limpia la historia. Prevén con .gitignore + variables de entorno." },
          { front: "Git LFS", back: "Large File Storage: guarda binarios grandes fuera del repo, dejando solo un pequeño puntero en Git para que la historia se mantenga ligera." },
          { front: "Versionado de datos (DVC/lakeFS/Delta/Iceberg)", back: "Versiona datasets junto al código: Git trackea un pequeño archivo de metadatos/puntero; los datos viven en object storage con su propio versionado + viaje en el tiempo." },
          { front: "Qué debe trackear Git", back: "El CÓDIGO que produce datos (pipelines, modelos dbt, configs) — más punteros/metadatos para artefactos grandes. No los datos mismos." },
        ],
      },
    ],
  },

  "git-ci-github-actions": {
    title: "CI/CD con GitHub Actions",
    summary: "Automatiza tests, linting y checks de dbt/pipeline en cada PR.",
    blocks: [
      {
        markdown: `# Integración Continua: deja que los robots custodien la calidad

**CI** corre checks automáticos en cada push/PR para que el código roto nunca llegue a \`main\`.
**GitHub Actions** es el CI integrado de GitHub: dejas un archivo YAML en \`.github/workflows/\` y
corre según los triggers que declares.

\`\`\`yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:            # corre en cada PR...
  push:
    branches: [main]       # ...y en pushes a main

jobs:
  test:                    # un job corre en una VM nueva ("runner")
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4        # clona el repo
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - run: pip install -r requirements.txt
      - run: ruff check .                 # lint
      - run: pytest -q                    # tests → una salida distinta de cero falla el job
\`\`\`

El vocabulario:

- **workflow** — todo el archivo YAML, disparado por eventos (\`on:\`).
- **job** — un conjunto de pasos en un runner nuevo; los jobs pueden correr en paralelo.
- **step** — un comando (\`run:\`) o una **action** reutilizable (\`uses:\`).
- Un job **falla** si cualquier paso devuelve un código de salida distinto de cero — el mismo
  contrato de códigos de salida del track de Linux. Un check rojo **bloquea el merge del PR**.

# CI para equipos de datos

La misma maquinaria custodia la calidad de los *datos*, no solo el código de la app:

- **\`pytest\`** en tus transformaciones y utilidades de Python.
- **\`dbt build\`** / \`dbt test\` en un PR — compila modelos y corre tests de schema/datos (unique,
  not-null, relationships) contra un warehouse de CI *antes* del merge.
- **linters/formatters** (ruff, black, sqlfluff) para código consistente.
- **\`dbt build --select state:modified+\`** para testear solo lo que un PR cambió.

# Secretos & CD

CI necesita credenciales (un login de warehouse, una clave de AWS) pero **nunca** las escribes a
fuego. Guárdalas como **GitHub Secrets** (encriptadas, inyectadas como variables de entorno):

\`\`\`yaml
      - run: dbt build
        env:
          DBT_PASSWORD: \${{ secrets.DBT_PASSWORD }}
\`\`\`

**CD** (Continuous Deployment) extiende esto: una vez que los checks pasan en \`main\`, un workflow
*despliega* — publica un paquete, envía un contenedor, o (como **este mismo proyecto**) construye el
sitio estático y lo pushea a GitHub Pages vía \`.github/workflows/deploy.yml\`. Ese es el ciclo
entero: PR → review + CI en verde → merge → auto-deploy.`,
      },
      {
        question: "En GitHub Actions, ¿qué hace que un job reporte fallo y bloquee el merge de un PR?",
        options: [
          "Cualquier paso que salga con un código distinto de cero (p. ej. pytest encuentra un test que falla, o dbt test encuentra filas que violan una regla) — el mismo contrato de códigos de salida que usa la shell",
          "Solo una línea `fail:` explícita en el YAML",
          "Un job nunca puede bloquear un PR; los checks son solo consultivos",
          "Correr más de 60 segundos",
        ],
        explanation:
          "Los pasos son solo comandos; una salida distinta de cero falla el paso, que falla el job, que pone rojo el check del PR. Con protección de rama, un check requerido en rojo impide el merge — automatizando la regla de 'no envíes código (o datos) roto'.",
      },
      {
        question: "Tu job de CI necesita un password de warehouse para correr `dbt build`. ¿Cómo deberías proveerlo?",
        options: [
          "Guárdalo como un GitHub Secret encriptado y referéncialo como ${{ secrets.NAME }}, inyectado en el env del paso — nunca lo commitees en el archivo de workflow",
          "Escríbelo a fuego en el YAML para que el runner pueda leerlo",
          "Commitéalo a un archivo .env en el repo",
          "Imprímelo en los logs para poder copiarlo en cada corrida",
        ],
        explanation:
          "Los archivos de workflow están en el repo (y a menudo son públicos), así que un secreto escrito a fuego es una fuga. Los GitHub Secrets están encriptados en reposo e inyectados como variables de entorno en runtime — el equivalente en CI de la regla 'secretos en variables de entorno, nunca en el código'.",
      },
      {
        title: "CI/CD & GitHub Actions",
        cards: [
          { front: "Integración Continua (CI)", back: "Correr checks automáticamente (tests, linters, builds) en cada push/PR para que el código roto nunca llegue a main." },
          { front: "GitHub Actions", back: "El CI/CD integrado de GitHub. Los archivos YAML en .github/workflows/ corren según eventos declarados (pull_request, push, schedule...)." },
          { front: "workflow / job / step", back: "workflow = el YAML disparado por eventos; job = pasos en un runner nuevo (los jobs pueden paralelizar); step = un comando (run) o una action reutilizable (uses)." },
          { front: "Cómo falla un check", back: "Un paso que sale distinto de cero falla el job → check de PR en rojo. Con protección de rama, un check requerido en rojo bloquea el merge." },
          { front: "CI para datos", back: "pytest en transformaciones, dbt build/test (unique/not-null/relationships) contra un warehouse de CI, linting con sqlfluff/ruff — atrapa lógica de datos mala antes del merge." },
          { front: "GitHub Secrets", back: "Credenciales encriptadas inyectadas como variables de entorno vía ${{ secrets.NAME }}. Nunca escribas a fuego passwords/claves en el archivo de workflow." },
          { front: "Continuous Deployment (CD)", back: "Tras pasar los checks en main, auto-despliega: publica un paquete, envía un contenedor, o construye+pushea un sitio (este proyecto despliega a GitHub Pages)." },
        ],
      },
    ],
  },
};
