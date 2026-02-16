import { unified } from "unified";
import remarkParse from "remark-parse";

export type MdastNode = {
  type: string;
  depth?: number;
  children?: MdastNode[];
  value?: string;
  position?: {
    start?: { offset?: number };
  };
};

export const cachedParser = unified().use(remarkParse);
