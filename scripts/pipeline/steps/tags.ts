import type { Step, StepContext, StepResult, Artifact } from "../types";
import type { TagsIndex } from "../../../src/lib/content/types";

export const tagsStep: Step = {
  id: "tags",
  name: "Tags Index",
  description: "Builds tag-to-entries index",
  dependsOn: ["manifest"],
  run: async (ctx: StepContext): Promise<StepResult> => {
    const artifacts: Artifact[] = [];
    
    const tagsSets: Record<string, Set<string>> = {};
    
    for (const entry of ctx.manifest) {
      for (const tag of entry.tags) {
        if (!tagsSets[tag]) tagsSets[tag] = new Set();
        tagsSets[tag].add(entry.slug);
      }
    }
    
    const tagsIndex: TagsIndex = {};
    for (const [tag, slugSet] of Object.entries(tagsSets)) {
      tagsIndex[tag] = [...slugSet];
    }
    
    const outputPath = await ctx.writeJson("tags", "tags.json", tagsIndex, false);
    artifacts.push({ path: outputPath, isPublic: false });
    
    return {
      success: true,
      artifacts,
      summary: {
        totalTags: Object.keys(tagsIndex).length,
        topTags: Object.entries(tagsIndex)
          .sort((a, b) => b[1].length - a[1].length)
          .slice(0, 5)
          .map(([tag, entries]) => `${tag}(${entries.length})`)
          .join(", "),
      },
    };
  },
};
