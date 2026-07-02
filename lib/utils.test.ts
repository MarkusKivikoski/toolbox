import { describe, it, expect } from "vitest";
import { parseAmount } from "@/lib/utils";

describe("parseAmount", () => {
  it("tolerates spaces and comma decimals", () => {
    expect(parseAmount("1 200,50")).toBeCloseTo(1200.5);
  });

  it("treats unparseable input as zero", () => {
    expect(parseAmount("abc")).toBe(0);
    expect(parseAmount("")).toBe(0);
  });

  it("strips a leading sign rather than going negative", () => {
    // The cleaner drops any non-digit/non-dot char, so "-5" reads as 5.
    expect(parseAmount("-5")).toBe(5);
  });
});
