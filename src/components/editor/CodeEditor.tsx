"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useEditor } from "./EditorContext";
import type { EditorView } from "@codemirror/view";

export function CodeEditor() {
  const { currentContent, updateContent, currentNote } = useEditor();
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [editorLoaded, setEditorLoaded] = useState(false);
  const isExternalUpdate = useRef(false);
  const lastPathRef = useRef<string | null>(null);

  const initEditor = useCallback(async () => {
    if (!containerRef.current || viewRef.current) return;

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
        isExternalUpdate.current = true;
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

    viewRef.current = new EditorView({
      state,
      parent: containerRef.current,
    });

    setEditorLoaded(true);
  }, [currentContent, updateContent]);

  useEffect(() => {
    if (currentNote) {
      initEditor();
    }
  }, [currentNote, initEditor]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentPath = currentNote?.path;
    const pathChanged = lastPathRef.current !== currentPath;

    if (pathChanged) {
      lastPathRef.current = currentPath ?? null;
      isExternalUpdate.current = false;
      
      const doc = view.state.doc.toString();
      if (currentContent !== doc) {
        view.dispatch({
          changes: { from: 0, to: doc.length, insert: currentContent },
        });
      }
    } else if (!isExternalUpdate.current) {
      const doc = view.state.doc.toString();
      if (currentContent !== doc) {
        view.dispatch({
          changes: { from: 0, to: doc.length, insert: currentContent },
        });
      }
    }
    
    isExternalUpdate.current = false;
  }, [currentContent, currentNote?.path]);

  useEffect(() => {
    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, []);

  if (!currentNote) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted bg-background">
        <p>Select a note to edit</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-0 overflow-auto bg-background"
    >
      {!editorLoaded && (
        <div className="p-4 text-muted animate-pulse">Loading editor...</div>
      )}
    </div>
  );
}
