import assert from "node:assert";
import { describe, it } from "node:test";
import { sortEntries } from "../src/lib/content/sort";
import type { Entry } from "../src/lib/content/types";

function createEntry(overrides: Partial<Entry>): Entry {
  return {
    slug: "notes/test",
    route: "/notes/test",
    sourcePath: "content/notes/test.mdx",
    title: "Test Entry",
    tags: [],
    type: "note",
    ...overrides,
  };
}

describe("sortEntries", () => {
  it("sorts entries with dates in descending order", () => {
    const entries = [
      createEntry({ title: "Old", date: "2024-01-01" }),
      createEntry({ title: "New", date: "2024-12-31" }),
      createEntry({ title: "Middle", date: "2024-06-15" }),
    ];

    const sorted = sortEntries(entries);

    assert.strictEqual(sorted[0].title, "New");
    assert.strictEqual(sorted[1].title, "Middle");
    assert.strictEqual(sorted[2].title, "Old");
  });

  it("places entries with dates before entries without dates", () => {
    const entries = [
      createEntry({ title: "No Date A", date: undefined }),
      createEntry({ title: "Has Date", date: "2024-06-01" }),
      createEntry({ title: "No Date B", date: undefined }),
    ];

    const sorted = sortEntries(entries);

    assert.strictEqual(sorted[0].title, "Has Date");
    assert.strictEqual(sorted[1].title, "No Date A");
    assert.strictEqual(sorted[2].title, "No Date B");
  });

  it("sorts entries without dates by title alphabetically", () => {
    const entries = [
      createEntry({ title: "Zebra", date: undefined }),
      createEntry({ title: "Apple", date: undefined }),
      createEntry({ title: "Mango", date: undefined }),
    ];

    const sorted = sortEntries(entries);

    assert.strictEqual(sorted[0].title, "Apple");
    assert.strictEqual(sorted[1].title, "Mango");
    assert.strictEqual(sorted[2].title, "Zebra");
  });

  it("handles mixed entries with and without dates", () => {
    const entries = [
      createEntry({ title: "Zebra", date: undefined }),
      createEntry({ title: "Old", date: "2024-01-01" }),
      createEntry({ title: "Apple", date: undefined }),
      createEntry({ title: "New", date: "2024-12-31" }),
    ];

    const sorted = sortEntries(entries);

    assert.strictEqual(sorted[0].title, "New");
    assert.strictEqual(sorted[1].title, "Old");
    assert.strictEqual(sorted[2].title, "Apple");
    assert.strictEqual(sorted[3].title, "Zebra");
  });

  it("handles empty array", () => {
    const sorted = sortEntries([]);
    assert.deepStrictEqual(sorted, []);
  });

  it("handles single entry", () => {
    const entries = [createEntry({ title: "Only", date: "2024-01-01" })];
    const sorted = sortEntries(entries);
    assert.strictEqual(sorted.length, 1);
    assert.strictEqual(sorted[0].title, "Only");
  });

  it("does not mutate original array", () => {
    const entries = [
      createEntry({ title: "A", date: "2024-01-01" }),
      createEntry({ title: "B", date: "2024-06-01" }),
    ];

    sortEntries(entries);

    assert.strictEqual(entries[0].title, "A");
    assert.strictEqual(entries[1].title, "B");
  });

  it("handles invalid date strings gracefully", () => {
    const entries = [
      createEntry({ title: "Invalid Date", date: "not-a-date" }),
      createEntry({ title: "No Date", date: undefined }),
    ];

    const sorted = sortEntries(entries);

    assert.strictEqual(sorted.length, 2);
  });
});
