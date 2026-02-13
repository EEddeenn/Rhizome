import type { Step, StepContext, StepResult, Artifact } from "../types";
import type { BacklinksIndex } from "../../../src/lib/content/types";
import { writeLegacyJson } from "../context";

export const backlinksStep: Step = {
  id: "backlinks",
  name: "Backlinks Index",
  description: "Builds reverse link index for each entry",
  dependsOn: ["manifest"],
  run: async (ctx: StepContext): Promise<StepResult> => {
    const artifacts: Artifact[] = [];
    
    const backlinks: BacklinksIndex = {};
    
    for (const entry of ctx.manifest) {
      backlinks[entry.slug] = [];
    }
    
    for (const entry of ctx.manifest) {
      if (entry.outboundLinks) {
        for (const targetSlug of entry.outboundLinks) {
          if (backlinks[targetSlug] && !backlinks[targetSlug].includes(entry.slug)) {
            backlinks[targetSlug].push(entry.slug);
          }
        }
      }
    }
    
    const outputPath = await ctx.writeJson("backlinks", "backlinks.json", backlinks, false);
    artifacts.push({ path: outputPath, isPublic: false });
    
    const legacyPath = await writeLegacyJson("backlinks.json", backlinks);
    artifacts.push({ path: legacyPath, isPublic: false });
    
    return {
      success: true,
      artifacts,
      summary: {
        totalBacklinks: Object.values(backlinks).reduce((sum, arr) => sum + arr.length, 0),
        entriesWithBacklinks: Object.values(backlinks).filter(arr => arr.length > 0).length,
      },
    };
  },
};
