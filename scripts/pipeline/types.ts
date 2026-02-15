import type { Entry, TagsIndex, BacklinksIndex, Graph, SearchDoc, Heading, WikiLink } from "../../src/lib/content/types";

export interface RawEntry {
  slug: string;
  route: string;
  sourcePath: string;
  title: string;
  date?: string;
  updated?: string;
  tags: string[];
  type: Entry["type"];
  summary?: string;
  status?: string;
  private?: boolean;
  headings: Heading[];
  wikiLinks: WikiLink[];
  mdRoutes: string[];
  searchText: string;
  wordCount: number;
  readingTimeMin: number;
  rawContent: string;
}

export interface StepContext {
  manifest: Entry[];
  rawEntries: RawEntry[];
  siteUrl: string;
  siteTitle: string;
  logger: Logger;
  hash: (content: string) => string;
  writeJson: (stepId: string, filename: string, data: unknown, isPublic?: boolean) => Promise<string>;
  writeText: (stepId: string, filename: string, content: string, isPublic?: boolean) => Promise<string>;
  readCache: (stepId: string) => Promise<StepCache | null>;
  writeCache: (stepId: string, cache: StepCache) => Promise<void>;
  getStepOutput: (stepId: string) => StepOutput | undefined;
}

export interface StepCache {
  inputHash: string;
  outputHash: string;
  timestamp: number;
  artifacts: string[];
}

export interface StepOutput {
  id: string;
  artifacts: Artifact[];
  duration: number;
  cached: boolean;
}

export interface Artifact {
  path: string;
  isPublic: boolean;
  size?: number;
  hash?: string;
}

export interface StepResult {
  success: boolean;
  artifacts: Artifact[];
  error?: string;
  summary?: Record<string, unknown>;
}

export interface Step {
  id: string;
  name: string;
  description: string;
  dependsOn: string[];
  inputSchema?: string;
  outputSchema?: string;
  run: (ctx: StepContext) => Promise<StepResult>;
}

export interface PipelineReport {
  timestamp: string;
  duration: number;
  siteUrl: string;
  siteTitle: string;
  steps: StepReport[];
  summary: {
    totalSteps: number;
    cachedSteps: number;
    failedSteps: number;
    totalArtifacts: number;
  };
}

export interface StepReport {
  id: string;
  name: string;
  duration: number;
  cached: boolean;
  success: boolean;
  error?: string;
  artifacts: Artifact[];
  summary?: Record<string, unknown>;
}

export interface Logger {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
  debug: (message: string) => void;
}
