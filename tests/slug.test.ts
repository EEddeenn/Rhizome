import assert from "node:assert";
import { describe, it } from "node:test";
import {
  slugFromPath,
  routeFromSlug,
  getEntryTypeFromSlug,
} from "../src/lib/content/slug";

describe("slug utilities", () => {
  describe("slugFromPath", () => {
    it("extracts slug from content path", () => {
      assert.strictEqual(slugFromPath("content/notes/foo.mdx"), "notes/foo");
      assert.strictEqual(
        slugFromPath("content/articles/2024/paper.mdx"),
        "articles/2024/paper"
      );
    });

    it("handles nested paths", () => {
      assert.strictEqual(slugFromPath("content/notes/a/b/c.mdx"), "notes/a/b/c");
    });

    it("handles windows-style paths", () => {
      assert.strictEqual(slugFromPath("content\\notes\\foo.mdx"), "notes/foo");
    });

    it("throws for paths without content/", () => {
      assert.throws(() => slugFromPath("notes/foo.mdx"), {
        message: "Path does not contain content/: notes/foo.mdx",
      });
    });

    it("handles .md extension", () => {
      assert.strictEqual(slugFromPath("content/notes/foo.md"), "notes/foo");
    });
  });

  describe("routeFromSlug", () => {
    it("prepends slash to slug", () => {
      assert.strictEqual(routeFromSlug("notes/foo"), "/notes/foo");
      assert.strictEqual(routeFromSlug("articles/bar"), "/articles/bar");
    });
  });

  describe("getEntryTypeFromSlug", () => {
    it("returns note for notes/ prefix", () => {
      assert.strictEqual(getEntryTypeFromSlug("notes/foo"), "note");
    });

    it("returns article for articles/ prefix", () => {
      assert.strictEqual(getEntryTypeFromSlug("articles/foo"), "article");
    });

    it("defaults to note for unknown prefix", () => {
      assert.strictEqual(getEntryTypeFromSlug("other/foo"), "note");
    });
  });
});
