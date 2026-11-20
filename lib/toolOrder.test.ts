import { describe, it, expect } from "vitest";
import {
  applyToolOrder,
  moveSlug,
  normalizeStoredOrder,
} from "@/lib/toolOrder";

const tools = [{ slug: "a" }, { slug: "b" }, { slug: "c" }];

describe("normalizeStoredOrder", () => {
  it("rejects non-arrays", () => {
    expect(normalizeStoredOrder("nope")).toEqual([]);
  });
  it("drops non-strings and duplicates", () => {
    expect(normalizeStoredOrder(["a", 1, "a", "b"])).toEqual(["a", "b"]);
  });
});

describe("applyToolOrder", () => {
  it("follows the saved order", () => {
    expect(applyToolOrder(tools, ["c", "a", "b"]).map((tool) => tool.slug)).toEqual([
      "c",
      "a",
      "b",
    ]);
  });
  it("appends new tools and ignores unknown slugs", () => {
    expect(applyToolOrder(tools, ["c", "gone"]).map((tool) => tool.slug)).toEqual([
      "c",
      "a",
      "b",
    ]);
  });
});

describe("moveSlug", () => {
  it("moves forward and backward", () => {
    expect(moveSlug(["a", "b", "c"], "a", 2)).toEqual(["b", "c", "a"]);
    expect(moveSlug(["a", "b", "c"], "c", 0)).toEqual(["c", "a", "b"]);
  });
  it("clamps the target index", () => {
    expect(moveSlug(["a", "b", "c"], "a", 99)).toEqual(["b", "c", "a"]);
    expect(moveSlug(["a", "b", "c"], "b", -5)).toEqual(["b", "a", "c"]);
  });
  it("ignores unknown slugs", () => {
    expect(moveSlug(["a", "b"], "z", 0)).toEqual(["a", "b"]);
  });
});
