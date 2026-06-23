import { describe, it, expect } from "vitest";
import { compareResultSets } from "./sqlCompare";

describe("compareResultSets", () => {
  it("matches identical result sets", () => {
    const rs = { columns: ["a", "b"], rows: [[1, "x"], [2, "y"]] };
    expect(compareResultSets(rs, rs).pass).toBe(true);
  });

  it("is order-insensitive by default", () => {
    const user = { columns: ["a"], rows: [[2], [1]] };
    const expected = { columns: ["x"], rows: [[1], [2]] };
    expect(compareResultSets(user, expected).pass).toBe(true);
  });

  it("ignores column names/aliases (compares by value/position)", () => {
    const user = { columns: ["name"], rows: [["Alice"]] };
    const expected = { columns: ["customer"], rows: [["Alice"]] };
    expect(compareResultSets(user, expected).pass).toBe(true);
  });

  it("treats numeric strings and numbers as equal (PG numeric type)", () => {
    const user = { columns: ["t"], rows: [["1648.50"]] };
    const expected = { columns: ["t"], rows: [[1648.5]] };
    expect(compareResultSets(user, expected).pass).toBe(true);
  });

  it("fails on wrong column count", () => {
    const user = { columns: ["a", "b"], rows: [[1, 2]] };
    const expected = { columns: ["a"], rows: [[1]] };
    expect(compareResultSets(user, expected).pass).toBe(false);
  });

  it("fails on wrong row count", () => {
    const user = { columns: ["a"], rows: [[1]] };
    const expected = { columns: ["a"], rows: [[1], [2]] };
    expect(compareResultSets(user, expected).pass).toBe(false);
  });

  it("enforces order when ordered=true", () => {
    const user = { columns: ["a"], rows: [[2], [1]] };
    const expected = { columns: ["a"], rows: [[1], [2]] };
    expect(compareResultSets(user, expected, true).pass).toBe(false);
    expect(compareResultSets(expected, expected, true).pass).toBe(true);
  });

  it("handles NULLs distinctly", () => {
    const user = { columns: ["a"], rows: [[null]] };
    const expected = { columns: ["a"], rows: [[0]] };
    expect(compareResultSets(user, expected).pass).toBe(false);
  });
});
