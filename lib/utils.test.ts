import { describe, it, expect } from "vitest";
import { dateStamp, editAmountInput, formatAmountInput, parseAmount } from "@/lib/utils";

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

describe("formatAmountInput", () => {
  it("groups the integer part into thousands", () => {
    expect(formatAmountInput("1000000")).toBe("1 000 000");
    expect(formatAmountInput("1234")).toBe("1 234");
  });

  it("leaves short integers ungrouped", () => {
    expect(formatAmountInput("100")).toBe("100");
    expect(formatAmountInput("")).toBe("");
  });

  it("preserves a comma decimal without grouping it", () => {
    expect(formatAmountInput("1234567,89")).toBe("1 234 567,89");
  });

  it("strips characters other than digits and a comma", () => {
    expect(formatAmountInput("-1 000abc")).toBe("1 000");
  });

  it("round-trips through parseAmount", () => {
    expect(parseAmount(formatAmountInput("1234567,5"))).toBeCloseTo(1234567.5);
  });
});

describe("editAmountInput", () => {
  it("keeps the caret after the last digit when typing at the end", () => {
    const { formatted, cursor } = editAmountInput("1234", 4);
    expect(formatted).toBe("1 234");
    expect(cursor).toBe(5);
  });

  it("keeps the caret stable when a grouping space appears before it", () => {
    // Typing "1" in front of "234" (caret after the new digit, before the
    // space that grouping inserts ahead of "234").
    const { formatted, cursor } = editAmountInput("1234", 1);
    expect(formatted).toBe("1 234");
    expect(cursor).toBe(1);
  });

  it("keeps the caret in place when editing the decimal part", () => {
    const { formatted, cursor } = editAmountInput("1234,5", 6);
    expect(formatted).toBe("1 234,5");
    expect(cursor).toBe(7);
  });

  it("places the caret at the start when nothing precedes it", () => {
    const { cursor } = editAmountInput("1234", 0);
    expect(cursor).toBe(0);
  });

  it("puts the caret after a just-typed comma, not before it", () => {
    // Field already reads "9 876 543" and the user types "," at the end.
    const { formatted, cursor } = editAmountInput("9 876 543,", 10);
    expect(formatted).toBe("9 876 543,");
    expect(cursor).toBe(10);
  });

  it("keeps typing decimal digits after the comma at the end", () => {
    const { formatted, cursor } = editAmountInput("9 876 543,2", 11);
    expect(formatted).toBe("9 876 543,2");
    expect(cursor).toBe(11);
  });
});

describe("dateStamp", () => {
  it("formats the ISO date portion", () => {
    expect(dateStamp(new Date("2026-07-08T15:30:00Z"))).toBe("2026-07-08");
  });
});
