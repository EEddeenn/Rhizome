# Implementation Status

Based on `DESIGN.md`, tracking what has been implemented and what remains.

## ✅ Completed

### Phase 0 — Project Bootstrap
- [x] Next.js 14 with App Router
- [x] Tailwind CSS
- [x] TypeScript with path aliases (`@/*`)
- [x] All required dependencies
- [x] Folder skeleton per design

### Phase 1 — Types & Helpers
- [x] `src/lib/content/types.ts` — Entry, Heading, TagsIndex, BacklinksIndex, Graph, SearchDoc, WikiLink
- [x] `src/lib/content/slug.ts` — slugFromPath, routeFromSlug, getEntryTypeFromSlug
- [x] `src/lib/content/normalize.ts` — normalizeTitle, normalizeTags, deriveTitleFromSlug
- [x] `src/lib/content/sort.ts` — sortEntries (helpers are internal)
- [x] `src/lib/content/reading-time.ts` — estimateReadingTime

### Phase 2 — Generator (Scan + Parse)
- [x] `scripts/gen-content.ts` — Main generator
- [x] Discover MDX files via fast-glob
- [x] Parse frontmatter with gray-matter
- [x] Build raw entries with computed slug/route

### Phase 3 — Extract Headings, Text, Links
- [x] `src/lib/content/link-resolver.ts`
- [x] Extract headings with github-slugger IDs
- [x] Extract plain text for search
- [x] Extract wiki-links via regex
- [x] Extract markdown internal links via AST

### Phase 4 — Resolve Links & Build Indices
- [x] Build title → slug index
- [x] Resolve wiki-links to slugs
- [x] Build backlinks index (reverse edges)
- [x] Build tags index
- [x] Build graph.json (nodes + edges)
- [x] Broken link warnings (console output)
- [x] `broken-links.json` output file

### Phase 5 — Store MDX Content
- [x] Store MDX content in `src/generated/content.json`
- [x] Asset path rewriting in content

### Phase 6 — Next.js Pages (Notes + Articles)
- [x] `src/lib/generated/load-manifest.ts`
- [x] `src/lib/generated/load-tags.ts`
- [x] `src/lib/generated/load-backlinks.ts`
- [x] `src/lib/generated/load-content.ts`
- [x] `src/lib/generated/load-search.ts`
- [x] `src/app/(site)/notes/[...slug]/page.tsx` with generateStaticParams
- [x] `src/app/(site)/articles/[...slug]/page.tsx` with generateStaticParams
- [x] MDX rendering via next-mdx-remote
- [x] Wiki-link conversion to proper links
- [x] GFM support (remark-gfm)
- [x] generateMetadata for SEO
- [x] Open Graph / Twitter card metadata

### Phase 7 — Index Pages
- [x] `src/app/(site)/notes/page.tsx` — Notes list
- [x] `src/app/(site)/articles/page.tsx` — Articles list
- [x] `src/app/(site)/tags/page.tsx` — All tags
- [x] `src/app/(site)/tags/[tag]/page.tsx` — Tag-filtered entries
- [x] `src/components/blocks/EntryList.tsx`

### Phase 8 — Client-side Search
- [x] `src/generated/search-index.json` generation
- [x] `public/generated/search-index.json` for client access
- [x] `src/app/(site)/search/page.tsx`
- [x] MiniSearch integration with fuzzy matching
- [x] Search UI with tag/type facets
- [x] `src/components/layout/SearchBar.tsx` in header

### Phase 9 — Graph View
- [x] `public/generated/graph.json` for client access
- [x] `src/app/(site)/graph/page.tsx`
- [x] Canvas-based force-directed graph visualization
- [x] Hover for details, click to navigate
- [x] Graph link in header navigation
- [x] Responsive canvas sizing

### Phase 10 — Layout & Navigation
- [x] `src/app/(site)/layout.tsx` — Site shell
- [x] `src/components/layout/Nav.tsx` — Responsive with mobile hamburger menu
- [x] `src/components/layout/Footer.tsx`
- [x] `src/components/layout/Breadcrumbs.tsx` — Integrated into note/article pages
- [x] `src/components/layout/SearchBar.tsx` — Responsive width

### Phase 11 — MDX Components
- [x] `src/components/mdx/MDXComponents.tsx`
- [x] Wiki-link remark plugin (`remarkWikiLinks`)
- [x] `src/components/mdx/Mermaid.tsx` — Mermaid diagram support with dark mode
- [x] KaTeX math support via remark-math + rehype-katex
- [x] `src/components/mdx/Callout.tsx` — Callout/admonition blocks (note, tip, warning, danger, info)
- [x] Code syntax highlighting via rehype-highlight
- [x] `src/components/mdx/PDFViewer.tsx` — PDF embedding with react-pdf
- [x] `src/components/mdx/PDFViewerInner.tsx` — Core viewer implementation
- [x] Page navigation, zoom controls, fullscreen mode
- [x] Deep linking via URL parameters (`?pdfPage=N`, `?pdfPage_id=N`)
- [x] Responsive height (60vh mobile, 80vh desktop)
- [x] Text selection and annotation layer support

### Phase 12 — Dark Mode
- [x] Tailwind darkMode: "class"
- [x] CSS variables for theme colors
- [x] ThemeToggle component
- [x] Flash prevention script
- [x] localStorage persistence
- [x] All components styled for dark mode
- [x] Mermaid diagrams auto-switch theme on dark mode toggle

### Phase 13 — SEO
- [x] sitemap.xml generation
- [x] RSS feed generation (rss.xml)
- [x] robots.txt
- [x] Cloudflare Pages _headers file

### Phase 14 — Testing
- [x] Node.js built-in test runner
- [x] `tests/slug.test.ts` — Slug utility tests
- [x] `tests/normalize.test.ts` — Normalization tests
- [x] `tests/link-resolver.test.ts` — Link extraction/resolution tests
- [x] 42 tests passing

### Phase 15 — Cloudflare Deployment
- [x] `output: "export"` in next.config.mjs
- [x] `images: { unoptimized: true }`
- [x] Static export to `out/` directory
- [x] SITE_URL and SITE_TITLE environment variables

### Phase 16 — Responsive Design
- [x] Mobile hamburger menu navigation
- [x] Responsive typography (text-sm sm:text-base, etc.)
- [x] Responsive spacing (py-6 sm:py-8, etc.)
- [x] Responsive canvas on graph page
- [x] Touch-friendly UI elements
- [x] Responsive prose sizing

### Phase 17 — Additional Features
- [x] `src/components/blocks/TableOfContents.tsx` — TOC from headings
- [x] `src/components/blocks/EntryMetadata.tsx` — Status, reading time, word count display
- [x] `src/app/(site)/not-found.tsx` — Custom 404 page
- [x] `scripts/watch.ts` — Content hot-reload during development

### Phase 18 — Performance & Code Quality
- [x] `src/components/blocks/EntryPage.tsx` — Unified note/article page component
- [x] `src/components/blocks/CategoryPage.tsx` — Unified notes/articles list page component
- [x] `src/components/blocks/EntryListSection.tsx` — Reusable homepage section
- [x] `src/lib/content/mdx-config.ts` — Centralized MDX configuration
- [x] Cached `getEntryBySlug()` with Map for O(1) lookups
- [x] Cached `getWikiLinkResolver()` with pre-computed title index
- [x] Cached `getNotes()` and `getArticles()` filtered results
- [x] Graph page nodeMap for O(1) edge lookups
- [x] Mermaid component optimization with memoized ID
- [x] TagPills uses Next.js Link for client navigation
- [x] Local KaTeX hosting (no external CDN dependency)

### Phase 19 — Pluggable Build Pipeline
- [x] `scripts/pipeline/types.ts` — Step, StepContext, StepResult interfaces
- [x] `scripts/pipeline/constants.ts` — CONTENT_DIR, PUBLIC_DIR, GENERATED_DIR, CACHE_DIR
- [x] `scripts/pipeline/context.ts` — Helpers (hashing, file I/O, logging)
- [x] `scripts/pipeline/runner.ts` — Pipeline orchestrator with topological sort
- [x] Incremental build support with content hashing
- [x] `.pipeline-cache/` for caching step outputs
- [x] `public/generated/debug/pipeline-report.json` for debugging
- [x] Built-in steps: manifest, backlinks, tags, graph, search, content, sitemap
- [x] Unit tests for pipeline runner

### Phase 20 — Fully Generated Public Folder
- [x] `scripts/pipeline/steps/vendor.ts` — Copy vendor assets from node_modules
  - katex.min.css, KaTeX fonts, pdf.worker.min.js, favicon.ico
- [x] `scripts/pipeline/steps/site-config.ts` — Generate robots.txt, _headers with SITE_URL
- [x] `public/` folder gitignored, fully generated by `npm run gen`
- [x] sitemap.xml and rss.xml copied to root for SEO
- [x] robots.txt copied to root
- [x] favicon.ico copied from content/assets/
- [x] Updated import paths (katex, pdf.worker) to /generated/vendor/

### Phase 21 — Template System
- [x] `templates/note.mdx` — Template for new notes
- [x] `templates/article.mdx` — Template for new articles
- [x] `scripts/new-content.ts` — Create new content from templates
- [x] `npm run new -- <type> <title>` command

### Phase 22 — Code Cleanup
- [x] Removed unused functions: slugToPathSegments, pathSegmentsToSlug, defineStep
- [x] Unexported sortByDateDesc, sortByTitleAsc (internal helpers)
- [x] Consolidated normalizeTitle usage (replaced inline duplications)
- [x] Removed postinstall script (vendor step handles it)
- [x] Removed legacy file writes from pipeline steps
- [x] Updated load-* files to use step-specific paths

### Phase 23 — Performance Optimizations
- [x] Parallel file reads in `gen-content.ts` with `Promise.all()`
- [x] Cached unified parser in `link-resolver.ts`
- [x] Lazy-loaded Mermaid with `MermaidLazy` component
- [x] Lazy-loaded PDFViewer with `PDFViewerLazy` component
- [x] Search input debounce (150ms)
- [x] Search keyboard navigation (↑/↓/Enter/Escape)
- [x] Graph simulation early termination when converged

### Phase 24 — Split View with Search Params
- [x] `src/lib/context/PaneSearchParamsContext.tsx` — Per-pane search params context
- [x] Split pane data structure supports search params (`PaneData` type with `id`, `slug`, `searchParams`)
- [x] Unique pane IDs for proper React reconciliation via `getPaneKey()`
- [x] `openPane()` accepts optional search params with duplicate detection
- [x] `LinkInterceptor` extracts query params from clicked links
- [x] `InternalLink` and `SplitViewLink` pass search params
- [x] `SplitPane` wraps content in `PaneSearchParamsProvider`
- [x] `PDFViewer` uses `usePaneSearchParams()` for split view compatibility
- [x] PDF deep links in split view open new pane with correct page
- [x] Scroll to PDF works in both normal navigation and split panes
- [x] URL encoding preserves params: `?split=slug?pdfPage=5`
- [x] `routeToSlug()` strips query params to prevent false dangling link warnings
- [x] Table of contents dropdown in split pane header
- [x] Backlinks dropdown in split pane header (click to open linking note in pane)
- [x] Duplicate pane button (copies current pane including search params)
- [x] Added `rehype-slug` to `ClientMDXRenderer` for heading IDs
- [x] Backlinks JSON generated to public folder for client-side access

### Phase 25 — E2E Testing Infrastructure
- [x] Playwright setup with Chromium desktop and mobile configurations
- [x] `playwright.config.ts` — Test configuration with web server integration
- [x] `package.json` — Added `test:e2e`, `test:e2e:ui`, `test:e2e:report` scripts
- [x] `e2e/specs/smoke.spec.ts` — 6 smoke tests (home, navigation, 404)
- [x] `e2e/specs/notes.spec.ts` — 7 note page tests (listing, rendering, breadcrumbs, TOC, backlinks)
- [x] `e2e/specs/search.spec.ts` — 12 search tests (input, filters, keyboard nav, URL params)
- [x] `e2e/specs/graph.spec.ts` — 8 graph tests (canvas, legend, entries, hover, keyboard)
- [x] `e2e/specs/tags.spec.ts` — 5 tag tests (index, pages, navigation)
- [x] `e2e/specs/theme.spec.ts` — 4 theme tests (toggle, persistence)
- [x] `e2e/specs/split-view.spec.ts` — 6 split-view tests (panes, toolbar, URL sync)
- [x] `e2e/specs/pdf-viewer.spec.ts` — 5 PDF tests (controls, navigation, unique IDs)
- [x] Screenshot and video capture on test failures
- [x] `E2E_REPORT.md` — Comprehensive testing documentation

### Phase 26 — Bug Fixes from E2E Testing
- [x] Mobile URL construction fixed — params now before anchor in URLs
- [x] PDF Viewer duplicate IDs fixed — uses React `useId()` for unique IDs
- [x] All 53 E2E tests passing
- [x] All 203 unit tests passing

### Phase 27 — Static Web Editor
- [x] `src/app/editor/page.tsx` — Standalone editor route (no Nav/Footer)
- [x] `src/app/editor/layout.tsx` — Editor layout with theme initialization
- [x] `src/components/editor/Editor.tsx` — Main editor component with split view
- [x] `src/components/editor/EditorContext.tsx` — React context for editor state
- [x] `src/components/editor/ConnectionPanel.tsx` — GitHub PAT connection UI
- [x] `src/components/editor/NoteList.tsx` — Searchable note sidebar
- [x] `src/components/editor/CodeEditor.tsx` — CodeMirror 6 editor with MDX support
- [x] `src/components/editor/PreviewPane.tsx` — Live MDX preview with error boundary
- [x] `src/components/editor/EditorToolbar.tsx` — Save, new note, settings
- [x] `src/components/editor/ConflictModal.tsx` — SHA mismatch conflict resolution
- [x] `src/lib/editor/types.ts` — VaultAdapter interface, GitHubApiError
- [x] `src/lib/editor/github-adapter.ts` — GitHub REST API implementation
- [x] `src/lib/editor/auth-store.ts` — Token/config persistence (session/local storage)
- [x] Direct commits to default branch using GitHub REST v3 API
- [x] Optimistic concurrency with SHA-based conflict detection
- [x] Fine-grained PAT authentication
- [x] Live preview with MDX rendering (callouts, wiki-links, math)
- [x] Create new notes with default frontmatter
- [x] Unsaved changes warning on page leave
- [x] CodeMirror 6 with markdown syntax highlighting
- [x] `docs/editor.md` — Complete editor documentation
- [x] `tests/editor-types.test.ts` — Unit tests for GitHubApiError
- [x] Editor link added to main navigation

### Documentation
- [x] README.md — Updated with all features including E2E testing
- [x] CHANGELOG.md — Version 0.19.0
- [x] E2E_REPORT.md — E2E testing documentation
- [x] Comprehensive demo content:
  - `welcome.mdx` — Getting started guide
  - `markdown-guide.mdx` — Markdown formatting reference
  - `callouts.mdx` — Callout component examples
  - `code-blocks.mdx` — Syntax highlighting guide
  - `mathematical-notation.mdx` — LaTeX/KaTeX reference
  - `diagrams.mdx` — Mermaid diagram guide
  - `knowledge-graph-basics.mdx` — Graph theory concepts
  - `building-a-second-brain.mdx` — PARA/CODE methodology

---

## ❌ Not Implemented

### Optional Features from Design

None remaining - all features from IMPLEMENTED.md have been completed.

---

## Summary

| Category | Status |
|----------|--------|
| Core Features | ✅ Complete |
| Wiki-links & Backlinks | ✅ Complete |
| Tags | ✅ Complete |
| Static Export | ✅ Complete |
| Dark Mode | ✅ Complete |
| Search | ✅ Complete |
| Graph View | ✅ Complete |
| Mermaid/Math | ✅ Complete |
| SEO (sitemap/RSS) | ✅ Complete |
| Testing (Unit) | ✅ Complete (217 tests) |
| Testing (E2E) | ✅ Complete (53 tests) |
| Responsive Design | ✅ Complete |
| Callouts | ✅ Complete |
| Syntax Highlighting | ✅ Complete |
| Table of Contents | ✅ Complete |
| Metadata Display | ✅ Complete |
| Breadcrumbs | ✅ Complete |
| Watch Mode | ✅ Complete |
| OG/Twitter Cards | ✅ Complete |
| Custom 404 | ✅ Complete |
| PDF Viewer | ✅ Complete |
| Build Pipeline | ✅ Complete |
| Fully Generated Public | ✅ Complete |
| Template System | ✅ Complete |
| Code Cleanup | ✅ Complete |
| Split View | ✅ Complete |
| Web Editor | ✅ Complete |

**Status**: ✅ Feature-complete and deployable to Cloudflare Pages.
