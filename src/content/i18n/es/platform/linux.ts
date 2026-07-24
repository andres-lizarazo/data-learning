import type { LessonI18n } from "../../overlay";

// Spanish overlay for the "Linux & the Command Line" module (Foundations & Tooling track).
// Index-matched; text-only. All executable code/tests/solutions come from the English source.
export const linuxEs: Record<string, LessonI18n> = {
  "linux-shell-filesystem": {
    title: "La Shell y el Sistema de Archivos",
    summary: "Qué es la shell, y cómo Linux organiza su único gran árbol.",
    blocks: [
      {
        markdown: `# Por qué la línea de comandos

Casi toda herramienta de datos termina corriendo sobre Linux: tus workers de Airflow, tu clúster
de Spark, la máquina donde vive tu base de datos, el runner de CI que despliega tus modelos dbt.
Vas a hacer \`ssh\` a un servidor que **no tiene interfaz gráfica** y se esperará que encuentres un
archivo, sigas un log y arregles un job. La shell es esa habilidad.

La **shell** (normalmente \`bash\` o \`zsh\`) es un programa que lee una línea, la ejecuta y muestra el
resultado — un REPL para tu sistema operativo. Escribes un **comando**, **flags** opcionales
(\`-l\`, \`--help\`) y **argumentos**:

\`\`\`bash
ls -l /var/log        # comando=ls, flag=-l (long), argumento=/var/log
\`\`\`

# Un solo árbol, con raíz en /

Windows tiene \`C:\\\`, \`D:\\\`. Linux tiene **un** árbol que empieza en \`/\` (root). Todo — discos,
memorias USB, incluso dispositivos — cuelga de algún punto de él.

\`\`\`
/                 la raíz de todo
├── home/ana/     tus cosas (a.k.a. ~)
├── etc/          configuración del sistema (¡archivos de texto!)
├── var/log/      logs — donde vivirás durante los incidentes
├── tmp/          espacio temporal, se borra al reiniciar
├── usr/bin/      programas instalados (ls, grep, python...)
└── mnt/ , /data  discos montados — a menudo donde viven los datasets grandes
\`\`\`

## Rutas: absolutas vs relativas

- **Absoluta** empieza en \`/\`: \`/home/ana/orders.csv\` — inequívoca, funciona en cualquier lugar.
- **Relativa** empieza desde tu **directorio actual**: \`data/orders.csv\`.
- Atajos: \`.\` = aquí, \`..\` = un nivel arriba, \`~\` = tu home, \`-\` = el directorio anterior.

Tres comandos te orientan en cualquier lugar:

\`\`\`bash
pwd           # "print working directory" — ¿dónde estoy?
ls            # ¿qué hay aquí?
cd /var/log   # cambiar de directorio (cd sin argumentos → home)
\`\`\`

Regla general: usa **rutas absolutas en scripts y cron** (el directorio de trabajo de un job rara
vez es el que supones), y rutas relativas cuando exploras de forma interactiva.`,
      },
      {
        question:
          "Un job programado corre `python etl.py` y lee `data/input.csv` (una ruta relativa). Funciona cuando lo ejecutas a mano pero falla bajo cron con 'file not found'. ¿Por qué?",
        options: [
          "cron inicia el job en un directorio de trabajo distinto (normalmente el home del usuario), así que la ruta relativa resuelve a otro sitio — usa una ruta absoluta o haz `cd` primero",
          "cron no puede leer archivos CSV",
          "El archivo se borró entre ejecuciones",
          "Las rutas relativas no están permitidas en Python",
        ],
        explanation:
          "Las rutas relativas dependen del directorio de trabajo actual, y el de cron no es el de tu shell interactiva. Este es uno de los bugs 'funciona en mi máquina' más comunes en pipelines de datos — usa rutas absolutas en todo lo automatizado.",
      },
      {
        question: "Estás en `/home/ana/projects/etl`. ¿Qué comando te lleva a `/home/ana`?",
        options: [
          "`cd ..` — un nivel arriba",
          "`cd .` — se queda donde está (directorio actual)",
          "`cd /` — va a root, no a home",
          "`cd ~/projects` — va más profundo, no arriba",
        ],
        explanation:
          "`..` es el directorio padre. `~` también funcionaría aquí (`cd ~` o simplemente `cd`) ya que `/home/ana` es el home de Ana — pero `.` significa 'el directorio actual' y no va a ningún lado.",
      },
      {
        title: "Orientación y rutas",
        cards: [
          { front: "La shell", back: "Un REPL para el SO: lee un comando + flags + argumentos, lo ejecuta, muestra la salida. Normalmente bash o zsh." },
          { front: "/ (root)", back: "El único tope del árbol del sistema de archivos de Linux. Cada disco y dispositivo cuelga de él — no hay letras de unidad." },
          { front: "Ruta absoluta vs relativa", back: "La absoluta empieza en `/` y funciona desde cualquier lugar. La relativa parte del directorio de trabajo actual (pwd). Automatiza con rutas absolutas." },
          { front: ". / .. / ~ / -", back: "`.` = directorio actual, `..` = directorio padre, `~` = tu home, `-` = el directorio anterior donde estabas." },
          { front: "pwd / ls / cd", back: "¿Dónde estoy / qué hay aquí / ir allá. `cd` sin argumentos te devuelve a tu directorio home." },
          { front: "/var/log", back: "Donde viven los logs del sistema y las apps. Tu primera parada durante un incidente (con tail/grep)." },
        ],
      },
    ],
  },

  "linux-files-directories": {
    title: "Trabajar con Archivos y Directorios",
    summary: "Crear, copiar, mover, borrar y buscar — más patrones de globbing.",
    blocks: [
      {
        markdown: `# Los verbos del sistema de archivos

\`\`\`bash
mkdir -p data/2026/01     # crea directorios; -p crea los padres si hace falta
touch notes.md            # crea un archivo vacío (o actualiza su timestamp)
cp orders.csv backup.csv  # copia; cp -r para un directorio entero
mv old.csv archive/       # mueve O renombra (el mismo comando)
rm temp.csv               # borra un archivo
rm -r build/              # borra un directorio + su contenido (¡sin deshacer!)
\`\`\`

> **\`rm\` es para siempre.** No hay Papelera de reciclaje. \`rm -rf /\` es el error más
> infame de internet. Verifica dos veces la ruta antes de pulsar Enter, sobre todo con
> \`-r\` (recursivo) y \`-f\` (forzar). Prefiere \`rm -i\` (interactivo) cuando dudes.

# Globbing: patrones que la shell expande por ti

Antes incluso de que un comando corra, la **shell** expande los comodines en nombres de archivo
que coinciden:

| Patrón | Coincide con |
|---|---|
| \`*\` | cualquier secuencia de caracteres (\`*.csv\` → todos los CSV) |
| \`?\` | exactamente un carácter (\`log?.txt\` → \`log1.txt\`) |
| \`[0-9]\` | un carácter de un conjunto/rango (\`data[12].csv\`) |
| \`**\` | cualquier profundidad, con \`globstar\` (\`**/*.parquet\`) |

\`\`\`bash
ls data/2026/*.csv          # todos los CSV de esa carpeta
rm -r tmp_*/                # todos los directorios que empiezan por tmp_
cp reports/*.pdf ~/inbox/   # la shell le pasa a cp la lista ya expandida
\`\`\`

El globbing **no** es regex — es más simple y coincide con nombres de archivo completos. Los data
engineers se apoyan en él constantemente: "procesa cada archivo de partición", "limpia los directorios
temporales de ayer". Equivócate con \`rm\` y borras el conjunto equivocado — así que haz \`ls\` del patrón
primero, y cambia \`ls\` por \`rm\` una vez que confíes en él.

# Buscar archivos: \`find\`

\`\`\`bash
find /data -name "*.parquet"          # por nombre, recursivamente
find . -type f -size +100M            # archivos de más de 100 MB
find /var/log -name "*.log" -mtime -1 # logs modificados en el último día
find . -name "*.tmp" -delete          # buscar + actuar (¡cuidado!)
\`\`\`

\`find\` recorre el árbol y filtra por nombre, tipo, tamaño o edad — la herramienta a la que acudes
cuando "en algún lugar bajo /data hay un archivo enorme comiéndose el disco."`,
      },
      {
        title: "Mira cómo se expande el globbing (fnmatch de Python = las mismas reglas)",
      },
      {
        title: "Implementa globbing estilo shell",
        prompt: `La shell expande \`*\` (cualquier secuencia de caracteres, incluida la vacía) antes de
correr un comando. Escribe \`match_glob(names, pattern)\` que devuelva la sublista de
\`names\` que coincide con un patrón donde \`*\` es el único comodín.

- \`*\` coincide con cualquier secuencia de caracteres (incluida ninguna).
- Cualquier otro carácter debe coincidir literalmente.
- El nombre **completo** debe coincidir (como un nombre de archivo, no una búsqueda de subcadena).
- Conserva el orden de entrada.

Ejemplo: \`"*.csv"\` coincide con \`"a.csv"\` y \`".csv"\` pero no con \`"a.csvx"\`.`,
        hints: [
          "El `fnmatch.translate` de Python convierte un glob en un regex — pero impleméntalo tú mismo: convierte el patrón en un regex donde `*` pasa a `.*` y los demás caracteres se escapan.",
          "Ancla el regex con `^...$` (vía `re.fullmatch`) para que el nombre COMPLETO deba coincidir, no una subcadena.",
          "Escapa los caracteres literales con `re.escape` para que un `.` en el patrón no actúe como el 'cualquier carácter' de regex.",
        ],
      },
      {
        question: "Corres `ls *.log` en una carpeta sin archivos `.log`. En bash (configuración por defecto), ¿qué suele pasar?",
        options: [
          "El glob no coincide, así que el literal `*.log` se le pasa a ls, que reporta que no encuentra un archivo llamado '*.log'",
          "ls lista todos los archivos del directorio",
          "La shell lanza un error de sintaxis",
          "ls no lista nada en silencio",
        ],
        explanation:
          "Por defecto bash deja un glob sin coincidencias como la cadena literal (una sorpresa clásica). Herramientas como `find`, o `nullglob`/`shopt` de bash, evitan esto. Por eso los scripts a menudo se protegen con `if ls *.log 2>/dev/null` o usan `find` en su lugar.",
      },
    ],
  },

  "linux-viewing-searching": {
    title: "Ver y Buscar Texto",
    summary: "cat, less, head/tail, grep, wc — inspecciona datos sin cargarlos.",
    blocks: [
      {
        markdown: `# Mira antes de cargar

Un CSV de 3 GB colgará tu laptop si lo abres en una hoja de cálculo — pero la shell lo inspecciona
en milisegundos sin cargarlo entero. Este es un reflejo diario de datos: **mira el archivo primero.**

\`\`\`bash
head orders.csv          # primeras 10 líneas (el header + una muestra)
head -n 3 orders.csv     # primeras 3 líneas
tail orders.csv          # últimas 10 líneas
tail -n 100 app.log      # últimas 100 líneas del log
tail -f app.log          # SEGUIR: transmite las líneas nuevas en vivo (Ctrl-C para parar)
wc -l orders.csv         # cuenta líneas (¡filas!) sin abrirlo
cat small.csv            # vuelca un archivo entero (pequeño) a la pantalla
less big.csv             # navega interactivamente (q para salir, / para buscar)
\`\`\`

- \`head\`/\`tail\` — el header y la cola de un archivo. \`tail -f\` es cómo observas el log de un
  job en tiempo real durante un deploy o un incidente.
- \`wc -l\` — "¿cuántas filas tiene este archivo?" al instante.
- \`less\` — un paginador para archivos demasiado grandes para la pantalla; nunca hagas \`cat\` a un
  archivo de 3 GB.

# grep: encuentra la aguja

\`grep\` muestra las líneas que coinciden con un patrón — la herramienta de texto más usada en Linux:

\`\`\`bash
grep "ERROR" app.log              # líneas que contienen ERROR
grep -i "error" app.log           # -i = insensible a mayúsculas
grep -c "ERROR" app.log           # -c = cuenta las líneas que coinciden
grep -n "timeout" app.log         # -n = muestra los números de línea
grep -v "DEBUG" app.log           # -v = INVERTIR: líneas SIN DEBUG
grep -r "api_key" .               # -r = recorre un árbol de directorios
grep -E "WARN|ERROR" app.log      # -E = regex extendido (alternancia)
\`\`\`

El patrón es una **expresión regular**, así que \`grep "^2026-01"\` encuentra líneas que empiezan
con esa fecha, \`grep "[0-9]\\{3\\}"\` encuentra tres dígitos, y así. Durante un incidente,
\`grep -i error /var/log/app.log | tail\` suele ser tu primer movimiento.`,
      },
      {
        title: "head / tail / grep -c, en Python",
      },
      {
        question: "Un job está corriendo ahora mismo y quieres ver su log actualizarse en vivo a medida que escribe. ¿Qué comando?",
        options: [
          "`tail -f app.log` — sigue el archivo, mostrando las líneas nuevas conforme se agregan",
          "`cat app.log` — imprime el contenido actual una vez y termina",
          "`head app.log` — solo muestra las primeras 10 líneas",
          "`wc -l app.log` — solo cuenta líneas",
        ],
        explanation:
          "`tail -f` (follow) mantiene el archivo abierto y transmite las líneas agregadas — la forma estándar de observar un deploy o un pipeline en marcha. Añade `| grep -i error` para vigilar solo los problemas.",
      },
      {
        question: "Quieres el número de filas de datos en `orders.csv` (que tiene una fila de header). ¿Cuál es la trampa con `wc -l orders.csv`?",
        options: [
          "`wc -l` cuenta cada línea incluyendo el header, así que el conteo de filas de datos es el resultado menos 1 (y cuenta mal si un campo contiene saltos de línea embebidos)",
          "`wc -l` cuenta palabras, no líneas",
          "`wc -l` ignora el header automáticamente",
          "`wc -l` solo funciona en archivos .txt",
        ],
        explanation:
          "`wc -l` cuenta caracteres de nueva línea — rápido y normalmente correcto, pero incluye la línea del header, y un campo CSV correctamente entrecomillado puede contener legalmente un salto de línea (así que para CSV desordenados, un parser real es más seguro). Genial para una verificación rápida, no para facturar.",
      },
      {
        title: "Herramientas para ver y buscar",
        cards: [
          { front: "head / tail", back: "Primeras / últimas N líneas de un archivo (por defecto 10; -n para elegir). `tail -f` sigue un archivo en vivo — el comando para vigilar incidentes." },
          { front: "wc -l", back: "Cuenta líneas. En un CSV eso es ≈ filas (menos el header). Conteo de filas instantáneo sin abrir el archivo." },
          { front: "less", back: "Un paginador: recorre un archivo enorme pantalla a pantalla (q para salir, / para buscar, G para saltar al final). Nunca hagas `cat` a un archivo de varios GB." },
          { front: "grep PATRÓN archivo", back: "Muestra las líneas que coinciden con un regex. El caballo de batalla del análisis de logs." },
          { front: "grep -i / -c / -n / -v / -r", back: "Insensible a mayúsculas / Cuenta coincidencias / muestra Números de línea / inVierte (no coincidentes) / Recorre un árbol de directorios." },
          { front: "grep -r \"api_key\" .", back: "Busca recursivamente una cadena en un árbol — p. ej. cazar un secreto commiteado por accidente antes de hacer push." },
        ],
      },
    ],
  },

  "linux-pipes-redirection": {
    title: "Pipes, Redirección y la Filosofía Unix",
    summary: "Compón herramientas pequeñas en un pipeline de datos con | y >.",
    blocks: [
      {
        markdown: `# Tres streams

Cada comando tiene tres canales:

- **stdin** (0) — la entrada que llega.
- **stdout** (1) — la salida normal que sale.
- **stderr** (2) — la salida de error/diagnóstico, mantenida aparte a propósito.

Los conectas con **redirección** y **pipes**:

\`\`\`bash
command > out.txt      # stdout HACIA un archivo (sobrescribe)
command >> out.txt     # stdout AGREGADO a un archivo
command < in.txt       # alimenta un archivo como stdin
command 2> err.txt     # stderr hacia un archivo
command > out 2>&1     # stdout a un archivo, y stderr al mismo lugar
command 2>/dev/null    # descarta los errores (los manda al agujero negro)
\`\`\`

Mantener stderr aparte es por lo que \`myjob > data.csv\` te da datos limpios aunque los mensajes de
progreso sigan imprimiéndose en tu terminal — los mensajes fueron a stderr, los datos a stdout.

# El pipe: | — el corazón de la filosofía Unix

Un **pipe** conecta el stdout de un comando al stdin del siguiente, de modo que los datos fluyen
por una cadena de herramientas diminutas de un solo propósito:

> **Filosofía Unix:** escribe programas que hagan una sola cosa bien, y que trabajen juntos a
> través de streams de texto. No necesitas un monolito — lo *compones*.

\`\`\`bash
# "Top 5 IPs por número de peticiones en el log de acceso" — una consulta analítica entera,
# construida con cinco herramientas que cada una hace una sola cosa:
cat access.log \\
  | grep " 500 " \\        # solo errores del servidor
  | cut -d' ' -f1 \\       # campo 1 = la IP (delimitado por espacios)
  | sort \\                # agrupa las IPs idénticas juntas...
  | uniq -c \\             # ...y cuenta cada grupo  ->  "  17 10.0.0.4"
  | sort -rn \\            # numérico, inverso: los más grandes primero
  | head -5               # top 5
\`\`\`

Ese par \`sort | uniq -c\` es el \`GROUP BY ... COUNT(*)\` de la shell — construiste la misma
agregación en SQL y pandas; aquí son cinco procesos transmitiéndose texto entre sí. Así es
genuinamente como los ingenieros exploran logs y datasets puntuales antes de recurrir a una
herramienta más pesada.`,
      },
      {
        title: "Reproduce un pipeline grep | cut | sort | uniq -c | sort -rn",
      },
      {
        title: "Implementa un pipeline de conteo de palabras",
        prompt: `Reproduce el clásico pipeline de frecuencia de palabras \`tr -s ' ' '\\n' | sort | uniq -c | sort -rn\`.
Escribe \`top_words(text, n)\` que devuelva las \`n\` palabras más frecuentes como
tuplas \`(palabra, conteo)\`, la más frecuente primero.

- Divide por **espacios en blanco** en palabras.
- Pasa cada palabra a minúsculas y quita la puntuación circundante \`.,!?;:\` (para que \`"Data,"\`
  y \`"data"\` sean la misma palabra). Ignora los tokens vacíos.
- Ordena por conteo descendente; desempata **alfabéticamente** (para que los resultados sean
  deterministas, como si pasaran por \`sort\` primero).`,
        hints: [
          "`text.split()` sin argumentos divide por cualquier espacio en blanco y descarta los tokens vacíos.",
          "`word.strip('.,!?;:').lower()` normaliza un token; sáltalo si queda vacío.",
          "Ordena con una clave de `(-count, word)` para que los conteos vayan descendentes pero los empates recaigan en el orden alfabético.",
        ],
      },
      {
        question: "¿Por qué redirigir con `myjob > data.csv 2> errors.log` en vez de solo `myjob > data.csv`?",
        options: [
          "Manda datos limpios a data.csv (stdout) mientras captura los diagnósticos/errores por separado en errors.log (stderr) — así los mensajes de progreso nunca contaminan tu archivo de datos",
          "`2>` hace que el job corra el doble de rápido",
          "`2>` es obligatorio siempre que usas `>`",
          "Fusiona los errores dentro del archivo de datos",
        ],
        explanation:
          "stdout y stderr son streams separados precisamente para que puedas dividir 'los datos' de 'la cháchara'. Fusiónalos con `2>&1` cuando quieras un solo log combinado; mantenlos aparte cuando stdout ES tu dataset.",
      },
      {
        question: "En `sort | uniq -c`, ¿por qué se requiere el `sort` antes de `uniq`?",
        options: [
          "`uniq` solo colapsa líneas duplicadas ADYACENTES, así que los valores idénticos deben juntarse primero — ordenar los agrupa, luego uniq -c cuenta cada grupo",
          "`uniq` ordena internamente, así que `sort` es redundante",
          "`sort` elimina duplicados y `uniq` los vuelve a añadir",
          "Es solo por legibilidad; el orden no le importa a uniq",
        ],
        explanation:
          "`uniq` es una herramienta de streaming sin memoria de lo que vio antes — solo compara cada línea con la anterior. `sort` agrupa las líneas iguales para que `uniq -c` pueda contar cada grupo. Ese par es el GROUP BY de la shell.",
      },
    ],
  },

  "linux-data-wrangling": {
    title: "Manipulación de Datos en la CLI",
    summary: "cut, sort, uniq, tr, sed, awk — un kit de ETL ligero.",
    blocks: [
      {
        markdown: `# La CLI es una herramienta de datos

Antes de pandas, antes de Spark, existía \`awk\`. Para un rápido "¿cuál es el ingreso total por
región en este CSV de 2 GB?" a menudo no necesitas un notebook — un one-liner transmite el archivo
y responde en segundos, usando memoria constante.

## Herramientas de columnas

\`\`\`bash
cut -d',' -f1,3 orders.csv        # campos 1 y 3, delimitados por comas
sort -t',' -k3 -n orders.csv      # ordena por la columna 3, numéricamente
sort -u regions.txt               # ordena + elimina duplicados
uniq -c                           # cuenta líneas duplicadas adyacentes
tr 'a-z' 'A-Z'                    # traduce/transforma caracteres
tr -s ' '                         # comprime espacios repetidos en uno
\`\`\`

## sed — editor de streams (buscar/reemplazar sobre un stream)

\`\`\`bash
sed 's/,/\\t/g' orders.csv         # reemplaza cada coma por un tab (CSV→TSV)
sed '1d' orders.csv               # borra la línea 1 (quita el header)
sed -n '2,5p' orders.csv          # imprime solo las líneas 2–5
\`\`\`

## awk — el mini lenguaje de datos

\`awk\` divide cada línea en campos (\`$1\`, \`$2\`, …; \`$0\` es la línea entera) y ejecuta tu lógica
por fila. Tiene variables, aritmética y arreglos asociativos — un GROUP BY entero en una expresión:

\`\`\`bash
# Suma el ingreso (columna 4) agrupado por región (columna 2):
awk -F',' 'NR>1 { rev[$2] += $4 } END { for (r in rev) print r, rev[r] }' orders.csv
\`\`\`

- \`-F','\` fija el separador de campos como una coma.
- \`NR>1\` salta el header (\`NR\` = número de fila actual).
- \`rev[$2] += $4\` acumula la columna 4 en un dict con clave la columna 2.
- el bloque \`END\` imprime los totales después de la última fila.

Eso es una agregación completa sobre un archivo arbitrariamente grande en **memoria constante** —
el mismo group-by que escribiste en SQL y pandas, expresado como un one-liner de streaming.`,
      },
      {
        title: "Un GROUP BY de streaming estilo awk en Python",
      },
      {
        question: "¿Por qué `awk` puede sumar un CSV de 50 GB en una laptop que no lo puede cargar en pandas?",
        options: [
          "awk transmite una línea a la vez y solo mantiene los totales acumulados (un dict pequeño) en memoria — nunca materializa el archivo entero, a diferencia de un DataFrame",
          "awk comprime el archivo primero",
          "awk está escrito en C, así que la memoria no es un problema",
          "awk usa la GPU automáticamente",
        ],
        explanation:
          "La agregación por streaming solo guarda el acumulador, así que la memoria es O(claves distintas), no O(filas). Esa es la misma razón por la que una base de datos puede hacer GROUP BY de una tabla mucho más grande que la RAM — y por la que las herramientas de CLI siguen siendo la navaja suiza de un data engineer.",
      },
      {
        question: "Quieres convertir un archivo separado por comas en uno separado por tabs. ¿Cuál es el movimiento correcto más rápido para un archivo simple?",
        options: [
          "`sed 's/,/\\t/g' orders.csv > orders.tsv` — reemplaza cada coma por un tab a lo largo del stream",
          "`cut -d','` — cut solo extrae campos, no puede reemplazar el delimitador",
          "`grep ','` — grep filtra líneas, no las transforma",
          "`wc -l` — eso solo cuenta líneas",
        ],
        explanation:
          "`sed 's/old/new/g'` es buscar-y-reemplazar sobre un stream — perfecto para un cambio mecánico de delimitador. (La advertencia honesta: si un campo contiene una coma dentro de comillas, un sed ingenuo lo corrompe — para CSV desordenados usa un parser real. Para archivos limpios, sed es instantáneo.)",
      },
      {
        title: "Kit de manipulación en la CLI",
        cards: [
          { front: "cut -d',' -f2", back: "Extrae la columna 2 de un stream delimitado por comas. El selector de columnas de la shell." },
          { front: "sort -t',' -k3 -n", back: "Ordena por el 3er campo delimitado por comas, numéricamente. Añade -r para inverso, -u para también deduplicar." },
          { front: "uniq -c", back: "Cuenta grupos de líneas idénticas adyacentes. Combínalo con `sort` primero → el GROUP BY COUNT(*) de la shell." },
          { front: "tr", back: "Traduce/borra caracteres: `tr a-z A-Z` pasa a mayúsculas; `tr -s ' '` comprime espacios repetidos; `tr -d '\\r'` quita retornos de carro." },
          { front: "sed 's/x/y/g'", back: "Editor de streams: buscar/reemplazar (g = cada ocurrencia), borrar líneas (`sed '1d'`), o imprimir un rango (`sed -n '2,5p'`)." },
          { front: "awk -F',' '{ a[$2]+=$4 } END{...}'", back: "Procesamiento de campos por fila con arreglos asociativos — un GROUP BY/agregación de streaming sobre un archivo de cualquier tamaño en memoria constante." },
          { front: "NR en awk", back: "El número de registro (fila) actual. `NR>1` es el idiom para 'saltar la fila del header'." },
        ],
      },
    ],
  },

  "linux-permissions": {
    title: "Permisos, Usuarios y Propiedad",
    summary: "rwx, owner/group/other, chmod, chown — y por qué los secretos son 600.",
    blocks: [
      {
        markdown: `# Quién puede hacer qué

Linux es multiusuario. Cada archivo tiene un **dueño (owner)**, un **grupo (group)**, y un conjunto
de permisos para tres clases de personas:

\`\`\`
-rw-r--r--  1  ana  data  4096  Jan 5  orders.csv
│└┬┘└┬┘└┬┘     └┬┘  └─┬┘
│ │  │  │       │    nombre del grupo
│ │  │  │       nombre del dueño
│ │  │  └── other:  r--   (todos los demás: solo lectura)
│ │  └───── group:  r--   (el grupo 'data': solo lectura)
│ └──────── owner:  rw-   (ana: lectura + escritura)
└────────── tipo:   -     (- = archivo, d = directorio, l = symlink)
\`\`\`

Tres bits de permiso, tres veces:

| Bit | En un archivo | En un directorio |
|---|---|---|
| **r** (4) | leer contenido | listar entradas |
| **w** (2) | modificar contenido | crear/borrar entradas dentro |
| **x** (1) | ejecutar como programa | entrar/atravesar (\`cd\` a él) |

# chmod: cambiar permisos

Dos notaciones, el mismo resultado:

\`\`\`bash
chmod u+x deploy.sh        # simbólica: añade eXecute para el User(dueño)
chmod go-w report.csv      # quita Write del Group y del Other
chmod 640 secret.env       # numérica: rw- r-- ---  (6=rw,4=r,0=nada)
\`\`\`

El modo numérico suma los bits: **r=4, w=2, x=1**. Así \`7 = rwx\`, \`6 = rw-\`, \`5 = r-x\`,
\`4 = r--\`. Lee \`640\` como owner=6(rw), group=4(r), other=0(nada).

# chown: cambiar dueño/grupo

\`\`\`bash
chown ana:data orders.csv    # fija owner=ana, group=data (suele requerir sudo)
\`\`\`

## Por qué esto importa para datos

- Un script no correrá hasta que sea ejecutable: \`chmod +x run_etl.sh\`.
- **Los secretos deben estar bloqueados.** Las claves SSH y los archivos de credenciales deberían
  ser \`chmod 600\` (\`rw-------\`): solo tú puedes leerlos. Muchas herramientas *se niegan a arrancar*
  si una clave es legible por el grupo o por todos — una verificación de seguridad deliberada.
- Los directorios de datos compartidos usan permisos de grupo para que un equipo pueda colaborar sin
  hacer los archivos escribibles por todo el mundo.`,
      },
      {
        title: "Decodifica y construye modos de chmod",
      },
      {
        question: "`chmod 600 id_rsa` fija qué permisos, y ¿por qué es el estándar para una clave SSH privada?",
        options: [
          "rw------- : solo el dueño puede leerla/escribirla. SSH se niega a usar una clave que otros puedan leer, porque una clave privada legible por todos es una fuga de credenciales",
          "rwxrwxrwx : todos obtienen acceso total, lo cual es cómodo",
          "r--r--r-- : solo lectura para todos, lo cual es suficientemente seguro",
          "Hace la clave ejecutable para que ssh pueda correrla",
        ],
        explanation:
          "6=rw para el dueño, 0=nada para grupo y otros. Una clave privada legible por cualquier otro está comprometida, así que OpenSSH impone permisos estrictos y da error de lo contrario. La misma lógica aplica a `.env` y a los archivos de credenciales de la nube.",
      },
      {
        question: "Un compañero no puede hacer `cd` a `/data/reports` aunque los archivos dentro son legibles. ¿Qué permiso falta probablemente en el DIRECTORIO?",
        options: [
          "execute (x) en el directorio — en un directorio, x significa 'puede atravesarlo/entrar'; sin él no puedes hacer cd ni alcanzar archivos por su ruta",
          "read (r) en cada archivo — pero los archivos ya son legibles",
          "write (w) en el directorio — solo se necesita para crear/borrar entradas",
          "Nada; los directorios no usan permisos",
        ],
        explanation:
          "Los permisos de directorio reinterpretan los bits: r = listar nombres, w = añadir/quitar entradas, x = atravesarlo. Necesitas x para hacer `cd` o resolver una ruta a través del directorio, aunque los archivos destino sean legibles.",
      },
      {
        title: "Vocabulario de permisos",
        cards: [
          { front: "r / w / x en un archivo", back: "leer contenido / modificar contenido / ejecutar como programa. Valores numéricos 4 / 2 / 1." },
          { front: "r / w / x en un directorio", back: "listar entradas / crear-borrar entradas / atravesar (cd a él, resolver rutas). x se necesita incluso solo para alcanzar los archivos de dentro." },
          { front: "owner / group / other", back: "Las tres clases de permiso. `-rw-r-----` = owner rw, group r, other nada. El orden es siempre owner, group, other." },
          { front: "chmod numérico (p. ej. 640)", back: "Suma los bits por clase: r4+w2+x1. 6=rw, 5=r-x, 4=r--, 7=rwx. 640 → owner rw, group r, other nada." },
          { front: "chmod +x script.sh", back: "Añade el bit de ejecución para que el archivo pueda correrse como programa. Un script de shell no corre sin él." },
          { front: "600 para secretos", back: "rw------- : solo el dueño lee/escribe. El modo requerido para claves SSH privadas y archivos de credenciales — las herramientas rechazan permisos más laxos." },
          { front: "chown user:group", back: "Cambia el dueño y el grupo de un archivo (suele requerir sudo). Se usa para entregar archivos a la cuenta de servicio o al grupo de equipo correctos." },
        ],
      },
    ],
  },

  "linux-processes": {
    title: "Procesos, Jobs y Monitoreo",
    summary: "ps, top, kill, jobs en background, códigos de salida, uso de disco.",
    blocks: [
      {
        markdown: `# Un programa en ejecución es un proceso

\`\`\`bash
ps aux                     # cada proceso: usuario, PID, %CPU, %MEM, comando
ps aux | grep python       # encuentra tus jobs de python (y sus PIDs)
top       (o  htop)        # monitor de procesos en vivo, ordenado (q para salir)
kill 4823                  # pide al proceso 4823 que pare (SIGTERM, elegante)
kill -9 4823               # forzar la muerte (SIGKILL) — último recurso, sin limpieza
\`\`\`

Cada proceso tiene un **PID** (id de proceso). \`kill\` le envía una **señal**: \`SIGTERM\`
(la predeterminada) le pide educadamente que se apague y limpie; \`SIGKILL\` (\`-9\`) es el mazo que
no puede atraparse — úsalo solo cuando un job esté realmente atascado, porque salta la limpieza
(archivos escritos a medias, locks retenidos).

# Jobs en background y de larga duración

\`\`\`bash
python train.py &          # corre en background; recuperas la shell
jobs                       # lista los jobs en background de esta shell
fg %1                      # trae el job 1 de vuelta al primer plano
nohup python etl.py &      # sigue corriendo incluso tras cerrar sesión
\`\`\`

Para cualquier cosa seria, \`nohup ... &\`, \`tmux\`/\`screen\`, o un scheduler real mantienen un job
vivo después de que se cierre tu sesión SSH — de lo contrario colgar la terminal mata a sus hijos.

# Códigos de salida: cómo la shell sabe si hubo éxito

Cada comando devuelve un **código de salida** numérico: **0 = éxito**, distinto de cero = fallo.
Es invisible hasta que lo miras, pero es la columna vertebral de la automatización:

\`\`\`bash
python etl.py
echo $?                    # imprime el código de salida del último comando
python etl.py && echo OK   # corre echo SOLO si etl.py tuvo éxito (exit 0)
python etl.py || alert.sh  # corre alert SOLO si FALLÓ (distinto de cero)
\`\`\`

Airflow, CI, cron, Make — todos deciden "¿pasó este paso?" por el código de salida.
Un pipeline que siempre sale con 0 incluso al fallar es una máquina de pérdida silenciosa de datos.

# Disco y recursos

\`\`\`bash
df -h                      # espacio en disco por sistema de archivos (legible)
du -sh /data/*             # tamaño de cada cosa bajo /data (encuentra al glotón)
free -h                    # uso de memoria
\`\`\`

"El pipeline murió durante la noche" es muy a menudo "el disco se llenó" — \`df -h\` es lo primero
que revisar, luego \`du -sh\` para encontrar qué se lo comió.`,
      },
      {
        title: "Los códigos de salida controlan un pipeline (lógica && / ||)",
      },
      {
        question: "Un colega hace `kill -9` a cada job que se porta mal. ¿Por qué usar `-9` (SIGKILL) por defecto es arriesgado para un job de datos?",
        options: [
          "SIGKILL no puede atraparse, así que el proceso salta la limpieza — puede dejar archivos de salida escritos a medias, transacciones sin confirmar o locks obsoletos. Un `kill` normal (SIGTERM) le deja apagarse elegantemente primero",
          "SIGKILL es más lento que SIGTERM",
          "SIGKILL solo funciona como root",
          "No hay diferencia; -9 solo es más corto de escribir",
        ],
        explanation:
          "SIGTERM pide amablemente y deja al proceso terminar escrituras, vaciar buffers y liberar locks; SIGKILL corta la corriente. Recurre a `-9` solo cuando un paro elegante ya falló — de lo contrario arriesgas salida parcial corrupta.",
      },
      {
        question: "En `python etl.py && python publish.py`, ¿cuándo corre `publish.py`?",
        options: [
          "Solo si `etl.py` sale con 0 (éxito) — `&&` encadena según el éxito",
          "Siempre, justo después de etl.py sin importar el resultado",
          "Solo si etl.py FALLA (código de salida distinto de cero)",
          "Nunca — `&&` es un error de sintaxis entre dos comandos",
        ],
        explanation:
          "`A && B` corre B solo si A tuvo éxito (exit 0); `A || B` corre B solo si A falló. Esta lógica de códigos de salida es cómo los scripts de shell, los Makefiles y CI detienen un pipeline en el momento en que un paso se rompe en vez de publicar datos malos.",
      },
      {
        title: "Procesos y monitoreo",
        cards: [
          { front: "PID", back: "Process ID — el número que identifica un proceso en ejecución, usado por kill y mostrado por ps/top." },
          { front: "ps aux | grep NOMBRE", back: "Encuentra procesos en ejecución que coincidan con NOMBRE (y sus PIDs). El comando de '¿sigue corriendo mi job / cuál es su PID?'." },
          { front: "top / htop", back: "Vista en vivo, ordenada, de procesos por CPU/memoria. Tu dashboard cuando una máquina está sobrecargada (q para salir)." },
          { front: "SIGTERM vs SIGKILL (-9)", back: "SIGTERM (kill por defecto) le pide a un proceso apagarse elegantemente; SIGKILL (-9) lo mata a la fuerza sin limpieza. Prueba SIGTERM primero." },
          { front: "cmd &  /  nohup cmd &", back: "Corre en background (recuperas tu shell). nohup lo mantiene vivo tras cerrar sesión — para jobs largos sobre SSH." },
          { front: "$? (código de salida)", back: "El estado de salida del último comando: 0 = éxito, distinto de cero = fallo. Cómo cron/CI/Airflow deciden pasa o falla." },
          { front: "df -h / du -sh", back: "Espacio libre por sistema de archivos / tamaño de cada ruta. Lo primero a revisar cuando 'el pipeline murió durante la noche' (normalmente un disco lleno)." },
        ],
      },
    ],
  },

  "linux-environment-scripting": {
    title: "Entorno, Scripting y Programación de Tareas",
    summary: "Variables de entorno, un script de bash, y cron para jobs batch.",
    blocks: [
      {
        markdown: `# Variables de entorno

Cada proceso hereda un conjunto de **variables de entorno** clave–valor — la forma estándar de
pasar configuración y (sobre todo) **secretos** sin escribirlos a fuego en el código:

\`\`\`bash
echo $HOME                       # una variable integrada: tu directorio home
echo $PATH                       # dónde busca la shell los comandos
export DB_URL="postgres://..."   # fija una var para esta shell + sus hijos
export AWS_REGION=us-east-1
python etl.py                    # etl.py lee os.environ["DB_URL"]
\`\`\`

- \`$PATH\` es una lista de directorios separada por dos puntos; cuando escribes \`python\`, la shell
  busca en \`$PATH\` en orden la primera coincidencia. "command not found" casi siempre significa que
  el programa no está en tu \`$PATH\`.
- Pon los ajustes persistentes en \`~/.bashrc\` / \`~/.zshrc\` (se ejecutan en cada nueva shell).
- **Los secretos van en variables de entorno o en un archivo \`.env\` ignorado por git — nunca en el
  código.** Esta es exactamente la regla que siguen las credenciales de datos en tus pipelines.

# Un script de shell

Un script son solo comandos en un archivo. Hazlo un programa de verdad con un **shebang** y el
bit de ejecución:

\`\`\`bash
#!/usr/bin/env bash
set -euo pipefail            # falla rápido: -e sale ante un error, -u error si var sin definir,
                            # pipefail = un pipeline falla si CUALQUIER etapa falla

DATE=$(date +%F)            # sustitución de comando: $(...) captura la salida
IN="/data/raw/\${DATE}.csv"

if [[ ! -f "$IN" ]]; then    # test: ¿existe la entrada?
  echo "no input for $DATE" >&2
  exit 1                     # distinto de cero → el scheduler ve un fallo
fi

python /opt/etl/load.py --input "$IN"
echo "loaded $IN"
\`\`\`

\`set -euo pipefail\` es la única línea que separa un script de datos robusto de uno que continúa en
silencio tras un paso fallido y carga basura.

# cron: córrelo en un horario

\`cron\` ejecuta comandos según un horario — el scheduler batch original (Airflow y compañía lo
generalizan). Editas tu tabla con \`crontab -e\`; cada línea son cinco campos de tiempo más un comando:

\`\`\`
┌ minuto (0–59)
│ ┌ hora (0–23)
│ │ ┌ día del mes (1–31)
│ │ │ ┌ mes (1–12)
│ │ │ │ ┌ día de la semana (0–6, Dom=0)
│ │ │ │ │
0 2 * * *   /opt/etl/run.sh >> /var/log/etl.log 2>&1
\`\`\`

\`0 2 * * *\` = "a las 02:00 todos los días." \`*/15 * * * *\` = "cada 15 minutos."
\`0 9 * * 1\` = "09:00 cada lunes." Usa siempre **rutas absolutas** y redirige la salida a un log —
cron corre con un entorno desnudo y sin terminal, así que los dos bugs clásicos de cron son
"directorio de trabajo equivocado" y "la salida desapareció."`,
      },
      {
        title: "Parsea un horario de cron y comprueba si dispara",
      },
      {
        title: "Implementa un matcher de minuto/hora de cron",
        prompt: `Escribe \`cron_fires(minute_field, hour_field, minute, hour)\` que devuelva
\`True\` si un job con esos dos campos de cron debería correr a la hora dada.

Soporta tres formas de campo de cron (para minuto y hora):

- \`"*"\` — coincide con cualquier valor.
- un entero simple como \`"30"\` — coincide con ese valor exacto.
- un paso \`"*/n"\` — coincide cuando \`value % n == 0\`.

Devuelve \`True\` solo si **ambos** campos, el de minuto y el de hora, coinciden.`,
        hints: [
          "Escribe un solo ayudante `matches(field, value)` y llámalo para minuto y hora.",
          "Ordena las comprobaciones: `field == '*'` → True; `field.startswith('*/')` → `value % int(field[2:]) == 0`; si no `int(field) == value`.",
          "Devuelve el AND de las dos coincidencias de campo.",
        ],
      },
      {
        question: "¿Por qué `set -euo pipefail` al inicio de un script de shell de ETL de datos es tan importante?",
        options: [
          "Hace que el script falle rápido: sale ante cualquier error de comando (-e), trata las variables sin definir como errores (-u), y falla un pipeline si cualquier etapa falla (pipefail) — así un paso roto detiene la ejecución en vez de cargar datos corruptos/parciales",
          "Hace que el script corra más rápido saltándose las comprobaciones de error",
          "Silencia toda la salida de error",
          "Reintenta automáticamente los comandos fallidos",
        ],
        explanation:
          "Por defecto bash sigue adelante tras un comando fallido y un pipeline reporta solo el estado de su ÚLTIMA etapa — una receta para enviar datos malos en silencio. `set -euo pipefail` convierte esos fallos silenciosos en salidas ruidosas y tempranas (código distinto de cero) que un scheduler detectará.",
      },
      {
        title: "Entorno, scripts y cron",
        cards: [
          { front: "Variable de entorno", back: "Un ajuste clave–valor heredado por un proceso. La forma estándar de pasar config y secretos (DB_URL, AWS_REGION) sin escribirlos a fuego en el código." },
          { front: "$PATH", back: "Lista de directorios separada por dos puntos que la shell recorre para encontrar un comando. 'command not found' normalmente significa que no está en tu PATH." },
          { front: "export VAR=value", back: "Fija una variable de entorno para la shell actual Y los procesos que lanza. Persístela añadiéndola a ~/.bashrc." },
          { front: "Shebang (#!/usr/bin/env bash)", back: "Primera línea de un script que le dice al SO con qué intérprete correrlo. Además `chmod +x` hace el archivo directamente ejecutable." },
          { front: "set -euo pipefail", back: "Bash de fallo rápido: sale ante un error (-e), error ante vars sin definir (-u), y falla un pipeline si cualquier etapa falla (pipefail). El one-liner del script robusto." },
          { front: "Los cinco campos de cron", back: "minuto hora día-del-mes mes día-de-la-semana. `0 2 * * *` = 02:00 diario; `*/15 * * * *` = cada 15 min; `0 9 * * 1` = 09:00 los lunes." },
          { front: "Dos bugs clásicos de cron", back: "Directorio de trabajo equivocado (usa rutas absolutas) y salida perdida (redirige con `>> log 2>&1`). Cron corre con un entorno desnudo y sin terminal." },
        ],
      },
    ],
  },
};
