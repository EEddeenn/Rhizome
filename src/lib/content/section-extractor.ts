import type { Heading } from "./types";

interface HeadingWithPosition extends Heading {
  position: number;
  endPosition: number;
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
        endPosition: position + line.length,
      });
    }

    position += line.length + 1;
  }

  for (let i = 0; i < headings.length; i++) {
    const nextHeading = headings[i + 1];
    if (nextHeading) {
      headings[i].endPosition = nextHeading.position;
    } else {
      headings[i].endPosition = content.length;
    }
  }

  return headings;
}

function normalizeHeadingText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function extractSection(content: string, headingText: string): string | null {
  const headings = extractHeadingsWithPositions(content);
  const normalizedTarget = normalizeHeadingText(headingText);

  let targetHeading: HeadingWithPosition | undefined;
  for (const heading of headings) {
    if (normalizeHeadingText(heading.text) === normalizedTarget) {
      targetHeading = heading;
      break;
    }
  }

  if (!targetHeading) return null;

  let endPosition = content.length;

  for (const heading of headings) {
    if (
      heading.position > targetHeading.position &&
      heading.depth <= targetHeading.depth
    ) {
      endPosition = heading.position;
      break;
    }
  }

  const sectionContent = content.slice(targetHeading.position, endPosition).trim();

  return sectionContent || null;
}

export function extractSectionBySlug(
  content: string,
  headingSlug: string
): string | null {
  const headings = extractHeadingsWithPositions(content);

  let targetHeading: HeadingWithPosition | undefined;
  for (const heading of headings) {
    if (heading.id === headingSlug) {
      targetHeading = heading;
      break;
    }
  }

  if (!targetHeading) return null;

  let endPosition = content.length;

  for (const heading of headings) {
    if (
      heading.position > targetHeading.position &&
      heading.depth <= targetHeading.depth
    ) {
      endPosition = heading.position;
      break;
    }
  }

  const sectionContent = content.slice(targetHeading.position, endPosition).trim();

  return sectionContent || null;
}

export function findHeadingIdByText(headings: Heading[], targetText: string): string | undefined {
  const normalizedTarget = normalizeHeadingText(targetText);

  for (const heading of headings) {
    if (normalizeHeadingText(heading.text) === normalizedTarget) {
      return heading.id;
    }
  }

  return undefined;
}
