import type { Module } from "../../../types/lesson";

// Git & GitHub — version control as the collaboration substrate of every data team.
// Git's core is a DAG of commits, so we build that DAG in real Python and walk it
// (history, merge-base, moving branch pointers on reset) to demystify what commands
// actually do. Data-team concerns get their own lesson: never commit data/secrets,
// and CI (GitHub Actions) that runs dbt/pytest on every PR.
export const gitGithub: Module = {
  id: "git-github",
  title: "Git & GitHub",
  blurb: "Snapshots & the commit DAG, branching, rebase, PRs, undoing, CI for data.",
  track: "Foundations & Tooling",
  level: "Beginner",
  icon: "🌿",
  status: "deep",
  lessons: [
    {
      id: "git-mental-model",
      title: "Git's Mental Model",
      summary: "Snapshots (not diffs), the three areas, and the commit DAG.",
      minutes: 14,
      blocks: [
        {
          kind: "prose",
          markdown: `# Git stores snapshots, not changes

The single idea that makes Git click: a **commit is a snapshot of your whole
project** at a moment in time, plus a pointer to its parent commit(s). Git does
*not* store a list of edits — it stores full trees and is clever about not
duplicating unchanged files. "The diff" you see is *computed* between two snapshots,
not what's stored.

Each commit has:

- a **SHA** — a 40-hex-char id (a hash of its content); \`a1b2c3d…\`. Change anything
  and you get a different commit.
- one or more **parent** pointers (zero for the first commit, two for a merge).
- author, timestamp, and message.

Follow the parents backward and you have your entire **history** — a
**DAG** (directed acyclic graph) of commits.

# The three areas (where your changes live)

\`\`\`
 working directory   →   staging area (index)   →   repository (.git)
   (your edits)            (git add)                  (git commit)
\`\`\`

- **Working directory** — the actual files you edit.
- **Staging area / index** — the set of changes you've marked to go in the *next*
  commit (\`git add\`). This is Git's superpower: you compose a commit deliberately
  instead of dumping everything.
- **Repository** — the committed history in the hidden \`.git\` folder.

\`\`\`bash
# edit files...            (working directory changes)
git add analysis.py        # stage that one file (working → staging)
git commit -m "Add ..."    # snapshot the staged changes (staging → repo)
\`\`\`

A **branch** is just a lightweight, movable pointer to a commit. \`HEAD\` is a pointer
to "where you are" (usually to a branch). Committing moves the current branch pointer
forward to the new snapshot. Almost everything else in Git is moving these pointers
around — which is why building the graph yourself, below, makes the commands obvious.`,
        },
        {
          kind: "runnable",
          title: "Build a commit DAG and walk its history",
          code: `# A commit = id + parent + message. The graph is the history.
commits = {}
def commit(cid, parent, message):
    commits[cid] = {"parent": parent, "message": message}

commit("c1", None, "init project")          # first commit: no parent
commit("c2", "c1", "add ingest.py")
commit("c3", "c2", "add transform.py")
commit("c4", "c3", "fix null handling")     # main's tip

# A branch is just a pointer to a commit id.
branches = {"main": "c4"}
HEAD = "main"

def log(branch):
    """git log: walk parent pointers from the branch tip back to the root."""
    cid = branches[branch]
    while cid is not None:
        c = commits[cid]
        print(f"  {cid}  {c['message']}")
        cid = c["parent"]

print(f"HEAD -> {HEAD} -> {branches[HEAD]}")
print("git log (newest first):")
log("main")

# 'git commit' just appends a child and moves the branch pointer forward:
commit("c5", branches["main"], "add tests")
branches["main"] = "c5"
print("\\nafter one more commit, main tip =", branches["main"])`,
        },
        {
          kind: "quiz",
          question: "What is a Git branch, mechanically?",
          options: [
            {
              text: "A lightweight, movable pointer to a single commit — creating one is O(1) (just writes a 40-char id to a file), which is why branching in Git is cheap",
              correct: true,
            },
            { text: "A full copy of all the project's files in a separate folder" },
            { text: "A diff of changes since you branched off" },
            { text: "A snapshot of the repository at a point in time" },
          ],
          explanation:
            "A branch is 41 bytes: a name → a commit SHA. Committing advances the pointer; the commits themselves form the DAG. This is why Git branching is instant and encourages many short-lived branches — unlike older VCSs that copied files.",
        },
        {
          kind: "quiz",
          question: "You edited three files but only ran `git add report.py`, then `git commit`. What ends up in the commit?",
          options: [
            {
              text: "Only the changes to report.py — the commit captures what's STAGED, so the other two files' edits stay uncommitted in the working directory",
              correct: true,
            },
            { text: "All three files, because commit always includes every change" },
            { text: "Nothing, because you must add every file for commit to work" },
            { text: "A random subset chosen by Git" },
          ],
          explanation:
            "The staging area is the whole point: `git commit` snapshots exactly what you `git add`-ed, letting you craft focused commits. The other two files remain modified-but-unstaged (visible in `git status`) for a later commit.",
        },
        {
          kind: "flashcards",
          title: "Git mental model",
          cards: [
            { front: "Commit", back: "A snapshot of the whole project + parent pointer(s) + author/message, identified by a content hash (SHA). Git stores snapshots, not diffs." },
            { front: "The commit DAG", back: "Commits linked by parent pointers form a directed acyclic graph. Following parents backward is your history." },
            { front: "Working dir / staging / repo", back: "Files you edit → changes marked for the next commit (git add) → committed history in .git (git commit)." },
            { front: "Staging area (index)", back: "The set of changes that will go in the next commit. Lets you compose focused commits instead of dumping every edit." },
            { front: "Branch", back: "A movable pointer to a commit (just a name → SHA). Creating/switching is O(1), so cheap branching is idiomatic." },
            { front: "HEAD", back: "A pointer to 'where you are' — usually to the current branch. Committing moves the branch (and thus HEAD) forward to the new snapshot." },
            { front: "SHA", back: "A commit's 40-hex-char content hash. Any change to content or history yields a different SHA — which is how Git guarantees integrity." },
          ],
        },
      ],
    },
    {
      id: "git-core-workflow",
      title: "The Core Workflow",
      summary: "init, status, add, commit, diff, log — the daily loop.",
      minutes: 13,
      blocks: [
        {
          kind: "prose",
          markdown: `# The everyday loop

Ninety percent of Git use is a tight cycle:

\`\`\`bash
git init                     # start a repo (creates .git/) — once per project
git clone <url>              # ...or copy an existing repo from GitHub

git status                   # what's changed / staged / untracked — run it OFTEN
git diff                     # unstaged changes (working vs staging)
git diff --staged            # staged changes (what the next commit will contain)

git add analysis.py          # stage one file
git add .                    # stage everything under the current dir (careful!)
git restore --staged file    # UN-stage (keep the edit, remove from next commit)

git commit -m "Message"      # snapshot the staged changes
git commit -am "Message"     # add tracked files + commit in one step

git log --oneline --graph    # compact, visual history
git show <sha>               # a commit's message + its diff
\`\`\`

\`git status\` is your compass — run it constantly. It tells you which files are
**untracked** (Git has never seen them), **modified** (tracked, changed, unstaged),
or **staged** (ready to commit).

# Commit messages that don't waste everyone's time

Commits are documentation your future self and teammates read during incidents and
reviews. The widely-used convention:

- A short **imperative** subject line (~50 chars): "Add null check to order loader"
  — read it as "*this commit will* Add…", not "Added…" or "Adding…".
- A blank line, then a body explaining **why** (not what — the diff shows what):
  the bug, the trade-off, the ticket.
- One logical change per commit. "Fix loader + refactor utils + bump deps" is three
  commits, so each can be reviewed and reverted independently.

Good history is a queryable log of *why the code is the way it is* — priceless when a
data pipeline breaks at 2 a.m. and you \`git log\` the file that changed.`,
        },
        {
          kind: "quiz",
          question: "What's the difference between `git diff` and `git diff --staged`?",
          options: [
            {
              text: "`git diff` shows unstaged changes (working dir vs staging); `git diff --staged` shows what you've staged (staging vs last commit) — i.e. exactly what the next commit will include",
              correct: true,
            },
            { text: "They're identical aliases" },
            { text: "`git diff` shows the whole history; `--staged` shows only one commit" },
            { text: "`--staged` shows changes on the remote server" },
          ],
          explanation:
            "There are two 'gaps': working↔staging (`git diff`) and staging↔HEAD (`git diff --staged`). Checking `--staged` right before committing is the habit that stops you from accidentally committing a debug print or half a change.",
        },
        {
          kind: "quiz",
          question: "Which is the better-formed commit subject line by convention?",
          options: [
            { text: "\"Fix null customer_id crash in order loader\" — short, imperative, one focused change", correct: true },
            { text: "\"fixed some stuff and also refactored the utils and updated a dependency\"" },
            { text: "\"changes\"" },
            { text: "\"WORKING NOW!!! finally\"" },
          ],
          explanation:
            "Imperative mood, ~50 chars, one logical change, and it names the actual fix. It reads well in `git log --oneline`, is easy to revert in isolation, and tells a reviewer what to expect. The others bundle unrelated changes or say nothing.",
        },
      ],
    },
    {
      id: "git-branching-merging",
      title: "Branching & Merging",
      summary: "Branches as pointers, fast-forward vs 3-way merge, conflicts.",
      minutes: 15,
      blocks: [
        {
          kind: "prose",
          markdown: `# Branch to work in isolation

You never build a feature on \`main\`. You branch, so your half-finished work can't
break anyone else and \`main\` stays deployable:

\`\`\`bash
git switch -c feature/dedupe    # create + switch to a new branch (git checkout -b)
# ...commit some work on the branch...
git switch main                 # go back to main
git merge feature/dedupe        # bring the feature's commits into main
git branch -d feature/dedupe    # delete the merged branch
\`\`\`

A branch is just a pointer, so this is all cheap pointer bookkeeping.

# Two ways a merge resolves

**Fast-forward** — if \`main\` hasn't moved since you branched, Git can just slide
\`main\`'s pointer forward to your branch tip. No new commit; linear history.

\`\`\`
before:  main → c2        feature → c4   (c2 ← c3 ← c4)
ff:      main → c4        (just moved the pointer)
\`\`\`

**Three-way merge** — if \`main\` *also* got new commits, the histories diverged. Git
finds the **merge base** (the last common ancestor), combines both sides, and records
a **merge commit** with **two parents**:

\`\`\`
        c2 ← c3 ← c4        (feature)
       /
c1 ← c2 ← c5 ← c6           (main)
              ↘
               c7  ← merge commit (parents: c6 and c4)
\`\`\`

# Conflicts

If both sides changed **the same lines**, Git can't guess and marks a **conflict**:

\`\`\`
<<<<<<< HEAD
tax_rate = 0.07          # main's version
=======
tax_rate = 0.08          # feature's version
>>>>>>> feature/dedupe
\`\`\`

You edit the file to the correct result, remove the markers, \`git add\` it, and
\`git commit\` to complete the merge. Conflicts are normal on a busy repo — they mean
two people touched the same place, and Git is (correctly) refusing to silently pick
one. Small, frequent merges keep them small.`,
        },
        {
          kind: "runnable",
          title: "Find the merge base of two branches on the DAG",
          code: `# parent map: child -> parent (single-parent commits for clarity)
parent = {
    "c1": None,
    "c2": "c1",
    "c3": "c2",   # feature branched here
    "c4": "c3",   # feature tip
    "c5": "c2",   # main kept going
    "c6": "c5",   # main tip
}
branches = {"main": "c6", "feature": "c4"}

def ancestors(cid):
    """All commits reachable by walking parents (inclusive)."""
    seen = []
    while cid is not None:
        seen.append(cid)
        cid = parent[cid]
    return seen

def merge_base(a, b):
    """Last common ancestor — the point the histories diverged."""
    a_anc = ancestors(branches[a])
    b_anc = set(ancestors(branches[b]))
    for cid in a_anc:               # a_anc is newest-first
        if cid in b_anc:
            return cid
    return None

print("main history:   ", ancestors(branches["main"]))
print("feature history:", ancestors(branches["feature"]))
base = merge_base("main", "feature")
print("merge base:", base)

# Both branches advanced past c2, so this is a 3-WAY merge (not fast-forward):
ff = base == branches["main"] or base == branches["feature"]
print("fast-forward possible?", ff, "-> a merge commit will be created")`,
        },
        {
          kind: "quiz",
          question: "When can Git do a fast-forward merge instead of creating a merge commit?",
          options: [
            {
              text: "When the target branch hasn't diverged — its tip is an ancestor of the branch being merged, so Git just slides the pointer forward with no new commit",
              correct: true,
            },
            { text: "Only when there are zero conflicts between the branches" },
            { text: "Whenever you pass the --no-ff flag" },
            { text: "Only for branches with fewer than 10 commits" },
          ],
          explanation:
            "Fast-forward is possible exactly when the base equals the target's tip (the target didn't move). If both sides advanced, histories diverged and Git must record a two-parent merge commit to join them.",
        },
        {
          kind: "quiz",
          question: "Git reports a merge conflict in `config.py`. What actually caused it?",
          options: [
            {
              text: "Both branches changed the same region of that file, so Git can't auto-combine them and asks you to pick/blend the result, then `git add` + commit",
              correct: true,
            },
            { text: "The file was deleted on the remote" },
            { text: "You have uncommitted changes elsewhere" },
            { text: "Git ran out of memory merging" },
          ],
          explanation:
            "Conflicts happen only where the two sides edited overlapping lines. Git marks the region with <<<<<<< ======= >>>>>>>; you resolve it to the intended value, remove the markers, stage, and commit. Non-overlapping changes merge automatically.",
        },
      ],
    },
    {
      id: "git-rebase-vs-merge",
      title: "Rebase vs Merge",
      summary: "Replaying commits, a linear history, and the golden rule.",
      minutes: 12,
      blocks: [
        {
          kind: "prose",
          markdown: `# Two ways to integrate work

Both bring your branch up to date with \`main\`; they differ in the *shape* of the
history they leave behind.

**Merge** joins the two histories with a merge commit. History is truthful (it shows
the branch really existed) but can get tangled with many merge bubbles.

\`\`\`
c1 ← c2 ← c5 ← c6 ───── M   (merge commit; feature's c3,c4 hang off c2)
       \\                /
        c3 ← c4 ────────
\`\`\`

**Rebase** *replays* your branch's commits on top of the latest \`main\`, as if you'd
started from there. History becomes **linear** — no merge bubble:

\`\`\`bash
git switch feature
git rebase main            # move c3,c4 to sit on top of main's c6
\`\`\`

\`\`\`
c1 ← c2 ← c5 ← c6 ← c3' ← c4'   (c3',c4' are NEW commits: same changes, new SHAs)
\`\`\`

Note c3' and c4' are **new commits with new SHAs** — rebasing *rewrites history*.

# The golden rule of rebasing

> **Never rebase commits that others have already pulled.** (Don't rebase shared/
> public branches.)

Because rebase creates new SHAs, if a teammate already based work on the old commits,
you've now got two divergent versions of "the same" history, and their next \`git pull\`
turns into a mess. Rebase freely on your **own local, un-pushed** branch to tidy up
before opening a PR; use merge to integrate **shared** branches.

A common tidy workflow: \`git pull --rebase\` to replay your local commits on top of
the latest remote instead of creating a merge commit for every sync. Many data teams
standardize on "rebase your feature branch, merge into main" to keep \`main\`'s history
readable.`,
        },
        {
          kind: "quiz",
          question: "Why does rebasing a branch that others have already pulled cause problems?",
          options: [
            {
              text: "Rebase rewrites commits into new SHAs, so the shared history now exists in two divergent forms — teammates' branches point at the old commits and their next pull conflicts/duplicates",
              correct: true,
            },
            { text: "Rebase permanently deletes the remote branch" },
            { text: "Rebase can only run once per repository" },
            { text: "Rebase always causes unresolvable conflicts" },
          ],
          explanation:
            "The golden rule follows directly from 'rebase makes new SHAs': rewriting public history desyncs everyone who built on the old SHAs. Keep rebase for your own un-pushed work; integrate shared branches with merge.",
        },
        {
          kind: "quiz",
          question: "What's the practical difference in the RESULTING history between merge and rebase?",
          options: [
            {
              text: "Merge preserves the true branch shape and adds a merge commit; rebase replays your commits onto the target for a linear history but rewrites them into new SHAs",
              correct: true,
            },
            { text: "Merge is faster; rebase is slower but otherwise identical" },
            { text: "Rebase keeps a merge commit; merge makes history linear" },
            { text: "There is no difference in the resulting history" },
          ],
          explanation:
            "Merge = accurate but bubbly history, original SHAs preserved. Rebase = clean linear history, new SHAs (rewritten). Choose merge for shared integration and truthfulness, rebase for a tidy local branch before review.",
        },
        {
          kind: "flashcards",
          title: "Rebase vs merge",
          cards: [
            { front: "Merge", back: "Joins two histories with a two-parent merge commit. Truthful branch shape, original SHAs preserved, but history can get bubbly." },
            { front: "Rebase", back: "Replays your branch's commits on top of the target as brand-new commits (new SHAs). Produces a clean, linear history — but rewrites history." },
            { front: "Golden rule of rebase", back: "Never rebase commits others have already pulled (shared/public branches). Rewriting public SHAs desyncs everyone who built on them." },
            { front: "git pull --rebase", back: "Sync by replaying your local commits on top of the latest remote instead of adding a merge commit for each pull — keeps history linear." },
            { front: "Why new SHAs on rebase", back: "A commit's SHA hashes its parent + content; changing the parent (replaying onto a new base) necessarily produces a different SHA." },
            { front: "Team convention", back: "Common pattern: rebase your feature branch to tidy it, then merge into main. Local cleanup with rebase, shared integration with merge." },
          ],
        },
      ],
    },
    {
      id: "git-remotes-github",
      title: "Remotes, GitHub & Pull Requests",
      summary: "clone/fetch/pull/push, origin, and the PR review workflow.",
      minutes: 14,
      blocks: [
        {
          kind: "prose",
          markdown: `# Remotes: Git over the network

Git is **distributed** — every clone is a full repository with complete history. A
**remote** is a named reference to another copy (usually on GitHub). The default
remote is \`origin\`.

\`\`\`bash
git clone <url>            # copy a remote repo locally (sets up 'origin')
git remote -v              # list remotes and their URLs
git fetch                  # download new commits from origin (don't merge yet)
git pull                   # fetch + merge (or --rebase) into your branch
git push                   # upload your commits to origin
git push -u origin feat/x  # first push of a new branch (sets upstream tracking)
\`\`\`

- **fetch** is read-only: it updates your knowledge of the remote (\`origin/main\`)
  without touching your working files — safe to run anytime.
- **pull** = fetch **+** integrate into your current branch.
- **push** sends your local commits up; it's rejected if the remote moved ahead
  (fetch/pull first, resolve, then push — Git won't let you clobber others' work).

# GitHub & the Pull Request workflow

GitHub hosts the remote and adds collaboration on top. The standard team loop —
the **feature-branch / PR** workflow:

1. \`git switch -c feature/x\` — branch off \`main\`.
2. Commit your work; \`git push -u origin feature/x\`.
3. Open a **Pull Request** (PR): "please merge feature/x into main."
4. **Code review** — teammates comment; CI runs automatically (tests, linters, dbt
   builds) and reports pass/fail on the PR.
5. Address feedback with more commits (the PR updates itself on push).
6. **Merge** the PR (merge commit / squash / rebase), then delete the branch.

The PR is where quality gates live: nothing reaches \`main\` without review + green CI.
For data teams this is huge — a PR is where a reviewer catches "this dbt model changes
a metric definition" or "this migration drops a column" **before** it hits production
data. (This very project is a submodule with its own remote — commit inside the
submodule, then update the pointer in the parent repo.)`,
        },
        {
          kind: "quiz",
          question: "What's the difference between `git fetch` and `git pull`?",
          options: [
            {
              text: "`fetch` only downloads remote commits and updates origin/* refs (your files are untouched); `pull` does a fetch AND merges/rebases those commits into your current branch",
              correct: true,
            },
            { text: "They're identical" },
            { text: "`fetch` uploads your commits; `pull` downloads" },
            { text: "`pull` is read-only; `fetch` modifies your working directory" },
          ],
          explanation:
            "fetch is the safe, read-only 'show me what's new upstream'; pull is fetch + integrate, which can create merge commits or conflicts. Many people `git fetch` first to inspect, then decide how to integrate.",
        },
        {
          kind: "quiz",
          question: "Your `git push` is rejected with 'updates were rejected because the remote contains work that you do not have locally.' What happened and what's the fix?",
          options: [
            {
              text: "A teammate pushed commits after your last sync, so the remote branch moved ahead — pull (fetch + merge/rebase) to integrate their work, resolve any conflicts, then push",
              correct: true,
            },
            { text: "Your SSH key expired; regenerate it" },
            { text: "The branch is protected and can never be pushed to" },
            { text: "Use `git push --force` — it's always the right fix" },
          ],
          explanation:
            "Git refuses to overwrite commits you haven't seen. Integrate first (`git pull` / `pull --rebase`), then push. `--force` would discard their commits — reserve it for your own un-shared branches, never shared ones.",
        },
        {
          kind: "flashcards",
          title: "Remotes & GitHub",
          cards: [
            { front: "Remote / origin", back: "A named reference to another copy of the repo (usually on GitHub). 'origin' is the default name for the one you cloned from." },
            { front: "Distributed VCS", back: "Every clone is a complete repo with full history — you can commit, branch, and view history entirely offline." },
            { front: "git fetch", back: "Download new commits and update origin/* refs WITHOUT changing your files. Safe to run anytime to see what's new upstream." },
            { front: "git pull", back: "fetch + integrate (merge or --rebase) into your current branch. Can produce merge commits or conflicts." },
            { front: "git push (rejected)", back: "Rejected when the remote moved ahead of you. Pull/rebase to integrate, then push. Never force-push a shared branch." },
            { front: "Pull Request (PR)", back: "A GitHub request to merge one branch into another. Where code review + CI checks gate quality before anything reaches main." },
            { front: "Feature-branch workflow", back: "Branch off main → commit → push → open PR → review + green CI → merge → delete branch. The default team loop." },
          ],
        },
      ],
    },
    {
      id: "git-undoing",
      title: "Undoing Things Safely",
      summary: "restore, reset, revert, reflog, stash — and getting 'lost' commits back.",
      minutes: 15,
      blocks: [
        {
          kind: "prose",
          markdown: `# The 'oh no' toolkit

Different undos for different situations — the key question is *what has been shared*.

\`\`\`bash
# Discard unstaged edits to a file (back to the last commit):
git restore analysis.py

# Un-stage a file but keep the edit:
git restore --staged analysis.py

# Temporarily shelve WIP to switch tasks, then bring it back:
git stash                 # save & clean the working dir
git stash pop             # reapply and drop the stash
\`\`\`

# reset: move the branch pointer (rewrites local history)

\`git reset <commit>\` moves your current branch pointer to \`<commit>\`. Three modes
differ in what they do to your files:

| Mode | Branch pointer | Staging | Working dir |
|---|---|---|---|
| \`--soft\` | moves | kept (staged) | kept |
| \`--mixed\` (default) | moves | reset | kept |
| \`--hard\` | moves | reset | **reset (edits lost!)** |

\`git reset --soft HEAD~1\` "uncommits" the last commit but keeps its changes staged
(great for redoing a commit). \`--hard\` throws work away — powerful and dangerous.

# revert: undo safely on SHARED history

\`\`\`bash
git revert <sha>          # create a NEW commit that undoes <sha>
\`\`\`

\`revert\` doesn't rewrite history — it adds a commit that reverses an earlier one.
**This is the safe undo for anything already pushed/shared**, because it doesn't
change existing SHAs (no golden-rule violation).

> **reset vs revert:** \`reset\` moves the pointer and rewrites history — use on your
> **local, un-pushed** work. \`revert\` records a new, opposite commit — use on
> **shared/pushed** work. Same goal (undo), opposite blast radius.

# reflog: your safety net

Almost nothing is truly lost. \`git reflog\` logs everywhere \`HEAD\` has been —
including commits you "erased" with a bad reset. Find the SHA, and you can get back:

\`\`\`bash
git reflog                       # ...  a1b2c3d HEAD@{2}: commit: important work
git reset --hard a1b2c3d         # restore that state
\`\`\`

Reflog is why experienced folks stay calm after a scary reset: the commits usually
still exist, unreferenced, for ~90 days before garbage collection.`,
        },
        {
          kind: "runnable",
          title: "reset moves the branch pointer along the DAG",
          code: `parent = {"c1": None, "c2": "c1", "c3": "c2", "c4": "c3"}
branch = {"main": "c4"}          # branch pointer
HEAD = "main"
reflog = ["c4"]                  # every place HEAD has pointed

def parent_n(cid, n):
    """HEAD~n : walk n parents back."""
    for _ in range(n):
        cid = parent[cid]
    return cid

def reset(target):
    global reflog
    branch[HEAD] = target        # reset just MOVES the pointer...
    reflog.append(target)        # ...and reflog remembers where we were

print("start:        main ->", branch["main"])

# 'git reset --soft HEAD~1' : uncommit c4 (changes would stay staged)
reset(parent_n(branch["main"], 1))
print("reset HEAD~1: main ->", branch["main"], "  (c4 no longer referenced)")

# Panic? c4 isn't gone — reflog still has it:
print("reflog:", reflog)

# 'git reset --hard c4' : restore, using the SHA from the reflog
reset("c4")
print("recovered:    main ->", branch["main"], " ✅ nothing was truly lost")`,
        },
        {
          kind: "challenge",
          title: "Compute the final branch tip after reset operations",
          prompt: `Given a linear commit history and a list of operations, compute where the
branch pointer ends up. Write \`final_tip(parents, start, ops)\`:

- \`parents\` maps each commit id to its parent (\`None\` for the root).
- \`start\` is the branch's current tip commit id.
- \`ops\` is a list of operations applied in order, each one of:
  - \`("commit", new_id)\` — a new commit whose parent is the current tip; the branch
    moves to \`new_id\` (and \`parents\` gains \`new_id -> old tip\`).
  - \`("reset", n)\` — move the tip \`n\` commits back by following parent pointers
    (like \`git reset HEAD~n\`).

Return the commit id the branch points to after applying every op.`,
          starterCode: `def final_tip(parents, start, ops):
    pass`,
          tests: [
            {
              name: "commit then reset back",
              assertion: `p = {"c1": None, "c2": "c1", "c3": "c2"}
assert final_tip(p, "c3", [("reset", 1)]) == "c2"`,
            },
            {
              name: "new commit moves the tip",
              assertion: `p = {"c1": None, "c2": "c1"}
assert final_tip(p, "c2", [("commit", "c3")]) == "c3"`,
            },
            {
              name: "commit then reset undoes it",
              assertion: `p = {"c1": None, "c2": "c1"}
assert final_tip(p, "c2", [("commit", "c3"), ("reset", 1)]) == "c2"`,
            },
            {
              name: "multi-step",
              assertion: `p = {"c1": None, "c2": "c1", "c3": "c2", "c4": "c3"}
assert final_tip(p, "c4", [("reset", 2), ("commit", "c5"), ("reset", 1)]) == "c2"`,
              hidden: true,
            },
          ],
          hints: [
            "Keep a local `tip` variable; loop over ops and update it.",
            "For `commit`: record `parents[new_id] = tip`, then set `tip = new_id`.",
            "For `reset`: loop n times doing `tip = parents[tip]`.",
          ],
          solution: `def final_tip(parents, start, ops):
    tip = start
    for op, arg in ops:
        if op == "commit":
            parents[arg] = tip
            tip = arg
        elif op == "reset":
            for _ in range(arg):
                tip = parents[tip]
    return tip`,
          xp: 100,
        },
        {
          kind: "quiz",
          question: "You pushed a bad commit to `main` yesterday and teammates have pulled it. What's the correct way to undo it?",
          options: [
            {
              text: "`git revert <sha>` — add a new commit that reverses the change, leaving shared history intact (no rewritten SHAs)",
              correct: true,
            },
            { text: "`git reset --hard HEAD~1` and force-push, rewriting the shared history" },
            { text: "Delete the repository and re-clone" },
            { text: "Nothing can be done once a commit is pushed" },
          ],
          explanation:
            "On shared history, `revert` is the safe undo: it records an opposite commit and never changes existing SHAs, so no one's clone breaks. `reset --hard` + force-push rewrites public history — a golden-rule violation that desyncs everyone.",
        },
        {
          kind: "quiz",
          question: "You ran `git reset --hard` and lost a commit you actually needed. What's your first move?",
          options: [
            {
              text: "`git reflog` to find the lost commit's SHA (HEAD's history is logged), then `git reset --hard <sha>` or cherry-pick it back",
              correct: true,
            },
            { text: "Nothing — --hard permanently and immediately deletes commits forever" },
            { text: "Re-clone the repo from origin and hope it's there" },
            { text: "Run `git commit` to bring it back" },
          ],
          explanation:
            "reflog records every position HEAD held, so a 'lost' commit is usually still reachable by SHA for ~90 days before garbage collection. This is the safety net that makes reset survivable — find the SHA, reset/cherry-pick back.",
        },
      ],
    },
    {
      id: "git-for-data-teams",
      title: "Git for Data Teams",
      summary: ".gitignore, why not to commit data/secrets, LFS & data versioning.",
      minutes: 13,
      blocks: [
        {
          kind: "prose",
          markdown: `# Git is for code, not for data

Git was built for source code — text that changes line by line. Data breaks its
assumptions, so data teams follow a few hard rules.

## .gitignore: keep junk and data out of history

A \`.gitignore\` file lists patterns Git should never track:

\`\`\`gitignore
# secrets & config
.env
*.pem
credentials.json

# data — belongs in S3/a warehouse, NOT in git
*.csv
*.parquet
data/
*.db

# notebooks output & caches
.ipynb_checkpoints/
__pycache__/
.venv/

# build artifacts
dist/
\`\`\`

## Never commit data — three reasons

1. **Repos bloat forever.** Git keeps *every version* of every file in history.
   Commit a 500 MB CSV, delete it next commit, and it still lives in \`.git\` forever
   — every clone drags it along. History rewrites to purge it are painful.
2. **Diffs are meaningless.** Git line-diffs a Parquet file as unreadable binary; you
   get no review value and constant conflicts.
3. **Data belongs in data systems** — object storage (S3), a warehouse, a lake. Git
   tracks the *code* that produces the data; the data itself is versioned there.

## Never commit secrets

A committed API key or DB password is in history **even after you delete it** — anyone
who ever cloned the repo has it. If it happens: **rotate the credential immediately**
(assume it's compromised), then scrub history. Prevent it with \`.gitignore\`, env vars,
and secret-scanning (GitHub blocks many known key formats on push).

## When you DO need big files: LFS & data versioning

- **Git LFS** (Large File Storage) stores big files (models, images) outside the repo
  and keeps a small text pointer in Git — history stays lean.
- **DVC / lakeFS / Delta / Iceberg** version *datasets* alongside code: Git tracks a
  small pointer/metadata file; the actual data lives in S3 with its own versioning and
  time-travel. This is how you get "reproduce the exact data + code from last Tuesday's
  model run" without stuffing terabytes into Git.`,
        },
        {
          kind: "quiz",
          question: "Why is committing a 500 MB dataset to Git a problem even if you delete it in the very next commit?",
          options: [
            {
              text: "Git keeps full history, so the 500 MB blob stays in .git forever — every clone and fetch drags it along, and removing it requires a painful history rewrite",
              correct: true,
            },
            { text: "Git refuses to store files over 100 MB, so it never committed" },
            { text: "Deleting it in the next commit fully removes it from history" },
            { text: "It's fine — Git compresses data files to nearly zero" },
          ],
          explanation:
            "History is append-only: a deletion is just another commit; the old content is still reachable and cloned. That's why data lives in S3/warehouses (versioned there) and Git tracks only the code — with LFS/DVC pointers when a big artifact truly must be referenced.",
        },
        {
          kind: "quiz",
          question: "You accidentally committed and pushed an AWS access key. What must you do FIRST?",
          options: [
            {
              text: "Rotate/revoke the key immediately — assume it's compromised — then scrub it from history; removing the commit alone is not enough",
              correct: true,
            },
            { text: "Just delete the line in a new commit; that removes it from history" },
            { text: "Make the repo private and consider it handled" },
            { text: "Nothing, as long as no one noticed" },
          ],
          explanation:
            "Once pushed, the secret exists in history and in every clone/fork — anyone who had access may have it. Rotation is the only real fix; history scrubbing and .gitignore prevent recurrence but don't un-leak the old value.",
        },
        {
          kind: "flashcards",
          title: "Git for data teams",
          cards: [
            { front: ".gitignore", back: "A file of patterns Git must never track — secrets (.env, *.pem), data (*.csv, *.parquet, data/), caches, and build artifacts." },
            { front: "Why not commit data", back: "History keeps every version forever (repo bloat), binary diffs are meaningless, and data belongs in S3/warehouses/lakes that version it properly." },
            { front: "Committed secret = leaked secret", back: "It stays in history and in every clone even after deletion. Fix = rotate the credential immediately, then scrub history. Prevent with .gitignore + env vars." },
            { front: "Git LFS", back: "Large File Storage: stores big binaries outside the repo, keeping only a small pointer in Git so history stays lean." },
            { front: "Data versioning (DVC/lakeFS/Delta/Iceberg)", back: "Version datasets alongside code: Git tracks a small metadata/pointer file; the data lives in object storage with its own versioning + time travel." },
            { front: "What Git should track", back: "The CODE that produces data (pipelines, dbt models, configs) — plus pointers/metadata for large artifacts. Not the data itself." },
          ],
        },
      ],
    },
    {
      id: "git-ci-github-actions",
      title: "CI/CD with GitHub Actions",
      summary: "Automate tests, linting, and dbt/pipeline checks on every PR.",
      minutes: 13,
      blocks: [
        {
          kind: "prose",
          markdown: `# Continuous Integration: let the robots gate quality

**CI** runs automated checks on every push/PR so broken code never reaches \`main\`.
**GitHub Actions** is GitHub's built-in CI: you drop a YAML file in
\`.github/workflows/\` and it runs on the triggers you declare.

\`\`\`yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:            # run on every PR...
  push:
    branches: [main]       # ...and on pushes to main

jobs:
  test:                    # a job runs on a fresh VM ("runner")
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4        # clone the repo
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - run: pip install -r requirements.txt
      - run: ruff check .                 # lint
      - run: pytest -q                    # tests → non-zero exit fails the job
\`\`\`

The vocabulary:

- **workflow** — the whole YAML file, triggered by events (\`on:\`).
- **job** — a set of steps on one fresh runner; jobs can run in parallel.
- **step** — one command (\`run:\`) or reusable **action** (\`uses:\`).
- A job **fails** if any step returns a non-zero exit code — the same exit-code
  contract from the Linux track. A red check **blocks the PR from merging**.

# CI for data teams

The same machinery guards *data* quality, not just app code:

- **\`pytest\`** on your Python transforms and utilities.
- **\`dbt build\`** / \`dbt test\` on a PR — compile models and run schema/data tests
  (unique, not-null, relationships) against a CI warehouse *before* merge.
- **linters/formatters** (ruff, black, sqlfluff) for consistent code.
- **\`dbt build --select state:modified+\`** to test only what a PR changed.

# Secrets & CD

CI needs credentials (a warehouse login, an AWS key) but you **never** hardcode them.
Store them as **GitHub Secrets** (encrypted, injected as env vars):

\`\`\`yaml
      - run: dbt build
        env:
          DBT_PASSWORD: \${{ secrets.DBT_PASSWORD }}
\`\`\`

**CD** (Continuous Deployment) extends this: once checks pass on \`main\`, a workflow
*deploys* — publishes a package, ships a container, or (like **this very project**)
builds the static site and pushes it to GitHub Pages via \`.github/workflows/deploy.yml\`.
That's the whole loop: PR → review + green CI → merge → auto-deploy.`,
        },
        {
          kind: "quiz",
          question: "In GitHub Actions, what makes a job report failure and block a PR from merging?",
          options: [
            {
              text: "Any step exiting with a non-zero code (e.g. pytest finds a failing test, or dbt test finds violating rows) — the same exit-code contract the shell uses",
              correct: true,
            },
            { text: "Only an explicit `fail:` line in the YAML" },
            { text: "A job can never block a PR; checks are advisory only" },
            { text: "Running longer than 60 seconds" },
          ],
          explanation:
            "Steps are just commands; a non-zero exit fails the step, which fails the job, which turns the PR check red. With branch protection, a red required check prevents merge — automating the 'don't ship broken code (or data)' rule.",
        },
        {
          kind: "quiz",
          question: "Your CI job needs a warehouse password to run `dbt build`. How should you provide it?",
          options: [
            {
              text: "Store it as an encrypted GitHub Secret and reference it as ${{ secrets.NAME }}, injected into the step's env — never commit it to the workflow file",
              correct: true,
            },
            { text: "Hardcode it in the YAML so the runner can read it" },
            { text: "Commit it to a .env file in the repo" },
            { text: "Print it to the logs so you can copy it each run" },
          ],
          explanation:
            "Workflow files are in the repo (and often public), so a hardcoded secret is a leak. GitHub Secrets are encrypted at rest and injected as env vars at runtime — the CI equivalent of the 'secrets in env vars, never in code' rule.",
        },
        {
          kind: "flashcards",
          title: "CI/CD & GitHub Actions",
          cards: [
            { front: "Continuous Integration (CI)", back: "Automatically run checks (tests, linters, builds) on every push/PR so broken code never reaches main." },
            { front: "GitHub Actions", back: "GitHub's built-in CI/CD. YAML files in .github/workflows/ run on declared events (pull_request, push, schedule...)." },
            { front: "workflow / job / step", back: "workflow = the YAML triggered by events; job = steps on one fresh runner (jobs can parallelize); step = one command (run) or reusable action (uses)." },
            { front: "How a check fails", back: "A step exiting non-zero fails the job → red PR check. With branch protection, a required red check blocks merge." },
            { front: "CI for data", back: "pytest on transforms, dbt build/test (unique/not-null/relationships) against a CI warehouse, sqlfluff/ruff linting — catch bad data logic before merge." },
            { front: "GitHub Secrets", back: "Encrypted credentials injected as env vars via ${{ secrets.NAME }}. Never hardcode passwords/keys in the workflow file." },
            { front: "Continuous Deployment (CD)", back: "After checks pass on main, auto-deploy: publish a package, ship a container, or build+push a site (this project deploys to GitHub Pages)." },
          ],
        },
      ],
    },
  ],
};
