import assert from "node:assert";
import { describe, it } from "node:test";
import {
  normalizeTitle,
  normalizeTags,
  deriveTitleFromSlug,
} from "../src/lib/content/normalize";

describe("normalize utilities", () => {
  describe("normalizeTitle", () => {
    it("trims whitespace", () => {
      assert.strictEqual(normalizeTitle("  Hello World  "), "hello world");
    });

    it("collapses multiple spaces", () => {
      assert.strictEqual(normalizeTitle("Hello   World"), "hello world");
    });

    it("converts to lowercase", () => {
      assert.strictEqual(normalizeTitle("Hello WORLD"), "hello world");
    });

    it("handles empty string", () => {
      assert.strictEqual(normalizeTitle(""), "");
    });
  });

  describe("normalizeTags", () => {
    it("handles array of tags", () => {
      assert.deepStrictEqual(normalizeTags(["Tag1", "Tag2"]), ["tag1", "tag2"]);
    });

    it("handles comma-separated string", () => {
      assert.deepStrictEqual(normalizeTags("tag1, tag2, tag3"), [
        "tag1",
        "tag2",
        "tag3",
      ]);
    });

    it("handles null/undefined", () => {
      assert.deepStrictEqual(normalizeTags(null), []);
      assert.deepStrictEqual(normalizeTags(undefined), []);
    });

    it("filters empty strings", () => {
      assert.deepStrictEqual(normalizeTags(["tag1", "", "tag2"]), [
        "tag1",
        "tag2",
      ]);
    });

    it("handles empty array", () => {
      assert.deepStrictEqual(normalizeTags([]), []);
    });

    it("handles mixed array with non-strings", () => {
      assert.deepStrictEqual(normalizeTags(["tag1", 123, "tag2"] as unknown[]), [
        "tag1",
        "tag2",
      ]);
    });
  });

  describe("deriveTitleFromSlug", () => {
    it("derives title from simple slug", () => {
      assert.strictEqual(deriveTitleFromSlug("notes/hello-world"), "Hello World");
    });

    it("uses last segment of slug", () => {
      assert.strictEqual(
        deriveTitleFromSlug("notes/2024/my-note"),
        "My Note"
      );
    });

    it("capitalizes first letter of each word", () => {
      assert.strictEqual(
        deriveTitleFromSlug("notes/some-long-title"),
        "Some Long Title"
      );
    });
  });
});
