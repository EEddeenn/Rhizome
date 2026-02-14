import assert from "node:assert";
import { describe, it } from "node:test";
import { createWikiLinkResolver } from "../src/lib/content/wiki-link-resolver";
import type { Manifest } from "../src/lib/content/types";

function createManifest(entries: Array<{ title: string; route: string }>): Manifest {
  return entries.map((e) => ({
    title: e.title,
    slug: e.route.replace(/^\//, ""),
    route: e.route,
    sourcePath: `content/${e.route.replace(/^\//, "")}.mdx`,
    type: "note" as const,
    tags: [],
  }));
}

describe("wiki-link-resolver", () => {
  describe("createWikiLinkResolver", () => {
    describe("core cases", () => {
      it("resolves known title", () => {
        const manifest = createManifest([
          { title: "My Note", route: "/notes/my-note" },
        ]);
        const resolver = createWikiLinkResolver(manifest);
        const result = resolver("My Note");
        assert.strictEqual(result.route, "/notes/my-note");
        assert.strictEqual(result.exists, true);
      });

      it("resolves case-insensitively (lowercase)", () => {
        const manifest = createManifest([
          { title: "My Note", route: "/notes/my-note" },
        ]);
        const resolver = createWikiLinkResolver(manifest);
        assert.strictEqual(resolver("my note").route, "/notes/my-note");
      });

      it("resolves case-insensitively (uppercase)", () => {
        const manifest = createManifest([
          { title: "My Note", route: "/notes/my-note" },
        ]);
        const resolver = createWikiLinkResolver(manifest);
        assert.strictEqual(resolver("MY NOTE").route, "/notes/my-note");
      });

      it("returns fallback for unknown title", () => {
        const manifest = createManifest([
          { title: "My Note", route: "/notes/my-note" },
        ]);
        const resolver = createWikiLinkResolver(manifest);
        const result = resolver("Unknown");
        assert.strictEqual(result.route, "/notes/unknown");
        assert.strictEqual(result.exists, false);
      });

      it("slugifies fallback with spaces", () => {
        const manifest = createManifest([]);
        const resolver = createWikiLinkResolver(manifest);
        assert.strictEqual(resolver("Some New Note").route, "/notes/some-new-note");
      });

      it("returns fallback for empty manifest", () => {
        const manifest = createManifest([]);
        const resolver = createWikiLinkResolver(manifest);
        assert.strictEqual(resolver("Any Title").route, "/notes/any-title");
      });

      it("passes anchor through", () => {
        const manifest = createManifest([
          { title: "My Note", route: "/notes/my-note" },
        ]);
        const resolver = createWikiLinkResolver(manifest);
        const result = resolver("My Note", "section-heading");
        assert.strictEqual(result.route, "/notes/my-note");
        assert.strictEqual(result.anchor, "section-heading");
      });

      it("handles block ID anchor", () => {
        const manifest = createManifest([
          { title: "My Note", route: "/notes/my-note" },
        ]);
        const resolver = createWikiLinkResolver(manifest);
        const result = resolver("My Note", "^abc123");
        assert.strictEqual(result.route, "/notes/my-note");
        assert.strictEqual(result.anchor, "^abc123");
      });
    });

    describe("multiple entries", () => {
      it("resolves different titles correctly", () => {
        const manifest = createManifest([
          { title: "Note One", route: "/notes/note-one" },
          { title: "Note Two", route: "/notes/note-two" },
          { title: "My Article", route: "/articles/my-article" },
        ]);
        const resolver = createWikiLinkResolver(manifest);
        assert.strictEqual(resolver("Note One").route, "/notes/note-one");
        assert.strictEqual(resolver("Note Two").route, "/notes/note-two");
        assert.strictEqual(resolver("My Article").route, "/articles/my-article");
      });

      it("last entry wins for duplicate titles", () => {
        const manifest = createManifest([
          { title: "Duplicate", route: "/notes/first" },
          { title: "Duplicate", route: "/notes/second" },
        ]);
        const resolver = createWikiLinkResolver(manifest);
        assert.strictEqual(resolver("Duplicate").route, "/notes/second");
      });
    });

    describe("edge cases", () => {
      it("handles unicode title in manifest", () => {
        const manifest = createManifest([
          { title: "日本語", route: "/notes/japanese" },
        ]);
        const resolver = createWikiLinkResolver(manifest);
        assert.strictEqual(resolver("日本語").route, "/notes/japanese");
      });

      it("handles unicode title fallback", () => {
        const manifest = createManifest([]);
        const resolver = createWikiLinkResolver(manifest);
        const result = resolver("未知");
        assert.strictEqual(result.route, "/notes/未知");
      });

      it("normalizes extra spaces in title", () => {
        const manifest = createManifest([
          { title: "My Note", route: "/notes/my-note" },
        ]);
        const resolver = createWikiLinkResolver(manifest);
        assert.strictEqual(resolver("My   Note").route, "/notes/my-note");
      });

      it("normalizes leading/trailing spaces", () => {
        const manifest = createManifest([
          { title: "My Note", route: "/notes/my-note" },
        ]);
        const resolver = createWikiLinkResolver(manifest);
        assert.strictEqual(resolver("  My Note  ").route, "/notes/my-note");
      });

      it("handles special chars in fallback", () => {
        const manifest = createManifest([]);
        const resolver = createWikiLinkResolver(manifest);
        assert.strictEqual(resolver("C++ Guide").route, "/notes/c++-guide");
      });

      it("resolves special chars in manifest title", () => {
        const manifest = createManifest([
          { title: "C++ Guide", route: "/notes/cpp-guide" },
        ]);
        const resolver = createWikiLinkResolver(manifest);
        assert.strictEqual(resolver("C++ Guide").route, "/notes/cpp-guide");
      });

      it("handles very long title", () => {
        const longTitle = "A".repeat(1000);
        const manifest = createManifest([]);
        const resolver = createWikiLinkResolver(manifest);
        const result = resolver(longTitle);
        assert.strictEqual(result.route, `/notes/${longTitle.toLowerCase()}`);
      });

      it("handles empty title", () => {
        const manifest = createManifest([]);
        const resolver = createWikiLinkResolver(manifest);
        assert.strictEqual(resolver("").route, "/notes/");
      });

      it("returns route with leading slash", () => {
        const manifest = createManifest([
          { title: "Note", route: "/notes/foo" },
        ]);
        const resolver = createWikiLinkResolver(manifest);
        const result = resolver("Note");
        assert.ok(result.route.startsWith("/"));
      });

      it("resolves article routes correctly", () => {
        const manifest = createManifest([
          { title: "My Article", route: "/articles/my-article" },
        ]);
        const resolver = createWikiLinkResolver(manifest);
        assert.strictEqual(resolver("My Article").route, "/articles/my-article");
      });
    });

    describe("whitespace normalization", () => {
      it("normalizes tabs to spaces", () => {
        const manifest = createManifest([
          { title: "A B", route: "/notes/ab" },
        ]);
        const resolver = createWikiLinkResolver(manifest);
        assert.strictEqual(resolver("A\tB").route, "/notes/ab");
      });

      it("normalizes mixed whitespace", () => {
        const manifest = createManifest([
          { title: "Hello World", route: "/notes/hello-world" },
        ]);
        const resolver = createWikiLinkResolver(manifest);
        assert.strictEqual(resolver("Hello  \t  World").route, "/notes/hello-world");
      });
    });
  });
});
