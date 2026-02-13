import type { Step, StepContext, StepResult, Artifact } from "../types";
import type { SearchDoc } from "../../../src/lib/content/types";
import { removeStopWords } from "../../../src/lib/content/stop-words";
import { SEARCH_TEXT_LIMIT } from "../constants";

export const searchStep: Step = {
  id: "search",
  name: "Search Index",
  description: "Builds full-text search index",
  dependsOn: ["manifest"],
  run: async (ctx: StepContext): Promise<StepResult> => {
    const artifacts: Artifact[] = [];
    
    let truncatedCount = 0;
    let totalOriginalWords = 0;
    let totalFilteredWords = 0;
    
    const searchIndex: SearchDoc[] = ctx.rawEntries.map((entry) => {
      const originalText = entry.searchText;
      totalOriginalWords += originalText.split(/\s+/).filter(w => w.length > 0).length;
      
      let processedText = originalText;
      if (processedText.length > SEARCH_TEXT_LIMIT) {
        processedText = processedText.slice(0, SEARCH_TEXT_LIMIT);
        truncatedCount++;
      }
      
      processedText = removeStopWords(processedText);
      totalFilteredWords += processedText.split(/\s+/).filter(w => w.length > 0).length;
      
      return {
        id: entry.slug,
        title: entry.title,
        route: entry.route,
        type: entry.type,
        tags: entry.tags,
        date: entry.date,
        text: processedText,
      };
    });
    
    const outputPath = await ctx.writeJson("search", "search-index.json", searchIndex, true);
    artifacts.push({ path: outputPath, isPublic: true });

    return {
      success: true,
      artifacts,
      summary: {
        documents: searchIndex.length,
        truncatedCount,
        originalWordCount: totalOriginalWords,
        filteredWordCount: totalFilteredWords,
        reductionPercent: Math.round((1 - totalFilteredWords / totalOriginalWords) * 100),
      },
    };
  },
};
