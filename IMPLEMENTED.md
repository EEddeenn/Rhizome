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
- [x] `src/lib/content/slug.ts` — slugFromPath, routeFromSlug, pathSegmentsToSlug
- [x] `src/lib/content/normalize.ts` — normalizeTitle, normalizeTags, deriveTitleFromSlug
- [x] `src/lib/content/sort.ts` — sortByDateDesc, sortByTitleAsc, sortEntries
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

### Phase 5 — Store MDX Content
- [x] Store MDX content in `src/generated/content.json`
- [x] Asset path rewriting in content

### Phase 6 — Next.js Pages (Notes + Articles)
- [x] `src/lib/generated/load-manifest.ts`
- [x] `src/lib/generated/load-tags.ts`
- [x] `src/lib/generated/load-backlinks.ts`
- [x] `src/lib/generated/load-content.ts`
- [x] `src/app/(site)/notes/[...slug]/page.tsx` with generateStaticParams
- [x] `src/app/(site)/articles/[...slug]/page.tsx` with generateStaticParams
- [x] MDX rendering via next-mdx-remote
- [x] Wiki-link conversion to proper links
- [x] GFM support (remark-gfm)
- [x] generateMetadata for SEO

### Phase 7 — Index Pages
- [x] `src/app/(site)/notes/page.tsx` — Notes list
- [x] `src/app/(site)/articles/page.tsx` — Articles list
- [x] `src/app/(site)/tags/page.tsx` — All tags
- [x] `src/app/(site)/tags/[tag]/page.tsx` — Tag-filtered entries
- [x] `src/components/blocks/EntryList.tsx`

### Phase 8 — Layout & Navigation
- [x] `src/app/(site)/layout.tsx` — Site shell
- [x] `src/components/layout/Nav.tsx`
- [x] `src/components/layout/Footer.tsx`
- [x] `src/components/layout/Breadcrumbs.tsx` (created, not used yet)

### Phase 9 — MDX Components
- [x] `src/components/mdx/MDXComponents.tsx` (created for future use)
- [x] Wiki-link remark plugin (`remarkWikiLinks`)

### Phase 10 — Dark Mode (Extra)
- [x] Tailwind darkMode: "class"
- [x] CSS variables for theme colors
- [x] ThemeToggle component
- [x] Flash prevention script
- [x] localStorage persistence
- [x] All components styled for dark mode

### Phase 12 — Cloudflare Deployment
- [x] `output: "export"` in next.config.mjs
- [x] `images: { unoptimized: true }`
- [x] Static export to `out/` directory

### Documentation
- [x] README.md
- [x] CHANGELOG.md
- [x] Sample content files

---

## ❌ Not Implemented

### Optional Features from Design

#### Client-side Search (Phase 8 in design)
- [ ] `src/generated/search-index.json` generation
- [ ] `src/app/(site)/search/page.tsx`
- [ ] MiniSearch integration
- [ ] Search UI with tag/type facets

#### Graph View (Phase 9 in design)
- [ ] `src/app/(site)/graph/page.tsx`
- [ ] Force-directed graph visualization
- [ ] Click node → navigate

#### Additional MDX Features
- [ ] Mermaid diagram support
- [ ] Math/KaTeX support
- [ ] Callout/admonition blocks (component exists but not integrated)
- [ ] Code syntax highlighting (shiki or prism)

#### Watch Mode
- [ ] `scripts/watch.ts` for content hot-reload during development

#### Testing
- [ ] Generator unit tests
- [ ] Build validation checks
- [ ] Broken link report file output

#### Additional Metadata
- [ ] `status` field display (to-read, reading, done)
- [ ] `source` field display
- [ ] Reading time display on pages

#### SEO Enhancements
- [ ] sitemap.xml generation
- [ ] RSS feed

### Minor Gaps

- [ ] Breadcrumbs component not integrated into pages
- [ ] `broken-links.json` output file (currently console only)
- [ ] Table of Contents from headings (headings extracted but not displayed)
- [ ] 404 page customization
- [ ] Open Graph / Twitter card metadata

---

## Summary

| Category | Status |
|----------|--------|
| Core Features | ✅ Complete |
| Wiki-links & Backlinks | ✅ Complete |
| Tags | ✅ Complete |
| Static Export | ✅ Complete |
| Dark Mode | ✅ Complete |
| Search | ❌ Not implemented |
| Graph View | ❌ Not implemented |
| Testing | ❌ Not implemented |

**MVP Status**: ✅ Complete and deployable to Cloudflare Pages.
