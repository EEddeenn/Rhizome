"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useNote } from "./contexts";
import type { EditorView } from "@codemirror/view";

export function CodeEditor() {
  const { currentContent, updateContent, currentNote, isLoadingNote } = useNote();
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [editorLoaded, setEditorLoaded] = useState(false);
  const isExternalUpdate = useRef(false);
  const lastPathRef = useRef<string | null>(null);
  const initAbortRef = useRef<AbortController | null>(null);
  const contentRef = useRef(currentContent);

  // Keep contentRef in sync to avoid stale closure in initEditor
  useEffect(() => {
    contentRef.current = currentContent;
  }, [currentContent]);

  const initEditor = useCallback(async (signal: AbortSignal) => {
    if (!containerRef.current) return;

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

    // Check if aborted during async loading
    if (signal.aborted) return;

    // Destroy existing view if present (handles race conditions)
    if (viewRef.current) {
      viewRef.current.destroy();
      viewRef.current = null;
    }

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

    // Use contentRef.current to get fresh content, avoiding stale closure
    const state = EditorState.create({
      doc: contentRef.current,
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

    // Final abort check before creating view
    if (signal.aborted) return;

    viewRef.current = new EditorView({
      state,
      parent: containerRef.current,
    });

    setEditorLoaded(true);
  }, [updateContent]);

  // Initialize editor when note changes
  useEffect(() => {
    if (!currentNote || currentNote.type === "pdf") {
      // Reset state when no note is selected or PDF is selected
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
      setEditorLoaded(false);
      lastPathRef.current = null;
      return;
    }

    // Abort any pending initialization
    if (initAbortRef.current) {
      initAbortRef.current.abort();
    }

    // Reset editorLoaded for note change (shows loading state during init)
    setEditorLoaded(false);

    const controller = new AbortController();
    initAbortRef.current = controller;

    initEditor(controller.signal);

    return () => {
      controller.abort();
    };
  }, [currentNote, initEditor]);

  // Sync content changes to editor
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
      return; // Early return for path changes - don't reset flag here
    }

    if (!isExternalUpdate.current) {
      const doc = view.state.doc.toString();
      if (currentContent !== doc) {
        view.dispatch({
          changes: { from: 0, to: doc.length, insert: currentContent },
        });
      }
    }

    isExternalUpdate.current = false;
  }, [currentContent, currentNote?.path]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (initAbortRef.current) {
        initAbortRef.current.abort();
      }
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, []);

  if (isLoadingNote) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin w-6 h-6 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full mx-auto mb-2" />
          <p className="text-muted text-sm">Loading note...</p>
        </div>
      </div>
    );
  }

  if (!currentNote) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted bg-background">
        <p>Select a note to edit</p>
      </div>
    );
  }

  if (currentNote.type === "pdf") {
    return (
      <div className="flex-1 flex items-center justify-center text-muted bg-background">
        <div className="text-center">
          <p className="text-sm">PDF files cannot be edited as text.</p>
          <p className="text-xs mt-1">View in the preview pane →</p>
        </div>
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
