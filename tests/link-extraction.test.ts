import assert from "node:assert";
import { describe, it } from "node:test";
import {
  extractWikiLinks,
  extractMarkdownInternalRoutes,
  routeToSlug,
  resolveRoutesToSlugs,
  resolveWikiLinksToSlugs,
  buildTitleIndex,
} from "../src/lib/content/link-extraction";
import { extractHeadings, extractPlainText } from "../src/lib/content/content-extraction";

describe("link extraction utilities", () => {
  describe("extractWikiLinks", () => {
    it("extracts simple wiki links", () => {
      const md = "See [[Some Note]] for more.";
      const links = extractWikiLinks(md);
      assert.strictEqual(links.length, 1);
      assert.deepStrictEqual(links[0], {
        raw: "[[Some Note]]",
        title: "Some Note",
        alias: undefined,
        anchor: undefined,
        isBlockId: false,
        isEmbed: false,
      });
    });

    it("extracts wiki links with aliases", () => {
      const md = "Check out [[Some Note|this link]].";
      const links = extractWikiLinks(md);
      assert.strictEqual(links.length, 1);
      assert.deepStrictEqual(links[0], {
        raw: "[[Some Note|this link]]",
        title: "Some Note",
        alias: "this link",
        anchor: undefined,
        isBlockId: false,
        isEmbed: false,
      });
    });

    it("extracts wiki links with heading anchor", () => {
      const md = "See [[Note#Section]] for more.";
      const links = extractWikiLinks(md);
      assert.strictEqual(links.length, 1);
      assert.deepStrictEqual(links[0], {
        raw: "[[Note#Section]]",
        title: "Note",
        alias: undefined,
        anchor: "Section",
        isBlockId: false,
        isEmbed: false,
      });
    });

    it("extracts wiki links with block ID anchor", () => {
      const md = "See [[Note#^abc123]] for more.";
      const links = extractWikiLinks(md);
      assert.strictEqual(links.length, 1);
      assert.deepStrictEqual(links[0], {
        raw: "[[Note#^abc123]]",
        title: "Note",
        alias: undefined,
        anchor: "^abc123",
        isBlockId: true,
        isEmbed: false,
      });
    });

    it("extracts wiki links with anchor and alias", () => {
      const md = "See [[Note#Section|my link]] for more.";
      const links = extractWikiLinks(md);
      assert.strictEqual(links.length, 1);
      assert.deepStrictEqual(links[0], {
        raw: "[[Note#Section|my link]]",
        title: "Note",
        alias: "my link",
        anchor: "Section",
        isBlockId: false,
        isEmbed: false,
      });
    });

    it("extracts embed wiki links", () => {
      const md = "Here is ![[Embedded Note]] content.";
      const links = extractWikiLinks(md);
      assert.strictEqual(links.length, 1);
      assert.deepStrictEqual(links[0], {
        raw: "![[Embedded Note]]",
        title: "Embedded Note",
        alias: undefined,
        anchor: undefined,
        isBlockId: false,
        isEmbed: true,
      });
    });

    it("extracts multiple wiki links", () => {
      const md = "Link to [[Note A]] and [[Note B|B]].";
      const links = extractWikiLinks(md);
      assert.strictEqual(links.length, 2);
      assert.strictEqual(links[0].title, "Note A");
      assert.strictEqual(links[1].title, "Note B");
    });

    it("returns empty array when no links", () => {
      const md = "No links here.";
      assert.strictEqual(extractWikiLinks(md).length, 0);
    });
  });

  describe("extractMarkdownInternalRoutes", () => {
    it("extracts internal note routes", () => {
      const md = "See [note](/notes/foo) for info.";
      assert.deepStrictEqual(extractMarkdownInternalRoutes(md), ["/notes/foo"]);
    });

    it("extracts internal article routes", () => {
      const md = "Read [article](/articles/bar).";
      assert.deepStrictEqual(extractMarkdownInternalRoutes(md), [
        "/articles/bar",
      ]);
    });

    it("ignores external links", () => {
      const md = "External [link](https://example.com).";
      assert.strictEqual(extractMarkdownInternalRoutes(md).length, 0);
    });

    it("ignores relative links", () => {
      const md = "See [section](#section) or [page](page.html).";
      assert.strictEqual(extractMarkdownInternalRoutes(md).length, 0);
    });

    it("extracts routes with query params", () => {
      const md = "See [page 5](/notes/foo?pdfPage=5).";
      assert.deepStrictEqual(extractMarkdownInternalRoutes(md), ["/notes/foo?pdfPage=5"]);
    });
  });

  describe("routeToSlug", () => {
    it("converts route to slug", () => {
      assert.strictEqual(routeToSlug("/notes/foo"), "notes/foo");
      assert.strictEqual(routeToSlug("/articles/bar"), "articles/bar");
    });

    it("strips query params from route", () => {
      assert.strictEqual(routeToSlug("/notes/foo?pdfPage=5"), "notes/foo");
      assert.strictEqual(routeToSlug("/articles/bar?a=1&b=2"), "articles/bar");
    });
  });

  describe("resolveRoutesToSlugs", () => {
    it("converts routes to slugs", () => {
      assert.deepStrictEqual(
        resolveRoutesToSlugs(["/notes/a", "/articles/b"]),
        ["notes/a", "articles/b"]
      );
    });
  });

  describe("buildTitleIndex and resolveWikiLinksToSlugs", () => {
    it("builds index and resolves wiki links", () => {
      const entries = [
        { title: "Note One", slug: "notes/note-one" },
        { title: "Note Two", slug: "notes/note-two" },
      ];
      const { index, duplicates } = buildTitleIndex(entries);
      const links = [{ raw: "[[note one]]", title: "Note One" }];

      const result = resolveWikiLinksToSlugs(links, index);
      assert.deepStrictEqual(result.slugs, ["notes/note-one"]);
      assert.strictEqual(result.unresolved.length, 0);
      assert.strictEqual(duplicates.length, 0);
    });

    it("reports unresolved links", () => {
      const entries = [{ title: "Note One", slug: "notes/note-one" }];
      const { index } = buildTitleIndex(entries);
      const links = [{ raw: "[[Unknown Note]]", title: "Unknown Note" }];

      const result = resolveWikiLinksToSlugs(links, index);
      assert.strictEqual(result.slugs.length, 0);
      assert.strictEqual(result.unresolved.length, 1);
    });

    it("normalizes case for matching", () => {
      const entries = [{ title: "Note One", slug: "notes/note-one" }];
      const { index } = buildTitleIndex(entries);
      const links = [{ raw: "[[NOTE ONE]]", title: "NOTE ONE" }];

      const result = resolveWikiLinksToSlugs(links, index);
      assert.deepStrictEqual(result.slugs, ["notes/note-one"]);
    });

    it("reports duplicate titles", () => {
      const entries = [
        { title: "Same Title", slug: "notes/first" },
        { title: "Same Title", slug: "notes/second" },
        { title: "Same Title", slug: "notes/third" },
      ];
      const { index, duplicates } = buildTitleIndex(entries);
      
      assert.strictEqual(duplicates.length, 1);
      assert.strictEqual(duplicates[0].title, "same title");
      assert.deepStrictEqual(duplicates[0].slugs, ["notes/first", "notes/second", "notes/third"]);
      assert.strictEqual(index.size, 1);
      assert.strictEqual(index.get("same title"), "notes/first");
    });
  });

  describe("extractHeadings", () => {
    it("extracts headings with depth", () => {
      const md = "# Title\n\n## Section\n\n### Subsection";
      const headings = extractHeadings(md);
      assert.strictEqual(headings.length, 3);
      assert.strictEqual(headings[0].depth, 1);
      assert.strictEqual(headings[0].text, "Title");
      assert.strictEqual(headings[1].depth, 2);
      assert.strictEqual(headings[2].depth, 3);
    });

    it("generates slugs for headings", () => {
      const md = "# Hello World";
      const headings = extractHeadings(md);
      assert.strictEqual(headings[0].id, "hello-world");
    });
  });

  describe("extractPlainText", () => {
    it("extracts text from markdown", () => {
      const md = "# Title\n\nThis is **bold** text.";
      const text = extractPlainText(md);
      assert.ok(text.includes("Title"));
      assert.ok(text.includes("text"));
    });

    it("joins text with spaces", () => {
      const md = "First paragraph.\n\nSecond paragraph.";
      const text = extractPlainText(md);
      assert.strictEqual(text, "First paragraph. Second paragraph.");
    });
  });
});
