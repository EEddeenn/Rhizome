import type { Step, StepContext, StepResult, Artifact } from "../types";
import type { TagsIndex } from "../../../src/lib/content/types";

export const tagsStep: Step = {
  id: "tags",
  name: "Tags Index",
  description: "Builds tag-to-entries index",
  dependsOn: ["manifest"],
  run: async (ctx: StepContext): Promise<StepResult> => {
    const artifacts: Artifact[] = [];
    
    const tagsIndex: TagsIndex = {};
    
    for (const entry of ctx.manifest) {
      for (const tag of entry.tags) {
        if (!tagsIndex[tag]) tagsIndex[tag] = [];
        if (!tagsIndex[tag].includes(entry.slug)) tagsIndex[tag].push(entry.slug);
      }
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
