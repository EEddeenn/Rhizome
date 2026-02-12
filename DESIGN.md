# Rhizome — Static MDX Notes System (Next.js App Router + Tailwind)

> **Project intent:** Rhizome is a static personal notes + articles system built with **Next.js App Router** and **MDX**, generating a fully static site for **Cloudflare Pages** deployment. Content lives in Git (GitHub), and a build-time generator produces all indices (tags, backlinks, search, graph) plus a deterministic MDX import map.

---

## 0) Requirements Recap

### Must-haves
- App Router (`app/`) + Tailwind CSS
- MDX content with frontmatter
- “Networked” navigation:
  - internal links & wiki-links
  - backlinks per page
  - tag index pages
  - optional graph view
- Static export (`output: "export"`) → `out/` directory deployable on Cloudflare Pages

### Optional
- client-side full text search
- reading status / source metadata
- mermaid, math, callouts, etc.

### Hard constraints
- **No runtime filesystem reads** in deployed site (static export).
- All routes and all MDX imports must be known at build time.

---

## 1) High-level Architecture (Build-time Indexing → Static Render)

### Data flow
1. **Content scan**: read all `content/**/*.mdx`.
2. **Parse**:
   - frontmatter (title, date, tags, type…)
   - headings (for TOC)
   - outbound links (internal route links + `[[wikilink]]`)
   - plain text (for search index)
3. **Resolve**:
   - build title→slug map
   - resolve wikilinks to slugs
   - build backlinks (reverse edges)
4. **Emit generated artifacts**:
   - JSON indices (`src/generated/*.json`)
   - MDX import map (`src/generated/mdx/import-map.ts`)
   - copy MDX sources to `src/generated/mdx/modules/**` for stable static imports
5. **Next.js build**:
   - `generateStaticParams()` uses generated manifest/tags to enumerate all pages
   - each page imports its MDX module via import map and renders it
6. **Static export**:
   - outputs `out/` for Cloudflare Pages

---

## 2) Repository Structure

```
.
├─ app/
│  ├─ (site)/
│  │  ├─ layout.tsx
│  │  ├─ page.tsx
│  │  ├─ notes/
│  │  │  ├─ page.tsx
│  │  │  └─ [...slug]/page.tsx
│  │  ├─ articles/
│  │  │  ├─ page.tsx
│  │  │  └─ [...slug]/page.tsx
│  │  ├─ tags/
│  │  │  ├─ page.tsx
│  │  │  └─ [tag]/page.tsx
│  │  ├─ search/page.tsx
│  │  └─ graph/page.tsx
│  └─ globals.css
│
├─ components/
│  ├─ mdx/
│  │  ├─ MDXComponents.tsx
│  │  ├─ CodeBlock.tsx
│  │  ├─ Callout.tsx
│  │  └─ Mermaid.tsx (optional; client)
│  ├─ layout/
│  │  ├─ Nav.tsx
│  │  ├─ Footer.tsx
│  │  └─ Breadcrumbs.tsx
│  └─ blocks/
│     ├─ EntryList.tsx
│     ├─ BacklinksPanel.tsx
│     └─ TagPills.tsx
│
├─ content/
│  ├─ notes/**.mdx
│  ├─ articles/**.mdx
│  └─ assets/** (images, attachments)
│
├─ src/
│  ├─ lib/
│  │  ├─ content/
│  │  │  ├─ types.ts
│  │  │  ├─ slug.ts
│  │  │  ├─ normalize.ts
│  │  │  ├─ link-resolver.ts
│  │  │  ├─ sort.ts
│  │  │  └─ reading-time.ts
│  │  ├─ generated/
│  │  │  ├─ load-manifest.ts
│  │  │  ├─ load-tags.ts
│  │  │  ├─ load-backlinks.ts
│  │  │  └─ load-search.ts
│  │  └─ ui/
│  │     └─ classnames.ts
│  └─ generated/
│     ├─ manifest.json
│     ├─ tags.json
│     ├─ backlinks.json
│     ├─ graph.json
│     ├─ search-index.json
│     └─ mdx/
│        ├─ import-map.ts
│        └─ modules/**.mdx
│
├─ scripts/
│  ├─ gen-content.ts
│  ├─ watch.ts (optional)
│  └─ utils.ts
│
├─ next.config.mjs
├─ tailwind.config.ts
├─ tsconfig.json
├─ package.json
└─ README.md
```

---

## 3) Content Format

### Frontmatter schema
Each `.mdx` should contain YAML frontmatter at top:

```mdx
---
title: "Backlinks & Knowledge Graph"
date: "2026-02-12"
type: "note"              # note | article | book | paper (extend)
tags: ["pkm", "notes"]
summary: "One-paragraph teaser for list pages."
status: "done"            # optional: to-read | reading | done
source: "https://..."     # optional
private: false            # optional: true excludes from build
---
```

### Slug and route rules
Slug derived from the path under `content/`:
- `content/notes/foo/bar.mdx` → slug: `notes/foo/bar` → route: `/notes/foo/bar`
- `content/articles/2026/paper.mdx` → slug: `articles/2026/paper` → route: `/articles/2026/paper`

### Link syntax rules
Support:
- Wiki: `[[Some Note]]` or `[[Some Note|Alias]]`
- Markdown: `[Alias](/notes/foo/bar)` or `[Alias](/articles/2026/paper)`

Resolution order:
1. absolute internal URLs (`/notes/...`, `/articles/...`) → route→slug
2. wiki links → normalized title→slug lookup
3. otherwise external/unresolved (excluded from backlinks graph)

---

## 4) Generated Data Contracts

### `manifest.json`
```ts
export type EntryType = "note" | "article" | "book" | "paper";

export type Heading = { depth: number; text: string; id: string };

export type Entry = {
  slug: string;              // "notes/foo/bar"
  route: string;             // "/notes/foo/bar"
  sourcePath: string;        // absolute or repo-relative path (for debugging)
  title: string;
  date?: string;             // "YYYY-MM-DD"
  updated?: string;
  tags: string[];
  type: EntryType;
  summary?: string;
  status?: string;
  private?: boolean;

  wordCount?: number;
  readingTimeMin?: number;
  headings?: Heading[];
  outboundLinks?: string[];  // list of slugs
};
```

### `tags.json`
```ts
export type TagsIndex = Record<string, string[]>; // tag -> slugs
```

### `backlinks.json`
```ts
export type BacklinksIndex = Record<string, string[]>; // slug -> slugs that link to it
```

### `graph.json` (optional)
```ts
export type Graph = {
  nodes: { id: string; title: string; type: string; tags: string[] }[];
  edges: { source: string; target: string }[];
};
```

### `search-index.json`
```ts
export type SearchDoc = {
  id: string;          // slug
  title: string;
  route: string;
  type: string;
  tags: string[];
  date?: string;
  text: string;        // extracted plain text
};
```

### `src/generated/mdx/import-map.ts`
```ts
export const mdxImportMap: Record<string, () => Promise<any>> = {
  "notes/foo/bar": () => import("./modules/notes/foo/bar.mdx"),
  "articles/2026/paper": () => import("./modules/articles/2026/paper.mdx"),
};
```

---

## 5) Build-time Generator Design

### 5.1 Dependencies (recommendation)
- `gray-matter` — frontmatter parsing
- `unified` + `remark-parse` + `remark-mdx` — parse MDX/Markdown AST
- `unist-util-visit` — traverse AST
- `github-slugger` — stable heading ids
- `minisearch` — build client-side search index (optional)
- `fast-glob` — file discovery
- `chokidar` — watch mode (optional)

### 5.2 Script responsibilities
Primary script: `scripts/gen-content.ts`
- Discover MDX files
- Parse metadata and content signals
- Resolve internal links
- Emit JSON indices
- Copy MDX modules into `src/generated/mdx/modules/**`
- Generate import map

Optional: `scripts/watch.ts`
- Watch `content/**`
- Rerun generator on change
- Touch a file in `src/generated/` to trigger Next refresh

### 5.3 Generator pseudo-code

```ts
main():
  paths = glob("content/**/*.mdx")
  rawEntries = []

  for path in paths:
    src = readFile(path)
    { data, content } = matter(src)

    if data.private === true:
      continue

    slug = slugFromPath(path)         // "notes/foo/bar"
    route = routeFromSlug(slug)       // "/notes/foo/bar"

    headings = extractHeadings(content)
    wikiLinks = extractWikiLinks(src) // regex OK
    mdLinks = extractMdLinks(src)     // AST parsing

    rawEntries.push({
      slug, route, sourcePath: path,
      title: data.title ?? deriveTitleFromSlug(slug),
      date: data.date, tags: normalizeTags(data.tags),
      type: data.type ?? inferTypeFromSlug(slug),
      summary: data.summary, status: data.status,
      private: data.private,
      headings,
      outboundLinkHints: { wikiLinks, mdLinks },
      searchText: extractPlainText(content),
      wordCount, readingTimeMin
    })

  titleToSlug = buildTitleIndex(rawEntries)

  for entry in rawEntries:
    outboundSlugs = resolveLinks(entry.outboundLinkHints, titleToSlug)
    entry.outboundLinks = dedupe(outboundSlugs)

  backlinks = invertEdges(rawEntries)
  tagsIndex = buildTagsIndex(rawEntries)
  graph = buildGraph(rawEntries)          // optional
  searchIndex = buildSearchIndex(rawEntries) // optional

  writeJSON("src/generated/manifest.json", stripNonSerializable(rawEntries))
  writeJSON("src/generated/backlinks.json", backlinks)
  writeJSON("src/generated/tags.json", tagsIndex)
  writeJSON("src/generated/graph.json", graph)
  writeJSON("src/generated/search-index.json", searchIndex)

  copyMDXModules(paths, "src/generated/mdx/modules", rewriteAssetPathsIfNeeded)
  writeImportMap(rawEntries, "src/generated/mdx/import-map.ts")
```

### 5.4 Link extraction details

#### 5.4.1 Wiki-links
Regex:
- `[[Title]]`
- `[[Title|Alias]]`

Extraction:
- capture inside `[[...]]`
- split by `|` → take left part as title
- normalize title: trim, collapse spaces, case-fold

#### 5.4.2 Markdown links
AST traversal:
- visit `link` nodes
- consider only links starting with `/notes/` or `/articles/` for internal edges

#### 5.4.3 Resolution functions
- `routeToSlug("/notes/foo/bar")` → `notes/foo/bar`
- `titleToSlug[normalizedTitle]` for wiki-links
- ignore external links

### 5.5 MDX import strategy (static export critical)
Because static export cannot import arbitrary dynamic paths at runtime, we:
1) copy content into `src/generated/mdx/modules/**` so that imports are within the project
2) generate `import-map.ts` with explicit import calls

This ensures:
- Next bundler sees all import targets
- every slug maps deterministically to an importable module
- no runtime FS access required

### 5.6 Asset handling (images/attachments)
Preferred approach for static export:
- Keep images under `public/` OR copy `content/assets/**` into `public/assets/**` in generator.
- Rewrite MDX image references:
  - `![x](../assets/img.png)` → `/assets/img.png`
- Optionally, allow raw external images without rewriting.

---

## 6) Next.js App Router Implementation

### 6.1 Core runtime helpers (no FS reads)
All pages must read JSON and import map via static imports:

- `src/lib/generated/load-manifest.ts`
  - `import manifest from "@/src/generated/manifest.json";`
- Similar loaders for tags/backlinks/search

### 6.2 Route pages

#### `app/(site)/notes/[...slug]/page.tsx`
Responsibilities:
- build slug: `notes/${params.slug.join("/")}`
- locate entry in manifest
- load MDX: `await mdxImportMap[slug]()` (component default export)
- render:
  - title, meta, tags, date
  - MDX content component
  - backlinks panel

Static generation:
- `export function generateStaticParams()` returns all slugs whose slug starts with `notes/` (split into array)

#### `app/(site)/articles/[...slug]/page.tsx`
Same structure but filters slugs starting with `articles/`.

#### `app/(site)/tags/[tag]/page.tsx`
- `generateStaticParams()` from `Object.keys(tagsIndex)`
- list entries for tag

#### `app/(site)/search/page.tsx` (Client)
- load `search-index.json`
- use MiniSearch in browser
- filter facets by tags/type

#### `app/(site)/graph/page.tsx` (Client, optional)
- load `graph.json`
- render force-directed / canvas graph
- click node to navigate

### 6.3 Layout & SEO
- `app/(site)/layout.tsx`: navbar, footer, global style
- `generateMetadata()` on entry pages for title/description
- optional `sitemap.xml` generator step (static)

---

## 7) MDX Rendering & Components

### 7.1 Next.js MDX configuration
Use `@next/mdx` with remark/rehype plugins (exact versions depend on Next version).
- Enable `.mdx` page imports
- Provide a components mapping

### 7.2 `components/mdx/MDXComponents.tsx`
Define mapping:
- `a`: add external link attributes (`rel="noreferrer noopener"`, `target="_blank"` for external)
- `pre/code`: `CodeBlock`
- `Callout`: custom component
- `Table`: custom responsive table wrapper

### 7.3 Code highlighting
Minimal: `shiki` at build-time, or client-only `prismjs`.
Since everything is static, prefer build-time highlight plugin (rehype).

---

## 8) Build & Dev Commands

### `package.json` scripts (proposed)
- `gen`: `tsx scripts/gen-content.ts`
- `dev`: `pnpm gen && next dev`
- `dev:watch`: `tsx scripts/watch.ts` (watches content then runs gen)
- `build`: `pnpm gen && next build`
- `lint`: `next lint`
- `typecheck`: `tsc -p tsconfig.json --noEmit`

---

## 9) Deployment to Cloudflare Pages

- Ensure `next.config.mjs` includes:
  - `output: "export"`
- Cloudflare Pages:
  - Build command: `pnpm install --frozen-lockfile && pnpm build`
  - Output dir: `out`

If content is in a separate repo:
- prefer git submodule
- OR clone in build step (requires access token / deploy key)

---

## 10) Testing & Validation

### Generator unit tests
- slug derivation
- title normalization
- wikilink parsing/resolution
- backlinks correctness
- tags index correctness
- “broken link report” output

### Build validation checks (must pass before writing outputs)
- Every manifest slug has an import-map entry
- Every internal route link resolves to a manifest slug
- No duplicate slugs
- No missing titles/tags type mismatch (warn, don’t fail)

---

## 11) Tasks Breakdown (Directly Actionable for a Coding Agent)

> This section is intended to be followed **top-to-bottom** and results in a working MVP.

### Phase 0 — Project bootstrap
1. Create Next.js project (App Router) with Tailwind.
2. Add TS path aliases (`@/*`) and basic lint/typecheck scripts.
3. Add dependencies:
   - gray-matter, fast-glob, unified stack, unist-util-visit, github-slugger
   - (optional) minisearch, chokidar
4. Create folder skeleton per repository layout.

**Acceptance**
- `pnpm dev` starts a blank app with Tailwind styling.

---

### Phase 1 — Define types & helpers
**Files**
- `src/lib/content/types.ts`
- `src/lib/content/slug.ts`
- `src/lib/content/normalize.ts`
- `src/lib/content/sort.ts`
- `src/lib/content/reading-time.ts` (optional)

**Implement**
- `slugFromPath(filePath: string): string`
- `routeFromSlug(slug: string): string`
- `normalizeTitle(title: string): string`
- `normalizeTags(tags: unknown): string[]`
- `estimateReadingTime(text: string): { wordCount: number; minutes: number }`

**Acceptance**
- Unit tests or a quick node run prints correct slug/route results.

---

### Phase 2 — Implement the generator: scan + parse frontmatter
**Files**
- `scripts/gen-content.ts`
- `scripts/utils.ts`

**Implement**
- `discoverContentFiles(): Promise<string[]>`
- `parseFrontmatter(src: string): { data: any; body: string }`
- `buildRawEntry(path, src): RawEntry`

RawEntry type should include:
- computed slug/route
- data fields from frontmatter
- placeholders for headings/links/searchText

**Acceptance**
- Running `pnpm gen` prints count of entries and writes a minimal `manifest.json`.

---

### Phase 3 — Extract headings, text, and outbound links
**Files**
- `src/lib/content/link-resolver.ts`
- `scripts/gen-content.ts`

**Implement: headings**
- Use `unified + remark-parse + remark-mdx` to parse.
- Visit `heading` nodes, extract plain text and produce ids using `github-slugger`.

Function signature:
- `extractHeadings(mdxSource: string): Heading[]`

**Implement: text extraction**
- Traverse AST and collect plain text (exclude code blocks optionally).
- `extractPlainText(mdxSource: string): string`

**Implement: link extraction**
- `extractWikiLinks(raw: string): WikiLink[]`
- `extractMarkdownInternalLinks(mdxSource: string): string[]` returning routes like `/notes/...`

**Acceptance**
- manifest includes `headings`, `wordCount`, and raw outbound link hints.

---

### Phase 4 — Resolve wikilinks & build backlinks/tags indices
**Files**
- `src/lib/content/link-resolver.ts`
- `scripts/gen-content.ts`

**Implement**
- `buildTitleIndex(entries: RawEntry[]): Map<string, string>` (normalizedTitle → slug)
- `resolveOutboundLinks(entry, titleIndex): string[]` (returns slugs)
- `buildBacklinks(entries: Entry[]): BacklinksIndex`
- `buildTagsIndex(entries: Entry[]): TagsIndex`

**Also implement reporting**
- `broken-links.json` (optional): list unresolved wiki-links by entry slug
- Print warnings but do not fail build (unless configured)

**Acceptance**
- backlinks and tags JSON files exist; backlinks panel data is non-empty for linked notes.

---

### Phase 5 — Copy MDX modules + generate import map
**Files**
- `scripts/gen-content.ts`

**Implement**
1) Copy each MDX file:
   - from: `content/...`
   - to: `src/generated/mdx/modules/<slug>.mdx`
2) Rewrite asset paths if needed:
   - ensure images resolve to `/assets/...` or `/public/...`

3) Generate `src/generated/mdx/import-map.ts`:
   - stable key = slug
   - value = `() => import("./modules/<slug>.mdx")`

**Acceptance**
- TypeScript can import `src/generated/mdx/import-map.ts`.
- `next build` succeeds with at least one MDX page.

---

### Phase 6 — Implement Next.js pages (Notes + Articles)
**Files**
- `src/lib/generated/load-manifest.ts`
- `src/lib/generated/load-tags.ts`
- `src/lib/generated/load-backlinks.ts`
- `app/(site)/notes/[...slug]/page.tsx`
- `app/(site)/articles/[...slug]/page.tsx`
- `components/blocks/BacklinksPanel.tsx`
- `components/blocks/TagPills.tsx`

**Implement**
- Load generated JSON via static import
- `generateStaticParams()`:
  - notes: filter `slug.startsWith("notes/")`
  - articles: filter `slug.startsWith("articles/")`
- Page rendering:
  - title/meta
  - MDX component: `const { default: Content } = await mdxImportMap[slug]();`
  - backlinks panel
  - tag pills

**Acceptance**
- `pnpm build` + `pnpm dev` renders MDX pages at their routes.

---

### Phase 7 — Index pages (notes/articles/tags)
**Files**
- `app/(site)/notes/page.tsx`
- `app/(site)/articles/page.tsx`
- `app/(site)/tags/page.tsx`
- `app/(site)/tags/[tag]/page.tsx`
- `components/blocks/EntryList.tsx`

**Implement**
- list pages:
  - sort by date desc when present, otherwise by title
- tag pages:
  - list entries in that tag

**Acceptance**
- `/tags` lists all tags; `/tags/<tag>` lists entries.

---

### Phase 8 — Client-side search (optional but recommended)
**Files**
- `scripts/gen-content.ts` (emit `search-index.json`)
- `app/(site)/search/page.tsx` (client)
- `src/lib/search/minisearch.ts`

**Implement**
- Build search docs from extracted plain text
- Browser search uses MiniSearch:
  - index title/text/tags
  - filter facets: type, tag

**Acceptance**
- Search works offline as static site (no API calls).

---

### Phase 9 — Graph view (optional)
**Files**
- `scripts/gen-content.ts` (emit `graph.json`)
- `app/(site)/graph/page.tsx` (client)

**Implement**
- graph nodes from manifest
- edges from outboundLinks
- use a small graph lib or custom force layout (client-side)
- click node -> route navigation

**Acceptance**
- graph renders and navigation works.

---

### Phase 10 — Cloudflare Pages readiness
**Files**
- `next.config.mjs`

**Implement**
- `output: "export"`
- Ensure no server-only features
- Confirm output folder `out/`

**Acceptance**
- `pnpm build` produces `out/` and can be deployed as static.

---

## 12) File-by-file Quick Spec (Agent-facing)

### `scripts/gen-content.ts`
- `async function main(): Promise<void>`
- `discoverContentFiles(root: string): Promise<string[]>`
- `buildEntries(paths: string[]): Promise<Entry[]>`
- `emitGenerated(entries: Entry[]): Promise<void>`
- `copyMdxModules(entries: Entry[]): Promise<void>`
- `writeImportMap(entries: Entry[]): Promise<void>`

### `src/lib/content/link-resolver.ts`
- `extractWikiLinks(raw: string): WikiLink[]`
- `extractMarkdownInternalRoutes(raw: string): string[]`
- `resolveRoutesToSlugs(routes: string[]): string[]`
- `resolveWikiLinksToSlugs(wiki: WikiLink[], titleIndex: Map<string,string>): { slugs: string[]; unresolved: WikiLink[] }`

### `app/(site)/notes/[...slug]/page.tsx`
- `export function generateStaticParams(): { slug: string[] }[]`
- `export default async function Page({ params }: { params: { slug: string[] } })`

---

## 13) Definition of Done (MVP)
- Content `.mdx` in `content/` builds into `out/` successfully.
- `/notes/...` and `/articles/...` routes render correct MDX content.
- Tags pages work.
- Backlinks show correct inbound references.
- Works as purely static export deployable on Cloudflare Pages.
