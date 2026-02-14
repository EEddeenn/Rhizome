import assert from "node:assert";
import { describe, it } from "node:test";
import { classifyLink, parseSlugFromHref } from "../src/lib/content/link-utils";

describe("link-utils", () => {
  describe("classifyLink", () => {
    describe("undefined and empty", () => {
      it("returns all false for undefined", () => {
        const result = classifyLink(undefined);
        assert.deepStrictEqual(result, {
          isExternal: false,
          isAnchor: false,
          isInternalNote: false,
        });
      });

      it("returns all false for empty string", () => {
        const result = classifyLink("");
        assert.deepStrictEqual(result, {
          isExternal: false,
          isAnchor: false,
          isInternalNote: false,
        });
      });
    });

    describe("external links", () => {
      it("identifies http links", () => {
        const result = classifyLink("http://example.com");
        assert.strictEqual(result.isExternal, true);
        assert.strictEqual(result.isAnchor, false);
        assert.strictEqual(result.isInternalNote, false);
      });

      it("identifies https links", () => {
        const result = classifyLink("https://example.com");
        assert.strictEqual(result.isExternal, true);
      });

      it("identifies protocol-relative links", () => {
        const result = classifyLink("//example.com/path");
        assert.strictEqual(result.isExternal, true);
      });

      it("identifies external with notes-like path", () => {
        const result = classifyLink("https://example.com/notes/foo");
        assert.strictEqual(result.isExternal, true);
        assert.strictEqual(result.isInternalNote, false);
      });
    });

    describe("anchor links", () => {
      it("identifies anchor links", () => {
        const result = classifyLink("#section");
        assert.strictEqual(result.isAnchor, true);
        assert.strictEqual(result.isExternal, false);
        assert.strictEqual(result.isInternalNote, false);
      });

      it("identifies double hash anchors", () => {
        const result = classifyLink("##heading");
        assert.strictEqual(result.isAnchor, true);
      });
    });

    describe("internal notes", () => {
      it("identifies notes route", () => {
        const result = classifyLink("/notes/my-note");
        assert.strictEqual(result.isInternalNote, true);
        assert.strictEqual(result.isExternal, false);
        assert.strictEqual(result.isAnchor, false);
      });

      it("identifies articles route", () => {
        const result = classifyLink("/articles/my-article");
        assert.strictEqual(result.isInternalNote, true);
      });

      it("identifies notes with query params", () => {
        const result = classifyLink("/notes/foo?bar=1");
        assert.strictEqual(result.isInternalNote, true);
      });

      it("identifies articles with query params", () => {
        const result = classifyLink("/articles/foo?page=1");
        assert.strictEqual(result.isInternalNote, true);
      });

      it("returns all false for other internal routes", () => {
        const result = classifyLink("/tags/code");
        assert.deepStrictEqual(result, {
          isExternal: false,
          isAnchor: false,
          isInternalNote: false,
        });
      });
    });

    describe("edge cases", () => {
      it("handles unicode in path", () => {
        const result = classifyLink("/notes/日本語ノート");
        assert.strictEqual(result.isInternalNote, true);
      });

      it("handles unicode anchor", () => {
        const result = classifyLink("#日本語");
        assert.strictEqual(result.isAnchor, true);
      });

      it("handles unicode in external URL", () => {
        const result = classifyLink("https://例え.jp/path");
        assert.strictEqual(result.isExternal, true);
      });

      it("handles encoded unicode", () => {
        const result = classifyLink("/notes/%E6%97%A5%E6%9C%AC%E8%AA%9E");
        assert.strictEqual(result.isInternalNote, true);
      });

      it("handles very long href", () => {
        const longPath = "a".repeat(1000);
        const result = classifyLink(`/notes/${longPath}`);
        assert.strictEqual(result.isInternalNote, true);
      });

      it("handles special chars in path", () => {
        const result = classifyLink("/notes/foo-bar_baz.qux");
        assert.strictEqual(result.isInternalNote, true);
      });

      it("handles http in path (not at start)", () => {
        const result = classifyLink("/notes/http-something");
        assert.strictEqual(result.isInternalNote, true);
      });

      it("handles hash in path (not at start)", () => {
        const result = classifyLink("/notes/c#-programming");
        assert.strictEqual(result.isInternalNote, true);
      });

      it("does not match path with leading space", () => {
        const result = classifyLink(" /notes/foo");
        assert.strictEqual(result.isInternalNote, false);
      });

      it("handles trailing hash", () => {
        const result = classifyLink("/notes/foo#");
        assert.strictEqual(result.isInternalNote, true);
      });
    });
  });

  describe("parseSlugFromHref", () => {
    describe("core cases", () => {
      it("parses simple path", () => {
        const result = parseSlugFromHref("/notes/foo");
        assert.deepStrictEqual(result, {
          slug: "notes/foo",
          searchParams: undefined,
        });
      });

      it("parses with single query param", () => {
        const result = parseSlugFromHref("/notes/foo?page=1");
        assert.deepStrictEqual(result, {
          slug: "notes/foo",
          searchParams: { page: "1" },
        });
      });

      it("parses with multiple query params", () => {
        const result = parseSlugFromHref("/notes/foo?a=1&b=2");
        assert.deepStrictEqual(result, {
          slug: "notes/foo",
          searchParams: { a: "1", b: "2" },
        });
      });

      it("parses articles path", () => {
        const result = parseSlugFromHref("/articles/bar");
        assert.deepStrictEqual(result, {
          slug: "articles/bar",
          searchParams: undefined,
        });
      });

      it("parses nested path", () => {
        const result = parseSlugFromHref("/notes/2024/my-note");
        assert.deepStrictEqual(result, {
          slug: "notes/2024/my-note",
          searchParams: undefined,
        });
      });

      it("parses root path", () => {
        const result = parseSlugFromHref("/");
        assert.deepStrictEqual(result, {
          slug: "",
          searchParams: undefined,
        });
      });
    });

    describe("edge cases", () => {
      it("handles unicode in path (percent-encoded)", () => {
        const result = parseSlugFromHref("/notes/日本語");
        assert.strictEqual(result.slug, "notes/%E6%97%A5%E6%9C%AC%E8%AA%9E");
      });

      it("decodes encoded param value", () => {
        const result = parseSlugFromHref("/notes/foo?q=hello%20world");
        assert.deepStrictEqual(result.searchParams, { q: "hello world" });
      });

      it("handles special chars in param key", () => {
        const result = parseSlugFromHref("/notes/foo?pdf-page=5");
        assert.deepStrictEqual(result.searchParams, { "pdf-page": "5" });
      });

      it("handles empty param value", () => {
        const result = parseSlugFromHref("/notes/foo?empty=");
        assert.deepStrictEqual(result.searchParams, { empty: "" });
      });

      it("handles very long path", () => {
        const longPath = "a".repeat(1000);
        const result = parseSlugFromHref(`/notes/${longPath}`);
        assert.strictEqual(result.slug, `notes/${longPath}`);
      });

      it("handles duplicate params (last wins)", () => {
        const result = parseSlugFromHref("/notes/foo?a=1&a=2");
        assert.deepStrictEqual(result.searchParams, { a: "2" });
      });

      it("handles no path with query", () => {
        const result = parseSlugFromHref("/?q=search");
        assert.deepStrictEqual(result, {
          slug: "",
          searchParams: { q: "search" },
        });
      });

      it("handles special chars in slug", () => {
        const result = parseSlugFromHref("/notes/c++-guide");
        assert.strictEqual(result.slug, "notes/c++-guide");
      });
    });
  });
});
