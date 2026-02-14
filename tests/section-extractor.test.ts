import assert from "node:assert";
import { describe, it } from "node:test";
import { extractSection, extractSectionBySlug, findHeadingIdByText } from "../src/lib/content/section-extractor";
import type { Heading } from "../src/lib/content/types";

describe("section-extractor", () => {
  describe("extractSection", () => {
    it("extracts section content by heading text", () => {
      const content = `# Main Title

Intro content.

## First Section

Section content here.

## Second Section

Other content.`;
      
      const result = extractSection(content, "First Section");
      
      assert.ok(result);
      assert.ok(result.includes("## First Section"));
      assert.ok(result.includes("Section content here."));
      assert.ok(!result.includes("Second Section"));
    });

    it("includes nested subheadings", () => {
      const content = `# Main

## Section

Content here.

### Subsection

More content.

#### Deep subsection

Even more.

## Next Section

Other.`;
      
      const result = extractSection(content, "Section");
      
      assert.ok(result);
      assert.ok(result.includes("### Subsection"));
      assert.ok(result.includes("#### Deep subsection"));
      assert.ok(!result.includes("## Next Section"));
    });

    it("stops at same-level heading", () => {
      const content = `# Main

## Alpha

Alpha content.

## Beta

Beta content.`;
      
      const result = extractSection(content, "Alpha");
      
      assert.ok(result);
      assert.ok(result.includes("Alpha content"));
      assert.ok(!result.includes("Beta"));
    });

    it("returns null for non-existent heading", () => {
      const content = `# Main

Some content.`;
      
      const result = extractSection(content, "Nonexistent");
      
      assert.strictEqual(result, null);
    });

    it("handles case-insensitive matching", () => {
      const content = `# Main

## My Section

Content.`;
      
      const result1 = extractSection(content, "MY SECTION");
      const result2 = extractSection(content, "my section");
      
      assert.ok(result1);
      assert.ok(result2);
    });

    it("handles extra whitespace in heading", () => {
      const content = `# Main

##  My   Section  

Content.`;
      
      const result = extractSection(content, "My Section");
      
      assert.ok(result);
    });

    it("extracts last section to end of content", () => {
      const content = `# Main

## Last Section

Final content here.`;
      
      const result = extractSection(content, "Last Section");
      
      assert.ok(result);
      assert.ok(result.includes("Final content here."));
    });
  });

  describe("extractSectionBySlug", () => {
    it("extracts section by heading slug", () => {
      const content = `# Main

## My Section

Content here.`;
      
      const result = extractSectionBySlug(content, "my-section");
      
      assert.ok(result);
      assert.ok(result.includes("## My Section"));
    });

    it("returns null for non-existent slug", () => {
      const content = `# Main

Some content.`;
      
      const result = extractSectionBySlug(content, "nonexistent");
      
      assert.strictEqual(result, null);
    });
  });

  describe("findHeadingIdByText", () => {
    const headings: Heading[] = [
      { depth: 1, text: "Main Title", id: "main-title" },
      { depth: 2, text: "First Section", id: "first-section" },
      { depth: 2, text: "Second Section", id: "second-section" },
    ];

    it("finds heading ID by exact text", () => {
      const result = findHeadingIdByText(headings, "First Section");
      assert.strictEqual(result, "first-section");
    });

    it("finds heading ID case-insensitively", () => {
      const result = findHeadingIdByText(headings, "FIRST SECTION");
      assert.strictEqual(result, "first-section");
    });

    it("returns undefined for non-existent heading", () => {
      const result = findHeadingIdByText(headings, "Nonexistent");
      assert.strictEqual(result, undefined);
    });

    it("handles extra whitespace", () => {
      const result = findHeadingIdByText(headings, "  First   Section  ");
      assert.strictEqual(result, "first-section");
    });
  });
});
