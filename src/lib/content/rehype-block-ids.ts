import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Root, Element } from "hast";

const BLOCK_ID_PATTERN = /\s\^([a-zA-Z0-9_-]+)\s*$/;

export const rehypeBlockIds: Plugin<[], Root> = () => {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName === "p" && node.children) {
        for (const child of node.children) {
          if (child.type === "text" && typeof child.value === "string") {
            const match = child.value.match(BLOCK_ID_PATTERN);
            if (match) {
              child.value = child.value.replace(BLOCK_ID_PATTERN, "");
              if (!node.properties) {
                node.properties = {};
              }
              node.properties.id = `^${match[1]}`;
              break;
            }
          }
        }
      }
    });
  };
};
