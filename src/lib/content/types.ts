export type EntryType = "note" | "article" | "book" | "paper";

export type Heading = {
  depth: number;
  text: string;
  id: string;
};

export type Entry = {
  slug: string;
  route: string;
  sourcePath: string;
  title: string;
  date?: string;
  updated?: string;
  tags: string[];
  type: EntryType;
  summary?: string;
  status?: string;
  private?: boolean;
  wordCount?: number;
  readingTimeMin?: number;
  headings?: Heading[];
  outboundLinks?: string[];
};

export type TagsIndex = Record<string, string[]>;

export type BacklinkInfo = {
  slug: string;
  snippet: string;
  heading?: string;
};

export type BacklinksIndex = Record<string, BacklinkInfo[]>;

export type GraphNode = {
  id: string;
  title: string;
  type: string;
  tags: string[];
};

export type GraphEdge = {
  source: string;
  target: string;
};

export type Graph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type SearchDoc = {
  id: string;
  title: string;
  route: string;
  type: string;
  tags: string[];
  date?: string;
  text: string;
};

export type WikiLink = {
  raw: string;
  title: string;
  alias?: string;
  anchor?: string;
  isBlockId?: boolean;
  isEmbed?: boolean;
};

export type BlockIdInfo = {
  position: number;
  line: number;
  headingId?: string;
};

export type AnchorsEntry = {
  blockIds: Record<string, BlockIdInfo>;
};

export type AnchorsIndex = Record<string, AnchorsEntry>;

export type Manifest = Entry[];
