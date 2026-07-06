import type { Module } from "../../../types/lesson";

// Linux & the command line — the environment every data job actually runs in.
// Concepts are taught the way you'll meet them: peeking at CSV/log files, wrangling
// columns with pipes, and scheduling batch jobs. Where a shell tool has a clean
// Python analogue, a runnable simulation lets you SEE the mechanic (globbing, the
// grep|sort|uniq pipeline, exit codes) without leaving the browser.
export const linux: Module = {
  id: "linux",
  title: "Linux & the Command Line",
  blurb: "Shell, filesystem, pipes & text wrangling, permissions, processes, cron.",
  track: "Foundations & Tooling",
  level: "Beginner",
  icon: "🐧",
  status: "deep",
  lessons: [
    {
      id: "linux-shell-filesystem",
      title: "The Shell & the Filesystem",
      summary: "What the shell is, and how Linux lays out its one big tree.",
      minutes: 12,
      blocks: [
        {
          kind: "prose",
          markdown: `# Why the command line

Almost every data tool ultimately runs on Linux: your Airflow workers, your Spark
cluster, the box your database lives on, the CI runner that ships your dbt models.
You will \`ssh\` into a server that has **no GUI** and be expected to find a file,
tail a log, and fix a job. The shell is that skill.

The **shell** (usually \`bash\` or \`zsh\`) is a program that reads a line, runs it,
and prints the result — a REPL for your operating system. You type a **command**,
optional **flags** (\`-l\`, \`--help\`), and **arguments**:

\`\`\`bash
ls -l /var/log        # command=ls, flag=-l (long), argument=/var/log
\`\`\`

# One tree, rooted at /

Windows has \`C:\\\`, \`D:\\\`. Linux has **one** tree starting at \`/\` (root). Everything
— disks, USB drives, even devices — hangs somewhere off it.

\`\`\`
/                 the root of everything
├── home/ana/     your stuff (a.k.a. ~)
├── etc/          system config (text files!)
├── var/log/      logs — where you'll live during incidents
├── tmp/          scratch space, wiped on reboot
├── usr/bin/      installed programs (ls, grep, python...)
└── mnt/ , /data  mounted disks — often where big datasets sit
\`\`\`

## Paths: absolute vs relative

- **Absolute** starts at \`/\`: \`/home/ana/orders.csv\` — unambiguous, works anywhere.
- **Relative** starts from your **current directory**: \`data/orders.csv\`.
- Shorthands: \`.\` = here, \`..\` = one level up, \`~\` = your home, \`-\` = previous dir.

Three commands orient you anywhere:

\`\`\`bash
pwd           # "print working directory" — where am I?
ls            # what's here?
cd /var/log   # change directory (cd with no args → home)
\`\`\`

Rule of thumb: use **absolute paths in scripts and cron** (a job's working directory
is rarely what you assume), and relative paths when poking around interactively.`,
        },
        {
          kind: "quiz",
          question: "A scheduled job runs `python etl.py` and reads `data/input.csv` (a relative path). It works when you run it by hand but fails under cron with 'file not found'. Why?",
          options: [
            {
              text: "cron starts the job in a different working directory (usually the user's home), so the relative path resolves somewhere else — use an absolute path or `cd` first",
              correct: true,
            },
            { text: "cron cannot read CSV files" },
            { text: "The file was deleted between runs" },
            { text: "Relative paths are not allowed in Python" },
          ],
          explanation:
            "Relative paths depend on the current working directory, and cron's is not your interactive shell's. This is one of the most common 'works on my machine' bugs in data pipelines — absolute paths in anything automated.",
        },
        {
          kind: "quiz",
          question: "You're in `/home/ana/projects/etl`. Which command moves you to `/home/ana`?",
          options: [
            { text: "`cd ..` — one level up", correct: true },
            { text: "`cd .` — stays put (current directory)" },
            { text: "`cd /` — goes to root, not home" },
            { text: "`cd ~/projects` — goes deeper, not up" },
          ],
          explanation:
            "`..` is the parent directory. `~` would also work here (`cd ~` or just `cd`) since `/home/ana` is Ana's home — but `.` means 'the current directory' and goes nowhere.",
        },
        {
          kind: "flashcards",
          title: "Orientation & paths",
          cards: [
            { front: "The shell", back: "A REPL for the OS: reads a command + flags + arguments, runs it, prints output. Usually bash or zsh." },
            { front: "/ (root)", back: "The single top of the Linux filesystem tree. Every disk and device hangs off it — there are no drive letters." },
            { front: "Absolute vs relative path", back: "Absolute starts at `/` and works from anywhere. Relative starts from the current working directory (pwd). Automate with absolute paths." },
            { front: ". / .. / ~ / -", back: "`.` = current dir, `..` = parent dir, `~` = your home, `-` = the previous directory you were in." },
            { front: "pwd / ls / cd", back: "Where am I / what's here / go there. `cd` with no argument returns to your home directory." },
            { front: "/var/log", back: "Where system and app logs live. Your first stop during an incident (with tail/grep)." },
          ],
        },
      ],
    },
    {
      id: "linux-files-directories",
      title: "Working with Files & Directories",
      summary: "Create, copy, move, delete, and find — plus globbing patterns.",
      minutes: 13,
      blocks: [
        {
          kind: "prose",
          markdown: `# The verbs of the filesystem

\`\`\`bash
mkdir -p data/2026/01     # make dirs; -p creates parents as needed
touch notes.md            # create an empty file (or bump its timestamp)
cp orders.csv backup.csv  # copy; cp -r for a whole directory
mv old.csv archive/       # move OR rename (same command)
rm temp.csv               # delete a file
rm -r build/              # delete a directory + contents (no undo!)
\`\`\`

> **\`rm\` is forever.** There is no Recycle Bin. \`rm -rf /\` is the internet's most
> infamous footgun. Double-check the path before you hit Enter, especially with
> \`-r\` (recursive) and \`-f\` (force). Prefer \`rm -i\` (interactive) when unsure.

# Globbing: patterns the shell expands for you

Before a command even runs, the **shell** expands wildcards into matching filenames:

| Pattern | Matches |
|---|---|
| \`*\` | any run of characters (\`*.csv\` → all CSVs) |
| \`?\` | exactly one character (\`log?.txt\` → \`log1.txt\`) |
| \`[0-9]\` | one char in a set/range (\`data[12].csv\`) |
| \`**\` | any depth, with \`globstar\` (\`**/*.parquet\`) |

\`\`\`bash
ls data/2026/*.csv          # every CSV in that folder
rm -r tmp_*/                # every dir starting with tmp_
cp reports/*.pdf ~/inbox/   # the shell hands cp the expanded list
\`\`\`

Globbing is **not** regex — it's simpler and matches whole filenames. Data engineers
lean on it constantly: "process every partition file", "clean up yesterday's temp
dirs". Get it wrong with \`rm\` and you delete the wrong set — so \`ls\` the pattern
first, then swap \`ls\` for \`rm\` once you trust it.

# Finding files: \`find\`

\`\`\`bash
find /data -name "*.parquet"          # by name, recursively
find . -type f -size +100M            # files bigger than 100 MB
find /var/log -name "*.log" -mtime -1 # logs modified in the last day
find . -name "*.tmp" -delete          # find + act (careful!)
\`\`\`

\`find\` walks the tree and filters by name, type, size, or age — the tool you reach
for when "somewhere under /data there's a huge file eating the disk."`,
        },
        {
          kind: "runnable",
          title: "See how globbing expands (Python's fnmatch = the same rules)",
          code: `import fnmatch

files = [
    "orders_2026_01.csv", "orders_2026_02.csv", "orders_2025_12.csv",
    "customers.csv", "notes.md", "log1.txt", "log2.txt", "logX.txt",
]

def glob(pattern):
    return [f for f in files if fnmatch.fnmatch(f, pattern)]

print("*.csv        ->", glob("*.csv"))
print("orders_2026_*->", glob("orders_2026_*"))
print("log?.txt     ->", glob("log?.txt"))     # ? = exactly one char
print("log[0-9].txt ->", glob("log[0-9].txt")) # a digit, so logX.txt is OUT

# This is exactly what your shell does BEFORE running a command:
#   rm orders_2026_*      ->  rm orders_2026_01.csv orders_2026_02.csv
# The command never sees the '*', only the expanded file list.`,
        },
        {
          kind: "challenge",
          title: "Implement shell-style globbing",
          prompt: `The shell expands \`*\` (any run of characters, including empty) before
running a command. Write \`match_glob(names, pattern)\` that returns the sublist of
\`names\` matching a pattern where \`*\` is the only wildcard.

- \`*\` matches any sequence of characters (including none).
- Every other character must match literally.
- The **whole** name must match (like a filename, not a substring search).
- Preserve the input order.

Example: \`"*.csv"\` matches \`"a.csv"\` and \`".csv"\` but not \`"a.csvx"\`.`,
          starterCode: `def match_glob(names, pattern):
    pass`,
          tests: [
            {
              name: "star extension",
              assertion: `assert match_glob(["a.csv", "b.txt", "c.csv"], "*.csv") == ["a.csv", "c.csv"]`,
            },
            {
              name: "star matches empty",
              assertion: `assert match_glob([".csv", "x.csv"], "*.csv") == [".csv", "x.csv"]`,
            },
            {
              name: "prefix pattern",
              assertion: `assert match_glob(["orders_1", "orders_2", "items_1"], "orders_*") == ["orders_1", "orders_2"]`,
            },
            {
              name: "must match whole name",
              assertion: `assert match_glob(["a.csv", "a.csvx"], "*.csv") == ["a.csv"]`,
            },
            {
              name: "multiple stars",
              assertion: `assert match_glob(["log_2026_01.txt", "log_x.csv"], "log_*.txt") == ["log_2026_01.txt"]`,
              hidden: true,
            },
          ],
          hints: [
            "Python's `fnmatch.translate` turns a glob into a regex — but implement it yourself: convert the pattern to a regex where `*` becomes `.*` and other chars are escaped.",
            "Anchor the regex with `^...$` (via `re.fullmatch`) so the WHOLE name must match, not a substring.",
            "Escape literal characters with `re.escape` so a `.` in the pattern doesn't act as a regex 'any char'.",
          ],
          solution: `import re

def match_glob(names, pattern):
    regex = "".join(".*" if ch == "*" else re.escape(ch) for ch in pattern)
    return [n for n in names if re.fullmatch(regex, n)]`,
          xp: 90,
        },
        {
          kind: "quiz",
          question: "You run `ls *.log` in a folder with no `.log` files. In bash (default settings) what typically happens?",
          options: [
            {
              text: "The glob doesn't match, so the literal `*.log` is passed to ls, which reports it can't find a file named '*.log'",
              correct: true,
            },
            { text: "ls lists every file in the directory" },
            { text: "The shell throws a syntax error" },
            { text: "ls silently lists nothing" },
          ],
          explanation:
            "By default bash leaves an unmatched glob as the literal string (a classic surprise). Tools like `find`, or bash's `nullglob`/`shopt`, avoid this. It's why scripts often guard with `if ls *.log 2>/dev/null` or use `find` instead.",
        },
      ],
    },
    {
      id: "linux-viewing-searching",
      title: "Viewing & Searching Text",
      summary: "cat, less, head/tail, grep, wc — peek at data without loading it.",
      minutes: 13,
      blocks: [
        {
          kind: "prose",
          markdown: `# Look before you load

A 3 GB CSV will crash your laptop if you open it in a spreadsheet — but the shell
inspects it in milliseconds without loading the whole thing. This is a daily data
reflex: **peek at the file first.**

\`\`\`bash
head orders.csv          # first 10 lines (the header + a sample)
head -n 3 orders.csv     # first 3 lines
tail orders.csv          # last 10 lines
tail -n 100 app.log      # last 100 log lines
tail -f app.log          # FOLLOW: stream new lines live (Ctrl-C to stop)
wc -l orders.csv         # count lines (rows!) without opening it
cat small.csv            # dump a whole (small) file to the screen
less big.csv             # page through interactively (q to quit, / to search)
\`\`\`

- \`head\`/\`tail\` — the header and the tail of a file. \`tail -f\` is how you watch a
  job's log in real time during a deploy or an incident.
- \`wc -l\` — "how many rows does this file have?" instantly.
- \`less\` — a pager for files too big for the screen; never \`cat\` a 3 GB file.

# grep: find the needle

\`grep\` prints lines matching a pattern — the single most-used text tool on Linux:

\`\`\`bash
grep "ERROR" app.log              # lines containing ERROR
grep -i "error" app.log           # -i = case-insensitive
grep -c "ERROR" app.log           # -c = count matching lines
grep -n "timeout" app.log         # -n = show line numbers
grep -v "DEBUG" app.log           # -v = INVERT: lines WITHOUT DEBUG
grep -r "api_key" .               # -r = recurse through a directory tree
grep -E "WARN|ERROR" app.log      # -E = extended regex (alternation)
\`\`\`

The pattern is a **regular expression**, so \`grep "^2026-01"\` finds lines starting
with that date, \`grep "[0-9]\\{3\\}"\` finds three digits, and so on. During an
incident, \`grep -i error /var/log/app.log | tail\` is often your first move.`,
        },
        {
          kind: "runnable",
          title: "head / tail / grep -c, in Python",
          code: `log = """2026-01-05 INFO  start job=etl_orders
2026-01-05 INFO  read s3://lake/orders/
2026-01-05 WARN  null customer_id on 4 rows
2026-01-05 ERROR timeout calling pricing-api
2026-01-05 INFO  retry 1
2026-01-05 ERROR timeout calling pricing-api
2026-01-05 INFO  wrote 9812 rows""".splitlines()

# head -n 2
print("head -n 2:")
for line in log[:2]:
    print(" ", line)

# tail -n 2
print("tail -n 2:")
for line in log[-2:]:
    print(" ", line)

# grep -c ERROR   (case-sensitive count of matching LINES)
errors = [l for l in log if "ERROR" in l]
print("grep -c ERROR:", len(errors))

# grep -i warn | wc -l
print("grep -i warn | wc -l:", sum(1 for l in log if "warn" in l.lower()))

# grep -v INFO  (invert: lines WITHOUT INFO)
print("grep -v INFO:")
for l in log:
    if "INFO" not in l:
        print(" ", l)`,
        },
        {
          kind: "quiz",
          question: "A job is running right now and you want to watch its log update live as it writes. Which command?",
          options: [
            { text: "`tail -f app.log` — follow the file, printing new lines as they're appended", correct: true },
            { text: "`cat app.log` — prints the current contents once and exits" },
            { text: "`head app.log` — only ever shows the first 10 lines" },
            { text: "`wc -l app.log` — only counts lines" },
          ],
          explanation:
            "`tail -f` (follow) keeps the file open and streams appended lines — the standard way to watch a deploy or a running pipeline. Add `| grep -i error` to watch only for trouble.",
        },
        {
          kind: "quiz",
          question: "You want the number of data rows in `orders.csv` (which has a header row). What's the catch with `wc -l orders.csv`?",
          options: [
            {
              text: "`wc -l` counts every line including the header, so the data-row count is the result minus 1 (and it miscounts if a field contains embedded newlines)",
              correct: true,
            },
            { text: "`wc -l` counts words, not lines" },
            { text: "`wc -l` ignores the header automatically" },
            { text: "`wc -l` only works on .txt files" },
          ],
          explanation:
            "`wc -l` counts newline characters — fast and usually right, but it includes the header line, and a properly-quoted CSV field can legally contain a newline (so for messy CSVs, a real parser is safer). Great for a quick sanity check, not for billing.",
        },
        {
          kind: "flashcards",
          title: "Viewing & searching tools",
          cards: [
            { front: "head / tail", back: "First / last N lines of a file (default 10; -n to choose). `tail -f` follows a file live — the incident-watching command." },
            { front: "wc -l", back: "Count lines. On a CSV that's ≈ rows (minus the header). Instant row count without opening the file." },
            { front: "less", back: "A pager: scroll a huge file a screen at a time (q to quit, / to search, G to jump to the end). Never `cat` a multi-GB file." },
            { front: "grep PATTERN file", back: "Print lines matching a regex. The workhorse of log triage." },
            { front: "grep -i / -c / -n / -v / -r", back: "case-Insensitive / Count matches / show line-Numbers / inVert (non-matching) / Recurse a directory tree." },
            { front: "grep -r \"api_key\" .", back: "Recursively search a tree for a string — e.g. hunting an accidentally-committed secret before you push." },
          ],
        },
      ],
    },
    {
      id: "linux-pipes-redirection",
      title: "Pipes, Redirection & the Unix Philosophy",
      summary: "Compose small tools into a data pipeline with | and >.",
      minutes: 15,
      blocks: [
        {
          kind: "prose",
          markdown: `# Three streams

Every command has three channels:

- **stdin** (0) — input coming in.
- **stdout** (1) — normal output going out.
- **stderr** (2) — error/diagnostic output, kept separate on purpose.

You wire these up with **redirection** and **pipes**:

\`\`\`bash
command > out.txt      # stdout INTO a file (overwrite)
command >> out.txt     # stdout APPENDED to a file
command < in.txt       # feed a file as stdin
command 2> err.txt     # stderr into a file
command > out 2>&1     # stdout to a file, and stderr to the same place
command 2>/dev/null    # discard errors (send them to the black hole)
\`\`\`

Keeping stderr separate is why \`myjob > data.csv\` gives you clean data even while
progress messages still print to your terminal — the messages went to stderr, the
data to stdout.

# The pipe: | — the heart of the Unix philosophy

A **pipe** connects one command's stdout to the next command's stdin, so data
flows through a chain of tiny, single-purpose tools:

> **Unix philosophy:** write programs that do one thing well, and that work
> together through text streams. You don't need a monolith — you *compose* one.

\`\`\`bash
# "Top 5 IPs by request count in the access log" — an entire analytics query,
# built from five tools that each do one thing:
cat access.log \\
  | grep " 500 " \\        # only server errors
  | cut -d' ' -f1 \\       # field 1 = the IP (space-delimited)
  | sort \\                # group identical IPs together...
  | uniq -c \\             # ...and count each run  ->  "  17 10.0.0.4"
  | sort -rn \\            # numeric, reverse: biggest first
  | head -5               # top 5
\`\`\`

That \`sort | uniq -c\` pair is the shell's \`GROUP BY ... COUNT(*)\` — you built the
same aggregation in SQL and pandas; here it's five processes streaming text to each
other. This is genuinely how engineers explore logs and one-off datasets before
reaching for a heavier tool.`,
        },
        {
          kind: "runnable",
          title: "Reproduce a grep | cut | sort | uniq -c | sort -rn pipeline",
          code: `access = """10.0.0.4 GET /home 200
10.0.0.7 GET /api 500
10.0.0.4 GET /api 500
10.0.0.9 GET /home 200
10.0.0.4 GET /cart 500
10.0.0.7 GET /api 500
10.0.0.4 GET /api 200""".splitlines()

# grep " 500"  ->  keep only server errors
step1 = [line for line in access if line.endswith("500")]

# cut -d' ' -f1  ->  first space-delimited field (the IP)
step2 = [line.split(" ")[0] for line in step1]

# sort | uniq -c  ->  count identical values (a GROUP BY COUNT(*))
counts = {}
for ip in step2:
    counts[ip] = counts.get(ip, 0) + 1

# sort -rn | head -3  ->  biggest first, top 3
top = sorted(counts.items(), key=lambda kv: kv[1], reverse=True)[:3]

print("Top offenders (5xx):")
for ip, n in top:
    print(f"  {n:>3}  {ip}")

# Each shell tool = one line of Python here. The POINT is that on a real box you
# type them as a one-liner and get the answer in seconds, on any size of file.`,
        },
        {
          kind: "challenge",
          title: "Implement a word-count pipeline",
          prompt: `Reproduce the classic \`tr -s ' ' '\\n' | sort | uniq -c | sort -rn\` word
frequency pipeline. Write \`top_words(text, n)\` that returns the \`n\` most frequent
words as \`(word, count)\` tuples, most frequent first.

- Split on **whitespace** into words.
- Lowercase each word and strip surrounding punctuation \`.,!?;:\` (so \`"Data,"\`
  and \`"data"\` are the same word). Ignore empty tokens.
- Sort by count descending; break ties **alphabetically** (so results are
  deterministic, like piping through \`sort\` first).`,
          starterCode: `def top_words(text, n):
    pass`,
          tests: [
            {
              name: "basic frequency",
              assertion: `assert top_words("the cat the dog the bird", 2) == [("the", 3), ("bird", 1)]`,
            },
            {
              name: "punctuation + case folded together",
              assertion: `assert top_words("Data, data. DATA! logs logs", 2) == [("data", 3), ("logs", 2)]`,
            },
            {
              name: "tie broken alphabetically",
              assertion: `assert top_words("b a c a b c", 3) == [("a", 2), ("b", 2), ("c", 2)]`,
            },
            {
              name: "n larger than vocabulary",
              assertion: `assert top_words("one two two", 10) == [("two", 2), ("one", 1)]`,
              hidden: true,
            },
          ],
          hints: [
            "`text.split()` with no argument splits on any whitespace and drops empty tokens.",
            "`word.strip('.,!?;:').lower()` normalizes a token; skip it if it becomes empty.",
            "Sort with a key of `(-count, word)` so counts go descending but ties fall back to alphabetical order.",
          ],
          solution: `def top_words(text, n):
    counts = {}
    for raw in text.split():
        word = raw.strip(".,!?;:").lower()
        if not word:
            continue
        counts[word] = counts.get(word, 0) + 1
    ranked = sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))
    return ranked[:n]`,
          xp: 100,
        },
        {
          kind: "quiz",
          question: "Why redirect with `myjob > data.csv 2> errors.log` instead of just `myjob > data.csv`?",
          options: [
            {
              text: "It sends clean data to data.csv (stdout) while capturing diagnostics/errors separately in errors.log (stderr) — so progress messages never pollute your data file",
              correct: true,
            },
            { text: "`2>` makes the job run twice as fast" },
            { text: "`2>` is required whenever you use `>`" },
            { text: "It merges errors into the data file" },
          ],
          explanation:
            "stdout and stderr are separate streams precisely so you can split 'the data' from 'the chatter'. Merge them with `2>&1` when you want one combined log; keep them apart when stdout IS your dataset.",
        },
        {
          kind: "quiz",
          question: "In `sort | uniq -c`, why is the `sort` required before `uniq`?",
          options: [
            {
              text: "`uniq` only collapses ADJACENT duplicate lines, so identical values must be brought together first — sorting groups them, then uniq -c counts each run",
              correct: true,
            },
            { text: "`uniq` sorts internally, so `sort` is redundant" },
            { text: "`sort` removes duplicates and `uniq` re-adds them" },
            { text: "It's only for readability; order doesn't matter to uniq" },
          ],
          explanation:
            "`uniq` is a streaming tool with no memory of what it saw earlier — it only compares each line to the previous one. `sort` clusters equal lines so `uniq -c` can count each group. That pairing is the shell's GROUP BY.",
        },
      ],
    },
    {
      id: "linux-data-wrangling",
      title: "Data Wrangling on the CLI",
      summary: "cut, sort, uniq, tr, sed, awk — a lightweight ETL toolkit.",
      minutes: 14,
      blocks: [
        {
          kind: "prose",
          markdown: `# The CLI is a data tool

Before pandas, before Spark, there was \`awk\`. For a quick "what's the total revenue
per region in this 2 GB CSV?" you often don't need a notebook — a one-liner streams
the file and answers in seconds, using constant memory.

## Column tools

\`\`\`bash
cut -d',' -f1,3 orders.csv        # fields 1 and 3, comma-delimited
sort -t',' -k3 -n orders.csv      # sort by column 3, numeric
sort -u regions.txt               # sort + drop duplicates
uniq -c                           # count adjacent duplicate lines
tr 'a-z' 'A-Z'                    # translate/transform characters
tr -s ' '                         # squeeze repeated spaces into one
\`\`\`

## sed — stream editor (find/replace on a stream)

\`\`\`bash
sed 's/,/\\t/g' orders.csv         # replace every comma with a tab (CSV→TSV)
sed '1d' orders.csv               # delete line 1 (drop the header)
sed -n '2,5p' orders.csv          # print only lines 2–5
\`\`\`

## awk — the mini data language

\`awk\` splits each line into fields (\`$1\`, \`$2\`, …; \`$0\` is the whole line) and runs
your logic per row. It has variables, arithmetic, and associative arrays — a whole
GROUP BY in one expression:

\`\`\`bash
# Sum revenue (column 4) grouped by region (column 2):
awk -F',' 'NR>1 { rev[$2] += $4 } END { for (r in rev) print r, rev[r] }' orders.csv
\`\`\`

- \`-F','\` sets the field separator to a comma.
- \`NR>1\` skips the header (\`NR\` = current row number).
- \`rev[$2] += $4\` accumulates column 4 into a dict keyed by column 2.
- the \`END\` block prints the totals after the last row.

That's a full aggregation over an arbitrarily large file in **constant memory** —
the same group-by you wrote in SQL and pandas, expressed as a streaming one-liner.`,
        },
        {
          kind: "runnable",
          title: "An awk-style streaming GROUP BY in Python",
          code: `# orders.csv content (region is col 2, amount is col 4), header first:
rows = """order_id,region,customer,amount
1,US,ana,120.00
2,EU,bob,80.50
3,US,cara,50.00
4,APAC,dan,200.00
5,EU,eve,19.50
6,US,finn,30.00""".splitlines()

# awk -F',' 'NR>1 { rev[$2] += $4 }'  — accumulate col 4 keyed by col 2,
# one row at a time (streaming: we never hold the whole file as a table).
rev = {}
count = {}
for nr, line in enumerate(rows, start=1):
    if nr == 1:            # NR>1 skips the header
        continue
    fields = line.split(",")     # -F','
    region = fields[1]           # $2
    amount = float(fields[3])    # $4
    rev[region] = rev.get(region, 0.0) + amount
    count[region] = count.get(region, 0) + 1

# END { for (r in rev) print r, rev[r] }
print(f"{'region':<6} {'orders':>6} {'revenue':>10}")
for region in sorted(rev):
    print(f"{region:<6} {count[region]:>6} {rev[region]:>10.2f}")

# Constant memory: the accumulators are tiny even if the file is 2 GB.`,
        },
        {
          kind: "quiz",
          question: "Why can `awk` sum a 50 GB CSV on a laptop that can't fit it in pandas?",
          options: [
            {
              text: "awk streams one line at a time and only keeps the running totals (a small dict) in memory — it never materializes the whole file, unlike a DataFrame",
              correct: true,
            },
            { text: "awk compresses the file first" },
            { text: "awk is written in C, so memory isn't a concern" },
            { text: "awk automatically uses the GPU" },
          ],
          explanation:
            "Streaming aggregation keeps only the accumulator, so memory is O(distinct keys), not O(rows). That's the same reason a database can GROUP BY a table far bigger than RAM — and why CLI tools remain a data engineer's Swiss Army knife.",
        },
        {
          kind: "quiz",
          question: "You want to turn a comma-separated file into a tab-separated one. Which is the quickest correct move for a simple file?",
          options: [
            { text: "`sed 's/,/\\t/g' orders.csv > orders.tsv` — replace every comma with a tab across the stream", correct: true },
            { text: "`cut -d','` — cut only extracts fields, it can't replace the delimiter" },
            { text: "`grep ','` — grep filters lines, it doesn't transform them" },
            { text: "`wc -l` — that only counts lines" },
          ],
          explanation:
            "`sed 's/old/new/g'` is find-and-replace over a stream — perfect for a mechanical delimiter swap. (The honest caveat: if a field itself contains a comma inside quotes, a naive sed corrupts it — for messy CSVs use a real parser. For clean files, sed is instant.)",
        },
        {
          kind: "flashcards",
          title: "CLI wrangling toolkit",
          cards: [
            { front: "cut -d',' -f2", back: "Extract column 2 from a comma-delimited stream. The shell's column selector." },
            { front: "sort -t',' -k3 -n", back: "Sort by the 3rd comma-delimited field, numerically. Add -r for reverse, -u to also dedupe." },
            { front: "uniq -c", back: "Count runs of adjacent identical lines. Pair with `sort` first → the shell's GROUP BY COUNT(*)." },
            { front: "tr", back: "Translate/delete characters: `tr a-z A-Z` uppercases; `tr -s ' '` squeezes repeated spaces; `tr -d '\\r'` strips carriage returns." },
            { front: "sed 's/x/y/g'", back: "Stream editor: find/replace (g = every occurrence), delete lines (`sed '1d'`), or print a range (`sed -n '2,5p'`)." },
            { front: "awk -F',' '{ a[$2]+=$4 } END{...}'", back: "Per-row field processing with associative arrays — a streaming GROUP BY/aggregation over any-sized file in constant memory." },
            { front: "NR in awk", back: "The current record (row) number. `NR>1` is the idiom for 'skip the header row'." },
          ],
        },
      ],
    },
    {
      id: "linux-permissions",
      title: "Permissions, Users & Ownership",
      summary: "rwx, owner/group/other, chmod, chown — and why secrets are 600.",
      minutes: 12,
      blocks: [
        {
          kind: "prose",
          markdown: `# Who can do what

Linux is multi-user. Every file has an **owner**, a **group**, and a set of
permissions for three classes of people:

\`\`\`
-rw-r--r--  1  ana  data  4096  Jan 5  orders.csv
│└┬┘└┬┘└┬┘     └┬┘  └─┬┘
│ │  │  │       │    group name
│ │  │  │       owner name
│ │  │  └── other:  r--   (everyone else: read only)
│ │  └───── group:  r--   (the 'data' group: read only)
│ └──────── owner:  rw-   (ana: read + write)
└────────── type:   -     (- = file, d = directory, l = symlink)
\`\`\`

Three permission bits, three times over:

| Bit | On a file | On a directory |
|---|---|---|
| **r** (4) | read contents | list entries |
| **w** (2) | modify contents | create/delete entries inside |
| **x** (1) | execute as a program | enter/traverse (\`cd\` into) it |

# chmod: change permissions

Two notations, same result:

\`\`\`bash
chmod u+x deploy.sh        # symbolic: add eXecute for the User(owner)
chmod go-w report.csv      # remove Write from Group and Other
chmod 640 secret.env       # numeric: rw- r-- ---  (6=rw,4=r,0=none)
\`\`\`

Numeric mode adds the bits: **r=4, w=2, x=1**. So \`7 = rwx\`, \`6 = rw-\`, \`5 = r-x\`,
\`4 = r--\`. Read \`640\` as owner=6(rw), group=4(r), other=0(none).

# chown: change owner/group

\`\`\`bash
chown ana:data orders.csv    # set owner=ana, group=data (usually needs sudo)
\`\`\`

## Why this matters for data

- A script won't run until it's executable: \`chmod +x run_etl.sh\`.
- **Secrets must be locked down.** SSH keys and credential files should be
  \`chmod 600\` (\`rw-------\`): only you can read them. Many tools *refuse to start*
  if a key is group/world-readable — a deliberate safety check.
- Shared data directories use group permissions so a team can collaborate without
  making files world-writable.`,
        },
        {
          kind: "runnable",
          title: "Decode & build chmod modes",
          code: `def to_symbolic(mode):
    """640 -> '-rw-r-----' (leading '-' = regular file)."""
    bits = ["-"]  # file type
    for digit in f"{mode:03d}":
        n = int(digit)
        bits.append("r" if n & 4 else "-")
        bits.append("w" if n & 2 else "-")
        bits.append("x" if n & 1 else "-")
    return "".join(bits)

for mode in (644, 600, 640, 755, 777):
    print(f"chmod {mode}  ->  {to_symbolic(mode)}")

print()
# The security-critical ones for a data engineer:
print("SSH key / .env secret should be 600:", to_symbolic(600), "(only owner reads)")
print("A shared script needs execute (755): ", to_symbolic(755))
print("777 (world-writable) is almost always a mistake:", to_symbolic(777))`,
        },
        {
          kind: "quiz",
          question: "`chmod 600 id_rsa` sets which permissions, and why is it the standard for a private SSH key?",
          options: [
            {
              text: "rw------- : only the owner can read/write it. SSH refuses to use a key that others can read, because a world-readable private key is a credential leak",
              correct: true,
            },
            { text: "rwxrwxrwx : everyone gets full access, which is convenient" },
            { text: "r--r--r-- : read-only for everyone, which is safe enough" },
            { text: "It makes the key executable so ssh can run it" },
          ],
          explanation:
            "6=rw for the owner, 0=nothing for group and others. A private key readable by anyone else is compromised, so OpenSSH enforces strict permissions and errors out otherwise. Same logic applies to `.env` and cloud-credential files.",
        },
        {
          kind: "quiz",
          question: "A teammate can't `cd` into `/data/reports` even though the files inside are readable. Which permission is likely missing on the DIRECTORY?",
          options: [
            {
              text: "execute (x) on the directory — on a directory, x means 'may traverse/enter it'; without it you can't cd in or reach files by path",
              correct: true,
            },
            { text: "read (r) on each file — but the files are already readable" },
            { text: "write (w) on the directory — needed only to create/delete entries" },
            { text: "Nothing; directories don't use permissions" },
          ],
          explanation:
            "Directory permissions reinterpret the bits: r = list names, w = add/remove entries, x = traverse into it. You need x to `cd` or resolve a path through the directory, even if the target files are readable.",
        },
        {
          kind: "flashcards",
          title: "Permissions vocabulary",
          cards: [
            { front: "r / w / x on a file", back: "read contents / modify contents / execute as a program. Numeric values 4 / 2 / 1." },
            { front: "r / w / x on a directory", back: "list entries / create-delete entries / traverse (cd into, resolve paths through). x is needed even just to reach files inside." },
            { front: "owner / group / other", back: "The three permission classes. `-rw-r-----` = owner rw, group r, other none. Order is always owner, group, other." },
            { front: "chmod numeric (e.g. 640)", back: "Sum the bits per class: r4+w2+x1. 6=rw, 5=r-x, 4=r--, 7=rwx. 640 → owner rw, group r, other none." },
            { front: "chmod +x script.sh", back: "Add the execute bit so the file can be run as a program. A shell script won't run without it." },
            { front: "600 for secrets", back: "rw------- : only the owner reads/writes. The required mode for SSH private keys and credential files — tools reject looser perms." },
            { front: "chown user:group", back: "Change a file's owner and group (usually needs sudo). Used to hand files to the right service account or shared team group." },
          ],
        },
      ],
    },
    {
      id: "linux-processes",
      title: "Processes, Jobs & Monitoring",
      summary: "ps, top, kill, background jobs, exit codes, disk usage.",
      minutes: 13,
      blocks: [
        {
          kind: "prose",
          markdown: `# A program running is a process

\`\`\`bash
ps aux                     # every process: user, PID, %CPU, %MEM, command
ps aux | grep python       # find your python jobs (and their PIDs)
top       (or  htop)       # live, sorted process monitor (q to quit)
kill 4823                  # ask process 4823 to stop (SIGTERM, graceful)
kill -9 4823               # force-kill (SIGKILL) — last resort, no cleanup
\`\`\`

Each process has a **PID** (process id). \`kill\` sends it a **signal**: \`SIGTERM\`
(the default) politely asks it to shut down and clean up; \`SIGKILL\` (\`-9\`) is the
sledgehammer that can't be caught — use it only when a job is truly stuck, because
it skips cleanup (half-written files, held locks).

# Background & long-running jobs

\`\`\`bash
python train.py &          # run in the background; you get the shell back
jobs                       # list background jobs of this shell
fg %1                      # bring job 1 back to the foreground
nohup python etl.py &      # keep running even after you log out
\`\`\`

For anything serious, \`nohup ... &\`, \`tmux\`/\`screen\`, or a real scheduler keeps a
job alive after your SSH session closes — otherwise hanging up the terminal kills
its children.

# Exit codes: how the shell knows success

Every command returns a numeric **exit code**: **0 = success**, non-zero = failure.
It's invisible until you look, but it's the backbone of automation:

\`\`\`bash
python etl.py
echo $?                    # print the exit code of the last command
python etl.py && echo OK   # run echo ONLY if etl.py succeeded (exit 0)
python etl.py || alert.sh  # run alert ONLY if it FAILED (non-zero)
\`\`\`

Airflow, CI, cron, Make — they all decide "did this step pass?" by the exit code.
A pipeline that always exits 0 even on failure is a silent-data-loss machine.

# Disk & resources

\`\`\`bash
df -h                      # disk space per filesystem (human-readable)
du -sh /data/*             # size of each thing under /data (find the hog)
free -h                    # memory usage
\`\`\`

"The pipeline died overnight" is very often "the disk filled up" — \`df -h\` is the
first thing to check, then \`du -sh\` to find what ate it.`,
        },
        {
          kind: "runnable",
          title: "Exit codes drive a pipeline (&& / || logic)",
          code: `# Simulate steps that each return an exit code (0 = success).
def run(step, code):
    print(f"$ {step:<18} -> exit {code}")
    return code

def pipeline(codes):
    """Chained like:  extract && transform && load  (stop on first failure)."""
    for step, code in codes:
        if run(step, code) != 0:
            print(f"!! '{step}' failed (exit {code}); aborting, alerting on-call.")
            return code            # non-zero: the pipeline as a whole FAILED
    print("All steps exit 0 — pipeline succeeded.")
    return 0

print("Healthy run:")
rc = pipeline([("extract.py", 0), ("transform.py", 0), ("load.py", 0)])
print("pipeline exit code:", rc)

print("\\nBroken run (transform fails):")
rc = pipeline([("extract.py", 0), ("transform.py", 1), ("load.py", 0)])
print("pipeline exit code:", rc)

# 'load.py' never ran — exactly what  extract && transform && load  does in bash.
# Airflow/CI read this final code to mark the task green or red.`,
        },
        {
          kind: "quiz",
          question: "A colleague runs `kill -9` on every job that misbehaves. Why is defaulting to `-9` (SIGKILL) risky for a data job?",
          options: [
            {
              text: "SIGKILL can't be caught, so the process skips cleanup — it may leave half-written output files, uncommitted transactions, or stale locks. Plain `kill` (SIGTERM) lets it shut down gracefully first",
              correct: true,
            },
            { text: "SIGKILL is slower than SIGTERM" },
            { text: "SIGKILL only works as root" },
            { text: "There's no difference; -9 is just shorter to type" },
          ],
          explanation:
            "SIGTERM asks nicely and lets the process finish writes, flush buffers, and release locks; SIGKILL yanks the power. Reach for `-9` only when a graceful stop has already failed — otherwise you risk corrupt partial output.",
        },
        {
          kind: "quiz",
          question: "In `python etl.py && python publish.py`, when does `publish.py` run?",
          options: [
            { text: "Only if `etl.py` exits 0 (success) — `&&` chains on success", correct: true },
            { text: "Always, right after etl.py regardless of outcome" },
            { text: "Only if etl.py FAILS (non-zero exit)" },
            { text: "Never — `&&` is a syntax error between two commands" },
          ],
          explanation:
            "`A && B` runs B only if A succeeded (exit 0); `A || B` runs B only if A failed. This exit-code logic is how shell scripts, Makefiles, and CI stop a pipeline the moment a step breaks instead of publishing bad data.",
        },
        {
          kind: "flashcards",
          title: "Processes & monitoring",
          cards: [
            { front: "PID", back: "Process ID — the number that identifies a running process, used by kill and shown by ps/top." },
            { front: "ps aux | grep NAME", back: "Find running processes matching NAME (and their PIDs). The 'is my job still running / what's its PID' command." },
            { front: "top / htop", back: "Live, sorted view of processes by CPU/memory. Your dashboard when a box is overloaded (q to quit)." },
            { front: "SIGTERM vs SIGKILL (-9)", back: "SIGTERM (default kill) asks a process to shut down gracefully; SIGKILL (-9) force-kills it with no cleanup. Try SIGTERM first." },
            { front: "cmd &  /  nohup cmd &", back: "Run in the background (get your shell back). nohup keeps it alive after you log out — for long jobs over SSH." },
            { front: "$? (exit code)", back: "The last command's exit status: 0 = success, non-zero = failure. How cron/CI/Airflow decide pass or fail." },
            { front: "df -h / du -sh", back: "Free space per filesystem / size of each path. The first checks when 'the pipeline died overnight' (usually a full disk)." },
          ],
        },
      ],
    },
    {
      id: "linux-environment-scripting",
      title: "Environment, Scripting & Scheduling",
      summary: "Env vars, a bash script, and cron for batch jobs.",
      minutes: 15,
      blocks: [
        {
          kind: "prose",
          markdown: `# Environment variables

Every process inherits a set of key–value **environment variables** — the standard
way to pass configuration and (especially) **secrets** without hardcoding them:

\`\`\`bash
echo $HOME                       # a built-in var: your home directory
echo $PATH                       # where the shell searches for commands
export DB_URL="postgres://..."   # set a var for this shell + its children
export AWS_REGION=us-east-1
python etl.py                    # etl.py reads os.environ["DB_URL"]
\`\`\`

- \`$PATH\` is a colon-separated list of directories; when you type \`python\`, the
  shell searches \`$PATH\` in order for the first match. "command not found" almost
  always means the program isn't on your \`$PATH\`.
- Put persistent settings in \`~/.bashrc\` / \`~/.zshrc\` (run for every new shell).
- **Secrets go in env vars or a git-ignored \`.env\` file — never in code.** This is
  exactly the rule the data credentials in your pipelines follow.

# A shell script

A script is just commands in a file. Make it a real program with a **shebang** and
the execute bit:

\`\`\`bash
#!/usr/bin/env bash
set -euo pipefail            # fail fast: -e exit on error, -u error on unset var,
                            # pipefail = a pipeline fails if ANY stage fails

DATE=$(date +%F)            # command substitution: $(...) captures output
IN="/data/raw/\${DATE}.csv"

if [[ ! -f "$IN" ]]; then    # test: does the input exist?
  echo "no input for $DATE" >&2
  exit 1                     # non-zero → the scheduler sees a failure
fi

python /opt/etl/load.py --input "$IN"
echo "loaded $IN"
\`\`\`

\`set -euo pipefail\` is the one line that separates a robust data script from one
that silently continues after a failed step and loads garbage.

# cron: run it on a schedule

\`cron\` runs commands on a time schedule — the original batch scheduler (Airflow and
friends generalize it). You edit your table with \`crontab -e\`; each line is five
time fields plus a command:

\`\`\`
┌ minute (0–59)
│ ┌ hour (0–23)
│ │ ┌ day-of-month (1–31)
│ │ │ ┌ month (1–12)
│ │ │ │ ┌ day-of-week (0–6, Sun=0)
│ │ │ │ │
0 2 * * *   /opt/etl/run.sh >> /var/log/etl.log 2>&1
\`\`\`

\`0 2 * * *\` = "at 02:00 every day." \`*/15 * * * *\` = "every 15 minutes."
\`0 9 * * 1\` = "09:00 every Monday." Always use **absolute paths** and redirect
output to a log — cron runs with a bare environment and no terminal, so the two
classic cron bugs are "wrong working directory" and "output vanished."`,
        },
        {
          kind: "runnable",
          title: "Parse a cron schedule & check if it fires",
          code: `def field_matches(spec, value):
    """Handle  *  ,  N  ,  */step  ,  a,b,c  for one cron field."""
    if spec == "*":
        return True
    for part in spec.split(","):
        if part.startswith("*/"):
            if value % int(part[2:]) == 0:
                return True
        elif int(part) == value:
            return True
    return False

def fires(cron, minute, hour, dom, mon, dow):
    m, h, d, mo, w = cron.split()
    return (field_matches(m, minute) and field_matches(h, hour)
            and field_matches(d, dom) and field_matches(mo, mon)
            and field_matches(w, dow))

# "0 2 * * *"  = 02:00 daily
print("0 2 * * *  @ 02:00 ->", fires("0 2 * * *", 0, 2, 15, 6, 1))   # True
print("0 2 * * *  @ 03:00 ->", fires("0 2 * * *", 0, 3, 15, 6, 1))   # False

# "*/15 * * * *"  = every 15 minutes
for minute in (0, 15, 22, 30):
    print(f"*/15 * * * * @ :{minute:02d} ->", fires("*/15 * * * *", minute, 9, 1, 1, 3))

# "0 9 * * 1"  = 09:00 on Mondays (dow 1)
print("0 9 * * 1  Mon 09:00 ->", fires("0 9 * * 1", 0, 9, 4, 5, 1))   # True
print("0 9 * * 1  Tue 09:00 ->", fires("0 9 * * 1", 0, 9, 5, 5, 2))   # False`,
        },
        {
          kind: "challenge",
          title: "Implement a cron minute/hour matcher",
          prompt: `Write \`cron_fires(minute_field, hour_field, minute, hour)\` that returns
\`True\` if a job with those two cron fields should run at the given time.

Support three cron field forms (for both minute and hour):

- \`"*"\` — matches any value.
- a plain integer string like \`"30"\` — matches that exact value.
- a step \`"*/n"\` — matches when \`value % n == 0\`.

Return \`True\` only if **both** the minute field and the hour field match.`,
          starterCode: `def cron_fires(minute_field, hour_field, minute, hour):
    pass`,
          tests: [
            {
              name: "daily at 02:00",
              assertion: `assert cron_fires("0", "2", 0, 2) is True
assert cron_fires("0", "2", 0, 3) is False`,
            },
            {
              name: "every 15 minutes",
              assertion: `assert cron_fires("*/15", "*", 30, 9) is True
assert cron_fires("*/15", "*", 22, 9) is False`,
            },
            {
              name: "star matches anything",
              assertion: `assert cron_fires("*", "*", 47, 13) is True`,
            },
            {
              name: "both fields must match",
              assertion: `assert cron_fires("0", "*/6", 0, 12) is True
assert cron_fires("0", "*/6", 0, 13) is False`,
              hidden: true,
            },
          ],
          hints: [
            "Write one helper `matches(field, value)` and call it for minute and hour.",
            "Order the checks: `field == '*'` → True; `field.startswith('*/')` → `value % int(field[2:]) == 0`; else `int(field) == value`.",
            "Return the AND of the two field matches.",
          ],
          solution: `def cron_fires(minute_field, hour_field, minute, hour):
    def matches(field, value):
        if field == "*":
            return True
        if field.startswith("*/"):
            return value % int(field[2:]) == 0
        return int(field) == value
    return matches(minute_field, minute) and matches(hour_field, hour)`,
          xp: 100,
        },
        {
          kind: "quiz",
          question: "Why is `set -euo pipefail` at the top of a data ETL shell script such a big deal?",
          options: [
            {
              text: "It makes the script fail fast: exit on any command error (-e), treat unset variables as errors (-u), and fail a pipeline if any stage fails (pipefail) — so a broken step stops the run instead of loading corrupt/partial data",
              correct: true,
            },
            { text: "It makes the script run faster by skipping error checks" },
            { text: "It silences all error output" },
            { text: "It automatically retries failed commands" },
          ],
          explanation:
            "By default bash plows on after a failed command and a pipeline reports only its LAST stage's status — a recipe for silently shipping bad data. `set -euo pipefail` turns those silent failures into loud, early exits (non-zero code) that a scheduler will catch.",
        },
        {
          kind: "flashcards",
          title: "Environment, scripts & cron",
          cards: [
            { front: "Environment variable", back: "A key–value setting inherited by a process. The standard way to pass config and secrets (DB_URL, AWS_REGION) without hardcoding them." },
            { front: "$PATH", back: "Colon-separated list of directories the shell searches to find a command. 'command not found' usually means it's not on your PATH." },
            { front: "export VAR=value", back: "Set an environment variable for the current shell AND processes it launches. Persist it by adding to ~/.bashrc." },
            { front: "Shebang (#!/usr/bin/env bash)", back: "First line of a script that tells the OS which interpreter to run it with. Plus `chmod +x` makes the file directly executable." },
            { front: "set -euo pipefail", back: "Fail-fast bash: exit on error (-e), error on unset vars (-u), and fail a pipeline if any stage fails (pipefail). The robust-script one-liner." },
            { front: "cron five fields", back: "minute hour day-of-month month day-of-week. `0 2 * * *` = 02:00 daily; `*/15 * * * *` = every 15 min; `0 9 * * 1` = 09:00 Mondays." },
            { front: "Two classic cron bugs", back: "Wrong working directory (use absolute paths) and lost output (redirect with `>> log 2>&1`). Cron runs with a bare env and no terminal." },
          ],
        },
      ],
    },
  ],
};
