import type { Step, StepContext, StepResult, Artifact } from "../types";
import type { SearchDoc } from "../../../src/lib/content/types";

export const searchStep: Step = {
  id: "search",
  name: "Search Index",
  description: "Builds full-text search index",
  dependsOn: ["manifest"],
  run: async (ctx: StepContext): Promise<StepResult> => {
    const artifacts: Artifact[] = [];
    
    const searchIndex: SearchDoc[] = ctx.rawEntries.map((entry) => ({
      id: entry.slug,
      title: entry.title,
      route: entry.route,
      type: entry.type,
      tags: entry.tags,
      date: entry.date,
      text: entry.searchText,
    }));
    
    const outputPath = await ctx.writeJson("search", "search-index.json", searchIndex, true);
    artifacts.push({ path: outputPath, isPublic: true });

    return {
      success: true,
      artifacts,
      summary: {
        documents: searchIndex.length,
        totalWords: ctx.rawEntries.reduce((sum, e) => sum + e.wordCount, 0),
      },
    };
  },
};
