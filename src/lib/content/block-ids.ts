import type { BlockIdInfo, Heading } from "./types";
import { BLOCK_ID_PATTERN } from "./patterns";

export function extractBlockIds(content: string): Map<string, BlockIdInfo> {
  const blockIds = new Map<string, BlockIdInfo>();
  const lines = content.split("\n");
  let position = 0;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    let match: RegExpExecArray | null;
    BLOCK_ID_PATTERN.lastIndex = 0;

    while ((match = BLOCK_ID_PATTERN.exec(line)) !== null) {
      const blockId = match[1];
      const matchStartInLine = match.index;
      const globalPosition = position + matchStartInLine;

      if (!blockIds.has(blockId)) {
        blockIds.set(blockId, {
          position: globalPosition,
          line: lineIndex,
        });
      }
    }

    position += line.length + 1;
  }

  return blockIds;
}

interface HeadingWithPosition extends Heading {
  position: number;
  line: number;
}

function extractHeadingsWithPositions(content: string): HeadingWithPosition[] {
  const headings: HeadingWithPosition[] = [];
  const lines = content.split("\n");
  let position = 0;

  const headingPattern = /^(#{1,6})\s+(.+)$/;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const match = line.match(headingPattern);

    if (match) {
      const depth = match[1].length;
      const text = match[2].trim();
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      headings.push({
        depth,
        text,
        id,
        position,
        line: lineIndex,
      });
    }

    position += line.length + 1;
  }

  return headings;
}

export function assignBlockIdsToHeadings(
  content: string,
  blockIds: Map<string, BlockIdInfo>
): Map<string, string> {
  const blockIdToHeading = new Map<string, string>();
  const headings = extractHeadingsWithPositions(content);

  for (const [blockId, info] of blockIds) {
    let nearestHeading: HeadingWithPosition | undefined;

    for (const heading of headings) {
      if (heading.position < info.position) {
        nearestHeading = heading;
      } else {
        break;
      }
    }

    if (nearestHeading) {
      blockIdToHeading.set(blockId, nearestHeading.id);
    }
  }

  return blockIdToHeading;
}

export function extractContentWithBlockId(
  content: string,
  blockId: string,
  blockIds: Map<string, BlockIdInfo>
): string | null {
  const info = blockIds.get(blockId);
  if (!info) return null;

  const lines = content.split("\n");
  const startLine = info.line;

  let endLine = startLine + 1;
  while (endLine < lines.length) {
    const line = lines[endLine].trim();
    if (line === "" || line.startsWith("#") || line.startsWith("- ") || line.startsWith(">")) {
      break;
    }
    endLine++;
  }

  const contentLines = lines.slice(startLine, endLine);
  
  const strippedLines = contentLines.map(line => 
    line.replace(/\s\^([a-zA-Z0-9_-]+)\s*$/, "")
  );
  
  const extracted = strippedLines.join("\n").trim();

  return extracted || null;
}
