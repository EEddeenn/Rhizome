# Changelog

All notable changes to this project will be documented in this file.

## [0.17.0] - 2026-02-14

### Added

#### Auto-Scrolling for Anchors
- Clicking links with heading anchors (`[[Note#Section]]`) now scrolls to the target
- Clicking links with block ID anchors (`[[Note#^block-id]]`) now scrolls to the target
- Works for same-page anchor links (`#section`)
- Works in split-view panes with automatic scroll after content loads

#### Block ID HTML Rendering
- `src/lib/content/rehype-block-ids.ts` — New rehype plugin to add `id` attributes to paragraphs with block IDs
- Block IDs (`^id`) are now stripped from visible text and added as HTML `id` attributes
- Enables native anchor scrolling to block ID targets

### Changed

#### Link Handling
- `parseSlugFromHref()` — Now returns `anchor` field for hash fragments
- `InternalLink.tsx` — Handles anchor scrolling for same-pane and cross-pane links
- `LinkInterceptor.tsx` — Handles anchor scrolling for document-level link interception

#### Plugin Registration
- `mdx-config.ts` — Added `rehypeBlockIds` to rehype plugin chain
- `ClientMDXRenderer.tsx` — Added `rehypeBlockIds` for split-view rendering

### Tests
- Extended `link-utils.test.ts` with anchor parsing tests

---

## [0.16.0] - 2026-02-14

### Added

#### Obsidian-Compatible Embeds and Anchors
- `[[Note#Section]]` — Link to specific headings within notes
- `[[Note#^block-id]]` — Link to block IDs (paragraphs marked with `^id`)
- `![[Note]]` — Embed entire notes inline
- `![[Note#Section]]` — Embed specific sections (includes nested subheadings)
- `![[file.pdf]]` — Embed PDF files from `/assets/pdfs/`
- `![[file.pdf#page=N]]` — Embed PDFs at specific page

#### New Components
- `src/components/mdx/NoteEmbed.tsx` — RSC component for note transclusion with cycle detection
- `src/components/mdx/NoteEmbedClient.tsx` — Client-side embed component for split-view
- `src/components/mdx/EmbedError.tsx` — Styled error display for failed embeds

#### New Utilities
- `src/lib/content/block-ids.ts` — Block ID extraction and heading assignment
- `src/lib/content/section-extractor.ts` — Extract content sections by heading
- `src/lib/content/wiki-link-resolver.ts` — Extended with `createEmbedResolver()`
- `src/lib/content/remark-wiki-links.ts` — Complete rewrite with anchor/embed support
- `src/lib/generated/load-anchors.ts` — Loader for anchor index

#### Pipeline Step
- `scripts/pipeline/steps/anchors.ts` — Builds anchor index (block IDs + heading mappings)

#### Types
- `WikiLink` — Added `anchor`, `isBlockId`, `isEmbed` fields
- `AnchorsEntry`, `AnchorsIndex`, `BlockIdInfo` — New types for anchor data

#### Test Coverage
- `tests/block-ids.test.ts` — Block ID extraction and assignment tests
- `tests/section-extractor.test.ts` — Section extraction tests
- Extended `tests/link-resolver.test.ts` with anchor/embed tests

#### Content
- `content/notes/embeds-and-anchors.mdx` — Documentation for embed/anchor features

### Changed

#### Extended Wiki-Link Syntax
- `remark-wiki-links.ts` — New regex pattern supports embeds (`!`), anchors (`#`), block IDs (`^`)
- Links with anchors include `#section` or `#^blockid` in URL
- Embeds render as `NoteEmbed` or `PDFViewer` MDX components

#### Component Registration
- `mdx-config.ts` — Added `getMdxComponents()` returning `NoteEmbed`, `EmbedError`
- `EntryPage.tsx` — Includes embed components in MDX rendering
- `ClientMDXRenderer.tsx` — Includes `NoteEmbedClient` with `EmbedProvider` context

### Fixed

#### Embed Cycle Detection
- `NoteEmbed.tsx` — Uses React `cache()` API to detect and prevent circular embeds

#### PDF Embed Support
- `PDFViewerInner.tsx` — Already supports `initialPage` prop for page-specific embeds

---

## [0.15.0] - 2026-02-14

### Added

#### Shared Utilities
- `src/lib/cache/create-cached-fetcher.ts` — Generic promise-based caching fetcher with deduplication
- `src/lib/content/wiki-link-resolver.ts` — Factory function for wiki-link title → route resolution
- `src/lib/content/link-utils.ts` — `classifyLink()` for link type detection, `parseSlugFromHref()` for slug/param extraction

#### Test Coverage
- `tests/link-utils.test.ts` — 27 tests for link classification and parsing (unicode, special chars, edge cases)
- `tests/wiki-link-resolver.test.ts` — 20 tests for wiki-link resolution (case insensitivity, whitespace normalization, duplicates)
- `tests/cached-fetcher.test.ts` — 16 tests for caching behavior (deduplication, error recovery, type safety)

### Changed

#### Code Consolidation
- `ClientMDXRenderer.tsx` — Uses shared `createCachedFetcher`, `createWikiLinkResolver`, `normalizeTitle`; ~55 lines removed
- `SplitPane.tsx` — Uses shared `createCachedFetcher`; ~31 lines removed
- `InternalLink.tsx` — Uses shared `classifyLink`, `parseSlugFromHref`; ~8 lines removed
- `LinkInterceptor.tsx` — Uses shared `classifyLink`, `parseSlugFromHref`; ~8 lines removed
- `MDXComponents.tsx` — Uses shared `classifyLink`; ~1 line removed
- `load-manifest.ts` — Uses shared `createWikiLinkResolver`; ~12 lines removed

### Fixed

#### Cache Error Recovery
- `create-cached-fetcher.ts` — Failed fetches now clear cached promise, enabling retries instead of permanently caching errors

---

## [0.14.0] - 2026-02-14

### Added

#### Foldable Callouts
- `Callout.tsx` — Added `fold` prop for collapsible callouts (`open` or `closed` state)
- Supports `> [!note]+` (expanded) and `> [!note]-` (collapsed) Obsidian syntax
- Click-to-expand/collapse with visual arrow indicators

#### Split-View Callout Support
- `ClientMDXRenderer.tsx` — Added `remarkObsidianCallouts` plugin to split-view MDX pipeline
- Callouts now render correctly in both full-page and split-view modes

### Changed

#### Performance Optimizations
- `backlinks.ts` — O(1) title lookup using pre-built `Map` instead of O(n) `Array.find()`
- `remark-obsidian-callouts.ts` — Removed unnecessary `structuredClone`, modifies AST in place

### Fixed

#### Link Position Calculation
- `link-resolver.ts` — Global position now correctly computed from AST node positions instead of unreliable `indexOf` search
- Fixes incorrect heading association and snippet extraction for duplicate links

#### Graph Visualization
- `graph/page.tsx` — Fixed HiDPI canvas hover detection using correct scale calculation
- `graph/page.tsx` — Simulation no longer restarts on hover or dark mode toggle (uses refs for reactive state)
- `graph/page.tsx` — Nodes reinitialize correctly when graph data changes (removed stale `initializedRef` guard)

#### Type Safety
- `SplitPane.tsx` — Updated `backlinks` state type from `string[]` to `BacklinkInfo[]` to match enhanced backlinks format

### Tests

#### Improved Test Approach
- `obsidian-callouts.test.ts` — Rewrote tests to inspect AST directly instead of serializing to markdown
- Tests now properly validate MDX JSX element structure and attributes
- Added tests for fold markers (`+`/`-`)

### Documentation

#### New Content
- `content/notes/split-view-navigation.mdx` — New guide documenting split-view feature, pane controls, deep linking, and use cases

#### Updated Content
- `content/notes/callouts.mdx` — Added "Foldable Callouts" section and practical FAQ example with 5 collapsible Q&As
- `content/notes/knowledge-graph-basics.mdx` — Updated backlinks section with context snippets and heading grouping features
- `content/notes/welcome.mdx` — Added split-view navigation feature, search keyboard shortcuts, and link to new guide
- `content/notes/markdown-guide.mdx` — Added split-view tip to wiki-links callout

---

## [0.13.0] - 2026-02-14

### Added

#### Obsidian-Style Callouts
- `src/lib/content/remark-obsidian-callouts.ts` — New remark plugin for parsing Obsidian callout syntax
- Supports `> [!note]`, `> [!tip]`, `> [!warning]`, `> [!danger]`, `> [!info]` syntax
- Type aliases: `[!error]`, `[!bug]` → danger; `[!quote]`, `[!example]`, `[!question]` → note; `[!success]`, `[!check]` → tip
- Optional title after callout type: `> [!note] My Title`
- Works in plain Markdown/MDX without JSX

#### Enhanced Backlinks
- `BacklinksIndex` now stores `BacklinkInfo[]` with `slug`, `snippet`, and `heading` fields
- Context snippets (~100 chars) extracted around each backlink
- Nearest heading association for each backlink
- `BACKLINK_SNIPPET_LENGTH` environment variable for configurable snippet length (default: 100)
- `BacklinksPanel` shows context snippets and groups by heading
- `extractLinksWithContext()` function for extracting wiki-links with position and context

### Changed

#### Types
- `BacklinksIndex` changed from `Record<string, string[]>` to `Record<string, BacklinkInfo[]>`
- `getBacklinksForSlug()` now returns `BacklinkInfo[]` instead of `string[]`

#### Content Processing
- `mdx-config.ts` — Added `remarkObsidianCallouts` to remark plugins pipeline
- `link-resolver.ts` — New functions: `extractHeadingPositions()`, `findNearestHeading()`, `extractSnippet()`, `extractLinksWithContext()`

### Tests
- `tests/obsidian-callouts.test.ts` — Unit tests for Obsidian callout parsing (17 tests)
- `tests/backlinks-context.test.ts` — Unit tests for backlink context extraction (15 tests)

---

## [0.11.0] - 2026-02-14

### Added

#### Build-Time Validation
- Type validation for frontmatter `type` field - invalid types fallback to `note` instead of being silently accepted
- Duplicate title detection with build warnings showing conflicting slugs
- Dangling backlinks reporting - warns when entries link to non-existent slugs

### Changed

#### Performance Optimizations
- `scripts/pipeline/context.ts` — `hashObject()` now uses WeakMap caching to avoid recomputing hashes
- `src/lib/content/stop-words.ts` — Single-pass stop word removal instead of split/filter/join
- `src/lib/content/link-resolver.ts` — Iterative stack-based text extraction instead of recursion

#### Graph Visualization
- Graph now properly re-centers on canvas resize with proportional node position scaling
- Simulation resets frame counter on resize to allow re-convergence
- Initial node positions calculated from actual canvas dimensions

#### MDX Processing
- `src/lib/content/mdx-config.ts` — Removed singleton caching to ensure fresh resolver on each call
- `src/lib/content/remark-wiki-links.ts` — Regex now created inside plugin function to avoid global state issues

### Fixed

#### URL Handling
- Tag URLs now properly encoded with `encodeURIComponent()` - fixes broken links for tags with spaces or special characters
- Tag page decodes URL parameter and generates static params with encoding

#### Input Validation
- PDF viewer page input now validates `parseInt()` result to prevent NaN from breaking UI

#### Date Parsing
- `src/lib/content/sort.ts` — Invalid date strings now return 0 instead of NaN, preventing sort breakage

#### Link Extraction
- `extractWikiLinks()` now parses AST and skips wiki links inside code blocks - fixes false "broken links" warnings for documentation examples

---

## [0.10.0] - 2026-02-14

### Added

#### Search UX
- Keyboard navigation in search results: `↑`/`↓` to navigate, `Enter` to select, `Escape` to clear
- Visual highlighting of selected search result
- 150ms debounce on search input for smoother typing

#### Lazy Loading
- `src/components/mdx/MermaidLazy.tsx` — Dynamic import wrapper for Mermaid diagrams
- `src/components/mdx/PDFViewerLazy.tsx` — Dynamic import wrapper for PDF viewer
- Loading placeholders with animated pulse effect

### Changed

#### Build Performance
- `gen-content.ts` — Parallel file reads with `Promise.all()` instead of sequential loop
- `link-resolver.ts` — Cached unified parser instance, reused across all `extractContent()` calls

#### Runtime Performance
- Graph simulation early termination when converged (velocity threshold check)
- Mermaid and PDFViewer lazy-loaded, reducing initial bundle by ~2.5MB

### Performance Impact
- Build: ~40% faster file processing with parallel reads
- Initial bundle: ~2.5MB smaller (lazy-loaded heavy components)
- Graph: Stops simulation when stable instead of fixed 300 frames

---

## [0.9.0] - 2026-02-13

### Added

#### Search Optimizations
- `src/lib/content/stop-words.ts` — Comprehensive 175-word English stop word list
- `removeStopWords()` function for filtering common words from search text
- `SEARCH_TEXT_LIMIT` environment variable (default: 10000 chars) for configurable text truncation
- Search index now reports `reductionPercent` in pipeline summary

#### Parallel Pipeline Execution
- `groupStepsByLevel()` — Groups pipeline steps by dependency depth for parallel execution
- `runStep()` — Isolated step execution function for concurrent runs
- Pipeline now executes independent steps concurrently using `Promise.all()`

### Changed

#### Build Performance
- **MDX Plugin Deduplication**: Removed duplicate `remarkMath`/`rehypeKatex` from `next.config.mjs` (was running twice per page)
- **Single AST Parse**: Combined `extractHeadings()` and `extractPlainText()` into single `extractContent()` function
- **Parallel File Copies**: `copyAssets()` and vendor font copies now use `Promise.all()`
- **Set-Based Lookups**: `backlinks.ts` and `tags.ts` use `Set` for O(1) membership checks instead of `Array.includes()`
- **Minified JSON**: All generated JSON files now minified (~30% size reduction, faster writes)

#### Search Index
- Stop words filtered from search text (~31% word count reduction)
- Search text truncated to configurable limit
- Detailed stats: `originalWordCount`, `filteredWordCount`, `reductionPercent`, `truncatedCount`

#### Pipeline Output
```
Before: vendor → site-config → manifest → backlinks → ... (sequential)
After:  L0(vendor, site-config, manifest) → L1(backlinks, tags, ...) (parallel by level)
```

### Performance Impact
- Pipeline time: ~17ms → ~11ms (35% faster on small content)
- Search index: 2444 → 1688 words (31% reduction)
- JSON files: ~30% smaller due to minification

---

## [0.8.0] - 2026-02-13

### Added

#### Pluggable Build Pipeline
- `scripts/pipeline/types.ts` — Step, StepContext, StepResult, Artifact interfaces
- `scripts/pipeline/constants.ts` — CONTENT_DIR, PUBLIC_DIR, GENERATED_DIR, CACHE_DIR
- `scripts/pipeline/context.ts` — Helpers (hashing, file I/O, logging)
- `scripts/pipeline/runner.ts` — Pipeline orchestrator with topological sort
- `scripts/pipeline/steps/` — Individual step implementations
  - `vendor.ts` — Copy vendor assets from node_modules (KaTeX, PDF.js, fonts)
  - `site-config.ts` — Generate robots.txt and _headers with SITE_URL
  - `manifest.ts`, `backlinks.ts`, `tags.ts`, `graph.ts`, `search.ts`, `content.ts`, `sitemap.ts`
- Incremental build support with content hashing
- `.pipeline-cache/` directory for caching step outputs
- `public/generated/debug/pipeline-report.json` for debugging builds
- Unit tests for pipeline runner (`tests/pipeline.test.ts`)

#### Template System
- `templates/note.mdx` — Template for new notes
- `templates/article.mdx` — Template for new articles
- `scripts/new-content.ts` — Create new content from templates
- `npm run new -- <type> <title>` command

#### Fully Generated Public Folder
- `public/` is now fully generated and gitignored
- All static assets copied from node_modules or content during build:
  - `favicon.ico` from `content/assets/`
  - `katex.min.css` and fonts from `katex` package
  - `pdf.worker.min.js` from `pdfjs-dist`
- sitemap.xml, rss.xml, robots.txt, _headers copied to root for SEO

### Changed

#### Code Cleanup
- Removed unused functions: `slugToPathSegments()`, `pathSegmentsToSlug()`, `defineStep()`
- Made `sortByDateDesc()` and `sortByTitleAsc()` internal (unexported)
- Consolidated `normalizeTitle()` usage (replaced 4 inline duplications)
- Removed `postinstall` script from package.json (vendor step handles it)
- Removed legacy file writes from pipeline steps

#### Import Paths
- KaTeX CSS: `/generated/vendor/katex.min.css`
- PDF.js worker: `/generated/vendor/pdf.worker.min.js`
- Loaders use step-specific paths (e.g., `@/generated/manifest/manifest.json`)

#### Pipeline Order
```
vendor → site-config → manifest → backlinks → tags → graph → search → content → sitemap
```

### Removed
- `src/app/favicon.ico` — Moved to `content/assets/favicon.ico`
- `public/*.svg` — Removed obsolete Next.js default SVGs
- `public/katex.min.css`, `public/fonts/`, `public/pdf.worker.min.js` — Now in `/generated/vendor/`

---

## [0.7.0] - 2026-02-13

### Changed

#### Performance Optimizations
- `src/components/mdx/Mermaid.tsx` — Removed duplicate mermaid.initialize() call, single initialization per render
- `src/lib/content/link-resolver.ts` — Reuse module-level regex patterns with lastIndex reset instead of creating new RegExp each call
- `src/app/(site)/search/page.tsx` — Replaced useEffect for search results with useMemo, eliminates extra render cycle
- `src/lib/content/mdx-config.ts` — Added caching for MDX plugins to prevent recreating plugin arrays on every call
- `scripts/gen-content.ts` — Combined two asset path regexes into single pass (`\.\.?\/assets\/`)
- `src/components/mdx/PDFViewerInner.tsx` — Check if container width changed before setState to prevent unnecessary re-renders

---

## [0.6.0] - 2026-02-13

### Added

#### PDF Support
- `src/components/mdx/PDFViewer.tsx` — PDF embedding component with react-pdf
- `src/components/mdx/PDFViewerInner.tsx` — Core viewer implementation with full controls
- Page navigation with prev/next buttons and direct page input
- Zoom controls (50% to 300%)
- Fullscreen mode for focused reading
- Text selection and annotation layer support
- Deep linking via URL parameters (`?pdfPage=N` or `?pdfPage_id=N` for multiple PDFs)
- Responsive height: 60vh on mobile, 80vh on desktop
- Support for both local PDFs (`/assets/file.pdf`) and external URLs
- `public/pdf.worker.min.js` — PDF.js worker for client-side rendering

#### Content
- `content/notes/pdf-viewer.mdx` — Comprehensive PDF viewer documentation
- `content/assets/sample_indexed_v2.pdf` — Sample PDF for testing

---

## [0.5.0] - 2026-02-13

### Added

#### Shared Components
- `src/components/blocks/EntryPage.tsx` — Unified note/article page component
- `src/components/blocks/CategoryPage.tsx` — Unified notes/articles list page component
- `src/components/blocks/EntryListSection.tsx` — Reusable entry list section for homepage

#### Configuration
- `src/lib/content/mdx-config.ts` — Centralized MDX plugin configuration

### Changed

#### Performance Optimizations
- `getEntryBySlug()` now uses cached Map for O(1) lookups instead of O(n) `.find()`
- `getWikiLinkResolver()` pre-computes title index once and caches it
- `getNotes()` and `getArticles()` now cache filtered results
- Graph page force simulation uses nodeMap for O(1) edge lookups
- Mermaid component memoizes chart ID and optimizes initialization

#### Code Deduplication
- Consolidated duplicate note/article page logic into shared `EntryPage` component
- Consolidated notes/articles list pages into shared `CategoryPage` component
- Consolidated homepage sections into shared `EntryListSection` component
- Extracted MDX plugin configuration to shared `getMdxPlugins()` utility

#### Navigation
- `TagPills` now uses Next.js `<Link>` for client-side navigation instead of `<a>`

#### Assets
- KaTeX CSS and fonts now hosted locally instead of jsdelivr CDN
- Added `public/katex.min.css` and `public/fonts/` with all KaTeX font files

---

## [0.4.0] - 2026-02-13

### Added

#### MDX Components
- `src/components/mdx/Callout.tsx` — Callout blocks (note, tip, warning, danger, info)
- Callout component integrated into note and article pages

#### Syntax Highlighting
- `rehype-highlight` for code syntax highlighting
- Light and dark mode support with One Light / One Dark themes
- Support for 50+ languages

#### Navigation
- `src/components/blocks/TableOfContents.tsx` — Auto-generated TOC from headings
- `src/components/layout/Breadcrumbs.tsx` — Integrated into note/article pages
- `src/components/blocks/EntryMetadata.tsx` — Status, reading time, word count display

#### Developer Experience
- `scripts/watch.ts` — Content hot-reload during development
- `npm run watch` command
- `src/generated/broken-links.json` — Broken link report file

#### SEO
- Open Graph metadata for note and article pages
- Twitter card metadata

#### UI
- `src/app/(site)/not-found.tsx` — Custom 404 page

#### Content
- Restructured demo content with comprehensive guides:
  - `markdown-guide.mdx` — Markdown formatting reference
  - `callouts.mdx` — Callout component guide
  - `code-blocks.mdx` — Code highlighting guide
  - `mathematical-notation.mdx` — LaTeX/KaTeX reference
  - `diagrams.mdx` — Mermaid diagram guide
- Expanded `building-a-second-brain.mdx` article with CODE framework
- Enhanced `knowledge-graph-basics.mdx` with graph theory concepts

### Changed

#### Syntax Highlighting
- Updated `globals.css` with full light/dark mode syntax themes
- One Light theme for light mode, One Dark for dark mode

#### MDX Rendering
- Added `rehype-slug` to generate IDs for headings (enables TOC anchor links)

#### Generator
- Now outputs `broken-links.json` for programmatic broken link detection

---

## [0.3.0] - 2026-02-12

### Added

#### Responsive Design
- Mobile hamburger menu navigation (< 768px breakpoint)
- Responsive typography across all pages (`text-2xl sm:text-3xl`, etc.)
- Responsive spacing (`py-6 sm:py-8`, `gap-4 sm:gap-6`, etc.)
- Responsive canvas sizing on graph page
- Touch-friendly UI elements with appropriate hit areas
- Responsive prose sizing (`prose prose-sm sm:prose`)
- Mobile-optimized SearchBar with `fullWidth` prop

#### Dark Mode Enhancements
- Mermaid diagrams automatically switch theme on dark mode toggle
- Uses MutationObserver to detect theme changes on `<html>` element
- Re-renders diagrams with appropriate `dark` or `default` theme

### Changed

#### Navigation
- `src/components/layout/Nav.tsx` — Now responsive with mobile menu
- Mobile: Hamburger icon toggles dropdown with nav links
- Desktop: Full horizontal nav links visible

#### Components
- All pages updated with responsive padding and typography
- `EntryList` — Smaller spacing and text on mobile
- `BacklinksPanel` — Truncated text, hidden summary on small screens
- `SearchBar` — Responsive width (`w-32 sm:w-40 lg:w-48`)

#### Graph Page
- Canvas now resizes based on container width
- Smaller typography and spacing on mobile
- Touch-friendly node hit areas

---

## [0.2.0] - 2026-02-12

### Added

#### Client-side Search
- `src/app/(site)/search/page.tsx` — Full-text search page with MiniSearch
- `src/components/layout/SearchBar.tsx` — Search input in header
- `src/lib/generated/load-search.ts` — Search index loader
- `public/generated/search-index.json` — Client-accessible search data
- Fuzzy matching and prefix search
- Filter by type (note/article) and tags

#### Graph Visualization
- `src/app/(site)/graph/page.tsx` — Interactive knowledge graph
- Canvas-based force-directed layout simulation
- Node hover shows title, click navigates to page
- Color-coded by content type
- Graph link added to header navigation

#### Math & Diagrams
- Mermaid diagram support via `src/components/mdx/Mermaid.tsx`
- KaTeX math support with `remark-math` and `rehype-katex`
- KaTeX CSS loaded via CDN

#### SEO
- `sitemap.xml` generation with lastmod dates
- `rss.xml` feed with latest 20 entries
- `robots.txt` with sitemap reference
- `public/_headers` for Cloudflare Pages security headers
- Configurable via `SITE_URL` and `SITE_TITLE` environment variables

#### Testing
- `tests/slug.test.ts` — Slug utility tests (10 tests)
- `tests/normalize.test.ts` — Normalization tests (13 tests)
- `tests/link-resolver.test.ts` — Link extraction/resolution tests (19 tests)
- `npm run test` command using Node.js built-in test runner

### Changed

#### Navigation
- Added search bar to header
- Added "Graph" link to main navigation
- Improved header layout with search integration

#### Generator
- Now outputs `public/generated/search-index.json` and `public/generated/graph.json`
- Generates sitemap.xml and rss.xml to public/
- Added `SITE_URL` and `SITE_TITLE` config options

#### Dependencies
- Added: minisearch, mermaid, katex, remark-math, rehype-katex

---

## [0.1.0] - 2026-02-12

### Added

#### Project Bootstrap
- Initialized Next.js 14 with App Router and TypeScript
- Configured Tailwind CSS for styling
- Set up path aliases (`@/*` for src directory)

#### Content Types & Utilities
- `src/lib/content/types.ts` - Core types (Entry, Heading, TagsIndex, BacklinksIndex, Graph, etc.)
- `src/lib/content/slug.ts` - Slug derivation from file paths
- `src/lib/content/normalize.ts` - Title and tag normalization
- `src/lib/content/sort.ts` - Entry sorting by date/title
- `src/lib/content/reading-time.ts` - Word count and reading time estimation
- `src/lib/content/link-resolver.ts` - Wiki-link and markdown link extraction/resolution
- `src/lib/content/remark-wiki-links.ts` - Remark plugin for wiki-link conversion

#### Build-time Generator
- `scripts/gen-content.ts` - Content generator that:
  - Discovers all MDX files in `content/`
  - Parses frontmatter with gray-matter
  - Extracts headings, outbound links, and plain text
  - Resolves wiki-links to proper slugs
  - Builds backlinks, tags, and graph indices
  - Generates JSON files for static consumption

#### Generated Data
- `src/generated/manifest.json` - All entries with metadata
- `src/generated/backlinks.json` - Reverse link index
- `src/generated/tags.json` - Tag to entries mapping
- `src/generated/graph.json` - Node/edge data for graph visualization
- `src/generated/content.json` - Raw MDX content for rendering

#### Next.js Pages
- `src/app/(site)/page.tsx` - Homepage with recent notes/articles
- `src/app/(site)/notes/page.tsx` - Notes list
- `src/app/(site)/notes/[...slug]/page.tsx` - Individual note pages
- `src/app/(site)/articles/page.tsx` - Articles list
- `src/app/(site)/articles/[...slug]/page.tsx` - Individual article pages
- `src/app/(site)/tags/page.tsx` - All tags
- `src/app/(site)/tags/[tag]/page.tsx` - Tag-filtered entries

#### Components
- `src/components/layout/Nav.tsx` - Site navigation
- `src/components/layout/Footer.tsx` - Site footer
- `src/components/layout/Breadcrumbs.tsx` - Breadcrumb navigation
- `src/components/blocks/TagPills.tsx` - Tag display with links
- `src/components/blocks/BacklinksPanel.tsx` - Backlinks section
- `src/components/blocks/EntryList.tsx` - Entry listing component

#### MDX Rendering
- Configured `next-mdx-remote` for server-side MDX rendering
- Wiki-links (`[[Title]]`) converted to proper anchor tags
- GFM (GitHub Flavored Markdown) support

#### Deployment
- Configured static export (`output: "export"`)
- Images unoptimized for static hosting
- Output to `out/` directory for Cloudflare Pages

#### Sample Content
- `content/notes/welcome.mdx` - Getting started note
- `content/notes/knowledge-graph-basics.mdx` - PKM concepts
- `content/articles/building-a-second-brain.mdx` - Sample article

### Changed (2026-02-12)

#### Dark Mode
- Enabled `darkMode: "class"` in Tailwind config
- Added CSS variables for theme colors (`--background`, `--foreground`, `--muted`, `--border`)
- Created `ThemeToggle` component with sun/moon icons
- Added inline script to prevent flash of wrong theme on load
- Updated all components with `dark:` variants for dark mode styling
- Theme persists via localStorage
