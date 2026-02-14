import assert from "node:assert";
import { describe, it } from "node:test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { remarkObsidianCallouts } from "../src/lib/content/remark-obsidian-callouts";
import { visit } from "unist-util-visit";

interface MdxJsxAttribute {
  type: "mdxJsxAttribute";
  name: string;
  value: string | null;
}

interface MdxJsxFlowElement {
  type: "mdxJsxFlowElement";
  name: string;
  attributes: MdxJsxAttribute[];
}

function getCalloutNode(md: string): MdxJsxFlowElement | null {
  const processor = unified().use(remarkParse).use(remarkObsidianCallouts);
  const tree = processor.parse(md);
  processor.runSync(tree);

  let calloutNode: MdxJsxFlowElement | null = null;
  visit(tree, "mdxJsxFlowElement", (node: any) => {
    if (node.name === "Callout") {
      calloutNode = node as MdxJsxFlowElement;
    }
  });

  return calloutNode;
}

function getAttribute(node: MdxJsxFlowElement, name: string): string | undefined {
  const attr = node.attributes.find((a) => a.name === name);
  return attr?.value ?? undefined;
}

describe("remarkObsidianCallouts", () => {
  describe("basic callout parsing", () => {
    it("converts [!note] callout", () => {
      const md = `> [!note] This is a note
> With some content`;

      const callout = getCalloutNode(md);
      assert.ok(callout !== null);
      assert.strictEqual(getAttribute(callout, "type"), "note");
    });

    it("converts [!tip] callout", () => {
      const md = `> [!tip] Pro tip here`;

      const callout = getCalloutNode(md);
      assert.ok(callout !== null);
      assert.strictEqual(getAttribute(callout, "type"), "tip");
    });

    it("converts [!warning] callout", () => {
      const md = `> [!warning] Be careful`;

      const callout = getCalloutNode(md);
      assert.ok(callout !== null);
      assert.strictEqual(getAttribute(callout, "type"), "warning");
    });

    it("converts [!danger] callout", () => {
      const md = `> [!danger] Critical issue`;

      const callout = getCalloutNode(md);
      assert.ok(callout !== null);
      assert.strictEqual(getAttribute(callout, "type"), "danger");
    });

    it("converts [!info] callout", () => {
      const md = `> [!info] For your information`;

      const callout = getCalloutNode(md);
      assert.ok(callout !== null);
      assert.strictEqual(getAttribute(callout, "type"), "info");
    });
  });

  describe("type aliases", () => {
    it("maps [!error] to danger", () => {
      const md = `> [!error] Something went wrong`;

      const callout = getCalloutNode(md);
      assert.ok(callout !== null);
      assert.strictEqual(getAttribute(callout, "type"), "danger");
    });

    it("maps [!bug] to danger", () => {
      const md = `> [!bug] Found a bug`;

      const callout = getCalloutNode(md);
      assert.ok(callout !== null);
      assert.strictEqual(getAttribute(callout, "type"), "danger");
    });

    it("maps [!quote] to note", () => {
      const md = `> [!quote] A famous quote`;

      const callout = getCalloutNode(md);
      assert.ok(callout !== null);
      assert.strictEqual(getAttribute(callout, "type"), "note");
    });

    it("maps [!example] to note", () => {
      const md = `> [!example] Here's an example`;

      const callout = getCalloutNode(md);
      assert.ok(callout !== null);
      assert.strictEqual(getAttribute(callout, "type"), "note");
    });

    it("maps unknown types to note", () => {
      const md = `> [!custom] Custom type`;

      const callout = getCalloutNode(md);
      assert.ok(callout !== null);
      assert.strictEqual(getAttribute(callout, "type"), "note");
    });
  });

  describe("title handling", () => {
    it("includes title attribute when title is present", () => {
      const md = `> [!note] My Title
> Content here`;

      const callout = getCalloutNode(md);
      assert.ok(callout !== null);
      assert.strictEqual(getAttribute(callout, "title"), "My Title");
    });

    it("handles callout without title", () => {
      const md = `> [!note]
> Just content, no title`;

      const callout = getCalloutNode(md);
      assert.ok(callout !== null);
      assert.strictEqual(getAttribute(callout, "title"), undefined);
    });

    it("handles title with special characters", () => {
      const md = `> [!warning] Warning: Read this!`;

      const callout = getCalloutNode(md);
      assert.ok(callout !== null);
      assert.strictEqual(getAttribute(callout, "title"), "Warning: Read this!");
    });
  });

  describe("content handling", () => {
    it("preserves multiline content", () => {
      const md = `> [!note] Title
> First line
> Second line
> Third line`;

      const processor = unified().use(remarkParse).use(remarkObsidianCallouts);
      const tree = processor.parse(md);
      processor.runSync(tree);

      let foundFirst = false, foundSecond = false, foundThird = false;
      visit(tree, "text", (node: any) => {
        if (node.value.includes("First line")) foundFirst = true;
        if (node.value.includes("Second line")) foundSecond = true;
        if (node.value.includes("Third line")) foundThird = true;
      });

      assert.ok(foundFirst);
      assert.ok(foundSecond);
      assert.ok(foundThird);
    });

    it("preserves inline formatting in content", () => {
      const md = `> [!tip] Pro tip
> Use **bold** and *italic* text`;

      const processor = unified().use(remarkParse).use(remarkObsidianCallouts);
      const tree = processor.parse(md);
      processor.runSync(tree);

      let hasStrong = false, hasEmphasis = false;
      visit(tree, "strong", () => { hasStrong = true; });
      visit(tree, "emphasis", () => { hasEmphasis = true; });

      assert.ok(hasStrong);
      assert.ok(hasEmphasis);
    });

    it("does not convert regular blockquotes", () => {
      const md = `> This is just a regular blockquote
> with no callout syntax`;

      const callout = getCalloutNode(md);
      assert.strictEqual(callout, null);
    });
  });

  describe("case insensitivity", () => {
    it("handles uppercase type", () => {
      const md = `> [!NOTE] Uppercase type`;

      const callout = getCalloutNode(md);
      assert.ok(callout !== null);
      assert.strictEqual(getAttribute(callout, "type"), "note");
    });

    it("handles mixed case type", () => {
      const md = `> [!WaRnInG] Mixed case`;

      const callout = getCalloutNode(md);
      assert.ok(callout !== null);
      assert.strictEqual(getAttribute(callout, "type"), "warning");
    });
  });

  describe("edge cases", () => {
    it("handles callout at start of document", () => {
      const md = `> [!note] First thing`;

      const callout = getCalloutNode(md);
      assert.ok(callout !== null);
    });

    it("handles callout after other content", () => {
      const md = `Some text before.

> [!tip] A tip follows`;

      const callout = getCalloutNode(md);
      assert.ok(callout !== null);
    });

    it("handles multiple callouts in sequence", () => {
      const md = `> [!note] First callout

> [!warning] Second callout`;

      const processor = unified().use(remarkParse).use(remarkObsidianCallouts);
      const tree = processor.parse(md);
      processor.runSync(tree);

      const callouts: string[] = [];
      visit(tree, "mdxJsxFlowElement", (node: any) => {
        if (node.name === "Callout") {
          const typeAttr = node.attributes.find((a: any) => a.name === "type");
          callouts.push(typeAttr?.value);
        }
      });

      assert.strictEqual(callouts.length, 2);
      assert.strictEqual(callouts[0], "note");
      assert.strictEqual(callouts[1], "warning");
    });
  });

  describe("fold handling", () => {
    it("handles fold open marker", () => {
      const md = `> [!note]+ Expandable`;

      const callout = getCalloutNode(md);
      assert.ok(callout !== null);
      assert.strictEqual(getAttribute(callout, "fold"), "open");
    });

    it("handles fold closed marker", () => {
      const md = `> [!note]- Collapsed`;

      const callout = getCalloutNode(md);
      assert.ok(callout !== null);
      assert.strictEqual(getAttribute(callout, "fold"), "closed");
    });
  });
});
