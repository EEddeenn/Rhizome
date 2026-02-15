import assert from "node:assert";
import { describe, it } from "node:test";
import { removeStopWords } from "../src/lib/content/stop-words";

describe("removeStopWords", () => {
  it("removes common stop words", () => {
    const result = removeStopWords("the quick brown fox");

    assert.strictEqual(result, "quick brown fox");
  });

  it("preserves original case", () => {
    const result = removeStopWords("The Quick Brown Fox");

    assert.strictEqual(result, "Quick Brown Fox");
  });

  it("handles multiple spaces", () => {
    const result = removeStopWords("the   quick   brown   fox");

    assert.strictEqual(result, "quick brown fox");
  });

  it("handles newlines and tabs", () => {
    const result = removeStopWords("the\nquick\tbrown fox");

    assert.strictEqual(result, "quick brown fox");
  });

  it("returns empty string for all stop words", () => {
    const result = removeStopWords("the a an is it to");

    assert.strictEqual(result, "");
  });

  it("handles empty string", () => {
    const result = removeStopWords("");

    assert.strictEqual(result, "");
  });

  it("handles whitespace-only string", () => {
    const result = removeStopWords("   \n\t  ");

    assert.strictEqual(result, "");
  });

  it("removes contractions like don't and can't", () => {
    const result = removeStopWords("I don't know what you can't see");

    assert.strictEqual(result, "know see");
  });

  it("preserves technical terms", () => {
    const result = removeStopWords("the React component is a function");

    assert.strictEqual(result, "React component function");
  });

  it("handles single word", () => {
    assert.strictEqual(removeStopWords("the"), "");
    assert.strictEqual(removeStopWords("typescript"), "typescript");
  });

  it("handles mixed stop and content words", () => {
    const result = removeStopWords("This is a test of the system");

    assert.strictEqual(result, "test system");
  });

  it("handles possessive forms in stop words", () => {
    const result = removeStopWords("it's what's the problem");

    assert.strictEqual(result, "problem");
  });
});
