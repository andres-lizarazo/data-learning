#!/usr/bin/env node
// Verifies that every Python `challenge` block's reference solution passes its own
// tests, using the system python3 (mirrors the in-app harness: solution + assertion
// executed together, one fresh namespace per test).
//
//   node scripts/verify-python-challenges.mjs             # all modules
//   node scripts/verify-python-challenges.mjs solid dsa   # only these module ids
//
// Challenges that declare `packages` (numpy/pandas/...) are only run when the local
// python3 can import them; otherwise they're reported as skipped.

import { build } from "esbuild";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const onlyModules = process.argv.slice(2);

// Bundle the curriculum (pure data) to an importable ESM file.
const tmp = mkdtempSync(join(tmpdir(), "pylearn-verify-"));
const bundlePath = join(tmp, "curriculum.mjs");
await build({
  entryPoints: [join(root, "src/content/curriculum.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: bundlePath,
  logLevel: "silent",
});
const { curriculum } = await import(pathToFileURL(bundlePath).href);

// Collect challenges.
const cases = [];
for (const mod of curriculum) {
  if (onlyModules.length && !onlyModules.includes(mod.id)) continue;
  for (const lesson of mod.lessons) {
    for (const block of lesson.blocks) {
      if (block.kind !== "challenge") continue;
      cases.push({
        id: `${mod.id}/${lesson.id}/${block.title}`,
        packages: block.packages ?? [],
        solution: block.solution ?? "",
        tests: block.tests.map((t) => t.assertion),
      });
    }
  }
}

// Emit the Python runner.
const py = `
import json, sys

cases = json.loads(sys.argv[1])
failed = 0
skipped = 0
for case in cases:
    for pkg in case["packages"]:
        try:
            __import__({"scikit-learn": "sklearn"}.get(pkg, pkg))
        except ImportError:
            print("SKIP " + case["id"] + " (missing package: " + pkg + ")")
            skipped += 1
            break
    else:
        if not case["solution"].strip():
            print("FAIL " + case["id"] + ": no solution provided")
            failed += 1
            continue
        for i, test in enumerate(case["tests"]):
            ns = {}
            try:
                exec(case["solution"] + "\\n" + test, ns)
            except Exception as e:
                failed += 1
                print("FAIL " + case["id"] + " test " + str(i) + ": " + type(e).__name__ + ": " + str(e))
print(str(len(cases)) + " challenges checked, " + str(skipped) + " skipped")
sys.exit(1 if failed else 0)
`;
const runnerPath = join(tmp, "runner.py");
writeFileSync(runnerPath, py);

try {
  const out = execFileSync("python3", [runnerPath, JSON.stringify(cases)], {
    encoding: "utf8",
  });
  process.stdout.write(out);
  console.log("all python challenge solutions pass");
} catch (err) {
  process.stdout.write(err.stdout ?? "");
  process.stderr.write(err.stderr ?? "");
  process.exitCode = 1;
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
