# Changelog

All notable changes to this project will be documented in this file.

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
