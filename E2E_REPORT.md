# E2E Testing Report - Rhizome

**Date:** 2026-02-17 (Updated)
**Project:** Rhizome - Static Personal Notes Management System

## Summary

Comprehensive E2E testing infrastructure using Playwright with **82 test cases** across **5 browser configurations**.

## Test Results

### Current Status: ALL PASS
- **Unit Tests:** 217 passed
- **E2E Tests:** 82 tests (6 skipped - require auth)
- **Browser Coverage:** Chromium (desktop + mobile), Firefox, WebKit, iPad Pro

## Test Coverage

| Category | Tests | Description |
|----------|-------|-------------|
| Smoke | 7 | Home page, navigation, 404 handling, editor nav |
| Notes | 7 | Note listing, rendering, breadcrumbs, TOC, backlinks, wiki-links |
| Articles | 8 | Article listing, rendering, metadata, breadcrumbs, tags |
| Search | 12 | Search input, results, filters, keyboard navigation, URL params |
| Graph | 8 | Canvas rendering, legend, entry list, hover, keyboard |
| Tags | 5 | Tag index, tag pages, tag navigation |
| Theme | 4 | Toggle button, theme switching, persistence |
| Split-view | 6 | Pane opening, toolbar, close, navigation, URL sync |
| PDF Viewer | 5 | Controls, page navigation, unique IDs |
| Editor | 11 | Connection panel, layout, theme (6 require auth) |
| MDX Components | 14 | Callouts, Mermaid, Math/KaTeX, Code highlighting |

## Test Files

```
e2e/
├── specs/
│   ├── smoke.spec.ts         — 7 tests
│   ├── notes.spec.ts         — 7 tests
│   ├── articles.spec.ts      — 8 tests (NEW)
│   ├── search.spec.ts        — 12 tests
│   ├── graph.spec.ts         — 8 tests
│   ├── tags.spec.ts          — 5 tests
│   ├── theme.spec.ts         — 4 tests
│   ├── split-view.spec.ts    — 6 tests
│   ├── pdf-viewer.spec.ts    — 5 tests
│   ├── editor.spec.ts        — 11 tests (NEW)
│   └── mdx-components.spec.ts — 14 tests (NEW)
├── utils/
│   ├── navigation.ts         — Shared navigation helpers
│   └── assertions.ts         — Custom assertion utilities
├── constants/
│   └── selectors.ts          — Centralized selectors
└── fixtures/
    └── test-fixtures.ts      — Custom Playwright fixtures
```

## Browser Coverage

| Project | Device | Viewport |
|---------|--------|----------|
| chromium-desktop | Desktop Chrome | 1280x720 |
| chromium-mobile | Pixel 5 | 393x851 |
| firefox-desktop | Desktop Firefox | 1280x720 |
| webkit-desktop | Desktop Safari | 1280x720 |
| tablet | iPad Pro | 1024x768 |

## Bugs Found and Fixed

### Bug 1: Mobile URL Construction (CRITICAL)

**File:** `src/components/context/SplitViewContext.tsx`

**Problem:** When navigating on mobile, URLs were incorrectly constructed with the anchor (`#`) before query parameters (`?`), creating invalid URLs like `/notes/welcome#anchor?param=value`.

**Fix:** Reordered to construct URLs correctly as `/slug?params#anchor`.

**Impact:** Any mobile user clicking wiki-links with both anchors and parameters would get broken navigation.

---

### Bug 2: Duplicate DOM IDs in PDF Viewer (ACCESSIBILITY)

**File:** `src/components/mdx/PDFViewer/PDFViewerInner.tsx`

**Problem:** Multiple PDF viewers on the same page created duplicate `id="pdf-page-input"` attributes, violating HTML spec and breaking accessibility.

**Fix:** Used React's `useId()` hook for unique IDs per viewer instance.

**Impact:**
- Accessibility: Screen readers could not properly associate labels with inputs
- HTML validation: Invalid markup
- Functionality: Clicking labels might focus wrong input

---

## Test Commands

```bash
# Run unit tests
npm run test

# Run E2E tests (all browsers)
npm run test:e2e

# Run E2E tests with specific browser
npx playwright test --project=chromium-desktop

# Run E2E tests with UI
npm run test:e2e:ui

# View E2E report
npm run test:e2e:report
```

## Test Quality Improvements

### Replaced Flaky Patterns
- `waitForTimeout(200)` → `expect(locator).toBeVisible({ timeout: 5000 })`
- Hard-coded delays → `toPass()` for async state changes

### Shared Utilities
- `openMobileMenuIfNeeded()` — Extracted from smoke.spec.ts and theme.spec.ts
- `navigateTo()` — Consistent page navigation with network idle
- `assertUniqueIds()` — Verify unique DOM IDs for accessibility
- `assertMinCount()` — Verify minimum element count

### Selector Centralization
All selectors defined in `e2e/constants/selectors.ts`:
- `NAV`, `SEARCH`, `THEME`, `GRAPH`, `PDF`, `SPLIT_VIEW`, `EDITOR`, `CALLOUT`, `CONTENT`

## Known Issues / Future Work

1. **Editor Auth Tests** — 6 editor tests skipped as they require GitHub PAT authentication. Consider mocking API for full coverage.

2. **LinkInterceptor Scope** — On pages like `/tags/guide`, clicking note links opens split-view instead of navigating. Expected desktop behavior but might confuse users on non-content pages.

3. **Graph Canvas Keyboard Navigation** — Canvas claims keyboard accessibility via aria-label but only mouse hover selects nodes.

4. **Visual Regression** — No screenshot comparison tests yet. Consider adding Playwright visual assertions.

5. **Accessibility Auditing** — Consider integrating axe-core for automated a11y testing.

## Conclusion

The E2E testing infrastructure provides comprehensive coverage of:
- All navigation paths (smoke tests)
- Content rendering (notes, articles, MDX components)
- Search functionality with keyboard navigation
- Graph visualization
- Tag system
- Theme persistence
- Split-view navigation
- PDF viewer controls
- Editor (unauthenticated flows)

**All critical bugs identified through testing have been fixed.**
