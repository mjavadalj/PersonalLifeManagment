import { it, expect } from "vitest";
import { focusedQuotes, quotes } from "../src/data/quotes";
it("ships exactly 100 distinct bilingual sourced quotes, including Virgil/Dryden", () => {
  expect(quotes).toHaveLength(100);
  expect(new Set(quotes.map((q) => q.id)).size).toBe(100);
  expect(
    new Set(quotes.map((q) => q.en.toLowerCase().replace(/\W/g, ""))).size,
  ).toBe(100);
  for (const q of quotes) {
    expect(q.en.length).toBeGreaterThan(10);
    expect(q.fa).toMatch(/[آ-ی]/);
    expect(q.location).toBeTruthy();
    expect(q.author).toBeTruthy();
    expect(q.work).toBeTruthy();
    expect(new URL(q.source).protocol).toBe("https:");
  }
  expect(quotes.find((q) => q.id === "virgil-gates")?.translator).toBe(
    "جان درایدن",
  );
});
it("rotates only quotes about courage, resisting harm, or perseverance", () => {
  expect(focusedQuotes.length).toBeGreaterThanOrEqual(20);
  expect(focusedQuotes.some((q) => q.id === "virgil-gates")).toBe(true);
  expect(focusedQuotes.some((q) => /captain of my soul/i.test(q.en))).toBe(true);
  expect(focusedQuotes.some((q) => /not to yield/i.test(q.en))).toBe(true);
});
