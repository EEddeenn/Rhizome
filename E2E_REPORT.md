# E2E Testing Report - Rhizome

**Date:** 2026-02-15
**Project:** Rhizome - Static Personal Notes Management System

## Summary

Successfully set up comprehensive E2E testing infrastructure using Playwright and identified/fixed **2 real bugs** through browser-based testing.

## Test Results

### Final Status: ALL PASS
- **Unit Tests:** 203 passed
- **E2E Tests:** 53 passed (desktop Chromium)
- **Build:** Success (46 pages generated)

### Test Coverage

| Category | Tests | Description |
|----------|-------|-------------|
| Smoke | 6 | Home page, navigation, 404 handling |
| Notes | 7 | Note listing, rendering, breadcrumbs, TOC, backlinks, wiki-links |
| Search | 12 | Search input, results, filters, keyboard navigation, URL params |
| Graph | 8 | Canvas rendering, legend, entry list, hover, keyboard |
| Tags | 5 | Tag index, tag pages, tag navigation |
| Theme | 4 | Toggle button, theme switching, persistence |
| Split-view | 6 | Pane opening, toolbar, close, navigation, URL sync |
| PDF Viewer | 5 | Controls, page navigation, unique IDs |

---

## Bugs Found and Fixed

### Bug 1: Mobile URL Construction (CRITICAL)

**File:** `src/components/context/SplitViewContext.tsx`
**Lines:** 126-134

**Problem:** When navigating on mobile, URLs were incorrectly constructed with the anchor (`#`) before query parameters (`?`), creating invalid URLs like:
```
/notes/welcome#anchor?param=value
```

**Root Cause:** The code added anchor before checking for query params:
```typescript
if (anchor) {
  url += `#${anchor}`;  // WRONG: anchor added first
}
if (params.toString()) {
  url += `?${params.toString()}`;  // Query added after
}
```

**Fix:** Reordered to construct URLs correctly as `/slug?params#anchor`:
```typescript
if (params.toString()) {
  url += `?${params.toString()}`;  // Query params first
}
if (anchor) {
  url += `#${anchor}`;  // Anchor last
}
```

**Impact:** Any mobile user clicking wiki-links with both anchors and parameters would get broken navigation.

---

### Bug 2: Duplicate DOM IDs in PDF Viewer (ACCESSIBILITY)

**File:** `src/components/mdx/PDFViewer/PDFViewerInner.tsx`
**Lines:** 176-180

**Problem:** Multiple PDF viewers on the same page (e.g., `/notes/pdf-viewer`) created duplicate `id="pdf-page-input"` attributes, violating HTML spec and breaking accessibility.

**Root Cause:** Hardcoded ID:
```typescript
<label htmlFor="pdf-page-input">
<input id="pdf-page-input" />
```

**Fix:** Used React's `useId()` hook for unique IDs:
```typescript
const pageInputId = useId();
<label htmlFor={pageInputId}>
<input id={pageInputId} />
```

**Impact:**
- Accessibility: Screen readers could not properly associate labels with inputs
- HTML validation: Invalid markup
- Functionality: Clicking labels might focus wrong input

---

## Files Changed

| File | Change Type | Description |
|------|-------------|-------------|
| `package.json` | Modified | Added Playwright dependencies and E2E test scripts |
| `playwright.config.ts` | Created | Playwright configuration for desktop/mobile testing |
| `src/components/context/SplitViewContext.tsx` | Fixed | Mobile URL construction bug |
| `src/components/mdx/PDFViewer/PDFViewerInner.tsx` | Fixed | Duplicate ID bug using useId() |
| `e2e/specs/*.spec.ts` | Created | 8 test files with 53 test cases |

---

## Test Evidence

### Before Fixes
- **24 test failures** on initial run
- PDF page input count: 2 (should be unique per viewer)
- Mobile navigation: URLs malformed

### After Fixes
- **All 53 E2E tests pass**
- All 203 unit tests pass
- Production build succeeds

### Test Commands
```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# View E2E report
npm run test:e2e:report
```

---

## Known Issues / Future Work

### Non-Critical Issues Identified (Not Fixed)

1. **LinkInterceptor Scope**
   - On pages like `/tags/guide`, clicking note links opens split-view instead of navigating
   - This is expected desktop behavior but might confuse users on non-content pages
   - **Recommendation:** Consider limiting split-view to article/note content areas only

2. **Graph Canvas Keyboard Navigation**
   - Canvas claims keyboard accessibility via aria-label but only mouse hover selects nodes
   - **Recommendation:** Implement full keyboard navigation or update aria-label

3. **Tag Encoding**
   - Tag URLs are not encoded (e.g., `/tags/my tag` instead of `/tags/my%20tag`)
   - Works with current content but will break if tags contain special characters
   - **Recommendation:** Use `encodeURIComponent()` in tag hrefs

---

## Conclusion

The E2E testing infrastructure is now fully operational with comprehensive coverage of:
- Navigation (smoke tests)
- Content rendering (notes, articles)
- Search functionality
- Graph visualization
- Tag system
- Theme persistence
- Split-view navigation
- PDF viewer controls

**All critical bugs identified through testing have been fixed.**
