import type { Step, StepContext, StepResult, Artifact } from "../types";
import type { BacklinksIndex, BacklinkInfo } from "../../../src/lib/content/types";
import {
  extractLinksWithContext,
  extractMarkdownInternalRoutes,
  routeToSlug,
} from "../../../src/lib/content/link-resolver";
import { normalizeTitle } from "../../../src/lib/content/normalize";

export const backlinksStep: Step = {
  id: "backlinks",
  name: "Backlinks Index",
  description: "Builds reverse link index with context snippets for each entry",
  dependsOn: ["manifest"],
  run: async (ctx: StepContext): Promise<StepResult> => {
    const artifacts: Artifact[] = [];
    
    const backlinksMap: Record<string, Map<string, BacklinkInfo>> = {};
    const manifestSlugs = new Set(ctx.manifest.map(e => e.slug));
    const danglingLinks = new Map<string, string[]>();
    
    const titleIndex = new Map<string, string>();
    for (const entry of ctx.manifest) {
      backlinksMap[entry.slug] = new Map();
      titleIndex.set(normalizeTitle(entry.title), entry.slug);
    }
    
    const rawEntryMap = new Map(ctx.rawEntries.map(e => [e.slug, e]));
    
    for (const entry of ctx.manifest) {
      const rawEntry = rawEntryMap.get(entry.slug);
      if (!rawEntry) continue;
      
      const linksWithContext = extractLinksWithContext(rawEntry.rawContent);
      
      for (const link of linksWithContext) {
        const normalizedTitle = normalizeTitle(link.title);
        const targetSlug = titleIndex.get(normalizedTitle);
        
        if (targetSlug && backlinksMap[targetSlug]) {
          const existing = backlinksMap[targetSlug].get(entry.slug);
          if (!existing || link.snippet.length > (existing.snippet?.length || 0)) {
            backlinksMap[targetSlug].set(entry.slug, {
              slug: entry.slug,
              snippet: link.snippet,
              heading: link.heading,
            });
          }
        }
      }
      
      const mdRoutes = extractMarkdownInternalRoutes(rawEntry.rawContent);
      for (const route of mdRoutes) {
        const targetSlug = routeToSlug(route);
        const targetSet = backlinksMap[targetSlug];
        
        if (targetSet) {
          const existing = targetSet.get(entry.slug);
          if (!existing) {
            targetSet.set(entry.slug, {
              slug: entry.slug,
              snippet: "",
              heading: undefined,
            });
          }
        } else if (!manifestSlugs.has(targetSlug)) {
          if (!danglingLinks.has(entry.slug)) {
            danglingLinks.set(entry.slug, []);
          }
          danglingLinks.get(entry.slug)!.push(targetSlug);
        }
      }
    }
    
    const backlinks: BacklinksIndex = {};
    for (const [slug, infoMap] of Object.entries(backlinksMap)) {
      backlinks[slug] = [...infoMap.values()];
    }
    
    const outputPath = await ctx.writeJson("backlinks", "backlinks.json", backlinks, false);
    artifacts.push({ path: outputPath, isPublic: false });
    
    const publicPath = await ctx.writeJson("backlinks", "backlinks.json", backlinks, true);
    artifacts.push({ path: publicPath, isPublic: true });
    
    if (danglingLinks.size > 0) {
      ctx.logger.warn(`Found ${danglingLinks.size} entries with dangling links:`);
      for (const [slug, targets] of danglingLinks) {
        ctx.logger.warn(`  - ${slug} -> ${targets.join(", ")}`);
      }
    }
    
    const totalBacklinks = Object.values(backlinks).reduce(
      (sum, arr) => sum + arr.length,
      0
    );
    const withSnippets = Object.values(backlinks).flat().filter(b => b.snippet).length;
    
    return {
      success: true,
      artifacts,
      summary: {
        totalBacklinks,
        entriesWithBacklinks: Object.values(backlinks).filter(arr => arr.length > 0).length,
        entriesWithDanglingLinks: danglingLinks.size,
        backlinksWithSnippets: withSnippets,
      },
    };
  },
};
