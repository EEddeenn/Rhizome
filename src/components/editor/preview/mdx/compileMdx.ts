import { serialize } from "next-mdx-remote/serialize";
import { sharedRemarkPlugins, sharedRehypePlugins, rehypeSlug } from "@/lib/mdx/plugins";
import { remarkMermaid, remarkWikiLinks, remarkObsidianCallouts, rehypeBlockIds } from "@/lib/content/plugins";
import type { ResolvedLink, ResolvedEmbed } from "@/lib/content/types";
import { getOrCreateCompiled } from "@/lib/cache/mdx-compile-cache";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";

export interface MdxCompileResolvers {
  resolve: (title: string, anchor?: string) => ResolvedLink;
  resolveEmbed: (target: string, anchor?: string) => ResolvedEmbed | null;
}

export async function compileMdx(
  content: string,
  resolvers: MdxCompileResolvers
): Promise<MDXRemoteSerializeResult> {
  return getOrCreateCompiled(content, () =>
    serialize(content, {
      parseFrontmatter: false,
      mdxOptions: {
        remarkPlugins: [
          ...sharedRemarkPlugins,
          remarkMermaid,
          remarkObsidianCallouts,
          [remarkWikiLinks, { resolve: resolvers.resolve, resolveEmbed: resolvers.resolveEmbed }],
        ],
        rehypePlugins: [rehypeSlug, rehypeBlockIds, ...sharedRehypePlugins],
      },
    })
  );
}
