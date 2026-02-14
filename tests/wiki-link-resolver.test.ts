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
        assert.strictEqual(resolver("My Note"), "/notes/my-note");
      });

      it("resolves case-insensitively (lowercase)", () => {
        const manifest = createManifest([
          { title: "My Note", route: "/notes/my-note" },
        ]);
        const resolver = createWikiLinkResolver(manifest);
        assert.strictEqual(resolver("my note"), "/notes/my-note");
      });

      it("resolves case-insensitively (uppercase)", () => {
        const manifest = createManifest([
          { title: "My Note", route: "/notes/my-note" },
        ]);
        const resolver = createWikiLinkResolver(manifest);
        assert.strictEqual(resolver("MY NOTE"), "/notes/my-note");
      });

      it("returns fallback for unknown title", () => {
        const manifest = createManifest([
          { title: "My Note", route: "/notes/my-note" },
        ]);
        const resolver = createWikiLinkResolver(manifest);
        assert.strictEqual(resolver("Unknown"), "/notes/unknown");
      });

      it("slugifies fallback with spaces", () => {
        const manifest = createManifest([]);
        const resolver = createWikiLinkResolver(manifest);
        assert.strictEqual(resolver("Some New Note"), "/notes/some-new-note");
      });

      it("returns fallback for empty manifest", () => {
        const manifest = createManifest([]);
        const resolver = createWikiLinkResolver(manifest);
        assert.strictEqual(resolver("Any Title"), "/notes/any-title");
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
        assert.strictEqual(resolver("Note One"), "/notes/note-one");
        assert.strictEqual(resolver("Note Two"), "/notes/note-two");
        assert.strictEqual(resolver("My Article"), "/articles/my-article");
      });

      it("last entry wins for duplicate titles", () => {
        const manifest = createManifest([
          { title: "Duplicate", route: "/notes/first" },
          { title: "Duplicate", route: "/notes/second" },
        ]);
        const resolver = createWikiLinkResolver(manifest);
        assert.strictEqual(resolver("Duplicate"), "/notes/second");
      });
    });

    describe("edge cases", () => {
      it("handles unicode title in manifest", () => {
        const manifest = createManifest([
          { title: "日本語", route: "/notes/japanese" },
        ]);
        const resolver = createWikiLinkResolver(manifest);
        assert.strictEqual(resolver("日本語"), "/notes/japanese");
      });

      it("handles unicode title fallback", () => {
        const manifest = createManifest([]);
        const resolver = createWikiLinkResolver(manifest);
        const result = resolver("未知");
        assert.strictEqual(result, "/notes/未知");
      });

      it("normalizes extra spaces in title", () => {
        const manifest = createManifest([
          { title: "My Note", route: "/notes/my-note" },
        ]);
        const resolver = createWikiLinkResolver(manifest);
        assert.strictEqual(resolver("My   Note"), "/notes/my-note");
      });

      it("normalizes leading/trailing spaces", () => {
        const manifest = createManifest([
          { title: "My Note", route: "/notes/my-note" },
        ]);
        const resolver = createWikiLinkResolver(manifest);
        assert.strictEqual(resolver("  My Note  "), "/notes/my-note");
      });

      it("handles special chars in fallback", () => {
        const manifest = createManifest([]);
        const resolver = createWikiLinkResolver(manifest);
        assert.strictEqual(resolver("C++ Guide"), "/notes/c++-guide");
      });

      it("resolves special chars in manifest title", () => {
        const manifest = createManifest([
          { title: "C++ Guide", route: "/notes/cpp-guide" },
        ]);
        const resolver = createWikiLinkResolver(manifest);
        assert.strictEqual(resolver("C++ Guide"), "/notes/cpp-guide");
      });

      it("handles very long title", () => {
        const longTitle = "A".repeat(1000);
        const manifest = createManifest([]);
        const resolver = createWikiLinkResolver(manifest);
        const result = resolver(longTitle);
        assert.strictEqual(result, `/notes/${longTitle.toLowerCase()}`);
      });

      it("handles empty title", () => {
        const manifest = createManifest([]);
        const resolver = createWikiLinkResolver(manifest);
        assert.strictEqual(resolver(""), "/notes/");
      });

      it("returns route with leading slash", () => {
        const manifest = createManifest([
          { title: "Note", route: "/notes/foo" },
        ]);
        const resolver = createWikiLinkResolver(manifest);
        const result = resolver("Note");
        assert.ok(result.startsWith("/"));
      });

      it("resolves article routes correctly", () => {
        const manifest = createManifest([
          { title: "My Article", route: "/articles/my-article" },
        ]);
        const resolver = createWikiLinkResolver(manifest);
        assert.strictEqual(resolver("My Article"), "/articles/my-article");
      });
    });

    describe("whitespace normalization", () => {
      it("normalizes tabs to spaces", () => {
        const manifest = createManifest([
          { title: "A B", route: "/notes/ab" },
        ]);
        const resolver = createWikiLinkResolver(manifest);
        assert.strictEqual(resolver("A\tB"), "/notes/ab");
      });

      it("normalizes mixed whitespace", () => {
        const manifest = createManifest([
          { title: "Hello World", route: "/notes/hello-world" },
        ]);
        const resolver = createWikiLinkResolver(manifest);
        assert.strictEqual(resolver("Hello  \t  World"), "/notes/hello-world");
      });
    });
  });
});
