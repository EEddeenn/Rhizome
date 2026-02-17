/**
 * Centralized selectors for e2e tests
 * Use these to avoid selector drift and make updates easier
 */

// Navigation
export const NAV = {
  toggleMenu: "button[aria-label='Toggle menu']",
  notesLink: "nav a[href='/notes']",
  articlesLink: "nav a[href='/articles']",
  tagsLink: "nav a[href='/tags']",
  graphLink: "nav a[href='/graph']",
  searchLink: "nav a[href='/search']",
  editorLink: "nav a[href='/editor']",
};

// Search
export const SEARCH = {
  input: "#search-query",
  typeFilter: "#type-filter",
  tagFilter: "#tag-filter",
  resultsList: "main ul li",
  noResults: "text=No results found",
};

// Theme
export const THEME = {
  toggle: "button[aria-label='Toggle theme'], button:has([aria-label])",
  toggleByName: "button[name], button:has-text('dark'), button:has-text('light')",
};

// Graph
export const GRAPH = {
  canvas: "canvas[role='img']",
  legend: ".capitalize",
  allEntriesHeading: "All Entries",
};

// PDF Viewer
export const PDF = {
  container: ".pdf-viewer",
  prevButton: "button[aria-label*='Previous'], button[aria-label*='Prev']",
  nextButton: "button[aria-label*='Next']",
  pageInput: "input[type='number']",
  fullscreenButton: "button[aria-label*='fullscreen'], button[aria-label*='Full']",
};

// Split View
export const SPLIT_VIEW = {
  pane: "div[data-pane-index]",
  closeButton: "button[aria-label='Close']",
  openFullPageButton: "button[aria-label='Open full page']",
};

// Editor
export const EDITOR = {
  container: "[data-testid='editor'], main",
  codeMirror: ".cm-editor",
  noteList: "[data-testid='note-list'], aside",
  previewPane: "[data-testid='preview-pane'], .preview",
  authPanel: "[data-testid='auth-panel'], .auth-panel",
};

// Callouts
export const CALLOUT = {
  note: "[data-callout='note'], .callout-note",
  tip: "[data-callout='tip'], .callout-tip",
  warning: "[data-callout='warning'], .callout-warning",
  danger: "[data-callout='danger'], .callout-danger",
  info: "[data-callout='info'], .callout-info",
  foldable: "[data-foldable], .callout-foldable",
};

// Content
export const CONTENT = {
  article: "article",
  breadcrumbs: "nav[aria-label='breadcrumb'], .breadcrumbs",
  backlinks: "h2:has-text('Backlinks')",
  toc: "nav:has-text('Table of Contents')",
  wikiLink: "article a[href^='/notes/'], article a[href^='/articles/']",
};
