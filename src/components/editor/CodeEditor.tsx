"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor } from "./EditorContext";

export function CodeEditor() {
  const { currentContent, updateContent, currentNote } = useEditor();
  const containerRef = useRef<HTMLDivElement>(null);
  const [editorLoaded, setEditorLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !currentNote) return;

    let view: import("@codemirror/view").EditorView | null = null;

    const initEditor = async () => {
      const [
        { EditorView, lineNumbers, highlightActiveLine, highlightActiveLineGutter },
        { EditorState },
        { markdown, markdownLanguage },
        { defaultHighlightStyle, syntaxHighlighting },
      ] = await Promise.all([
        import("@codemirror/view"),
        import("@codemirror/state"),
        import("@codemirror/lang-markdown"),
        import("@codemirror/language"),
      ]);

      const baseTheme = EditorView.theme({
        "&": {
          height: "100%",
          fontSize: "14px",
        },
        ".cm-scroller": {
          overflow: "auto",
          fontFamily: "var(--font-mono), monospace",
        },
        ".cm-content": {
          padding: "8px 0",
        },
        ".cm-line": {
          padding: "0 12px",
        },
        ".cm-gutters": {
          backgroundColor: "transparent",
          border: "none",
          color: "var(--muted)",
        },
        ".cm-activeLineGutter": {
          backgroundColor: "transparent",
        },
        ".cm-activeLine": {
          backgroundColor: "rgba(0, 0, 0, 0.03)",
        },
        ".dark .cm-activeLine": {
          backgroundColor: "rgba(255, 255, 255, 0.03)",
        },
        ".cm-cursor": {
          borderLeftColor: "var(--foreground)",
        },
        ".cm-selectionBackground": {
          backgroundColor: "rgba(59, 130, 246, 0.2) !important",
        },
      });

      const updateListener = EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          updateContent(update.state.doc.toString());
        }
      });

      const state = EditorState.create({
        doc: currentContent,
        extensions: [
          lineNumbers(),
          highlightActiveLine(),
          highlightActiveLineGutter(),
          markdown({ base: markdownLanguage }),
          syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
          baseTheme,
          updateListener,
          EditorView.lineWrapping,
        ],
      });

      view = new EditorView({
        state,
        parent: containerRef.current!,
      });

      setEditorLoaded(true);
    };

    initEditor();

    return () => {
      if (view) {
        view.destroy();
      }
      setEditorLoaded(false);
    };
  }, [currentNote?.path]);

  if (!currentNote) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted border-r border-border bg-background">
        <p>Select a note to edit</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-0 overflow-auto bg-background border-r border-border"
      style={{ height: "calc(100vh - 120px)" }}
    >
      {!editorLoaded && (
        <div className="p-4 text-muted animate-pulse">Loading editor...</div>
      )}
    </div>
  );
}
