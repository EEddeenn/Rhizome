import type { Step, StepContext, StepResult, Artifact } from "../types";
import type { BacklinksIndex } from "../../../src/lib/content/types";

export const backlinksStep: Step = {
  id: "backlinks",
  name: "Backlinks Index",
  description: "Builds reverse link index for each entry",
  dependsOn: ["manifest"],
  run: async (ctx: StepContext): Promise<StepResult> => {
    const artifacts: Artifact[] = [];
    
    const backlinksSets: Record<string, Set<string>> = {};
    const manifestSlugs = new Set(ctx.manifest.map(e => e.slug));
    const danglingLinks = new Map<string, string[]>();
    
    for (const entry of ctx.manifest) {
      backlinksSets[entry.slug] = new Set();
    }
    
    for (const entry of ctx.manifest) {
      if (entry.outboundLinks) {
        for (const targetSlug of entry.outboundLinks) {
          const targetSet = backlinksSets[targetSlug];
          if (targetSet) {
            targetSet.add(entry.slug);
          } else if (!manifestSlugs.has(targetSlug)) {
            if (!danglingLinks.has(entry.slug)) {
              danglingLinks.set(entry.slug, []);
            }
            danglingLinks.get(entry.slug)!.push(targetSlug);
          }
        }
      }
    }
    
    const backlinks: BacklinksIndex = {};
    for (const [slug, slugSet] of Object.entries(backlinksSets)) {
      backlinks[slug] = [...slugSet];
    }
    
    const outputPath = await ctx.writeJson("backlinks", "backlinks.json", backlinks, false);
    artifacts.push({ path: outputPath, isPublic: false });
    
    if (danglingLinks.size > 0) {
      ctx.logger.warn(`Found ${danglingLinks.size} entries with dangling links:`);
      for (const [slug, targets] of danglingLinks) {
        ctx.logger.warn(`  - ${slug} -> ${targets.join(", ")}`);
      }
    }
    
    return {
      success: true,
      artifacts,
      summary: {
        totalBacklinks: Object.values(backlinks).reduce((sum, arr) => sum + arr.length, 0),
        entriesWithBacklinks: Object.values(backlinks).filter(arr => arr.length > 0).length,
        entriesWithDanglingLinks: danglingLinks.size,
      },
    };
  },
};
