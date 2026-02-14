import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Root, Blockquote, Paragraph, Text, Content } from "mdast";

/**
 * Obsidian callout syntax:
 *   > [!NOTE] Optional title
 *   > body...
 *
 * Also supports fold markers:
 *   > [!NOTE]+ Title   (open)
 *   > [!NOTE]- Title   (closed)
 */
const CALLOUT_PATTERN = /^\s*\[!([A-Za-z0-9_-]+)\]([+-])?\s*(.*)$/;

const CALLOUT_TYPE_MAP: Record<string, string> = {
  note: "note",
  tip: "tip",
  warning: "warning",
  danger: "danger",
  error: "danger",
  bug: "danger",
  info: "info",
  quote: "note",
  example: "note",
  question: "note",
  success: "tip",
  failure: "danger",
  check: "tip",
  abstract: "note",
  todo: "note",
};

function isEmptyParagraph(n: Content): boolean {
  if (n.type !== "paragraph") return false;
  const p = n as Paragraph;
  if (!p.children || p.children.length === 0) return true;

  // paragraph with a single whitespace text node
  if (p.children.length === 1 && p.children[0].type === "text") {
    const v = ((p.children[0] as Text).value ?? "").trim();
    return v.length === 0;
  }

  return false;
}

export const remarkObsidianCallouts: Plugin<[], Root> = () => {
  return (tree: Root) => {
    visit(tree, "blockquote", (node, index, parent) => {
      // IMPORTANT: unist-util-visit types use number | undefined for index
      if (index === undefined || !parent) return;

      const bq = node as Blockquote;

      const first = bq.children[0];
      if (!first || first.type !== "paragraph") return;

      const firstP = first as Paragraph;
      const firstChild = firstP.children?.[0];
      if (!firstChild || firstChild.type !== "text") return;

      const raw = ((firstChild as Text).value ?? "").toString();
      const [line0, ...restLines] = raw.split(/\n/);

      const m = line0.match(CALLOUT_PATTERN);
      if (!m) return;

      const rawType = m[1];
      const foldFlag = m[2] ?? ""; // "+" | "-" | ""
      const title = (m[3] ?? "").trim();

      const calloutType =
        CALLOUT_TYPE_MAP[rawType.toLowerCase()] ?? "note";

      const children = bq.children;

      const rewrittenFirst = children[0] as Paragraph;
      const rewrittenFirstText = rewrittenFirst.children?.[0] as Text | undefined;

      const tail = restLines.join("\n").replace(/^\s+/, "");
      if (tail) {
        // Keep the remaining lines as the first text node value
        if (rewrittenFirstText && rewrittenFirstText.type === "text") {
          rewrittenFirstText.value = tail;
        } else {
          // Unlikely, but be safe
          rewrittenFirst.children.unshift({ type: "text", value: tail } as Text);
        }
      } else {
        // Remove the first text node (the marker). If paragraph becomes empty, it will be filtered out below.
        rewrittenFirst.children.shift();
      }

      // Drop empty paragraphs (e.g., a blank line `>` right after the marker)
      const normalizedChildren = children.filter((c) => !isEmptyParagraph(c));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const calloutNode: any = {
        type: "mdxJsxFlowElement",
        name: "Callout",
        attributes: [
          { type: "mdxJsxAttribute", name: "type", value: calloutType },
          ...(title
            ? [{ type: "mdxJsxAttribute", name: "title", value: title }]
            : []),
          ...(foldFlag
            ? [
                {
                  type: "mdxJsxAttribute",
                  name: "fold",
                  value: foldFlag === "+" ? "open" : "closed",
                },
              ]
            : []),
        ],
        // Keep original block structure: paragraphs, lists, code blocks, etc.
        children: normalizedChildren,
      };

      parent.children[index] = calloutNode;
    });
  };
};
