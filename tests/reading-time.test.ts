import assert from "node:assert";
import { describe, it } from "node:test";
import { estimateReadingTime } from "../src/lib/content/reading-time";

describe("estimateReadingTime", () => {
  it("calculates word count and reading time for simple text", () => {
    const text = "Hello world this is a test";
    const result = estimateReadingTime(text);

    assert.strictEqual(result.wordCount, 6);
    assert.strictEqual(result.minutes, 1);
  });

  it("handles empty string", () => {
    const result = estimateReadingTime("");

    assert.strictEqual(result.wordCount, 0);
    assert.strictEqual(result.minutes, 0);
  });

  it("handles whitespace-only string", () => {
    const result = estimateReadingTime("   \n\t  ");

    assert.strictEqual(result.wordCount, 0);
    assert.strictEqual(result.minutes, 0);
  });

  it("calculates correct reading time for long text", () => {
    const words = Array(400).fill("word").join(" ");
    const result = estimateReadingTime(words);

    assert.strictEqual(result.wordCount, 400);
    assert.strictEqual(result.minutes, 2);
  });

  it("rounds up to nearest minute", () => {
    const words = Array(201).fill("word").join(" ");
    const result = estimateReadingTime(words);

    assert.strictEqual(result.wordCount, 201);
    assert.strictEqual(result.minutes, 2);
  });

  it("handles text with multiple spaces", () => {
    const result = estimateReadingTime("word   word    word");

    assert.strictEqual(result.wordCount, 3);
  });

  it("handles text with newlines", () => {
    const result = estimateReadingTime("word\nword\nword");

    assert.strictEqual(result.wordCount, 3);
  });

  it("handles text with tabs", () => {
    const result = estimateReadingTime("word\tword\tword");

    assert.strictEqual(result.wordCount, 3);
  });

  it("returns 1 minute minimum for non-empty text", () => {
    const result = estimateReadingTime("one");

    assert.strictEqual(result.wordCount, 1);
    assert.strictEqual(result.minutes, 1);
  });
});
