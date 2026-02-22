"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useNotes } from "../notes/NotesProvider";
import { useManifest } from "../manifest/ManifestProvider";
import type { EditorView } from "@codemirror/view";
import { loadCodeMirrorModules } from "../code/codemirror/loadCodemirror";
import { createEditorTheme } from "../code/codemirror/theme";
import { createWikiLinkCompleter, type ManifestEntryForCompletion } from "../code/codemirror/completions/wikiLinks";

export function CodeEditor() {
  const { currentContent, updateContent, currentNote, isLoadingNote } = useNotes();
  const { mergedEntries } = useManifest();
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [editorLoaded, setEditorLoaded] = useState(false);
  const isExternalUpdate = useRef(false);
  const lastPathRef = useRef<string | null>(null);
  const initAbortRef = useRef<AbortController | null>(null);
  const contentRef = useRef(currentContent);
  const mergedEntriesRef = useRef<ManifestEntryForCompletion[]>([]);

  useEffect(() => {
    contentRef.current = currentContent;
  }, [currentContent]);

  useEffect(() => {
    mergedEntriesRef.current = mergedEntries;
  }, [mergedEntries]);

  const initEditor = useCallback(async (signal: AbortSignal) => {
    if (!containerRef.current) return;

    const modules = await loadCodeMirrorModules();

    if (signal.aborted) return;

    if (viewRef.current) {
      viewRef.current.destroy();
      viewRef.current = null;
    }

    const {
      EditorView,
      EditorState,
      lineNumbers,
      highlightActiveLine,
      highlightActiveLineGutter,
      keymap,
      dropCursor,
      drawSelection,
      markdown,
      markdownLanguage,
      defaultHighlightStyle,
      syntaxHighlighting,
      bracketMatching,
      indentOnInput,
      languages,
      autocompletion,
      closeBrackets,
      closeBracketsKeymap,
      completionKeymap,
      defaultKeymap,
      history,
      historyKeymap,
    } = modules;

    const baseTheme = createEditorTheme(EditorView);

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        isExternalUpdate.current = true;
        updateContent(update.state.doc.toString());
      }
    });

    const wikiLinkCompleter = createWikiLinkCompleter(() => mergedEntriesRef.current);

    const state = EditorState.create({
      doc: contentRef.current,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        history(),
        dropCursor(),
        drawSelection(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        autocompletion({
          override: [wikiLinkCompleter],
          activateOnTyping: true,
          maxRenderedOptions: 20,
        }),
        markdown({
          base: markdownLanguage,
          codeLanguages: languages,
        }),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...historyKeymap,
          ...completionKeymap,
        ]),
        baseTheme,
        updateListener,
        EditorView.lineWrapping,
      ],
    });

    if (signal.aborted) return;

    viewRef.current = new EditorView({
      state,
      parent: containerRef.current,
    });

    setEditorLoaded(true);
  }, [updateContent]);

  useEffect(() => {
    if (!currentNote || currentNote.type === "pdf") {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
      setEditorLoaded(false);
      lastPathRef.current = null;
      return;
    }

    if (initAbortRef.current) {
      initAbortRef.current.abort();
    }

    setEditorLoaded(false);

    const controller = new AbortController();
    initAbortRef.current = controller;

    initEditor(controller.signal);

    return () => {
      controller.abort();
    };
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
      return;
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
