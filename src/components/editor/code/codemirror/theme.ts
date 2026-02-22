

export function createEditorTheme(EditorView: typeof import("@codemirror/view").EditorView) {
  return EditorView.theme({
    "&": { height: "100%", fontSize: "14px" },
    ".cm-scroller": { overflow: "auto", fontFamily: "var(--font-mono), monospace" },
    ".cm-content": { padding: "8px 0" },
    ".cm-line": { padding: "0 12px" },
    ".cm-gutters": { backgroundColor: "transparent", border: "none", color: "var(--muted)" },
    ".cm-activeLineGutter": { backgroundColor: "transparent" },
    ".cm-activeLine": { backgroundColor: "rgba(0, 0, 0, 0.03)" },
    ".dark .cm-activeLine": { backgroundColor: "rgba(255, 255, 255, 0.03)" },
    ".cm-cursor": { borderLeftColor: "var(--foreground)" },
    ".cm-selectionBackground": { backgroundColor: "rgba(59, 130, 246, 0.2) !important" },
    ".cm-tooltip-autocomplete": {
      backgroundColor: "var(--background, #fff)",
      border: "1px solid var(--border, #e5e7eb)",
      borderRadius: "6px",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      fontFamily: "var(--font-sans), sans-serif",
    },
    ".cm-tooltip-autocomplete ul": { fontFamily: "var(--font-sans), sans-serif" },
    ".cm-tooltip-autocomplete ul li": { padding: "4px 8px" },
    ".cm-tooltip-autocomplete ul li[aria-selected]": {
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      color: "inherit",
    },
    ".cm-completionIcon": { marginRight: "4px" },
  });
}
