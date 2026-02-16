"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useNote } from "./contexts/EditorNoteContext";
import { useManifest } from "./contexts/EditorManifestContext";
import type { EditorView } from "@codemirror/view";
import type { CompletionContext, CompletionResult } from "@codemirror/autocomplete";

interface ManifestEntryForCompletion {
  title: string;
  slug: string;
  type: string;
}

interface CodeMirrorModules {
  EditorView: typeof import("@codemirror/view").EditorView;
  EditorState: typeof import("@codemirror/state").EditorState;
  lineNumbers: typeof import("@codemirror/view").lineNumbers;
  highlightActiveLine: typeof import("@codemirror/view").highlightActiveLine;
  highlightActiveLineGutter: typeof import("@codemirror/view").highlightActiveLineGutter;
  keymap: typeof import("@codemirror/view").keymap;
  dropCursor: typeof import("@codemirror/view").dropCursor;
  drawSelection: typeof import("@codemirror/view").drawSelection;
  markdown: typeof import("@codemirror/lang-markdown").markdown;
  markdownLanguage: typeof import("@codemirror/lang-markdown").markdownLanguage;
  defaultHighlightStyle: typeof import("@codemirror/language").defaultHighlightStyle;
  syntaxHighlighting: typeof import("@codemirror/language").syntaxHighlighting;
  bracketMatching: typeof import("@codemirror/language").bracketMatching;
  indentOnInput: typeof import("@codemirror/language").indentOnInput;
  languages: typeof import("@codemirror/language-data").languages;
  autocompletion: typeof import("@codemirror/autocomplete").autocompletion;
  closeBrackets: typeof import("@codemirror/autocomplete").closeBrackets;
  closeBracketsKeymap: typeof import("@codemirror/autocomplete").closeBracketsKeymap;
  completionKeymap: typeof import("@codemirror/autocomplete").completionKeymap;
  defaultKeymap: typeof import("@codemirror/commands").defaultKeymap;
  history: typeof import("@codemirror/commands").history;
  historyKeymap: typeof import("@codemirror/commands").historyKeymap;
};

let cachedModules: CodeMirrorModules | null = null;
let modulesPromise: Promise<CodeMirrorModules> | null = null;

async function loadCodeMirrorModules(): Promise<CodeMirrorModules> {
  if (cachedModules) return cachedModules;
  if (modulesPromise) return modulesPromise;

  modulesPromise = Promise.all([
    import("@codemirror/view"),
    import("@codemirror/state"),
    import("@codemirror/lang-markdown"),
    import("@codemirror/language"),
    import("@codemirror/language-data"),
    import("@codemirror/autocomplete"),
    import("@codemirror/commands"),
  ]).then(([
    view,
    state,
    markdownMod,
    language,
    languageData,
    autocomplete,
    commands,
  ]) => {
    cachedModules = {
      EditorView: view.EditorView,
      EditorState: state.EditorState,
      lineNumbers: view.lineNumbers,
      highlightActiveLine: view.highlightActiveLine,
      highlightActiveLineGutter: view.highlightActiveLineGutter,
      keymap: view.keymap,
      dropCursor: view.dropCursor,
      drawSelection: view.drawSelection,
      markdown: markdownMod.markdown,
      markdownLanguage: markdownMod.markdownLanguage,
      defaultHighlightStyle: language.defaultHighlightStyle,
      syntaxHighlighting: language.syntaxHighlighting,
      bracketMatching: language.bracketMatching,
      indentOnInput: language.indentOnInput,
      languages: languageData.languages,
      autocompletion: autocomplete.autocompletion,
      closeBrackets: autocomplete.closeBrackets,
      closeBracketsKeymap: autocomplete.closeBracketsKeymap,
      completionKeymap: autocomplete.completionKeymap,
      defaultKeymap: commands.defaultKeymap,
      history: commands.history,
      historyKeymap: commands.historyKeymap,
    };
    return cachedModules;
  });

  return modulesPromise;
}

function createEditorTheme(EditorView: typeof import("@codemirror/view").EditorView) {
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

function createWikiLinkCompleter(
  getEntries: () => ManifestEntryForCompletion[]
): (context: CompletionContext) => CompletionResult | null {
  return (context: CompletionContext) => {
    const before = context.matchBefore(/\[\[[^\]|]*$/);
    if (!before || (context.explicit && !before)) return null;

    const query = before.text.slice(2).toLowerCase();
    const entries = getEntries()
      .filter((e) => e.type !== "pdf" && 
        (e.title.toLowerCase().includes(query) || e.slug.toLowerCase().includes(query)))
      .slice(0, 20);

    return {
      from: before.from + 2,
      options: entries.map((e) => ({
        label: e.title,
        displayLabel: e.title,
        detail: e.slug,
        apply: e.title,
      })),
      validFor: /^.*$/,
    };
  };
}

export function CodeEditor() {
  const { currentContent, updateContent, currentNote, isLoadingNote } = useNote();
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
