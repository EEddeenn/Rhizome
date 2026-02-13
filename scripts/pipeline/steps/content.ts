import type { Step, StepContext, StepResult, Artifact } from "../types";
import fs from "fs/promises";
import path from "path";

const GENERATED_DIR = "src/generated";

export const contentStep: Step = {
  id: "content",
  name: "Content Index",
  description: "Builds raw content index for MDX rendering",
  dependsOn: ["manifest"],
  run: async (ctx: StepContext): Promise<StepResult> => {
    const artifacts: Artifact[] = [];
    
    const contentIndex: Record<string, string> = {};
    for (const entry of ctx.rawEntries) {
      contentIndex[entry.slug] = entry.rawContent;
    }
    
    const outputPath = await ctx.writeJson("content", "content.json", contentIndex, false);
    artifacts.push({ path: outputPath, isPublic: false });
    
    await fs.mkdir(GENERATED_DIR, { recursive: true });
    await fs.writeFile(path.join(GENERATED_DIR, "content.json"), JSON.stringify(contentIndex, null, 2));
    artifacts.push({ path: path.join(GENERATED_DIR, "content.json"), isPublic: false });

    return {
      success: true,
      artifacts,
      summary: {
        entries: Object.keys(contentIndex).length,
      },
    };
  },
};
