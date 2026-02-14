import assert from "node:assert";
import { describe, it } from "node:test";
import { extractBlockIds, assignBlockIdsToHeadings, extractContentWithBlockId } from "../src/lib/content/block-ids";

describe("block-ids", () => {
  describe("extractBlockIds", () => {
    it("extracts simple block ID", () => {
      const content = "Some paragraph content ^abc123";
      const blockIds = extractBlockIds(content);
      
      assert.strictEqual(blockIds.size, 1);
      assert.ok(blockIds.has("abc123"));
    });

    it("extracts multiple block IDs", () => {
      const content = `First paragraph ^first-id

Second paragraph ^second-id

Third paragraph without ID`;
      const blockIds = extractBlockIds(content);
      
      assert.strictEqual(blockIds.size, 2);
      assert.ok(blockIds.has("first-id"));
      assert.ok(blockIds.has("second-id"));
    });

    it("handles block IDs with underscores and hyphens", () => {
      const content = "Content with my_block-id ^my_block-id-123";
      const blockIds = extractBlockIds(content);
      
      assert.strictEqual(blockIds.size, 1);
      assert.ok(blockIds.has("my_block-id-123"));
    });

    it("returns empty map when no block IDs", () => {
      const content = "Just regular content\nNo block IDs here";
      const blockIds = extractBlockIds(content);
      
      assert.strictEqual(blockIds.size, 0);
    });

    it("captures position information", () => {
      const content = "Some text ^abc123";
      const blockIds = extractBlockIds(content);
      
      const info = blockIds.get("abc123");
      assert.ok(info);
      assert.ok(typeof info.position === "number");
      assert.strictEqual(info.line, 0);
    });
  });

  describe("assignBlockIdsToHeadings", () => {
    it("assigns block ID to nearest preceding heading", () => {
      const content = `# Section One

Some content ^block1

# Section Two

More content ^block2`;
      
      const blockIds = extractBlockIds(content);
      const headingMap = assignBlockIdsToHeadings(content, blockIds);
      
      assert.strictEqual(headingMap.get("block1"), "section-one");
      assert.strictEqual(headingMap.get("block2"), "section-two");
    });

    it("handles nested headings", () => {
      const content = `# Main Section

## Subsection

Content here ^subblock`;
      
      const blockIds = extractBlockIds(content);
      const headingMap = assignBlockIdsToHeadings(content, blockIds);
      
      assert.strictEqual(headingMap.get("subblock"), "subsection");
    });

    it("returns empty map when no block IDs", () => {
      const content = `# Heading

No block IDs`;
      
      const blockIds = extractBlockIds(content);
      const headingMap = assignBlockIdsToHeadings(content, blockIds);
      
      assert.strictEqual(headingMap.size, 0);
    });
  });

  describe("extractContentWithBlockId", () => {
    it("extracts single-line content with block ID", () => {
      const content = "Some paragraph content ^abc123\n\nNext paragraph";
      const blockIds = extractBlockIds(content);
      
      const result = extractContentWithBlockId(content, "abc123", blockIds);
      
      assert.strictEqual(result, "Some paragraph content");
    });

    it("returns null for non-existent block ID", () => {
      const content = "Some content";
      const blockIds = extractBlockIds(content);
      
      const result = extractContentWithBlockId(content, "nonexistent", blockIds);
      
      assert.strictEqual(result, null);
    });

    it("extracts content with block ID at end of line", () => {
      const content = `Some paragraph content ^abc123

Next paragraph`;
      const blockIds = extractBlockIds(content);
      
      const result = extractContentWithBlockId(content, "abc123", blockIds);
      
      assert.strictEqual(result, "Some paragraph content");
    });

    it("extracts content until blank line", () => {
      const content = `Line one

Line two ^multiline

Next paragraph`;
      const blockIds = extractBlockIds(content);
      
      const result = extractContentWithBlockId(content, "multiline", blockIds);
      
      assert.strictEqual(result, "Line two");
    });
  });
});
