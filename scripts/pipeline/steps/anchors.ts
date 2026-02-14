import type { Step, StepContext, StepResult, Artifact } from "../types";
import { extractBlockIds, assignBlockIdsToHeadings } from "../../../src/lib/content/block-ids";
import type { AnchorsIndex, BlockIdInfo } from "../../../src/lib/content/types";

export const anchorsStep: Step = {
  id: "anchors",
  name: "Anchors Index",
  description: "Builds index of block IDs and heading anchors for wiki-link resolution",
  dependsOn: ["manifest"],
  run: async (ctx: StepContext): Promise<StepResult> => {
    const artifacts: Artifact[] = [];
    const anchorsIndex: AnchorsIndex = {};

    for (const entry of ctx.rawEntries) {
      const blockIds = extractBlockIds(entry.rawContent);
      const headingMap = assignBlockIdsToHeadings(entry.rawContent, blockIds);

      const blockIdsRecord: Record<string, BlockIdInfo> = {};
      for (const [blockId, info] of blockIds) {
        blockIdsRecord[blockId] = {
          ...info,
          headingId: headingMap.get(blockId),
        };
      }

      anchorsIndex[entry.slug] = {
        blockIds: blockIdsRecord,
      };
    }

    const outputPath = await ctx.writeJson("anchors", "anchors.json", anchorsIndex, false);
    artifacts.push({ path: outputPath, isPublic: false });

    const publicPath = await ctx.writeJson("anchors", "anchors.json", anchorsIndex, true);
    artifacts.push({ path: publicPath, isPublic: true });

    const entries = Object.keys(anchorsIndex).length;
    const totalBlockIds = Object.values(anchorsIndex).reduce<number>(
      (sum, entry) => sum + Object.keys(entry.blockIds).length,
      0
    );

    return {
      success: true,
      artifacts,
      summary: {
        entries,
        blockIds: totalBlockIds,
      },
    };
  },
};
