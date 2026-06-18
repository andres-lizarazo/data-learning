import { describe, expect, it } from "vitest";
import { RESULT_MARKER, buildHarness } from "./harness";

describe("buildHarness", () => {
  const tests = [
    { name: "adds", assertion: "assert add(1, 2) == 3" },
    { name: "zero", assertion: "assert add(0, 0) == 0", hidden: true },
  ];

  it("includes the user code first", () => {
    const out = buildHarness("def add(a, b):\n    return a + b", tests);
    expect(out.startsWith("def add(a, b):")).toBe(true);
  });

  it("wraps each assertion in its own indented test function", () => {
    const out = buildHarness("def add(a, b):\n    return a + b", tests);
    expect(out).toContain("def __pl_test_0():");
    expect(out).toContain("    assert add(1, 2) == 3");
    expect(out).toContain("def __pl_test_1():");
    expect(out).toContain("    assert add(0, 0) == 0");
  });

  it("prints the results marker at the end", () => {
    const out = buildHarness("x = 1", tests);
    expect(out.trimEnd().endsWith(`__pl_json.dumps(__pl_results))`)).toBe(true);
    expect(out).toContain(`print("${RESULT_MARKER}"`);
  });

  it("falls back to `pass` for an empty assertion", () => {
    const out = buildHarness("", [{ name: "noop", assertion: "" }]);
    expect(out).toContain("    pass");
  });
});
