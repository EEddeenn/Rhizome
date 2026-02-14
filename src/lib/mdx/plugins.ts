import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";

export const sharedRemarkPlugins = [
  remarkGfm,
  remarkMath,
] as const;

export const sharedRehypePlugins = [
  rehypeKatex,
  rehypeHighlight,
] as const;

export { rehypeSlug };
