import assert from "node:assert";
import { describe, it } from "node:test";
import {
  extractHeadingPositions,
  findNearestHeading,
  extractSnippet,
  extractLinksWithContext,
} from "../src/lib/content/link-resolver";

describe("backlink context extraction", () => {
  describe("extractHeadingPositions", () => {
    it("extracts headings with positions", () => {
      const content = `# Title

Some content.

## Section A

More content.`;
      
      const headings = extractHeadingPositions(content);
      assert.strictEqual(headings.length, 2);
      assert.strictEqual(headings[0].text, "Title");
      assert.strictEqual(headings[0].depth, 1);
      assert.strictEqual(headings[0].position, 0);
      assert.strictEqual(headings[1].text, "Section A");
      assert.strictEqual(headings[1].depth, 2);
      assert.ok(headings[1].position > 0);
    });

    it("handles h3 through h6", () => {
      const content = `### H3\n#### H4\n##### H5\n###### H6`;
      
      const headings = extractHeadingPositions(content);
      assert.strictEqual(headings.length, 4);
      assert.strictEqual(headings[0].depth, 3);
      assert.strictEqual(headings[1].depth, 4);
      assert.strictEqual(headings[2].depth, 5);
      assert.strictEqual(headings[3].depth, 6);
    });

    it("returns empty array when no headings", () => {
      const content = "Just plain text.\n\nNo headings here.";
      
      const headings = extractHeadingPositions(content);
      assert.strictEqual(headings.length, 0);
    });

    it("handles ATX headings with trailing hash", () => {
      const content = `## Heading ##`;
      
      const headings = extractHeadingPositions(content);
      assert.strictEqual(headings.length, 1);
      assert.strictEqual(headings[0].text, "Heading ##");
    });
  });

  describe("findNearestHeading", () => {
    it("finds heading before link position", () => {
      const headings = [
        { depth: 1, text: "Title", id: "", position: 0 },
        { depth: 2, text: "Section A", id: "", position: 20 },
        { depth: 2, text: "Section B", id: "", position: 60 },
      ];
      
      assert.strictEqual(findNearestHeading(30, headings), "Section A");
      assert.strictEqual(findNearestHeading(70, headings), "Section B");
      assert.strictEqual(findNearestHeading(10, headings), "Title");
    });

    it("returns undefined when link is before all headings", () => {
      const headings = [
        { depth: 1, text: "Title", id: "", position: 50 },
      ];
      
      assert.strictEqual(findNearestHeading(10, headings), undefined);
    });

    it("handles empty headings array", () => {
      assert.strictEqual(findNearestHeading(100, []), undefined);
    });
  });

  describe("extractSnippet", () => {
    it("extracts context around link position", () => {
      const content = "This is some text with a [[Link]] in the middle of the paragraph.";
      const linkPos = content.indexOf("[[Link]]");
      
      const snippet = extractSnippet(content, linkPos, 8);
      assert.ok(snippet.includes("with a"));
      assert.ok(snippet.includes("in the"));
    });

    it("adds ellipsis for truncated content", () => {
      const longText = "A".repeat(200) + " [[Link]] " + "B".repeat(200);
      const linkPos = longText.indexOf("[[Link]]");
      
      const snippet = extractSnippet(longText, linkPos, 8);
      assert.ok(snippet.startsWith("..."));
      assert.ok(snippet.endsWith("..."));
    });

    it("does not add leading ellipsis at start of content", () => {
      const content = "[[Link]] is at the start.";
      const linkPos = 0;
      
      const snippet = extractSnippet(content, linkPos, 8);
      assert.ok(!snippet.startsWith("..."));
    });

    it("strips wiki-link syntax from snippet", () => {
      const content = "See [[Some Note|alias]] for more info.";
      const linkPos = content.indexOf("[[Some Note|alias]]");
      
      const snippet = extractSnippet(content, linkPos, 20);
      assert.ok(!snippet.includes("[["));
      assert.ok(!snippet.includes("]]"));
      assert.ok(snippet.includes("alias"));
    });

    it("strips markdown link syntax from snippet", () => {
      const content = "Check out [this page](/notes/example) for details.";
      const linkPos = content.indexOf("[this page]");
      
      const snippet = extractSnippet(content, linkPos, 11);
      assert.ok(!snippet.includes("]("));
      assert.ok(snippet.includes("this page"));
    });

    it("removes markdown formatting characters", () => {
      const content = "Here is **bold** and *italic* with a [[Link]].";
      const linkPos = content.indexOf("[[Link]]");
      
      const snippet = extractSnippet(content, linkPos, 8);
      assert.ok(!snippet.includes("**"));
      assert.ok(!snippet.includes("*"));
    });
  });

  describe("extractLinksWithContext", () => {
    it("extracts wiki links with position and context", () => {
      const content = `# My Note

Some introductory text.

## Related Notes

Check out [[Another Note]] for more details.`;
      
      const links = extractLinksWithContext(content);
      assert.strictEqual(links.length, 1);
      assert.strictEqual(links[0].title, "Another Note");
      assert.strictEqual(links[0].heading, "Related Notes");
      assert.ok(links[0].snippet.length > 0);
      assert.ok(links[0].position > 0);
    });

    it("handles multiple links", () => {
      const content = `Link to [[Note A]] and also [[Note B|display text]].`;
      
      const links = extractLinksWithContext(content);
      assert.strictEqual(links.length, 2);
      assert.strictEqual(links[0].title, "Note A");
      assert.strictEqual(links[1].title, "Note B");
      assert.strictEqual(links[1].alias, "display text");
    });

    it("skips links inside code blocks", () => {
      const content = `Here is some code:

\`\`\`
Check out [[Not A Link]] in code
\`\`\`

Real link: [[Actual Link]]`;
      
      const links = extractLinksWithContext(content);
      assert.strictEqual(links.length, 1);
      assert.strictEqual(links[0].title, "Actual Link");
    });

    it("skips links inside inline code", () => {
      const content = "Use `[[Not Extracted]]` syntax, but [[Extracted]] is real.";
      
      const links = extractLinksWithContext(content);
      assert.strictEqual(links.length, 1);
      assert.strictEqual(links[0].title, "Extracted");
    });

    it("associates correct heading with each link", () => {
      const content = `# Main Title

[[First Link]]

## Section One

[[Second Link]]

## Section Two

[[Third Link]]`;
      
      const links = extractLinksWithContext(content);
      assert.strictEqual(links.length, 3);
      assert.strictEqual(links[0].heading, "Main Title");
      assert.strictEqual(links[1].heading, "Section One");
      assert.strictEqual(links[2].heading, "Section Two");
    });

    it("returns empty array when no links", () => {
      const content = "Just some text with no wiki links.";
      
      const links = extractLinksWithContext(content);
      assert.strictEqual(links.length, 0);
    });
  });
});
