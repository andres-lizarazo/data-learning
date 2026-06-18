import type { TestCase } from "../types/lesson";

// Builds the Python test harness for a challenge: the learner's code followed by one
// isolated function per test case, each reporting pass/fail. Results are printed as a
// single JSON line prefixed with RESULT_MARKER, which the client parses.

export const RESULT_MARKER = "__PL_RESULTS__";

function indent(src: string, spaces = 4): string {
  const pad = " ".repeat(spaces);
  return src
    .split("\n")
    .map((l) => (l.trim() ? pad + l : l))
    .join("\n");
}

export function buildHarness(userCode: string, tests: TestCase[]): string {
  const parts: string[] = [userCode, "", "import json as __pl_json", "__pl_results = []"];
  tests.forEach((t, i) => {
    parts.push(`def __pl_test_${i}():`);
    parts.push(indent(t.assertion || "pass"));
    parts.push("try:");
    parts.push(`    __pl_test_${i}()`);
    parts.push(`    __pl_results.append({"ok": True})`);
    parts.push("except BaseException as __e:");
    parts.push("    import traceback as __tb");
    parts.push(
      '    __pl_results.append({"ok": False, "error": "".join(__tb.format_exception_only(type(__e), __e)).strip()})',
    );
  });
  parts.push(`print("${RESULT_MARKER}" + __pl_json.dumps(__pl_results))`);
  return parts.join("\n");
}
